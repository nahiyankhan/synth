import { useMemo } from "react";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import { hexToOKLCH, OKLCHColor } from "@/services/colorScience";
import { TAILWIND_STEPS, TAILWIND_CHROMATIC_COLORS } from "@/types/tailwindPalette";

export interface ColorItem {
  node: StyleNode;
  resolvedColor: string;
  oklch: OKLCHColor;
  step?: number;
}

export interface SemanticMapping {
  node: StyleNode;
  resolvedColor: string;
  oklch: OKLCHColor;
  category: string;
  subcategory?: string;
  referencedPrimitive?: StyleNode;
}

export interface PaletteGroup {
  id: string;
  name: string;
  displayName: string;
  primitives: ColorItem[];
  semanticMappings: SemanticMapping[];
}

// Semantic palettes (brand & status roles) - checked first
const SEMANTIC_PALETTES: Array<{
  id: string;
  displayName: string;
  patterns: RegExp[];
}> = [
  { id: "primary", displayName: "Primary", patterns: [/primary/i, /brand/i] },
  { id: "secondary", displayName: "Secondary", patterns: [/secondary/i] },
  { id: "accent", displayName: "Accent", patterns: [/accent/i] },
  { id: "success", displayName: "Success", patterns: [/success/i] },
  { id: "error", displayName: "Error", patterns: [/error|destructive|danger/i] },
  { id: "warning", displayName: "Warning", patterns: [/warning|caution/i] },
  { id: "info", displayName: "Info", patterns: [/info/i] },
];

// Neutral/gray palette
const NEUTRAL_PALETTE = {
  id: "gray",
  displayName: "Gray",
  patterns: [/grey|gray|neutral|slate|zinc|stone|muted/i],
};

// Build chromatic color palettes from TAILWIND_CHROMATIC_COLORS
// Each color gets its own regex pattern
const CHROMATIC_PALETTES = TAILWIND_CHROMATIC_COLORS.map((color) => ({
  id: color,
  displayName: color.charAt(0).toUpperCase() + color.slice(1),
  patterns: [new RegExp(`\\b${color}\\b`, "i")],
}));

// Combined palette definitions - order matters (first match wins)
const PALETTE_DEFINITIONS = [
  ...SEMANTIC_PALETTES,
  NEUTRAL_PALETTE,
  ...CHROMATIC_PALETTES,
];

// Use centralized Tailwind step definitions
const SCALE_STEPS = TAILWIND_STEPS;

function parseStep(name: string): number | undefined {
  const match = name.match(/\.(\d+)$/);
  if (match) {
    const step = parseInt(match[1], 10);
    if (SCALE_STEPS.includes(step)) return step;
  }
  return undefined;
}

function parseSemanticCategory(name: string): { category: string; subcategory?: string } {
  const parts = name.split(/[.\-]/);

  const categories = ["text", "background", "border", "foreground", "interactive", "icon", "surface"];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].toLowerCase();
    if (categories.includes(part)) {
      return {
        category: part,
        subcategory: parts[i + 1] || undefined,
      };
    }
  }

  if (parts.length >= 2) {
    return {
      category: parts[parts.length - 2],
      subcategory: parts[parts.length - 1],
    };
  }

  return { category: "other" };
}

function matchesPalette(
  name: string,
  definition: typeof PALETTE_DEFINITIONS[number]
): boolean {
  for (const pattern of definition.patterns) {
    if (pattern.test(name)) return true;
  }
  return false;
}

function findReferencedPrimitive(
  node: StyleNode,
  graph: StyleGraph
): StyleNode | undefined {
  if (node.dependencies.size === 0) return undefined;

  for (const depId of node.dependencies) {
    const dep = graph.getNode(depId);
    if (!dep) continue;

    if (dep.dependencies.size === 0 && dep.type === "color") {
      return dep;
    }

    const primitive = findReferencedPrimitive(dep, graph);
    if (primitive) return primitive;
  }

  return undefined;
}

