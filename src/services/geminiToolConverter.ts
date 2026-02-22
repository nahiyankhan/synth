/**
 * Gemini Tool Converter
 * Converts enhanced tool definitions to Gemini-compatible format
 * Implements lazy loading via tool search
 */

import { EnhancedToolDefinition } from '@/types/enhancedTools';
import { ENHANCED_OPERATIONS } from './enhancedToolDefinitions';
import { toolSearchService } from './toolSearchService';

/**
 * Convert enhanced parameter to Gemini format
 */
function convertParameterToGemini(param: any): any {
  const geminiParam: any = {
    type: param.type === 'number' ? 'NUMBER' : 'STRING',
  };

  if (param.description) {
    geminiParam.description = param.description;
  }

  if (param.enum) {
    geminiParam.enum = param.enum;
  }

  return geminiParam;
}

/**
 * Convert enhanced tool definition to Gemini format
 */
function convertToolToGemini(tool: EnhancedToolDefinition, includeExamples: boolean = true): any {
  const properties: any = {};
  const required: string[] = [];

  // Convert parameters
  for (const [paramName, param] of Object.entries(tool.parameters)) {
    properties[paramName] = convertParameterToGemini(param);
    if (param.required) {
      required.push(paramName);
    }
  }

  // Build description with examples if available
  let fullDescription = tool.description;
  
  if (includeExamples && tool.input_examples && tool.input_examples.length > 0) {
    fullDescription += '\n\nExamples:';
    tool.input_examples.forEach((example, idx) => {
      fullDescription += `\n${idx + 1}. ${JSON.stringify(example)}`;
    });
  }

  // Add return type info
  if (tool.returns) {
    fullDescription += `\n\nReturns: ${tool.returns}`;
  }

  // Add side effects warning
  if (tool.sideEffects) {
    fullDescription += `\n\n⚠️ Side effects: ${tool.sideEffects}`;
  }

  return {
    name: tool.name,
    description: fullDescription,
    parameters: {
      type: 'OBJECT',
      properties,
      required: required.length > 0 ? required : undefined
    }
  };
}

/**
 * Create the tool search tool for Gemini
 */
function createToolSearchTool(): any {
  return {
    name: 'search_tools',
    description: `Search for available design language tools by keyword. Use this when you need a capability that isn't currently loaded.
    
Returns a list of matching tools with their descriptions. Once you find the tool you need, it will be automatically loaded for you to use.

Examples:
1. {"query": "color scale", "limit": 5}
2. {"query": "analyze redundancy", "category": "analyze"}
3. {"query": "rename", "limit": 3}`,
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Search query (e.g., "color", "analyze", "export")'
        },
        category: {
          type: 'STRING',
          enum: ['query', 'modify', 'analyze', 'history', 'export', 'create', 'visualization'],
          description: 'Optional: filter by category'
        },
        limit: {
          type: 'NUMBER',
          description: 'Maximum results to return (default: 10)'
        }
      },
      required: ['query']
    }
  };
}

/**
 * Get Gemini-compatible tools with lazy loading support
 */
export function getGeminiTools(options: {
  includeExamples?: boolean;
  includeToolSearch?: boolean;
} = {}): any[] {
  const {
    includeExamples = true,
    includeToolSearch = true
  } = options;

  const tools: any[] = [];

  // Add tool search as first tool (if enabled)
  if (includeToolSearch) {
    tools.push(createToolSearchTool());
  }

  // Register all operations in the search service
  Object.values(ENHANCED_OPERATIONS).forEach(op => {
    toolSearchService.registerTool(op);
  });

  // Only add non-deferred tools upfront
  const loadedTools = toolSearchService.getLoadedTools();
  
  loadedTools.forEach(tool => {
    tools.push(convertToolToGemini(tool, includeExamples));
  });

  return tools;
}

/**
 * Handle tool search and dynamically load tools
 */
export async function handleToolSearch(params: {
  query: string;
  category?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  data?: {
    results: any[];
    newly_loaded: string[];
  };
  message?: string;
}> {
  const results = toolSearchService.searchTools(params.query, {
    category: params.category,
    limit: params.limit,
    includeLoaded: false  // Only show tools not yet loaded
  });

  if (results.length === 0) {
    return {
      success: true,
      data: {
        results: [],
        newly_loaded: []
      },
      message: 'No matching tools found. Try a different search query.'
    };
  }

  // Load top 3 most relevant tools automatically
  const topResults = results.slice(0, 3);
  const loadedNames = topResults.map(r => r.name);
  const loadedTools = toolSearchService.loadTools(loadedNames);

  return {
    success: true,
    data: {
      results: results.map(r => ({
        name: r.name,
        description: r.description,
        category: r.category,
        relevance: r.relevance_score
      })),
      newly_loaded: loadedNames
    },
    message: `Found ${results.length} matching tools. Loaded top ${loadedNames.length} for immediate use: ${loadedNames.join(', ')}`
  };
}

/**
 * Get currently loaded tools (for debugging/stats)
 */
export function getLoadedToolNames(): string[] {
  return toolSearchService.getLoadedTools().map(t => t.name);
}

/**
 * Get tool loading statistics
 */
export function getToolStats() {
  return toolSearchService.getStats();
}

