/**
 * ContrastMatrixView - WCAG Contrast Heatmap
 *
 * Displays a matrix showing contrast ratios between all text colors
 * and background colors, color-coded by WCAG compliance level.
 */

import React, { useState, useMemo } from "react";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import { analyzeContrast, ContrastResult } from "@/services/colorScience";
import { shortenTokenName } from "./utils/token-name-utils";
import { FilterBanner } from "@/components/ui/filter-banner";

interface ContrastMatrixViewProps {
  graph: StyleGraph;
  viewMode: "light" | "dark";
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
}

interface ColorToken {
  name: string;
  nodeId: string;
  hex: string;
}

interface ContrastCell {
  text: ColorToken;
  bg: ColorToken;
  result: ContrastResult;
}

// WCAG level colors
const LEVEL_COLORS = {
  AAA: { bg: "#22c55e", text: "#ffffff", label: "AAA" },
  AA: { bg: "#84cc16", text: "#000000", label: "AA" },
  A: { bg: "#eab308", text: "#000000", label: "A" },
  fail: { bg: "#ef4444", text: "#ffffff", label: "Fail" },
};

// Extract text and background colors from graph
function extractColorTokens(
  graph: StyleGraph,
  viewMode: "light" | "dark",
  filteredNodes?: StyleNode[] | null
): { textColors: ColorToken[]; bgColors: ColorToken[] } {
  const nodes = filteredNodes || graph.getNodes({ excludeSpecs: true });
  const colorNodes = nodes.filter((n) => n.type === "color");

  const textColors: ColorToken[] = [];
  const bgColors: ColorToken[] = [];

  for (const node of colorNodes) {
    const resolved = graph.resolveNode(node.id, viewMode);
    if (!resolved || typeof resolved !== "string" || !resolved.startsWith("#")) {
      continue;
    }

    const nameLower = node.name.toLowerCase();

    // Categorize by name patterns
    if (
      nameLower.includes("text") ||
      nameLower.includes("foreground") ||
      nameLower.includes("fg")
    ) {
      textColors.push({
        name: node.name,
        nodeId: node.id,
        hex: resolved,
      });
    }

    if (
      nameLower.includes("background") ||
      nameLower.includes("bg") ||
      nameLower.includes("surface") ||
      nameLower.includes("base")
    ) {
      bgColors.push({
        name: node.name,
        nodeId: node.id,
        hex: resolved,
      });
    }
  }

  // Sort by name for consistent ordering
  textColors.sort((a, b) => a.name.localeCompare(b.name));
  bgColors.sort((a, b) => a.name.localeCompare(b.name));

  return { textColors, bgColors };
}


