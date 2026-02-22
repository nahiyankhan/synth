/**
 * Color View Tool Definitions
 * Contextual tools specific to color palette analysis and manipulation
 */

import { ToolDefinition } from '../../types/toolRegistry';

export const FIND_SIMILAR_COLORS_TOOL: ToolDefinition = {
  name: 'find_similar_colors',
  version: '1.0.0',
  category: 'query',
  domainAwareness: 'specific',
  specificDomain: 'color',
  availableInViews: ['gallery', 'colors'],
  description: 'Find perceptually similar colors that could be consolidated. Shows similarity clusters with recommendations.',
  parameters: {
    targetColor: {
      type: 'string',
      required: true,
      description: 'Token path (e.g., "color.primary.blue")',
    },
    threshold: {
      type: 'number',
      default: 0.1,
      required: false,
      description: 'Similarity threshold 0-1 (default 0.1)',
    },
  },
  returns: 'List of similar colors with distance metrics and consolidation recommendations',
  defer_loading: true,
  input_examples: [
    { targetColor: 'color.primary.blue', threshold: 0.1 },
    { targetColor: 'color.primitive.blue.500', threshold: 0.05 },
  ],
};

export const ADJUST_COLORS_LIGHTNESS_TOOL: ToolDefinition = {
  name: 'adjust_colors_lightness',
  version: '1.0.0',
  category: 'query',
  domainAwareness: 'specific',
  specificDomain: 'color',
  availableInViews: ['gallery', 'colors'],
  description: 'Preview lightness adjustments with 3 intensity options. Shows before/after with animated transition and component previews. Does NOT modify - returns proposals.',
  parameters: {
    colorPaths: {
      type: 'array',
      required: true,
      description: 'Array of color token paths to adjust',
    },
    direction: {
      type: 'string',
      enum: ['lighter', 'darker'],
      required: true,
      description: 'Direction to adjust: "lighter" or "darker"',
    },
    targetHue: {
      type: 'string',
      required: false,
      description: 'Optional: Hue family name (e.g., "blue") to filter colors',
    },
  },
  returns: 'Proposal options with before/after previews, affected token counts, and impact estimates',
  sideEffects: 'None - returns preview proposals only. User must select option and confirm to apply.',
  defer_loading: true,
  input_examples: [
    {
      colorPaths: ['color.blue.500', 'color.blue.600', 'color.blue.700'],
      direction: 'lighter',
    },
    {
      colorPaths: ['*'],
      direction: 'lighter',
      targetHue: 'blue',
    },
  ],
};

export const GENERATE_COLOR_SCALE_CV_TOOL: ToolDefinition = {
  name: 'generate_color_scale',
  version: '1.0.0',
  category: 'query',
  domainAwareness: 'specific',
  specificDomain: 'color',
  availableInViews: ['gallery', 'colors'],
  description: 'Generate complete color scale (100-900) from base color. Returns 3 algorithmic approaches (linear, perceptual, chroma-adjusted) for comparison.',
  parameters: {
    baseColor: {
      type: 'string',
      required: true,
      description: 'Token path or hex value',
    },
    baseLevel: {
      type: 'number',
      default: 500,
      required: false,
      description: 'Which level is the base? (100-900)',
    },
  },
  returns: 'Multiple scale options with different algorithms for user to choose from',
  defer_loading: true,
  input_examples: [
    { baseColor: 'color.primitive.blue.500', baseLevel: 500 },
    { baseColor: '#0066FF', baseLevel: 500 },
  ],
};

export const CHECK_LIGHTNESS_SCALE_TOOL: ToolDefinition = {
  name: 'check_lightness_scale',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'color',
  availableInViews: ['gallery', 'colors'],
  description: 'Check if a hue family has proper lightness progression. Shows gaps visually with suggested fill colors.',
  parameters: {
    hueFamily: {
      type: 'string',
      required: true,
      description: 'Hue name or token prefix (e.g., "blue", "color.blue")',
    },
  },
  returns: 'Analysis of lightness progression with gap detection and fill suggestions',
  defer_loading: true,
  input_examples: [
    { hueFamily: 'blue' },
    { hueFamily: 'color.blue' },
  ],
};

