/**
 * Vite API Middleware - Handles SSE endpoints for design system generation
 */

import type { Connect } from 'vite';
import { DesignOrchestrator } from './orchestrator/design-orchestrator';
import { UIOrchestrator } from './orchestrator/ui-orchestrator';
import type { GenerationRequest } from '../types/multimodal';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, stepCountIs } from 'ai';
import { getContextAwareSystemInstructions } from '../services/systemInstructions';
import { getEnhancedGeminiTools } from '../types/aiTools';
import { navigationTools } from '../types/navigationAiTools';
import { generationTools } from '../types/generationAiTools';
import { getToolsForView } from '../services/toolFilter';

/**
 * Chat message from client
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Chat request context for AI SDK useChat hook
 */
interface ChatContext {
  route?: string;
  mode?: string | null;
  currentView?: string | null;
  languageName?: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  context?: ChatContext;
}

/**
 * Convert Gemini function declarations to AI SDK tool format
 */
function convertToolsToAISDK(geminiTools: any[]): Record<string, any> {
  const tools: Record<string, any> = {};

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
}

/**
 * Get tools based on context
 */
function getToolsForContext(context: ChatContext): Record<string, any> {
  const { route, mode, currentView } = context;

  // Landing page - navigation tools
  if (route === "/" || route === "") {
    return convertToolsToAISDK(navigationTools);
  }

  // Generation mode - generation-specific tools
  if (mode === "generate") {
    return convertToolsToAISDK(generationTools);
  }

  // Editor mode - get all tools first
  const allTools = getEnhancedGeminiTools({
    includeExamples: true,
    includeToolSearch: true,
  });

  // Filter tools based on current view
  const filteredTools = getToolsForView(currentView as any, allTools);

  return convertToolsToAISDK([{ functionDeclarations: filteredTools }]);
}

/**
 * Create API middleware for Vite dev server
 */
