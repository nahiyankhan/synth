/**
 * Typography View Tools Helper
 * Exports helper functions for typography-specific tools
 */

import { TYPOGRAPHY_VIEW_TOOLS } from '@/tools/definitions/typography.tools';

// Re-export the tools array
export { TYPOGRAPHY_VIEW_TOOLS };

// Export tool names for easy checking
export const TYPOGRAPHY_VIEW_TOOL_NAMES = TYPOGRAPHY_VIEW_TOOLS.map(t => t.name);

export function isTypographyViewTool(toolName: string): boolean {
  return TYPOGRAPHY_VIEW_TOOL_NAMES.includes(toolName);
}

