import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDesignLanguage } from "../context/DesignLanguageContext";
import { useApp } from "../context/AppContext";
import { ALL_TOOL_DEFINITIONS } from "../tools/definitions";
import { getToolsForView } from "../services/toolFilter";
import { XIcon } from "./icons";

interface DevPanelProps {
  onExecutePrompt: (prompt: string) => void;
  isProcessing: boolean;
  currentView?: string | null; // "colors", "typography", "sizes", "components", "content", "pages", or null for gallery/landing
}

interface SamplePrompt {
  label: string;
  prompt: string;
  category: string;
  action?: "navigate";
  path?: string;
}

// Context-aware prompts that change based on current view
const getContextAwarePrompts = (
  currentView: string | null,
  hasDesignSystem: boolean
): SamplePrompt[] => {
  const basePrompts: SamplePrompt[] = [];

  // Generation mode - even without a design system loaded yet
  if (currentView === "generate") {
    basePrompts.push(
      {
        category: "Generation (Current View)",
        label: "Minimalist fintech",
        prompt:
          "Create a minimal and precise design language for a fintech app that needs to feel trustworthy and professional",
      },
      {
        category: "Generation (Current View)",
        label: "Bold e-commerce",
        prompt:
          "Generate a bold and vibrant design system for an e-commerce platform with high contrast and confident visual presence",
      },
      {
        category: "Generation (Current View)",
        label: "Healthcare calm",
        prompt:
          "Make a warm and organic design language for a healthcare product with natural colors and comfortable spacing",
      },
      {
        category: "Generation (Current View)",
        label: "Technical dashboard",
        prompt:
          "Create a dark and technical design system for a developer dashboard with precise details and sophisticated hierarchy",
      },
      {
        category: "Generation (Current View)",
        label: "Social media vibrant",
        prompt:
          "Generate a colorful and playful design language for a social media app targeting younger audiences",
      },
      {
        category: "Generation (Current View)",
        label: "Enterprise SaaS",
        prompt:
          "Create a professional and scalable design system for an enterprise SaaS platform with clear hierarchy",
      },
      {
        category: "Generation (Current View)",
        label: "Creative portfolio",
        prompt:
          "Make an expressive and artistic design language for a creative portfolio site with unique visual style",
      },
      {
        category: "Generation (Current View)",
        label: "Educational clean",
        prompt:
          "Generate a clear and accessible design system for an educational platform focused on readability and learning",
      }
    );
    return basePrompts; // Only show generation prompts before system is created
  }

  // Landing page - no design system loaded
  if (!hasDesignSystem) {
    basePrompts.push(
      {
        category: "Landing Page",
        label: "Create new system",
        prompt: "I want to create a new design language",
      },
      {
        category: "Landing Page",
        label: "Load a system",
        prompt: "Load my design language",
      }
    );
    return basePrompts; // Only show landing page prompts
  }

  // Add quick navigation prompts for all views with a design system (except gallery which shows this by default)
  if (currentView && currentView !== "generate") {
    basePrompts.push(
      {
        category: "Quick Navigation",
        label: "View colors",
        prompt: "Show me the colors",
      },
      {
        category: "Quick Navigation",
        label: "View typography",
        prompt: "Navigate to typography",
      },
      {
        category: "Quick Navigation",
        label: "View sizes",
        prompt: "Show me sizes",
      },
      {
        category: "Quick Navigation",
        label: "View components",
        prompt: "Navigate to components",
      },
      {
        category: "Quick Navigation",
        label: "View content",
        prompt: "Show me the content guidelines",
      },
      {
        category: "Quick Navigation",
        label: "View pages",
        prompt: "Show me the example pages",
      },
      {
        category: "Quick Navigation",
        label: "Back to gallery",
        prompt: "Go back to the gallery view",
      }
    );
  }

  // View-specific prompts (shown first when in that view)
  if (currentView === "colors") {
    basePrompts.push(
      // Exploration (filesystem)
      {
        category: "Colors (Current View)",
        label: "Explore: List all color files",
        prompt: "Show me all color token files",
      },
      {
        category: "Colors (Current View)",
        label: "Explore: Find blue colors",
        prompt: "Find all tokens with blue in them",
      },
      {
        category: "Colors (Current View)",
        label: "Explore: Read color schema",
        prompt: "What's in the colors schema definition?",
      },
      // Standard operations
      {
        category: "Colors (Current View)",
        label: "Search all colors",
        prompt: "Show me all color tokens",
      },
      {
        category: "Colors (Current View)",
        label: "Find green colors",
        prompt: "Find all green colors",
      },
      {
        category: "Colors (Current View)",
        label: "Check contrast ratios",
        prompt: "Check WCAG contrast ratios for text colors",
      },
      {
        category: "Colors (Current View)",
        label: "Generate color scale",
        prompt: "Generate a 9-step blue color scale",
      },
      {
        category: "Colors (Current View)",
        label: "Find similar colors",
        prompt: "Find colors similar to base.color.primary",
      }
    );
  } else if (currentView === "typography") {
    basePrompts.push(
      // Exploration (filesystem)
      {
        category: "Typography (Current View)",
        label: "Explore: List typography files",
        prompt: "Show me all typography token files",
      },
      {
        category: "Typography (Current View)",
        label: "Explore: Read typography schema",
        prompt: "What's in the typography schema?",
      },
      {
        category: "Typography (Current View)",
        label: "Explore: Find heading tokens",
        prompt: "Find all tokens with heading or title in the name",
      },
      // Standard operations
      {
        category: "Typography (Current View)",
        label: "Search all typography",
        prompt: "Show me all typography tokens",
      },
      {
        category: "Typography (Current View)",
        label: "Find display text",
        prompt: "Show me display and headline typography tokens",
      },
      {
        category: "Typography (Current View)",
        label: "Find body text",
        prompt: "Show me body and paragraph typography tokens",
      },
      {
        category: "Typography (Current View)",
        label: "Analyze type scale",
        prompt: "Analyze my typography scale and show progression",
      },
      {
        category: "Typography (Current View)",
        label: "Check readability",
        prompt: "Check readability of my typography tokens",
      }
    );
  } else if (currentView === "sizes") {
    basePrompts.push(
      // Exploration (filesystem)
      {
        category: "Sizes (Current View)",
        label: "Explore: List size files",
        prompt: "Show me all size and spacing token files",
      },
      {
        category: "Sizes (Current View)",
        label: "Explore: Find spacing tokens",
        prompt: "Find all tokens with spacing or padding in the name",
      },
      {
        category: "Sizes (Current View)",
        label: "Explore: Count size tokens",
        prompt: "How many size tokens do I have?",
      },
      // Standard operations
      {
        category: "Sizes (Current View)",
        label: "Search all sizes",
        prompt: "Show me all size tokens",
      },
      {
        category: "Sizes (Current View)",
        label: "Find spacing tokens",
        prompt: "Show me all spacing values",
      },
      {
        category: "Sizes (Current View)",
        label: "Find border radius",
        prompt: "Show me all border radius tokens",
      },
      {
        category: "Sizes (Current View)",
        label: "Analyze spacing scale",
        prompt: "Analyze my spacing scale progression",
      },
      {
        category: "Sizes (Current View)",
        label: "Find tokens near 16px",
        prompt: "Find size tokens close to 16 pixels",
      }
    );
  } else if (currentView === "components") {
    basePrompts.push(
      // Exploration (filesystem)
      {
        category: "Components (Current View)",
        label: "Explore: List component files",
        prompt: "Show me all component specification files",
      },
      {
        category: "Components (Current View)",
        label: "Explore: Find button components",
        prompt: "Find all tokens with button in the name",
      },
      {
        category: "Components (Current View)",
        label: "Explore: Component structure",
        prompt: "Show me the structure of component tokens",
      },
      // Standard operations
      {
        category: "Components (Current View)",
        label: "List all components",
        prompt: "Show me all component specifications",
      },
      {
        category: "Components (Current View)",
        label: "Find button specs",
        prompt: "Show me button component specifications",
      },
      {
        category: "Components (Current View)",
        label: "Analyze component tokens",
        prompt: "What tokens are used in my components?",
      }
    );
  } else if (currentView === "content") {
    basePrompts.push(
      // Exploration (filesystem)
      {
        category: "Content (Current View)",
        label: "Explore: List content files",
        prompt: "Show me all content guideline files",
      },
      {
        category: "Content (Current View)",
        label: "Explore: Read voice guidelines",
        prompt: "What's in the voice and tone guidelines?",
      },
      {
        category: "Content (Current View)",
        label: "Explore: Search for examples",
        prompt: "Find examples in the content guidelines",
      },
      // Standard operations
      {
        category: "Content (Current View)",
        label: "View content guide",
        prompt: "Show me the content and voice guidelines",
      },
      {
        category: "Content (Current View)",
        label: "Summarize tone",
        prompt: "Summarize the tone of voice guidelines",
      },
      {
        category: "Content (Current View)",
        label: "Audit text sample",
        prompt: "Audit this text: 'Click here now to get started!'",
      }
    );
  } else if (currentView === "pages") {
    basePrompts.push(
      // Exploration (filesystem)
      {
        category: "Pages (Current View)",
        label: "Explore: List page files",
        prompt: "Show me all page example files",
      },
      {
        category: "Pages (Current View)",
        label: "Explore: Find page tokens",
        prompt: "Find all tokens used in page examples",
      },
      {
        category: "Pages (Current View)",
        label: "Explore: Page structure",
        prompt: "Show me the structure of page examples",
      },
      // Standard operations
      {
        category: "Pages (Current View)",
        label: "Explain page screens",
        prompt: "Tell me about the example pages shown here",
      },
      {
        category: "Pages (Current View)",
        label: "Analyze page tokens",
        prompt: "What design tokens are being used in these page examples?",
      },
      {
        category: "Pages (Current View)",
        label: "Suggest improvements",
        prompt: "How could I improve the design of these example pages?",
      }
    );
  } else {
    // Gallery view - show exploration + navigation prompts
    basePrompts.push(
      // Exploration (filesystem)
      {
        category: "Gallery (Current View)",
        label: "Explore: Show all tokens",
        prompt: "Show me all the tokens in the system",
      },
      {
        category: "Gallery (Current View)",
        label: "Explore: System structure",
        prompt: "Show me the overall structure of the design system",
      },
      {
        category: "Gallery (Current View)",
        label: "Explore: System stats",
        prompt: "What are the system statistics?",
      },
      {
        category: "Gallery (Current View)",
        label: "Explore: Find primitives",
        prompt: "Find all primitive tokens",
      },
      // Navigation
      {
        category: "Quick Navigation",
        label: "View colors",
        prompt: "Show me the colors",
      },
      {
        category: "Quick Navigation",
        label: "View typography",
        prompt: "Navigate to typography",
      },
      {
        category: "Quick Navigation",
        label: "View sizes",
        prompt: "Show me sizes",
      },
      {
        category: "Quick Navigation",
        label: "View components",
        prompt: "Navigate to components",
      },
      {
        category: "Quick Navigation",
        label: "View content",
        prompt: "Show me the content guidelines",
      },
      {
        category: "Quick Navigation",
        label: "View pages",
        prompt: "Show me the example pages",
      }
    );
  }

  return basePrompts;
};

