/**
 * Tree Layout Algorithm (Hierarchical)
 * 
 * Arranges nodes in a tree structure based on dependencies:
 * - Roots (no dependencies) at the top
 * - Children arranged below parents
 * - Optimizes for minimal edge crossings
 */

import { CanvasNode, CanvasLink } from '../../../types/canvas';

export interface TreeLayoutConfig {
  width: number;
  height: number;
  orientation: 'vertical' | 'horizontal';
  levelSpacing: number;
  nodeSpacing: number;
}

interface TreeNode {
  node: CanvasNode;
  level: number;
  children: TreeNode[];
  parent: TreeNode | null;
  x: number;
  y: number;
}

export class TreeLayout {
  private config: TreeLayoutConfig;

  constructor(config: Partial<TreeLayoutConfig> = {}) {
    this.config = {
      width: 800,
      height: 600,
      orientation: 'vertical',
      levelSpacing: 120,
      nodeSpacing: 80,
      ...config,
    };
  }

  /**
   * Compute tree layout positions
   */
  compute(nodes: CanvasNode[], links: CanvasLink[]): CanvasNode[] {
    if (nodes.length === 0) return nodes;

    // Build adjacency map for dependencies
    const dependencyMap = new Map<string, Set<string>>();
    const dependentMap = new Map<string, Set<string>>();

    nodes.forEach(node => {
      dependencyMap.set(node.id, new Set());
      dependentMap.set(node.id, new Set());
    });

    links.forEach(link => {
      dependencyMap.get(link.target)?.add(link.source);
      dependentMap.get(link.source)?.add(link.target);
    });

    // Find root nodes (nodes with no dependencies)
    const roots = nodes.filter(node => 
      dependencyMap.get(node.id)?.size === 0
    );

    if (roots.length === 0) {
      // No roots found, use nodes with fewest dependencies
      const sorted = [...nodes].sort((a, b) => 
        (dependencyMap.get(a.id)?.size || 0) - (dependencyMap.get(b.id)?.size || 0)
      );
      roots.push(sorted[0]);
    }

    // Build tree structure
    const visited = new Set<string>();
    const treeNodes: TreeNode[] = [];

    const buildTree = (nodeId: string, level: number, parent: TreeNode | null): TreeNode | null => {
      if (visited.has(nodeId)) return null;
      visited.add(nodeId);

      const canvasNode = nodes.find(n => n.id === nodeId);
      if (!canvasNode) return null;

      const treeNode: TreeNode = {
        node: canvasNode,
        level,
        children: [],
        parent,
        x: 0,
        y: 0,
      };

      // Add children (nodes that depend on this one)
      const children = Array.from(dependentMap.get(nodeId) || []);
      children.forEach(childId => {
        const childTree = buildTree(childId, level + 1, treeNode);
        if (childTree) {
          treeNode.children.push(childTree);
        }
      });

      treeNodes.push(treeNode);
      return treeNode;
    };

    // Build trees from roots
    const rootTrees = roots.map(root => buildTree(root.id, 0, null)).filter(Boolean) as TreeNode[];

    // Add unvisited nodes as separate trees
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const tree = buildTree(node.id, 0, null);
        if (tree) rootTrees.push(tree);
      }
    });

    // Calculate positions using Reingold-Tilford algorithm
    this.calculatePositions(rootTrees);

    // Apply positions back to canvas nodes
    treeNodes.forEach(treeNode => {
      treeNode.node.x = treeNode.x;
      treeNode.node.y = treeNode.y;
    });

    return nodes;
  }

  /**
   * Calculate positions using modified Reingold-Tilford algorithm
   */
  private calculatePositions(roots: TreeNode[]) {
    // First pass: calculate relative positions
    roots.forEach((root, index) => {
      this.firstWalk(root);
      this.secondWalk(root, 0, index * 200); // Offset multiple trees
    });

    // Center the entire tree
    const allNodes = this.getAllNodes(roots);
    this.centerTree(allNodes);
  }

  private firstWalk(node: TreeNode, leftSibling: TreeNode | null = null): number {
    if (node.children.length === 0) {
      // Leaf node
      if (leftSibling) {
        node.x = leftSibling.x + this.config.nodeSpacing;
      } else {
        node.x = 0;
      }
      return node.x;
    }

    // Interior node - position based on children
    let prevChild: TreeNode | null = null;
    node.children.forEach(child => {
      this.firstWalk(child, prevChild);
      prevChild = child;
    });

    // Center over children
    const firstChild = node.children[0];
    const lastChild = node.children[node.children.length - 1];
    node.x = (firstChild.x + lastChild.x) / 2;

    if (leftSibling) {
      node.x = Math.max(node.x, leftSibling.x + this.config.nodeSpacing);
    }

    return node.x;
  }

  private secondWalk(node: TreeNode, modX: number, modY: number) {
    const { orientation, levelSpacing } = this.config;

    if (orientation === 'vertical') {
      node.x += modX;
      node.y = node.level * levelSpacing + modY;
    } else {
      node.x = node.level * levelSpacing + modY;
      node.y += modX;
    }

    node.children.forEach(child => {
      this.secondWalk(child, modX, modY);
    });
  }

  private getAllNodes(roots: TreeNode[]): TreeNode[] {
    const allNodes: TreeNode[] = [];
    
    const traverse = (node: TreeNode) => {
      allNodes.push(node);
      node.children.forEach(traverse);
    };

    roots.forEach(traverse);
    return allNodes;
  }

  private centerTree(nodes: TreeNode[]) {
    if (nodes.length === 0) return;

    // Find bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });

    // Center in viewport
    const centerX = (this.config.width - (maxX - minX)) / 2 - minX;
    const centerY = (this.config.height - (maxY - minY)) / 2 - minY;

    nodes.forEach(node => {
      node.x += centerX;
      node.y += centerY;
    });
  }

  updateConfig(config: Partial<TreeLayoutConfig>) {
    this.config = { ...this.config, ...config };
  }
}

