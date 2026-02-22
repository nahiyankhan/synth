/**
 * Unified Tool Definitions
 * Single source of truth for all tool definitions in the system
 *
 * Architecture: Vercel-inspired minimalist approach
 * https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools
 *
 * Philosophy: "Model + file system + goal. Add complexity only when proven necessary."
 *
 * We've consolidated 40+ tools down to ~12 core tools:
 * 1. executeCommand - Replaces all query/export tools (cat, grep, find, ls, tree)
 * 2. getImpactAnalysis - Graph traversal (cannot be file ops)
 * 3. undoChange/redoChange - State machine (cannot be file ops)
 * 4. check_color_contrast - WCAG algorithm (cannot be file ops)
 * 5. generate_color_scale - OKLCH color science (cannot be file ops)
 * 6. searchGuidelines - Semantic embeddings (cannot be file ops)
 * 7. navigate_to_view - UI side effects (cannot be file ops)
 * 8. select_colors - UI interaction (cannot be file ops)
 * 9. Navigation tools - UI side effects for design system management
 */

import { ToolDefinition } from '../../types/toolRegistry';

// Core filesystem tool (replaces query, export, and most modify tools)
import { EXECUTE_COMMAND_TOOL, FILESYSTEM_TOOLS } from './filesystem.tools';

// Graph operations (cannot be expressed as file operations)
import { GET_IMPACT_ANALYSIS_TOOL } from './analyze.tools';

// History management (requires state machine)
import { UNDO_CHANGE_TOOL, REDO_CHANGE_TOOL, HISTORY_TOOLS } from './history.tools';

// Color science tools (algorithmic, not file-based)
import {
  CHECK_COLOR_CONTRAST_TOOL,
  GENERATE_COLOR_SCALE_CV_TOOL,
  SELECT_COLORS_TOOL,
} from './colorView.tools';

// Semantic search (requires embeddings)
import { SEARCH_GUIDELINES_TOOL } from './content.tools';

// UI navigation (side effects that cannot be file operations)
import {
  NAVIGATE_TO_VIEW_TOOL,
  SHOW_SPLIT_VIEW_TOOL,
  LOAD_DESIGN_SYSTEM_TOOL,
  CREATE_NEW_DESIGN_SYSTEM_TOOL,
  DELETE_DESIGN_SYSTEM_TOOL,
} from './navigation.tools';

// ============================================================================
// DEPRECATED IMPORTS - Kept for backwards compatibility during migration
// These tools are replaced by executeCommand: cat, grep, find, echo >, rm
// ============================================================================
import { QUERY_TOOLS } from './query.tools';
import { MODIFY_TOOLS } from './modify.tools';
import { ANALYZE_TOOLS } from './analyze.tools';
import { EXPORT_TOOLS } from './export.tools';
import { CREATE_TOOLS } from './create.tools';
import { NAVIGATION_TOOLS } from './navigation.tools';
import { COLOR_VIEW_TOOLS } from './colorView.tools';
import { TYPOGRAPHY_VIEW_TOOLS } from './typography.tools';
import { SPACING_VIEW_TOOLS } from './spacing.tools';
import { CONTENT_TOOLS } from './content.tools';

// Export deprecated tool arrays for backwards compatibility
export {
  QUERY_TOOLS,
  MODIFY_TOOLS,
  ANALYZE_TOOLS,
  HISTORY_TOOLS,
  EXPORT_TOOLS,
  CREATE_TOOLS,
  NAVIGATION_TOOLS,
  COLOR_VIEW_TOOLS,
  TYPOGRAPHY_VIEW_TOOLS,
  SPACING_VIEW_TOOLS,
  CONTENT_TOOLS,
  FILESYSTEM_TOOLS,
};

// Export all individual tools for direct import (backwards compatibility)
export * from './query.tools';
export * from './modify.tools';
export * from './analyze.tools';
export * from './history.tools';
export * from './export.tools';
export * from './create.tools';
export * from './navigation.tools';
export * from './colorView.tools';
export * from './typography.tools';
export * from './spacing.tools';
export * from './content.tools';
export * from './filesystem.tools';

// ============================================================================
// CORE TOOLS - The minimalist set (Vercel-inspired)
// ============================================================================

/**
 * Core tools that cannot be replaced by filesystem operations.
 * These are the only tools that should be exposed to the AI in production.
 */