const SAMPLE_PROMPTS: SamplePrompt[] = [
  // ============================================
  // DISCOVERY LAYER (Meta Tools)
  // ============================================
  {
    category: "Discovery",
    label: "List all operations",
    prompt: "What operations are available in the design system?",
  },
  {
    category: "Discovery",
    label: "List modify operations",
    prompt: "Show me all operations I can use to modify the design system",
  },
  {
    category: "Discovery",
    label: "Get operation info",
    prompt: "Tell me about the updateToken operation",
  },

  // ============================================
  // QUERY OPERATIONS
  // ============================================
  {
    category: "Query",
    label: "Get token info",
    prompt: "Get information about the token base.color.grey.65.light",
  },
  {
    category: "Query",
    label: "Search color tokens",
    prompt: "Search for all color tokens",
  },
  {
    category: "Query",
    label: "Search by name",
    prompt: "Find all tokens with primary in the name",
  },
  {
    category: "Query",
    label: "Find primitives",
    prompt: "Show me all primitive layer tokens",
  },
  {
    category: "Query",
    label: "Find all references",
    prompt: "Find everything that references base.color.black.light",
  },
  {
    category: "Query",
    label: "Search typography",
    prompt: "Search for all typography tokens",
  },
  {
    category: "Query",
    label: "Search spacing",
    prompt: "Search for all spacing tokens",
  },

  // ============================================
  // MODIFY OPERATIONS
  // ============================================
  {
    category: "Modify",
    label: "Update token value",
    prompt: "Update base.color.grey.65.light to #999999",
  },
  {
    category: "Modify",
    label: "Create color token",
    prompt:
      "Create a primitive color token called base.color.brand with value #FF5733",
  },
  {
    category: "Modify",
    label: "Create spacing token",
    prompt:
      "Create a primitive spacing token called base.spacing.large with value 32",
  },
  {
    category: "Modify",
    label: "Create typography token",
    prompt:
      "Create a primitive typography token called base.text.large with value 24",
  },
  {
    category: "Modify",
    label: "Rename token",
    prompt: "Rename base.color.primary to base.color.brand",
  },
  {
    category: "Modify",
    label: "Delete unused token",
    prompt: "Delete the token base.color.old-primary",
  },
  {
    category: "Modify",
    label: "Find and replace (dry run)",
    prompt:
      'Find all tokens with "grey" in the path and show me what would happen if I replaced it with "gray"',
  },
  {
    category: "Modify",
    label: "Find and replace (execute)",
    prompt:
      'Find all tokens with "old" in the value and replace with "new" - confirm the changes',
  },

  // ============================================
  // ANALYZE OPERATIONS
  // ============================================
  {
    category: "Analyze",
    label: "Impact analysis",
    prompt: "Analyze the impact of changing base.color.black.light",
  },
  {
    category: "Analyze",
    label: "System statistics",
    prompt:
      "Show me the overall system statistics with token counts and breakdown",
  },
  {
    category: "Analyze",
    label: "Full analysis (all categories)",
    prompt: "Analyze the entire design system for all issues and opportunities",
  },
  {
    category: "Analyze",
    label: "Usage analysis",
    prompt: "Analyze usage patterns and show me orphaned tokens",
  },
  {
    category: "Analyze",
    label: "Redundancy analysis",
    prompt: "Find duplicate and redundant tokens in the system",
  },
  {
    category: "Analyze",
    label: "Health check",
    prompt:
      "Check system health for broken references and circular dependencies",
  },
  {
    category: "Analyze",
    label: "Optimization analysis",
    prompt: "Find opportunities to optimize and improve the design system",
  },
  {
    category: "Analyze",
    label: "Color-specific analysis",
    prompt: "Analyze only the color tokens in the design system",
  },

  // ============================================
  // COLOR SCIENCE VISUALIZATION TOOLS
  // ============================================
  {
    category: "Color Science",
    label: "Color analysis dashboard",
    prompt: "Show me the color analysis dashboard",
  },
  {
    category: "Color Science",
    label: "3D OKLCH color space",
    prompt: "Show me the 3D OKLCH color space visualization",
  },
  {
    category: "Color Science",
    label: "2D color projections",
    prompt: "Show me 2D color projections (LC, LH, CH)",
  },
  {
    category: "Color Science",
    label: "Hue ring visualization",
    prompt: "Show me the hue ring visualization",
  },
  {
    category: "Color Science",
    label: "WCAG accessibility matrix",
    prompt: "Show me the WCAG contrast ratio accessibility matrix",
  },
  {
    category: "Color Science",
    label: "Curve analysis with gaps",
    prompt: "Analyze the color curve and show me gaps in the progression",
  },
  {
    category: "Color Science",
    label: "Generate 9-step color scale",
    prompt:
      "Generate a 9-step color scale from #3B82F6 using the pattern base.color.blue.{step}",
  },
  {
    category: "Color Science",
    label: "Generate 5-step scale",
    prompt:
      "Generate a 5-step color scale from #10B981 named base.color.green.{step}",
  },
  {
    category: "Color Science",
    label: "Suggest colors for gaps",
    prompt: "Analyze my color palette and suggest colors to fill gaps",
  },
  {
    category: "Color Science",
    label: "Filter primitives only",
    prompt: "Show me the 3D color space for primitive colors only",
  },
  {
    category: "Color Science",
    label: "Filter utilities only",
    prompt: "Show me color analysis for utility colors only",
  },
  {
    category: "Color Science",
    label: "Hide visualization",
    prompt: "Hide the color visualization",
  },
  {
    category: "Color Science",
    label: "Select all colors",
    prompt: "Select all colors",
  },
  {
    category: "Color Science",
    label: "Select green colors",
    prompt: "Select all green colors",
  },
  {
    category: "Color Science",
    label: "Select blue primitives",
    prompt: "Select all blue primitives",
  },
  {
    category: "Color Science",
    label: "Select 500-level colors",
    prompt: "Select all 500 colors",
  },

  // ============================================
  // TYPOGRAPHY ANALYSIS
  // ============================================
  {
    category: "Typography Analysis",
    label: "Analyze type scale",
    prompt: "Analyze if my typography follows a modular scale",
  },
  {
    category: "Typography Analysis",
    label: "Check readability",
    prompt: "Check the readability of all typography tokens",
  },
  {
    category: "Typography Analysis",
    label: "Suggest type hierarchy",
    prompt: "Suggest missing type hierarchy levels (h1-h6, body, small)",
  },
  {
    category: "Typography Analysis",
    label: "Analyze letter spacing",
    prompt: "Analyze letter spacing for all typography tokens",
  },
  {
    category: "Typography Analysis",
    label: "Check body text",
    prompt: "Check the readability of body text only",
  },
  {
    category: "Typography Analysis",
    label: "Analyze with custom ratio",
    prompt: "Analyze type scale with expected ratio of 1.333 (perfect fourth)",
  },

  // ============================================
  // SPACING/SIZE ANALYSIS
  // ============================================
  {
    category: "Spacing Analysis",
    label: "Analyze spacing scale",
    prompt: "Analyze if my spacing follows a consistent scale (4px, 8px base)",
  },
  {
    category: "Spacing Analysis",
    label: "Check spacing consistency",
    prompt: "Check for inconsistencies in spacing values",
  },
  {
    category: "Spacing Analysis",
    label: "Suggest spacing tokens",
    prompt: "Suggest missing spacing tokens based on detected scale",
  },
  {
    category: "Spacing Analysis",
    label: "Validate size harmony",
    prompt: "Check if sizing tokens follow a harmonic progression",
  },
  {
    category: "Spacing Analysis",
    label: "Analyze with 8px base",
    prompt: "Analyze spacing scale with expected base unit of 8px",
  },
  {
    category: "Spacing Analysis",
    label: "Check spacing only",
    prompt: "Check spacing consistency for spacing tokens only",
  },

  // ============================================
  // HISTORY OPERATIONS
  // ============================================
  {
    category: "History",
    label: "Undo last change",
    prompt: "Undo the last change",
  },
  {
    category: "History",
    label: "Redo change",
    prompt: "Redo the change",
  },

  // ============================================
  // EXPORT OPERATIONS
  // ============================================
  {
    category: "Export",
    label: "Export as JSON",
    prompt: "Export the design system as JSON",
  },
  {
    category: "Export",
    label: "Export as YAML",
    prompt: "Export the design system as YAML",
  },

  // ============================================
  // ============================================
  // COMPREHENSIVE TOOL COVERAGE TESTS
  // ============================================
  {
    category: "Tool Tests",
    label: "Test: execute_operation wrapper",
    prompt: "Execute searchTokens operation to find all color tokens",
  },
  {
    category: "Tool Tests",
    label: "Test: Enhanced searchTokens (summary mode)",
    prompt: "Search for color tokens with response_mode=summary",
  },
  {
    category: "Tool Tests",
    label: "Test: Enhanced searchTokens (paginated)",
    prompt:
      "Search for all tokens with response_mode=paginated page=1 page_size=10",
  },
  {
    category: "Tool Tests",
    label: "Test: Enhanced impact analysis (summary)",
    prompt:
      "Analyze impact of base.color.black.light with response_mode=summary",
  },
  {
    category: "Tool Tests",
    label: "Test: Enhanced findAllReferences",
    prompt: "Find all references to base.color.black.light in summary mode",
  },
  {
    category: "Tool Tests",
    label: "Test: findAndReplace dry run",
    prompt: 'Find "grey" and replace with "gray" in paths (dry run)',
  },
  {
    category: "Tool Tests",
    label: "Test: Generate 11-step scale",
    prompt:
      "Generate 11-step color scale from #EF4444 as base.color.red.{step}",
  },
  {
    category: "Tool Tests",
    label: "Test: Audit text",
    prompt:
      "Audit this text: 'Click here now to get started with our amazing product! Sign up today!'",
  },
  {
    category: "Tool Tests",
    label: "Test: Search guidelines",
    prompt: "Search guidelines for 'error messages'",
  },

  // ============================================
  // NAVIGATION (Experimental Pages)
  // ============================================
  {
    category: "Navigation",
    label: "Home / Landing",
    prompt: "Go to landing page",
    action: "navigate",
    path: "/",
  },
  {
    category: "Navigation",
    label: "Editor",
    prompt: "Go to editor",
    action: "navigate",
    path: "/editor",
  },
];

