/**
 * Color Sankey View
 *
 * Top-level component for the color token flow Sankey diagram.
 * Shows primitive → semantic color token relationships.
 */

"use client";

import { useMemo, useState, useCallback } from "react";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import {
  graphToSankeyData,
  getSankeyStats,
  findConnectedNodes,
  computeSankeyLayout,
  SankeyCanvas,
} from "./sankey";
import { FilterBanner } from "@/components/ui/filter-banner";

interface ColorSankeyViewProps {
  graph: StyleGraph;
  viewMode: "light" | "dark";
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
}

export function ColorSankeyView({
  graph,
  viewMode,
  filteredNodes,
  onClearFilter,
}: ColorSankeyViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Transform graph data to Sankey format
  const sankeyData = useMemo(() => {
    return graphToSankeyData(graph, filteredNodes);
  }, [graph, filteredNodes]);

  // Find active nodes/links when a node is selected
  const { activeNodes, activeLinks } = useMemo(() => {
    if (!selectedNodeId) {
      return { activeNodes: new Set<string>(), activeLinks: new Set<string>() };
    }
    return findConnectedNodes(
      selectedNodeId,
      sankeyData.nodes,
      sankeyData.links
    );
  }, [selectedNodeId, sankeyData]);

  // Compute layout with active node separation
  const layoutData = useMemo(() => {
    return computeSankeyLayout(
      sankeyData.nodes,
      sankeyData.links,
      activeNodes
    );
  }, [sankeyData, activeNodes]);

  // Statistics
  const stats = useMemo(() => {
    return getSankeyStats(layoutData.nodes, layoutData.links);
  }, [layoutData]);

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string | null) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  // Get selected node details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return layoutData.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, layoutData.nodes]);

  // Determine theme based on document
  const theme =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";

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
      <div className="flex-1 min-h-0 border border-dark-200 rounded-2xl overflow-hidden bg-white flex flex-col">
        {/* Header with stats */}
        <div className="shrink-0 px-6 py-4 border-b border-dark-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-dark-900">
              Color Token Flow
            </h2>
            <div className="flex items-center gap-3 text-sm text-dark-400">
              <span>{stats.primitives} primitives</span>
              <span className="text-dark-300">→</span>
              <span>{stats.semantic} semantic</span>
              <span className="text-dark-300">•</span>
              <span>{stats.connections} connections</span>
            </div>
          </div>

          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-sm text-dark-500 hover:text-dark-900 transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Canvas container */}
        <div className="flex-1 relative min-h-0">
          <SankeyCanvas
            nodes={layoutData.nodes}
            links={layoutData.links}
            activeNodes={activeNodes}
            activeLinks={activeLinks}
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            theme={theme}
            colorMode={viewMode}
          />

          {/* Selected node detail panel */}
          {selectedNode && (
            <div className="absolute bottom-4 left-4 p-4 bg-white border border-dark-200 rounded-xl shadow-xl max-w-sm">
              <div className="flex items-start gap-3">
                {/* Color swatch */}
                <div
                  className="w-12 h-12 rounded-md border border-dark-200 flex-shrink-0"
                  style={{ backgroundColor: selectedNode.hex[viewMode] }}
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-dark-900 truncate">
                    {selectedNode.name}
                  </h4>
                  <p className="text-xs text-dark-500 mt-0.5">
                    {selectedNode.layerName} token
                  </p>

                  <div className="mt-2 flex gap-4 text-xs">
                    <div>
                      <span className="text-dark-400">Light:</span>
                      <code className="ml-1 text-dark-700">
                        {selectedNode.hex.light}
                      </code>
                    </div>
                    <div>
                      <span className="text-dark-400">Dark:</span>
                      <code className="ml-1 text-dark-700">
                        {selectedNode.hex.dark}
                      </code>
                    </div>
                  </div>

                  {/* Connection info */}
                  {(selectedNode.sourceLinks.length > 0 ||
                    selectedNode.targetLinks.length > 0) && (
                    <div className="mt-2 pt-2 border-t border-dark-100 text-xs text-dark-500">
                      {selectedNode.targetLinks.length > 0 && (
                        <span>
                          Uses {selectedNode.targetLinks.length} primitive
                          {selectedNode.targetLinks.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {selectedNode.sourceLinks.length > 0 && (
                        <span>
                          {selectedNode.targetLinks.length > 0 && " • "}
                          Used by {selectedNode.sourceLinks.length} token
                          {selectedNode.sourceLinks.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="shrink-0 px-6 py-2 border-t border-dark-100 text-xs text-dark-400">
          <span>Scroll to pan • Cmd/Alt + scroll to zoom • Click to select</span>
        </div>
      </div>
    </div>
  );
}