export function useColorGrouping(
  graph: StyleGraph,
  viewMode: "light" | "dark",
  filteredNodes?: StyleNode[] | null
): PaletteGroup[] {
  return useMemo(() => {
    const nodes = filteredNodes || graph.getNodes({ excludeSpecs: true });
    const colorNodes = nodes.filter((node) => node.type === "color");

    const primitiveColors: ColorItem[] = [];
    const semanticColors: SemanticMapping[] = [];

    for (const node of colorNodes) {
      const resolved = graph.resolveNode(node.id, viewMode);
      if (!resolved || typeof resolved !== "string" || !resolved.startsWith("#")) {
        continue;
      }

      let oklch: OKLCHColor;
      try {
        oklch = hexToOKLCH(resolved);
      } catch {
        continue;
      }

      const isPrimitive = node.dependencies.size === 0;

      if (isPrimitive) {
        primitiveColors.push({
          node,
          resolvedColor: resolved,
          oklch,
          step: parseStep(node.name),
        });
      } else {
        const { category, subcategory } = parseSemanticCategory(node.name);
        semanticColors.push({
          node,
          resolvedColor: resolved,
          oklch,
          category,
          subcategory,
          referencedPrimitive: findReferencedPrimitive(node, graph),
        });
      }
    }

    const paletteGroups = new Map<string, PaletteGroup>();

    // Initialize groups
    for (const def of PALETTE_DEFINITIONS) {
      paletteGroups.set(def.id, {
        id: def.id,
        name: def.id,
        displayName: def.displayName,
        primitives: [],
        semanticMappings: [],
      });
    }

    // Add "other" group for unmatched colors
    paletteGroups.set("other", {
      id: "other",
      name: "other",
      displayName: "Other",
      primitives: [],
      semanticMappings: [],
    });

    // Assign primitives to groups
    for (const color of primitiveColors) {
      let assigned = false;

      for (const def of PALETTE_DEFINITIONS) {
        if (matchesPalette(color.node.name, def)) {
          paletteGroups.get(def.id)!.primitives.push(color);
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        paletteGroups.get("other")!.primitives.push(color);
      }
    }

    // Assign semantics to groups based on their referenced primitive or name
    for (const semantic of semanticColors) {
      let assigned = false;

      // First, try to match by referenced primitive
      if (semantic.referencedPrimitive) {
        for (const def of PALETTE_DEFINITIONS) {
          const group = paletteGroups.get(def.id)!;
          if (group.primitives.some((p) => p.node.id === semantic.referencedPrimitive!.id)) {
            group.semanticMappings.push(semantic);
            assigned = true;
            break;
          }
        }
      }

      // If not assigned, try to match by name
      if (!assigned) {
        for (const def of PALETTE_DEFINITIONS) {
          if (matchesPalette(semantic.node.name, def)) {
            paletteGroups.get(def.id)!.semanticMappings.push(semantic);
            assigned = true;
            break;
          }
        }
      }

      if (!assigned) {
        paletteGroups.get("other")!.semanticMappings.push(semantic);
      }
    }

    // Sort primitives by step within each group
    for (const group of paletteGroups.values()) {
      group.primitives.sort((a, b) => {
        if (a.step !== undefined && b.step !== undefined) {
          return a.step - b.step;
        }
        return b.oklch.l - a.oklch.l;
      });

      group.semanticMappings.sort((a, b) => {
        const catCompare = a.category.localeCompare(b.category);
        if (catCompare !== 0) return catCompare;
        return a.node.name.localeCompare(b.node.name);
      });
    }

    // Filter out empty groups and return in defined order
    const result: PaletteGroup[] = [];
    for (const def of PALETTE_DEFINITIONS) {
      const group = paletteGroups.get(def.id)!;
      if (group.primitives.length > 0 || group.semanticMappings.length > 0) {
        result.push(group);
      }
    }

    // Add "other" if it has colors
    const otherGroup = paletteGroups.get("other")!;
    if (otherGroup.primitives.length > 0 || otherGroup.semanticMappings.length > 0) {
      result.push(otherGroup);
    }

    return result;
  }, [graph, viewMode, filteredNodes]);
}
