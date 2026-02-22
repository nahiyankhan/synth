/**
 * Tool Registry Adapter
 * Provides backward-compatible interface (handleTool) using the new ToolRegistry
 * Allows incremental migration from legacy ToolHandlers to native handlers
 */

import { StyleGraph } from "@/core/StyleGraph";
import { ToolRegistry } from "@/core/ToolRegistry";
import { ToolResponse } from "@/types/toolRegistry";
import { createToolRegistry } from "@/tools/handlers";

// Import individual handlers for tools not yet in the registry
import { ExecuteCommandHandler } from "@/tools/handlers/filesystem/ExecuteCommandHandler";
import { AITokenHandler } from "@/tools/handlers/authoring/AITokenHandler";
import { EntityHandler } from "@/tools/handlers/authoring/EntityHandler";

/**
 * Operations metadata for discovery layer
 */
const OPERATIONS_METADATA = {
  getToken: { category: "query", description: "Get token by path" },
  searchTokens: { category: "query", description: "Search tokens" },
  findAllReferences: { category: "query", description: "Find token references" },
  updateToken: { category: "modify", description: "Update token value" },
  createToken: { category: "modify", description: "Create new token" },
  deleteToken: { category: "modify", description: "Delete token" },
  renameToken: { category: "modify", description: "Rename token and update refs" },
  findAndReplace: { category: "modify", description: "Find and replace patterns" },
  getImpactAnalysis: { category: "analyze", description: "Analyze change impact" },
  getSystemStats: { category: "analyze", description: "Get system statistics" },
  analyzeDesignSystem: { category: "analyze", description: "Full system analysis" },
  suggestColorsForGaps: { category: "analyze", description: "Suggest colors for gaps" },
  generateColorScale: { category: "create", description: "Generate color scale" },
  undoChange: { category: "history", description: "Undo last change" },
  redoChange: { category: "history", description: "Redo last change" },
  exportDesignSystem: { category: "export", description: "Export to JSON/YAML" },
  exportTailwindConfig: { category: "export", description: "Export Tailwind config" },
};

/**
 * Adapter that wraps ToolRegistry with handleTool interface
 * Compatible with existing consumers expecting ToolHandlers
 */
export class ToolRegistryAdapter {
  private registry: ToolRegistry;
  private executeCommandHandler: ExecuteCommandHandler;
  private aiTokenHandler: AITokenHandler;
  private entityHandler: EntityHandler;

  constructor(private graph: StyleGraph) {
    // Create the native tool registry
    this.registry = createToolRegistry(graph);

    // Initialize handlers for tools not yet in registry
    this.executeCommandHandler = new ExecuteCommandHandler(graph);
    this.aiTokenHandler = new AITokenHandler(graph);
    this.entityHandler = new EntityHandler(graph);
  }

  /**
   * Main tool dispatch - backward compatible with ToolHandlers.handleTool()
   */
  async handleTool(toolName: string, params: any): Promise<ToolResponse> {
    // Discovery layer tools (not in registry)
    if (toolName === "get_design_system_operations") {
      return this.getDesignSystemOperations(params);
    }
    if (toolName === "get_operation_info") {
      return this.getOperationInfo(params);
    }
    if (toolName === "execute_operation") {
      return this.executeOperation(params);
    }

    // Filesystem tools (delegated)
    if (toolName === "executeCommand") {
      return this.executeCommandHandler.execute(params);
    }

    // AI authoring tools (delegated)
    if (toolName === "createAIToken") {
      return this.aiTokenHandler.createToken(params);
    }
    if (toolName === "updateAIToken") {
      return this.aiTokenHandler.updateToken(params);
    }
    if (toolName === "deleteAIToken") {
      return this.handleDeleteAIToken(params);
    }
    if (toolName === "addRelationship") {
      return this.aiTokenHandler.addRelationship(params);
    }
    if (toolName === "removeRelationship") {
      return this.aiTokenHandler.removeRelationship(params);
    }

    // Entity tools (delegated)
    if (toolName === "createBrandPrinciple") {
      return this.entityHandler.createBrandPrinciple(params);
    }
    if (toolName === "createUsageContext") {
      return this.entityHandler.createUsageContext(params);
    }
    if (toolName === "createConstraint") {
      return this.entityHandler.createConstraint(params);
    }

    // Generation tool
    if (toolName === "generate_design_system") {
      return this.generateDesignSystem(params);
    }

    // Try the registry for all other tools
    if (this.registry.has(toolName)) {
      return this.registry.execute(toolName, params);
    }

    return {
      success: false,
      error: `Unknown tool: ${toolName}. Use get_design_system_operations to see available tools.`,
    };
  }

  /**
   * Discovery: List available operations
   */
  private async getDesignSystemOperations(params: {
    category?: string;
  }): Promise<ToolResponse> {
    let operations = Object.entries(OPERATIONS_METADATA);

    if (params.category) {
      operations = operations.filter(([_, op]) => op.category === params.category);
    }

    const result = operations.map(([name, op]) => ({
      name,
      category: op.category,
      description: op.description,
      hasSideEffects: ["modify", "create", "history"].includes(op.category),
    }));

    return {
      success: true,
      data: {
        operations: result,
        categories: ["query", "modify", "analyze", "create", "history", "export"],
      },
      message: `Found ${result.length} operations${
        params.category ? ` in category "${params.category}"` : ""
      }`,
    };
  }

