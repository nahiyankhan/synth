/**
 * Tool Handlers for AI Design System Editing
 *
 * Layered architecture: Discovery → Planning → Execution
 */

import { StyleGraph } from "../core/StyleGraph";
import { StyleNode, StyleMode } from "../types/styleGraph";
import {
  TokenInfo,
  SearchResult,
  ImpactAnalysisResult,
  ToolResponse,
} from "../types/aiTools";
import { ExecuteCommandHandler } from "../tools/handlers/filesystem/ExecuteCommandHandler";
import { AITokenHandler } from "../tools/handlers/authoring/AITokenHandler";
import { EntityHandler } from "../tools/handlers/authoring/EntityHandler";

/**
 * Operation metadata for discovery and planning layers
 */
const OPERATIONS = {
  // Query operations
  getToken: {
    category: "query",
    description:
      "Get detailed information about a specific design token by path",
    parameters: {
      path: {
        type: "string",
        required: true,
        description: 'Full token path (e.g., "base.color.grey.65.light")',
      },
      mode: {
        type: "string",
        required: false,
        enum: ["light", "dark"],
        description: "Mode to resolve value in",
      },
    },
    returns:
      "TokenInfo object with path, layer, type, resolved values, dependencies, and dependents",
  },
  searchTokens: {
    category: "query",
    description: "Search for tokens by query string, layer, or type",
    parameters: {
      query: {
        type: "string",
        required: false,
        description: "Search query to match against paths and values",
      },
      layer: {
        type: "string",
        required: false,
        enum: ["primitive", "utility", "composite"],
        description: "Filter by layer",
      },
      type: {
        type: "string",
        required: false,
        enum: ["color", "typography", "size", "other"],
        description: "Filter by type",
      },
      limit: {
        type: "number",
        required: false,
        description: "Max results to return (default: all)",
      },
    },
    returns: "SearchResult with matching tokens array and total count",
  },
  // Modify operations
  updateToken: {
    category: "modify",
    description: "Update the value of an existing design token",
    parameters: {
      path: {
        type: "string",
        required: true,
        description: "Full token path to update",
      },
      value: {
        type: "string",
        required: true,
        description:
          'New value (primitive or reference like "{base.color.black.light}")',
      },
      description: {
        type: "string",
        required: false,
        description: "Change description for history",
      },
    },
    returns: "Updated token info with old/new values and version",
    sideEffects:
      "Modifies design system state, affects dependents, adds to history",
  },
  createToken: {
    category: "modify",
    description: "Create a new design token",
    parameters: {
      path: {
        type: "string",
        required: true,
        description: "Full path for new token",
      },
      value: {
        type: "string",
        required: true,
        description: "Token value (primitive or reference)",
      },
      layer: {
        type: "string",
        required: true,
        enum: ["primitive", "utility"],
        description: "Token layer",
      },
      type: {
        type: "string",
        required: true,
        enum: ["color", "typography", "size", "other"],
        description: "Token type",
      },
      description: {
        type: "string",
        required: false,
        description: "Token description",
      },
    },
    returns: "Created token info with path, value, and version",
    sideEffects: "Adds new token to design system, adds to history",
  },
  deleteToken: {
    category: "modify",
    description: "Delete a design token (warns if has dependents)",
    parameters: {
      path: {
        type: "string",
        required: true,
        description: "Full token path to delete",
      },
      force: {
        type: "boolean",
        required: false,
        default: false,
        description: "Force deletion even with dependents",
      },
    },
    returns: "Deletion confirmation with path and version",
    sideEffects:
      "Removes token from design system, may break dependents, adds to history",
  },
  // Analyze operations
  getImpactAnalysis: {
    category: "analyze",
    description: "Analyze the impact of changing a token",
    parameters: {
      path: {
        type: "string",
        required: true,
        description: "Full token path to analyze",
      },
    },
    returns: "ImpactAnalysisResult with affected tokens and components",
  },
  getSystemStats: {
    category: "analyze",
    description: "Get overall statistics about the design language",
    parameters: {
      includeSpecs: {
        type: "boolean",
        required: false,
        default: false,
        description: "Include composite specs",
      },
    },
    returns:
      "Language statistics with token counts by layer/type, depth, circular dependencies",
  },
  // History operations
  undoChange: {
    category: "history",
    description: "Undo the last change made to the design language",
    parameters: {},
    returns: "Success confirmation",
    sideEffects: "Reverts last modification",
  },
  redoChange: {
    category: "history",
    description: "Redo a previously undone change",
    parameters: {},
    returns: "Success confirmation",
    sideEffects: "Re-applies previously undone modification",
  },
  // Export operations
  exportDesignSystem: {
    category: "export",
    description: "Export the design language to JSON or YAML",
    parameters: {
      format: {
        type: "string",
        required: false,
        enum: ["json", "yaml"],
        default: "json",
        description: "Export format",
      },
    },
    returns: "Serialized design language in specified format",
  },
  exportTailwindConfig: {
    category: "export",
    description: "Export design system as Tailwind v4 CSS configuration that remaps default Tailwind classes to your design tokens. Makes standard Tailwind utilities (bg-primary, text-foreground, p-4) use your design system values.",
    parameters: {
      exportType: {
        type: "string",
        required: false,
        enum: ["theme", "tokens", "both"],
        default: "both",
        description: "Type of export: theme (remap defaults), tokens (direct utilities), or both",
      },
      includeReadme: {
        type: "boolean",
        required: false,
        default: true,
        description: "Include README with usage instructions and examples",
      },
    },
    returns: "Tailwind v4 CSS files (theme.css, tokens.css, README.md) with remapped classes",
  },
  analyzeDesignSystem: {
    category: "analyze",
    description:
      "Comprehensive data scientist-style analysis of the design system including usage patterns, redundancies, health metrics, and optimization opportunities. Returns both structured data and narrative insights with specific recommendations.",
    parameters: {
      category: {
        type: "string",
        required: false,
        enum: ["all", "usage", "redundancy", "health", "optimization"],
        default: "all",
        description: "Filter analysis by category",
      },
      layer: {
        type: "string",
        required: false,
        enum: ["primitive", "utility", "composite"],
        description: "Optional: focus analysis on specific layer",
      },
      type: {
        type: "string",
        required: false,
        enum: ["color", "typography", "size", "spacing", "other"],
        description: "Optional: focus analysis on specific type",
      },
    },
    returns:
      "DesignSystemAnalysis with usage metrics, redundancy detection, health assessment, optimization opportunities, and narrative insights",
  },
  renameToken: {
    category: "modify",
    description:
      "Rename a token and automatically update all references throughout the design system. This is the safe way to change token paths.",
    parameters: {
      oldPath: {
        type: "string",
        required: true,
        description: 'Current token path (e.g., "base.color.primary")',
      },
      newPath: {
        type: "string",
        required: true,
        description: 'New token path (e.g., "base.color.brand")',
      },
    },
    returns:
      "Success confirmation with details of renamed token and updated references",
    sideEffects:
      "Renames token, updates all dependent tokens that reference it, adds to history",
  },
  findAllReferences: {
    category: "query",
    description:
      "Find all tokens that reference (depend on) a specific token, including both direct and transitive references.",
    parameters: {
      path: {
        type: "string",
        required: true,
        description: "Token path to find references for",
      },
    },
    returns: "List of direct and all (transitive) references with usage count",
  },
  findAndReplace: {
    category: "modify",
    description:
      "Find and replace patterns across token paths or values. Supports exact match, contains, or regex patterns. Use dryRun to preview changes.",
    parameters: {
      searchPattern: {
        type: "string",
        required: true,
        description: "Pattern to search for (exact text or regex)",
      },
      replaceWith: {
        type: "string",
        required: true,
        description: "Replacement text",
      },
      searchIn: {
        type: "string",
        required: true,
        enum: ["path", "value", "both"],
        description: "Where to search",
      },
      matchType: {
        type: "string",
        required: true,
        enum: ["exact", "contains", "regex"],
        description: "How to match the pattern",
      },
      layer: {
        type: "string",
        required: false,
        enum: ["primitive", "utility"],
        description: "Optional: filter by layer",
      },
      type: {
        type: "string",
        required: false,
        enum: ["color", "typography", "size", "spacing", "other"],
        description: "Optional: filter by type",
      },
      dryRun: {
        type: "boolean",
        required: false,
        default: true,
        description: "Preview changes without applying them",
      },
    },
    returns: "Array of matches with before/after values and update status",
    sideEffects:
      "If dryRun=false, modifies matching tokens and adds to history",
  },
  generateColorScale: {
    category: "create",
    description:
      "Generate a perceptually uniform color scale from a base color using OKLCH color space. Creates a range from light tints to dark shades.",
    parameters: {
      baseColor: {
        type: "string",
        required: true,
        description: 'Base hex color (e.g., "#3B82F6")',
      },
      steps: {
        type: "number",
        required: false,
        default: 9,
        description: "Number of steps in the scale (typically 5, 9, or 11)",
      },
      namingPattern: {
        type: "string",
        required: true,
        description:
          'Path pattern with {step} placeholder (e.g., "base.color.blue.{step}")',
      },
      layer: {
        type: "string",
        required: false,
        enum: ["primitive", "utility"],
        default: "primitive",
        description: "Layer to create tokens in",
      },
    },
    returns: "Array of created color tokens with their hex values",
    sideEffects:
      "Creates new color tokens in the design system, adds to history",
  },
  suggestColorsForGaps: {
    category: "analyze",
    description:
      "Analyze color distribution in OKLCH space, detect gaps in the color progression, and suggest colors to fill those gaps for a more complete palette.",
    parameters: {
      filter: {
        type: "string",
        required: false,
        enum: ["all", "primitives", "utilities"],
        default: "all",
        description: "Which colors to analyze",
      },
      threshold: {
        type: "number",
        required: false,
        default: 0.15,
        description:
          "Gap detection threshold (OKLCH distance, typically 0.1-0.2)",
      },
      maxSuggestions: {
        type: "number",
        required: false,
        default: 10,
        description: "Maximum number of color suggestions to return",
      },
    },
    returns:
      "Array of gap locations with suggested colors (hex values) to fill them",
    sideEffects: "Creates StyleGraph, saves to IndexedDB, loads into editor",
  },
};

