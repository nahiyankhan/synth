/**
 * ColorSelectionPanel - Displays selected color(s) with details
 *
 * Handles both single-color detail view and multi-color selection grid.
 */

import React from "react";
import { StyleGraph } from "../../core/StyleGraph";
import { StyleNode, StyleMode, isModeMap } from "../../types/styleGraph";
import { hexToOKLCH, OKLCHColor } from "../../services/colorScience";
import { XIcon } from "../icons";
import { OKLCHDisplay } from "./shared/OKLCHDisplay";

interface PositionedColor {
  node: StyleNode;
  color: string;
  oklch: OKLCHColor;
  x: number;
  y: number;
  columnIndex?: number;
}

interface ColorSelectionPanelProps {
  selectedColors: Set<string>;
  positionedColors: PositionedColor[];
  graph: StyleGraph;
  viewMode: StyleMode;
  onClearSelection: () => void;
  onRemoveColor: (colorId: string) => void;
  onSelectNode?: (node: StyleNode | null) => void;
  onSelectNodes?: (nodes: StyleNode[]) => void;
  getColorBorderRadius: (oklch: OKLCHColor, isHovered: boolean) => string;
}

/**
 * Panel for displaying selected colors with actions
 */
export const ColorSelectionPanel: React.FC<ColorSelectionPanelProps> = ({
  selectedColors,
  positionedColors,
  graph,
  viewMode,
  onClearSelection,
  onRemoveColor,
  onSelectNode,
  onSelectNodes,
  getColorBorderRadius,
}) => {
  if (selectedColors.size === 0) {
    return null;
  }

  // Multi-selection view
  if (selectedColors.size > 1) {
    return (
      <MultiSelectionPanel
        selectedColors={selectedColors}
        positionedColors={positionedColors}
        onClearSelection={onClearSelection}
        onRemoveColor={onRemoveColor}
        onSelectNode={onSelectNode}
        onSelectNodes={onSelectNodes}
        getColorBorderRadius={getColorBorderRadius}
      />
    );
  }

  // Single selection view
  const selectedId = Array.from(selectedColors)[0];
  const selectedColor = positionedColors.find((c) => c.node.id === selectedId);

  if (!selectedColor) {
    return null;
  }

  return (
    <SingleSelectionPanel
      selectedColor={selectedColor}
      graph={graph}
      viewMode={viewMode}
      onClearSelection={onClearSelection}
      getColorBorderRadius={getColorBorderRadius}
    />
  );
};

/**
 * Multi-selection panel showing grid of selected colors
 */
