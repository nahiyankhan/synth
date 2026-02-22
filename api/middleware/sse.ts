/**
 * SSE (Server-Sent Events) Helpers
 * Utilities for streaming responses to clients
 */

import type { Context } from 'hono';
import { streamSSE } from 'hono/streaming';

export interface SSEEvent {
  type: string;
  [key: string]: unknown;
}

/**
 * Stream events from an async generator to the client via SSE
 * Handles connection, streaming, and cleanup automatically
 */
export function streamGeneratorSSE<T extends SSEEvent>(
  c: Context,
  generator: AsyncGenerator<T>,
  options?: {
    onError?: (err: Error) => void;
    keepAliveInterval?: number;
  }
) {
  const { onError, keepAliveInterval = 30000 } = options || {};

  return streamSSE(c, async (stream) => {
    // Send initial connection event
    await stream.writeSSE({
      data: JSON.stringify({ type: 'connected', message: 'Stream connected' }),
    });

    // Set up keepalive to prevent timeout
    const keepAlive = setInterval(async () => {
      try {
        await stream.writeSSE({
          data: `: keepalive ${Date.now()}`,
        });
      } catch {
        // Stream might be closed
        clearInterval(keepAlive);
      }
    }, keepAliveInterval);

    try {
      for await (const event of generator) {
        await stream.writeSSE({
          data: JSON.stringify(event),
        });

        // Check for terminal events
        if (event.type === 'complete' || event.type === 'error') {
          break;
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);

      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          message: error.message,
        }),
      });
    } finally {
      clearInterval(keepAlive);
    }
  });
}

// Note: For simple SSE responses, use streamSSE directly from hono/streaming
// or use streamGeneratorSSE with an async generator
