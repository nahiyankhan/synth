/**
 * Export Tool Definitions
 * Operations for exporting the design system
 */

import { ToolDefinition } from '../../types/toolRegistry';

export const EXPORT_DESIGN_SYSTEM_TOOL: ToolDefinition = {
  name: 'exportDesignSystem',
  version: '1.0.0',
  category: 'export',
  domainAwareness: 'agnostic',
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Export the design language to JSON or YAML format',
  parameters: {
    format: {
      type: 'string',
      enum: ['json', 'yaml'],
      default: 'json',
      required: false,
      description: 'Export format',
    },
  },
  returns: 'Serialized design language in specified format',
  defer_loading: true,
  input_examples: [
    { format: 'json' },
    { format: 'yaml' },
  ],
};

export const EXPORT_TAILWIND_CONFIG_TOOL: ToolDefinition = {
  name: 'exportTailwindConfig',
  version: '1.0.0',
  category: 'export',
  domainAwareness: 'agnostic',
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Export design system as Tailwind v4 CSS configuration that remaps default Tailwind classes to your design tokens',
  parameters: {
    exportType: {
      type: 'string',
      enum: ['theme', 'tokens', 'both'],
      default: 'both',
      required: false,
      description: 'Type of export: theme (remap defaults), tokens (direct utilities), or both',
    },
    includeReadme: {
      type: 'boolean',
      default: true,
      required: false,
      description: 'Include README with usage instructions',
    },
  },
  returns: 'Tailwind v4 CSS configuration files with remapped classes',
  defer_loading: true,
  input_examples: [
    { exportType: 'theme', includeReadme: true },
    { exportType: 'tokens', includeReadme: false },
    { exportType: 'both', includeReadme: true },
  ],
};

export const EXPORT_TOOLS = [
  EXPORT_DESIGN_SYSTEM_TOOL,
  EXPORT_TAILWIND_CONFIG_TOOL,
];

