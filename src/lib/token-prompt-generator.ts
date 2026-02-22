/**
 * Token Prompt Generator
 *
 * Generates a compact token summary for AI system prompts.
 * Tells the AI what design tokens are available for styling.
 *
 * Strategy:
 * - Focus on semantic/utility layer tokens (not raw primitives)
 * - Group by purpose (colors, typography, sizes)
 * - Include usage examples
 * - Keep it concise (~50-100 lines)
 */

import type { StyleGraph } from '../core/StyleGraph';
import type { StyleNode } from '../types/styleGraph';
import { COMMON_TOKENS } from './token-value';

// =============================================================================
// Types
// =============================================================================

interface TokenSummary {
  colors: TokenInfo[];
  typography: TokenInfo[];
  sizes: TokenInfo[];
  other: TokenInfo[];
}

interface TokenInfo {
  name: string;
  description?: string;
}

// =============================================================================
// Main Generator
// =============================================================================

/**
 * Generate a token context section for AI system prompts
 * @param graph - StyleGraph with design tokens (can be null)
 * @returns Prompt section string
 */
export function generateTokenPromptSection(graph: StyleGraph | null): string {
  if (!graph || graph.nodes.size === 0) {
    return generateDefaultTokenPrompt();
  }

  const tokens = Array.from(graph.nodes.values());
  const summary = categorizeTokens(tokens);

  return formatTokenPrompt(summary, graph);
}

/**
 * Default prompt when no design language is loaded
 */
function generateDefaultTokenPrompt(): string {
  return `## Design Tokens

No custom design language is loaded. Use shadcn component variants (default, secondary, destructive, etc.) for styling.

Components automatically use the default theme. Explicit token references are not needed.`;
}

/**
 * Categorize tokens by type
 */
function categorizeTokens(tokens: StyleNode[]): TokenSummary {
  const summary: TokenSummary = {
    colors: [],
    typography: [],
    sizes: [],
    other: [],
  };

  // Filter to utility layer (semantic tokens) - exclude primitives and specs
  const semanticTokens = tokens.filter(
    (t) => t.layer === 'utility' && !t.metadata?.isSpec && !t.metadata?.deprecated
  );

  for (const token of semanticTokens) {
    const info: TokenInfo = {
      name: token.name,
      description: token.metadata?.description || token.intent?.purpose,
    };

    switch (token.type) {
      case 'color':
        summary.colors.push(info);
        break;
      case 'typography':
        summary.typography.push(info);
        break;
      case 'size':
        summary.sizes.push(info);
        break;
      default:
        summary.other.push(info);
    }
  }

  return summary;
}

/**
 * Format token summary into prompt text
 */
function formatTokenPrompt(summary: TokenSummary, graph: StyleGraph): string {
  const lines: string[] = ['## Design Tokens', ''];
  lines.push(
    'A custom design language is loaded. Components are automatically styled, but you can use explicit token references for custom styling.'
  );
  lines.push('');
  lines.push('### Token Reference Format');
  lines.push('Use `{ "token": "name" }` to reference a design token by name.');
  lines.push('');

  // Colors section
  if (summary.colors.length > 0) {
    lines.push('### Available Color Tokens');
    lines.push('');

    // Group by common shadcn token patterns
    const coreColors = findMatchingTokens(summary.colors, [
      'background',
      'foreground',
      'primary',
      'primary-foreground',
    ]);
    const surfaceColors = findMatchingTokens(summary.colors, [
      'card',
      'card-foreground',
      'muted',
      'muted-foreground',
      'popover',
      'popover-foreground',
    ]);
    const semanticColors = findMatchingTokens(summary.colors, [
      'destructive',
      'destructive-foreground',
      'accent',
      'accent-foreground',
      'secondary',
      'secondary-foreground',
    ]);
    const borderColors = findMatchingTokens(summary.colors, ['border', 'input', 'ring']);

    if (coreColors.length > 0) {
      lines.push(`**Core:** ${coreColors.join(', ')}`);
    }
    if (surfaceColors.length > 0) {
      lines.push(`**Surfaces:** ${surfaceColors.join(', ')}`);
    }
    if (semanticColors.length > 0) {
      lines.push(`**Semantic:** ${semanticColors.join(', ')}`);
    }
    if (borderColors.length > 0) {
      lines.push(`**Borders:** ${borderColors.join(', ')}`);
    }

    // Show count of additional tokens if any
    const listedCount = coreColors.length + surfaceColors.length + semanticColors.length + borderColors.length;
    const additionalCount = summary.colors.length - listedCount;
    if (additionalCount > 0) {
      lines.push(`**Additional:** ${additionalCount} more color tokens available`);
    }

    lines.push('');
  }

  // Typography section (if any)
  if (summary.typography.length > 0) {
    lines.push('### Typography Tokens');
    const typNames = summary.typography.slice(0, 10).map((t) => t.name);
    lines.push(`Available: ${typNames.join(', ')}${summary.typography.length > 10 ? '...' : ''}`);
    lines.push('');
  }

  // Sizes section (if any)
  if (summary.sizes.length > 0) {
    lines.push('### Size Tokens');
    const sizeNames = summary.sizes.slice(0, 10).map((t) => t.name);
    lines.push(`Available: ${sizeNames.join(', ')}${summary.sizes.length > 10 ? '...' : ''}`);
    lines.push('');
  }

  // Usage examples
  lines.push('### Usage Examples');
  lines.push('');
  lines.push('```json');
  lines.push('// Most components work without explicit tokens (use variants)');
  lines.push('{ "type": "Button", "props": { "label": "Save", "variant": "default" } }');
  lines.push('');
  lines.push('// Explicit token for custom color');
  lines.push('{ "type": "Text", "props": { "content": "Subtle text", "color": { "token": "muted-foreground" } } }');
  lines.push('```');
  lines.push('');
  lines.push(
    '**Note:** Only use explicit token references when you need to override default component styling.'
  );

  return lines.join('\n');
}

/**
 * Find tokens matching given patterns
 */
function findMatchingTokens(tokens: TokenInfo[], patterns: string[]): string[] {
  const matches: string[] = [];

  for (const pattern of patterns) {
    const token = tokens.find((t) => {
      const name = t.name.toLowerCase();
      const p = pattern.toLowerCase();
      // Match exact name or name ending with pattern
      return name === p || name.endsWith(`.${p}`) || name.endsWith(`-${p}`);
    });

    if (token) {
      matches.push(token.name);
    }
  }

  return matches;
}

// =============================================================================
// Exports for Testing
// =============================================================================

export { categorizeTokens, formatTokenPrompt, findMatchingTokens };
