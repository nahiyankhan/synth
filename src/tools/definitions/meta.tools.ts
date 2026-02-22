/**
 * Meta Tools - Tool Discovery and Execution Layer
 * These tools allow discovery and execution of other tools
 */

import { ToolDefinition } from '../../types/toolRegistry';

export const META_TOOLS: ToolDefinition[] = [
  {
    name: 'get_design_system_operations',
    category: 'meta',
    description: 'List all available design system operations with their categories',
    parameters: {
      category: {
        type: 'string',
        required: false,
        description: 'Filter operations by category (query, modify, analyze, etc.)',
      },
    },
    returns: 'Object with operations array and categories list',
    examples: [
      {
        description: 'Get all operations',
        params: {},
      },
      {
        description: 'Get only query operations',
        params: { category: 'query' },
      },
    ],
  },
  {
    name: 'get_operation_info',
    category: 'meta',
    description: 'Get detailed information about a specific operation including parameters and return values',
    parameters: {
      operation: {
        type: 'string',
        required: true,
        description: 'Name of the operation to get info for',
      },
    },
    returns: 'Detailed operation information including parameters, returns, and side effects',
    examples: [
      {
        description: 'Get info about getToken operation',
        params: { operation: 'getToken' },
      },
    ],
  },
  {
    name: 'execute_operation',
    category: 'meta',
    description: 'Execute a design system operation with the given parameters',
    parameters: {
      operation: {
        type: 'string',
        required: true,
        description: 'Name of the operation to execute',
      },
      params: {
        type: 'object',
        required: true,
        description: 'Parameters for the operation',
      },
    },
    returns: 'Result of the operation execution',
    examples: [
      {
        description: 'Execute getToken operation',
        params: {
          operation: 'getToken',
          params: { path: 'base.color.blue.500' },
        },
      },
    ],
  },
];