/**
 * TOOL COVERAGE SUMMARY (Updated for New Architecture)
 * ====================================================
 *
 * ✅ Query Tools (3):
 *    - getToken, searchTokens, findAllReferences
 *
 * ✅ Modify Tools (5):
 *    - createToken, updateToken, deleteToken, renameToken, findAndReplace
 *
 * ✅ Analyze Tools (4):
 *    - getImpactAnalysis, getSystemStats, analyzeDesignSystem, suggestColorsForGaps
 *
 * ✅ History Tools (2):
 *    - undoChange, redoChange
 *
 * ✅ Export Tools (1):
 *    - exportDesignSystem
 *
 * ✅ Create Tools (2):
 *    - generateColorScale, generate_design_system
 *
 * ✅ Navigation Tools (6):
 *    - list_design_systems, get_design_system_preview, load_design_system
 *    - create_new_design_system, delete_design_system, navigate_to_view
 *
 * ✅ Color View Tools (7):
 *    - find_similar_colors, adjust_colors_lightness
 *    - generate_color_scale, check_lightness_scale, check_color_contrast
 *    - group_colors_by_hue, select_colors
 *
 * ✅ Content Tools (2):
 *    - auditText, searchGuidelines
 *
 * ✅ Meta/Discovery Tools (4):
 *    - get_design_system_operations, get_operation_info, execute_operation
 *    - search_tools (lazy loading)
 *
 * Total: 34 unified tools + 46 sample prompts
 * Architecture: New registry-based system with version management
 */

