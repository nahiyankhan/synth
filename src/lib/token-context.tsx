/**
 * Token Context Provider for json-render
 *
 * Provides token resolution capabilities to json-render components.
 * Tokens are resolved at render time using the active design language.
 *
 * Features:
 * - Resolves token references to CSS values
 * - Respects light/dark mode
 * - Falls back to CSS variables when token not found
 * - Progressive enhancement - works without design language
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useDesignLanguage } from '../context/DesignLanguageContext';
import { isTokenValue, isPathValue, type TokenValue } from './token-value';

// =============================================================================
// Types
// =============================================================================

interface TokenContextValue {
  /**
   * Resolve a single token by name
   * @returns CSS value or CSS variable fallback
   */
  resolveToken: (tokenName: string) => string;

  /**
   * Resolve a styleable value (literal, path, or token)
   * - Literal values pass through unchanged
   * - Path values pass through (handled by DataProvider)
   * - Token values are resolved to CSS
   */
  resolveStyleValue: <T>(value: T | { path: string } | TokenValue) => T | string;

  /**
   * Check if a design language is loaded
   */
  hasDesignLanguage: boolean;

  /**
   * Current view mode (light/dark)
   */
  viewMode: 'light' | 'dark';
}

// =============================================================================
// Context
// =============================================================================

const TokenContext = createContext<TokenContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface TokenProviderProps {
  children: React.ReactNode;
}

export const TokenProvider: React.FC<TokenProviderProps> = ({ children }) => {
  const { graph, viewMode, getTokenByPath } = useDesignLanguage();

  const hasDesignLanguage = !!graph && graph.nodes.size > 0;

  /**
   * Resolve a token name to its CSS value
   */
  const resolveToken = useCallback(
    (tokenName: string): string => {
      if (!graph) {
        // No design language - fall back to CSS variable
        return `var(--${tokenName})`;
      }

      // Try direct node lookup by ID first
      let node = graph.getNode(tokenName);

      // If not found, try lookup by path
      if (!node) {
        node = getTokenByPath(tokenName);
      }

      // If still not found, try common variations
      if (!node) {
        // Try with dashes converted to dots (e.g., "muted-foreground" -> "muted.foreground")
        const dotPath = tokenName.replace(/-/g, '.');
        node = getTokenByPath(dotPath);
      }

      if (node) {
        // Resolve the node value respecting current mode
        const resolved = graph.resolveNode(node.id, viewMode);
        if (resolved !== null && typeof resolved === 'string') {
          return resolved;
        }
      }

      // Fallback to CSS variable
      return `var(--${tokenName})`;
    },
    [graph, viewMode, getTokenByPath]
  );

  /**
   * Resolve a styleable value
   */
  const resolveStyleValue = useCallback(
    <T,>(value: T | { path: string } | TokenValue): T | string => {
      // Token reference - resolve to CSS value
      if (isTokenValue(value)) {
        return resolveToken(value.token);
      }

      // Path reference - pass through for DataProvider
      if (isPathValue(value)) {
        return value as unknown as T;
      }

      // Literal value - pass through
      return value as T;
    },
    [resolveToken]
  );

  const contextValue = useMemo(
    (): TokenContextValue => ({
      resolveToken,
      resolveStyleValue,
      hasDesignLanguage,
      viewMode,
    }),
    [resolveToken, resolveStyleValue, hasDesignLanguage, viewMode]
  );

  return <TokenContext.Provider value={contextValue}>{children}</TokenContext.Provider>;
};

// =============================================================================
// Hooks
// =============================================================================

/**
 * Access token resolution utilities
 * @throws Error if used outside TokenProvider
 */
export const useTokens = (): TokenContextValue => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokens must be used within a TokenProvider');
  }
  return context;
};

/**
 * Resolve a single token value
 * Convenience hook for components that only need one token
 */
export const useTokenValue = (tokenName: string): string => {
  const { resolveToken } = useTokens();
  return resolveToken(tokenName);
};

/**
 * Resolve multiple token values at once
 * @returns Object with resolved values keyed by token name
 */
export const useTokenValues = <T extends string>(tokenNames: T[]): Record<T, string> => {
  const { resolveToken } = useTokens();

  return useMemo(() => {
    const result = {} as Record<T, string>;
    for (const name of tokenNames) {
      result[name] = resolveToken(name);
    }
    return result;
  }, [tokenNames, resolveToken]);
};

// =============================================================================
// Optional Context Access
// =============================================================================

/**
 * Safely access token context (returns null if not in provider)
 * Useful for components that work both with and without TokenProvider
 */
export const useOptionalTokens = (): TokenContextValue | null => {
  return useContext(TokenContext);
};
