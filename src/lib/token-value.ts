/**
 * Token Value Type System
 *
 * Provides types and utilities for token references in json-render components.
 * Token references allow AI-generated UIs to use design language tokens for styling.
 *
 * Format: { token: "token-name" }
 * Examples: { token: "primary" }, { token: "muted-foreground" }
 */

import { z } from 'zod';

// =============================================================================
// Token Value Schema
// =============================================================================

/**
 * Schema for a token reference.
 * Token names follow shadcn conventions: primary, muted-foreground, etc.
 */
export const TokenValueSchema = z.object({
  token: z.string().describe('Design token name (e.g., "primary", "muted-foreground")'),
});

export type TokenValue = z.infer<typeof TokenValueSchema>;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a value is a token reference
 */
export function isTokenValue(value: unknown): value is TokenValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'token' in value &&
    typeof (value as TokenValue).token === 'string'
  );
}

/**
 * Check if a value is a data path reference (json-render's DynamicValue)
 */
export function isPathValue(value: unknown): value is { path: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    typeof (value as { path: string }).path === 'string'
  );
}

/**
 * Check if a value is a dynamic reference (either token or path)
 */
export function isDynamicReference(value: unknown): value is TokenValue | { path: string } {
  return isTokenValue(value) || isPathValue(value);
}

// =============================================================================
// Styleable Prop Utilities
// =============================================================================

/**
 * Create a Zod schema for a styleable prop that accepts:
 * - A literal value of type T
 * - A data path reference: { path: "/some/data" }
 * - A token reference: { token: "token-name" }
 */
export function styleableProp<T extends z.ZodTypeAny>(schema: T) {
  return z.union([
    schema,
    z.object({ path: z.string().describe('Data model path') }),
    TokenValueSchema,
  ]);
}

/**
 * Styleable string prop - accepts string, path, or token
 */
export const StyleableString = styleableProp(z.string());
export type StyleableStringValue = z.infer<typeof StyleableString>;

/**
 * Styleable number prop - accepts number, path, or token
 */
export const StyleableNumber = styleableProp(z.number());
export type StyleableNumberValue = z.infer<typeof StyleableNumber>;

// =============================================================================
// Token Name Utilities
// =============================================================================

/**
 * Common token names available in shadcn-aligned design languages
 */
export const COMMON_TOKENS = {
  // Core
  background: 'background',
  foreground: 'foreground',

  // Primary
  primary: 'primary',
  primaryForeground: 'primary-foreground',

  // Secondary
  secondary: 'secondary',
  secondaryForeground: 'secondary-foreground',

  // Muted
  muted: 'muted',
  mutedForeground: 'muted-foreground',

  // Accent
  accent: 'accent',
  accentForeground: 'accent-foreground',

  // Destructive
  destructive: 'destructive',
  destructiveForeground: 'destructive-foreground',

  // Card
  card: 'card',
  cardForeground: 'card-foreground',

  // Popover
  popover: 'popover',
  popoverForeground: 'popover-foreground',

  // Borders
  border: 'border',
  input: 'input',
  ring: 'ring',
} as const;

export type CommonTokenName = (typeof COMMON_TOKENS)[keyof typeof COMMON_TOKENS];

/**
 * Create a token reference object
 */
export function tokenRef(tokenName: string): TokenValue {
  return { token: tokenName };
}
