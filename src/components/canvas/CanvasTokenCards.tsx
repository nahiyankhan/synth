/**
 * CanvasTokenCards - Example of positioning multiple elements on canvas
 *
 * Demonstrates:
 * - Absolute positioning of cards
 * - Grid layout
 * - Drag and drop (future)
 * - Connections between cards (future)
 */

import React from "react";
import { StyleNode } from "../../types/styleGraph";

interface CanvasTokenCardsProps {
  nodes: StyleNode[];
  onNodeClick?: (node: StyleNode) => void;
  layout?: "grid" | "manual";
}

export const CanvasTokenCards: React.FC<CanvasTokenCardsProps> = ({
  nodes,
  onNodeClick,
  layout = "grid",
}) => {
  // Calculate positions based on layout mode
  const getNodePosition = (index: number) => {
    if (layout === "grid") {
      // Grid layout: 4 columns
      const cols = 4;
      const cardWidth = 250;
      const cardHeight = 150;
      const gap = 40;

      const col = index % cols;
      const row = Math.floor(index / cols);

      return {
        x: 100 + col * (cardWidth + gap),
        y: 100 + row * (cardHeight + gap),
      };
    } else {
      // Manual layout - would come from node.metadata.position
      return {
        x: (nodes[index].metadata?.canvasX as number) || 100,
        y: (nodes[index].metadata?.canvasY as number) || 100,
      };
    }
  };

  // Calculate total canvas size
  const getCanvasSize = () => {
    if (layout === "grid") {
      const cols = 4;
      const rows = Math.ceil(nodes.length / cols);
      return {
        width: Math.max(3000, 100 + cols * 290),
        height: Math.max(2000, 100 + rows * 190),
      };
    }
    return { width: 5000, height: 5000 };
  };

  const canvasSize = getCanvasSize();

  return (
    <div
      style={{
        position: "relative",
        minWidth: `${canvasSize.width}px`,
        minHeight: `${canvasSize.height}px`,
      }}
    >
      {/* Background grid helper */}
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

      {/* Token cards */}
      {nodes.map((node, index) => {
        const pos = getNodePosition(index);

        return (
          <div
            key={node.id}
            style={{
              position: "absolute",
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: "250px",
            }}
            className="group cursor-pointer"
            onClick={() => onNodeClick?.(node)}
            onMouseDown={(e) => e.stopPropagation()} // Prevent canvas pan
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
                <div className="flex-shrink-0 ml-2">
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
                  <div className="bg-dark-50 rounded-lg p-3 font-mono text-xs text-dark-700">
                    {JSON.stringify(node.value)}
                  </div>
                )}
              </div>

              {/* Footer - Dependencies */}
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
      })}

      {/* Canvas position indicator (bottom-right corner) */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm border border-dark-200 rounded px-3 py-2 text-xs text-dark-500 font-mono pointer-events-none">
        Canvas: {canvasSize.width} × {canvasSize.height}
      </div>
    </div>
  );
};
