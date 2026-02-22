/**
 * Navigation Tool Definitions
 * Operations for navigating between pages and managing design languages
 */

import { ToolDefinition } from '@/types/toolRegistry';

// DISABLED: get_design_system_preview
// export const GET_DESIGN_SYSTEM_PREVIEW_TOOL: ToolDefinition = {
//   name: 'get_design_system_preview',
//   version: '1.0.0',
//   category: 'navigation',
//   description: 'Get preview information about a specific design language without loading it fully',
//   parameters: {
//     id: {
//       type: 'string',
//       required: true,
//       description: 'Design language ID or name (supports fuzzy matching)',
//     },
//   },
//   returns: 'Design language metadata with preview statistics',
//   defer_loading: false,
//   input_examples: [
//     { id: 'my-design-system' },
//     { id: 'my-design-system' },
//   ],
// };

export const LOAD_DESIGN_SYSTEM_TOOL: ToolDefinition = {
  name: 'load_design_system',
  version: '1.0.0',
  category: 'navigation',
  domainAwareness: 'agnostic',
  availableInViews: ['gallery'],
  description: 'Load a design language into the editor for editing',
  parameters: {
    id: {
      type: 'string',
      required: true,
      description: 'Design language ID or name (supports fuzzy matching)',
    },
  },
  returns: 'Success confirmation',
  sideEffects: 'Navigates to editor page and loads the design language',
  defer_loading: false,
  input_examples: [
    { id: 'my-design-system' },
    { id: 'brand-theme' },
  ],
};

export const CREATE_NEW_DESIGN_SYSTEM_TOOL: ToolDefinition = {
  name: 'create_new_design_system',
  version: '1.0.0',
  category: 'navigation',
  domainAwareness: 'agnostic',
  availableInViews: ['gallery'],
  description: 'Navigate to generation mode to create a brand new design language from scratch',
  parameters: {},
  returns: 'Success confirmation',
  sideEffects: 'Navigates to editor in generation mode',
  defer_loading: false,
};

export const DELETE_DESIGN_SYSTEM_TOOL: ToolDefinition = {
  name: 'delete_design_system',
  version: '1.0.0',
  category: 'navigation',
  domainAwareness: 'agnostic',
  availableInViews: ['gallery'],
  description: 'Delete a design language from the database permanently',
  parameters: {
    id: {
      type: 'string',
      required: true,
      description: 'Design language ID or name (supports fuzzy matching)',
    },
  },
  returns: 'Success confirmation',
  sideEffects: 'Permanently deletes the design language from IndexedDB',
  defer_loading: false,
  input_examples: [
    { id: 'old-system' },
  ],
};

export const NAVIGATE_TO_VIEW_TOOL: ToolDefinition = {
  name: 'navigate_to_view',
  version: '1.0.0',
  category: 'navigation',
  domainAwareness: 'agnostic',
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Navigate to a specific view within the editor (colors, typography, sizes, components, content, pages, or gallery)',
  parameters: {
    view: {
      type: 'string',
      enum: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
      required: true,
      description: 'The view to navigate to',
    },
  },
  returns: 'Success confirmation',
  sideEffects: 'Changes the active view in the editor',
  defer_loading: false,
  input_examples: [
    { view: 'colors' },
    { view: 'typography' },
    { view: 'pages' },
    { view: 'gallery' },
  ],
};

export const SHOW_SPLIT_VIEW_TOOL: ToolDefinition = {
  name: 'show_split_view',
  version: '1.0.0',
  category: 'navigation',
  domainAwareness: 'agnostic',
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Show two views side by side in the editor for easy comparison and cross-reference',
  parameters: {
    left: {
      type: 'string',
      enum: ['colors', 'typography', 'sizes', 'components', 'content', 'pages'],
      required: true,
      description: 'The view to show on the left side',
    },
    right: {
      type: 'string',
      enum: ['colors', 'typography', 'sizes', 'components', 'content', 'pages'],
      required: true,
      description: 'The view to show on the right side',
    },
  },
  returns: 'Success confirmation with left and right views',
  sideEffects: 'Changes the editor to split-view layout with two views side by side',
  defer_loading: false,
  input_examples: [
    { left: 'colors', right: 'components' },
    { left: 'typography', right: 'sizes' },
    { left: 'colors', right: 'typography' },
    { left: 'pages', right: 'colors' },
  ],
};

export const NAVIGATION_TOOLS = [
  // LIST_DESIGN_SYSTEMS_TOOL, // DELETED - unnecessary
  // GET_DESIGN_SYSTEM_PREVIEW_TOOL, // DISABLED
  LOAD_DESIGN_SYSTEM_TOOL,
  CREATE_NEW_DESIGN_SYSTEM_TOOL,
  DELETE_DESIGN_SYSTEM_TOOL,
  NAVIGATE_TO_VIEW_TOOL,
  SHOW_SPLIT_VIEW_TOOL,
];

