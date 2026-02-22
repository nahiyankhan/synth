/**
 * Generate Routes
 * Handles design system and UI generation with SSE streaming
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { extractApiKeys } from '../middleware/api-keys';
import type { ApiKeys } from '../middleware/api-keys';

// Import orchestrators - these will be updated to accept API keys
import { DesignOrchestrator } from '../../src/server/orchestrator/design-orchestrator';
import { UIOrchestrator } from '../../src/server/orchestrator/ui-orchestrator';
import type { ImageAttachment, GenerationRequest } from '../../src/types/multimodal';

interface GenerateUIRequest {
  prompt: string;
  tokenContext?: string;
}

const generate = new Hono<{ Variables: { apiKeys: ApiKeys } }>();

// Apply middleware
generate.use('*', extractApiKeys);

/**
 * POST /api/generate
 * Design system generation with SSE streaming
 */
generate.post('/', async (c) => {
  const { prompt, images } = await c.req.json<GenerationRequest>();
  const apiKeys = c.get('apiKeys');

  if (!apiKeys.openai) {
    return c.json(
      {
        success: false,
        error: 'OpenAI API key required for design generation',
        code: 'MISSING_API_KEY',
      },
      401
    );
  }

  console.log('Design generation request:', {
    prompt,
    imageCount: images?.length ?? 0,
  });

  return streamSSE(c, async (stream) => {
    // Send connection event
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'connected',
        message: 'Connected to design generation stream',
      }),
    });

    // Set up keepalive
    const keepAlive = setInterval(async () => {
      try {
        await stream.writeSSE({ data: `: keepalive ${Date.now()}` });
      } catch {
        clearInterval(keepAlive);
      }
    }, 30000);

    try {
      // Create orchestrator with user's API key
      const orchestrator = new DesignOrchestrator(apiKeys.openai);

      // Stream generation events
      for await (const event of orchestrator.generateTailwindStreaming(
        prompt,
        images
      )) {
        await stream.writeSSE({ data: JSON.stringify(event) });

        if (event.type === 'complete' || event.type === 'error') {
          break;
        }
      }

      console.log('Design generation completed');
    } catch (err) {
      console.error('Design generation failed:', err);
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          message: err instanceof Error ? err.message : 'Generation failed',
        }),
      });
    } finally {
      clearInterval(keepAlive);
    }
  });
});

/**
 * POST /api/generate/ui
 * UI component tree generation with SSE streaming
 */
generate.post('/ui', async (c) => {
  const { prompt, tokenContext } = await c.req.json<GenerateUIRequest>();
  const apiKeys = c.get('apiKeys');

  if (!apiKeys.anthropic) {
    return c.json(
      {
        success: false,
        error: 'Anthropic API key required for UI generation',
        code: 'MISSING_API_KEY',
      },
      401
    );
  }

  console.log('UI generation request:', {
    prompt,
    hasTokenContext: !!tokenContext,
  });

  return streamSSE(c, async (stream) => {
    // Send connection event
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'connected',
        message: 'Connected to UI generation stream',
      }),
    });

    // Set up keepalive
    const keepAlive = setInterval(async () => {
      try {
        await stream.writeSSE({ data: `: keepalive ${Date.now()}` });
      } catch {
        clearInterval(keepAlive);
      }
    }, 30000);

    try {
      // Create orchestrator with user's API key
      const orchestrator = new UIOrchestrator(apiKeys.anthropic);

      // Stream generation events
      for await (const event of orchestrator.generateUI({
        prompt,
        tokenContext,
      })) {
        await stream.writeSSE({ data: JSON.stringify(event) });

        if (event.type === 'complete' || event.type === 'error') {
          break;
        }
      }

      console.log('UI generation completed');
    } catch (err) {
      console.error('UI generation failed:', err);
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          message: err instanceof Error ? err.message : 'UI generation failed',
        }),
      });
    } finally {
      clearInterval(keepAlive);
    }
  });
});

/**
 * GET /api/generate/:prompt (legacy endpoint)
 * Backward compatible SSE endpoint
 */
generate.get('/:prompt', async (c) => {
  const prompt = decodeURIComponent(c.req.param('prompt'));
  const apiKeys = c.get('apiKeys');

  if (!apiKeys.openai) {
    return c.json(
      {
        success: false,
        error: 'OpenAI API key required for design generation',
        code: 'MISSING_API_KEY',
      },
      401
    );
  }

  console.log('Legacy design generation request:', { prompt });

  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'connected',
        message: 'Connected to design generation stream',
      }),
    });

    const keepAlive = setInterval(async () => {
      try {
        await stream.writeSSE({ data: `: keepalive ${Date.now()}` });
      } catch {
        clearInterval(keepAlive);
      }
    }, 30000);

    try {
      const orchestrator = new DesignOrchestrator(apiKeys.openai);

      for await (const event of orchestrator.generateTailwindStreaming(
        prompt
      )) {
        await stream.writeSSE({ data: JSON.stringify(event) });

        if (event.type === 'complete' || event.type === 'error') {
          break;
        }
      }
    } catch (err) {
      console.error('Design generation failed:', err);
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          message: err instanceof Error ? err.message : 'Generation failed',
        }),
      });
    } finally {
      clearInterval(keepAlive);
    }
  });
});

export { generate as generateRoutes };
