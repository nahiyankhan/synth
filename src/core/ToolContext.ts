/**
 * Tool Context
 * Central context for tool execution with dependency injection
 * Replaces singleton pattern with proper DI
 */

import { StyleGraph } from './StyleGraph';
import { ToolRegistry } from './ToolRegistry';
import { ToolSearchService } from '../services/toolSearchService';
import { ToolHandlers } from '../services/toolHandlersNew';
import { HandlerFactory } from '../tools/handlers/HandlerFactory';
import { ALL_TOOL_DEFINITIONS } from '../tools/definitions';
import { TOOL_SCHEMAS } from '../tools/schemas';
import { ToolContextConfig } from '../types/toolRegistry';

export class ToolContext {
  public readonly registry: ToolRegistry;
  public readonly searchService: ToolSearchService;
  public readonly handlers: ToolHandlers;

  constructor(
    private graph: StyleGraph,
    private config: ToolContextConfig = {}
  ) {
    // Initialize services
    this.searchService = new ToolSearchService();
    this.registry = new ToolRegistry();
    this.handlers = new ToolHandlers(graph);

    // Initialize tools
    this.initializeTools();
  }

  /**
   * Initialize and register all tools
   */
  private initializeTools(): void {
    // Register all tool definitions with search service
    ALL_TOOL_DEFINITIONS.forEach(def => {
      this.searchService.registerTool(def);
    });

    // The handlers are already registered in ToolHandlers constructor
    // We just need to expose the registry
    const handlersRegistry = this.handlers.getRegistry();
    
    // Copy handlers from the handlers registry to our context registry
    handlersRegistry.getToolNames().forEach(name => {
      const handler = handlersRegistry.getHandler(name);
      if (handler) {
        this.registry.register(handler);
      }
    });
  }

  /**
   * Get the underlying graph
   */
  getGraph(): StyleGraph {
    return this.graph;
  }

  /**
   * Get configuration
   */
  getConfig(): ToolContextConfig {
    return this.config;
  }

  /**
   * Execute a tool by name
   */
  async executeTool(name: string, params: unknown) {
    return this.registry.execute(name, params);
  }

  /**
   * Search for tools
   */
  searchTools(query: string, options?: {
    category?: string;
    limit?: number;
    includeLoaded?: boolean;
  }) {
    return this.searchService.searchTools(query, options);
  }

  /**
   * Load tools by name (for lazy loading)
   */
  loadTools(toolNames: string[]) {
    return this.searchService.loadTools(toolNames);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      registry: this.registry.getStats(),
      search: this.searchService.getStats(),
    };
  }
}

