/**
 * Enhanced Tool Handlers with Pagination and Filtering
 * Extends base ToolHandlers with advanced features
 */

import { StyleGraph } from "@/core/StyleGraph";
import { ToolHandlers } from "./toolHandlers";
import { ToolResponse } from "@/types/toolRegistry";
import {
  PaginatedResponse,
  FilteredResponse,
  EnhancedExecutionParams,
} from "@/types/enhancedTools";

export class EnhancedToolHandlers extends ToolHandlers {
  constructor(graph: StyleGraph) {
    super(graph);
  }

  /**
   * Override handleTool to support new generation tools
   */
  async handleTool(toolName: string, params: any): Promise<ToolResponse> {
    // Handle generation tools that aren't in base class
    if (toolName === "generate_design_system") {
      return this.generateDesignSystem(params);
    }
    
    // Delegate to base class for all other tools
    return super.handleTool(toolName, params);
  }

  /**
   * Enhanced searchTokens with pagination and filtering
   */
  async searchTokensEnhanced(params: {
    query?: string;
    layer?: "primitive" | "utility" | "composite";
    type?: "color" | "typography" | "size" | "other";
    response_mode?: "summary" | "full" | "paginated";
    page?: number;
    page_size?: number;
  }): Promise<ToolResponse> {
    // Get all results using base handler
    const baseResult = await this.searchTokens({
      query: params.query,
      layer: params.layer,
      type: params.type,
    });

    if (!baseResult.success || !baseResult.data) {
      return baseResult;
    }

    const allTokens = baseResult.data.tokens;
    const total = baseResult.data.total;
    const responseMode = params.response_mode || "summary";

    // Summary mode: Return first 5 with summary
    if (responseMode === "summary") {
      const summary =
        total <= 5
          ? `Found ${total} token${total !== 1 ? "s" : ""}.`
          : `Found ${total} tokens. Showing first 5. Use response_mode='paginated' to see more.`;

      return {
        success: true,
        data: {
          summary,
          count: total,
          sample_items: allTokens.slice(0, 5),
          full_data_available: total > 5,
        } as FilteredResponse<any>,
        message: summary,
      };
    }

    // Paginated mode
    if (responseMode === "paginated") {
      const page = params.page || 1;
      const pageSize = params.page_size || 20;
      const startIdx = (page - 1) * pageSize;
      const endIdx = startIdx + pageSize;
      const pageItems = allTokens.slice(startIdx, endIdx);

      return {
        success: true,
        data: {
          items: pageItems,
          total,
          page,
          page_size: pageSize,
          has_more: endIdx < total,
        } as PaginatedResponse<any>,
        message: `Page ${page} of ${Math.ceil(total / pageSize)} (showing ${
          pageItems.length
        } of ${total} tokens)`,
      };
    }

    // Full mode: Return everything
    return baseResult;
  }

  /**
   * Enhanced getImpactAnalysis with filtering
   */
  async getImpactAnalysisEnhanced(params: {
    path: string;
    response_mode?: "summary" | "full";
  }): Promise<ToolResponse> {
    const baseResult = await this.getImpactAnalysis({ path: params.path });

    if (!baseResult.success || !baseResult.data) {
      return baseResult;
    }

    const responseMode = params.response_mode || "summary";

    if (responseMode === "summary") {
      const impact = baseResult.data;
      const summary = `Changing ${params.path} would affect ${impact.totalAffected} tokens (${impact.affectedUtilities.length} utilities, ${impact.affectedComposites.length} composites).`;

      return {
        success: true,
        data: {
          summary,
          count: impact.totalAffected,
          sample_items: {
            path: impact.path,
            directDependents: impact.directDependents,
            totalAffected: impact.totalAffected,
            topUtilities: impact.affectedUtilities.slice(0, 3),
            topComposites: impact.affectedComposites.slice(0, 3),
          },
          full_data_available: true,
        } as FilteredResponse<any>,
        message: summary,
      };
    }

    return baseResult;
  }

  /**
   * Enhanced analyzeDesignSystem with filtering
   */
  async analyzeDesignSystemEnhanced(params: {
    category?: "all" | "usage" | "redundancy" | "health" | "optimization";
    layer?: "primitive" | "utility" | "composite";
    type?: "color" | "typography" | "size" | "other";
    response_mode?: "summary" | "full";
  }): Promise<ToolResponse> {
    const baseResult = await this.analyzeDesignSystem({
      category: params.category,
      layer: params.layer,
      type: params.type,
    });

    if (!baseResult.success || !baseResult.data) {
      return baseResult;
    }

    const responseMode = params.response_mode || "summary";

    if (responseMode === "summary") {
      const analysis = baseResult.data;
      const insights = analysis.insights;

      // Return just the executive summary and top recommendations
      return {
        success: true,
        data: {
          summary: insights.executiveSummary,
          count:
            analysis.summary.issuesFound + analysis.summary.opportunitiesFound,
          sample_items: {
            healthScore: insights.healthScore,
            topRecommendations: insights.topRecommendations.slice(0, 3),
            issuesFound: analysis.summary.issuesFound,
            opportunitiesFound: analysis.summary.opportunitiesFound,
          },
          full_data_available: true,
        } as FilteredResponse<any>,
        message: `Health score: ${insights.healthScore}/100. Found ${analysis.summary.issuesFound} issues and ${analysis.summary.opportunitiesFound} opportunities.`,
      };
    }

    return baseResult;
  }

