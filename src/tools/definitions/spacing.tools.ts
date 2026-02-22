/**
 * Spacing/Size View Tool Definitions
 * Contextual tools specific to spacing scale analysis and sizing
 */

import { ToolDefinition } from '@/types/toolRegistry';

export const ANALYZE_SPACING_SCALE_TOOL: ToolDefinition = {
  name: 'analyze_spacing_scale',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'spacing',
  availableInViews: ['gallery', 'sizes'],
  description: 'Analyze if spacing/sizing follows a consistent scale (4px, 8px base grid, or custom). Detects base unit, checks adherence, identifies gaps.',
  parameters: {
    scope: {
      type: 'string',
      enum: ['all', 'spacing', 'sizing', 'primitives', 'utilities'],
      default: 'all',
      required: false,
      description: 'Which tokens to analyze',
    },
    expectedBase: {
      type: 'number',
      required: false,
      description: 'Expected base unit in pixels (e.g., 4, 8). If not provided, system will detect it.',
    },
  },
  returns: 'Spacing scale analysis with detected base unit, adherence score, gaps, and recommendations',
  defer_loading: true,
  input_examples: [
    { scope: 'all' },
    { scope: 'spacing', expectedBase: 8 },
    { scope: 'sizing', expectedBase: 4 },
  ],
};

export const CHECK_SPACING_CONSISTENCY_TOOL: ToolDefinition = {
  name: 'check_spacing_consistency',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'spacing',
  availableInViews: ['gallery', 'sizes'],
  description: 'Check for inconsistencies in spacing values. Find values that are off-grid, too close together, or break patterns.',
  parameters: {
    tolerance: {
      type: 'number',
      required: false,
      default: 1,
      description: 'Tolerance in pixels for off-grid detection (default: 1px)',
    },
    minDistance: {
      type: 'number',
      required: false,
      default: 4,
      description: 'Minimum distance between spacing values to avoid redundancy (default: 4px)',
    },
  },
  returns: 'Consistency analysis with off-grid values, redundant values, and pattern breaks',
  defer_loading: true,
  input_examples: [
    {},
    { tolerance: 2, minDistance: 8 },
  ],
};

export const SUGGEST_SPACING_TOKENS_TOOL: ToolDefinition = {
  name: 'suggest_spacing_tokens',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'spacing',
  availableInViews: ['gallery', 'sizes'],
  description: 'Suggest missing spacing/sizing tokens based on detected scale. Recommends values that fill gaps in the progression.',
  parameters: {
    baseUnit: {
      type: 'number',
      required: false,
      description: 'Base unit in pixels (e.g., 4, 8). If not provided, system will detect it.',
    },
    range: {
      type: 'object',
      required: false,
      properties: {
        min: { type: 'number', description: 'Minimum spacing value in px' },
        max: { type: 'number', description: 'Maximum spacing value in px' },
      },
      description: 'Range to suggest tokens for (default: 0-128px)',
    },
  },
  returns: 'Suggested spacing tokens with values, token names, and reasoning',
  defer_loading: true,
  input_examples: [
    {},
    { baseUnit: 8, range: { min: 0, max: 64 } },
  ],
};

export const VALIDATE_SIZE_HARMONY_TOOL: ToolDefinition = {
  name: 'validate_size_harmony',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'size',
  availableInViews: ['gallery', 'sizes'],
  description: 'Check if sizing tokens (width, height, max-width, etc.) form a harmonic progression. Validates ratios between sizes.',
  parameters: {
    sizeType: {
      type: 'string',
      enum: ['all', 'width', 'height', 'max-width', 'min-width'],
      default: 'all',
      required: false,
      description: 'Which size property to analyze',
    },
  },
  returns: 'Harmony analysis with ratio consistency, outliers, and recommendations',
  defer_loading: true,
  input_examples: [
    { sizeType: 'all' },
    { sizeType: 'width' },
  ],
};

export const SPACING_VIEW_TOOLS = [
  ANALYZE_SPACING_SCALE_TOOL,
  CHECK_SPACING_CONSISTENCY_TOOL,
  SUGGEST_SPACING_TOKENS_TOOL,
  VALIDATE_SIZE_HARMONY_TOOL,
];

