/**
 * VirtualizedCanvasTokens - Performance-optimized canvas with virtualization
 *
 * Only renders elements visible in the viewport.
 * Handles 1000s of tokens smoothly.
 */

import React, { useMemo, useRef, useEffect, useState } from "react";
import { StyleNode } from "@/types/styleGraph";

interface VirtualizedCanvasTokensProps {
  nodes: StyleNode[];
  onNodeClick?: (node: StyleNode) => void;
  layout?: "grid" | "manual";
  // Transform state (passed from parent CanvasWrapper)
  transform?: { x: number; y: number; scale: number };
}

interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Calculate which nodes are visible in viewport
const getViewportBounds = (
  transform: { x: number; y: number; scale: number },
  viewportWidth: number,
  viewportHeight: number
): ViewportBounds => {
  // Convert viewport coordinates to canvas coordinates
  const minX = -transform.x / transform.scale;
  const maxX = (-transform.x + viewportWidth) / transform.scale;
  const minY = -transform.y / transform.scale;
  const maxY = (-transform.y + viewportHeight) / transform.scale;

  return { minX, maxX, minY, maxY };
};

const isInViewport = (
  x: number,
  y: number,
  width: number,
  height: number,
  bounds: ViewportBounds
): boolean => {
  return !(
    x + width < bounds.minX ||
    x > bounds.maxX ||
    y + height < bounds.minY ||
    y > bounds.maxY
  );
};

// Memoized card component - only re-renders when props change
const TokenCard = React.memo<{
  node: StyleNode & { x: number; y: number };
  onClick?: (node: StyleNode) => void;
}>(({ node, onClick }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: "250px",
      }}
      className="group cursor-pointer"
      onClick={() => onClick?.(node)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="bg-white border-2 border-dark-200 rounded-xl p-4 shadow-sm hover:shadow-lg hover:border-dark-400 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="text-xs text-dark-400 uppercase tracking-wide mb-1">
              {node.layer}
            </div>
            <h3 className="font-light text-sm text-dark-900 truncate">
              {node.name}
            </h3>
          </div>
          <span
            className={`inline-block px-2 py-0.5 text-xs rounded-full ${
              node.type === "color"
                ? "bg-purple-100 text-purple-700"
                : node.type === "typography"
                ? "bg-blue-100 text-blue-700"
                : node.type === "size"
                ? "bg-green-100 text-green-700"
                : "bg-dark-100 text-dark-700"
            }`}
          >
            {node.type}
          </span>
        </div>

        {/* Value preview */}
        <div className="mb-3">
          {node.type === "color" &&
          typeof node.value === "string" &&
          node.value.startsWith("#") ? (
            <div
              className="w-full h-20 rounded-lg border border-dark-200"
              style={{ backgroundColor: node.value }}
            />
          ) : (
            <div className="bg-dark-50 rounded-lg p-3 font-mono text-xs text-dark-700 truncate">
              {JSON.stringify(node.value)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-dark-400">
          <div>
            {node.dependencies?.size ? (
              <span>↓ {node.dependencies.size} deps</span>
            ) : (
              <span>primitive</span>
            )}
          </div>
          <div>
            {node.dependents?.size ? (
              <span>{node.dependents.size} uses ↑</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});

TokenCard.displayName = "TokenCard";

export const VirtualizedCanvasTokens: React.FC<
  VirtualizedCanvasTokensProps
> = ({
  nodes,
  onNodeClick,
  layout = "grid",
  transform = { x: 0, y: 0, scale: 1 },
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // Calculate positions for all nodes (memoized)
  const nodesWithPositions = useMemo(() => {
    const cols = 4;
    const cardWidth = 250;
    const cardHeight = 150;
    const gap = 40;

    return nodes.map((node, index) => {
      let x: number, y: number;

      if (layout === "grid") {
        const col = index % cols;
        const row = Math.floor(index / cols);
        x = 100 + col * (cardWidth + gap);
        y = 100 + row * (cardHeight + gap);
      } else {
        x = (node.metadata?.canvasX as number) || 100;
        y = (node.metadata?.canvasY as number) || 100;
      }

      return { ...node, x, y };
    });
  }, [nodes, layout]);

  // Update viewport size
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          setViewportSize({
            width: parent.clientWidth,
            height: parent.clientHeight,
          });
        }
      }
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Calculate visible nodes (virtualization)
  const visibleNodes = useMemo(() => {
    if (viewportSize.width === 0) return nodesWithPositions;

    const bounds = getViewportBounds(
      transform,
      viewportSize.width,
      viewportSize.height
    );

    // Add buffer zone around viewport for smooth scrolling
    const buffer = 300;
    const cardWidth = 250;
    const cardHeight = 150;

    const visible = nodesWithPositions.filter((node) =>
      isInViewport(
        node.x - buffer,
        node.y - buffer,
        cardWidth + buffer * 2,
        cardHeight + buffer * 2,
        bounds
      )
    );

    return visible;
  }, [nodesWithPositions, transform, viewportSize]);

  // Calculate canvas size
  const canvasSize = useMemo(() => {
    if (nodesWithPositions.length === 0) {
      return { width: 3000, height: 2000 };
    }

    // Find max x and y from positioned nodes
    const maxX = Math.max(...nodesWithPositions.map((n) => n.x)) + 250 + 100;
    const maxY = Math.max(...nodesWithPositions.map((n) => n.y)) + 150 + 100;

    return {
      width: Math.max(3000, maxX),
      height: Math.max(2000, maxY),
    };
  }, [nodesWithPositions]);

  // Performance stats
  const renderCount = visibleNodes.length;
  const totalCount = nodes.length;
  const culledCount = totalCount - renderCount;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        minWidth: `${canvasSize.width}px`,
        minHeight: `${canvasSize.height}px`,
      }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ddd 1px, transparent 1px),
            linear-gradient(to bottom, #ddd 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
        }}
      />

      {/* Render only visible cards */}
      {visibleNodes.map((node) => (
        <TokenCard key={node.id} node={node} onClick={onNodeClick} />
      ))}

      {/* Performance stats (dev only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-4 left-4 bg-black/75 text-white text-xs font-mono px-3 py-2 rounded pointer-events-none">
          <div>
            Rendering: {renderCount} / {totalCount}
          </div>
          <div>
            Culled: {culledCount} (
            {Math.round((culledCount / totalCount) * 100)}%)
          </div>
          <div className="text-green-400">
            {renderCount < 100
              ? "✓ Optimized"
              : renderCount < 200
              ? "⚠ OK"
              : "⚠ Many elements"}
          </div>
        </div>
      )}

      {/* Canvas info */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm border border-dark-200 rounded px-3 py-2 text-xs text-dark-500 font-mono pointer-events-none">
        {totalCount} tokens · {canvasSize.width} × {canvasSize.height}
      </div>
    </div>
  );
};
