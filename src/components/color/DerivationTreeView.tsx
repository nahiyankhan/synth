/**
 * DerivationTreeView - Dependency tree visualization
 *
 * Shows how semantic tokens derive from primitive palette steps,
 * visualized as an interactive tree with connecting lines.
 */

import React, { useState, useMemo, useRef } from "react";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import { hexToOKLCH, OKLCHColor, getAccessibleTextColor } from "@/services/colorScience";
import { shortenTokenName } from "./utils/token-name-utils";
import { FilterBanner } from "@/components/ui/filter-banner";
import { OKLCHDisplay } from "./shared/OKLCHDisplay";
import { ColorDetailPanel } from "./shared/ColorDetailPanel";
import {
  useCanvasTransform,
  getTransformStyle,
  formatScalePercent,
} from "./hooks/useCanvasTransform";

interface DerivationTreeViewProps {
  graph: StyleGraph;
  viewMode: "light" | "dark";
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
}

interface TreeNodeData {
  node: StyleNode;
  resolvedColor: string | null;
  oklch: OKLCHColor | null;
  children: TreeNodeData[];
  level: number;
  x: number;
  y: number;
  isRoot: boolean;
}

interface EdgeData {
  from: TreeNodeData;
  to: TreeNodeData;
}

// Layout configuration
const NODE_WIDTH = 160;
const NODE_HEIGHT = 48;
const LEVEL_SPACING = 100;
const NODE_SPACING = 20;
const PADDING = 60;

// Build tree structure from graph
function buildTree(
  graph: StyleGraph,
  viewMode: "light" | "dark",
  filteredNodes?: StyleNode[] | null
): { roots: TreeNodeData[]; edges: EdgeData[]; allNodes: TreeNodeData[] } {
  const nodes = filteredNodes || graph.getNodes({ excludeSpecs: true });
  const colorNodes = nodes.filter((n) => n.type === "color");

  // Build node map
  const nodeMap = new Map<string, TreeNodeData>();
  const edges: EdgeData[] = [];

  // First pass: create TreeNodeData for all nodes
  for (const node of colorNodes) {
    const resolved = graph.resolveNode(node.id, viewMode);
    const resolvedColor =
      resolved && typeof resolved === "string" && resolved.startsWith("#")
        ? resolved
        : null;

    let oklch: OKLCHColor | null = null;
    if (resolvedColor) {
      try {
        oklch = hexToOKLCH(resolvedColor);
      } catch {}
    }

    nodeMap.set(node.id, {
      node,
      resolvedColor,
      oklch,
      children: [],
      level: 0,
      x: 0,
      y: 0,
      isRoot: node.dependencies.size === 0,
    });
  }

  // Second pass: build parent-child relationships
  for (const node of colorNodes) {
    const treeNode = nodeMap.get(node.id)!;

    // Find children (nodes that depend on this one)
    for (const dep of node.dependents) {
      const child = nodeMap.get(dep);
      if (child) {
        treeNode.children.push(child);
        edges.push({ from: treeNode, to: child });
      }
    }
  }

  // Find roots (nodes with no dependencies)
  const roots = Array.from(nodeMap.values()).filter((n) => n.isRoot);

  // Calculate levels via BFS
  const visited = new Set<string>();
  const queue: TreeNodeData[] = [...roots];
  roots.forEach((r) => {
    r.level = 0;
    visited.add(r.node.id);
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const child of current.children) {
      if (!visited.has(child.node.id)) {
        child.level = current.level + 1;
        visited.add(child.node.id);
        queue.push(child);
      }
    }
  }

  // Layout: position nodes by level
  const levelGroups = new Map<number, TreeNodeData[]>();
  for (const node of nodeMap.values()) {
    if (!levelGroups.has(node.level)) {
      levelGroups.set(node.level, []);
    }
    levelGroups.get(node.level)!.push(node);
  }

  // Position nodes
  for (const [level, nodesAtLevel] of levelGroups) {
    const totalWidth =
      nodesAtLevel.length * NODE_WIDTH +
      (nodesAtLevel.length - 1) * NODE_SPACING;
    let startX = PADDING;

    nodesAtLevel.forEach((node, index) => {
      node.x = startX + index * (NODE_WIDTH + NODE_SPACING);
      node.y = PADDING + level * LEVEL_SPACING;
    });
  }

  return {
    roots,
    edges,
    allNodes: Array.from(nodeMap.values()),
  };
}