export const DevPanel: React.FC<DevPanelProps> = ({
  onExecutePrompt,
  isProcessing,
  currentView = null,
}) => {
  const navigate = useNavigate();
  const { graph, selectedLanguage, currentLanguageMetadata } =
    useDesignLanguage();
  const { isDevPanelOpen, setIsDevPanelOpen } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenerationData, setShowGenerationData] = useState(false);

  // Check if we have a design system loaded
  // Only check graph - selectedLanguage persists in localStorage but doesn't mean the system is loaded
  const hasDesignSystem = !!graph;

  // Get context-aware prompts based on current view
  const contextPrompts = getContextAwarePrompts(currentView, hasDesignSystem);

  // Combine context prompts with base prompts (only if design system is loaded)
  // Filter out view-specific prompts that don't match current view
  let basePrompts = SAMPLE_PROMPTS;

  // Filter view-specific prompts
  if (currentView && currentView !== "colors") {
    basePrompts = basePrompts.filter((p) => p.category !== "Color Science");
  }
  if (currentView && currentView !== "typography") {
    basePrompts = basePrompts.filter(
      (p) => p.category !== "Typography Analysis"
    );
  }
  if (currentView && currentView !== "sizes") {
    basePrompts = basePrompts.filter((p) => p.category !== "Spacing Analysis");
  }

  const allPrompts = hasDesignSystem
    ? [...contextPrompts, ...basePrompts]
    : contextPrompts; // On landing page, only show landing page prompts

  const categories = [
    "All",
    ...Array.from(new Set(allPrompts.map((p) => p.category))),
  ];

  const filteredPrompts = allPrompts.filter((prompt) => {
    const matchesCategory =
      selectedCategory === "All" || prompt.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      prompt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedPrompts = filteredPrompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, SamplePrompt[]>);

  // Filter tools based on context using centralized filter
  const contextualTools = hasDesignSystem
    ? getToolsForView(currentView as any, ALL_TOOL_DEFINITIONS)
    : ALL_TOOL_DEFINITIONS.filter(
        (tool) =>
          tool.name.includes("load_design_system") ||
          tool.name.includes("create_new_design_system") ||
          tool.name.includes("generate_design_system")
      );
  const toolCount = contextualTools.length;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsDevPanelOpen(!isDevPanelOpen)}
        className="fixed bottom-4 left-4 z-50 px-5 py-3 bg-white/90 backdrop-blur-md border border-dark-200/50 hover:bg-white/95 text-dark-900 rounded-2xl shadow-lg transition-all duration-200 flex items-center gap-2 font-light"
        title="Toggle Dev Panel"
      >
        <span className="text-sm">dev</span>
        {isDevPanelOpen && (
          <span className="text-xs text-dark-400">
            ({filteredPrompts.length})
          </span>
        )}
      </button>

      {/* Panel */}
      {isDevPanelOpen && (
        <div className="fixed bottom-20 left-6 z-50 w-[450px] max-h-[600px] bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-dark-200/50 flex flex-col overflow-hidden font-mono">
          {/* Header */}
          <div className="border-b border-dark-200/50 px-4 py-3 flex items-center justify-between bg-white/50">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs text-dark-700 tracking-wide">
                  dev panel
                </h2>
                {currentView === "generate" ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                    generate
                  </span>
                ) : !hasDesignSystem ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                    landing
                  </span>
                ) : currentView ? (
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                    {currentView}
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">
                    gallery
                  </span>
                )}
              </div>
              <p className="text-[10px] text-dark-500 mt-0.5">
                {toolCount} tools · {allPrompts.length} prompts
                {contextPrompts.length > 0 &&
                  ` (${contextPrompts.length} contextual)`}
              </p>
              {/* Status Indicator */}
              {currentView === "generate" ? (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 rounded px-1.5 py-0.5 border border-purple-200">
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>Generation mode - create a new design system</span>
                </div>
              ) : !hasDesignSystem ? (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 rounded px-1.5 py-0.5 border border-purple-200">
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Landing page - load or create a design system</span>
                </div>
              ) : (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-green-700 bg-green-50 rounded px-1.5 py-0.5 border border-green-200">
                  <svg
                    className="w-2.5 h-2.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    Ready • {selectedLanguage || "Design system"} loaded
                  </span>
                </div>
              )}

              {/* Generation Data Toggle */}
              {currentLanguageMetadata?.generationMetadata && (
                <button
                  onClick={() => setShowGenerationData(!showGenerationData)}
                  className="mt-1.5 text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 rounded px-1.5 py-0.5 border border-blue-200 transition-colors flex items-center gap-1"
                >
                  <span>
                    {showGenerationData ? "▼" : "▶"} View Generation Data
                  </span>
                </button>
              )}
            </div>
            <button
              onClick={() => setIsDevPanelOpen(false)}
              className="text-dark-500 hover:text-dark-700 transition-colors ml-2"
              title="Close"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="p-4 border-b border-dark-200/50 space-y-3 bg-white/40">
            <input
              type="text"
              placeholder="search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-dark-200/50 rounded-lg bg-white/80 text-dark-900 text-[11px] placeholder:text-dark-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />

            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-white/80 text-dark-700 hover:bg-white border border-dark-200/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Generation Data Section */}
          {showGenerationData &&
            currentLanguageMetadata?.generationMetadata && (
              <div className="border-b border-dark-200/50 px-4 py-3 bg-white/40 max-h-60 overflow-y-auto">
                <h3 className="text-[10px] text-dark-600 mb-2 uppercase tracking-wider">
                  Generation Metadata
                </h3>
                <pre className="text-[10px] text-dark-700 whitespace-pre-wrap bg-white/80 p-3 rounded-lg border border-dark-200/50 overflow-x-auto">
                  {JSON.stringify(
                    currentLanguageMetadata.generationMetadata,
                    null,
                    2
                  )}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(
                        currentLanguageMetadata.generationMetadata,
                        null,
                        2
                      )
                    );
                  }}
                  className="mt-1.5 text-[10px] text-blue-700 hover:text-blue-600"
                >
                  Copy to clipboard
                </button>
              </div>
            )}

          {/* Prompts List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/30">
            {Object.entries(groupedPrompts).map(([category, prompts]) => (
              <div key={category}>
                <h3 className="text-[10px] text-dark-500 uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {prompts.map((prompt, idx) => (
                    <button
                      key={`${category}-${idx}`}
                      onClick={() => {
                        if (prompt.action === "navigate" && prompt.path) {
                          navigate(prompt.path);
                        } else {
                          onExecutePrompt(prompt.prompt);
                        }
                      }}
                      disabled={isProcessing && prompt.action !== "navigate"}
                      className="w-full text-left p-3 bg-white/60 border border-dark-200/50 rounded-lg hover:border-dark-300/60 hover:bg-white/80 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-dark-900 mb-0.5 flex items-center gap-1.5">
                            {prompt.label}
                            {prompt.action === "navigate" && (
                              <span className="text-[9px] px-1 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                                link
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-dark-600 line-clamp-2">
                            {prompt.action === "navigate" && prompt.path
                              ? prompt.path
                              : prompt.prompt}
                          </div>
                        </div>
                        <div className="text-dark-400 group-hover:text-dark-600 transition-colors shrink-0">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredPrompts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[11px] text-dark-500">
                  no prompts match your search
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-dark-200/50 px-4 py-2.5 text-[10px] text-dark-600 bg-white/50">
            <div className="flex items-center justify-between">
              <span>
                {filteredPrompts.length} prompt
                {filteredPrompts.length !== 1 ? "s" : ""}
              </span>
              {isProcessing && (
                <span className="text-blue-600 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-blue-600 rounded-full animate-pulse"></span>
                  processing...
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
