/**
 * TypographyView - Canvas-based typography display
 *
 * Displays typography tokens with interactive canvas layout.
 */

import React, { useMemo, useState } from "react";
import { StyleGraph } from "../core/StyleGraph";
import { StyleNode, StyleMode } from "../types/styleGraph";
import { XIcon } from "./icons";

interface TypographyViewProps {
  graph: StyleGraph;
  viewMode: StyleMode;
  onSelectNode?: (node: StyleNode) => void;
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
  typographyNodes: StyleNode[];
}

interface PositionedTypography {
  name: string;
  nodes: StyleNode[];
  category: "display" | "body" | "detail" | "component";
  x: number;
  y: number;
  size: number | null;
  lineHeight: number | null;
  weight: number | null;
  letterSpacing: number | null;
}

// Helper to categorize utility tokens
const categorizeUtility = (
  name: string
): "display" | "body" | "detail" | "component" => {
  const displayTokens = [
    "hero",
    "headline",
    "page-title",
    "section-title",
    "tab-title",
    "title-bar-page-title",
  ];
  const bodyTokens = ["body", "cell-body"];
  const detailTokens = ["label", "disclaimer", "large-label"];

  if (displayTokens.some((token) => name.startsWith(token))) return "display";
  if (bodyTokens.some((token) => name.startsWith(token))) return "body";
  if (detailTokens.some((token) => name.startsWith(token))) return "detail";
  return "component";
};

