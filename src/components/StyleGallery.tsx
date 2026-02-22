/**
 * StyleGallery - Design Token Display Component
 *
 * Beautiful presentation of design tokens organized by category.
 * Pure presentational component - receives data and callbacks from parent.
 */

import React, { useMemo } from "react";
import { StyleGraph } from "../core/StyleGraph";
import { StyleNode, StyleMode } from "../types/styleGraph";
import { TypographyView } from "./TypographyView";
import { SizesView } from "./SpacingView";

interface StyleGalleryProps {
  graph: StyleGraph;
  viewMode: StyleMode;
  onSelectNode?: (node: StyleNode) => void;
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
  languageName?: string;
  languageDescription?: string;
}

export const StyleGallery: React.FC<StyleGalleryProps> = ({
  graph,
  viewMode,
  onSelectNode,
  filteredNodes,
  onClearFilter,
  languageName = "untitled design language",
  languageDescription,
}) => {

  // Helper function to get display name
  const getDisplayName = (node: StyleNode) => {
    // Simply return the node name
    return node.name;
  };

  // Helper function to calculate relative luminance and determine text color
  const getContrastTextColor = (hexColor: string): string => {
    // Remove # if present
    const hex = hexColor.replace("#", "");

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Calculate relative luminance using sRGB color space
    const luminance = (channel: number) => {
      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    };

    const L =
      0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b);

    // Return dark gray for light backgrounds, light gray for dark backgrounds
    // Threshold of 0.5 works well for most cases
    return L > 0.5 ? "#1A1A1A" : "#E7E5E4";
  };

  // Get all core tokens (exclude specs) - memoized
  // Use filteredNodes if provided (from voice search), otherwise get all
  const nodes = useMemo(
    () => filteredNodes || graph.getNodes({ excludeSpecs: true }),
    [graph, filteredNodes]
  );

  // Group by type - memoized to avoid re-filtering on every render
  const {
    typographyNodes,
    sizeNodes,
    primitiveColors,
    utilityColors,
  } = useMemo(() => {
    // No need to filter by mode - all nodes are shown
    // The mode toggle just changes which value is resolved (light vs dark)
    const filterByMode = (node: StyleNode) => {
      return true; // Show all nodes, resolveNode handles mode
    };

    const colors = nodes
      .filter((n) => n.type === "color" && filterByMode(n))
      .sort((a, b) => a.name.localeCompare(b.name));
    const typography = nodes
      .filter((n) => n.type === "typography" && filterByMode(n))
      .sort((a, b) => a.name.localeCompare(b.name));
    const sizes = nodes
      .filter((n) => n.type === "size" && filterByMode(n))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      typographyNodes: typography,
      sizeNodes: sizes,
      primitiveColors: colors.filter((n) => n.layer === "primitive"),
      utilityColors: colors.filter((n) => n.layer === "utility"),
    };
  }, [nodes, viewMode]);

  return (
    <div className="w-full bg-white relative">
      <div className="w-full mx-auto">

        {/* Filter Banner */}
        {filteredNodes && (
          <div className="w-full px-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-900">
                  Showing {nodes.length} filtered result
                  {nodes.length !== 1 ? "s" : ""}
                </span>
              </div>
              {onClearFilter && (
                <button
                  onClick={onClearFilter}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium underline transition-colors"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Color Section */}
        <div className="w-full px-4 relative">
          <section className="mb-32 w-full py-12 mx-auto">
            <div className="mb-4">
              <h2 className="text-6xl font-light text-dark-900 mb-2 tracking-tight">
                colors
              </h2>
            </div>

            <div>
                {/* Primitive Colors */}
                <div className="mb-20">
                  <h3 className="text-2xl font-light text-dark-900 mb-8 tracking-tight">
                    primitives
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 ">
                    {primitiveColors.map((node) => {
                      const resolved = graph.resolveNode(node.id, viewMode);
                      if (
                        !resolved ||
                        typeof resolved !== "string" ||
                        !resolved.startsWith("#")
                      )
                        return null;

                      const textColor = getContrastTextColor(resolved);

                      return (
                        <button
                          key={node.id}
                          onClick={() => onSelectNode?.(node)}
                          className="text-left group bg-white transition-all"
                        >
                          <div
                            className="w-full h-40 p-4 flex flex-col justify-end"
                            style={{ backgroundColor: resolved }}
                          >
                            <div
                              className="text-2xl font-light mr-2"
                              style={{ color: textColor }}
                            >
                              {resolved}
                            </div>
                            <div
                              className="text-xs truncate"
                              style={{ color: textColor }}
                            >
                              {getDisplayName(node)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Utilities */}
                <div className="mb-20">
                  <h3 className="text-3xl font-light text-dark-900 mb-8 tracking-tight">
                    utilities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {utilityColors.map((node) => {
                      const resolved = graph.resolveNode(node.id, viewMode);
                      if (
                        !resolved ||
                        typeof resolved !== "string" ||
                        !resolved.startsWith("#")
                      )
                        return null;

                      const textColor = getContrastTextColor(resolved);

                      return (
                        <button
                          key={node.id}
                          onClick={() => onSelectNode?.(node)}
                          className="text-left group bg-white transition-all"
                        >
                          <div
                            className="w-full h-40 p-4 flex flex-col justify-end"
                            style={{ backgroundColor: resolved }}
                          >
                            <div
                              className="text-2xl font-light mr-2"
                              style={{ color: textColor }}
                            >
                              {resolved}
                            </div>
                            <div
                              className="text-xs truncate"
                              style={{ color: textColor }}
                            >
                              {getDisplayName(node)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
          </section>
        </div>

        {/* Typography Section */}
        <TypographyView
          graph={graph}
          viewMode={viewMode}
          onSelectNode={onSelectNode}
          filteredNodes={filteredNodes}
          onClearFilter={onClearFilter}
          typographyNodes={typographyNodes}
        />

        {/* Spacing Section */}
        <SizesView
          graph={graph}
          viewMode={viewMode}
          onSelectNode={onSelectNode}
          sizeNodes={sizeNodes}
        />

        {/* Footer */}
        <div className="border-t border-dark-200 pt-12 mt-20 text-center text-sm text-dark-400 max-w-7xl mx-auto">
          <p className="font-light tracking-wide">
            {languageName} · {nodes.length} tokens
          </p>
        </div>
      </div>
    </div>
  );
};