  /**
   * Discovery: Get operation details
   */
  private async getOperationInfo(params: { operation: string }): Promise<ToolResponse> {
    const op = OPERATIONS_METADATA[params.operation as keyof typeof OPERATIONS_METADATA];

    if (!op) {
      return {
        success: false,
        error: `Unknown operation: ${params.operation}`,
      };
    }

    // Get definition from registry if available
    const handler = this.registry.getHandler(params.operation);
    const definition = handler?.getDefinition();

    return {
      success: true,
      data: {
        operation: params.operation,
        category: op.category,
        description: op.description,
        parameters: definition?.parameters || {},
        returns: definition?.returns || "ToolResponse",
      },
    };
  }

  /**
   * Execution layer: Execute an operation
   */
  private async executeOperation(params: {
    operation: string;
    params: any;
  }): Promise<ToolResponse> {
    const { operation, params: operationParams } = params;

    // Route through handleTool for consistency
    return this.handleTool(operation, operationParams);
  }

  /**
   * Delete AI token handler
   */
  private async handleDeleteAIToken(params: {
    id: string;
    force?: boolean;
  }): Promise<ToolResponse> {
    const node = this.graph.getNode(params.id);
    if (!node) {
      return {
        success: false,
        error: `Token "${params.id}" not found`,
      };
    }

    const dependents = this.graph.getDependents(params.id);
    if (dependents.length > 0 && !params.force) {
      return {
        success: false,
        error: `Cannot delete token "${node.name}": ${dependents.length} tokens depend on it.`,
        data: {
          dependents: dependents.map((d) => ({ id: d.id, name: d.name })),
        },
      };
    }

    const change = this.graph.deleteNode(params.id);

    return {
      success: true,
      message: `Deleted token: ${node.name}`,
      data: {
        id: params.id,
        name: node.name,
        version: change.version,
        dependentsAffected: dependents.length,
      },
    };
  }

  /**
   * Generate design system placeholder
   */
  private async generateDesignSystem(params: {
    prompt: string;
    focus?: string;
  }): Promise<ToolResponse> {
    return {
      success: true,
      data: {
        action: "generate_design_system",
        prompt: params.prompt,
        focus: params.focus || "full",
        message: `Starting design system generation for: "${params.prompt}"`,
      },
      message: "Initiating design system generation.",
    };
  }

  // Enhanced methods for backward compatibility with EnhancedToolHandlers

  async searchTokensEnhanced(params: any): Promise<ToolResponse> {
    const baseResult = await this.handleTool("searchTokens", params);
    if (!baseResult.success) return baseResult;

    const responseMode = params.response_mode || "summary";
    const allTokens = baseResult.data?.tokens || [];
    const total = baseResult.data?.total || allTokens.length;

    if (responseMode === "summary" && total > 5) {
      return {
        success: true,
        data: {
          summary: `Found ${total} tokens. Showing first 5.`,
          count: total,
          sample_items: allTokens.slice(0, 5),
          full_data_available: true,
        },
        message: `Found ${total} tokens`,
      };
    }

    if (responseMode === "paginated") {
      const page = params.page || 1;
      const pageSize = params.page_size || 20;
      const startIdx = (page - 1) * pageSize;
      const pageItems = allTokens.slice(startIdx, startIdx + pageSize);

      return {
        success: true,
        data: {
          items: pageItems,
          total,
          page,
          page_size: pageSize,
          has_more: startIdx + pageSize < total,
        },
        message: `Page ${page} of ${Math.ceil(total / pageSize)}`,
      };
    }

    return baseResult;
  }

  async analyzeDesignSystemEnhanced(params: any): Promise<ToolResponse> {
    const baseResult = await this.handleTool("analyzeDesignSystem", params);
    if (!baseResult.success) return baseResult;

    const responseMode = params.response_mode || "summary";

    if (responseMode === "summary" && baseResult.data?.insights) {
      const insights = baseResult.data.insights;
      return {
        success: true,
        data: {
          summary: insights.executiveSummary,
          count:
            baseResult.data.summary.issuesFound +
            baseResult.data.summary.opportunitiesFound,
          sample_items: {
            healthScore: insights.healthScore,
            topRecommendations: insights.topRecommendations.slice(0, 3),
          },
          full_data_available: true,
        },
        message: `Health: ${insights.healthScore}/100`,
      };
    }

    return baseResult;
  }

  async executeOperationEnhanced(params: any): Promise<ToolResponse> {
    const { operation, params: operationParams } = params;

    // Route to enhanced handlers
    switch (operation) {
      case "searchTokens":
        return this.searchTokensEnhanced(operationParams);
      case "analyzeDesignSystem":
        return this.analyzeDesignSystemEnhanced(operationParams);
      default:
        return this.executeOperation(params);
    }
  }
}
