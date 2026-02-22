/**
 * Chat Route
 * Handles AI chat with streaming responses
 */

import { Hono } from 'hono';
import { streamText } from 'ai';
import { extractApiKeys, requireApiKey, type ApiKeys } from '../middleware/api-keys';
import { createProviders } from '../lib/ai-providers';
import { getContextAwareSystemInstructions } from '../../src/services/systemInstructions';
import { getToolsForContext, type ChatContext } from './helpers/tools';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  context?: ChatContext;
}

// Type the Hono app with our variables
const chat = new Hono<{ Variables: { apiKeys: ApiKeys } }>();

// Apply middleware
chat.use('*', extractApiKeys);
chat.use('*', requireApiKey('gemini'));

/**
 * POST /api/chat
 * AI SDK useChat compatible endpoint with streaming
 */
chat.post('/', async (c) => {
  const body = await c.req.json<ChatRequest>();
  const { messages, context = {} } = body;
  const apiKeys = c.get('apiKeys');

  console.log('Chat request:', {
    messageCount: messages.length,
    context,
  });

  // Create provider with user's API key
  const providers = createProviders(apiKeys);
  const model = providers.gemini!('gemini-2.5-pro-preview-06-05');

  // Get context-aware system instructions and tools
  const systemInstruction = getContextAwareSystemInstructions({
    languageName: context.languageName || 'the design language',
    currentView: context.currentView,
    route: context.route || '/editor',
    mode: context.mode,
  });

  const tools = getToolsForContext(context);

  // Stream response using AI SDK
  const result = streamText({
    model,
    system: systemInstruction,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    tools,
  });

  // Return AI SDK compatible stream response
  return result.toTextStreamResponse();
});

export { chat as chatRoutes };
