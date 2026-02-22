/**
 * Enhanced Tool Definition Structure
 * Adapted from Anthropic's Advanced Tool Use for Gemini
 */

export interface ToolInputExample {
  [key: string]: any;
}

export interface EnhancedToolParameter {
  type: string;
  required?: boolean;
  description?: string;
  enum?: string[];
  default?: any;
}

export interface EnhancedToolDefinition {
  name: string;
  description: string;
  category: 'query' | 'modify' | 'analyze' | 'history' | 'export' | 'create' | 'visualization' | 'navigation' | 'generation' | 'meta';
  parameters: Record<string, EnhancedToolParameter>;
  returns?: string;
  sideEffects?: string;
  
  // Advanced features
  defer_loading?: boolean;  // Load on-demand vs upfront
  input_examples?: ToolInputExample[];  // Concrete usage examples
  supports_pagination?: boolean;  // Can return paginated results
  supports_filtering?: boolean;  // Can return filtered/summary results
}

/**
 * Tool response modes for controlling context usage
 */
export type ToolResponseMode = 'summary' | 'full' | 'paginated';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface FilteredResponse<T> {
  summary: string;
  count: number;
  sample_items?: T[];
  full_data_available: boolean;
}

/**
 * Enhanced tool execution parameters
 */
export interface EnhancedExecutionParams {
  operation: string;
  params: any;
  
  // Result control
  response_mode?: ToolResponseMode;
  page?: number;
  page_size?: number;
  include_summary?: boolean;
}

/**
 * Tool search result
 */
export interface ToolSearchResult {
  name: string;
  description: string;
  category: string;
  relevance_score: number;
  loaded: boolean;
}