/**
 * Convert a StyleNode to TokenInfo for AI response
 */
function nodeToTokenInfo(node: StyleNode, graph: StyleGraph): TokenInfo {
  return {
    path: node.id,
    name: node.name,
    layer: node.layer,
    type: node.type,
    value: node.value,
    resolvedLight: graph.resolveNode(node.id, "light"),
    resolvedDark: graph.resolveNode(node.id, "dark"),
    dependencies: Array.from(node.dependencies).map((id) => {
      const dep = graph.getNode(id);
      return dep ? dep.id : id;
    }),
    dependents: Array.from(node.dependents).map((id) => {
      const dep = graph.getNode(id);
      return dep ? dep.id : id;
    }),
    isSpec: node.metadata?.isSpec || false,
  };
}

export class ToolHandlers {
  private executeCommandHandler: ExecuteCommandHandler;
  private aiTokenHandler: AITokenHandler;
  private entityHandler: EntityHandler;

  constructor(private graph: StyleGraph) {
    this.executeCommandHandler = new ExecuteCommandHandler(graph);
    this.aiTokenHandler = new AITokenHandler(graph);
    this.entityHandler = new EntityHandler(graph);
  }

  async getToken(params: {
    path: string;
    mode?: StyleMode;
  }): Promise<ToolResponse> {
    try {
      const node = this.graph.getNode(params.path);

      if (!node) {
        return {
          success: false,
          error: `Token not found: ${params.path}`,
        };
      }

      return {
        success: true,
        data: nodeToTokenInfo(node, this.graph),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async searchTokens(params: {
    query?: string;
    layer?: "primitive" | "utility" | "composite";
    type?: "color" | "typography" | "size" | "other";
    // NEW: Intent-based filters
    quality?: string; // Filter by intent.qualities
    designedFor?: string; // Filter by intent.designedFor
    purpose?: string; // Search in intent.purpose
    limit?: number;
  }): Promise<ToolResponse> {
    try {
      const excludeSpecs = params.layer !== "composite";
      let nodes = this.graph.getNodes({ excludeSpecs });

      // Filter by layer
      if (params.layer) {
        nodes = nodes.filter((n) => n.layer === params.layer);
      }

      // Filter by type
      if (params.type) {
        nodes = nodes.filter((n) => n.type === params.type);
      }

      // NEW: Filter by intent quality
      if (params.quality) {
        nodes = nodes.filter(
          (n) => n.intent?.qualities?.includes(params.quality!)
        );
      }

      // NEW: Filter by intent designedFor
      if (params.designedFor) {
        nodes = nodes.filter(
          (n) => n.intent?.designedFor?.includes(params.designedFor!)
        );
      }

      // NEW: Filter by intent purpose
      if (params.purpose) {
        const purposeQuery = params.purpose.toLowerCase();
        nodes = nodes.filter((n) =>
          n.intent?.purpose?.toLowerCase().includes(purposeQuery)
        );
      }

      // Filter by query
      if (params.query) {
        const query = params.query.toLowerCase();
        nodes = nodes.filter(
          (n) =>
            n.id.toLowerCase().includes(query) ||
            n.name.toLowerCase().includes(query) ||
            JSON.stringify(n.value).toLowerCase().includes(query)
        );
      }

      const limit = params.limit || nodes.length;
      const result: SearchResult = {
        tokens: nodes
          .slice(0, limit)
          .map((n) => nodeToTokenInfo(n, this.graph)),
        total: nodes.length,
        query: params.query || "all",
      };

      return {
        success: true,
        data: result,
        message: `Found ${nodes.length} token${nodes.length !== 1 ? "s" : ""}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async updateToken(params: {
    path: string;
    value: string;
    description?: string;
  }): Promise<ToolResponse> {
    try {
      const node = this.graph.getNode(params.path);

      if (!node) {
        return {
          success: false,
          error: `Token not found: ${params.path}`,
        };
      }

      // Check if it's a spec (composite) - warn user
      if (node.metadata?.isSpec) {
        return {
          success: false,
          error: `Cannot edit composite tokens (design specs). These will be replaced by component tracking. Consider editing the underlying primitive or utility tokens instead.`,
        };
      }

      // Parse value - check if it's a reference or primitive
      let newValue: any = params.value;

      // If it looks like a reference, keep it as string
      if (params.value.startsWith("{") && params.value.endsWith("}")) {
        newValue = params.value;
      } else if (
        node.type === "color" ||
        node.type === "typography" ||
        node.type === "other"
      ) {
        // Keep as string
        newValue = params.value;
      } else {
        // Try to parse as number for sizes/spacing
        const num = parseFloat(params.value);
        if (!isNaN(num)) {
          newValue = num;
        }
      }

      const change = this.graph.updateNode(node.id, {
        value: newValue,
      });

      return {
        success: true,
        data: {
          path: params.path,
          oldValue: change.before?.value,
          newValue: newValue,
          version: change.version,
        },
        message: `Updated ${params.path} to ${newValue}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getImpactAnalysis(params: { path: string }): Promise<ToolResponse> {
    try {
      const node = this.graph.getNode(params.path);

      if (!node) {
        return {
          success: false,
          error: `Token not found: ${params.path}`,
        };
      }

      const impact = this.graph.getImpactAnalysis(node.id);

      const result: ImpactAnalysisResult = {
        path: params.path,
        directDependents: impact.directDependents.length,
        totalAffected: impact.allDependents.length,
        affectedUtilities: impact.affectedUtilities.map((id) => {
          const n = this.graph.getNode(id);
          return n ? n.id : id;
        }),
        affectedComposites: impact.affectedComposites.map((id) => {
          const n = this.graph.getNode(id);
          return n ? n.id : id;
        }),
        wouldBreak: false, // Could add validation logic here
      };

      return {
        success: true,
        data: result,
        message: `Changing ${params.path} would affect ${result.totalAffected} tokens`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createToken(params: {
    path: string;
    value: string;
    type: "color" | "typography" | "size" | "other";
    // REMOVED: layer (now computed automatically)
    // NEW: Intent fields (all optional for MVP)
    purpose?: string;
    designedFor?: string[];
    constraints?: string[];
    qualities?: string[];
    rationale?: string;
    description?: string;
  }): Promise<ToolResponse> {
    try {
      const pathParts = params.path.split(".");
      const existing = this.graph.getNode(params.path);

      if (existing) {
        return {
          success: false,
          error: `Token already exists: ${params.path}`,
        };
      }

      // Parse value
      let value: any = params.value;
      if (params.value.startsWith("{") && params.value.endsWith("}")) {
        value = params.value;
      } else if (params.type === "size") {
        const num = parseFloat(params.value);
        if (!isNaN(num)) {
          value = num;
        }
      }

      // Build intent from parameters (only if any field provided)
      const intent =
        params.purpose ||
        params.designedFor ||
        params.qualities ||
        params.constraints ||
        params.rationale
          ? {
              purpose: params.purpose,
              designedFor: params.designedFor,
              constraints: params.constraints,
              qualities: params.qualities,
              rationale: params.rationale,
            }
          : undefined;

      const change = this.graph.createNode({
        id: pathParts.join("."),
        name: pathParts[pathParts.length - 1] || pathParts.join("."),
        // layer: computed automatically by StyleGraph
        type: params.type,
        value: value,
        intent,
        metadata: {
          description: params.description,
          createdFrom: "voice",
        },
      });

      return {
        success: true,
        data: {
          path: params.path,
          value: value,
          intent: intent,
          computedLayer: change.after?.layer,
          version: change.version,
        },
        message: `Created new ${change.after?.layer} token: ${params.path}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteToken(params: {
    path: string;
    force?: boolean;
  }): Promise<ToolResponse> {
    try {
      const node = this.graph.getNode(params.path);

      if (!node) {
        return {
          success: false,
          error: `Token not found: ${params.path}`,
        };
      }

      // Check if it's a spec
      if (node.metadata?.isSpec) {
        return {
          success: false,
          error: `Cannot delete composite tokens (design specs). These are loaded from the component library.`,
        };
      }

      // Check for dependents
      if (node.dependents.size > 0 && !params.force) {
        return {
          success: false,
          error: `Cannot delete ${params.path}: ${node.dependents.size} tokens depend on it. Use force=true to delete anyway.`,
          data: {
            dependents: Array.from(node.dependents).map((id) => {
              const dep = this.graph.getNode(id);
              return dep ? dep.id : id;
            }),
          },
        };
      }

      const change = this.graph.deleteNode(node.id);

      return {
        success: true,
        data: {
          path: params.path,
          version: change.version,
        },
        message: `Deleted token: ${params.path}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async undoChange(): Promise<ToolResponse> {
    try {
      const success = this.graph.undo();

      if (!success) {
        return {
          success: false,
          error: "Nothing to undo",
        };
      }

      return {
        success: true,
        message: "Undid last change",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async redoChange(): Promise<ToolResponse> {
    try {
      const success = this.graph.redo();

      if (!success) {
        return {
          success: false,
          error: "Nothing to redo",
        };
      }

      return {
        success: true,
        message: "Redid change",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getSystemStats(params: {
    includeSpecs?: boolean;
  }): Promise<ToolResponse> {
    try {
      const stats = this.graph.getStats();

      return {
        success: true,
        data: {
          totalNodes: stats.totalNodes,
          coreTokens: stats.coreTokensCount,
          designSpecs: stats.specsCount,
          byLayer: stats.byLayer,
          byType: stats.byType,
          maxDepth: stats.maxDepth,
          circularDependencies: stats.circularDependencies.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async exportDesignSystem(params: {
    format?: "json" | "yaml";
  }): Promise<ToolResponse> {
    try {
      const format = params.format || "json";

      let data: string;
      if (format === "yaml") {
        data = this.graph.exportToYAML();
      } else {
        data = this.graph.exportToJSON();
      }

      return {
        success: true,
        data: data,
        message: `Exported design language as ${format.toUpperCase()}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async exportTailwindConfig(params: {
    exportType?: 'theme' | 'tokens' | 'both';
    includeReadme?: boolean;
  }): Promise<ToolResponse> {
    try {
      const { generateTailwindExport } = await import('./tailwindConfigGenerator');
      const exportType = params.exportType || 'both';
      const includeReadme = params.includeReadme ?? true;
      
      const result = generateTailwindExport(this.graph);
      
      // Build response based on export type
      const files: Record<string, string> = {};
      
      if (exportType === 'theme' || exportType === 'both') {
        files['theme.css'] = result.themeConfig;
      }
      
      if (exportType === 'tokens' || exportType === 'both') {
        files['tokens.css'] = result.tokenUtilities;
      }
      
      if (includeReadme) {
        files['README.md'] = result.readme;
      }
      
      return {
        success: true,
        data: files,
        message: `Generated Tailwind v4 configuration (${exportType} export${includeReadme ? ' with README' : ''})`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * LAYER 1: Discovery - Get available operations
   */
  async getDesignSystemOperations(params: {
    category?: string;
  }): Promise<ToolResponse> {
    try {
      let operations = Object.entries(OPERATIONS);

      // Filter by category if specified
      if (params.category) {
        operations = operations.filter(
          ([_, op]) => op.category === params.category
        );
      }

      const result = operations.map(([name, op]) => ({
        name,
        category: op.category,
        description: op.description,
        hasSideEffects: !!(op as any).sideEffects,
      }));

      return {
        success: true,
        data: {
          operations: result,
          categories: ["query", "modify", "analyze", "history", "export"],
        },
        message: `Found ${result.length} operations${
          params.category ? ` in category "${params.category}"` : ""
        }`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * LAYER 2: Planning - Get operation details
   */
  async getOperationInfo(params: { operation: string }): Promise<ToolResponse> {
    try {
      const op = OPERATIONS[params.operation as keyof typeof OPERATIONS];

      if (!op) {
        return {
          success: false,
          error: `Unknown operation: ${params.operation}. Use get_design_system_operations to see available operations.`,
        };
      }

      return {
        success: true,
        data: {
          operation: params.operation,
          category: op.category,
          description: op.description,
          parameters: op.parameters,
          returns: op.returns,
          sideEffects: (op as any).sideEffects || "None - read-only operation",
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * LAYER 3: Execution - Execute operation
   */
  async executeOperation(params: {
    operation: string;
    params: any;
  }): Promise<ToolResponse> {
    try {
      console.log("🔧 executeOperation called with:", params);
      console.log("🔧 params.params:", params.params);

      const op = OPERATIONS[params.operation as keyof typeof OPERATIONS];

      if (!op) {
        return {
          success: false,
          error: `Unknown operation: ${params.operation}. Use get_design_system_operations to see available operations.`,
        };
      }

      console.log("🔧 Operation found:", op);
      console.log(
        "🔧 Required parameters:",
        Object.entries(op.parameters).filter(
          ([_, p]: [string, any]) => p.required
        )
      );

      // Validate required parameters
      const missingParams = Object.entries(op.parameters)
        .filter(([paramName, param]: [string, any]) => {
          const isRequired = param.required;
          const hasValue = params.params && params.params[paramName];
          console.log(
            `🔧 Checking param ${paramName}: required=${isRequired}, hasValue=${hasValue}, value=`,
            params.params?.[paramName]
          );
          return isRequired && !hasValue;
        })
        .map(([name]) => name);

      console.log("🔧 Missing params:", missingParams);

      if (missingParams.length > 0) {
        return {
          success: false,
          error: `Missing required parameters: ${missingParams.join(
            ", "
          )}. Use get_operation_info("${
            params.operation
          }") to see parameter details.`,
        };
      }

      // Dispatch to actual handler
      switch (params.operation) {
        case "getToken":
          return this.getToken(params.params);
        case "searchTokens":
          return this.searchTokens(params.params);
        case "updateToken":
          return this.updateToken(params.params);
        case "getImpactAnalysis":
          return this.getImpactAnalysis(params.params);
        case "createToken":
          return this.createToken(params.params);
        case "deleteToken":
          return this.deleteToken(params.params);
        case "undoChange":
          return this.undoChange();
        case "redoChange":
          return this.redoChange();
        case "getSystemStats":
          return this.getSystemStats(params.params);
        case "exportDesignSystem":
          return this.exportDesignSystem(params.params);
        case "exportTailwindConfig":
          return this.exportTailwindConfig(params.params);
        case "analyzeDesignSystem":
          return this.analyzeDesignSystem(params.params);
        case "renameToken":
          return this.renameToken(params.params);
        case "findAllReferences":
          return this.findAllReferences(params.params);
        case "findAndReplace":
          return this.findAndReplace(params.params);
        case "generateColorScale":
          return this.generateColorScale(params.params);
        case "suggestColorsForGaps":
          return this.suggestColorsForGaps(params.params);
        default:
          return {
            success: false,
            error: `Operation not implemented: ${params.operation}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Main tool dispatcher - routes to layered tools
   */
  async handleTool(toolName: string, params: any): Promise<ToolResponse> {
    switch (toolName) {
      case "get_design_system_operations":
        return this.getDesignSystemOperations(params);
      case "get_operation_info":
        return this.getOperationInfo(params);
      case "execute_operation":
        return this.executeOperation(params);
      
      // Filesystem exploration (NEW - Phase 1)
      case "executeCommand":
        return this.executeCommand(params);
      
      // AI-Native authoring tools (NEW - Phase 3)
      case "createAIToken":
        return this.createAIToken(params);
      case "updateAIToken":
        return this.updateAIToken(params);
      case "deleteAIToken":
        return this.deleteAIToken(params);
      case "addRelationship":
        return this.addRelationship(params);
      case "removeRelationship":
        return this.removeRelationship(params);
      case "createBrandPrinciple":
        return this.createBrandPrinciple(params);
      case "createUsageContext":
        return this.createUsageContext(params);
      case "createConstraint":
        return this.createConstraint(params);
      
      // Legacy support - direct calls to operations (will be deprecated)
      case "getToken":
        return this.getToken(params);
      case "searchTokens":
        return this.searchTokens(params);
      case "updateToken":
        return this.updateToken(params);
      case "getImpactAnalysis":
        return this.getImpactAnalysis(params);
      case "createToken":
        return this.createToken(params);
      case "deleteToken":
        return this.deleteToken(params);
      case "undoChange":
        return this.undoChange();
      case "redoChange":
        return this.redoChange();
      case "getSystemStats":
        return this.getSystemStats(params);
      case "exportDesignSystem":
        return this.exportDesignSystem(params);
      case "exportTailwindConfig":
        return this.exportTailwindConfig(params);
      case "analyzeDesignSystem":
        return this.analyzeDesignSystem(params);
      case "renameToken":
        return this.renameToken(params);
      case "findAllReferences":
        return this.findAllReferences(params);
      case "findAndReplace":
        return this.findAndReplace(params);
      case "generateColorScale":
        return this.generateColorScale(params);
      case "suggestColorsForGaps":
        return this.suggestColorsForGaps(params);
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
  }

  /**
   * Execute a Unix command on the virtual file system (NEW - Phase 1)
   */
  async executeCommand(params: { command: string }): Promise<ToolResponse> {
    return this.executeCommandHandler.execute(params);
  }

  /**
   * Create AI-native token with relationships (NEW - Phase 3)
   */
  async createAIToken(params: any): Promise<ToolResponse> {
    return this.aiTokenHandler.createToken(params);
  }

  /**
   * Update AI-native token (NEW - Phase 3)
   */
  async updateAIToken(params: any): Promise<ToolResponse> {
    return this.aiTokenHandler.updateToken(params);
  }

  /**
   * Delete AI-native token (NEW - Phase 3)
   */
  async deleteAIToken(params: { id: string; force?: boolean }): Promise<ToolResponse> {
    // For now, use existing deleteToken logic but with ID
    const node = this.graph.getNode(params.id);
    if (!node) {
      return {
        success: false,
        error: `Token "${params.id}" not found`,
      };
    }

    // Check dependents
    const dependents = this.graph.getDependents(params.id);
    if (dependents.length > 0 && !params.force) {
      return {
        success: false,
        error: `Cannot delete token "${node.name}": ${dependents.length} tokens depend on it. Use force: true to delete anyway.`,
        data: {
          dependents: dependents.map(d => ({ id: d.id, name: d.name })),
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
   * Add relationship to token (NEW - Phase 3)
   */
  async addRelationship(params: any): Promise<ToolResponse> {
    return this.aiTokenHandler.addRelationship(params);
  }

  /**
   * Remove relationship from token (NEW - Phase 3)
   */
  async removeRelationship(params: any): Promise<ToolResponse> {
    return this.aiTokenHandler.removeRelationship(params);
  }

  /**
   * Create brand principle entity (NEW - Phase 3)
   */
  async createBrandPrinciple(params: any): Promise<ToolResponse> {
    return this.entityHandler.createBrandPrinciple(params);
  }

  /**
   * Create usage context entity (NEW - Phase 3)
   */
  async createUsageContext(params: any): Promise<ToolResponse> {
    return this.entityHandler.createUsageContext(params);
  }

  /**
   * Create constraint entity (NEW - Phase 3)
   */
  async createConstraint(params: any): Promise<ToolResponse> {
    return this.entityHandler.createConstraint(params);
  }

  /**
   * Rename a token and update all references
   */
  async renameToken(params: {
    oldPath: string;
    newPath: string;
  }): Promise<ToolResponse> {
    try {
      const change = this.graph.renameToken(params.oldPath, params.newPath);

      // Count updated references
      const references = this.graph.findAllReferences(params.newPath);
      const referenceCount = references
        ? references.directReferences.length
        : 0;

      return {
        success: true,
        data: {
          oldPath: params.oldPath,
          newPath: params.newPath,
          version: change.version,
          referencesUpdated: referenceCount,
        },
        message: `Renamed ${params.oldPath} to ${
          params.newPath
        }. Updated ${referenceCount} reference${
          referenceCount !== 1 ? "s" : ""
        }.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Find all references to a token
   */
  async findAllReferences(params: { path: string }): Promise<ToolResponse> {
    try {
      const result = this.graph.findAllReferences(params.path);

      if (!result) {
        return {
          success: false,
          error: `Token not found: ${params.path}`,
        };
      }

      return {
        success: true,
        data: result,
        message: `Found ${result.usageCount} reference${
          result.usageCount !== 1 ? "s" : ""
        } to ${params.path} (${result.directReferences.length} direct, ${
          result.allReferences.length - result.directReferences.length
        } transitive)`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Find and replace patterns
   */
  async findAndReplace(params: {
    searchPattern: string;
    replaceWith: string;
    searchIn: "path" | "value" | "both";
    matchType: "exact" | "contains" | "regex";
    layer?: "primitive" | "utility";
    type?: "color" | "typography" | "size" | "other";
    dryRun?: boolean;
  }): Promise<ToolResponse> {
    try {
      const results = this.graph.findAndReplace({
        searchPattern: params.searchPattern,
        replaceWith: params.replaceWith,
        searchIn: params.searchIn,
        matchType: params.matchType,
        layer: params.layer,
        type: params.type,
        dryRun: params.dryRun !== false, // default to true
      });

      const updatedCount = results.filter((r) => r.updated).length;
      const isDryRun = params.dryRun !== false;

      return {
        success: true,
        data: {
          matches: results,
          totalMatches: results.length,
          updated: updatedCount,
        },
        message: isDryRun
          ? `Found ${results.length} match${
              results.length !== 1 ? "es" : ""
            } (dry run - no changes made)`
          : `Updated ${updatedCount} of ${results.length} match${
              results.length !== 1 ? "es" : ""
            }`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate a color scale from a base color
   */
  async generateColorScale(params: {
    baseColor: string;
    steps?: number;
    namingPattern: string;
    layer?: "primitive" | "utility";
  }): Promise<ToolResponse> {
    try {
      const { hexToOKLCH, generateScale, oklchToHex } = await import(
        "../services/colorScience"
      );

      // Validate base color
      if (!/^#[0-9A-Fa-f]{6}$/.test(params.baseColor)) {
        return {
          success: false,
          error: "Invalid hex color. Must be in format #RRGGBB",
        };
      }

      // Validate naming pattern
      if (!params.namingPattern.includes("{step}")) {
        return {
          success: false,
          error:
            'Naming pattern must include {step} placeholder (e.g., "base.color.blue.{step}")',
        };
      }

      const steps = params.steps || 9;
      const layer = params.layer || "primitive";

      // Generate the scale in OKLCH space
      const baseOKLCH = hexToOKLCH(params.baseColor);
      const scale = generateScale(baseOKLCH, steps);

      // Create tokens for each color in the scale
      const createdTokens: Array<{
        path: string;
        value: string;
        step: number;
      }> = [];

      for (let i = 0; i < scale.length; i++) {
        const hex = oklchToHex(scale[i]);
        const stepNumber = (i + 1) * (100 / steps);
        const path = params.namingPattern.replace(
          "{step}",
          String(Math.round(stepNumber))
        );

        try {
          const change = this.graph.createNode({
            id: path,
            path: path.split("."),
            layer: layer,
            type: "color",
            value: hex,
            metadata: {
              description: `Step ${i + 1}/${steps} of color scale from ${
                params.baseColor
              }`,
              colorScience: {
                oklch: { l: scale[i].l, c: scale[i].c, h: scale[i].h },
                computed: true,
              },
            },
          });

          createdTokens.push({
            path,
            value: hex,
            step: Math.round(stepNumber),
          });
        } catch (error) {
          // Token might already exist, skip it
          console.warn(`Skipped creating ${path}: ${error}`);
        }
      }

      return {
        success: true,
        data: {
          baseColor: params.baseColor,
          steps: steps,
          tokens: createdTokens,
        },
        message: `Generated ${createdTokens.length} color tokens in perceptually uniform scale`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Suggest colors to fill gaps in the palette
   */
  async suggestColorsForGaps(params: {
    filter?: "all" | "primitives" | "utilities";
    threshold?: number;
    maxSuggestions?: number;
  }): Promise<ToolResponse> {
    try {
      const { hexToOKLCH, detectColorGaps, oklchToHex } = await import(
        "../services/colorScience"
      );

      const filter = params.filter || "all";
      const threshold = params.threshold || 0.15;
      const maxSuggestions = params.maxSuggestions || 10;

      // Get all color tokens based on filter
      let colorNodes = Array.from(this.graph.nodes.values()).filter(
        (n) => n.type === "color"
      );

      if (filter === "primitives") {
        colorNodes = colorNodes.filter((n) => n.layer === "primitive");
      } else if (filter === "utilities") {
        colorNodes = colorNodes.filter((n) => n.layer === "utility");
      }

      // Filter out specs
      colorNodes = colorNodes.filter((n) => !n.metadata?.isSpec);

      // Convert to OKLCH with resolved colors
      const colors: Array<{
        nodeId: string;
        color: string;
        oklch: { l: number; c: number; h: number };
      }> = [];

      for (const node of colorNodes) {
        const resolved = this.graph.resolveNode(node.id, "light");
        if (typeof resolved === "string" && resolved.startsWith("#")) {
          try {
            const oklch = hexToOKLCH(resolved);
            colors.push({
              nodeId: node.id,
              color: resolved,
              oklch: { l: oklch.l, c: oklch.c, h: oklch.h },
            });
          } catch (error) {
            // Skip invalid colors
          }
        }
      }

      if (colors.length < 2) {
        return {
          success: false,
          error: "Need at least 2 color tokens to detect gaps",
        };
      }

      // Detect gaps using color science service
      const gaps = detectColorGaps(
        colors.map((c) => c.oklch),
        threshold
      );

      // Limit suggestions
      const limitedGaps = gaps.slice(0, maxSuggestions);

      // Convert gap suggestions to hex and add context
      const suggestions = limitedGaps.map((gap) => {
        // Interpolate between before and after to suggest a color
        const suggestedOKLCH = {
          l: (gap.before.l + gap.after.l) / 2,
          c: (gap.before.c + gap.after.c) / 2,
          h: (gap.before.h + gap.after.h) / 2,
        };

        const suggestedHex = oklchToHex(suggestedOKLCH);

        // Find tokens near this gap
        const beforeIdx = colors.findIndex(
          (c) =>
            c.oklch.l === gap.before.l &&
            c.oklch.c === gap.before.c &&
            c.oklch.h === gap.before.h
        );
        const afterIdx = colors.findIndex(
          (c) =>
            c.oklch.l === gap.after.l &&
            c.oklch.c === gap.after.c &&
            c.oklch.h === gap.after.h
        );

        const nearbyTokens = [];
        if (beforeIdx >= 0) nearbyTokens.push(colors[beforeIdx].nodeId);
        if (afterIdx >= 0) nearbyTokens.push(colors[afterIdx].nodeId);

        // Determine which dimension has the largest gap
        const lightnessDiff = Math.abs(gap.after.l - gap.before.l);
        const chromaDiff = Math.abs(gap.after.c - gap.before.c);
        const hueDiff = Math.abs(gap.after.h - gap.before.h);

        let position = "color space";
        if (lightnessDiff > chromaDiff && lightnessDiff > hueDiff) {
          position = "lightness";
        } else if (chromaDiff > hueDiff) {
          position = "chroma";
        } else {
          position = "hue";
        }

        return {
          suggestedColor: suggestedHex,
          oklch: suggestedOKLCH,
          gapSize: Math.round(gap.gap * 1000) / 1000,
          position,
          nearbyTokens,
          before: oklchToHex(gap.before),
          after: oklchToHex(gap.after),
          reasoning: `Gap of ${
            Math.round(gap.gap * 100) / 100
          } detected between colors. Largest difference in ${position}.`,
        };
      });

      return {
        success: true,
        data: {
          analyzedColors: colors.length,
          gapsDetected: gaps.length,
          suggestions,
          threshold,
        },
        message: `Found ${gaps.length} gap${
          gaps.length !== 1 ? "s" : ""
        } in color palette. Showing ${suggestions.length} suggestion${
          suggestions.length !== 1 ? "s" : ""
        }.`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Comprehensive design system analysis
   */
  async analyzeDesignSystem(params: {
    category?: "all" | "usage" | "redundancy" | "health" | "optimization";
    layer?: "primitive" | "utility" | "composite";
    type?: "color" | "typography" | "size" | "other";
  }): Promise<ToolResponse> {
    try {
      const category = params.category || "all";
      const timestamp = Date.now();

      // Get base stats
      const stats = this.graph.getStats();

      // Initialize result object
      const analysis: any = {
        timestamp,
        category,
        summary: {
          totalTokens: stats.totalNodes,
          coreTokens: stats.coreTokensCount,
          specs: stats.specsCount,
          issuesFound: 0,
          opportunitiesFound: 0,
        },
      };

      // USAGE ANALYSIS
      if (category === "all" || category === "usage") {
        const usageDistribution = this.graph.findUsageDistribution();
        const orphanedTokens = this.graph.findOrphanedTokens();

        // Filter by layer/type if specified
        let filteredOrphaned = orphanedTokens;
        if (params.layer) {
          filteredOrphaned = filteredOrphaned.filter(
            (t) => t.layer === params.layer
          );
        }
        if (params.type) {
          filteredOrphaned = filteredOrphaned.filter(
            (t) => t.type === params.type
          );
        }

        // Get most/least used tokens
        const allTokensWithUsage = Array.from(this.graph.nodes.values())
          .filter((n) => !n.metadata?.isSpec)
          .map((n) => ({
            path: n.id,
            layer: n.layer,
            type: n.type,
            dependentCount: n.dependents.size,
            isSpec: n.metadata?.isSpec || false,
          }));

        // Filter by params
        let filteredTokens = allTokensWithUsage;
        if (params.layer) {
          filteredTokens = filteredTokens.filter(
            (t) => t.layer === params.layer
          );
        }
        if (params.type) {
          filteredTokens = filteredTokens.filter((t) => t.type === params.type);
        }

        const sortedByUsage = [...filteredTokens].sort(
          (a, b) => b.dependentCount - a.dependentCount
        );

        analysis.usage = {
          mostUsedSpecs: sortedByUsage.filter((t) => t.isSpec).slice(0, 10),
          leastUsedSpecs: sortedByUsage
            .filter((t) => t.isSpec)
            .slice(-10)
            .reverse(),
          mostUsedTokens: sortedByUsage.slice(0, 10),
          orphanedTokens: filteredOrphaned,
          usageDistribution: usageDistribution.map((d) => ({
            range: d.range,
            count: d.count,
          })),
        };

        analysis.summary.issuesFound += filteredOrphaned.length;
      }

      // REDUNDANCY ANALYSIS
      if (category === "all" || category === "redundancy") {
        const similarColors = this.graph.findSimilarColors(10);
        const similarNumeric = this.graph.findSimilarNumericValues(10, 2);
        const semanticDuplicates = this.graph.findSemanticDuplicates();

        // Filter by layer/type
        let filteredDuplicates = semanticDuplicates;
        if (params.layer) {
          filteredDuplicates = filteredDuplicates.filter(
            (d) => d.layer === params.layer
          );
        }
        if (params.type) {
          filteredDuplicates = filteredDuplicates.filter(
            (d) => d.type === params.type
          );
        }

        analysis.redundancy = {
          similarColors:
            params.type && params.type !== "color" ? [] : similarColors,
          similarNumericValues: params.type === "color" ? [] : similarNumeric,
          semanticDuplicates: filteredDuplicates,
          totalRedundancies:
            similarColors.length +
            similarNumeric.length +
            filteredDuplicates.length,
        };

        analysis.summary.issuesFound += analysis.redundancy.totalRedundancies;
      }

      // HEALTH ANALYSIS
      if (category === "all" || category === "health") {
        // Find deprecated tokens still in use
        const deprecatedInUse = Array.from(this.graph.nodes.values())
          .filter((n) => n.metadata?.deprecated && n.dependents.size > 0)
          .map((n) => ({
            path: n.id,
            dependentCount: n.dependents.size,
            dependents: Array.from(n.dependents).map((id) => {
              const dep = this.graph.getNode(id);
              return dep ? dep.id : id;
            }),
          }));

        // Find broken references
        const brokenReferences: Array<{ path: string; brokenRef: string }> = [];
        for (const node of this.graph.nodes.values()) {
          const errors = this.graph.validateNode(node.id);
          for (const error of errors) {
            if (error.type === "broken-reference") {
              brokenReferences.push({
                path: node.id,
                brokenRef: error.message,
              });
            }
          }
        }

        const circularDeps = this.graph.findCircularDependencies();

        analysis.health = {
          deprecatedInUse,
          brokenReferences,
          circularDependencies: circularDeps,
        };

        analysis.summary.issuesFound +=
          deprecatedInUse.length +
          brokenReferences.length +
          circularDeps.length;
      }

      // OPTIMIZATION ANALYSIS
      if (category === "all" || category === "optimization") {
        const semanticDuplicates = this.graph.findSemanticDuplicates();
        const optimizationOps = this.graph.findOptimizationOpportunities();
        const orphanedTokens = this.graph.findOrphanedTokens();

        // Filter unused utilities
        const unusedUtilities = orphanedTokens.filter(
          (t) => t.layer === "utility"
        );

        // Filter by params
        let filteredOps = optimizationOps;
        if (params.layer) {
          filteredOps = filteredOps.filter((op) => {
            const node = this.graph.getNode(op.path);
            return node && node.layer === params.layer;
          });
        }
        if (params.type) {
          filteredOps = filteredOps.filter((op) => {
            const node = this.graph.getNode(op.path);
            return node && node.type === params.type;
          });
        }

        const potentialReduction = semanticDuplicates.reduce(
          (sum, dup) => sum + (dup.tokens.length - 1),
          0
        );

        analysis.optimization = {
          consolidationCandidates: semanticDuplicates,
          primitiveToReferenceOpportunities: filteredOps,
          unusedUtilities,
          estimatedReduction: {
            tokens: potentialReduction + unusedUtilities.length,
            percentage: Math.round(
              ((potentialReduction + unusedUtilities.length) /
                stats.totalNodes) *
                100
            ),
          },
        };

        analysis.summary.opportunitiesFound =
          filteredOps.length + unusedUtilities.length;
      }

      // GENERATE NARRATIVE INSIGHTS
      analysis.insights = this.generateNarrativeInsights(analysis, stats);

      return {
        success: true,
        data: analysis,
        message: `Analysis complete: Found ${analysis.summary.issuesFound} issues and ${analysis.summary.opportunitiesFound} optimization opportunities`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate narrative insights from analysis data
   */
  private generateNarrativeInsights(analysis: any, stats: any): any {
    const insights: any = {
      executiveSummary: "",
      topRecommendations: [],
      riskAssessment: "",
      healthScore: 100,
      estimatedImpact: "",
    };

    // Calculate health score (0-100)
    let healthScore = 100;

    if (analysis.health) {
      healthScore -= analysis.health.deprecatedInUse.length * 5;
      healthScore -= analysis.health.brokenReferences.length * 10;
      healthScore -= analysis.health.circularDependencies.length * 15;
    }

    if (analysis.redundancy) {
      healthScore -= Math.min(analysis.redundancy.totalRedundancies * 0.5, 20);
    }

    if (analysis.usage) {
      healthScore -= Math.min(analysis.usage.orphanedTokens.length * 0.5, 10);
    }

    insights.healthScore = Math.max(0, Math.round(healthScore));

    // Executive Summary
    const summaryParts = [];
    summaryParts.push(
      `Your design system contains ${stats.coreTokensCount} core tokens (${stats.byLayer.primitive} primitives, ${stats.byLayer.utility} utilities) and ${stats.specsCount} composite specs.`
    );

    if (insights.healthScore >= 80) {
      summaryParts.push(
        `Overall health is strong (${insights.healthScore}/100).`
      );
    } else if (insights.healthScore >= 60) {
      summaryParts.push(
        `Overall health is moderate (${insights.healthScore}/100) with room for improvement.`
      );
    } else {
      summaryParts.push(
        `Overall health needs attention (${insights.healthScore}/100).`
      );
    }

    if (analysis.redundancy) {
      if (analysis.redundancy.totalRedundancies > 10) {
        summaryParts.push(
          `Significant redundancy detected: ${analysis.redundancy.semanticDuplicates.length} exact duplicates, ${analysis.redundancy.similarColors.length} similar colors, and ${analysis.redundancy.similarNumericValues.length} similar numeric values.`
        );
      }
    }

    if (analysis.usage) {
      if (analysis.usage.orphanedTokens.length > 5) {
        summaryParts.push(
          `${analysis.usage.orphanedTokens.length} orphaned tokens were found that aren't being used.`
        );
      }
    }

    insights.executiveSummary = summaryParts.join(" ");

    // Top Recommendations
    if (analysis.health) {
      if (analysis.health.brokenReferences.length > 0) {
        insights.topRecommendations.push(
          `🚨 CRITICAL: Fix ${
            analysis.health.brokenReferences.length
          } broken reference${
            analysis.health.brokenReferences.length > 1 ? "s" : ""
          } immediately to prevent design inconsistencies.`
        );
      }

      if (analysis.health.circularDependencies.length > 0) {
        insights.topRecommendations.push(
          `🚨 CRITICAL: Resolve ${
            analysis.health.circularDependencies.length
          } circular ${
            analysis.health.circularDependencies.length > 1
              ? "dependencies"
              : "dependency"
          } - these prevent proper token resolution.`
        );
      }

      if (analysis.health.deprecatedInUse.length > 0) {
        insights.topRecommendations.push(
          `⚠️  Update ${
            analysis.health.deprecatedInUse.length
          } deprecated token${
            analysis.health.deprecatedInUse.length > 1 ? "s" : ""
          } that are still being referenced.`
        );
      }
    }

    if (
      analysis.redundancy &&
      analysis.redundancy.semanticDuplicates.length > 0
    ) {
      const topDup = analysis.redundancy.semanticDuplicates[0];
      insights.topRecommendations.push(
        `♻️  Consolidate ${analysis.redundancy.semanticDuplicates.length} sets of duplicate tokens. Start with the ${topDup.tokens.length} tokens sharing value "${topDup.resolvedValue}".`
      );
    }

    if (
      analysis.optimization &&
      analysis.optimization.primitiveToReferenceOpportunities.length > 0
    ) {
      const highImpact =
        analysis.optimization.primitiveToReferenceOpportunities.filter(
          (op: any) => op.impact === "high"
        ).length;
      if (highImpact > 0) {
        insights.topRecommendations.push(
          `🎯 Convert ${highImpact} high-impact primitive${
            highImpact > 1 ? "s" : ""
          } to references to improve maintainability.`
        );
      }
    }

    if (analysis.usage && analysis.usage.orphanedTokens.length > 5) {
      insights.topRecommendations.push(
        `🧹 Clean up ${analysis.usage.orphanedTokens.length} orphaned tokens to reduce clutter and improve discoverability.`
      );
    }

    if (insights.topRecommendations.length === 0) {
      insights.topRecommendations.push(
        `✅ Design system is well-maintained! Continue monitoring for redundancies as it grows.`
      );
    }

    // Limit to top 5 recommendations
    insights.topRecommendations = insights.topRecommendations.slice(0, 5);

    // Risk Assessment
    const risks = [];

    if (analysis.health) {
      if (
        analysis.health.brokenReferences.length > 0 ||
        analysis.health.circularDependencies.length > 0
      ) {
        risks.push(
          "High risk: Critical errors present that break token resolution."
        );
      }

      if (analysis.health.deprecatedInUse.length > 0) {
        risks.push(
          "Medium risk: Deprecated tokens in use may be removed in future, breaking dependent tokens."
        );
      }
    }

    if (analysis.redundancy && analysis.redundancy.totalRedundancies > 20) {
      risks.push(
        "Medium risk: High redundancy makes maintenance difficult and increases chance of inconsistencies."
      );
    }

    if (
      analysis.usage &&
      analysis.usage.orphanedTokens.length > stats.coreTokensCount * 0.2
    ) {
      risks.push(
        "Low risk: Many orphaned tokens suggest unclear token usage patterns or incomplete cleanup."
      );
    }

    if (risks.length === 0) {
      insights.riskAssessment =
        "Low risk: No critical issues detected. Design system is stable and well-maintained.";
    } else {
      insights.riskAssessment = risks.join(" ");
    }

    // Estimated Impact
    if (analysis.optimization) {
      const reduction = analysis.optimization.estimatedReduction;
      if (reduction.tokens > 0) {
        insights.estimatedImpact = `Implementing suggested optimizations could reduce token count by ${reduction.tokens} tokens (${reduction.percentage}%), improving maintainability and reducing cognitive load for designers and developers.`;
      } else {
        insights.estimatedImpact =
          "Design system is lean and well-optimized. Focus on maintaining current quality as it scales.";
      }
    } else {
      insights.estimatedImpact =
        "Run full analysis to estimate optimization impact.";
    }

    return insights;
  }
}