export function createApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    // Only handle /api/* routes
    if (!req.url?.startsWith('/api/')) {
      return next();
    }

    // Parse the route
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // POST endpoint: /api/chat (AI SDK useChat compatible)
    if (pathname === '/api/chat' && req.method === 'POST') {
      // Parse JSON body
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }

      let request: ChatRequest;
      try {
        request = JSON.parse(body);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }

      const { messages, context = {} } = request;
      console.log('💬 Chat request:', { messageCount: messages.length, context });

      // Get API key from environment
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Gemini API key not configured' }));
        return;
      }

      try {
        // Initialize Google provider
        const googleProvider = createGoogleGenerativeAI({ apiKey });
        const model = googleProvider('gemini-3-pro-preview');

        // Get system instructions and tools based on context
        const systemInstruction = getContextAwareSystemInstructions({
          languageName: context.languageName || 'the design language',
          currentView: context.currentView,
          route: context.route || '/editor',
          mode: context.mode,
        });

        const tools = getToolsForContext(context);

        // Set up streaming response headers for AI SDK data stream
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Transfer-Encoding': 'chunked',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
        });

        // Convert simple messages to AI SDK format
        const modelMessages = messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }));

        // Use AI SDK streamText with tool call support
        const result = streamText({
          model,
          system: systemInstruction,
          messages: modelMessages,
          tools,
          stopWhen: stepCountIs(3), // Allow up to 3 tool call steps
        });

        // Stream the response using AI SDK's data stream format
        // This includes tool call events that useChat can process
        result.toDataStreamResponse().body?.pipeTo(
          new WritableStream({
            write(chunk) {
              res.write(chunk);
            },
            close() {
              res.end();
            },
          })
        );

        // Handle client disconnect
        req.on('close', () => {
          console.log('Chat client disconnected');
        });
      } catch (error) {
        console.error('Chat API error:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        if (!res.writableEnded) {
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Chat failed',
          }));
        }
      }

      return;
    }

    // POST endpoint: /api/generate (multimodal with images)
    if (pathname === '/api/generate' && req.method === 'POST') {
      // Parse JSON body
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }

      let request: GenerationRequest;
      try {
        request = JSON.parse(body);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }

      const { prompt, images } = request;
      console.log('🔥 New POST SSE request for prompt:', prompt, 'with', images?.length ?? 0, 'images');

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Set up keepalive to prevent timeouts
      const keepAliveInterval = setInterval(() => {
        if (!res.destroyed && !res.writableEnded) {
          res.write(`: keepalive ${Date.now()}\n\n`);
        }
      }, 30000);

      // Send initial connection event
      res.write(
        `data: ${JSON.stringify({
          type: 'connected',
          message: 'Connected to design generation stream',
        })}\n\n`
      );

      // Handle client disconnect
      req.on('close', () => {
        console.log('Client disconnected');
        clearInterval(keepAliveInterval);
        if (!res.destroyed) {
          res.end();
        }
      });

      try {
        console.log('🚀 Starting multimodal design generation...');

        let orchestrator;
        try {
          orchestrator = new DesignOrchestrator();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to initialize orchestrator';
          console.error('❌ Orchestrator initialization failed:', errorMsg);
          res.write(`data: ${JSON.stringify({
            type: 'error',
            message: errorMsg,
            details: 'Please ensure OPENAI_API_KEY or ANTHROPIC_API_KEY is set in your .env file'
          })}\n\n`);
          clearInterval(keepAliveInterval);
          if (!res.destroyed && !res.writableEnded) {
            res.end();
          }
          return;
        }

        // Stream events from orchestrator with images
        // Always use Tailwind v4 generation (legacy modes removed)
        const generator = orchestrator.generateTailwindStreaming(prompt, images);

        for await (const event of generator) {
          if (res.destroyed || res.writableEnded) {
            console.log('Response stream ended');
            break;
          }

          console.log('📡 Sending event to client:', event.type);
          res.write(`data: ${JSON.stringify(event)}\n\n`);

          if (event.type === 'complete' || event.type === 'error') {
            clearInterval(keepAliveInterval);
            setTimeout(() => {
              if (!res.destroyed && !res.writableEnded) {
                res.end();
              }
            }, 1000);
            break;
          }
        }

        console.log('✅ Multimodal design generation completed successfully');
      } catch (error) {
        console.error('❌ Design generation failed:', error);
        const errorEvent = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Generation failed',
          details: error instanceof Error ? error.stack : undefined,
        };
        if (!res.destroyed && !res.writableEnded) {
          res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
        }
        clearInterval(keepAliveInterval);
        if (!res.destroyed && !res.writableEnded) {
          res.end();
        }
      }

      return;
    }

    // POST endpoint: /api/generate-ui (UI component tree generation)
    if (pathname === '/api/generate-ui' && req.method === 'POST') {
      // Parse JSON body
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }

      let request: { prompt: string; tokenContext?: string };
      try {
        request = JSON.parse(body);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        return;
      }

      const { prompt, tokenContext } = request;
      console.log('🎨 New UI generation request:', prompt);
      if (tokenContext) {
        console.log('🎨 Design language token context provided');
      }

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Set up keepalive
      const keepAliveInterval = setInterval(() => {
        if (!res.destroyed && !res.writableEnded) {
          res.write(`: keepalive ${Date.now()}\n\n`);
        }
      }, 30000);

      // Send initial connection event
      res.write(
        `data: ${JSON.stringify({
          type: 'connected',
          message: 'Connected to UI generation stream',
        })}\n\n`
      );

      // Handle client disconnect
      req.on('close', () => {
        console.log('Client disconnected from UI generation');
        clearInterval(keepAliveInterval);
        if (!res.destroyed) {
          res.end();
        }
      });

      try {
        console.log('🚀 Starting UI generation...');

        let orchestrator;
        try {
          orchestrator = new UIOrchestrator();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to initialize UI orchestrator';
          console.error('❌ UI Orchestrator initialization failed:', errorMsg);
          res.write(`data: ${JSON.stringify({
            type: 'error',
            message: errorMsg,
            details: 'Please ensure ANTHROPIC_API_KEY is set in your .env file'
          })}\n\n`);
          clearInterval(keepAliveInterval);
          if (!res.destroyed && !res.writableEnded) {
            res.end();
          }
          return;
        }

        // Stream events from UI orchestrator
        for await (const event of orchestrator.generateUI({ prompt, tokenContext })) {
          if (res.destroyed || res.writableEnded) {
            console.log('Response stream ended');
            break;
          }

          console.log('📡 Sending UI event:', event.type);
          res.write(`data: ${JSON.stringify(event)}\n\n`);

          if (event.type === 'complete' || event.type === 'error') {
            clearInterval(keepAliveInterval);
            setTimeout(() => {
              if (!res.destroyed && !res.writableEnded) {
                res.end();
              }
            }, 500);
            break;
          }
        }

        console.log('✅ UI generation completed');
      } catch (error) {
        console.error('❌ UI generation failed:', error);
        const errorEvent = {
          type: 'error',
          message: error instanceof Error ? error.message : 'UI generation failed',
          details: error instanceof Error ? error.stack : undefined,
        };
        if (!res.destroyed && !res.writableEnded) {
          res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
        }
        clearInterval(keepAliveInterval);
        if (!res.destroyed && !res.writableEnded) {
          res.end();
        }
      }

      return;
    }

    // GET SSE endpoint: /api/generate/:prompt (backward compatible)
    if (pathname.startsWith('/api/generate/')) {
      const encodedPrompt = pathname.slice('/api/generate/'.length);
      const prompt = decodeURIComponent(encodedPrompt);

      console.log('🔥 New SSE request for prompt:', prompt);

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Set up keepalive to prevent timeouts
      const keepAliveInterval = setInterval(() => {
        if (!res.destroyed && !res.writableEnded) {
          res.write(`: keepalive ${Date.now()}\n\n`);
        }
      }, 30000); // Every 30 seconds

      // Send initial connection event
      res.write(
        `data: ${JSON.stringify({
          type: 'connected',
          message: 'Connected to design generation stream',
        })}\n\n`
      );

      // Handle client disconnect
      req.on('close', () => {
        console.log('Client disconnected');
        clearInterval(keepAliveInterval);
        if (!res.destroyed) {
          res.end();
        }
      });

      try {
        console.log('🚀 Starting design generation...');

        // Create orchestrator
        let orchestrator;
        try {
          orchestrator = new DesignOrchestrator();
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to initialize orchestrator';
          console.error('❌ Orchestrator initialization failed:', errorMsg);
          res.write(`data: ${JSON.stringify({
            type: 'error',
            message: errorMsg,
            details: 'Please ensure OPENAI_API_KEY or ANTHROPIC_API_KEY is set in your .env file'
          })}\n\n`);
          clearInterval(keepAliveInterval);
          if (!res.destroyed && !res.writableEnded) {
            res.end();
          }
          return;
        }

        // Stream events from orchestrator (always Tailwind v4)
        for await (const event of orchestrator.generateTailwindStreaming(prompt)) {
          if (res.destroyed || res.writableEnded) {
            console.log('Response stream ended');
            break;
          }

          console.log('📡 Sending event to client:', event.type);
          res.write(`data: ${JSON.stringify(event)}\n\n`);

          // Close connection after complete or error
          if (event.type === 'complete' || event.type === 'error') {
            clearInterval(keepAliveInterval);
            setTimeout(() => {
              if (!res.destroyed && !res.writableEnded) {
                res.end();
              }
            }, 1000); // Give client time to process
            break;
          }
        }

        console.log('✅ Design generation completed successfully');
      } catch (error) {
        console.error('❌ Design generation failed:', error);
        const errorEvent = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Generation failed',
          details: error instanceof Error ? error.stack : undefined,
        };
        if (!res.destroyed && !res.writableEnded) {
          res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
        }
        clearInterval(keepAliveInterval);
        if (!res.destroyed && !res.writableEnded) {
          res.end();
        }
      }

      return; // Don't call next()
    }

    // Unknown API route
    next();
  };
}

