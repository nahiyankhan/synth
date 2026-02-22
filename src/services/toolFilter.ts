/**
 * Centralized tool filtering based on view context
 * Single source of truth for which tools are available in which views
 */

import { ToolDefinition } from '@/types/toolRegistry';

export type ViewName = 'gallery' | 'colors' | 'typography' | 'sizes' | 'components' | 'content' | 'pages';

/**
 * Get tools available for a specific view
 * Uses declarative metadata from tool definitions
 */
export function getToolsForView(
  view: ViewName | null | undefined,
  allTools: ToolDefinition[]
): ToolDefinition[] {
  // Gallery or null - show all tools
  if (!view || view === 'gallery') {
    return allTools;
  }

  return allTools.filter(tool => {
    // If tool explicitly declares view availability, use that
    if (tool.availableInViews && tool.availableInViews.length > 0) {
      return tool.availableInViews.includes(view);
    }

    // Fallback: Infer from domain awareness
    switch (tool.domainAwareness) {
      case 'agnostic':
        return true; // Available everywhere

      case 'polymorphic':
        return true; // Available everywhere (but may auto-inject context)

      case 'specific':
        // Map view to domain
        const viewToDomain: Record<ViewName, string> = {
          gallery: 'all',
          colors: 'color',
          typography: 'typography',
          sizes: 'size',
          components: 'components',
          content: 'content',
          pages: 'all'
        };
        return tool.specificDomain === viewToDomain[view];

      default:
        // No metadata - assume available (backward compatibility)
        return true;
    }
  });
}

/**
 * Get suggested type parameter for polymorphic tools based on view
 */
export function getTypeForView(view: ViewName | null | undefined): string | undefined {
  if (!view || view === 'gallery') {
    return undefined; // No type injection
  }

  const viewToType: Record<string, string> = {
    colors: 'color',
    typography: 'typography',
    sizes: 'size',
    components: 'other',
    content: 'other',
    pages: 'other'
  };

  return viewToType[view];
}

/**
 * Auto-inject view context into tool parameters for polymorphic tools
 */
export function injectViewContext(
  toolName: string,
  params: Record<string, any>,
  view: ViewName | null | undefined,
  allTools: ToolDefinition[]
): Record<string, any> {
  const tool = allTools.find(t => t.name === toolName);
  
  if (!tool || tool.domainAwareness !== 'polymorphic') {
    return params; // No injection needed
  }

  // Check if tool has a 'type' parameter
  const hasTypeParam = tool.parameters.type !== undefined;
  
  if (!hasTypeParam || params.type !== undefined) {
    return params; // Already has type or doesn't support it
  }

  // Inject type based on current view
  const suggestedType = getTypeForView(view);
  
  if (suggestedType) {
    return {
      ...params,
      type: suggestedType
    };
  }

  return params;
}

