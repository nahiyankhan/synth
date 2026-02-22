/**
 * Data Transformation: StyleGraph → Sankey Data
 *
 * Converts the StyleGraph dependency structure into Sankey nodes and links.
 * Currently supports 2 layers:
 *   - Layer 0: Primitives (no dependencies)
 *   - Layer 1: Semantic (has dependencies)
 *
 * Future: Layer 2 for component usage when CSS parsing is implemented.
 */

import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import { SankeyNode, SankeyLink } from "./types";

/**
 * Determine layer based on dependency structure
 */
function getNodeLayer(node: StyleNode): 0 | 1 {
  // No dependencies = primitive/palette
  if (node.dependencies.size === 0) {
    return 0;
  }
  // Has dependencies = semantic
  return 1;
}

/**
 * Convert StyleGraph color nodes to Sankey data structure
 */
export function graphToSankeyData(
  graph: StyleGraph,
  filteredNodes?: StyleNode[] | null
): {
  nodes: SankeyNode[];
  links: SankeyLink[];
} {
  // Get all color nodes (either filtered or all)
  const allNodes = filteredNodes || graph.getNodes({ excludeSpecs: true });
  const colorNodes = allNodes.filter((n) => n.type === "color");

  const nodes: SankeyNode[] = [];
  const nodeMap = new Map<string, SankeyNode>();

  // Create Sankey nodes
  for (const styleNode of colorNodes) {
    const lightHex = graph.resolveNode(styleNode.id, "light");
    const darkHex = graph.resolveNode(styleNode.id, "dark");

    // Skip if we can't resolve colors
    if (
      !lightHex ||
      !darkHex ||
      typeof lightHex !== "string" ||
      typeof darkHex !== "string"
    ) {
      continue;
    }

    const layer = getNodeLayer(styleNode);
    const layerNames = ["primitive", "semantic"] as const;

    const sankeyNode: SankeyNode = {
      id: styleNode.id,
      name: styleNode.name,
      node: styleNode,
      hex: { light: lightHex, dark: darkHex },
      layer,
      layerName: layerNames[layer],
      x0: 0,
      x1: 0,
      y: 0,
      index: nodes.length,
      visited: false,
      sourceLinks: [],
      targetLinks: [],
    };

    nodes.push(sankeyNode);
    nodeMap.set(styleNode.id, sankeyNode);
  }

  // Create links from dependencies
  const links: SankeyLink[] = [];
  for (const sankeyNode of nodes) {
    for (const depId of sankeyNode.node.dependencies) {
      const sourceNode = nodeMap.get(depId);

      // Only create link if source exists and is in a lower layer
      if (sourceNode && sourceNode.layer < sankeyNode.layer) {
        links.push({
          id: `${depId}->${sankeyNode.id}`,
          index: links.length,
          sourceId: depId,
          targetId: sankeyNode.id,
          source: sourceNode,
          target: sankeyNode,
          y: 0,
        });
      }
    }
  }

  return { nodes, links };
}

/**
 * Get statistics about the Sankey data
 */
export function getSankeyStats(nodes: SankeyNode[], links: SankeyLink[]) {
  const primitiveCount = nodes.filter((n) => n.layer === 0).length;
  const semanticCount = nodes.filter((n) => n.layer === 1).length;

  return {
    total: nodes.length,
    primitives: primitiveCount,
    semantic: semanticCount,
    connections: links.length,
  };
}

/**
 * Find all connected nodes (upstream and downstream) from a starting node
 */
export function findConnectedNodes(
  startNodeId: string,
  nodes: SankeyNode[],
  links: SankeyLink[]
): { activeNodes: Set<string>; activeLinks: Set<string> } {
  const activeNodes = new Set<string>();
  const activeLinks = new Set<string>();

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const startNode = nodeMap.get(startNodeId);
  if (!startNode) return { activeNodes, activeLinks };

  activeNodes.add(startNodeId);

  // Find upstream (sources)
  const findUpstream = (nodeId: string) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    for (const link of node.targetLinks) {
      activeLinks.add(link.id);
      if (!activeNodes.has(link.source.id)) {
        activeNodes.add(link.source.id);
        findUpstream(link.source.id);
      }
    }
  };

  // Find downstream (targets)
  const findDownstream = (nodeId: string) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    for (const link of node.sourceLinks) {
      activeLinks.add(link.id);
      if (!activeNodes.has(link.target.id)) {
        activeNodes.add(link.target.id);
        findDownstream(link.target.id);
      }
    }
  };

  // Find both directions
  findUpstream(startNodeId);
  findDownstream(startNodeId);

  return { activeNodes, activeLinks };
}