  /**
   * Enhanced findAndReplace with pagination
   */
  async findAndReplaceEnhanced(params: {
    searchPattern: string;
    replaceWith: string;
    searchIn: "path" | "value" | "both";
    matchType: "exact" | "contains" | "regex";
    layer?: "primitive" | "utility";
    type?: "color" | "typography" | "size" | "other";
    dryRun?: boolean;
    response_mode?: "summary" | "paginated";
    page?: number;
    page_size?: number;
  }): Promise<ToolResponse> {
    const baseResult = await this.findAndReplace({
      searchPattern: params.searchPattern,
      replaceWith: params.replaceWith,
      searchIn: params.searchIn,
      matchType: params.matchType,
      layer: params.layer,
      type: params.type,
      dryRun: params.dryRun,
    });

    if (!baseResult.success || !baseResult.data) {
      return baseResult;
    }

    const allMatches = baseResult.data.matches;
    const total = allMatches.length;
    const responseMode = params.response_mode || "summary";

    if (responseMode === "summary") {
      const updated = baseResult.data.updated;
      const isDryRun = params.dryRun !== false;
      const summary = isDryRun
        ? `Found ${total} match${
            total !== 1 ? "es" : ""
          } (dry run - no changes made). Showing first 5.`
        : `Updated ${updated} of ${total} match${
            total !== 1 ? "es" : ""
          }. Showing first 5.`;

      return {
        success: true,
        data: {
          summary,
          count: total,
          sample_items: allMatches.slice(0, 5),
          full_data_available: total > 5,
          updated: updated,
        } as FilteredResponse<any>,
        message: summary,
      };
    }

    if (responseMode === "paginated") {
      const page = params.page || 1;
      const pageSize = params.page_size || 20;
      const startIdx = (page - 1) * pageSize;
      const endIdx = startIdx + pageSize;
      const pageItems = allMatches.slice(startIdx, endIdx);

      return {
        success: true,
        data: {
          items: pageItems,
          total,
          page,
          page_size: pageSize,
          has_more: endIdx < total,
          updated: baseResult.data.updated,
        } as PaginatedResponse<any>,
        message: `Page ${page} of ${Math.ceil(total / pageSize)}`,
      };
    }

    return baseResult;
  }

  /**
   * Enhanced findAllReferences with filtering
   */
  async findAllReferencesEnhanced(params: {
    path: string;
    response_mode?: "summary" | "full";
  }): Promise<ToolResponse> {
    const baseResult = await this.findAllReferences({ path: params.path });

    if (!baseResult.success || !baseResult.data) {
      return baseResult;
    }

    const responseMode = params.response_mode || "summary";

    if (responseMode === "summary") {
      const data = baseResult.data;
      const summary = `Found ${data.usageCount} reference${
        data.usageCount !== 1 ? "s" : ""
      } to ${params.path} (${data.directReferences.length} direct).`;

      return {
        success: true,
        data: {
          summary,
          count: data.usageCount,
          sample_items: {
            directReferences: data.directReferences.slice(0, 5),
            transitiveCount:
              data.allReferences.length - data.directReferences.length,
          },
          full_data_available: true,
        } as FilteredResponse<any>,
        message: summary,
      };
    }

    return baseResult;
  }

  /**
   * Generate a design system using AI
   * This is a special handler that doesn't use the StyleGraph directly
   */
  async generateDesignSystem(params: {
    prompt: string;
    focus?: "full" | "colors" | "typography";
  }): Promise<ToolResponse> {
    const { prompt, focus = "full" } = params;
    
    return {
      success: true,
      data: {
        action: "generate_design_system",
        prompt,
        focus,
        message: `Starting design system generation for: "${prompt}". This will create a new design language with AI-generated tokens. Generation happens asynchronously - you'll be notified when complete.`,
      },
      message: `Initiating design system generation. Please wait while I create a comprehensive design system based on your description.`,
    };
  }

  /**
   * Enhanced execute operation that routes to enhanced handlers
   */
  async executeOperationEnhanced(
    params: EnhancedExecutionParams
  ): Promise<ToolResponse> {
    const { operation, params: operationParams } = params;

    // Route to enhanced handlers that support response modes
    switch (operation) {
      case "searchTokens":
        return this.searchTokensEnhanced(operationParams);
      case "getImpactAnalysis":
        return this.getImpactAnalysisEnhanced(operationParams);
      case "analyzeDesignSystem":
        return this.analyzeDesignSystemEnhanced(operationParams);
      case "findAndReplace":
        return this.findAndReplaceEnhanced(operationParams);
      case "findAllReferences":
        return this.findAllReferencesEnhanced(operationParams);
      case "generate_design_system":
        return this.generateDesignSystem(operationParams);

      // Fall back to base execute for operations without enhanced versions
      default:
        return this.executeOperation({ operation, params: operationParams });
    }
  }
}
