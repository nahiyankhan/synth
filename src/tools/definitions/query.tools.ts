/**
 * Query Tool Definitions
 * Read-only operations for querying the design system
 */

import { ToolDefinition } from '@/types/toolRegistry';

export const GET_TOKEN_TOOL: ToolDefinition = {
  name: 'getToken',
  version: '1.0.0',
  category: 'query',
  domainAwareness: 'polymorphic',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Get detailed information about a specific design token by path',
  parameters: {
    path: {
      type: 'string',
      required: true,
      description: 'Full token path (e.g., "base.color.grey.65.light")',
    },
    mode: {
      type: 'string',
      enum: ['light', 'dark'],
      required: false,
      description: 'Mode to resolve value in',
    },
  },
  returns: 'TokenInfo object with path, layer, type, resolved values, dependencies, and dependents',
  defer_loading: false,
  input_examples: [
    { path: 'base.color.primary' },
    { path: 'semantic.color.text.standard', mode: 'dark' },
  ],
};

export const SEARCH_TOKENS_TOOL: ToolDefinition = {
  name: 'searchTokens',
  version: '1.0.0',
  category: 'query',
  domainAwareness: 'polymorphic',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Search for design tokens by query string, layer, or type. Returns summary by default to avoid context pollution.',
  parameters: {
    query: {
      type: 'string',
      required: false,
      description: 'Search query to match against paths and values',
    },
    layer: {
      type: 'string',
      enum: ['primitive', 'utility', 'composite'],
      required: false,
      description: 'Filter by layer',
    },
    type: {
      type: 'string',
      enum: ['color', 'typography', 'size', 'other'],
      required: false,
      description: 'Filter by type',
    },
    limit: {
      type: 'number',
      required: false,
      description: 'Max results to return (default: all)',
    },
    response_mode: {
      type: 'string',
      enum: ['summary', 'full', 'paginated'],
      default: 'summary',
      required: false,
      description: 'Control output verbosity',
    },
    page: {
      type: 'number',
      default: 1,
      required: false,
      description: 'Page number for paginated mode',
    },
    page_size: {
      type: 'number',
      default: 20,
      required: false,
      description: 'Items per page for paginated mode',
    },
  },
  returns: 'SearchResult with tokens (summary shows first 5, paginated shows page, full shows all)',
  defer_loading: false,
  supports_pagination: true,
  supports_filtering: true,
  input_examples: [
    { query: 'green', type: 'color', response_mode: 'summary' },
    { layer: 'primitive', type: 'size', response_mode: 'paginated', page: 1, page_size: 10 },
    { query: 'base.color', response_mode: 'full' },
  ],
};

export const FIND_ALL_REFERENCES_TOOL: ToolDefinition = {
  name: 'findAllReferences',
  version: '1.0.0',
  category: 'query',
  domainAwareness: 'polymorphic',
  supportedTypes: ['color', 'typography', 'size', 'spacing', 'other'],
  availableInViews: ['gallery', 'colors', 'typography', 'sizes', 'components', 'content', 'pages'],
  description: 'Find all tokens that reference (depend on) a specific token, including both direct and transitive references',
  parameters: {
    path: {
      type: 'string',
      required: true,
      description: 'Token path to find references for',
    },
    response_mode: {
      type: 'string',
      enum: ['summary', 'full'],
      default: 'summary',
      required: false,
      description: 'Control output verbosity',
    },
  },
  returns: 'List of direct and transitive references with usage count',
  defer_loading: true,
  supports_filtering: true,
  input_examples: [
    { path: 'base.color.black.light', response_mode: 'summary' },
    { path: 'base.spacing.medium', response_mode: 'full' },
  ],
};

export const QUERY_TOOLS = [
  GET_TOKEN_TOOL,
  SEARCH_TOKENS_TOOL,
  FIND_ALL_REFERENCES_TOOL,
];

