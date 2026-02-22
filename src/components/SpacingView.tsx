/**
 * SizesView - Canvas-based size tokens display
 *
 * Displays size tokens (spacing, border radius, etc.) in a spatial canvas layout
 * Similar to ColorView and TypographyView
 */

import React, { useState, useRef, useMemo } from "react";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode, StyleMode } from "@/types/styleGraph";
import { XIcon } from "./icons";

interface SizesViewProps {
  graph: StyleGraph;
  viewMode: StyleMode;
  onSelectNode?: (node: StyleNode) => void;
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
  sizeNodes: StyleNode[];
}

interface PositionedSize {
  node: StyleNode;
  value: string | number;
  category: "spacing" | "radius";
  x: number;
  y: number;
  width: number;
  height: number;
}

// Helper to determine if this is a border radius token
const isRadiusToken = (node: StyleNode) => {
  return node.name.includes("radius");
};

export const SizesView: React.FC<SizesViewProps> = ({
  graph,
  viewMode,
  onSelectNode,
  sizeNodes,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedSize, setSelectedSize] = useState<PositionedSize | null>(null);
  const [hoveredSize, setHoveredSize] = useState<PositionedSize | null>(null);

  // Position size tokens on the canvas
  const positionedSizes = useMemo<PositionedSize[]>(() => {
    const positioned: PositionedSize[] = [];
    let currentY = 100;
    const VERTICAL_GAP = 80;
    const SPACING_WIDTH = 600;
    const RADIUS_SIZE = 120;

    // Group by category
    const spacingNodes = sizeNodes.filter((node) => !isRadiusToken(node));
    const radiusNodes = sizeNodes.filter(isRadiusToken);

    // Position spacing tokens (left column)
    spacingNodes.forEach((node) => {
      const resolved = graph.resolveNode(node.id, viewMode);
      if (resolved !== null && resolved !== undefined) {
        positioned.push({
          node,
          value: resolved,
          category: "spacing",
          x: 100,
          y: currentY,
          width: SPACING_WIDTH,
          height: 60,
        });
        currentY += VERTICAL_GAP;
      }
    });

    // Position radius tokens (right column)
    let radiusY = 100;
    radiusNodes.forEach((node) => {
      const resolved = graph.resolveNode(node.id, viewMode);
      if (resolved !== null && resolved !== undefined) {
        positioned.push({
          node,
          value: resolved,
          category: "radius",
          x: 800,
          y: radiusY,
          width: RADIUS_SIZE,
          height: RADIUS_SIZE,
        });
        radiusY += RADIUS_SIZE + 40;
      }
    });

    return positioned;
  }, [sizeNodes, graph, viewMode]);

  // Calculate canvas dimensions
  const canvasDimensions = useMemo(() => {
    const maxX = Math.max(
      ...positionedSizes.map((s) => s.x + (s.category === "spacing" ? s.width : s.width)),
      0
    );
    const maxY = Math.max(...positionedSizes.map((s) => s.y + s.height), 0);
    return {
      width: maxX + 200,
      height: maxY + 200,
    };
  }, [positionedSizes]);

  const handleSizeClick = (size: PositionedSize) => {
    setSelectedSize(selectedSize?.node.id === size.node.id ? null : size);
    onSelectNode?.(size.node);
  };

  if (sizeNodes.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[var(--dl-bg-app)]">
      {/* Scrollable container */}
      <div
        className="w-full h-full overflow-auto"
        style={{
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative inline-block origin-top-left bg-white"
          style={{
            width: `${canvasDimensions.width}px`,
            height: `${canvasDimensions.height}px`,
            minWidth: '100%',
            minHeight: '100%',
            backgroundImage: viewMode === 'dark' 
              ? `linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
                 linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)`
              : `linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
                 linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        >
          {/* Category labels */}
          {positionedSizes.filter(s => s.category === "spacing").length > 0 && (
            <div
              className="absolute text-xs font-medium text-dark-400 uppercase tracking-wider opacity-0 animate-stagger-fade-in"
              style={{ left: '100px', top: '72px' }}
            >
              Spacing
            </div>
          )}
          {positionedSizes.filter(s => s.category === "radius").length > 0 && (
            <div
              className="absolute text-xs font-medium text-dark-400 uppercase tracking-wider opacity-0 animate-stagger-fade-in"
              style={{ left: '800px', top: '72px' }}
            >
              Border Radius
            </div>
          )}

          {/* Size tokens */}
          {positionedSizes.map((size, index) => {
            const isHovered = hoveredSize?.node.id === size.node.id;
            const isSelected = selectedSize?.node.id === size.node.id;

            return (
              <div
                key={size.node.id}
                className="absolute transition-all duration-200 opacity-0 animate-stagger-fade-in"
                style={{
                  left: `${size.x}px`,
                  top: `${size.y}px`,
                  width: size.category === "spacing" ? `${size.width}px` : undefined,
                  animationDelay: `${index * 60}ms`,
                }}
              >
                {/* Token name - left aligned */}
                <div className="mb-2">
                  <button
                    onClick={() => handleSizeClick(size)}
                    onMouseEnter={() => setHoveredSize(size)}
                    onMouseLeave={() => setHoveredSize(null)}
                    className={`
                      text-sm font-medium transition-colors
                      ${isSelected
                        ? 'text-dark-900'
                        : isHovered
                        ? 'text-dark-700'
                        : 'text-dark-600'
                      }
                    `}
                    style={{ cursor: 'pointer' }}
                  >
                    {size.node.name}
                  </button>
                </div>

                {/* Visual representation */}
                <div
                  onClick={() => handleSizeClick(size)}
                  onMouseEnter={() => setHoveredSize(size)}
                  onMouseLeave={() => setHoveredSize(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {size.category === "spacing" ? (
                    // Spacing bar
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                          transition-all duration-200
                          ${isSelected
                            ? 'bg-dark-900'
                            : isHovered
                            ? 'bg-dark-700'
                            : 'bg-dark-400'
                          }
                        `}
                        style={{
                          width: typeof size.value === 'number' ? `${size.value}px` : size.value,
                          height: '40px',
                        }}
                      />
                      <span className="text-sm text-dark-500 font-mono">
                        {size.value}{typeof size.value === 'number' ? 'px' : ''}
                      </span>
                    </div>
                  ) : (
                    // Border radius square
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                          transition-all duration-200
                          ${isSelected
                            ? 'bg-dark-900'
                            : isHovered
                            ? 'bg-dark-700'
                            : 'bg-dark-400'
                          }
                        `}
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: typeof size.value === 'number' ? `${size.value}px` : size.value,
                        }}
                      />
                      <span className="text-sm text-dark-500 font-mono">
                        {size.value}{typeof size.value === 'number' ? 'px' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected size detail panel */}
      {selectedSize && (
        <div className="fixed top-4 right-4 w-96 bg-white border border-dark-300 rounded-xl shadow-2xl pointer-events-auto overflow-hidden animate-fade-in z-50">
          {/* Header */}
          <div className="p-4 border-b border-dark-200">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-dark-900 truncate mb-1">
                  {selectedSize.node.name}
                </h3>
                <span className="inline-block px-2 py-1 text-xs rounded-md bg-dark-100 text-dark-600 font-medium capitalize">
                  {selectedSize.category}
                </span>
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  setSelectedSize(null);
                  onSelectNode?.(null as any);
                }}
                className="shrink-0 p-1 hover:bg-dark-100 rounded transition-colors ml-2"
              >
                <XIcon className="w-5 h-5 text-dark-400" />
              </button>
            </div>
          </div>

          {/* Value display */}
          <div className="p-4 border-b border-dark-200">
            <h4 className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-3">
              Value
            </h4>
            <div className="text-2xl font-mono font-semibold text-dark-900">
              {selectedSize.value}{typeof selectedSize.value === 'number' ? 'px' : ''}
            </div>
          </div>

          {/* Visual preview */}
          <div className="p-4">
            <h4 className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-3">
              Preview
            </h4>
            <div className="flex items-center justify-center p-6 bg-dark-50 rounded-lg">
              {selectedSize.category === "spacing" ? (
                <div
                  className="bg-dark-900"
                  style={{
                    width: typeof selectedSize.value === 'number' ? `${selectedSize.value}px` : selectedSize.value,
                    height: '60px',
                    maxWidth: '100%',
                  }}
                />
              ) : (
                <div
                  className="bg-dark-900"
                  style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: typeof selectedSize.value === 'number' ? `${selectedSize.value}px` : selectedSize.value,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Keep SpacingView as an alias for backwards compatibility
export const SpacingView = SizesView;
