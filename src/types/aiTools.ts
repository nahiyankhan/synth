/**
 * AI Tool Definitions for Design System Editing
 *
 * Layered architecture following "tools like ogres" pattern:
 * - Discovery Layer: What operations are available?
 * - Planning Layer: What parameters do I need?
 * - Execution Layer: Run the operation
 *
 * ENHANCED VERSION with lazy loading and examples available via getEnhancedGeminiTools()
 */

// Legacy tool definitions (backward compatible)
export const designSystemTools = [
  {
    functionDeclarations: [
      {
        name: "get_design_system_operations",
        description:
          "Discovery layer: Get a list of all available operations you can perform on the design system. Use this first to understand what capabilities are available.",
        parameters: {
          type: "OBJECT" as const,
          properties: {
            category: {
              type: "STRING" as const,
              enum: ["query", "modify", "analyze", "history", "export"],
              description: "Optional: filter operations by category",
            },
          },
        },
      },
      {
        name: "get_operation_info",
        description:
          "Planning layer: Get detailed information about a specific operation including required parameters, validation rules, and expected response format. Use this before executing an operation.",
        parameters: {
          type: "OBJECT" as const,
          properties: {
            operation: {
              type: "STRING" as const,
              description:
                'The operation name (e.g., "getToken", "updateToken", "searchTokens")',
            },
          },
          required: ["operation"],
        },
      },
      {
        name: "execute_operation",
        description:
          "Execution layer: Execute a design system operation with the specified parameters. Only use this after consulting get_operation_info to ensure you have the correct parameters.",
        parameters: {
          type: "OBJECT" as const,
          properties: {
            operation: {
              type: "STRING" as const,
              description:
                'The operation to execute (e.g., "getToken", "updateToken")',
            },
            params: {
              type: "OBJECT" as const,
              description: "The parameters for the operation as a JSON object",
            },
          },
          required: ["operation", "params"],
        },
      },
      // View Navigation
      {
        name: "navigate_to_view",
        description:
          'Navigate to a specific view within the editor (colors, typography, sizes, components, or gallery). Use this when the user asks to "see colors", "show typography", "view spacing", "show components", or wants to focus on a particular aspect of the design system.',
        parameters: {
          type: "OBJECT" as const,
          properties: {
            view: {
              type: "STRING" as const,
              enum: ["gallery", "colors", "typography", "sizes", "components", "content"],
              description:
                "The view to navigate to: gallery (overview), colors (color tokens), typography (font sizes), sizes (spacing/border radius values), components (component specs), or content (voice & tone guidelines)",
            },
          },
          required: ["view"],
        },
      },
      // Generation Mode Navigation
      {
        name: "create_new_design_system",
        description:
          'Navigate to generation mode to create a brand new design language from scratch. Use this when the user wants to "generate a new design system", "create a minimalist design language", "build something new", or start fresh. This will leave the current design language and take them to the creation page.',
        parameters: {
          type: "OBJECT" as const,
          properties: {},
        },
      },
      // Filesystem exploration (Phase 1)
      {
        name: "executeCommand",
        description:
          'Execute a Unix command to explore the design system files. Supports: grep, cat, jq, find, ls, tree, wc. Use this to query the design system structure and relationships. Examples: "cat tokens/brand-blue.json", "grep -r \\"color\\" tokens/", "ls base-colors/"',
        parameters: {
          type: "OBJECT" as const,
          properties: {
            command: {
              type: "STRING" as const,
              description: 'Unix command to execute (e.g., "cat tokens/brand-blue.json | jq .relationships")',
            },
          },
          required: ["command"],
        },
      },
    ],
  },
];

/**
 * Tool response types
 */

export interface TokenInfo {
  path: string;
  layer: string;
  type: string;
  value: any;
  resolvedLight: string | number | null;
  resolvedDark: string | number | null;
  dependencies: string[];
  dependents: string[];
  isSpec: boolean;
}

export interface SearchResult {
  tokens: TokenInfo[];
  total: number;
  query: string;
}

export interface ImpactAnalysisResult {
  path: string;
  directDependents: number;
  totalAffected: number;
  affectedUtilities: string[];
  affectedComposites: string[];
  wouldBreak: boolean;
}

// Note: ToolResponse is now in toolRegistry.ts - import from there directly

/**
 * Design System Analysis Types
 */

export interface SimilarColorPair {
  token1: string;
  token2: string;
  color1: string;
  color2: string;
  distance: number; // LAB color space distance
}

export interface SimilarNumericPair {
  token1: string;
  token2: string;
  value1: number;
  value2: number;
  difference: number; // Absolute difference
  percentDifference: number; // Percentage difference
}

export interface SemanticDuplicate {
  resolvedValue: string | number;
  tokens: string[]; // All tokens that resolve to this value
  layer: string;
  type: string;
}

export interface OrphanedToken {
  path: string;
  layer: string;
  type: string;
  value: any;
  reason: string;
}

export interface UsageMetric {
  path: string;
  layer: string;
  type: string;
  dependentCount: number;
  isSpec: boolean;
}

export interface OptimizationOpportunity {
  path: string;
  currentValue: any;
  suggestedReference: string;
  reasoning: string;
  impact: "low" | "medium" | "high";
}

export interface HealthMetric {
  deprecatedInUse: Array<{
    path: string;
    dependentCount: number;
    dependents: string[];
  }>;
  brokenReferences: Array<{
    path: string;
    brokenRef: string;
  }>;
  circularDependencies: string[][];
}

export interface UsageAnalysis {
  mostUsedSpecs: UsageMetric[];
  leastUsedSpecs: UsageMetric[];
  mostUsedTokens: UsageMetric[];
  orphanedTokens: OrphanedToken[];
  usageDistribution: {
    range: string; // e.g., "0-5", "6-10", "11-20", "20+"
    count: number;
  }[];
}

export interface RedundancyAnalysis {
  similarColors: SimilarColorPair[];
  similarNumericValues: SimilarNumericPair[];
  semanticDuplicates: SemanticDuplicate[];
  totalRedundancies: number;
}

export interface OptimizationAnalysis {
  consolidationCandidates: SemanticDuplicate[];
  primitiveToReferenceOpportunities: OptimizationOpportunity[];
  unusedUtilities: OrphanedToken[];
  estimatedReduction: {
    tokens: number;
    percentage: number;
  };
}

export interface NarrativeInsights {
  executiveSummary: string;
  topRecommendations: string[];
  riskAssessment: string;
  healthScore: number; // 0-100
  estimatedImpact: string;
}

export interface DesignSystemAnalysis {
  timestamp: number;
  category: "all" | "usage" | "redundancy" | "health" | "optimization";

  // Structured data sections
  usage?: UsageAnalysis;
  redundancy?: RedundancyAnalysis;
  health?: HealthMetric;
  optimization?: OptimizationAnalysis;

  // Narrative insights
  insights: NarrativeInsights;

  // Overall metrics
  summary: {
    totalTokens: number;
    coreTokens: number;
    specs: number;
    issuesFound: number;
    opportunitiesFound: number;
  };
}

/**
 * Enhanced Tools with Lazy Loading and Examples
 * Import from geminiToolConverter for advanced features
 */
export {
  getGeminiTools as getEnhancedGeminiTools,
  handleToolSearch,
  getToolStats,
} from "@/services/geminiToolConverter";
