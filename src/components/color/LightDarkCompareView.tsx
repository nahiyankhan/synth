/**
 * LightDarkCompareView - Side-by-side light/dark mode comparison
 *
 * Shows semantic tokens side-by-side to compare their light and dark
 * mode values, with connecting lines and highlighting for differences.
 */

import React, { useState, useMemo } from "react";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import { hexToOKLCH, OKLCHColor, getAccessibleTextColor } from "@/services/colorScience";
import { shortenTokenName } from "./utils/token-name-utils";
import { FilterBanner } from "@/components/ui/filter-banner";

interface LightDarkCompareViewProps {
  graph: StyleGraph;
  viewMode: "light" | "dark"; // Current active mode (for highlighting)
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
}

interface ColorPair {
  node: StyleNode;
  light: string;
  dark: string;
  lightOKLCH: OKLCHColor | null;
  darkOKLCH: OKLCHColor | null;
  isDifferent: boolean;
  category: string;
}

// Categorize colors by their name patterns
function categorizeColor(name: string): string {
  const nameLower = name.toLowerCase();
  if (nameLower.includes("text") || nameLower.includes("foreground")) return "Text";
  if (nameLower.includes("background") || nameLower.includes("bg") || nameLower.includes("surface"))
    return "Background";
  if (nameLower.includes("border")) return "Border";
  if (nameLower.includes("interactive") || nameLower.includes("button") || nameLower.includes("link"))
    return "Interactive";
  if (nameLower.includes("success")) return "Success";
  if (nameLower.includes("error") || nameLower.includes("danger")) return "Error";
  if (nameLower.includes("warning")) return "Warning";
  if (nameLower.includes("info")) return "Info";
  if (nameLower.includes("primary")) return "Primary";
  if (nameLower.includes("secondary")) return "Secondary";
  if (nameLower.includes("gray") || nameLower.includes("grey") || nameLower.includes("neutral"))
    return "Gray";
  return "Other";
}

