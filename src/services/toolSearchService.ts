/**
 * Tool Search Service
 * Implements on-demand tool discovery for Gemini
 */

import { EnhancedToolDefinition, ToolSearchResult } from '../types/enhancedTools';

export class ToolSearchService {
  private tools: Map<string, EnhancedToolDefinition>;
  private loadedTools: Set<string>;

  constructor() {
    this.tools = new Map();
    this.loadedTools = new Set();
  }

  /**
   * Register a tool for discovery
   */
  registerTool(tool: EnhancedToolDefinition): void {
    this.tools.set(tool.name, tool);
    
    // Auto-load tools without defer_loading flag
    if (!tool.defer_loading) {
      this.loadedTools.add(tool.name);
    }
  }

  /**
   * Register multiple tools
   */
  registerTools(tools: EnhancedToolDefinition[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  /**
   * Search for tools by query
   * Uses keyword matching against name, description, and category
   */
  searchTools(query: string, options?: {
    category?: string;
    limit?: number;
    includeLoaded?: boolean;
  }): ToolSearchResult[] {
    const searchTerms = query.toLowerCase().split(/\s+/);
    const results: ToolSearchResult[] = [];

    for (const [name, tool] of this.tools) {
      // Skip already loaded tools unless explicitly requested
      if (!options?.includeLoaded && this.loadedTools.has(name)) {
        continue;
      }

      // Filter by category if specified
      if (options?.category && tool.category !== options.category) {
        continue;
      }

      // Calculate relevance score
      const score = this.calculateRelevance(tool, searchTerms);
      
      if (score > 0) {
        results.push({
          name: tool.name,
          description: tool.description,
          category: tool.category,
          relevance_score: score,
          loaded: this.loadedTools.has(name)
        });
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevance_score - a.relevance_score);

    // Apply limit
    const limit = options?.limit || 10;
    return results.slice(0, limit);
  }

  /**
   * Calculate relevance score using keyword matching
   */
  private calculateRelevance(tool: EnhancedToolDefinition, searchTerms: string[]): number {
    let score = 0;
    const searchableText = `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();

    searchTerms.forEach(term => {
      // Exact match in name (highest priority)
      if (tool.name.toLowerCase().includes(term)) {
        score += 10;
      }

      // Match in description
      if (tool.description.toLowerCase().includes(term)) {
        score += 5;
      }

      // Match in category
      if (tool.category.toLowerCase().includes(term)) {
        score += 3;
      }

      // Match in parameters
      Object.keys(tool.parameters).forEach(paramName => {
        if (paramName.toLowerCase().includes(term)) {
          score += 2;
        }
      });
    });

    return score;
  }

  /**
   * Load a tool (mark it as loaded so it gets included in context)
   */
  loadTool(toolName: string): EnhancedToolDefinition | null {
    const tool = this.tools.get(toolName);
    if (tool) {
      this.loadedTools.add(toolName);
      return tool;
    }
    return null;
  }

  /**
   * Load multiple tools
   */
  loadTools(toolNames: string[]): EnhancedToolDefinition[] {
    return toolNames
      .map(name => this.loadTool(name))
      .filter((tool): tool is EnhancedToolDefinition => tool !== null);
  }

  /**
   * Get all currently loaded tools
   */
  getLoadedTools(): EnhancedToolDefinition[] {
    return Array.from(this.loadedTools)
      .map(name => this.tools.get(name))
      .filter((tool): tool is EnhancedToolDefinition => tool !== undefined);
  }

  /**
   * Get a specific tool definition
   */
  getTool(name: string): EnhancedToolDefinition | null {
    return this.tools.get(name) || null;
  }

  /**
   * Check if a tool is loaded
   */
  isToolLoaded(name: string): boolean {
    return this.loadedTools.has(name);
  }

  /**
   * Get all registered tools (for debugging)
   */
  getAllTools(): EnhancedToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): EnhancedToolDefinition[] {
    return Array.from(this.tools.values())
      .filter(tool => tool.category === category);
  }

  /**
   * Reset loaded tools (useful for new sessions)
   */
  reset(): void {
    this.loadedTools.clear();
    // Re-load non-deferred tools
    for (const [name, tool] of this.tools) {
      if (!tool.defer_loading) {
        this.loadedTools.add(name);
      }
    }
  }

  /**
   * Get statistics about tool loading
   */
  getStats(): {
    total: number;
    loaded: number;
    deferred: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    let deferredCount = 0;

    for (const tool of this.tools.values()) {
      byCategory[tool.category] = (byCategory[tool.category] || 0) + 1;
      if (tool.defer_loading) {
        deferredCount++;
      }
    }

    return {
      total: this.tools.size,
      loaded: this.loadedTools.size,
      deferred: deferredCount,
      byCategory
    };
  }
}

// Singleton instance
export const toolSearchService = new ToolSearchService();