export const TypographyView: React.FC<TypographyViewProps> = ({
  graph,
  viewMode,
  onSelectNode,
  typographyNodes,
}) => {
  const [hoveredType, setHoveredType] = useState<PositionedTypography | null>(
    null
  );
  const [selectedType, setSelectedType] = useState<PositionedTypography | null>(
    null
  );

  // Group and position typography
  const positionedTypes = useMemo<PositionedTypography[]>(() => {
    const utilities = typographyNodes.filter((n) => n.layer === "utility");

    // Check if we have composite nodes (new format) or separate property nodes (old format)
    const hasCompositeNodes = utilities.some((node) => {
      const resolved = graph.resolveNode(node.id, viewMode);
      if (!resolved || typeof resolved !== "string") return false;
      try {
        const parsed = JSON.parse(resolved);
        return parsed.fontSize !== undefined;
      } catch {
        return false;
      }
    });

    const positioned: PositionedTypography[] = [];
    let currentY = 100;
    const VERTICAL_GAP = 120; // Minimum vertical gap

    if (hasCompositeNodes) {
      // NEW FORMAT: Composite nodes with all properties in JSON
      utilities
        .sort((a, b) => {
          const nameA = a.name.split(".").pop() || "";
          const nameB = b.name.split(".").pop() || "";
          const catA = categorizeUtility(nameA);
          const catB = categorizeUtility(nameB);
          if (catA !== catB) {
            const order = ["display", "body", "detail", "component"];
            return order.indexOf(catA) - order.indexOf(catB);
          }
          return nameA.localeCompare(nameB);
        })
        .forEach((node) => {
          // Get the resolved value (composite JSON string)
          const resolved = graph.resolveNode(node.id, viewMode);

          if (!resolved || typeof resolved !== "string") return;

          try {
            // Parse the composite typography value
            const typographyValue = JSON.parse(resolved);

            // Extract individual properties
            const fontSize = typographyValue.fontSize;
            const lineHeight = typographyValue.lineHeight;
            const fontWeight = typographyValue.fontWeight;
            const letterSpacing = typographyValue.letterSpacing;

            // Parse numeric values
            const sizeValue =
              typeof fontSize === "string"
                ? parseFloat(fontSize)
                : typeof fontSize === "number"
                ? fontSize
                : null;
            const lineHeightValue =
              typeof lineHeight === "string"
                ? parseFloat(lineHeight)
                : typeof lineHeight === "number"
                ? lineHeight
                : null;
            const weightValue =
              typeof fontWeight === "string"
                ? parseInt(fontWeight)
                : typeof fontWeight === "number"
                ? fontWeight
                : null;
            const letterSpacingValue =
              typeof letterSpacing === "string"
                ? parseFloat(letterSpacing)
                : typeof letterSpacing === "number"
                ? letterSpacing
                : null;

            if (sizeValue) {
              const name = node.name.split(".").pop() || node.name;

              positioned.push({
                name,
                nodes: [node],
                category: categorizeUtility(name),
                x: 100,
                y: currentY,
                size: sizeValue,
                lineHeight: lineHeightValue,
                weight: weightValue,
                letterSpacing: letterSpacingValue,
              });

              // Calculate dynamic spacing to prevent overlaps
              const actualHeight =
                lineHeightValue || (sizeValue ? sizeValue * 1.5 : 40);
              const verticalGap = actualHeight + 160;

              currentY += Math.max(verticalGap, VERTICAL_GAP);
            }
          } catch (error) {
            console.warn(
              "Failed to parse typography value for",
              node.name,
              error
            );
          }
        });
    } else {
      // OLD FORMAT: Separate nodes for each property (.size, .line-height, etc.)
      const grouped: { [key: string]: StyleNode[] } = {};

      utilities.forEach((node) => {
        const baseName = node.name.split(".")[0];
        if (!grouped[baseName]) {
          grouped[baseName] = [];
        }
        grouped[baseName].push(node);
      });

      Object.entries(grouped)
        .sort(([a], [b]) => {
          const catA = categorizeUtility(a);
          const catB = categorizeUtility(b);
          if (catA !== catB) {
            const order = ["display", "body", "detail", "component"];
            return order.indexOf(catA) - order.indexOf(catB);
          }
          return a.localeCompare(b);
        })
        .forEach(([name, nodes]) => {
          const sizeNode = nodes.find((n) => n.name.endsWith(".size"));
          const lineHeightNode = nodes.find((n) =>
            n.name.endsWith(".line-height")
          );
          const weightNode = nodes.find((n) => n.name.endsWith(".weight"));
          const letterSpacingNode = nodes.find((n) =>
            n.name.endsWith(".letter-spacing")
          );

          const size = sizeNode
            ? graph.resolveNode(sizeNode.id, viewMode)
            : null;
          const lineHeight = lineHeightNode
            ? graph.resolveNode(lineHeightNode.id, viewMode)
            : null;
          const weight = weightNode
            ? graph.resolveNode(weightNode.id, viewMode)
            : null;
          const letterSpacing = letterSpacingNode
            ? graph.resolveNode(letterSpacingNode.id, viewMode)
            : null;

          if (size) {
            const sizeValue = typeof size === "number" ? size : null;
            const lineHeightValue =
              typeof lineHeight === "number" ? lineHeight : null;

            positioned.push({
              name,
              nodes,
              category: categorizeUtility(name),
              x: 100,
              y: currentY,
              size: sizeValue,
              lineHeight: lineHeightValue,
              weight: typeof weight === "number" ? weight : null,
              letterSpacing:
                typeof letterSpacing === "number" ? letterSpacing : null,
            });

            // Calculate dynamic spacing to prevent overlaps
            const actualHeight =
              lineHeightValue || (sizeValue ? sizeValue * 1.5 : 40);
            const verticalGap = actualHeight + 160;

            currentY += Math.max(verticalGap, VERTICAL_GAP);
          }
        });
    }

    return positioned;
  }, [typographyNodes, graph, viewMode]);

  const handleTypeClick = (type: PositionedTypography) => {
    setSelectedType(type);
    const sizeNode = type.nodes.find((n) => n.name.endsWith(".size"));
    if (sizeNode) {
      onSelectNode?.(sizeNode);
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <>
      {/* Scrollable canvas container */}
      {/* Canvas */}
      <div className="relative w-full h-full p-12">
        {/* Typography items */}
        {positionedTypes.map((type, index) => {
          const isHovered = hoveredType?.name === type.name;
          const isSelected = selectedType?.name === type.name;

          return (
            <div
              key={type.name}
              className="transition-all duration-200 opacity-0 animate-stagger-fade-in mb-16"
              style={{
                animationDelay: `${index * 60}ms`,
                cursor: "pointer",
                pointerEvents: "auto",
                zIndex: isSelected ? 20 : isHovered ? 10 : 1,
              }}
              onMouseEnter={() => setHoveredType(type)}
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => handleTypeClick(type)}
            >
              {/* Typography sample with baseline */}
              <div className="mb-4">
                <div
                  className="text-dark-900 inline-block transition-colors"
                  style={{
                    fontSize: type.size ? `${type.size}px` : undefined,
                    lineHeight: type.lineHeight
                      ? `${type.lineHeight}px`
                      : undefined,
                    fontWeight: type.weight || undefined,
                    letterSpacing: type.letterSpacing
                      ? `${type.letterSpacing}px`
                      : undefined,
                    borderColor: isSelected
                      ? "rgb(120, 113, 108)"
                      : isHovered
                      ? "rgb(168, 162, 158)"
                      : "rgb(214, 211, 209)",
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </div>
              </div>

              {/* Specs */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <span className="font-semibold text-dark-700">{type.name}</span>
                {type.size && (
                  <span className="text-dark-500">size: {type.size}px</span>
                )}
                {type.lineHeight && (
                  <span className="text-dark-500">
                    line-height: {type.lineHeight}px
                  </span>
                )}
                {type.weight && (
                  <span className="text-dark-500">weight: {type.weight}</span>
                )}
                {type.letterSpacing !== null && (
                  <span className="text-dark-500">
                    tracking: {type.letterSpacing}px
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Type Panel */}
      {selectedType && (
        <div className="fixed top-4 right-4 w-96 bg-white border border-dark-300 rounded-xl shadow-2xl pointer-events-auto overflow-hidden animate-fade-in z-50">
          {/* Header */}
          <div className="p-4 border-b border-dark-200">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-dark-900 truncate mb-1">
                  {selectedType.name}
                </h3>
                <span className="inline-block px-2 py-1 text-xs rounded-md bg-dark-100 text-dark-600 font-medium capitalize">
                  {getCategoryLabel(selectedType.category)}
                </span>
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  setSelectedType(null);
                  onSelectNode?.(null as any);
                }}
                className="shrink-0 p-1 hover:bg-dark-100 rounded transition-colors ml-2"
              >
                <XIcon className="w-5 h-5 text-dark-400" />
              </button>
            </div>
          </div>

          {/* Typography specs */}
          <div className="p-4">
            <div className="space-y-3 text-sm">
              {selectedType.size && (
                <div className="flex justify-between items-center">
                  <span className="text-dark-500">Font Size</span>
                  <span className="font-mono text-dark-800 font-medium">
                    {selectedType.size}px
                  </span>
                </div>
              )}
              {selectedType.lineHeight && (
                <div className="flex justify-between items-center">
                  <span className="text-dark-500">Line Height</span>
                  <span className="font-mono text-dark-800 font-medium">
                    {selectedType.lineHeight}px
                  </span>
                </div>
              )}
              {selectedType.weight && (
                <div className="flex justify-between items-center">
                  <span className="text-dark-500">Font Weight</span>
                  <span className="font-mono text-dark-800 font-medium">
                    {selectedType.weight}
                  </span>
                </div>
              )}
              {selectedType.letterSpacing !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-dark-500">Letter Spacing</span>
                  <span className="font-mono text-dark-800 font-medium">
                    {selectedType.letterSpacing}px
                  </span>
                </div>
              )}
            </div>

            {/* Sample text preview */}
            <div className="mt-6 p-4 bg-dark-50 rounded-lg">
              <div
                className="text-dark-900"
                style={{
                  fontSize: selectedType.size
                    ? `${selectedType.size}px`
                    : undefined,
                  lineHeight: selectedType.lineHeight
                    ? `${selectedType.lineHeight}px`
                    : undefined,
                  fontWeight: selectedType.weight || undefined,
                  letterSpacing: selectedType.letterSpacing
                    ? `${selectedType.letterSpacing}px`
                    : undefined,
                }}
              >
                The quick brown fox jumps over the lazy dog
              </div>
            </div>

            {/* Intent metadata (collapsible) */}
            {selectedType.nodes[0]?.intent && (
              <details className="mt-4 pt-4 border-t border-dark-200">
                <summary className="text-xs font-semibold text-dark-500 uppercase tracking-wide cursor-pointer hover:text-dark-700">
                  Intent
                </summary>
                <div className="mt-3 text-sm text-dark-600 space-y-2">
                  {selectedType.nodes[0].intent.purpose && (
                    <div>{selectedType.nodes[0].intent.purpose}</div>
                  )}

                  {selectedType.nodes[0].intent.designedFor &&
                    selectedType.nodes[0].intent.designedFor.length > 0 && (
                      <div>
                        <span className="font-medium">Designed for:</span>{" "}
                        {selectedType.nodes[0].intent.designedFor.join(", ")}
                      </div>
                    )}

                  {selectedType.nodes[0].intent.qualities &&
                    selectedType.nodes[0].intent.qualities.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {selectedType.nodes[0].intent.qualities.map((q) => (
                          <span
                            key={q}
                            className="px-2 py-0.5 bg-dark-100 rounded text-xs"
                          >
                            {q}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </details>
            )}

            {/* Layer info (computed) */}
            <div className="mt-4 text-xs text-dark-500">
              Layer: {selectedType.nodes[0]?.layer} (computed)
            </div>
          </div>
        </div>
      )}
    </>
  );
};
