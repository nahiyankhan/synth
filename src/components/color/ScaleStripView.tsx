/**
 * ScaleStripView - Horizontal gradient strips showing all color palettes
 *
 * Displays each palette (primary, secondary, gray, status colors) as
 * horizontal strips with their step progression visible.
 */

import React, { useState, useMemo } from "react";
import { StyleGraph } from "../../core/StyleGraph";
import { StyleNode } from "../../types/styleGraph";
import { useColorGrouping, ColorItem, PaletteGroup } from "./useColorGrouping";
import { getAccessibleTextColor } from "../../services/colorScience";
import { FilterBanner } from "../ui/filter-banner";
import { OKLCHDisplay } from "./shared/OKLCHDisplay";
import { ColorDetailPanel } from "./shared/ColorDetailPanel";

interface ScaleStripViewProps {
  graph: StyleGraph;
  viewMode: "light" | "dark";
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
}

interface TooltipState {
  color: ColorItem;
  x: number;
  y: number;
}

// Step purpose labels for the 12-step Radix-style scale
const STEP_PURPOSES: Record<number, string> = {
  50: "App background",
  100: "Subtle background",
  200: "UI element background",
  300: "Hovered element",
  400: "Active element",
  500: "Subtle border",
  600: "Default border",
  700: "Hovered border",
  800: "Solid background",
  900: "Hovered solid",
  950: "Low contrast text",
};

// Format OKLCH values for display
const formatOKLCH = (color: ColorItem): string => {
  const { l, c, h } = color.oklch;
  return `L: ${(l * 100).toFixed(1)}%  C: ${c.toFixed(3)}  H: ${h.toFixed(1)}°`;
};