export const CORE_TOOL_DEFINITIONS: ToolDefinition[] = [
  // Filesystem (replaces 15+ query/export/modify tools)
  EXECUTE_COMMAND_TOOL,

  // Graph traversal (transitive dependency analysis)
  GET_IMPACT_ANALYSIS_TOOL,

  // History management (state machine)
  UNDO_CHANGE_TOOL,
  REDO_CHANGE_TOOL,

  // Color science (algorithmic)
  CHECK_COLOR_CONTRAST_TOOL,
  GENERATE_COLOR_SCALE_CV_TOOL,

  // Semantic search (embeddings)
  SEARCH_GUIDELINES_TOOL,

  // UI navigation & interaction
  NAVIGATE_TO_VIEW_TOOL,
  SHOW_SPLIT_VIEW_TOOL,
  SELECT_COLORS_TOOL,

  // Design system management (UI side effects)
  LOAD_DESIGN_SYSTEM_TOOL,
  CREATE_NEW_DESIGN_SYSTEM_TOOL,
  DELETE_DESIGN_SYSTEM_TOOL,
];

// ============================================================================
// FEATURE FLAG: Use minimalist tools
// Set to true to use only core tools, false for full legacy toolset
// ============================================================================
const USE_MINIMALIST_TOOLS = true;

/**
 * All tool definitions in a single array
 * When USE_MINIMALIST_TOOLS is true, only exposes 13 core tools
 * When false, exposes full legacy toolset (40+ tools) for backwards compatibility
 */
export const ALL_TOOL_DEFINITIONS: ToolDefinition[] = USE_MINIMALIST_TOOLS
  ? CORE_TOOL_DEFINITIONS
  : [
      ...QUERY_TOOLS,
      ...MODIFY_TOOLS,
      ...ANALYZE_TOOLS,
      ...HISTORY_TOOLS,
      ...EXPORT_TOOLS,
      ...CREATE_TOOLS,
      ...NAVIGATION_TOOLS,
      ...COLOR_VIEW_TOOLS,
      ...TYPOGRAPHY_VIEW_TOOLS,
      ...SPACING_VIEW_TOOLS,
      ...CONTENT_TOOLS,
      ...FILESYSTEM_TOOLS,
    ];

/**
 * Tool definitions organized by category
 */
export const TOOLS_BY_CATEGORY = USE_MINIMALIST_TOOLS
  ? {
      filesystem: [EXECUTE_COMMAND_TOOL],
      analyze: [GET_IMPACT_ANALYSIS_TOOL],
      history: [UNDO_CHANGE_TOOL, REDO_CHANGE_TOOL],
      colorScience: [CHECK_COLOR_CONTRAST_TOOL, GENERATE_COLOR_SCALE_CV_TOOL],
      content: [SEARCH_GUIDELINES_TOOL],
      navigation: [
        NAVIGATE_TO_VIEW_TOOL,
        SHOW_SPLIT_VIEW_TOOL,
        LOAD_DESIGN_SYSTEM_TOOL,
        CREATE_NEW_DESIGN_SYSTEM_TOOL,
        DELETE_DESIGN_SYSTEM_TOOL,
      ],
      interaction: [SELECT_COLORS_TOOL],
    }
  : {
      query: QUERY_TOOLS,
      modify: MODIFY_TOOLS,
      analyze: ANALYZE_TOOLS,
      history: HISTORY_TOOLS,
      export: EXPORT_TOOLS,
      create: CREATE_TOOLS,
      navigation: NAVIGATION_TOOLS,
      colorView: COLOR_VIEW_TOOLS,
      typographyView: TYPOGRAPHY_VIEW_TOOLS,
      spacingView: SPACING_VIEW_TOOLS,
      content: CONTENT_TOOLS,
      filesystem: FILESYSTEM_TOOLS,
    };

/**
 * Tool definitions as a map (name -> definition)
 */
export const TOOL_DEFINITIONS_MAP = ALL_TOOL_DEFINITIONS.reduce((map, tool) => {
  map.set(tool.name, tool);
  return map;
}, new Map<string, ToolDefinition>());

/**
 * Get a tool definition by name
 */
export function getToolDefinition(name: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS_MAP.get(name);
}

/**
 * Get all tool definitions for a category
 */
export function getToolsByCategory(category: string): ToolDefinition[] {
  return ALL_TOOL_DEFINITIONS.filter(tool => tool.category === category);
}

/**
 * Get all category names
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(ALL_TOOL_DEFINITIONS.map(tool => tool.category)));
}

