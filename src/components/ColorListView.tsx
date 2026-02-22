/**
 * ColorListView - List-based color display with groups (no accordion)
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import { useColorGrouping } from "./color/useColorGrouping";
import { ColorListItem, ColorSwatch } from "./color/ColorListItem";
import { OKLCHColor } from "@/services/colorScience";

interface ColorListViewProps {
  graph: StyleGraph;
  viewMode: "light" | "dark";
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
}

export const ColorListView: React.FC<ColorListViewProps> = ({
  graph,
  viewMode,
  filteredNodes,
  onClearFilter,
}) => {
  // Group colors by palette
  const paletteGroups = useColorGrouping(graph, viewMode, filteredNodes);

  // Get all color IDs for keyboard shortcuts
  const allColorIds = useMemo(() => {
    const ids: string[] = [];
    for (const group of paletteGroups) {
      for (const primitive of group.primitives) {
        ids.push(primitive.node.id);
      }
      for (const semantic of group.semanticMappings) {
        ids.push(semantic.node.id);
      }
    }
    return ids;
  }, [paletteGroups]);

  // Selection state
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [hoveredColorId, setHoveredColorId] = useState<string | null>(null);

  // Handle color selection
  const handleSelectColor = useCallback((nodeId: string, e: React.MouseEvent) => {
    const isMultiSelect = e.metaKey || e.ctrlKey;

    setSelectedColors((prev) => {
      const newSet = new Set(prev);

      if (isMultiSelect) {
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId);
        } else {
          newSet.add(nodeId);
        }
      } else {
        newSet.clear();
        newSet.add(nodeId);
      }

      return newSet;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedColors(new Set());
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        setSelectedColors(new Set(allColorIds));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allColorIds]);

  // Get selected color details for panel
  const selectedColorDetails = useMemo(() => {
    if (selectedColors.size === 0) return null;

    const colors: Array<{
      id: string;
      name: string;
      color: string;
      oklch: OKLCHColor;
    }> = [];

    for (const group of paletteGroups) {
      for (const primitive of group.primitives) {
        if (selectedColors.has(primitive.node.id)) {
          colors.push({
            id: primitive.node.id,
            name: primitive.node.name,
            color: primitive.resolvedColor,
            oklch: primitive.oklch,
          });
        }
      }
      for (const semantic of group.semanticMappings) {
        if (selectedColors.has(semantic.node.id)) {
          colors.push({
            id: semantic.node.id,
            name: semantic.node.name,
            color: semantic.resolvedColor,
            oklch: semantic.oklch,
          });
        }
      }
    }

    return colors;
  }, [selectedColors, paletteGroups]);

  return (
    <div className="relative w-full h-full bg-white px-12 pt-4 pb-8 flex flex-col">
      {/* Filter banner */}
      {filteredNodes && (
        <div className="mb-6 bg-white border border-dark-200 rounded-lg shadow-sm shrink-0">
          <div className="flex items-center justify-between py-2.5 px-6">
            <div className="flex items-center gap-3">
              <svg
                className="w-4 h-4 text-dark-500"
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-dark-700">
                  Filtered:
                </span>
                <span className="text-sm text-dark-600">
                  {filteredNodes.length} color{filteredNodes.length !== 1 ? "s" : ""} found
                </span>
              </div>
            </div>
            {onClearFilter && (
              <button
                onClick={onClearFilter}
                className="px-3 py-1.5 text-xs font-medium text-dark-600 hover:text-dark-900 hover:bg-dark-100 rounded-md transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bordered container */}
      <div className="flex-1 min-h-0 border border-dark-200 rounded-2xl overflow-y-auto bg-white">
        {/* Color groups */}
        <div className="p-6 space-y-8">
          {paletteGroups.map((group) => (
            <div key={group.id}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="font-semibold text-dark-900">{group.displayName}</span>
                <span className="text-xs text-dark-400 bg-dark-100 px-2 py-0.5 rounded-full">
                  {group.primitives.length + group.semanticMappings.length}
                </span>
              </div>

              <div className="space-y-4 pl-2">
                {/* Primitive swatches */}
                {group.primitives.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2">
                      Scale
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.primitives.map((color) => (
                        <ColorSwatch
                          key={color.node.id}
                          color={color.resolvedColor}
                          oklch={color.oklch}
                          step={color.step}
                          isSelected={selectedColors.has(color.node.id)}
                          isHovered={hoveredColorId === color.node.id}
                          onClick={(e) => handleSelectColor(color.node.id, e)}
                          onMouseEnter={() => setHoveredColorId(color.node.id)}
                          onMouseLeave={() => setHoveredColorId(null)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Semantic mappings */}
                {group.semanticMappings.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-dark-400 uppercase tracking-wider mb-2">
                      Semantic Tokens
                    </div>
                    <div className="space-y-1">
                      {group.semanticMappings.map((semantic) => (
                        <ColorListItem
                          key={semantic.node.id}
                          name={semantic.node.name}
                          color={semantic.resolvedColor}
                          oklch={semantic.oklch}
                          isSelected={selectedColors.has(semantic.node.id)}
                          isHovered={hoveredColorId === semantic.node.id}
                          onClick={(e) => handleSelectColor(semantic.node.id, e)}
                          onMouseEnter={() => setHoveredColorId(semantic.node.id)}
                          onMouseLeave={() => setHoveredColorId(null)}
                          reference={semantic.referencedPrimitive?.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {paletteGroups.length === 0 && (
            <div className="text-center py-12 text-dark-400">
              No colors found
            </div>
          )}
        </div>
      </div>

      {/* Selection panel */}
      {selectedColorDetails && selectedColorDetails.length > 0 && (
        <SelectionPanel
          colors={selectedColorDetails}
          onClear={() => setSelectedColors(new Set())}
          onRemove={(id) => {
            setSelectedColors((prev) => {
              const newSet = new Set(prev);
              newSet.delete(id);
              return newSet;
            });
          }}
        />
      )}
    </div>
  );
};

// Simple selection panel for list view
interface SelectionPanelProps {
  colors: Array<{
    id: string;
    name: string;
    color: string;
    oklch: OKLCHColor;
  }>;
  onClear: () => void;
  onRemove: (id: string) => void;
}

const SelectionPanel: React.FC<SelectionPanelProps> = ({ colors, onClear, onRemove }) => {
  const isSingleSelection = colors.length === 1;

  if (isSingleSelection) {
    const color = colors[0];
    return (
      <div className="absolute bottom-4 right-4 w-80 bg-white rounded-xl shadow-xl border border-dark-200 p-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <div
            className="w-16 h-16 rounded-lg shrink-0 shadow-inner"
            style={{ backgroundColor: color.color }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-dark-900 truncate">{color.name}</h3>
            <code className="text-sm font-mono text-dark-500 block mt-1">
              {color.color.toUpperCase()}
            </code>
            <div className="text-xs text-dark-400 mt-2 space-y-0.5">
              <div>L: {(color.oklch.l * 100).toFixed(1)}%</div>
              <div>C: {color.oklch.c.toFixed(3)}</div>
              <div>H: {Math.round(color.oklch.h)}°</div>
            </div>
          </div>
          <button
            onClick={onClear}
            className="text-dark-400 hover:text-dark-900 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Multi-selection view
  return (
    <div className="absolute bottom-4 right-4 w-96 bg-white rounded-xl shadow-xl border border-dark-200 p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-dark-900">{colors.length} colors selected</h3>
        <button
          onClick={onClear}
          className="text-sm text-dark-400 hover:text-dark-900 transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
        {colors.map((color) => (
          <div
            key={color.id}
            className="group relative"
          >
            <div
              className="w-10 h-10 rounded-lg shadow-sm"
              style={{ backgroundColor: color.color }}
              title={color.name}
            />
            <button
              onClick={() => onRemove(color.id)}
              className="absolute -top-1 -right-1 w-4 h-4 bg-dark-900 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
