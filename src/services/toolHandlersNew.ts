/**
 * Tool Handlers (Refactored with Registry Pattern)
 * Replaces the massive switch statement with a clean registry-based architecture
 */

import { StyleGraph } from '@/core/StyleGraph';
import { ToolRegistry } from '@/core/ToolRegistry';
import { HandlerFactory } from '@/tools/handlers/HandlerFactory';
import { ALL_TOOL_DEFINITIONS } from '@/tools/definitions';
import { TOOL_SCHEMAS } from '@/tools/schemas';
import { ToolResponse } from '@/types/toolRegistry';
import { ToolHandlers as LegacyToolHandlers } from './toolHandlers';
import { VirtualFileSystem } from './virtualFileSystem';
import { ExecuteCommandHandler } from '@/tools/handlers/filesystem/ExecuteCommandHandler';

export class ToolHandlers {
  private registry: ToolRegistry;
  private legacyHandlers: LegacyToolHandlers;
  private vfs: VirtualFileSystem;

  constructor(private graph: StyleGraph) {
    this.registry = new ToolRegistry();
    this.legacyHandlers = new LegacyToolHandlers(graph);
    this.vfs = new VirtualFileSystem(graph);
    this.registerAllTools();
  }

  /**
   * Register all tools using the factory pattern
   */
  private registerAllTools(): void {
    const factory = new HandlerFactory(this.legacyHandlers);

    // Filter out custom tools from factory creation (they have custom handlers)
    const customToolNames = ['executeCommand'];
    const legacyToolDefinitions = ALL_TOOL_DEFINITIONS.filter(
      def => !customToolNames.includes(def.name)
    );

    const handlers = factory.createAllHandlers(legacyToolDefinitions, TOOL_SCHEMAS);
    this.registry.registerMany(handlers);

    // Register custom tool handlers
    this.registry.register(new ExecuteCommandHandler(this.graph));
  }

  /**
   * Main tool dispatcher - delegates to registry
   * This replaces the massive switch statement!
   */
  async handleTool(toolName: string, params: any): Promise<ToolResponse> {
    return this.registry.execute(toolName, params);
  }

  /**
   * Get all available operations (for discovery layer)
   */
  async getDesignSystemOperations(params: { category?: string }): Promise<ToolResponse> {
    const definitions = params.category
      ? this.registry.getDefinitionsByCategory(params.category)
      : this.registry.getDefinitions();

    const operations = definitions.map(def => ({
      name: def.name,
      category: def.category,
      description: def.description,
      hasSideEffects: !!def.sideEffects,
    }));

    return {
      success: true,
      data: {
        operations,
        categories: this.registry.getCategories(),
      },
      message: `Found ${operations.length} operations${
        params.category ? ` in category "${params.category}"` : ''
      }`,
    };
  }

  /**
   * Get operation info (for planning layer)
   */
  async getOperationInfo(params: { operation: string }): Promise<ToolResponse> {
    const handler = this.registry.getHandler(params.operation);

    if (!handler) {
      return {
        success: false,
        error: `Unknown operation: ${params.operation}. Use get_design_system_operations to see available operations.`,
      };
    }

    const definition = handler.getDefinition();

    return {
      success: true,
      data: {
        operation: definition.name,
        category: definition.category,
        description: definition.description,
        parameters: definition.parameters,
        returns: definition.returns,
        sideEffects: definition.sideEffects || 'None - read-only operation',
      },
    };
  }

  /**
   * Execute operation (for execution layer)
   */
  async executeOperation(params: { operation: string; params: any }): Promise<ToolResponse> {
    return this.handleTool(params.operation, params.params);
  }

  /**
   * Get the underlying registry (for advanced usage)
   */
  getRegistry(): ToolRegistry {
    return this.registry;
  }

  /**
   * Get the underlying graph (for direct access)
   */
  getGraph(): StyleGraph {
    return this.graph;
  }

  /**
   * Get the virtual file system (for direct access)
   */
  getVirtualFileSystem(): VirtualFileSystem {
    return this.vfs;
  }

  /**
   * Refresh the virtual file system (call after graph changes)
   */
  refreshVirtualFileSystem(): void {
    this.vfs.refresh();
  }
}

