/**
 * Types for Specialized Tool Result UIs
 * Maps tool operations to their visual representations
 */

import {
  TokenInfo,
  SearchResult,
  ImpactAnalysisResult,
  DesignSystemAnalysis,
} from "./aiTools";

/**
 * Tool result types that can be visualized
 */
export type ToolResultType =
  | "token-search"
  | "token-detail"
  | "token-modification"
  | "impact-analysis"
  | "system-analysis"
  | "color-visualization"
  | "color-proposal"
  | "typography-analysis"
  | "spacing-analysis"
  | "history-operation"
  | "export-result"
  | "navigation";

/**
 * Token modification result (create/update/delete)
 */
export interface TokenModificationResult {
  operation: "create" | "update" | "delete" | "rename";
  path: string;
  oldValue?: any;
  newValue?: any;
  oldPath?: string; // for rename operations
  affectedDependents?: number;
  success: boolean;
  message?: string;
  timestamp: number;
}

/**
 * Export result
 */
export interface ExportResult {
  format: "json" | "yaml";
  content: string;
  tokenCount: number;
  timestamp: number;
}

/**
 * History operation result
 */
export interface HistoryOperationResult {
  operation: "undo" | "redo";
  description: string;
  affectedTokens: string[];
  success: boolean;
  timestamp: number;
}

/**
 * Navigation result (for landing page)
 */
export interface NavigationResult {
  type: "list" | "preview" | "help";
  data: any;
}

/**
 * Unified tool result that can contain any specialized result type
 */
export interface ToolResult {
  type: ToolResultType;
  timestamp: number;
  toolName: string;

  // Specialized data (only one will be present based on type)
  searchResult?: SearchResult;
  tokenInfo?: TokenInfo;
  modificationResult?: TokenModificationResult;
  impactAnalysis?: ImpactAnalysisResult;
  systemAnalysis?: DesignSystemAnalysis;
  colorVisualization?: {
    mode:
      | "dashboard"
      | "3d-space"
      | "projections"
      | "hue-ring"
      | "accessibility"
      | "curve-analysis";
    filter?: "all" | "primitives" | "utilities";
  };
  colorProposal?: any; // ColorOptionProposal | SimilarityResult | etc.
  data?: any; // Generic data field for other tool results (typography, etc.)
  historyOperation?: HistoryOperationResult;
  exportResult?: ExportResult;
  navigationResult?: NavigationResult;
}

/**
 * UI state for managing tool result displays
 */
export interface ToolUIState {
  activeResult: ToolResult | null;
  resultHistory: ToolResult[];
  isOverlayOpen: boolean;
}

/**
 * Map tool operations to result types
 */
export const TOOL_TO_RESULT_TYPE: Record<string, ToolResultType> = {
  // Query operations
  searchTokens: "token-search",
  getToken: "token-detail",
  findAllReferences: "token-search",

  // Modify operations
  createToken: "token-modification",
  updateToken: "token-modification",
  deleteToken: "token-modification",
  renameToken: "token-modification",
  findAndReplace: "token-modification",

  // Analyze operations
  getImpactAnalysis: "impact-analysis",
  analyzeDesignSystem: "system-analysis",
  getSystemStats: "system-analysis",
  suggestColorsForGaps: "system-analysis",

  // Color visualization
  show_color_analysis_dashboard: "color-visualization",
  show_3d_color_space: "color-visualization",
  show_color_projections: "color-visualization",
  show_hue_ring: "color-visualization",
  show_accessibility_matrix: "color-visualization",
  show_color_curve_analysis: "color-visualization",

  // History
  undoChange: "history-operation",
  redoChange: "history-operation",

  // Export
  exportDesignSystem: "export-result",

  // Navigation (landing page)
  list_design_systems: "navigation",
  get_design_system_preview: "navigation",
  load_design_system: "navigation",
  create_new_design_system: "navigation",
  delete_design_system: "navigation",
  help: "navigation",
};
