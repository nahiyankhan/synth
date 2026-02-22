/**
 * Analyze Tool Definitions
 * Operations for analyzing and understanding the design system
 */

import { ToolDefinition } from '../../types/toolRegistry';

export const GET_IMPACT_ANALYSIS_TOOL: ToolDefinition = {
  name: 'getImpactAnalysis',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'polymorphic',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Analyze the impact of changing a token. Returns summary of affected tokens.',
  parameters: {
    path: {
      type: 'string',
      required: true,
      description: 'Full token path to analyze',
    },
    response_mode: {
      type: 'string',
      enum: ['summary', 'full'],
      default: 'summary',
      required: false,
    },
  },
  returns: 'ImpactAnalysisResult with affected tokens count and summary',
  defer_loading: true,
  supports_filtering: true,
  input_examples: [
    { path: 'base.color.primary', response_mode: 'summary' },
    { path: 'base.spacing.medium', response_mode: 'full' },
  ],
};

export const GET_SYSTEM_STATS_TOOL: ToolDefinition = {
  name: 'getSystemStats',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'agnostic',
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Get overall statistics about the design language',
  parameters: {
    includeSpecs: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Include composite specs in statistics',
    },
  },
  returns: 'Language statistics with token counts by layer/type, depth, circular dependencies',
  defer_loading: true,
  input_examples: [
    { includeSpecs: false },
    { includeSpecs: true },
  ],
};

export const ANALYZE_DESIGN_SYSTEM_TOOL: ToolDefinition = {
  name: 'analyzeDesignSystem',
  version: '1.0.0',
  category: 'analyze',
  domainAwareness: 'polymorphic',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Comprehensive data scientist-style analysis of the design system including usage patterns, redundancies, health metrics, and optimization opportunities. Returns both structured data and narrative insights with specific recommendations.',
  parameters: {
    category: {
      type: 'string',
      enum: ['all', 'usage', 'redundancy', 'health', 'optimization'],
      default: 'all',
      required: false,
      description: 'Filter analysis by category',
    },
    layer: {
      type: 'string',
      enum: ['primitive', 'utility', 'composite'],
      required: false,
      description: 'Optional: focus analysis on specific layer',
    },
    type: {
      type: 'string',
      enum: ['color', 'typography', 'size', 'spacing', 'other'],
      required: false,
      description: 'Optional: focus analysis on specific type',
    },
    response_mode: {
      type: 'string',
      enum: ['summary', 'full'],
      default: 'summary',
      required: false,
    },
  },
  returns: 'DesignSystemAnalysis with usage metrics, redundancy detection, health assessment, optimization opportunities, and narrative insights',
  defer_loading: true,
  supports_filtering: true,
  input_examples: [
    { category: 'health', response_mode: 'summary' },
    { category: 'redundancy', type: 'color', response_mode: 'full' },
    { category: 'usage', layer: 'primitive' },
  ],
};

// MOVED: suggestColorsForGaps → colorView.tools.ts (color-specific)

export const ANALYZE_TOOLS = [
  GET_IMPACT_ANALYSIS_TOOL,
  GET_SYSTEM_STATS_TOOL,
  ANALYZE_DESIGN_SYSTEM_TOOL,
];

