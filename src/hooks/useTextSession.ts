import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, stepCountIs } from 'ai';
import { useApp } from "@/context/AppContext";
import { useDesignLanguage } from "@/context/DesignLanguageContext";
import { useToolCall } from "@/context/ToolCallContext";
import { getEnhancedGeminiTools } from "@/types/aiTools";
import { navigationTools } from "@/types/navigationAiTools";
import { generationTools } from "@/types/generationAiTools";
import { getContextAwareSystemInstructions } from "@/services/systemInstructions";
import { getToolsForView } from "@/services/toolFilter";
import { useModelRouter } from "./useModelRouter";
import { getApiKey } from "@/utils/apiKeyStorage";

export const useTextSession = (
  onToolCall: (toolCall: any, sessionPromiseRef: React.MutableRefObject<any> | null) => Promise<void>,
  options?: {
    currentView?: string | null;
  }
) => {
  const location = useLocation();
  const { addLog } = useApp();
  const { currentLanguageMetadata, selectedNodes, graph, viewMode } = useDesignLanguage();
  const { showEvent } = useToolCall();

  // Initialize ModelRouter for dual-model routing
  const { router } = useModelRouter({ preferClaude: true });

  // Initialize Google provider with API key
  const googleProvider = useMemo(() => {
    const apiKey = getApiKey('gemini');
    if (!apiKey) {
      console.warn("Gemini API key not found");
      return null;
    }

    try {
      return createGoogleGenerativeAI({ apiKey });
    } catch (error) {
      console.error("Failed to initialize Google provider:", error);
      return null;
    }
  }, []); // Keep empty deps since we want to initialize once with the stored key
  
  // Get the Gemini model from the provider
  const geminiModel = useMemo(() => {
    if (!googleProvider) return null;
    return googleProvider('gemini-3-pro-preview');
  }, [googleProvider]);

  const getSystemInstruction = useCallback(() => {
    const route = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");
    const currentView = options?.currentView;

    return getContextAwareSystemInstructions({
      languageName: currentLanguageMetadata?.name || "the design language",
      currentView,
      route,
      mode,
      selectedNodes,
      graph,
      viewMode,
    });
  }, [currentLanguageMetadata, location.pathname, location.search, options?.currentView, selectedNodes, graph, viewMode]);

  const getTools = useCallback(() => {
    const route = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");
    const currentView = options?.currentView;

    // Landing page - navigation tools
    if (route === "/" || route === "") {
      return navigationTools;
    }

    // Generation mode - generation-specific tools
    if (mode === "generate") {
      return generationTools;
    }

    // Editor mode - get all tools first
    const allTools = getEnhancedGeminiTools({
      includeExamples: true,
      includeToolSearch: true,
    });

    // Filter tools based on current view using centralized filter
    const filteredTools = getToolsForView(currentView as any, allTools);

    return [
      {
        functionDeclarations: filteredTools,
      },
    ];
  }, [location.pathname, location.search, options?.currentView]);

  /**
   * Convert Gemini function declarations to AI SDK tool format
   * Converts Gemini's uppercase types (OBJECT, STRING, etc.) to JSON Schema lowercase types
   */
  const convertToolsToAISDK = useCallback((geminiTools: any[]): Record<string, any> => {
    const tools: Record<string, any> = {};

    // Convert Gemini type format to JSON Schema format
    const convertType = (type: string): string => {
      const typeMap: Record<string, string> = {
        'OBJECT': 'object',
        'STRING': 'string',
        'NUMBER': 'number',
        'INTEGER': 'integer',
        'BOOLEAN': 'boolean',
        'ARRAY': 'array',
      };
      return typeMap[type] || type.toLowerCase();
    };

    // Recursively convert parameter schema
    const convertSchema = (schema: any): any => {
      if (!schema) return { type: 'object', properties: {}, required: [] };

      const converted: any = { ...schema };

      if (converted.type) {
        converted.type = convertType(converted.type);
      }

      if (converted.properties) {
        converted.properties = Object.fromEntries(
          Object.entries(converted.properties).map(([key, value]: [string, any]) => [
            key,
            convertSchema(value),
          ])
        );
      }

      if (converted.items) {
        converted.items = convertSchema(converted.items);
      }

      return converted;
    };

    for (const toolGroup of geminiTools) {
      if (toolGroup.functionDeclarations) {
        for (const func of toolGroup.functionDeclarations) {
          tools[func.name] = {
            description: func.description || '',
            parameters: convertSchema(func.parameters),
          };
        }
      }
    }

    return tools;
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      try {
        // Re-check API key availability before proceeding
        const apiKey = getApiKey('gemini');
        console.log("🔑 API Key check:", {
          exists: !!apiKey,
          length: apiKey?.length,
          firstChars: apiKey?.substring(0, 10) + "...",
        });

        if (!apiKey) {
          addLog("❌ API key not found. Please set your Gemini API key in Settings.");
          return;
        }

        if (!geminiModel) {
          addLog("❌ Gemini model not initialized. Please refresh the page.");
          return;
        }

        addLog(`💬 You: ${message}`);

        // Try Claude first for exploration queries (if available)
        if (router) {
          const routeResult = await router.handleQuery(message);
          
          if (routeResult.model === 'claude' && routeResult.response) {
            addLog(`🤖 Claude: ${routeResult.response}`);
            addLog(`💡 ${routeResult.reasoning}`);
            if (routeResult.usage) {
              addLog(`📊 Tokens: ${routeResult.usage.totalTokens} (prompt: ${routeResult.usage.promptTokens}, completion: ${routeResult.usage.completionTokens})`);
            }
            return;
          }
        }

        // Fallback to Gemini for all other queries using AI SDK v6 streamText
        const systemInstruction = getSystemInstruction();
        const geminiTools = getTools();
        const tools = convertToolsToAISDK(geminiTools);

        // Create a fresh provider and model instance with the current API key to ensure it's properly set
        console.log("🤖 Creating Gemini provider with API key:", apiKey?.substring(0, 10) + "...");
        const freshProvider = createGoogleGenerativeAI({ apiKey });
        const freshModel = freshProvider('gemini-3-pro-preview');
        console.log("✅ Model created:", freshModel);

        console.log("📤 Calling streamText...");
        const result = streamText({
          model: freshModel,
          system: systemInstruction,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
          tools,
          stopWhen: stepCountIs(3), // Allow up to 3 tool call steps
          onChunk: ({ chunk }) => {
            if (chunk.type === 'tool-call') {
              console.log('🔧 Tool call:', chunk);
              addLog(`🔧 Calling tool: ${chunk.toolName}`);

              // Show tool call in UI
              showEvent({
                id: chunk.toolCallId,
                type: 'tool_call',
                timestamp: Date.now(),
                data: {
                  toolName: chunk.toolName,
                  args: chunk.input, // AI SDK v6 uses 'input' instead of 'args'
                },
              });
            }
          },
          onStepFinish: (stepResult) => {
            console.log('✅ Step finished, usage:', stepResult.usage);
            addLog(`✅ Step finished`);
          },
        });

        console.log("📥 Waiting for stream...");
        let fullText = '';
        let lastToolCalls: any[] = [];

        // Stream the response
        try {
          for await (const part of result.textStream) {
            console.log("📝 Text chunk:", part);
            fullText += part;
          }
          console.log("✅ Stream complete. Full text:", fullText);
        } catch (streamError) {
          console.error("❌ Stream error:", streamError);
          addLog(`❌ Stream error: ${streamError}`);
          throw streamError;
        }

        // Wait for completion - in AI SDK v6, properties are promises that need individual awaiting
        console.log("⏳ Waiting for final result...");

        // Await the specific properties we need
        const [toolCalls, usage, finishReason] = await Promise.all([
          result.toolCalls,
          result.usage,
          result.finishReason,
        ]);

        console.log("✅ Final result received:", { toolCalls, usage, finishReason });

        // Log token usage
        if (usage) {
          const totalTokens = (usage.inputTokens || 0) + (usage.outputTokens || 0);
          addLog(`📊 Tokens: ${totalTokens} (input: ${usage.inputTokens}, output: ${usage.outputTokens})`);
        }

        // Handle tool calls
        if (toolCalls && toolCalls.length > 0) {
          console.log("🔧 Text session tool calls:", toolCalls);

          // Convert AI SDK tool calls to Gemini format for compatibility
          // AI SDK v6 uses: { toolCallId, toolName, input } (not args!)
          const geminiToolCalls = toolCalls.map((tc: any) => ({
            id: tc.toolCallId,
            name: tc.toolName,
            args: tc.input, // AI SDK uses 'input', we convert to 'args' for compatibility
          }));

          await onToolCall({
            functionCalls: geminiToolCalls,
          }, null);
        }

        // Handle text response
        if (fullText) {
          addLog(`🤖 Assistant: ${fullText}`);
          
          // Show final text in UI
          showEvent({
            id: `text-${Date.now()}`,
            type: 'text_delta',
            timestamp: Date.now(),
            data: {
              text: fullText,
            },
          });
        }
      } catch (error: any) {
        console.error("❌ Text session error:", error);
        console.error("Error stack:", error.stack);
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          cause: error.cause,
        });
        addLog(`❌ Error: ${error.message || "Failed to process message"}`);
        
        // Log specific error types
        if (error.name === 'AI_LoadAPIKeyError') {
          addLog(`❌ API Key Error: The API key couldn't be loaded. Check your settings.`);
        } else if (error.name === 'AI_NoOutputGeneratedError') {
          addLog(`❌ No output generated. The model didn't return a response.`);
        }
      }
    },
    [geminiModel, googleProvider, getSystemInstruction, getTools, convertToolsToAISDK, addLog, onToolCall, router, showEvent]
  );

  return {
    sendMessage,
  };
};