export const ScaleStripView: React.FC<ScaleStripViewProps> = ({
  graph,
  viewMode,
  filteredNodes,
  onClearFilter,
}) => {
  const groups = useColorGrouping(graph, viewMode, filteredNodes);
  const [hoveredColor, setHoveredColor] = useState<TooltipState | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Filter to only show groups with primitives (actual palette colors)
  const paletteGroups = useMemo(
    () => groups.filter((g) => g.primitives.length > 0),
    [groups]
  );

  const toggleExpanded = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleColorHover = (
    color: ColorItem,
    event: React.MouseEvent
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredColor({
      color,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  return (
    <div className="h-full overflow-auto bg-white p-8">
      {/* Filter banner */}
      {filteredNodes && (
        <FilterBanner
          count={filteredNodes.length}
          message="Showing {count} filtered colors"
          onClear={onClearFilter}
        />
      )}

      {/* Palette strips */}
      <div className="space-y-8">
        {paletteGroups.map((group) => (
          <PaletteStrip
            key={group.id}
            group={group}
            isExpanded={expandedGroups.has(group.id)}
            onToggleExpand={() => toggleExpanded(group.id)}
            onColorHover={handleColorHover}
            onColorLeave={() => setHoveredColor(null)}
            onColorSelect={setSelectedColor}
            selectedColor={selectedColor}
          />
        ))}
      </div>

      {/* Empty state */}
      {paletteGroups.length === 0 && (
        <div className="flex items-center justify-center h-64 text-dark-400">
          No color palettes found
        </div>
      )}

      {/* Tooltip */}
      {hoveredColor && (
        <ColorTooltip
          color={hoveredColor.color}
          x={hoveredColor.x}
          y={hoveredColor.y}
        />
      )}

      {/* Detail panel */}
      {selectedColor && (
        <ScaleColorDetailPanel
          color={selectedColor}
          onClose={() => setSelectedColor(null)}
        />
      )}
    </div>
  );
};

// Individual palette strip component
interface PaletteStripProps {
  group: PaletteGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onColorHover: (color: ColorItem, event: React.MouseEvent) => void;
  onColorLeave: () => void;
  onColorSelect: (color: ColorItem) => void;
  selectedColor: ColorItem | null;
}

const PaletteStrip: React.FC<PaletteStripProps> = ({
  group,
  isExpanded,
  onToggleExpand,
  onColorHover,
  onColorLeave,
  onColorSelect,
  selectedColor,
}) => {
  // Sort primitives by step (if available) or lightness
  const sortedColors = useMemo(() => {
    return [...group.primitives].sort((a, b) => {
      if (a.step !== undefined && b.step !== undefined) {
        return a.step - b.step;
      }
      return b.oklch.l - a.oklch.l; // Lightest first if no step
    });
  }, [group.primitives]);

  return (
    <div className="group">
      {/* Header */}
      <button
        onClick={onToggleExpand}
        className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity"
      >
        <h3 className="text-lg font-semibold text-dark-900 capitalize">
          {group.displayName}
        </h3>
        <span className="text-sm text-dark-400">
          {sortedColors.length} colors
        </span>
        <svg
          className={`w-4 h-4 text-dark-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Color strip */}
      <div className="flex gap-0.5 rounded-lg overflow-hidden shadow-sm">
        {sortedColors.map((color, index) => {
          const isSelected = selectedColor?.node.id === color.node.id;
          return (
            <div
              key={color.node.id}
              className={`relative flex-1 min-w-[48px] h-16 cursor-pointer transition-all duration-150 ${
                isSelected
                  ? "ring-2 ring-blue-500 ring-offset-2 z-10 scale-105"
                  : "hover:scale-105 hover:z-10"
              }`}
              style={{ backgroundColor: color.resolvedColor }}
              onMouseEnter={(e) => onColorHover(color, e)}
              onMouseLeave={onColorLeave}
              onClick={() => onColorSelect(color)}
            >
              {/* Step label (shown when expanded) */}
              {isExpanded && color.step !== undefined && (
                <div
                  className="absolute inset-0 flex items-center justify-center text-xs font-medium"
                  style={{ color: getAccessibleTextColor(color.resolvedColor) }}
                >
                  {color.step}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded details: step labels below */}
      {isExpanded && (
        <div className="flex gap-0.5 mt-1">
          {sortedColors.map((color) => (
            <div
              key={`label-${color.node.id}`}
              className="flex-1 min-w-[48px] text-center"
            >
              <span className="text-[10px] text-dark-400 truncate block">
                {color.step !== undefined
                  ? STEP_PURPOSES[color.step] || `Step ${color.step}`
                  : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Semantic mappings count */}
      {group.semanticMappings.length > 0 && (
        <div className="mt-2 text-xs text-dark-400">
          {group.semanticMappings.length} semantic tokens use this palette
        </div>
      )}
    </div>
  );
};

// Tooltip component
interface ColorTooltipProps {
  color: ColorItem;
  x: number;
  y: number;
}

const ColorTooltip: React.FC<ColorTooltipProps> = ({ color, x, y }) => {
  return (
    <div
      className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
      style={{ left: x, top: y - 8 }}
    >
      <div className="bg-dark-900 text-white px-3 py-2 rounded-lg shadow-lg text-xs space-y-1">
        <div className="font-medium">{color.node.name}</div>
        <div className="font-mono text-dark-300">{color.resolvedColor}</div>
        <div className="text-dark-400">{formatOKLCH(color)}</div>
        {color.step !== undefined && (
          <div className="text-dark-400">
            Step {color.step}: {STEP_PURPOSES[color.step] || "Custom"}
          </div>
        )}
      </div>
      {/* Arrow */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full">
        <div className="border-8 border-transparent border-t-dark-900" />
      </div>
    </div>
  );
};

// Detail panel component using shared ColorDetailPanel
interface ScaleColorDetailPanelProps {
  color: ColorItem;
  onClose: () => void;
}

const ScaleColorDetailPanel: React.FC<ScaleColorDetailPanelProps> = ({
  color,
  onClose,
}) => {
  return (
    <ColorDetailPanel
      color={color.resolvedColor}
      title={color.node.name}
      subtitle={color.resolvedColor}
      onClose={onClose}
      previewHeight={96}
      variant="light"
    >
      {/* OKLCH values */}
      <OKLCHDisplay oklch={color.oklch} showFullLabels />

      {/* Step info */}
      {color.step !== undefined && (
        <div className="bg-blue-50 rounded-lg p-2">
          <div className="text-sm font-medium text-blue-900">
            Step {color.step}
          </div>
          <div className="text-xs text-blue-600">
            {STEP_PURPOSES[color.step] || "Custom purpose"}
          </div>
        </div>
      )}

      {/* Contrast preview */}
      <div className="space-y-1">
        <div className="text-xs text-dark-400 font-medium">
          Contrast preview
        </div>
        <div
          className="rounded-lg p-3 text-sm"
          style={{
            backgroundColor: color.resolvedColor,
            color: getAccessibleTextColor(color.resolvedColor),
          }}
        >
          Sample text on this color
        </div>
      </div>
    </ColorDetailPanel>
  );
};
