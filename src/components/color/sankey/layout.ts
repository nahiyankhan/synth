/**
 * Sankey Layout Algorithm
 *
 * Positions nodes in columns with iterative relaxation to minimize link crossings.
 * Based on the cash-design-system implementation.
 */

import {
  SankeyNode,
  SankeyLink,
  LAYER_WIDTH,
  NODE_PADDING,
  ITERATIONS,
} from "./types";

/**
 * Compute Sankey layout positions for nodes and links
 */
export function computeSankeyLayout(
  inputNodes: SankeyNode[],
  inputLinks: SankeyLink[],
  activeNodesSet: Set<string>
): { nodes: SankeyNode[]; links: SankeyLink[] } {
  // Deep clone to avoid mutation
  const nodes = inputNodes.map((n) => ({
    ...n,
    sourceLinks: [] as SankeyLink[],
    targetLinks: [] as SankeyLink[],
  }));
  const links = inputLinks.map((l) => ({ ...l }));

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // 1. Compute x positions (2 columns: primitives, semantic)
  for (const node of nodes) {
    node.x0 = node.layer * LAYER_WIDTH;
    node.x1 = node.x0;
  }

  // 2. Build link references
  for (const link of links) {
    const source = nodeById.get(link.sourceId);
    const target = nodeById.get(link.targetId);
    if (source && target) {
      link.source = source;
      link.target = target;
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    }
  }

  // 3. Group nodes into columns (2 columns)
  const columns: SankeyNode[][] = [[], []];
  for (const node of nodes) {
    if (node.layer < columns.length) {
      columns[node.layer].push(node);
    }
  }

  // 4. Initialize y positions
  for (const column of columns) {
    let y = 0;
    for (const node of column) {
      node.y = y;
      y += NODE_PADDING;
    }
  }

  // 5. Relaxation iterations to minimize link crossings
  for (let i = 0; i < ITERATIONS; i++) {
    const alpha = Math.pow(0.99, i);
    relaxLeftToRight(columns, alpha);
  }

  // 6. Final collision resolution
  for (const column of columns) {
    resolveCollisions(column);
  }

  // 7. If active nodes, separate active from inactive
  if (activeNodesSet.size > 0) {
    separateActiveNodes(nodes, activeNodesSet);
  }

  // 8. Compute link y positions
  for (const node of nodes) {
    for (const link of node.sourceLinks) {
      link.y = node.y;
    }
  }

  return { nodes, links };
}

/**
 * Relax node positions left to right based on connections
 */
function relaxLeftToRight(columns: SankeyNode[][], alpha: number): void {
  for (let i = 1; i < columns.length; i++) {
    const column = columns[i];
    for (const target of column) {
      if (target.targetLinks.length === 0) continue;

      let y = 0;
      let w = 0;
      for (const link of target.targetLinks) {
        const v = target.layer - link.source.layer;
        y += link.source.y * v;
        w += v;
      }

      if (w > 0) {
        let dy = (y / w - target.y) * alpha;
        dy = Math.floor(dy / NODE_PADDING) * NODE_PADDING;
        target.y += dy;
      }
    }
    column.sort((a, b) => a.y - b.y);
    resolveCollisions(column);
  }
}

/**
 * Resolve overlapping nodes in a column
 */
function resolveCollisions(nodes: SankeyNode[]): void {
  if (nodes.length === 0) return;

  const mid = nodes.length >> 1;
  const subject = nodes[mid];

  // Push up from middle
  let y = subject.y - NODE_PADDING;
  for (let i = mid - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.y > y) {
      node.y = y;
    }
    y = node.y - NODE_PADDING;
  }

  // Push down from middle
  y = subject.y + NODE_PADDING;
  for (let i = mid + 1; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.y < y) {
      node.y = y;
    }
    y = node.y + NODE_PADDING;
  }
}

/**
 * Separate active nodes from inactive, pushing inactive below
 */
function separateActiveNodes(
  nodes: SankeyNode[],
  activeNodesSet: Set<string>
): void {
  const activeNodes = nodes.filter((n) => activeNodesSet.has(n.id));
  const inactiveNodes = nodes.filter((n) => !activeNodesSet.has(n.id));

  // Get column counts from active nodes (2 columns)
  const columnCounts = [0, 0];
  for (const n of activeNodes) {
    if (n.layer < columnCounts.length) {
      columnCounts[n.layer]++;
    }
  }

  // Offset inactive nodes below active
  for (const node of inactiveNodes) {
    if (node.layer < columnCounts.length) {
      node.y += columnCounts[node.layer] * NODE_PADDING;
    }
  }
}

/**
 * Compute the total height needed for the layout
 */
export function computeLayoutHeight(nodes: SankeyNode[]): number {
  if (nodes.length === 0) return 0;

  let maxY = 0;
  for (const node of nodes) {
    maxY = Math.max(maxY, node.y);
  }

  return maxY + NODE_PADDING;
}

/**
 * Compute the total width needed for the layout
 */
export function computeLayoutWidth(): number {
  // 2 columns with LAYER_WIDTH spacing
  return LAYER_WIDTH + 200; // Account for node width
}
