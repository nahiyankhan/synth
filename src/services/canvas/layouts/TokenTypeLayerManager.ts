/**
 * Token Type Layer Manager
 *
 * Organizes nodes by token type and assigns Z-positions for 3D visualization
 * Only creates layers for token types that exist in the data
 */

import type { CanvasNode, StyleType } from "../../../types/canvas";

export interface TokenTypeLayer {
  type: StyleType; // 'color' | 'typography' | 'size' | 'other'
  nodes: CanvasNode[];
  zPosition: number;
  color: number; // Layer color for visualization (hex)
  label: string; // Human-readable label
}

// Color mapping for each token type (matte colors inspired by RadiiViz)
const TYPE_COLORS: Record<StyleType, { color: number; label: string }> = {
  color: { color: 0x558def, label: "Color" }, // Matte blue
  spacing: { color: 0x3a9b6a, label: "Spacing" }, // Matte green
  typography: { color: 0x9a3d9a, label: "Typography" }, // Matte purple
  size: { color: 0xff4f00, label: "Size" }, // Orange
  other: { color: 0x78716c, label: "Other" }, // Stone-500
};

const Z_LAYER_SPACING = 10; // Units between each type layer (reduced for flatter view)

/**
 * Organize nodes by token type and assign Z-positions
 * Only creates layers for types that exist in the data
 */
export function organizeByTokenType(nodes: CanvasNode[]): TokenTypeLayer[] {
  // Group nodes by type
  const nodesByType = new Map<StyleType, CanvasNode[]>();

  nodes.forEach((node) => {
    const type = node.type;
    if (!nodesByType.has(type)) {
      nodesByType.set(type, []);
    }
    nodesByType.get(type)!.push(node);
  });

  // Create layers only for types that exist
  const layers: TokenTypeLayer[] = [];
  let zPosition = 0;

  // Sort types for consistent ordering
  const sortedTypes: StyleType[] = ["color", "typography", "size", "other"];

  sortedTypes.forEach((type) => {
    const nodesOfType = nodesByType.get(type);
    if (nodesOfType && nodesOfType.length > 0) {
      const typeConfig = TYPE_COLORS[type];

      layers.push({
        type,
        nodes: nodesOfType,
        zPosition,
        color: typeConfig.color,
        label: typeConfig.label,
      });

      zPosition += Z_LAYER_SPACING;
    }
  });

  return layers;
}

/**
 * Get layer for a specific token type
 */
export function getLayerForType(
  layers: TokenTypeLayer[],
  type: StyleType
): TokenTypeLayer | undefined {
  return layers.find((layer) => layer.type === type);
}

/**
 * Get all available token types in the layers
 */
export function getAvailableTypes(layers: TokenTypeLayer[]): StyleType[] {
  return layers.map((layer) => layer.type);
}

/**
 * Calculate total Z-span of all layers
 */
export function getTotalZSpan(layers: TokenTypeLayer[]): number {
  if (layers.length === 0) return 0;
  const maxZ = Math.max(...layers.map((l) => l.zPosition));
  return maxZ + Z_LAYER_SPACING;
}
