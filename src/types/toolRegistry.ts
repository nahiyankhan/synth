/**
 * Type definitions for the Tool Registry system
 */

export interface ToolParameter {
  type: string;
  required?: boolean;
  description?: string;
  enum?: string[];
  default?: any;
}

export interface ToolDefinition {
  name: string;
  version: string;
  category: 'query' | 'modify' | 'analyze' | 'history' | 'export' | 'create' | 'navigation' | 'generation' | 'meta';
  
  // Domain awareness classification
  domainAwareness?: 'agnostic' | 'polymorphic' | 'specific';
  
  // If polymorphic, which types does it support?
  supportedTypes?: Array<'color' | 'typography' | 'size' | 'spacing' | 'other'>;
  
  // If specific, which single domain?
  specificDomain?: 'color' | 'typography' | 'size' | 'spacing' | 'components' | 'content';
  
  // View compatibility (for UI filtering)
  availableInViews?: Array<'gallery' | 'colors' | 'typography' | 'sizes' | 'components' | 'content' | 'pages'>;
  
  description: string;
  parameters: Record<string, ToolParameter>;
  returns?: string;
  sideEffects?: string;
  defer_loading?: boolean;
  input_examples?: Array<Record<string, any>>;
  supports_pagination?: boolean;
  supports_filtering?: boolean;
}

export interface ToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ToolMetrics {
  executionCount: number;
  successCount: number;
  failureCount: number;
  totalDuration: number;
  averageDuration: number;
  lastExecuted?: number;
  errorMessages: string[];
}

export interface ToolContextConfig {
  enableAnalytics?: boolean;
  enableVersioning?: boolean;
  maxHistorySize?: number;
}

// Note: TokenInfo, SearchResult, ImpactAnalysisResult are in aiTools.ts
// Not re-exported here to avoid circular dependency (aiTools imports ToolResponse from here)

