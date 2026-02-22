/**
 * Circular Layout Algorithm
 * 
 * Arranges nodes in concentric circles based on their depth in the dependency graph:
 * - Center: Root nodes (no dependencies)
 * - Outer rings: Nodes at increasing dependency depths
 * - Evenly distributed around each ring
 */

import { CanvasNode, CanvasLink } from '../../../types/canvas';

export interface CircularLayoutConfig {
  width: number;
  height: number;
  centerRadius: number;
  ringSpacing: number;
  startAngle: number;
}

export class CircularLayout {
  private config: CircularLayoutConfig;

  constructor(config: Partial<CircularLayoutConfig> = {}) {
    this.config = {
      width: 800,
      height: 600,
      centerRadius: 100,
      ringSpacing: 100,
      startAngle: 0,
      ...config,
    };
  }

  /**
   * Compute circular layout positions
   */
  compute(nodes: CanvasNode[], links: CanvasLink[]): CanvasNode[] {
    if (nodes.length === 0) return nodes;

    // Build dependency map
    const dependencyMap = new Map<string, Set<string>>();
    nodes.forEach(node => {
      dependencyMap.set(node.id, new Set());
    });

    links.forEach(link => {
      dependencyMap.get(link.target)?.add(link.source);
    });

    // Calculate depth for each node (distance from roots)
    const depths = this.calculateDepths(nodes, dependencyMap);

    // Group nodes by depth
    const nodesByDepth = new Map<number, CanvasNode[]>();
    nodes.forEach(node => {
      const depth = depths.get(node.id) || 0;
      if (!nodesByDepth.has(depth)) {
        nodesByDepth.set(depth, []);
      }
      nodesByDepth.get(depth)!.push(node);
    });

    // Position nodes in concentric circles
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    const maxDepth = Math.max(...Array.from(nodesByDepth.keys()));

    nodesByDepth.forEach((depthNodes, depth) => {
      const radius = depth === 0 
        ? 0 // Center point for roots
        : this.config.centerRadius + (depth * this.config.ringSpacing);

      const angleStep = (2 * Math.PI) / depthNodes.length;

      depthNodes.forEach((node, index) => {
        if (depth === 0 && depthNodes.length === 1) {
          // Single root at center
          node.x = centerX;
          node.y = centerY;
        } else {
          const angle = this.config.startAngle + (index * angleStep);
          node.x = centerX + radius * Math.cos(angle);
          node.y = centerY + radius * Math.sin(angle);
        }
      });
    });

    return nodes;
  }

  /**
   * Calculate depth of each node (BFS from roots)
   */
  private calculateDepths(
    nodes: CanvasNode[],
    dependencyMap: Map<string, Set<string>>
  ): Map<string, number> {
    const depths = new Map<string, number>();
    
    // Find roots (nodes with no dependencies)
    const roots = nodes.filter(node => 
      dependencyMap.get(node.id)?.size === 0
    );

    if (roots.length === 0) {
      // No roots, use node with fewest dependencies
      const sorted = [...nodes].sort((a, b) => 
        (dependencyMap.get(a.id)?.size || 0) - (dependencyMap.get(b.id)?.size || 0)
      );
      roots.push(sorted[0]);
    }

    // BFS to assign depths
    const queue: Array<{ nodeId: string; depth: number }> = roots.map(root => ({
      nodeId: root.id,
      depth: 0,
    }));

    const visited = new Set<string>();

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      depths.set(nodeId, depth);

      // Add dependent nodes (nodes that depend on this one)
      nodes.forEach(node => {
        if (dependencyMap.get(node.id)?.has(nodeId)) {
          queue.push({ nodeId: node.id, depth: depth + 1 });
        }
      });
    }

    // Assign depth 0 to any unvisited nodes
    nodes.forEach(node => {
      if (!depths.has(node.id)) {
        depths.set(node.id, 0);
      }
    });

    return depths;
  }

  updateConfig(config: Partial<CircularLayoutConfig>) {
    this.config = { ...this.config, ...config };
  }
}

