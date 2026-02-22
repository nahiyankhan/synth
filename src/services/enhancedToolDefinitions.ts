/**
 * Enhanced Tool Definitions with Examples and Deferred Loading
 * Core tools are loaded upfront, specialized tools are deferred
 */

import { EnhancedToolDefinition } from "../types/enhancedTools";
import { COLOR_VIEW_TOOLS } from "../toolCalls/colorViewTools";

export const ENHANCED_OPERATIONS: Record<string, EnhancedToolDefinition> = {
  // ============================================
  // CORE TOOLS (Always Loaded)
  // ============================================

  searchTokens: {
    name: "searchTokens",
    category: "query",
    description:
      "Search for design tokens by query, layer, type, or intent. Returns summary by default to avoid context pollution.",
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
      // NEW: Intent-based filters
      quality: {
        type: "string",
        required: false,
        description: "Filter by intent quality (e.g., 'trustworthy', 'bold')",
      },
      designedFor: {
        type: "string",
        required: false,
        description: "Filter by designed-for usage (e.g., 'buttons', 'text')",
      },
      purpose: {
        type: "string",
        required: false,
        description: "Search in intent purpose field",
      },
      response_mode: {
        type: "string",
        required: false,
        enum: ["summary", "full", "paginated"],
        default: "summary",
        description: "Control output verbosity",
      },
      page: {
        type: "number",
        required: false,
        default: 1,
        description: "Page number for paginated mode",
      },
      page_size: {
        type: "number",
        required: false,
        default: 20,
        description: "Items per page for paginated mode",
      },
    },
    returns:
      "SearchResult with tokens (summary shows first 5, paginated shows page, full shows all)",
    defer_loading: false, // Core tool, always loaded
    supports_pagination: true,
    supports_filtering: true,
    input_examples: [
      { query: "green", type: "color", response_mode: "summary" },
      { quality: "trustworthy", type: "color", response_mode: "summary" },
      { designedFor: "buttons", response_mode: "full" },
      {
        layer: "primitive",
        type: "size",
        response_mode: "paginated",
        page: 1,
        page_size: 10,
      },
    ],
  },

  getToken: {
    name: "getToken",
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
    defer_loading: false,
    input_examples: [
      { path: "base.color.primary" },
      { path: "semantic.color.text.standard", mode: "dark" },
    ],
  },

  updateToken: {
    name: "updateToken",
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
    defer_loading: false,
    input_examples: [
      { path: "base.color.primary", value: "#1A5F7A" },
      { path: "semantic.color.brand", value: "{base.color.primary}" },
      {
        path: "base.spacing.large",
        value: "24",
        description: "Increased for better readability",
      },
    ],
  },

  createToken: {
    name: "createToken",
    category: "modify",
    description:
      "Create a new design token with human intent. Layer is computed automatically.",
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
      type: {
        type: "string",
        required: true,
        enum: ["color", "typography", "size", "other"],
        description: "Token type",
      },
      // NEW: Intent parameters (all optional)
      purpose: {
        type: "string",
        required: false,
        description: "Why this token exists (e.g., 'Primary action color')",
      },
      designedFor: {
        type: "array",
        required: false,
        description: "What this token is for (e.g., ['buttons', 'CTAs'])",
      },
      qualities: {
        type: "array",
        required: false,
        description:
          "Subjective qualities (e.g., ['trustworthy', 'energetic'])",
      },
      constraints: {
        type: "array",
        required: false,
        description: "Usage constraints (e.g., ['high emphasis only'])",
      },
      rationale: {
        type: "string",
        required: false,
        description: "Design rationale or reasoning",
      },
      description: {
        type: "string",
        required: false,
        description: "Token description",
      },
    },
    returns: "Created token info with path, value, computed layer, and version",
    sideEffects: "Adds new token to design system, adds to history",
    defer_loading: false,
    input_examples: [
      {
        path: "brand.primary",
        value: "#1A5F7A",
        type: "color",
        purpose: "Primary brand color for high-emphasis actions",
        designedFor: ["buttons", "CTAs", "links"],
        qualities: ["trustworthy", "calm", "professional"],
      },
      {
        path: "spacing.compact",
        value: "8",
        type: "size",
        purpose: "Compact layout spacing",
        designedFor: ["dense UI", "mobile"],
        qualities: ["tight", "efficient"],
      },
      {
        path: "base.color.accent",
        value: "#FF6B6B",
        type: "color",
        description: "Accent color without explicit intent",
      },
    ],
  },

  // ============================================
  // DEFERRED TOOLS (Loaded on Demand)
  // ============================================

  getImpactAnalysis: {
    name: "getImpactAnalysis",
    category: "analyze",
    description:
      "Analyze the impact of changing a token. Returns summary of affected tokens.",
    parameters: {
      path: {
        type: "string",
        required: true,
        description: "Full token path to analyze",
      },
      response_mode: {
        type: "string",
        required: false,
        enum: ["summary", "full"],
        default: "summary",
      },
    },
    returns: "ImpactAnalysisResult with affected tokens count and summary",
    defer_loading: true, // Specialized analysis, load on-demand
    supports_filtering: true,
    input_examples: [
      { path: "base.color.primary", response_mode: "summary" },
      { path: "base.spacing.medium", response_mode: "full" },
    ],
  },

  analyzeDesignSystem: {
    name: "analyzeDesignSystem",
    category: "analyze",
    description:
      "Comprehensive data scientist-style analysis of the design system. Returns structured insights and recommendations. WARNING: Can be token-heavy, use summary mode.",
    parameters: {
      category: {
        type: "string",
        required: false,
        enum: ["all", "usage", "redundancy", "health", "optimization"],
        default: "all",
      },
      layer: {
        type: "string",
        required: false,
        enum: ["primitive", "utility", "composite"],
      },
      type: {
        type: "string",
        required: false,
        enum: ["color", "typography", "size", "spacing", "other"],
      },
      response_mode: {
        type: "string",
        required: false,
        enum: ["summary", "full"],
        default: "summary",
      },
    },
    returns:
      "DesignSystemAnalysis with insights, recommendations, and health score",
    defer_loading: true,
    supports_filtering: true,
    input_examples: [
      { category: "health", response_mode: "summary" },
      { category: "redundancy", type: "color", response_mode: "full" },
      { category: "usage", layer: "primitive" },
    ],
  },

  findAndReplace: {
    name: "findAndReplace",
    category: "modify",
    description:
      "Find and replace patterns across token paths or values. Supports pagination for large result sets.",
    parameters: {
      searchPattern: {
        type: "string",
        required: true,
        description: "Pattern to search for",
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
      },
      matchType: {
        type: "string",
        required: true,
        enum: ["exact", "contains", "regex"],
      },
      layer: {
        type: "string",
        required: false,
        enum: ["primitive", "utility"],
      },
      type: {
        type: "string",
        required: false,
        enum: ["color", "typography", "size", "spacing", "other"],
      },
      dryRun: { type: "boolean", required: false, default: true },
      response_mode: {
        type: "string",
        required: false,
        enum: ["summary", "paginated"],
        default: "summary",
      },
      page: { type: "number", required: false, default: 1 },
      page_size: { type: "number", required: false, default: 20 },
    },
    returns: "Array of matches with before/after values",
    sideEffects: "If dryRun=false, modifies matching tokens",
    defer_loading: true,
    supports_pagination: true,
    supports_filtering: true,
    input_examples: [
      {
        searchPattern: "grey",
        replaceWith: "gray",
        searchIn: "path",
        matchType: "contains",
        dryRun: true,
        response_mode: "summary",
      },
      {
        searchPattern: "#000000",
        replaceWith: "#1A1A1A",
        searchIn: "value",
        matchType: "exact",
        layer: "primitive",
        dryRun: false,
      },
    ],
  },

  renameToken: {
    name: "renameToken",
    category: "modify",
    description:
      "Rename a token and automatically update all references throughout the design system",
    parameters: {
      oldPath: {
        type: "string",
        required: true,
        description: "Current token path",
      },
      newPath: {
        type: "string",
        required: true,
        description: "New token path",
      },
    },
    returns: "Success confirmation with updated references count",
    sideEffects:
      "Renames token, updates all dependent tokens that reference it",
    defer_loading: true,
    input_examples: [
      { oldPath: "base.color.primary", newPath: "base.color.brand" },
      {
        oldPath: "semantic.spacing.default",
        newPath: "semantic.spacing.standard",
      },
    ],
  },

  findAllReferences: {
    name: "findAllReferences",
    category: "query",
    description: "Find all tokens that reference (depend on) a specific token",
    parameters: {
      path: {
        type: "string",
        required: true,
        description: "Token path to find references for",
      },
      response_mode: {
        type: "string",
        required: false,
        enum: ["summary", "full"],
        default: "summary",
      },
    },
    returns: "List of direct and transitive references with usage count",
    defer_loading: true,
    supports_filtering: true,
    input_examples: [
      { path: "base.color.black.light", response_mode: "summary" },
      { path: "base.spacing.medium", response_mode: "full" },
    ],
  },

  generateColorScale: {
    name: "generateColorScale",
    category: "create",
    description:
      "Generate a perceptually uniform color scale from a base color using OKLCH color space",
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
        description: "Number of steps (typically 5, 9, or 11)",
      },
      namingPattern: {
        type: "string",
        required: true,
        description: "Path pattern with {step} placeholder",
      },
      layer: {
        type: "string",
        required: false,
        enum: ["primitive", "utility"],
        default: "primitive",
      },
    },
    returns: "Array of created color tokens with hex values",
    sideEffects: "Creates new color tokens in the design system",
    defer_loading: true,
    input_examples: [
      {
        baseColor: "#3B82F6",
        steps: 9,
        namingPattern: "base.color.blue.{step}",
        layer: "primitive",
      },
      {
        baseColor: "#10B981",
        steps: 5,
        namingPattern: "semantic.success.{step}",
      },
      {
        baseColor: "#EF4444",
        steps: 11,
        namingPattern: "base.color.red.{step}",
      },
    ],
  },

  suggestColorsForGaps: {
    name: "suggestColorsForGaps",
    category: "analyze",
    description:
      "Analyze color distribution in OKLCH space and suggest colors to fill gaps",
    parameters: {
      filter: {
        type: "string",
        required: false,
        enum: ["all", "primitives", "utilities"],
        default: "all",
      },
      threshold: {
        type: "number",
        required: false,
        default: 0.15,
        description: "Gap detection threshold (0.1-0.2)",
      },
      maxSuggestions: { type: "number", required: false, default: 10 },
    },
    returns: "Array of gap locations with suggested colors",
    defer_loading: true,
    input_examples: [
      { filter: "primitives", threshold: 0.15, maxSuggestions: 5 },
      { filter: "all", maxSuggestions: 10 },
    ],
  },

  deleteToken: {
    name: "deleteToken",
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
    returns: "Deletion confirmation",
    sideEffects: "Removes token from design system, may break dependents",
    defer_loading: true,
    input_examples: [
      { path: "base.color.deprecated", force: false },
      { path: "base.spacing.legacy", force: true },
    ],
  },

  getSystemStats: {
    name: "getSystemStats",
    category: "analyze",
    description: "Get overall statistics about the design language",
    parameters: {
      includeSpecs: { type: "boolean", required: false, default: false },
    },
    returns: "Language statistics with token counts by layer/type",
    defer_loading: true,
    input_examples: [{ includeSpecs: false }, { includeSpecs: true }],
  },

  undoChange: {
    name: "undoChange",
    category: "history",
    description: "Undo the last change made to the design language",
    parameters: {},
    returns: "Success confirmation",
    sideEffects: "Reverts last modification",
    defer_loading: false, // Common operation, keep loaded
  },

  redoChange: {
    name: "redoChange",
    category: "history",
    description: "Redo a previously undone change",
    parameters: {},
    returns: "Success confirmation",
    sideEffects: "Re-applies previously undone modification",
    defer_loading: false, // Common operation, keep loaded
  },

  exportDesignSystem: {
    name: "exportDesignSystem",
    category: "export",
    description: "Export the design language to JSON or YAML",
    parameters: {
      format: {
        type: "string",
        required: false,
        enum: ["json", "yaml"],
        default: "json",
      },
    },
    returns: "Serialized design language",
    defer_loading: true,
    input_examples: [{ format: "json" }, { format: "yaml" }],
  },

  exportTailwindConfig: {
    name: "exportTailwindConfig",
    category: "export",
    description:
      "Export design system as Tailwind v4 CSS configuration that remaps default Tailwind classes to your design tokens. Makes standard Tailwind utilities (bg-primary, text-foreground, p-4) use your design system values.",
    parameters: {
      exportType: {
        type: "string",
        required: false,
        enum: ["theme", "tokens", "both"],
        default: "both",
        description:
          "Type of export: theme (remap defaults), tokens (direct utilities), or both",
      },
      includeReadme: {
        type: "boolean",
        required: false,
        default: true,
        description: "Include README with usage instructions",
      },
    },
    returns: "Tailwind v4 CSS files with remapped classes",
    defer_loading: true,
    input_examples: [
      { exportType: "theme", includeReadme: true },
      { exportType: "tokens", includeReadme: false },
      { exportType: "both", includeReadme: true },
    ],
  },

  // ============================================
  // DESIGN SYSTEM GENERATION (AI-Powered)
  // ============================================

  generate_design_system: {
    name: "generate_design_system",
    category: "generation",
    description:
      "Generate a complete design system from natural language description. Creates a new design language with colors, typography, and spacing tokens using AI. The system will be saved and can be accessed from the landing page.",
    parameters: {
      prompt: {
        type: "string",
        required: true,
        description:
          "User's description of the design system to generate (e.g., 'fintech app', 'healthcare product', 'developer tool')",
      },
      focus: {
        type: "string",
        required: false,
        enum: ["full", "colors", "typography"],
        default: "full",
        description:
          "Generation scope: 'full' generates complete system, 'colors' only colors, 'typography' only typography",
      },
    },
    returns: "Generation result with language ID and token count",
    sideEffects: "Creates and saves a new design language to the database",
    defer_loading: false,
    input_examples: [
      {
        prompt:
          "A design system for a fintech app that needs to feel trustworthy and professional",
      },
      { prompt: "Create colors for a healthcare product", focus: "colors" },
      {
        prompt:
          "Modern design system for a developer tool with dark mode support",
      },
    ],
  },

  // ============================================
  // NAVIGATION TOOLS (Always Loaded)
  // ============================================

  navigate_to_view: {
    name: "navigate_to_view",
    category: "navigation",
    description:
      "Navigate to a specific view within the editor (colors, typography, sizes, components, content, pages, or gallery). Use this when the user asks to see or show a particular section.",
    parameters: {
      view: {
        type: "string",
        enum: [
          "gallery",
          "colors",
          "typography",
          "sizes",
          "components",
          "content",
          "pages",
        ],
        required: true,
        description: "The view to navigate to",
      },
    },
    returns: "Success confirmation",
    sideEffects: "Changes the active view in the editor",
    defer_loading: false,
    input_examples: [
      { view: "colors" },
      { view: "typography" },
      { view: "gallery" },
      { view: "components" },
      { view: "pages" },
    ],
  },

  create_new_design_system: {
    name: "create_new_design_system",
    category: "navigation",
    description:
      "Navigate to generation mode to create a brand new design language from scratch. Use this when the user wants to create/generate/build a new design system.",
    parameters: {},
    returns: "Success confirmation",
    sideEffects: "Navigates to editor in generation mode",
    defer_loading: false,
    input_examples: [],
  },

  // ============================================
  // COLOR VIEW TOOLS (Deferred Loading)
  // ============================================
  ...COLOR_VIEW_TOOLS.reduce((acc, tool) => {
    acc[tool.name] = tool;
    return acc;
  }, {} as Record<string, EnhancedToolDefinition>),
};