export const ContrastMatrixView: React.FC<ContrastMatrixViewProps> = ({
  graph,
  viewMode,
  filteredNodes,
  onClearFilter,
}) => {
  const [selectedCell, setSelectedCell] = useState<ContrastCell | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [hoveredCell, setHoveredCell] = useState<ContrastCell | null>(null);

  // Extract color tokens
  const { textColors, bgColors } = useMemo(
    () => extractColorTokens(graph, viewMode, filteredNodes),
    [graph, viewMode, filteredNodes]
  );

  // Build contrast matrix
  const matrix = useMemo(() => {
    const cells: ContrastCell[][] = [];

    for (const text of textColors) {
      const row: ContrastCell[] = [];
      for (const bg of bgColors) {
        const result = analyzeContrast(text.hex, bg.hex);
        row.push({ text, bg, result });
      }
      cells.push(row);
    }

    return cells;
  }, [textColors, bgColors]);

  // Stats
  const stats = useMemo(() => {
    let aaa = 0,
      aa = 0,
      a = 0,
      fail = 0;
    for (const row of matrix) {
      for (const cell of row) {
        switch (cell.result.wcagLevel) {
          case "AAA":
            aaa++;
            break;
          case "AA":
            aa++;
            break;
          case "A":
            a++;
            break;
          case "fail":
            fail++;
            break;
        }
      }
    }
    return { aaa, aa, a, fail, total: aaa + aa + a + fail };
  }, [matrix]);

  // Filter matrix by level
  const shouldShowCell = (level: string): boolean => {
    if (filterLevel === "all") return true;
    if (filterLevel === "passing") return level !== "fail";
    if (filterLevel === "failing") return level === "fail";
    return level === filterLevel;
  };

  // Empty state
  if (textColors.length === 0 || bgColors.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-dark-100 rounded-2xl flex items-center justify-center">
            <svg
              className="w-8 h-8 text-dark-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-dark-900">
            No semantic colors found
          </h3>
          <p className="text-dark-500">
            The contrast matrix requires text and background semantic tokens.
            Make sure your design system has colors with "text", "foreground",
            "background", or "surface" in their names.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-white p-8">
      {/* Header with stats and filters */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-dark-900">
            Contrast Matrix
          </h2>
          <p className="text-sm text-dark-500">
            {textColors.length} text colors × {bgColors.length} backgrounds ={" "}
            {stats.total} combinations
          </p>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {Object.entries(LEVEL_COLORS).map(([level, config]) => {
              const count =
                stats[level.toLowerCase() as keyof typeof stats] || 0;
              return (
                <button
                  key={level}
                  onClick={() =>
                    setFilterLevel(filterLevel === level ? "all" : level)
                  }
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    filterLevel === level
                      ? "ring-2 ring-offset-1 ring-dark-400"
                      : "opacity-80 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: config.bg,
                    color: config.text,
                  }}
                >
                  {config.label}: {count as number}
                </button>
              );
            })}
          </div>

          {/* Filter dropdown */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="text-sm border border-dark-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="all">Show all</option>
            <option value="passing">Passing only</option>
            <option value="failing">Failing only</option>
          </select>
        </div>
      </div>

      {/* Filter banner */}
      {filteredNodes && (
        <FilterBanner
          count={filteredNodes.length}
          itemLabel="colors"
          onClear={onClearFilter}
        />
      )}

      {/* Matrix */}
      <div className="overflow-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              {/* Empty corner cell */}
              <th className="sticky left-0 top-0 z-20 bg-white p-2 min-w-[120px]">
                <div className="text-xs text-dark-400 text-right">
                  text ↓ / bg →
                </div>
              </th>
              {/* Background column headers */}
              {bgColors.map((bg) => (
                <th
                  key={bg.nodeId}
                  className="sticky top-0 z-10 bg-white p-1 min-w-[80px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-md border border-dark-200"
                      style={{ backgroundColor: bg.hex }}
                      title={bg.hex}
                    />
                    <span className="text-[10px] text-dark-500 max-w-[70px] truncate">
                      {shortenTokenName(bg.name)}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIdx) => (
              <tr key={textColors[rowIdx].nodeId}>
                {/* Text row header */}
                <td className="sticky left-0 z-10 bg-white p-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md border border-dark-200 flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: "#ffffff",
                        color: textColors[rowIdx].hex,
                      }}
                    >
                      A
                    </div>
                    <span className="text-xs text-dark-700 max-w-[90px] truncate">
                      {shortenTokenName(textColors[rowIdx].name)}
                    </span>
                  </div>
                </td>
                {/* Contrast cells */}
                {row.map((cell) => {
                  const levelConfig = LEVEL_COLORS[cell.result.wcagLevel];
                  const isVisible = shouldShowCell(cell.result.wcagLevel);
                  const isSelected =
                    selectedCell?.text.nodeId === cell.text.nodeId &&
                    selectedCell?.bg.nodeId === cell.bg.nodeId;
                  const isHovered =
                    hoveredCell?.text.nodeId === cell.text.nodeId &&
                    hoveredCell?.bg.nodeId === cell.bg.nodeId;

                  return (
                    <td key={`${cell.text.nodeId}-${cell.bg.nodeId}`} className="p-1">
                      <button
                        onClick={() => setSelectedCell(cell)}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-full h-12 rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                          isVisible ? "" : "opacity-20"
                        } ${
                          isSelected
                            ? "ring-2 ring-offset-1 ring-blue-500"
                            : isHovered
                            ? "ring-2 ring-offset-1 ring-dark-300"
                            : ""
                        }`}
                        style={{
                          backgroundColor: levelConfig.bg,
                          color: levelConfig.text,
                        }}
                      >
                        {cell.result.ratio.toFixed(1)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selectedCell && (
        <ContrastDetailPanel
          cell={selectedCell}
          onClose={() => setSelectedCell(null)}
        />
      )}

      {/* Hover tooltip */}
      {hoveredCell && !selectedCell && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-dark-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          <span className="font-medium">{shortenTokenName(hoveredCell.text.name)}</span>
          <span className="text-dark-400"> on </span>
          <span className="font-medium">{shortenTokenName(hoveredCell.bg.name)}</span>
          <span className="text-dark-400"> = </span>
          <span className="font-bold">{hoveredCell.result.ratio.toFixed(2)}:1</span>
          <span
            className="ml-2 px-1.5 py-0.5 rounded text-xs"
            style={{
              backgroundColor: LEVEL_COLORS[hoveredCell.result.wcagLevel].bg,
              color: LEVEL_COLORS[hoveredCell.result.wcagLevel].text,
            }}
          >
            {hoveredCell.result.wcagLevel}
          </span>
        </div>
      )}
    </div>
  );
};

// Detail panel component
interface ContrastDetailPanelProps {
  cell: ContrastCell;
  onClose: () => void;
}

const ContrastDetailPanel: React.FC<ContrastDetailPanelProps> = ({
  cell,
  onClose,
}) => {
  const { text, bg, result } = cell;
  const levelConfig = LEVEL_COLORS[result.wcagLevel];

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-dark-200 rounded-xl shadow-xl overflow-hidden z-40">
      {/* Preview */}
      <div
        className="p-6"
        style={{ backgroundColor: bg.hex }}
      >
        <div className="space-y-2">
          <p
            className="text-2xl font-bold"
            style={{ color: text.hex }}
          >
            Sample Heading
          </p>
          <p
            className="text-sm"
            style={{ color: text.hex }}
          >
            This is body text using the selected color combination.
            Check readability at different sizes.
          </p>
          <p
            className="text-xs"
            style={{ color: text.hex }}
          >
            Small caption text (12px)
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-dark-900">Contrast Analysis</h4>
            <p className="text-sm text-dark-500">
              {shortenTokenName(text.name)} on {shortenTokenName(bg.name)}
            </p>
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

        {/* Ratio display */}
        <div className="flex items-center gap-4">
          <div
            className="px-4 py-2 rounded-lg text-2xl font-bold"
            style={{
              backgroundColor: levelConfig.bg,
              color: levelConfig.text,
            }}
          >
            {result.ratio.toFixed(2)}:1
          </div>
          <div className="space-y-1">
            <div className="font-medium text-dark-900">
              WCAG {result.wcagLevel}
            </div>
            <div className="text-sm text-dark-500">
              {result.wcagLevel === "AAA"
                ? "Excellent contrast"
                : result.wcagLevel === "AA"
                ? "Good contrast"
                : result.wcagLevel === "A"
                ? "Large text only"
                : "Insufficient contrast"}
            </div>
          </div>
        </div>

        {/* WCAG requirements */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div
            className={`p-2 rounded-lg ${
              result.normalTextAAA ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            <div className="font-medium">Normal Text AAA</div>
            <div className="text-xs opacity-70">≥ 7:1 required</div>
          </div>
          <div
            className={`p-2 rounded-lg ${
              result.normalTextAA ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            <div className="font-medium">Normal Text AA</div>
            <div className="text-xs opacity-70">≥ 4.5:1 required</div>
          </div>
          <div
            className={`p-2 rounded-lg ${
              result.largeTextAAA ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            <div className="font-medium">Large Text AAA</div>
            <div className="text-xs opacity-70">≥ 4.5:1 required</div>
          </div>
          <div
            className={`p-2 rounded-lg ${
              result.largeTextAA ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            <div className="font-medium">Large Text AA</div>
            <div className="text-xs opacity-70">≥ 3:1 required</div>
          </div>
        </div>

        {/* Color values */}
        <div className="flex gap-4 text-sm">
          <div className="flex-1">
            <div className="text-dark-400 text-xs mb-1">Text</div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border border-dark-200"
                style={{ backgroundColor: text.hex }}
              />
              <span className="font-mono text-dark-700">{text.hex}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-dark-400 text-xs mb-1">Background</div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border border-dark-200"
                style={{ backgroundColor: bg.hex }}
              />
              <span className="font-mono text-dark-700">{bg.hex}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
