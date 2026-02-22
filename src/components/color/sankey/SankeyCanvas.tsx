/**
 * Sankey Canvas Component
 *
 * Main canvas rendering component for the color token flow diagram.
 * Handles high-DPI rendering, animations, and user interactions.
 */

"use client";

import { useRef, useEffect, useCallback } from "react";
import {
  SankeyNode,
  SankeyLink,
  AnimatingNode,
  LAYER_WIDTH,
  FONT_SIZE,
} from "./types";
import { colors } from "./colors";
import { setupCanvas, easeOutCubic, getNodeDimensions } from "./utils";
import { useCanvasAnimation, getAnimatedPosition } from "./useCanvasAnimation";
import { useCanvasInteraction } from "./useCanvasInteraction";
import { drawNode, drawColumnHeaders } from "./drawNode";
import { drawAllLinks } from "./drawLink";

interface SankeyCanvasProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  activeNodes: Set<string>;
  activeLinks: Set<string>;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  theme: "light" | "dark";
  colorMode: "light" | "dark";
}

export function SankeyCanvas({
  nodes,
  links,
  activeNodes,
  activeLinks,
  selectedNodeId,
  onNodeSelect,
  theme,
  colorMode,
}: SankeyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Animation state
  const {
    animatingNodes,
    isAnimating,
    animationProgress,
    linkAnimationProgress,
    updateProgress,
    nodeAnimationComplete,
  } = useCanvasAnimation(nodes);

  // Get current animated position for a node
  const getNodePosition = useCallback(
    (node: AnimatingNode) => {
      const progress = animationProgress.current;
      return getAnimatedPosition(node, progress, easeOutCubic);
    },
    [animationProgress]
  );

  // Interaction state
  const {
    transform,
    hoveredNodeId,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
  } = useCanvasInteraction(canvasRef, animatingNodes, onNodeSelect, getNodePosition);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set canvas size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    const themeColors = colors[theme];
    ctx.fillStyle = themeColors.bg;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Apply transform (pan & zoom)
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    // Draw column headers
    drawColumnHeaders(ctx, theme, LAYER_WIDTH);

    // Build node position map for links
    const nodePositions = new Map<string, { x: number; y: number }>();
    for (const node of animatingNodes) {
      const pos = getNodePosition(node);
      nodePositions.set(node.id, { x: pos.x, y: pos.y });
    }

    // Draw links (inactive first, then active)
    const linkProgress = nodeAnimationComplete.current
      ? linkAnimationProgress.current
      : 0;

    drawAllLinks(
      ctx,
      links,
      nodePositions,
      animatingNodes,
      activeLinks,
      theme,
      linkProgress
    );

    // Draw nodes
    const hasActiveSelection = activeNodes.size > 0;

    for (const node of animatingNodes) {
      const pos = getNodePosition(node);
      const isHovered = hoveredNodeId === node.id;
      const isActive = activeNodes.has(node.id);

      drawNode({
        ctx,
        node,
        currentX: pos.x,
        currentY: pos.y,
        theme,
        colorMode,
        opacity: pos.opacity,
        isHovered,
        isActive,
        hasActiveSelection,
      });
    }

    ctx.restore();
  }, [
    theme,
    colorMode,
    transform,
    animatingNodes,
    links,
    activeNodes,
    activeLinks,
    hoveredNodeId,
    getNodePosition,
    nodeAnimationComplete,
    linkAnimationProgress,
  ]);

  // Animation loop
  useEffect(() => {
    let running = true;

    const animate = (timestamp: number) => {
      if (!running) return;

      if (isAnimating) {
        updateProgress(timestamp);
      }

      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, updateProgress, render]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      render();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [render]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-base-200/80 rounded text-xs text-base-content/60">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
}
