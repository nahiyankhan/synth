/**
 * Model Router
 * 
 * Routes tool calls to the appropriate AI model using AI SDK v6:
 * - executeCommand → Claude Opus 4.5 (superior file system reasoning)
 * - Everything else → Gemini Flash (fast, cheap, good enough)
 * 
 * Benefits of AI SDK v6:
 * - Unified interface across providers
 * - Automatic retry and error handling
 * - Built-in token tracking
 * - Better streaming support
 * 
 * Based on Vercel's dual-model strategy for optimal cost/performance
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { ClaudeClient } from './claudeClient';
import { VirtualFileSystem } from './virtualFileSystem';
import { StyleGraph } from '@/core/StyleGraph';

export interface ModelRouterConfig {
  geminiApiKey: string;
  claudeApiKey?: string;
  preferClaude?: boolean; // If true, use Claude for exploration when available
}

export interface RouteResult {
  model: 'gemini' | 'claude';
  response: any;
  reasoning?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class ModelRouter {
  private geminiModel: ReturnType<typeof google>;
  private claude: ClaudeClient | null = null;
  private vfs: VirtualFileSystem | null = null;

  constructor(
    private config: ModelRouterConfig,
    private graph: StyleGraph
  ) {
    // Initialize Gemini model using AI SDK (Gemini 3 Pro for advanced reasoning)
    const googleProvider = createGoogleGenerativeAI({ apiKey: config.geminiApiKey });
    this.geminiModel = googleProvider('gemini-3-pro-preview');
    
    if (config.claudeApiKey) {
      this.claude = new ClaudeClient(config.claudeApiKey);
    }
  }

  /**
   * Get or create VirtualFileSystem
   */
  private getVFS(): VirtualFileSystem {
    if (!this.vfs) {
      this.vfs = new VirtualFileSystem(this.graph);
    }
    return this.vfs;
  }

  /**
   * Determine if a request should use Claude
   */
  private shouldUseClaude(toolName?: string, userPrompt?: string): boolean {
    // No Claude client available
    if (!this.claude) {
      return false;
    }

    // Explicit tool routing
    if (toolName === 'executeCommand') {
      return true;
    }

    // Natural language patterns that suggest exploration
    if (userPrompt) {
      const explorationPatterns = [
        /show me/i,
        /find/i,
        /search/i,
        /what.*have/i,
        /list/i,
        /how many/i,
        /which/i,
        /where/i,
      ];

      return explorationPatterns.some(pattern => pattern.test(userPrompt));
    }

    return false;
  }

  /**
   * Route a tool call to the appropriate model
   */
  async routeToolCall(
    toolName: string,
    params: any,
    userPrompt?: string
  ): Promise<RouteResult> {
    const useClaude = this.shouldUseClaude(toolName, userPrompt);

    if (useClaude && this.claude) {
      try {
        // Route to Claude for exploration
        const vfs = this.getVFS();
        const response = await this.claude.executeCommand(
          userPrompt || `Execute: ${toolName} with ${JSON.stringify(params)}`,
          vfs
        );

        // If Claude returned tool calls, execute them iteratively
        if (response.toolCalls && response.toolCalls.length > 0) {
          let currentResponse = response;
          const MAX_ITERATIONS = 99;
          const TIMEOUT_MS = 120000; // 2 minutes
          let iterationCount = 0;
          const startTime = Date.now();

          while (
            currentResponse.toolCalls && 
            currentResponse.toolCalls.length > 0 &&
            iterationCount < MAX_ITERATIONS &&
            Date.now() - startTime < TIMEOUT_MS
          ) {
            iterationCount++;

            try {
              const toolResults = await Promise.all(
                currentResponse.toolCalls.map(async (toolCall) => {
          if (toolCall.name === 'executeCommand') {
                    const result = await vfs.execute(toolCall.input.command);
                    return {
                      toolUseId: toolCall.id,
                      content: result.stdout || result.stderr || 'No output',
                    };
                  }
                  return {
                    toolUseId: toolCall.id,
                    content: 'Tool not supported',
                  };
                })
              );

              currentResponse = await this.claude.continueWithToolResults(
              [],
                toolResults,
              vfs
            );

              // Exit condition: Claude stops naturally
              if (currentResponse.stopReason === 'end_turn' || currentResponse.stopReason === 'stop' || !currentResponse.toolCalls) {
                break;
              }

            } catch (error: any) {
              console.error(`Tool execution error at iteration ${iterationCount}:`, error);
              currentResponse.content += `\n\n(Error: ${error.message})`;
              break;
            }
          }

          // Add debug info if limits were reached
          if (iterationCount >= MAX_ITERATIONS) {
            currentResponse.content += `\n\n(Reached max exploration depth of ${MAX_ITERATIONS})`;
          } else if (Date.now() - startTime >= TIMEOUT_MS) {
            currentResponse.content += `\n\n(Exploration timeout)`;
          }

            return {
              model: 'claude',
            response: currentResponse.content,
            reasoning: `Used Claude for file system exploration (${iterationCount} iterations)`,
              usage: currentResponse.usage,
            };
        }

        return {
          model: 'claude',
          response: response.content,
          reasoning: 'Used Claude for exploration query',
          usage: response.usage,
        };

      } catch (error: any) {
        console.warn('Claude failed, falling back to Gemini:', error.message);
        // Fall through to Gemini
      }
    }

    // Default: Use Gemini
    return {
      model: 'gemini',
      response: null, // Will be handled by existing Gemini flow
      reasoning: 'Using Gemini for standard operations',
    };
  }

  /**
   * Handle natural language query with automatic model selection
   */
  async handleQuery(
    userPrompt: string,
    conversationHistory: any[] = []
  ): Promise<RouteResult> {
    const useClaude = this.shouldUseClaude(undefined, userPrompt);

    if (useClaude && this.claude) {
      try {
        const vfs = this.getVFS();
        const response = await this.claude.executeCommand(
          userPrompt,
          vfs,
          conversationHistory
        );

        // Handle tool calls if any
        if (response.toolCalls && response.toolCalls.length > 0) {
          let currentHistory = [...conversationHistory];
          let finalResponse = response;

          // Execute tool calls iteratively with safeguards
          const MAX_ITERATIONS = 99;
          const TIMEOUT_MS = 120000; // 2 minutes max
          let iterationCount = 0;
          const startTime = Date.now();

          while (
            finalResponse.toolCalls && 
            finalResponse.toolCalls.length > 0 &&
            iterationCount < MAX_ITERATIONS &&
            Date.now() - startTime < TIMEOUT_MS
          ) {
            iterationCount++;
            
            try {
            const toolResults = await Promise.all(
              finalResponse.toolCalls.map(async (toolCall) => {
                if (toolCall.name === 'executeCommand') {
                  const result = await vfs.execute(toolCall.input.command);
                  return {
                    toolUseId: toolCall.id,
                    content: result.stdout || result.stderr || 'No output',
                  };
                }
                return {
                  toolUseId: toolCall.id,
                  content: 'Tool not supported',
                };
              })
            );

            finalResponse = await this.claude.continueWithToolResults(
              currentHistory,
              toolResults,
              vfs
            );

              // Exit condition: Claude explicitly stops (no more tool calls or end_turn)
              if (finalResponse.stopReason === 'end_turn' || finalResponse.stopReason === 'stop' || !finalResponse.toolCalls) {
                break;
              }

            } catch (error: any) {
              console.error(`Tool execution error at iteration ${iterationCount}:`, error);
              finalResponse.content += `\n\n(Error during exploration: ${error.message})`;
              break;
            }
          }

          // Add debug info if limits were reached
          if (iterationCount >= MAX_ITERATIONS) {
            console.warn(`Reached max iterations (${MAX_ITERATIONS})`);
            finalResponse.content += `\n\n(Reached maximum exploration depth of ${MAX_ITERATIONS} commands)`;
          } else if (Date.now() - startTime >= TIMEOUT_MS) {
            console.warn(`Reached timeout (${TIMEOUT_MS}ms)`);
            finalResponse.content += `\n\n(Exploration timeout reached)`;
          } else {
            console.log(`Exploration completed in ${iterationCount} iterations`);
          }

          return {
            model: 'claude',
            response: finalResponse.content,
            reasoning: 'Claude explored file system and answered query',
            usage: finalResponse.usage,
          };
        }

        return {
          model: 'claude',
          response: response.content,
          reasoning: 'Claude answered directly',
          usage: response.usage,
        };

      } catch (error: any) {
        console.warn('Claude failed, falling back to Gemini:', error.message);
        // Fall through to Gemini
      }
    }

    // Gemini fallback - return null to use existing flow
    return {
      model: 'gemini',
      response: null,
      reasoning: 'Using existing Gemini flow',
    };
  }

  /**
   * Test if Claude is available and working
   */
  async testClaude(): Promise<boolean> {
    if (!this.claude) {
      return false;
    }
    return this.claude.testConnection();
  }

  /**
   * Update API keys
   */
  updateKeys(config: Partial<ModelRouterConfig>): void {
    if (config.geminiApiKey) {
      const googleProvider = createGoogleGenerativeAI({ apiKey: config.geminiApiKey });
      this.geminiModel = googleProvider('gemini-3-pro-preview');
    }
    if (config.claudeApiKey) {
      this.claude = new ClaudeClient(config.claudeApiKey);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): { hasClaude: boolean; hasGemini: boolean } {
    return {
      hasClaude: this.claude !== null,
      hasGemini: !!this.config.geminiApiKey,
    };
  }

  /**
   * Get Gemini model for direct use (e.g., in hooks)
   */
  getGeminiModel() {
    return this.geminiModel;
  }
}