const MultiSelectionPanel: React.FC<{
  selectedColors: Set<string>;
  positionedColors: PositionedColor[];
  onClearSelection: () => void;
  onRemoveColor: (colorId: string) => void;
  onSelectNode?: (node: StyleNode | null) => void;
  onSelectNodes?: (nodes: StyleNode[]) => void;
  getColorBorderRadius: (oklch: OKLCHColor, isHovered: boolean) => string;
}> = ({
  selectedColors,
  positionedColors,
  onClearSelection,
  onRemoveColor,
  onSelectNode,
  onSelectNodes,
  getColorBorderRadius,
}) => {
  const handleCopyHexCodes = () => {
    const hexCodes = Array.from(selectedColors)
      .map((id) => {
        const color = positionedColors.find((c) => c.node.id === id);
        return color?.color;
      })
      .filter(Boolean)
      .join(", ");

    navigator.clipboard.writeText(hexCodes);
  };

  const handleRemoveColor = (colorId: string) => {
    onRemoveColor(colorId);

    // Notify parent about remaining selection
    const remainingIds = new Set(selectedColors);
    remainingIds.delete(colorId);

    const selectedNodes = Array.from(remainingIds)
      .map((id) => positionedColors.find((c) => c.node.id === id)?.node)
      .filter(Boolean) as StyleNode[];

    onSelectNodes?.(selectedNodes);
  };

  return (
    <div className="fixed top-4 right-4 w-96 max-h-[calc(100vh-2rem)] bg-white border border-dark-300 rounded-xl shadow-2xl pointer-events-auto overflow-hidden animate-fade-in z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-dark-200 flex items-center justify-between">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-dark-900">
              {selectedColors.size} Colors Selected
            </h3>
            <p className="text-xs text-dark-500">
              Click colors to deselect
            </p>
          </div>
        </div>
        <button
          onClick={onClearSelection}
          className="flex-shrink-0 p-1 hover:bg-dark-100 rounded transition-colors"
        >
          <XIcon className="w-5 h-5 text-dark-400" />
        </button>
      </div>

      {/* Selected colors grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from(selectedColors).map((colorId) => {
            const color = positionedColors.find((c) => c.node.id === colorId);
            if (!color) return null;

            return (
              <div
                key={colorId}
                className="group cursor-pointer hover:bg-dark-50 rounded-lg p-2 transition-colors"
                onClick={() => handleRemoveColor(colorId)}
              >
                {/* Color swatch */}
                <div
                  className="w-full h-20 rounded-lg shadow-sm mb-2"
                  style={{
                    backgroundColor: color.color,
                    borderRadius: getColorBorderRadius(color.oklch, false).replace(
                      /px$/,
                      (n) => `${parseInt(n) / 2}px`
                    ),
                  }}
                />
                {/* Color info */}
                <div className="text-xs">
                  <div className="font-medium text-dark-900 truncate">
                    {color.node.name.split(".").pop()}
                  </div>
                  <code className="text-[10px] font-mono text-dark-500">
                    {color.color.toUpperCase()}
                  </code>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-3 border-t border-dark-200 flex gap-2">
        <button
          onClick={handleCopyHexCodes}
          className="flex-1 px-3 py-2 text-sm font-medium text-dark-700 bg-dark-100 hover:bg-dark-200 rounded-lg transition-colors"
        >
          Copy Hex Codes
        </button>
        <button
          onClick={onClearSelection}
          className="px-3 py-2 text-sm font-medium text-dark-500 hover:text-dark-700 hover:bg-dark-100 rounded-lg transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

/**
 * Single selection panel showing detailed color info
 */
const SingleSelectionPanel: React.FC<{
  selectedColor: PositionedColor;
  graph: StyleGraph;
  viewMode: StyleMode;
  onClearSelection: () => void;
  getColorBorderRadius: (oklch: OKLCHColor, isHovered: boolean) => string;
}> = ({ selectedColor, graph, viewMode, onClearSelection, getColorBorderRadius }) => {
  const otherMode = viewMode === "light" ? "dark" : "light";

  return (
    <div className="fixed top-4 right-4 w-96 bg-white border border-dark-300 rounded-xl shadow-2xl pointer-events-auto overflow-hidden animate-fade-in z-50">
      {/* Header with color swatch */}
      <div className="p-4 border-b border-dark-200">
        <div className="flex items-start gap-4">
          {/* Color swatch */}
          <div
            className="flex-shrink-0 rounded-lg shadow-md"
            style={{
              width: "80px",
              height: "80px",
              backgroundColor: selectedColor.color,
              borderRadius: getColorBorderRadius(selectedColor.oklch, false),
            }}
          />

          {/* Color info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-dark-900 truncate mb-1">
              {selectedColor.node.name}
            </h3>
            <code className="text-sm font-mono text-dark-600 block mb-2">
              {selectedColor.color.toUpperCase()}
            </code>
            <span className="inline-block px-2 py-1 text-xs rounded-md bg-dark-100 text-dark-600 font-medium capitalize">
              {selectedColor.node.layer}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={onClearSelection}
            className="flex-shrink-0 p-1 hover:bg-dark-100 rounded transition-colors"
          >
            <XIcon className="w-5 h-5 text-dark-400" />
          </button>
        </div>
      </div>

      {/* OKLCH Values */}
      <div className="p-4 border-b border-dark-200">
        <div className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-3">
          OKLCH Values
        </div>
        <OKLCHDisplay
          oklch={selectedColor.oklch}
          variant="light"
          showFullLabels
          chromaPrecision={0}
          className="gap-3"
        />
      </div>

      {/* Derived Colors */}
      {selectedColor.node.dependents.size > 0 && (
        <DerivedColorsSection
          selectedColor={selectedColor}
          graph={graph}
          viewMode={viewMode}
          getColorBorderRadius={getColorBorderRadius}
        />
      )}

      {/* No derived colors message */}
      {selectedColor.node.dependents.size === 0 && (
        <div className="p-4">
          <div className="text-sm text-dark-500 text-center py-4">
            No colors are derived from this color
          </div>
        </div>
      )}

      {/* Intent metadata (collapsible) */}
      {selectedColor.node.intent && (
        <IntentSection intent={selectedColor.node.intent} />
      )}

      {/* Layer info */}
      <div className="px-4 pb-4 text-xs text-dark-500">
        Layer: {selectedColor.node.layer} (computed)
        {selectedColor.node.dependents.size > 0 &&
          ` • Referenced by ${selectedColor.node.dependents.size} tokens`}
      </div>
    </div>
  );
};

/**
 * Section showing colors derived from the selected color
 */
const DerivedColorsSection: React.FC<{
  selectedColor: PositionedColor;
  graph: StyleGraph;
  viewMode: StyleMode;
  getColorBorderRadius: (oklch: OKLCHColor, isHovered: boolean) => string;
}> = ({ selectedColor, graph, viewMode, getColorBorderRadius }) => {
  const otherMode = viewMode === "light" ? "dark" : "light";
  const dependentIds = Array.from(selectedColor.node.dependents).slice(0, 8);

  return (
    <div className="p-4 border-b border-dark-200">
      <div className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-3">
        Derived Colors ({selectedColor.node.dependents.size})
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {dependentIds.map((dependentId) => {
            const dependentNode = graph.getNode(dependentId);
            if (!dependentNode) return null;

            const hasModeSpecificValues = isModeMap(dependentNode.value);
            const resolvedColor = graph.resolveNode(dependentId, viewMode);

            if (
              !resolvedColor ||
              typeof resolvedColor !== "string" ||
              !resolvedColor.startsWith("#")
            ) {
              return null;
            }

            const resolvedColorOtherMode = hasModeSpecificValues
              ? graph.resolveNode(dependentId, otherMode)
              : null;

            const hasDifferentModeValues =
              hasModeSpecificValues &&
              resolvedColorOtherMode &&
              typeof resolvedColorOtherMode === "string" &&
              resolvedColorOtherMode.startsWith("#") &&
              resolvedColorOtherMode !== resolvedColor;

            let dependentOklch: OKLCHColor;
            try {
              dependentOklch = hexToOKLCH(resolvedColor);
            } catch {
              return null;
            }

            let dependentOklchOther: OKLCHColor | null = null;
            if (hasDifferentModeValues && resolvedColorOtherMode) {
              try {
                dependentOklchOther = hexToOKLCH(resolvedColorOtherMode);
              } catch {
                // Ignore
              }
            }

            return (
              <div key={dependentId} className="relative flex items-center">
                <div className="flex items-center gap-2.5 bg-white rounded-lg pl-2.5 pr-3 py-2 border border-dark-300 shadow-md">
                  <div className="flex flex-col gap-1">
                    <div
                      className="w-9 h-9 rounded shadow-sm flex-shrink-0 ring-2 ring-blue-500 ring-offset-1"
                      style={{
                        backgroundColor: resolvedColor,
                        borderRadius: getColorBorderRadius(dependentOklch, false).replace(
                          /px$/,
                          (n) => `${parseInt(n) / 3}px`
                        ),
                      }}
                      title={`${viewMode} mode (active)`}
                    />
                    {hasDifferentModeValues && dependentOklchOther && (
                      <div
                        className="w-9 h-9 rounded shadow-sm flex-shrink-0 opacity-50"
                        style={{
                          backgroundColor: resolvedColorOtherMode,
                          borderRadius: getColorBorderRadius(dependentOklchOther, false).replace(
                            /px$/,
                            (n) => `${parseInt(n) / 3}px`
                          ),
                        }}
                        title={`${otherMode} mode (inactive)`}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-dark-800 truncate">
                      {dependentNode.name.split(".").pop()}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider">
                          {viewMode}
                        </span>
                        <code className="text-[10px] font-mono text-dark-600">
                          {resolvedColor.toUpperCase()}
                        </code>
                      </div>
                      {hasDifferentModeValues && (
                        <div className="flex items-center gap-1.5 opacity-60">
                          <span className="text-[9px] font-semibold text-dark-500 uppercase tracking-wider">
                            {otherMode}
                          </span>
                          <code className="text-[10px] font-mono text-dark-500">
                            {resolvedColorOtherMode?.toUpperCase()}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {selectedColor.node.dependents.size > 8 && (
            <div className="text-xs text-dark-500 pl-2 pt-1">
              + {selectedColor.node.dependents.size - 8} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Collapsible section showing token intent metadata
 */
const IntentSection: React.FC<{
  intent: NonNullable<StyleNode["intent"]>;
}> = ({ intent }) => {
  return (
    <div className="p-4 border-t border-dark-200">
      <details>
        <summary className="text-xs font-semibold text-dark-500 uppercase tracking-wide cursor-pointer hover:text-dark-700">
          Intent
        </summary>
        <div className="mt-3 text-sm text-dark-600 space-y-2">
          {intent.purpose && <div>{intent.purpose}</div>}

          {intent.designedFor && intent.designedFor.length > 0 && (
            <div>
              <span className="font-medium">Designed for:</span>{" "}
              {intent.designedFor.join(", ")}
            </div>
          )}

          {intent.qualities && intent.qualities.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {intent.qualities.map((q) => (
                <span
                  key={q}
                  className="px-2 py-0.5 bg-dark-100 rounded text-xs"
                >
                  {q}
                </span>
              ))}
            </div>
          )}

          {intent.constraints && intent.constraints.length > 0 && (
            <div className="text-xs text-dark-500">
              <span className="font-medium">Constraints:</span>{" "}
              {intent.constraints.join(", ")}
            </div>
          )}
        </div>
      </details>
    </div>
  );
};

export default ColorSelectionPanel;
