/**
 * API Keys Middleware
 * Extracts API keys from request headers for BYOK (Bring Your Own Key) model
 */

import { createMiddleware } from 'hono/factory';

export interface ApiKeys {
  gemini?: string;
  openai?: string;
  anthropic?: string;
}

/**
 * Middleware to extract API keys from request headers
 * Keys are passed in X-*-Key headers and stored in context
 */
export const extractApiKeys = createMiddleware<{
  Variables: { apiKeys: ApiKeys };
}>(async (c, next) => {
  const apiKeys: ApiKeys = {
    gemini: c.req.header('X-Gemini-Key') || undefined,
    openai: c.req.header('X-OpenAI-Key') || undefined,
    anthropic: c.req.header('X-Anthropic-Key') || undefined,
  };

  c.set('apiKeys', apiKeys);
  await next();
});

/**
 * Helper to require specific API keys
 * Returns 401 if required key is missing
 */
export function requireApiKey(keyName: keyof ApiKeys) {
  return createMiddleware<{ Variables: { apiKeys: ApiKeys } }>(
    async (c, next) => {
      const apiKeys = c.get('apiKeys');

      if (!apiKeys?.[keyName]) {
        return c.json(
          {
            success: false,
            error: `${keyName.charAt(0).toUpperCase() + keyName.slice(1)} API key required`,
            code: 'MISSING_API_KEY',
          },
          401
        );
      }

      await next();
    }
  );
}
