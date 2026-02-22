/**
 * Inverse Depth Calculator
 * 
 * Calculates depth from outside-in (composites to primitives)
 * Used for concentric ring visualization where:
 * - Depth 0 (outer ring) = Leaf nodes (composites/components)
 * - Max depth (center) = Root nodes (primitives)
 */

import type { CanvasNode, CanvasLink } from '../../../types/canvas';

export interface DepthResult {
  nodeDepth: Map<string, number>; // node ID -> ring depth
  maxDepth: number;
  nodesByDepth: Map<number, string[]>; // ring -> node IDs
}

/**
 * Calculate inverse depth (outside-in) for all nodes
 * 
 * Algorithm:
 * 1. Find leaf nodes (nodes that are only dependents, never dependencies)
 * 2. Assign depth 0 to leaf nodes (outermost ring)
 * 3. BFS inward: for each unprocessed node, check if any dependents have assigned depth
 * 4. Assign depth = max(dependent depths) + 1
 * 5. Continue until all nodes processed
 * 6. Primitives end up at highest depth (innermost ring)
 */
export function calculateInverseDepth(
  nodes: CanvasNode[],
  links: CanvasLink[]
): DepthResult {
  const nodeDepth = new Map<string, number>();
  const nodesByDepth = new Map<number, string[]>();

  // Build dependency maps for efficient lookup
  const nodeIsDependency = new Set<string>(); // Nodes that are depended upon
  const nodeIsDepen = new Set<string>(); // Nodes that depend on others
  const nodeDependents = new Map<string, string[]>(); // node -> [nodes that depend on it]

  links.forEach(link => {
    nodeIsDependency.add(link.source);
    nodeIsDepen.add(link.target);
    
    if (!nodeDependents.has(link.source)) {
      nodeDependents.set(link.source, []);
    }
    nodeDependents.get(link.source)!.push(link.target);
  });

  // Find leaf nodes (composites/specs that are only dependents, never depended upon)
  const leafNodes = nodes.filter(node => {
    const isDependedUpon = nodeIsDependency.has(node.id);
    const dependsOnOthers = nodeIsDepen.has(node.id);
    
    // Leaf = has dependencies but nothing depends on it
    // OR has no connections at all (orphan)
    return dependsOnOthers && !isDependedUpon || (!dependsOnOthers && !isDependedUpon);
  });

  // Initialize depth 0 (outermost ring) with leaf nodes
  leafNodes.forEach(node => {
    nodeDepth.set(node.id, 0);
  });
  
  if (!nodesByDepth.has(0)) {
    nodesByDepth.set(0, []);
  }
  leafNodes.forEach(node => {
    nodesByDepth.get(0)!.push(node.id);
  });

  // BFS from leaf nodes inward
  let currentDepth = 0;
  let processed = new Set(leafNodes.map(n => n.id));
  let maxDepth = 0;

  while (processed.size < nodes.length) {
    const nextDepthNodes: CanvasNode[] = [];

    // Find nodes whose dependents all have assigned depths
    nodes.forEach(node => {
      if (processed.has(node.id)) return;

      const dependents = nodeDependents.get(node.id) || [];
      
      // If this node has no dependents, it's a root (primitive)
      if (dependents.length === 0) {
        // Will be processed in final pass
        return;
      }

      // Check if all dependents have assigned depths
      const allDependentsProcessed = dependents.every(depId => 
        nodeDepth.has(depId)
      );

      if (allDependentsProcessed) {
        // Calculate depth as max(dependent depths) + 1
        const dependentDepths = dependents.map(depId => 
          nodeDepth.get(depId) || 0
        );
        const maxDependentDepth = Math.max(...dependentDepths);
        const nodeDepthValue = maxDependentDepth + 1;

        nodeDepth.set(node.id, nodeDepthValue);
        nextDepthNodes.push(node);
        processed.add(node.id);
        maxDepth = Math.max(maxDepth, nodeDepthValue);

        if (!nodesByDepth.has(nodeDepthValue)) {
          nodesByDepth.set(nodeDepthValue, []);
        }
        nodesByDepth.get(nodeDepthValue)!.push(node.id);
      }
    });

    // If no new nodes processed, assign remaining nodes to next depth
    if (nextDepthNodes.length === 0) {
      currentDepth++;
      const unprocessedNodes = nodes.filter(n => !processed.has(n.id));
      
      if (unprocessedNodes.length === 0) break;

      // Assign all remaining nodes (primitives with no dependents)
      unprocessedNodes.forEach(node => {
        const depthValue = currentDepth;
        nodeDepth.set(node.id, depthValue);
        processed.add(node.id);
        maxDepth = Math.max(maxDepth, depthValue);

        if (!nodesByDepth.has(depthValue)) {
          nodesByDepth.set(depthValue, []);
        }
        nodesByDepth.get(depthValue)!.push(node.id);
      });
      break;
    }
  }

  return {
    nodeDepth,
    maxDepth,
    nodesByDepth,
  };
}

/**
 * Get nodes at a specific depth level
 */
export function getNodesAtDepth(
  depthResult: DepthResult,
  depth: number
): string[] {
  return depthResult.nodesByDepth.get(depth) || [];
}

/**
 * Get depth for a specific node
 */
export function getNodeDepth(
  depthResult: DepthResult,
  nodeId: string
): number | undefined {
  return depthResult.nodeDepth.get(nodeId);
}

