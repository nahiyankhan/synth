/**
 * Modify Tool Definitions
 * Operations that modify the design system state
 */

import { ToolDefinition } from '@/types/toolRegistry';

export const CREATE_TOKEN_TOOL: ToolDefinition = {
  name: 'createToken',
  version: '1.0.0',
  category: 'modify',
  domainAwareness: 'polymorphic',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Create a new design token',
  parameters: {
    path: {
      type: 'string',
      required: true,
      description: 'Full path for new token',
    },
    value: {
      type: 'string',
      required: true,
      description: 'Token value (primitive or reference)',
    },
    layer: {
      type: 'string',
      enum: ['primitive', 'utility'],
      required: true,
      description: 'Token layer',
    },
    type: {
      type: 'string',
      enum: ['color', 'typography', 'size', 'other'],
      required: true,
      description: 'Token type',
    },
    description: {
      type: 'string',
      required: false,
      description: 'Token description',
    },
  },
  returns: 'Created token info with path, value, and version',
  sideEffects: 'Adds new token to design system, adds to history',
  defer_loading: false,
  input_examples: [
    {
      path: 'base.color.accent',
      value: '#FF6B6B',
      layer: 'primitive',
      type: 'color',
    },
    {
      path: 'semantic.color.error',
      value: '{base.color.red.60}',
      layer: 'utility',
      type: 'color',
    },
    {
      path: 'base.spacing.compact',
      value: '4',
      layer: 'primitive',
      type: 'size',
      description: 'Tight spacing for dense layouts',
    },
  ],
};

export const UPDATE_TOKEN_TOOL: ToolDefinition = {
  name: 'updateToken',
  version: '1.0.0',
  category: 'modify',
  domainAwareness: 'polymorphic',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Update the value of an existing design token',
  parameters: {
    path: {
      type: 'string',
      required: true,
      description: 'Full token path to update',
    },
    value: {
      type: 'string',
      required: true,
      description: 'New value (primitive or reference like "{base.color.black.light}")',
    },
    description: {
      type: 'string',
      required: false,
      description: 'Change description for history',
    },
  },
  returns: 'Updated token info with old/new values and version',
  sideEffects: 'Modifies design system state, affects dependents, adds to history',
  defer_loading: false,
  input_examples: [
    { path: 'base.color.primary', value: '#1A5F7A' },
    { path: 'semantic.color.brand', value: '{base.color.primary}' },
    {
      path: 'base.spacing.large',
      value: '24',
      description: 'Increased for better readability',
    },
  ],
};

export const DELETE_TOKEN_TOOL: ToolDefinition = {
  name: 'deleteToken',
  version: '1.0.0',
  category: 'modify',
  domainAwareness: 'polymorphic',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Delete a design token (warns if has dependents)',
  parameters: {
    path: {
      type: 'string',
      required: true,
      description: 'Full token path to delete',
    },
    force: {
      type: 'boolean',
      required: false,
      default: false,
      description: 'Force deletion even with dependents',
    },
  },
  returns: 'Deletion confirmation',
  sideEffects: 'Removes token from design system, may break dependents, adds to history',
  defer_loading: true,
  input_examples: [
    { path: 'base.color.deprecated', force: false },
    { path: 'base.spacing.legacy', force: true },
  ],
};

export const RENAME_TOKEN_TOOL: ToolDefinition = {
  name: 'renameToken',
  version: '1.0.0',
  category: 'modify',
  domainAwareness: 'polymorphic',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Rename a token and automatically update all references throughout the design system. This is the safe way to change token paths.',
  parameters: {
    oldPath: {
      type: 'string',
      required: true,
      description: 'Current token path (e.g., "base.color.primary")',
    },
    newPath: {
      type: 'string',
      required: true,
      description: 'New token path (e.g., "base.color.brand")',
    },
  },
  returns: 'Success confirmation with details of renamed token and updated references',
  sideEffects: 'Renames token, updates all dependent tokens that reference it, adds to history',
  defer_loading: true,
  input_examples: [
    { oldPath: 'base.color.primary', newPath: 'base.color.brand' },
    {
      oldPath: 'semantic.spacing.default',
      newPath: 'semantic.spacing.standard',
    },
  ],
};

export const FIND_AND_REPLACE_TOOL: ToolDefinition = {
  name: 'findAndReplace',
  version: '1.0.0',
  category: 'modify',
  domainAwareness: 'polymorphic',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Find and replace patterns across token paths or values. Supports exact match, contains, or regex patterns. Use dryRun to preview changes.',
  parameters: {
    searchPattern: {
      type: 'string',
      required: true,
      description: 'Pattern to search for (exact text or regex)',
    },
    replaceWith: {
      type: 'string',
      required: true,
      description: 'Replacement text',
    },
    searchIn: {
      type: 'string',
      enum: ['path', 'value', 'both'],
      required: true,
      description: 'Where to search',
    },
    matchType: {
      type: 'string',
      enum: ['exact', 'contains', 'regex'],
      required: true,
      description: 'How to match the pattern',
    },
    layer: {
      type: 'string',
      enum: ['primitive', 'utility'],
      required: false,
      description: 'Optional: filter by layer',
    },
    type: {
      type: 'string',
      enum: ['color', 'typography', 'size', 'spacing', 'other'],
      required: false,
      description: 'Optional: filter by type',
    },
    dryRun: {
      type: 'boolean',
      required: false,
      default: true,
      description: 'Preview changes without applying them',
    },
    response_mode: {
      type: 'string',
      enum: ['summary', 'paginated'],
      default: 'summary',
      required: false,
    },
    page: {
      type: 'number',
      default: 1,
      required: false,
    },
    page_size: {
      type: 'number',
      default: 20,
      required: false,
    },
  },
  returns: 'Array of matches with before/after values and update status',
  sideEffects: 'If dryRun=false, modifies matching tokens and adds to history',
  defer_loading: true,
  supports_pagination: true,
  supports_filtering: true,
  input_examples: [
    {
      searchPattern: 'grey',
      replaceWith: 'gray',
      searchIn: 'path',
      matchType: 'contains',
      dryRun: true,
      response_mode: 'summary',
    },
    {
      searchPattern: '#000000',
      replaceWith: '#1A1A1A',
      searchIn: 'value',
      matchType: 'exact',
      layer: 'primitive',
      dryRun: false,
    },
  ],
};

export const MODIFY_TOOLS = [
  CREATE_TOKEN_TOOL,
  UPDATE_TOKEN_TOOL,
  DELETE_TOKEN_TOOL,
  RENAME_TOKEN_TOOL,
  FIND_AND_REPLACE_TOOL,
];

