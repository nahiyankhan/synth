/**
 * Create Tool Definitions
 * Operations for generating/creating design system elements
 */

import { ToolDefinition } from '@/types/toolRegistry';

export const GENERATE_COLOR_SCALE_TOOL: ToolDefinition = {
  name: 'generateColorScale',
  version: '1.0.0',
  category: 'create',
  domainAwareness: 'specific',
  specificDomain: 'color',
  availableInViews: ['gallery', 'colors'],
  description: 'Generate a perceptually uniform color scale from a base color using OKLCH color space. Creates a range from light tints to dark shades.',
  parameters: {
    baseColor: {
      type: 'string',
      required: true,
      description: 'Base hex color (e.g., "#3B82F6")',
    },
    steps: {
      type: 'number',
      required: false,
      default: 9,
      description: 'Number of steps in the scale (typically 5, 9, or 11)',
    },
    namingPattern: {
      type: 'string',
      required: true,
      description: 'Path pattern with {step} placeholder (e.g., "base.color.blue.{step}")',
    },
    layer: {
      type: 'string',
      enum: ['primitive', 'utility'],
      default: 'primitive',
      required: false,
      description: 'Layer to create tokens in',
    },
  },
  returns: 'Array of created color tokens with their hex values',
  sideEffects: 'Creates new color tokens in the design system, adds to history',
  defer_loading: true,
  input_examples: [
    {
      baseColor: '#3B82F6',
      steps: 9,
      namingPattern: 'base.color.blue.{step}',
      layer: 'primitive',
    },
    {
      baseColor: '#10B981',
      steps: 5,
      namingPattern: 'semantic.success.{step}',
    },
    {
      baseColor: '#EF4444',
      steps: 11,
      namingPattern: 'base.color.red.{step}',
    },
  ],
};

export const GENERATE_DESIGN_SYSTEM_TOOL: ToolDefinition = {
  name: 'generate_design_system',
  version: '1.0.0',
  category: 'generation',
  domainAwareness: 'agnostic',
  availableInViews: ['gallery'],
  description: 'Generate a complete design system from natural language description. Creates a new design language with colors, typography, and spacing tokens using AI. The system will be saved and can be accessed from the landing page.',
  parameters: {
    prompt: {
      type: 'string',
      required: true,
      description: "User's description of the design system to generate (e.g., 'fintech app', 'healthcare product', 'developer tool')",
    },
    focus: {
      type: 'string',
      enum: ['full', 'colors', 'typography'],
      default: 'full',
      required: false,
      description: "Generation scope: 'full' generates complete system, 'colors' only colors, 'typography' only typography",
    },
  },
  returns: 'Generation result with language ID and token count',
  sideEffects: 'Creates and saves a new design language to the database',
  defer_loading: false,
  input_examples: [
    { prompt: 'A design system for a fintech app that needs to feel trustworthy and professional' },
    { prompt: 'Create colors for a healthcare product', focus: 'colors' },
    { prompt: 'Modern design system for a developer tool with dark mode support' },
  ],
};

export const CREATE_TOOLS = [
  GENERATE_COLOR_SCALE_TOOL,
  GENERATE_DESIGN_SYSTEM_TOOL,
];

