/**
 * ColorForceGraphView - Force-directed graph of color relationships
 *
 * Shows all colors as nodes with force-directed positioning based on
 * their dependency relationships, not their color values.
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import { hexToOKLCH, OKLCHColor } from "@/services/colorScience";
import { shortenTokenName } from "./utils/token-name-utils";
import { FilterBanner } from "@/components/ui/filter-banner";
import { ColorDetailPanel } from "./shared/ColorDetailPanel";

interface ColorForceGraphViewProps {
  graph: StyleGraph;
  viewMode: "light" | "dark";
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
}

interface GraphNode {
  id: string;
  node: StyleNode;
  hex: string;
  oklch: OKLCHColor | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isRoot: boolean;
  mass: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

// Physics constants
const REPULSION_STRENGTH = 3000;
const ATTRACTION_STRENGTH = 0.008;
const CENTER_GRAVITY = 0.002;
const DAMPING = 0.85;
const MIN_DISTANCE = 100;

export const ColorForceGraphView: React.FC<ColorForceGraphViewProps> = ({
  graph,
  viewMode,
  filteredNodes,
  onClearFilter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isSimulating, setIsSimulating] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Mouse interaction state
  const isDragging = useRef(false);
  const draggedNode = useRef<GraphNode | null>(null);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Build graph data
  const { nodes: initialNodes, edges } = useMemo(() => {
    const allNodes = filteredNodes || graph.getNodes({ excludeSpecs: true });
    const colorNodes = allNodes.filter((n) => n.type === "color");

    const graphNodes: GraphNode[] = [];
    const graphEdges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // Create nodes
    for (const node of colorNodes) {
      const resolved = graph.resolveNode(node.id, viewMode);
      if (!resolved || typeof resolved !== "string" || !resolved.startsWith("#")) {
        continue;
      }

      let oklch: OKLCHColor | null = null;
      try {
        oklch = hexToOKLCH(resolved);
      } catch {}

      const isRoot = node.dependencies.size === 0;
      const graphNode: GraphNode = {
        id: node.id,
        node,
        hex: resolved,
        oklch,
        // Random initial position
        x: Math.random() * 600 - 300,
        y: Math.random() * 400 - 200,
        vx: 0,
        vy: 0,
        isRoot,
        mass: isRoot ? 2 : 1, // Roots are heavier (more stable)
      };

      graphNodes.push(graphNode);
      nodeMap.set(node.id, graphNode);
    }

    // Create edges from dependencies
    for (const graphNode of graphNodes) {
      for (const depId of graphNode.node.dependencies) {
        if (nodeMap.has(depId)) {
          graphEdges.push({
            source: depId,
            target: graphNode.id,
          });
        }
      }
    }

    return { nodes: graphNodes, edges: graphEdges };
  }, [graph, viewMode, filteredNodes]);

  // Initialize nodes ref
  useEffect(() => {
    nodesRef.current = initialNodes.map(n => ({ ...n }));
    edgesRef.current = edges;
  }, [initialNodes, edges]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Force simulation
  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // Apply forces
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      // Skip if being dragged
      if (draggedNode.current?.id === node.id) continue;

      let fx = 0;
      let fy = 0;

      // Repulsion from other nodes
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const other = nodes[j];

        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < MIN_DISTANCE * 3) {
          const force = REPULSION_STRENGTH / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }

      // Attraction along edges
      for (const edge of edges) {
        let other: GraphNode | undefined;
        if (edge.source === node.id) {
          other = nodes.find(n => n.id === edge.target);
        } else if (edge.target === node.id) {
          other = nodes.find(n => n.id === edge.source);
        }

        if (other) {
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          fx += dx * ATTRACTION_STRENGTH;
          fy += dy * ATTRACTION_STRENGTH;
        }
      }

      // Center gravity
      fx += (centerX - node.x) * CENTER_GRAVITY;
      fy += (centerY - node.y) * CENTER_GRAVITY;

      // Update velocity with damping
      node.vx = (node.vx + fx / node.mass) * DAMPING;
      node.vy = (node.vy + fy / node.mass) * DAMPING;

      // Update position
      node.x += node.vx;
      node.y += node.vy;
    }
  }, [dimensions]);

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const { width, height } = dimensions;
    const { x: tx, y: ty, scale } = transform;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Apply transform
    ctx.save();
    ctx.translate(tx + width / 2, ty + height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    // Draw edges - always visible
    for (const edge of edges) {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (source && target) {
        const isHighlighted =
          selectedNode?.id === source.id ||
          selectedNode?.id === target.id ||
          hoveredNode?.id === source.id ||
          hoveredNode?.id === target.id;

        // Draw line
        ctx.strokeStyle = isHighlighted ? "#3b82f6" : "#94a3b8";
        ctx.lineWidth = isHighlighted ? 2.5 / scale : 1 / scale;
        ctx.globalAlpha = isHighlighted ? 1 : 0.4;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        // Arrow head - always show
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const arrowSize = isHighlighted ? 10 / scale : 6 / scale;
        const targetRadius = target.isRoot ? 24 : 18;
        const endX = target.x - Math.cos(angle) * targetRadius;
        const endY = target.y - Math.sin(angle) * targetRadius;

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle - Math.PI / 6),
          endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle + Math.PI / 6),
          endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = isHighlighted ? "#3b82f6" : "#94a3b8";
        ctx.fill();

        ctx.globalAlpha = 1;
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const radius = node.isRoot ? 20 : 14;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = node.hex;
      ctx.fill();

      // Border
      ctx.strokeStyle = isSelected ? "#3b82f6" : isHovered ? "#64748b" : "#00000033";
      ctx.lineWidth = isSelected ? 3 / scale : isHovered ? 2 / scale : 1 / scale;
      ctx.stroke();

      // Root indicator
      if (node.isRoot) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }

      // Label for selected/hovered
      if (isSelected || isHovered) {
        const label = shortenTokenName(node.node.name);
        ctx.font = `${12 / scale}px system-ui`;
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.fillText(label, node.x, node.y + radius + 14 / scale);
      }
    }

    ctx.restore();
  }, [dimensions, transform, selectedNode, hoveredNode]);

  // Animation loop
  useEffect(() => {
    let frameCount = 0;
    const maxFrames = 500; // Stop after settling

    const loop = () => {
      if (isSimulating && frameCount < maxFrames) {
        simulate();
        frameCount++;
      }
      render();
      animationRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simulate, render, isSimulating]);

  // Mouse handlers
  const getMousePos = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const { x: tx, y: ty, scale } = transform;
    const { width, height } = dimensions;

    // Convert screen coords to canvas coords
    const canvasX = ((e.clientX - rect.left - tx - width / 2) / scale) + width / 2;
    const canvasY = ((e.clientY - rect.top - ty - height / 2) / scale) + height / 2;

    return { x: canvasX, y: canvasY };
  };

  const findNodeAt = (x: number, y: number): GraphNode | null => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const radius = node.isRoot ? 20 : 14;
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy < radius * radius) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const node = findNodeAt(pos.x, pos.y);

    if (node) {
      draggedNode.current = node;
      isDragging.current = true;
    } else {
      isDragging.current = true;
    }

    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);

    if (isDragging.current && draggedNode.current) {
      // Drag node
      draggedNode.current.x = pos.x;
      draggedNode.current.y = pos.y;
      draggedNode.current.vx = 0;
      draggedNode.current.vy = 0;
    } else if (isDragging.current) {
      // Pan canvas
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    } else {
      // Hover detection
      const node = findNodeAt(pos.x, pos.y);
      setHoveredNode(node);
    }
  };

  const handleMouseUp = () => {
    if (draggedNode.current && !isDragging.current) {
      setSelectedNode(prev =>
        prev?.id === draggedNode.current?.id ? null : draggedNode.current
      );
    }
    isDragging.current = false;
    draggedNode.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const node = findNodeAt(pos.x, pos.y);
    setSelectedNode(prev => prev?.id === node?.id ? null : node);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(3, prev.scale + delta * prev.scale)),
    }));
  };

  // Stats
  const stats = useMemo(() => ({
    total: initialNodes.length,
    roots: initialNodes.filter(n => n.isRoot).length,
    edges: edges.length,
  }), [initialNodes, edges]);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Color Relationship Graph
          </h2>
          <p className="text-sm text-slate-500">
            {stats.total} colors • {stats.roots} primitives • {stats.edges} connections
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSimulating(prev => !prev)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              isSimulating
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isSimulating ? "Simulating..." : "Paused"}
          </button>
          <button
            onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
            className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Reset view
          </button>
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
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
        />
      </div>

      {/* Selected node detail */}
      {selectedNode && (
        <ColorDetailPanel
          color={selectedNode.hex}
          title={shortenTokenName(selectedNode.node.name)}
          subtitle={selectedNode.hex}
          onClose={() => setSelectedNode(null)}
          previewHeight={64}
          width="w-72"
          variant="light"
          className="absolute bottom-16 right-4"
        >
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-600">
                {selectedNode.node.dependencies.size} dependencies
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600">
                {selectedNode.node.dependents.size} dependents
              </span>
            </div>
          </div>

          {selectedNode.isRoot && (
            <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
              Primitive / Root
            </span>
          )}
        </ColorDetailPanel>
      )}

      {/* Legend */}
      <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-slate-300 ring-2 ring-amber-400 ring-offset-1" />
          <span>Primitive (root)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-slate-300" />
          <span>Derived</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-slate-300" />
          <span>Dependency</span>
        </div>
        <div className="ml-auto text-slate-400">
          Drag nodes • Scroll to zoom • Drag canvas to pan
        </div>
      </div>
    </div>
  );
};
