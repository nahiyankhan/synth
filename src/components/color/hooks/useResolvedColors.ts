/**
 * useResolvedColors - Hook for extracting and resolving color nodes
 *
 * Consolidates the common pattern of extracting color nodes from a StyleGraph,
 * resolving their values for a given view mode, and converting to OKLCH.
 */

import { useMemo } from "react";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import { hexToOKLCH, OKLCHColor } from "@/services/colorScience";

/**
 * A resolved color node with all computed values
 */
export interface ResolvedColorNode {
  /** Original StyleNode */
  node: StyleNode;
  /** Resolved hex color value */
  hex: string;
  /** OKLCH color values */
  oklch: OKLCHColor;
  /** Whether this is a root/primitive node (no dependencies) */
  isRoot: boolean;
}

/**
 * Extended resolved color with both light and dark mode values
 */
export interface ResolvedColorPair {
  /** Original StyleNode */
  node: StyleNode;
  /** Resolved hex color in light mode */
  lightHex: string;
  /** Resolved hex color in dark mode */
  darkHex: string;
  /** OKLCH values in light mode */
  lightOKLCH: OKLCHColor;
  /** OKLCH values in dark mode */
  darkOKLCH: OKLCHColor;
  /** Whether this is a root/primitive node */
  isRoot: boolean;
}

export interface UseResolvedColorsOptions {
  /** Exclude spec nodes */
  excludeSpecs?: boolean;
}

/**
 * Hook to extract and resolve color nodes from a StyleGraph.
 *
 * @param graph - The StyleGraph to extract colors from
 * @param viewMode - The view mode to resolve colors for
 * @param filteredNodes - Optional subset of nodes to use
 * @param options - Additional options
 *
 * @example
 * ```tsx
 * const colors = useResolvedColors(graph, "light", filteredNodes);
 * colors.map(c => <ColorSwatch key={c.node.id} color={c.hex} />)
 * ```
 */
export function useResolvedColors(
  graph: StyleGraph,
  viewMode: "light" | "dark",
  filteredNodes?: StyleNode[] | null,
  options: UseResolvedColorsOptions = {}
): ResolvedColorNode[] {
  const { excludeSpecs = true } = options;

  return useMemo(() => {
    const nodes = filteredNodes || graph.getNodes({ excludeSpecs });
    const colorNodes = nodes.filter((n) => n.type === "color");

    return colorNodes
      .map((node) => {
        const resolved = graph.resolveNode(node.id, viewMode);
        if (!resolved || typeof resolved !== "string" || !resolved.startsWith("#")) {
          return null;
        }

        try {
          const oklch = hexToOKLCH(resolved);
          return {
            node,
            hex: resolved,
            oklch,
            isRoot: node.dependencies.size === 0,
          };
        } catch {
          return null;
        }
      })
      .filter((item): item is ResolvedColorNode => item !== null);
  }, [graph, viewMode, filteredNodes, excludeSpecs]);
}

/**
 * Hook to extract color pairs (both light and dark values).
 * Useful for light/dark comparison views.
 *
 * @param graph - The StyleGraph to extract colors from
 * @param filteredNodes - Optional subset of nodes to use
 *
 * @example
 * ```tsx
 * const pairs = useResolvedColorPairs(graph, filteredNodes);
 * pairs.map(p => (
 *   <div>
 *     <ColorSwatch color={p.lightHex} />
 *     <ColorSwatch color={p.darkHex} />
 *   </div>
 * ))
 * ```
 */
export function useResolvedColorPairs(
  graph: StyleGraph,
  filteredNodes?: StyleNode[] | null,
  options: UseResolvedColorsOptions = {}
): ResolvedColorPair[] {
  const { excludeSpecs = true } = options;

  return useMemo(() => {
    const nodes = filteredNodes || graph.getNodes({ excludeSpecs });
    const colorNodes = nodes.filter((n) => n.type === "color");

    return colorNodes
      .map((node) => {
        const lightHex = graph.resolveNode(node.id, "light");
        const darkHex = graph.resolveNode(node.id, "dark");

        if (
          !lightHex ||
          !darkHex ||
          typeof lightHex !== "string" ||
          typeof darkHex !== "string" ||
          !lightHex.startsWith("#") ||
          !darkHex.startsWith("#")
        ) {
          return null;
        }

        try {
          const lightOKLCH = hexToOKLCH(lightHex);
          const darkOKLCH = hexToOKLCH(darkHex);

          return {
            node,
            lightHex,
            darkHex,
            lightOKLCH,
            darkOKLCH,
            isRoot: node.dependencies.size === 0,
          };
        } catch {
          return null;
        }
      })
      .filter((item): item is ResolvedColorPair => item !== null);
  }, [graph, filteredNodes, excludeSpecs]);
}

/**
 * Separate colors into roots (primitives) and derived (semantic) colors.
 */
export function separateRootsAndDerived<T extends { isRoot: boolean }>(
  colors: T[]
): { roots: T[]; derived: T[] } {
  const roots: T[] = [];
  const derived: T[] = [];

  for (const color of colors) {
    if (color.isRoot) {
      roots.push(color);
    } else {
      derived.push(color);
    }
  }

  return { roots, derived };
}
