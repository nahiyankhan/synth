/**
 * useModelRouter - Hook for initializing the ModelRouter
 *
 * Consolidates duplicate ModelRouter instantiation logic from
 * useTextSession.ts and useToolCallHandler.ts
 */

import { useMemo } from 'react';
import { useDesignLanguage } from '../context/DesignLanguageContext';
import { ModelRouter } from '../services/modelRouter';
import { getApiKey } from '../utils/apiKeyStorage';

export interface UseModelRouterOptions {
  /** Prefer Claude over Gemini when available */
  preferClaude?: boolean;
}

export interface UseModelRouterReturn {
  /** The ModelRouter instance, or null if not available */
  router: ModelRouter | null;
  /** Whether the router is ready to use */
  isReady: boolean;
  /** Error message if router couldn't be initialized */
  error: string | null;
}

/**
 * Hook for initializing and managing a ModelRouter instance.
 * Handles API key retrieval and router configuration.
 *
 * @param options - Configuration options
 * @returns ModelRouter instance and status
 *
 * @example
 * ```tsx
 * const { router, isReady, error } = useModelRouter({ preferClaude: true });
 *
 * if (!isReady) {
 *   return <div>API key required</div>;
 * }
 *
 * // Use router for AI interactions
 * await router.route(prompt);
 * ```
 */
export function useModelRouter(
  options: UseModelRouterOptions = {}
): UseModelRouterReturn {
  const { preferClaude = true } = options;
  const { graph } = useDesignLanguage();

  const result = useMemo(() => {
    // Can't create router without graph
    if (!graph) {
      return {
        router: null,
        isReady: false,
        error: 'Design language graph not loaded',
      };
    }

    // Get API keys from centralized storage
    const geminiKey = getApiKey('gemini');
    const claudeKey = getApiKey('claude');

    // Gemini key is required
    if (!geminiKey) {
      return {
        router: null,
        isReady: false,
        error: 'Gemini API key not configured',
      };
    }

    try {
      const router = new ModelRouter(
        {
          geminiApiKey: geminiKey,
          claudeApiKey: claudeKey || undefined,
          preferClaude,
        },
        graph
      );

      return {
        router,
        isReady: true,
        error: null,
      };
    } catch (error) {
      return {
        router: null,
        isReady: false,
        error: error instanceof Error ? error.message : 'Failed to initialize ModelRouter',
      };
    }
  }, [graph, preferClaude]);

  return result;
}
