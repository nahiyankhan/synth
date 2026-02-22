/**
 * Typography View Tool Definitions
 * Contextual tools specific to type scale analysis and typography
 */

import { ToolDefinition } from '../../types/toolRegistry';

export const ANALYZE_TYPE_SCALE_TOOL: ToolDefinition = {
  name: 'analyze_type_scale',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'typography',
  availableInViews: ['gallery', 'typography'],
  description: 'Analyze if typography follows a harmonic progression (modular scale). Detects ratios like 1.25 (major third), 1.333 (perfect fourth), 1.414 (augmented fourth), 1.5 (perfect fifth), 1.618 (golden ratio).',
  parameters: {
    scope: {
      type: 'string',
      enum: ['all', 'primitives', 'utilities'],
      default: 'all',
      required: false,
      description: 'Which typography tokens to analyze',
    },
    expectedRatio: {
      type: 'number',
      required: false,
      description: 'Expected modular scale ratio (e.g., 1.25, 1.333, 1.5). If not provided, system will detect it.',
    },
  },
  returns: 'Type scale analysis with detected ratio, gaps, adherence score, and recommendations',
  defer_loading: true,
  input_examples: [
    { scope: 'all' },
    { scope: 'primitives', expectedRatio: 1.333 },
  ],
};

export const CHECK_READABILITY_TOOL: ToolDefinition = {
  name: 'check_readability',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'typography',
  availableInViews: ['gallery', 'typography'],
  description: 'Validate line-height to font-size ratios for optimal readability. Body text should be 1.4-1.6, headings 1.1-1.3, display text 1.0-1.2.',
  parameters: {
    context: {
      type: 'string',
      enum: ['all', 'body', 'heading', 'display'],
      default: 'all',
      required: false,
      description: 'Which text context to check',
    },
  },
  returns: 'Readability analysis with line-height scores, warnings, and recommendations',
  defer_loading: true,
  input_examples: [
    { context: 'all' },
    { context: 'body' },
  ],
};

export const SUGGEST_TYPE_HIERARCHY_TOOL: ToolDefinition = {
  name: 'suggest_type_hierarchy',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'typography',
  availableInViews: ['gallery', 'typography'],
  description: 'Analyze current typography hierarchy and suggest missing levels (h1-h6, body, small). Recommends sizes that fit the detected modular scale.',
  parameters: {
    baseSize: {
      type: 'number',
      required: false,
      default: 16,
      description: 'Base font size in pixels (typically 16)',
    },
    ratio: {
      type: 'number',
      required: false,
      description: 'Modular scale ratio (e.g., 1.25, 1.333). If not provided, system will detect it.',
    },
  },
  returns: 'Hierarchy analysis with current levels, missing levels, and suggested sizes',
  defer_loading: true,
  input_examples: [
    { baseSize: 16 },
    { baseSize: 16, ratio: 1.333 },
  ],
};

export const ANALYZE_LETTER_SPACING_TOOL: ToolDefinition = {
  name: 'analyze_letter_spacing',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'typography',
  availableInViews: ['gallery', 'typography'],
  description: 'Check if letter-spacing (tracking) is appropriate for font sizes. Large text typically needs negative tracking, small text needs positive tracking.',
  parameters: {
    scope: {
      type: 'string',
      enum: ['all', 'display', 'body', 'small'],
      default: 'all',
      required: false,
      description: 'Which size range to analyze',
    },
  },
  returns: 'Letter-spacing analysis with recommendations for each size range',
  defer_loading: true,
  input_examples: [
    { scope: 'all' },
    { scope: 'display' },
  ],
};

export const TYPOGRAPHY_VIEW_TOOLS = [
  ANALYZE_TYPE_SCALE_TOOL,
  CHECK_READABILITY_TOOL,
  SUGGEST_TYPE_HIERARCHY_TOOL,
  ANALYZE_LETTER_SPACING_TOOL,
];