export const CHECK_COLOR_CONTRAST_TOOL: ToolDefinition = {
  name: 'check_color_contrast',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'color',
  availableInViews: ['gallery', 'colors'],
  description: 'Check WCAG contrast ratio between two colors with visual preview on text samples.',
  parameters: {
    foreground: {
      type: 'string',
      required: true,
      description: 'Foreground color token path',
    },
    background: {
      type: 'string',
      required: true,
      description: 'Background color token path',
    },
  },
  returns: 'Contrast ratio and WCAG compliance levels with visual previews',
  defer_loading: true,
  input_examples: [
    {
      foreground: 'color.text.primary',
      background: 'color.background',
    },
    {
      foreground: 'color.utility.text',
      background: 'color.utility.background',
    },
  ],
};

export const GROUP_COLORS_BY_HUE_TOOL: ToolDefinition = {
  name: 'group_colors_by_hue',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'color',
  availableInViews: ['gallery', 'colors'],
  description: 'Organize colors into hue families with visual clustering.',
  parameters: {
    scope: {
      type: 'string',
      enum: ['all', 'primitives', 'utilities'],
      default: 'all',
      required: false,
      description: 'Which colors to group',
    },
  },
  returns: 'Colors organized by hue family with statistics',
  defer_loading: true,
  input_examples: [
    { scope: 'all' },
    { scope: 'primitives' },
  ],
};

export const SELECT_COLORS_TOOL: ToolDefinition = {
  name: 'select_colors',
  version: '1.0.0',
  category: 'navigate',
  domainAwareness: 'specific',
  specificDomain: 'color',
  availableInViews: ['gallery', 'colors'],
  description: 'Select colors in the color view. Default selects all visible colors (or current filtered set). Optional filter parameter searches first, then selects matches.',
  parameters: {
    filter: {
      type: 'string',
      required: false,
      description: 'Optional color filter (e.g., "green", "blue", "red 500"). If provided, searches for matching colors first, then selects them.',
    },
    scope: {
      type: 'string',
      enum: ['all', 'primitives', 'utilities'],
      default: 'all',
      required: false,
      description: 'Which color layer to select from',
    },
  },
  returns: 'Array of selected color nodes with their paths and hex values',
  defer_loading: true,
  input_examples: [
    { scope: 'all' }, // Select all visible colors
    { filter: 'green', scope: 'all' }, // Find and select green colors
    { filter: 'blue 500' }, // Find and select blue-500 colors
    { filter: 'red', scope: 'primitives' }, // Find and select red colors in primitives
  ],
};

export const SUGGEST_COLORS_FOR_GAPS_TOOL: ToolDefinition = {
  name: 'suggestColorsForGaps',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'specific',
  specificDomain: 'color',
  availableInViews: ['gallery', 'colors'],
  description: 'Analyze color distribution in OKLCH space, detect gaps in the color progression, and suggest colors to fill those gaps for a more complete palette',
  parameters: {
    filter: {
      type: 'string',
      enum: ['all', 'primitives', 'utilities'],
      default: 'all',
      required: false,
      description: 'Which colors to analyze',
    },
    threshold: {
      type: 'number',
      required: false,
      default: 0.15,
      description: 'Gap detection threshold (OKLCH distance, typically 0.1-0.2)',
    },
    maxSuggestions: {
      type: 'number',
      required: false,
      default: 10,
      description: 'Maximum number of color suggestions to return',
    },
  },
  returns: 'Array of gap locations with suggested colors (hex values) to fill them',
  defer_loading: true,
  input_examples: [
    { filter: 'primitives', threshold: 0.15, maxSuggestions: 5 },
    { filter: 'all', maxSuggestions: 10 },
  ],
};

export const COLOR_VIEW_TOOLS = [
  FIND_SIMILAR_COLORS_TOOL,
  ADJUST_COLORS_LIGHTNESS_TOOL,
  GENERATE_COLOR_SCALE_CV_TOOL,
  CHECK_LIGHTNESS_SCALE_TOOL,
  CHECK_COLOR_CONTRAST_TOOL,
  GROUP_COLORS_BY_HUE_TOOL,
  SELECT_COLORS_TOOL,
  SUGGEST_COLORS_FOR_GAPS_TOOL,
];