export const LightDarkCompareView: React.FC<LightDarkCompareViewProps> = ({
  graph,
  viewMode,
  filteredNodes,
  onClearFilter,
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "different" | "same">("all");
  const [selectedPair, setSelectedPair] = useState<ColorPair | null>(null);
  const [hoveredPair, setHoveredPair] = useState<ColorPair | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Text", "Background", "Border", "Interactive"])
  );

  // Build color pairs with both mode values
  const colorPairs = useMemo(() => {
    const nodes = filteredNodes || graph.getNodes({ excludeSpecs: true });
    const colorNodes = nodes.filter((n) => n.type === "color");

    const pairs: ColorPair[] = [];

    for (const node of colorNodes) {
      const lightValue = graph.resolveNode(node.id, "light");
      const darkValue = graph.resolveNode(node.id, "dark");

      if (
        !lightValue ||
        !darkValue ||
        typeof lightValue !== "string" ||
        typeof darkValue !== "string" ||
        !lightValue.startsWith("#") ||
        !darkValue.startsWith("#")
      ) {
        continue;
      }

      let lightOKLCH: OKLCHColor | null = null;
      let darkOKLCH: OKLCHColor | null = null;

      try {
        lightOKLCH = hexToOKLCH(lightValue);
      } catch {}
      try {
        darkOKLCH = hexToOKLCH(darkValue);
      } catch {}

      pairs.push({
        node,
        light: lightValue,
        dark: darkValue,
        lightOKLCH,
        darkOKLCH,
        isDifferent: lightValue.toLowerCase() !== darkValue.toLowerCase(),
        category: categorizeColor(node.name),
      });
    }

    return pairs;
  }, [graph, filteredNodes]);

  // Group by category
  const groupedPairs = useMemo(() => {
    const groups = new Map<string, ColorPair[]>();

    for (const pair of colorPairs) {
      if (!groups.has(pair.category)) {
        groups.set(pair.category, []);
      }
      groups.get(pair.category)!.push(pair);
    }

    // Sort pairs within each group by name
    for (const pairs of groups.values()) {
      pairs.sort((a, b) => a.node.name.localeCompare(b.node.name));
    }

    return groups;
  }, [colorPairs]);

  // Filter by mode
  const filteredPairs = useMemo(() => {
    if (filterMode === "all") return colorPairs;
    if (filterMode === "different") return colorPairs.filter((p) => p.isDifferent);
    return colorPairs.filter((p) => !p.isDifferent);
  }, [colorPairs, filterMode]);

  // Stats
  const stats = useMemo(() => {
    const different = colorPairs.filter((p) => p.isDifferent).length;
    return {
      total: colorPairs.length,
      different,
      same: colorPairs.length - different,
    };
  }, [colorPairs]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Category order for consistent display
  const categoryOrder = [
    "Text",
    "Background",
    "Border",
    "Interactive",
    "Primary",
    "Secondary",
    "Gray",
    "Success",
    "Warning",
    "Error",
    "Info",
    "Other",
  ];

  const sortedCategories = Array.from(groupedPairs.keys()).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  return (
    <div className="h-full overflow-auto bg-gradient-to-r from-white to-dark-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-dark-200 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h2 className="text-xl font-semibold text-dark-900">
              Light / Dark Mode Comparison
            </h2>
            <p className="text-sm text-dark-500">
              {stats.total} tokens • {stats.different} change between modes
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-dark-100 rounded-lg p-1">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterMode === "all"
                    ? "bg-white shadow text-dark-900"
                    : "text-dark-500 hover:text-dark-700"
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilterMode("different")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterMode === "different"
                    ? "bg-white shadow text-dark-900"
                    : "text-dark-500 hover:text-dark-700"
                }`}
              >
                Changed ({stats.different})
              </button>
              <button
                onClick={() => setFilterMode("same")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterMode === "same"
                    ? "bg-white shadow text-dark-900"
                    : "text-dark-500 hover:text-dark-700"
                }`}
              >
                Same ({stats.same})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter banner */}
      {filteredNodes && (
        <div className="max-w-6xl mx-auto mt-4 px-4">
          <FilterBanner
            count={filteredNodes.length}
            itemLabel="colors"
            className="mb-0"
            onClear={onClearFilter}
          />
        </div>
      )}

      {/* Column headers */}
      <div className="sticky top-[73px] z-10 max-w-6xl mx-auto px-4 py-3">
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
              <div className="w-4 h-4 bg-white border border-dark-200 rounded" />
              <span className="font-medium text-dark-900">Light Mode</span>
            </div>
          </div>
          <div className="w-20" />
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-900 rounded-lg shadow-sm">
              <div className="w-4 h-4 bg-dark-800 border border-dark-700 rounded" />
              <span className="font-medium text-white">Dark Mode</span>
            </div>
          </div>
        </div>
      </div>

      {/* Color pairs grouped by category */}
      <div className="max-w-6xl mx-auto px-4 pb-8 space-y-6">
        {sortedCategories.map((category) => {
          const pairs = groupedPairs.get(category)!;
          const filteredCategoryPairs = pairs.filter((p) => {
            if (filterMode === "all") return true;
            if (filterMode === "different") return p.isDifferent;
            return !p.isDifferent;
          });

          if (filteredCategoryPairs.length === 0) return null;

          const isExpanded = expandedCategories.has(category);

          return (
            <div key={category}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
              >
                <svg
                  className={`w-4 h-4 text-dark-400 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <h3 className="text-sm font-semibold text-dark-700 uppercase tracking-wide">
                  {category}
                </h3>
                <span className="text-xs text-dark-400">
                  ({filteredCategoryPairs.length})
                </span>
              </button>

              {/* Pairs */}
              {isExpanded && (
                <div className="space-y-2">
                  {filteredCategoryPairs.map((pair) => (
                    <ColorPairRow
                      key={pair.node.id}
                      pair={pair}
                      isSelected={selectedPair?.node.id === pair.node.id}
                      isHovered={hoveredPair?.node.id === pair.node.id}
                      activeMode={viewMode}
                      onSelect={() => setSelectedPair(pair)}
                      onHover={() => setHoveredPair(pair)}
                      onLeave={() => setHoveredPair(null)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedPair && (
        <ColorPairDetailPanel
          pair={selectedPair}
          onClose={() => setSelectedPair(null)}
        />
      )}
    </div>
  );
};

// Individual color pair row
interface ColorPairRowProps {
  pair: ColorPair;
  isSelected: boolean;
  isHovered: boolean;
  activeMode: "light" | "dark";
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}

const ColorPairRow: React.FC<ColorPairRowProps> = ({
  pair,
  isSelected,
  isHovered,
  activeMode,
  onSelect,
  onHover,
  onLeave,
}) => {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`w-full grid grid-cols-[1fr,auto,1fr] gap-4 items-center p-2 rounded-lg transition-all ${
        isSelected
          ? "ring-2 ring-blue-500 bg-blue-50/50"
          : isHovered
          ? "bg-dark-100/50"
          : ""
      }`}
    >
      {/* Light mode color */}
      <div className="flex items-center gap-3 justify-end">
        <span className="text-xs text-dark-500 truncate max-w-[150px]">
          {shortenTokenName(pair.node.name)}
        </span>
        <div
          className={`w-12 h-12 rounded-lg border border-dark-200 shadow-sm flex items-center justify-center text-xs font-mono ${
            activeMode === "light" ? "ring-2 ring-blue-400" : ""
          }`}
          style={{
            backgroundColor: pair.light,
            color: getAccessibleTextColor(pair.light),
          }}
        >
          {pair.light.slice(1, 7).toUpperCase()}
        </div>
      </div>

      {/* Connector */}
      <div className="w-20 flex items-center justify-center relative">
        <div
          className={`h-0.5 w-full ${
            pair.isDifferent ? "bg-amber-400" : "bg-dark-200"
          }`}
        />
        {pair.isDifferent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 text-amber-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
          </div>
        )}
        {!pair.isDifferent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 bg-dark-200 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-dark-500">=</span>
            </div>
          </div>
        )}
      </div>

      {/* Dark mode color */}
      <div className="flex items-center gap-3 justify-start">
        <div
          className={`w-12 h-12 rounded-lg border border-dark-700 shadow-sm flex items-center justify-center text-xs font-mono ${
            activeMode === "dark" ? "ring-2 ring-blue-400" : ""
          }`}
          style={{
            backgroundColor: pair.dark,
            color: getAccessibleTextColor(pair.dark),
          }}
        >
          {pair.dark.slice(1, 7).toUpperCase()}
        </div>
        <span className="text-xs text-dark-400 truncate max-w-[150px]">
          {pair.isDifferent && pair.lightOKLCH && pair.darkOKLCH
            ? `ΔL: ${((pair.darkOKLCH.l - pair.lightOKLCH.l) * 100).toFixed(0)}%`
            : ""}
        </span>
      </div>
    </button>
  );
};

// Detail panel
interface ColorPairDetailPanelProps {
  pair: ColorPair;
  onClose: () => void;
}

const ColorPairDetailPanel: React.FC<ColorPairDetailPanelProps> = ({
  pair,
  onClose,
}) => {
  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-dark-200 rounded-xl shadow-xl overflow-hidden z-40">
      {/* Preview */}
      <div className="grid grid-cols-2">
        <div
          className="p-4 flex flex-col items-center justify-center h-28"
          style={{ backgroundColor: pair.light }}
        >
          <span
            className="text-lg font-bold"
            style={{ color: getAccessibleTextColor(pair.light) }}
          >
            Light
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: getAccessibleTextColor(pair.light) }}
          >
            {pair.light}
          </span>
        </div>
        <div
          className="p-4 flex flex-col items-center justify-center h-28"
          style={{ backgroundColor: pair.dark }}
        >
          <span
            className="text-lg font-bold"
            style={{ color: getAccessibleTextColor(pair.dark) }}
          >
            Dark
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: getAccessibleTextColor(pair.dark) }}
          >
            {pair.dark}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-dark-900">{shortenTokenName(pair.node.name)}</h4>
            <p className="text-sm text-dark-500">{pair.category}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-100 rounded transition-colors"
          >
            <svg
              className="w-5 h-5 text-dark-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* OKLCH comparison */}
        {pair.lightOKLCH && pair.darkOKLCH && (
          <div className="space-y-2">
            <div className="text-xs text-dark-400 font-medium">OKLCH Values</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {/* Light */}
              <div className="bg-dark-50 rounded-lg p-2 space-y-1">
                <div className="text-xs text-dark-400">Light</div>
                <div>L: {(pair.lightOKLCH.l * 100).toFixed(1)}%</div>
                <div>C: {pair.lightOKLCH.c.toFixed(3)}</div>
                <div>H: {pair.lightOKLCH.h.toFixed(1)}°</div>
              </div>
              {/* Dark */}
              <div className="bg-dark-50 rounded-lg p-2 space-y-1">
                <div className="text-xs text-dark-400">Dark</div>
                <div>L: {(pair.darkOKLCH.l * 100).toFixed(1)}%</div>
                <div>C: {pair.darkOKLCH.c.toFixed(3)}</div>
                <div>H: {pair.darkOKLCH.h.toFixed(1)}°</div>
              </div>
            </div>

            {/* Deltas */}
            {pair.isDifferent && (
              <div className="bg-amber-50 rounded-lg p-2 text-sm">
                <div className="text-xs text-amber-600 font-medium mb-1">Change</div>
                <div className="grid grid-cols-3 gap-2 text-amber-800">
                  <div>
                    ΔL: {((pair.darkOKLCH.l - pair.lightOKLCH.l) * 100).toFixed(1)}%
                  </div>
                  <div>
                    ΔC: {(pair.darkOKLCH.c - pair.lightOKLCH.c).toFixed(3)}
                  </div>
                  <div>
                    ΔH: {(pair.darkOKLCH.h - pair.lightOKLCH.h).toFixed(1)}°
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            pair.isDifferent
              ? "bg-amber-100 text-amber-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {pair.isDifferent ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              Changes between modes
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Same in both modes
            </>
          )}
        </div>
      </div>
    </div>
  );
};
