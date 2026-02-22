/**
 * API Key Management Hook
 *
 * Centralized hook for API key management in React components.
 * Use this hook instead of direct localStorage access.
 */

import { useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ApiKeyType,
  getApiKey,
  setApiKey,
  removeApiKey,
  hasApiKey as checkHasApiKey,
  validateApiKeyFormat,
  getConfiguredKeys,
} from '@/utils/apiKeyStorage';

export type { ApiKeyType };

export interface UseApiKeyReturn {
  /** Whether the primary (Gemini) API key is configured */
  hasApiKey: boolean;
  /** Save Gemini API key */
  saveApiKey: (key: string) => void;
  /** Save Claude API key */
  saveClaudeKey: (key: string) => void;
  /** Get an API key by type */
  getKey: (type: ApiKeyType) => string | null;
  /** Check if a specific key type is configured */
  hasKey: (type: ApiKeyType) => boolean;
  /** Remove an API key */
  removeKey: (type: ApiKeyType) => void;
  /** Validate API key format */
  validateKey: (type: ApiKeyType, key: string) => { valid: boolean; error?: string };
  /** Get status of all configured keys */
  configuredKeys: { gemini: boolean; claude: boolean };
}

export const useApiKey = (): UseApiKeyReturn => {
  const { hasApiKey, setHasApiKey } = useApp();

  const saveApiKey = useCallback((key: string) => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      setApiKey('gemini', trimmedKey);
      setHasApiKey(true);
    }
  }, [setHasApiKey]);

  const saveClaudeKey = useCallback((key: string) => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      setApiKey('claude', trimmedKey);
    }
  }, []);

  const getKey = useCallback((type: ApiKeyType): string | null => {
    return getApiKey(type);
  }, []);

  const hasKey = useCallback((type: ApiKeyType): boolean => {
    return checkHasApiKey(type);
  }, []);

  const removeKey = useCallback((type: ApiKeyType): void => {
    removeApiKey(type);
    if (type === 'gemini') {
      setHasApiKey(false);
    }
  }, [setHasApiKey]);

  const validateKey = useCallback((type: ApiKeyType, key: string) => {
    return validateApiKeyFormat(type, key);
  }, []);

  const configuredKeys = useMemo(() => getConfiguredKeys(), []);

  return {
    hasApiKey,
    saveApiKey,
    saveClaudeKey,
    getKey,
    hasKey,
    removeKey,
    validateKey,
    configuredKeys,
  };
};
