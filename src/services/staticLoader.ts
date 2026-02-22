/**
 * Static Design System Loader
 *
 * Loads the pre-exported design system from static JSON
 * instead of reading from the filesystem at runtime.
 */

import { StyleNode } from "../types/styleGraph";
import { hexToOKLCH } from "./colorScience";

export interface ExportedDesignSystem {
  metadata: {
    exportedAt: string;
    version: string;
    source: string;
    stats: any;
  };
  nodes: Array<{
    id: string;
    name: string;
    layer: "primitive" | "utility" | "composite";
    type: "color" | "typography" | "size" | "other";
    value: any;
    dependencies: string[];
    dependents: string[];
    metadata?: any;
  }>;
}

/**
 * Load the static design system JSON
 */
export async function loadStaticDesignSystem(): Promise<ExportedDesignSystem> {
  const response = await fetch("/data/design-system.json");
  if (!response.ok) {
    throw new Error(`Failed to load design system: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Convert exported node data back to StyleNode format
 */
export function hydrateNode(
  exportedNode: ExportedDesignSystem["nodes"][0]
): StyleNode {
  const node: StyleNode = {
    id: exportedNode.id,
    name: exportedNode.name,
    layer: exportedNode.layer,
    type: exportedNode.type,
    value: exportedNode.value,
    dependencies: new Set(exportedNode.dependencies),
    dependents: new Set(exportedNode.dependents),
    metadata: exportedNode.metadata,
  };

  // Auto-compute OKLCH for color nodes if not already present
  if (
    node.type === "color" &&
    typeof node.value === "string" &&
    node.value.startsWith("#")
  ) {
    if (!node.metadata?.colorScience?.oklch) {
      try {
        const oklch = hexToOKLCH(node.value);
        node.metadata = {
          ...node.metadata,
          colorScience: {
            oklch,
            computed: true,
          },
        };
      } catch (error) {
        console.warn(`Failed to compute OKLCH for ${node.name}:`, error);
      }
    }
  }

  return node;
}
