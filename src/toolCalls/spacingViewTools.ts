/**
 * Spacing View Tools Helper
 * Exports helper functions for spacing-specific tools
 */

import { SPACING_VIEW_TOOLS } from '../tools/definitions/spacing.tools';

// Re-export the tools array
export { SPACING_VIEW_TOOLS };

// Export tool names for easy checking
export const SPACING_VIEW_TOOL_NAMES = SPACING_VIEW_TOOLS.map(t => t.name);

export function isSpacingViewTool(toolName: string): boolean {
  return SPACING_VIEW_TOOL_NAMES.includes(toolName);
}

