/**
 * Claude Client for Filesystem Exploration
 *
 * Routes executeCommand tool calls to Claude Opus 4.5 for superior
 * reasoning about file system operations and command composition.
 *
 * Based on Vercel's findings that Anthropic models excel at this:
 * https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools
 */

import Anthropic from "@anthropic-ai/sdk";
import { VirtualFileSystem } from "./virtualFileSystem";

export interface ClaudeToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface ClaudeResponse {
  content: string;
  toolCalls?: ClaudeToolCall[];
  stopReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class ClaudeClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * Execute a command exploration request with Claude
   */
  async executeCommand(
    userPrompt: string,
    vfs: VirtualFileSystem,
    conversationHistory: any[] = []
  ): Promise<ClaudeResponse> {
    try {
      // Build system prompt with file structure context
      const systemPrompt = `You have access to a virtual file system representing a design system.

File structure:
${await this.getFileStructure(vfs)}

Use the executeCommand tool to explore and answer the user's questions.
Available commands: grep, cat, jq, find, ls, tree, wc

Be natural and conversational. Explore the file system to understand what the user needs.`;

      // Define the executeCommand tool for Claude
      const tools: Anthropic.Tool[] = [
        {
          name: "executeCommand",
          description:
            "Execute a Unix command to explore the design system files. Commands: grep, cat, jq, find, ls, tree, wc",
          input_schema: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description:
                  'Unix command to execute (e.g., "cat tokens/brand-blue.json", "grep -r color tokens/")',
              },
            },
            required: ["command"],
          },
        },
      ];

      // Build messages array
      const messages: Anthropic.MessageParam[] = [
        ...conversationHistory,
        {
          role: "user",
          content: userPrompt,
        },
      ];

      // Call Claude
      const response = await this.client.messages.create({
        model: "claude-opus-4-20250514", // Latest Opus
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages,
      });

      // Extract tool calls if any
      const toolCalls: ClaudeToolCall[] = [];
      let textContent = "";

      for (const block of response.content) {
        if (block.type === "text") {
          textContent += block.text;
        } else if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, any>,
          });
        }
      }

      return {
        content: textContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        stopReason: response.stop_reason || "end_turn",
        usage: response.usage
          ? {
              promptTokens: response.usage.input_tokens,
              completionTokens: response.usage.output_tokens,
              totalTokens:
                response.usage.input_tokens + response.usage.output_tokens,
            }
          : undefined,
      };
    } catch (error: any) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Send tool results back to Claude for continued reasoning
   */
  async continueWithToolResults(
    conversationHistory: any[],
    toolResults: Array<{ toolUseId: string; content: string }>,
    vfs: VirtualFileSystem
  ): Promise<ClaudeResponse> {
    try {
      const systemPrompt = `You have access to a virtual file system representing a design system.

File structure:
${await this.getFileStructure(vfs)}

Use the executeCommand tool to explore and answer the user's questions.
Available commands: grep, cat, jq, find, ls, tree, wc`;

      const tools: Anthropic.Tool[] = [
        {
          name: "executeCommand",
          description:
            "Execute a Unix command to explore the design system files",
          input_schema: {
            type: "object",
            properties: {
              command: {
                type: "string",
                description: "Unix command to execute",
              },
            },
            required: ["command"],
          },
        },
      ];

      // Build tool result message
      const toolResultMessage: Anthropic.MessageParam = {
        role: "user",
        content: toolResults.map((result) => ({
          type: "tool_result" as const,
          tool_use_id: result.toolUseId,
          content: result.content,
        })),
      };

      const response = await this.client.messages.create({
        model: "claude-opus-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages: [...conversationHistory, toolResultMessage],
      });

      const toolCalls: ClaudeToolCall[] = [];
      let textContent = "";

      for (const block of response.content) {
        if (block.type === "text") {
          textContent += block.text;
        } else if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, any>,
          });
        }
      }

      return {
        content: textContent,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        stopReason: response.stop_reason || "end_turn",
        usage: response.usage
          ? {
              promptTokens: response.usage.input_tokens,
              completionTokens: response.usage.output_tokens,
              totalTokens:
                response.usage.input_tokens + response.usage.output_tokens,
            }
          : undefined,
      };
    } catch (error: any) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Get file structure overview for context
   */
  private async getFileStructure(vfs: VirtualFileSystem): Promise<string> {
    try {
      const result = await vfs.execute("tree -L 2");
      return result.stdout || "File structure not available";
    } catch {
      return "tokens/, relationships/, schema/, base-colors/";
    }
  }

  /**
   * Test API key validity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: "claude-opus-4-20250514",
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: "Hi",
          },
        ],
      });
      return true;
    } catch {
      return false;
    }
  }
}
