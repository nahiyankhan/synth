/**
 * ColorView Contextual Tools with Visual Feedback
 * Tools specific to color palette analysis and manipulation
 */

import { EnhancedToolDefinition } from '../types/enhancedTools';

export const COLOR_VIEW_TOOLS: EnhancedToolDefinition[] = [
  {
    name: 'find_similar_colors',
    description: 'Find perceptually similar colors that could be consolidated. Shows similarity clusters with recommendations.',
    category: 'query',
    defer_loading: true,
    
    parameters: {
      targetColor: {
        type: 'string',
        description: 'Token path (e.g., "color.primary.blue")',
        required: true
      },
      threshold: {
        type: 'number',
        description: 'Similarity threshold 0-1 (default 0.1)',
        default: 0.1,
        required: false
      }
    },
    
    returns: `{
  targetColor: {path, value, oklch},
  similarColors: Array<{
    path: string,
    value: string,
    distance: number,
    oklch: {...},
    recommendation: 'consolidate' | 'keep' | 'review'
  }>,
  groups: Array<{
    representative: {...},
    similar: [...],
    suggestion: string
  }>,
  consolidationOpportunity: boolean
}`,
    
    input_examples: [
      { targetColor: 'color.primary.blue', threshold: 0.1 },
      { targetColor: 'color.primitive.blue.500', threshold: 0.05 }
    ]
  },

  {
    name: 'adjust_colors_lightness',
    description: 'Preview lightness adjustments with 3 intensity options. Shows before/after with animated transition and component previews. Does NOT modify - returns proposals.',
    category: 'query',
    defer_loading: true,
    
    parameters: {
      colorPaths: {
        type: 'array',
        description: 'Array of color token paths to adjust',
        required: true
      },
      direction: {
        type: 'string',
        description: 'Direction to adjust: "lighter" or "darker"',
        enum: ['lighter', 'darker'],
        required: true
      },
      targetHue: {
        type: 'string',
        description: 'Optional: Hue family name (e.g., "blue") to filter colors',
        required: false
      }
    },
    
    returns: `{
  type: 'color',
  question: string,
  options: Array<{
    id: string,
    name: string,
    description: string,
    confidence: number,
    reasoning: string,
    preview: Array<{token, before, after, affectedCount}>,
    changesCount: number,
    affectedTokensCount: number,
    estimatedImpact: 'low' | 'medium' | 'high'
  }>,
  recommendedOptionId: string,
  allowCustom: true,
  affectedHues: string[],
  preservesHarmony: boolean,
  accessibilityImpact: 'positive' | 'neutral' | 'negative'
}`,
    
    sideEffects: 'None - returns preview proposals only. User must select option and confirm to apply.',
    
    input_examples: [
      {
        colorPaths: ['color.blue.500', 'color.blue.600', 'color.blue.700'],
        direction: 'lighter'
      },
      {
        colorPaths: ['*'],
        direction: 'lighter',
        targetHue: 'blue'
      }
    ]
  },

  {
    name: 'generate_color_scale',
    description: 'Generate complete color scale (100-900) from base color. Returns 3 algorithmic approaches (linear, perceptual, chroma-adjusted) for comparison.',
    category: 'query',
    defer_loading: true,
    
    parameters: {
      baseColor: {
        type: 'string',
        description: 'Token path or hex value',
        required: true
      },
      baseLevel: {
        type: 'number',
        description: 'Which level is the base? (100-900)',
        default: 500,
        required: false
      }
    },
    
    returns: `{
  baseColor: {path, value, oklch},
  baseLevel: number,
  options: Array<{
    id: string,
    name: string,
    description: string,
    confidence: number,
    reasoning: string,
    scale: Array<{level, hex, oklch, suggestedName}>,
    usageNotes: string
  }>,
  recommendedOptionId: string
}`,
    
    input_examples: [
      { baseColor: 'color.primitive.blue.500', baseLevel: 500 },
      { baseColor: '#0066FF', baseLevel: 500 }
    ]
  },

  {
    name: 'check_lightness_scale',
    description: 'Check if a hue family has proper lightness progression. Shows gaps visually with suggested fill colors.',
    category: 'analyze',
    defer_loading: true,
    
    parameters: {
      hueFamily: {
        type: 'string',
        description: 'Hue name or token prefix (e.g., "blue", "color.blue")',
        required: true
      }
    },
    
    returns: `{
  hueFamily: string,
  colors: Array<{path, lightness, value, oklch}>,
  gaps: Array<{missingLightness, suggestedName, suggestedValue}>,
  scaleType: 'complete' | 'partial' | 'irregular',
  recommendation: string,
  lightnessRange: [number, number],
  idealScale: number[]
}`,
    
    input_examples: [
      { hueFamily: 'blue' },
      { hueFamily: 'color.blue' }
    ]
  },

  {
    name: 'check_color_contrast',
    description: 'Check WCAG contrast ratio between two colors with visual preview on text samples.',
    category: 'analyze',
    defer_loading: true,
    
    parameters: {
      foreground: {
        type: 'string',
        description: 'Foreground color token path',
        required: true
      },
      background: {
        type: 'string',
        description: 'Background color token path',
        required: true
      }
    },
    
    returns: `{
  contrastRatio: number,
  wcagAA: {normalText: boolean, largeText: boolean},
  wcagAAA: {normalText: boolean, largeText: boolean},
  recommendation: string,
  preview: {normalText: string, largeText: string}
}`,
    
    input_examples: [
      {
        foreground: 'color.text.primary',
        background: 'color.background'
      },
      {
        foreground: 'color.utility.text',
        background: 'color.utility.background'
      }
    ]
  },

  {
    name: 'group_colors_by_hue',
    description: 'Organize colors into hue families with visual clustering.',
    category: 'analyze',
    defer_loading: true,
    
    parameters: {
      scope: {
        type: 'string',
        enum: ['all', 'primitives', 'utilities'],
        default: 'all',
        required: false
      }
    },
    
    returns: `{
  hueGroups: Array<{
    hueName: string,
    hueRange: [number, number],
    colors: Array<{path, value, oklch}>,
    count: number,
    averageLightness: number,
    averageChroma: number
  }>,
  dominantHues: string[],
  underrepresentedHues: string[]
}`,
    
    input_examples: [
      { scope: 'all' },
      { scope: 'primitives' }
    ]
  },

  {
    name: 'select_colors',
    description: 'Select colors in the color view. Default selects all visible colors (or current filtered set). Optional filter parameter searches first, then selects matches.',
    category: 'navigate',
    defer_loading: true,
    
    parameters: {
      filter: {
        type: 'string',
        description: 'Optional color filter (e.g., "green", "blue", "red 500"). If provided, searches for matching colors first, then selects them.',
        required: false
      },
      scope: {
        type: 'string',
        enum: ['all', 'primitives', 'utilities'],
        default: 'all',
        description: 'Which color layer to select from',
        required: false
      }
    },
    
    returns: `{
  colors: Array<{
    path: string,
    value: string,
    oklch: {l, c, h},
    layer: string
  }>,
  filter: string | undefined,
  scope: string,
  count: number
}`,
    
    input_examples: [
      { scope: 'all' }, // Select all visible colors
      { filter: 'green', scope: 'all' }, // Find and select green colors
      { filter: 'blue 500' }, // Find and select blue-500 colors
      { filter: 'red', scope: 'primitives' } // Find and select red colors in primitives
    ]
  }
];

// Export tool names for easy checking
export const COLOR_VIEW_TOOL_NAMES = COLOR_VIEW_TOOLS.map(t => t.name);

export function isColorViewTool(toolName: string): boolean {
  return COLOR_VIEW_TOOL_NAMES.includes(toolName);
}