export const DerivationTreeView: React.FC<DerivationTreeViewProps> = ({
  graph,
  viewMode,
  filteredNodes,
  onClearFilter,
}) => {
  const [selectedNode, setSelectedNode] = useState<TreeNodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<TreeNodeData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    transform,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    resetTransform,
  } = useCanvasTransform({ minScale: 0.25, maxScale: 2 });

  // Build tree
  const { roots, edges, allNodes } = useMemo(
    () => buildTree(graph, viewMode, filteredNodes),
    [graph, viewMode, filteredNodes]
  );

  // Calculate canvas dimensions
  const canvasDimensions = useMemo(() => {
    if (allNodes.length === 0) return { width: 800, height: 600 };

    let maxX = 0;
    let maxY = 0;

    for (const node of allNodes) {
      maxX = Math.max(maxX, node.x + NODE_WIDTH);
      maxY = Math.max(maxY, node.y + NODE_HEIGHT);
    }

    return {
      width: maxX + PADDING * 2,
      height: maxY + PADDING * 2,
    };
  }, [allNodes]);

  // Find highlighted nodes (selected + its connections)
  const highlightedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (!selectedNode && !hoveredNode) return ids;

    const target = selectedNode || hoveredNode;
    if (!target) return ids;

    ids.add(target.node.id);

    // Add dependencies
    for (const dep of target.node.dependencies) {
      ids.add(dep);
    }

    // Add dependents
    for (const dep of target.node.dependents) {
      ids.add(dep);
    }

    return ids;
  }, [selectedNode, hoveredNode]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allNodes.length,
      roots: roots.length,
      maxLevel: Math.max(...allNodes.map((n) => n.level), 0),
    };
  }, [allNodes, roots]);

  // Empty state
  if (allNodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-dark-900">
            No color dependencies found
          </h3>
          <p className="text-dark-500">
            The tree view shows relationships between colors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-dark-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dark-900">
            Color Dependency Tree
          </h2>
          <p className="text-sm text-dark-500">
            {stats.total} colors • {stats.roots} roots • {stats.maxLevel + 1} levels deep
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetTransform}
            className="px-3 py-1.5 text-sm bg-dark-100 hover:bg-dark-200 rounded-lg transition-colors"
          >
            Reset view
          </button>
          <span className="text-sm text-dark-400">
            {formatScalePercent(transform.scale)}
          </span>
        </div>
      </div>

      {/* Filter banner */}
      {filteredNodes && (
        <FilterBanner
          count={filteredNodes.length}
          itemLabel="colors"
          className="px-6 mb-0 border-b"
          onClear={onClearFilter}
        />
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: getTransformStyle(transform),
            transformOrigin: "0 0",
            width: canvasDimensions.width,
            height: canvasDimensions.height,
          }}
        >
          {/* SVG for edges */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={canvasDimensions.width}
            height={canvasDimensions.height}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#94a3b8"
                />
              </marker>
            </defs>
            {edges.map((edge, idx) => {
              const isHighlighted =
                highlightedNodeIds.has(edge.from.node.id) &&
                highlightedNodeIds.has(edge.to.node.id);

              const fromX = edge.from.x + NODE_WIDTH / 2;
              const fromY = edge.from.y + NODE_HEIGHT;
              const toX = edge.to.x + NODE_WIDTH / 2;
              const toY = edge.to.y;

              // Bezier curve for smooth edges
              const midY = (fromY + toY) / 2;

              return (
                <path
                  key={idx}
                  d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`}
                  fill="none"
                  stroke={isHighlighted ? "#3b82f6" : "#cbd5e1"}
                  strokeWidth={isHighlighted ? 2 : 1}
                  markerEnd="url(#arrowhead)"
                  className="transition-all duration-200"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {allNodes.map((treeNode) => {
            const isHighlighted = highlightedNodeIds.has(treeNode.node.id);
            const isSelected = selectedNode?.node.id === treeNode.node.id;

            return (
              <button
                key={treeNode.node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(isSelected ? null : treeNode);
                }}
                onMouseEnter={() => setHoveredNode(treeNode)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`absolute rounded-lg border-2 transition-all duration-200 flex items-center gap-2 px-3 ${
                  isSelected
                    ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500 z-20"
                    : isHighlighted
                    ? "border-blue-300 z-10"
                    : "border-dark-200 hover:border-dark-300"
                } ${highlightedNodeIds.size > 0 && !isHighlighted ? "opacity-30" : ""}`}
                style={{
                  left: treeNode.x,
                  top: treeNode.y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                  backgroundColor: treeNode.resolvedColor || "#f1f5f9",
                }}
              >
                {/* Color swatch */}
                <div
                  className="w-6 h-6 rounded border border-dark-200/50 shrink-0"
                  style={{
                    backgroundColor: treeNode.resolvedColor || "#e2e8f0",
                  }}
                />
                {/* Name */}
                <span
                  className="text-xs font-medium truncate"
                  style={{
                    color: getAccessibleTextColor(treeNode.resolvedColor),
                  }}
                >
                  {shortenTokenName(treeNode.node.name)}
                </span>
                {/* Root badge */}
                {treeNode.isRoot && (
                  <span
                    className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center"
                    title="Root (primitive)"
                  >
                    <span className="text-[8px] text-amber-900 font-bold">R</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <NodeDetailPanel
          treeNode={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Legend */}
      <div className="px-6 py-3 border-t border-dark-200 flex items-center gap-6 text-xs text-dark-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
            <span className="text-[8px] text-amber-900 font-bold">R</span>
          </div>
          <span>Root (primitive)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-dark-300" />
          <span>Dependency</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-dark-100 rounded text-[10px]">Scroll</kbd>
          <span>Pan</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-dark-100 rounded text-[10px]">Cmd+Scroll</kbd>
          <span>Zoom</span>
        </div>
      </div>
    </div>
  );
};

// Detail panel
interface NodeDetailPanelProps {
  treeNode: TreeNodeData;
  onClose: () => void;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  treeNode,
  onClose,
}) => {
  return (
    <ColorDetailPanel
      color={treeNode.resolvedColor || "#f1f5f9"}
      title={shortenTokenName(treeNode.node.name)}
      subtitle={treeNode.resolvedColor || "unresolved"}
      onClose={onClose}
      variant="light"
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-dark-50 rounded-lg p-2">
          <div className="text-lg font-semibold text-dark-900">
            {treeNode.level}
          </div>
          <div className="text-xs text-dark-400">Level</div>
        </div>
        <div className="bg-dark-50 rounded-lg p-2">
          <div className="text-lg font-semibold text-dark-900">
            {treeNode.node.dependencies.size}
          </div>
          <div className="text-xs text-dark-400">Dependencies</div>
        </div>
        <div className="bg-dark-50 rounded-lg p-2">
          <div className="text-lg font-semibold text-dark-900">
            {treeNode.node.dependents.size}
          </div>
          <div className="text-xs text-dark-400">Dependents</div>
        </div>
      </div>

      {/* OKLCH */}
      {treeNode.oklch && (
        <OKLCHDisplay oklch={treeNode.oklch} showFullLabels />
      )}

      {/* Badges */}
      <div className="flex gap-2">
        {treeNode.isRoot && (
          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
            Root / Primitive
          </span>
        )}
        {treeNode.node.layer && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
            {treeNode.node.layer}
          </span>
        )}
      </div>
    </ColorDetailPanel>
  );
};
