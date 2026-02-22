/**
 * API Key Storage Utilities
 *
 * Centralized storage and retrieval for API keys.
 * Use these utilities in services and non-React contexts.
 * For React components, use the useApiKey hook instead.
 */

export type ApiKeyType = 'gemini' | 'claude';

const API_KEY_STORAGE_KEYS: Record<ApiKeyType, string> = {
  gemini: 'gemini_api_key',
  claude: 'claude_api_key',
};

/**
 * Get an API key from storage
 */
export function getApiKey(type: ApiKeyType): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEYS[type]);
}

/**
 * Set an API key in storage
 */
export function setApiKey(type: ApiKeyType, key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEYS[type], key);
}

/**
 * Remove an API key from storage
 */
export function removeApiKey(type: ApiKeyType): void {
  localStorage.removeItem(API_KEY_STORAGE_KEYS[type]);
}

/**
 * Check if an API key exists
 */
export function hasApiKey(type: ApiKeyType): boolean {
  const key = getApiKey(type);
  return key !== null && key.trim().length > 0;
}

/**
 * Validate API key format (basic validation)
 */
export function validateApiKeyFormat(type: ApiKeyType, key: string): { valid: boolean; error?: string } {
  if (!key || key.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' };
  }

  const trimmedKey = key.trim();

  switch (type) {
    case 'gemini':
      // Gemini keys typically start with "AIza"
      if (trimmedKey.length < 20) {
        return { valid: false, error: 'Gemini API key appears too short' };
      }
      break;
    case 'claude':
      // Claude keys typically start with "sk-ant-"
      if (!trimmedKey.startsWith('sk-ant-') && trimmedKey.length < 20) {
        return { valid: false, error: 'Claude API key appears invalid' };
      }
      break;
  }

  return { valid: true };
}

/**
 * Get the primary API key (Gemini for voice/text, Claude for exploration)
 */
export function getPrimaryApiKey(): string | null {
  return getApiKey('gemini');
}

/**
 * Check if any API key is configured
 */
export function hasAnyApiKey(): boolean {
  return hasApiKey('gemini') || hasApiKey('claude');
}

/**
 * Get all configured API keys
 */
export function getConfiguredKeys(): { gemini: boolean; claude: boolean } {
  return {
    gemini: hasApiKey('gemini'),
    claude: hasApiKey('claude'),
  };
}
