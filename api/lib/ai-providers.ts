/**
 * AI Provider Factory
 * Creates AI SDK providers from user-provided API keys
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { ApiKeys } from '../middleware/api-keys';

export interface AIProviders {
  gemini: ReturnType<typeof createGoogleGenerativeAI> | null;
  openai: ReturnType<typeof createOpenAI> | null;
  anthropic: ReturnType<typeof createAnthropic> | null;
}

/**
 * Create AI SDK providers from API keys
 * Returns null for providers without keys
 */
export function createProviders(keys: ApiKeys): AIProviders {
  return {
    gemini: keys.gemini
      ? createGoogleGenerativeAI({ apiKey: keys.gemini })
      : null,
    openai: keys.openai ? createOpenAI({ apiKey: keys.openai }) : null,
    anthropic: keys.anthropic
      ? createAnthropic({ apiKey: keys.anthropic })
      : null,
  };
}

/**
 * Get a specific provider, throwing if not available
 */
export function getProvider<K extends keyof AIProviders>(
  providers: AIProviders,
  name: K
): NonNullable<AIProviders[K]> {
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `${name.charAt(0).toUpperCase() + name.slice(1)} API key required`
    );
  }
  return provider as NonNullable<AIProviders[K]>;
}
