/**
 * Helper functions to show specialized UIs for tool results
 * These are called from tool handlers to display context-aware overlays
 */

import { 
  ToolResult, 
  TOOL_TO_RESULT_TYPE,
  TokenModificationResult 
} from '../types/toolUI';
import { 
  SearchResult, 
  TokenInfo, 
  ImpactAnalysisResult, 
  DesignSystemAnalysis 
} from '../types/aiTools';

/**
 * Show a search result in the specialized search UI
 */
export const showSearchResult = (
  showResult: (result: ToolResult) => void,
  searchResult: SearchResult,
  toolName: string = 'searchTokens'
) => {
  showResult({
    type: 'token-search',
    timestamp: Date.now(),
    toolName,
    searchResult,
  });
};

/**
 * Show a token detail view
 */
export const showTokenDetail = (
  showResult: (result: ToolResult) => void,
  tokenInfo: TokenInfo,
  toolName: string = 'getToken'
) => {
  // For now, we can show it in the search results view with just one token
  showResult({
    type: 'token-detail',
    timestamp: Date.now(),
    toolName,
    tokenInfo,
  });
};

/**
 * Show a token modification result (create/update/delete/rename)
 */
export const showModificationResult = (
  showResult: (result: ToolResult) => void,
  modification: TokenModificationResult
) => {
  showResult({
    type: 'token-modification',
    timestamp: Date.now(),
    toolName: modification.operation === 'create' ? 'createToken' :
              modification.operation === 'update' ? 'updateToken' :
              modification.operation === 'delete' ? 'deleteToken' : 'renameToken',
    modificationResult: modification,
  });
};

/**
 * Show an impact analysis result
 */
export const showImpactAnalysis = (
  showResult: (result: ToolResult) => void,
  impactAnalysis: ImpactAnalysisResult,
  toolName: string = 'getImpactAnalysis'
) => {
  showResult({
    type: 'impact-analysis',
    timestamp: Date.now(),
    toolName,
    impactAnalysis,
  });
};

/**
 * Show a design system analysis result
 */
export const showSystemAnalysis = (
  showResult: (result: ToolResult) => void,
  systemAnalysis: DesignSystemAnalysis,
  toolName: string = 'analyzeDesignSystem'
) => {
  showResult({
    type: 'system-analysis',
    timestamp: Date.now(),
    toolName,
    systemAnalysis,
  });
};

/**
 * Show a color visualization (handled by ColorSciencePanel, not overlay)
 */
export const showColorVisualization = (
  showResult: (result: ToolResult) => void,
  mode: 'dashboard' | '3d-space' | 'projections' | 'hue-ring' | 'accessibility' | 'curve-analysis',
  filter?: 'all' | 'primitives' | 'utilities'
) => {
  showResult({
    type: 'color-visualization',
    timestamp: Date.now(),
    toolName: `show_${mode.replace('-', '_')}`,
    colorVisualization: { mode, filter },
  });
};

/**
 * Show a history operation result
 */
export const showHistoryOperation = (
  showResult: (result: ToolResult) => void,
  operation: 'undo' | 'redo',
  description: string,
  affectedTokens: string[] = [],
  success: boolean = true
) => {
  showResult({
    type: 'history-operation',
    timestamp: Date.now(),
    toolName: operation === 'undo' ? 'undoChange' : 'redoChange',
    historyOperation: {
      operation,
      description,
      affectedTokens,
      success,
      timestamp: Date.now(),
    },
  });
};

/**
 * Show an export result
 */
export const showExportResult = (
  showResult: (result: ToolResult) => void,
  format: 'json' | 'yaml',
  content: string,
  tokenCount: number
) => {
  showResult({
    type: 'export-result',
    timestamp: Date.now(),
    toolName: 'exportDesignSystem',
    exportResult: {
      format,
      content,
      tokenCount,
      timestamp: Date.now(),
    },
  });
};

