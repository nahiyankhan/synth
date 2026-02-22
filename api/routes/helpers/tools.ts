/**
 * Tool Helpers
 * Utilities for converting and filtering tools for AI SDK
 */

import { getEnhancedGeminiTools } from '../../../src/types/aiTools';
import { navigationTools } from '../../../src/types/navigationAiTools';
import { generationTools } from '../../../src/types/generationAiTools';
import { getToolsForView } from '../../../src/services/toolFilter';

export interface ChatContext {
  route?: string;
  mode?: string | null;
  currentView?: string | null;
  languageName?: string;
}

/**
 * Convert Gemini function declarations to AI SDK tool format
 */
function convertToolsToAISDK(geminiTools: any[]): Record<string, any> {
  const tools: Record<string, any> = {};

  const convertType = (type: string): string => {
    const typeMap: Record<string, string> = {
      OBJECT: 'object',
      STRING: 'string',
      NUMBER: 'number',
      INTEGER: 'integer',
      BOOLEAN: 'boolean',
      ARRAY: 'array',
    };
    return typeMap[type] || type.toLowerCase();
  };

  const convertSchema = (schema: any): any => {
    if (!schema) return { type: 'object', properties: {}, required: [] };

    const converted: any = { ...schema };

    if (converted.type) {
      converted.type = convertType(converted.type);
    }

    if (converted.properties) {
      converted.properties = Object.fromEntries(
        Object.entries(converted.properties).map(
          ([key, value]: [string, any]) => [key, convertSchema(value)]
        )
      );
    }

    if (converted.items) {
      converted.items = convertSchema(converted.items);
    }

    return converted;
  };

  for (const toolGroup of geminiTools) {
    if (toolGroup.functionDeclarations) {
      for (const func of toolGroup.functionDeclarations) {
        tools[func.name] = {
          description: func.description || '',
          parameters: convertSchema(func.parameters),
        };
      }
    }
  }

  return tools;
}

/**
 * Get tools based on context (route, mode, current view)
 */
export function getToolsForContext(context: ChatContext): Record<string, any> {
  const { route, mode, currentView } = context;

  // Landing page - navigation tools
  if (route === '/' || route === '') {
    return convertToolsToAISDK(navigationTools);
  }

  // Generation mode - generation-specific tools
  if (mode === 'generate') {
    return convertToolsToAISDK(generationTools);
  }

  // Editor mode - get all tools first
  const allTools = getEnhancedGeminiTools({
    includeExamples: true,
    includeToolSearch: true,
  });

  // Filter tools based on current view
  const filteredTools = getToolsForView(currentView as any, allTools);

  return convertToolsToAISDK([{ functionDeclarations: filteredTools }]);
}
