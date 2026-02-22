import React, { useState } from "react";
import { ColorView } from "../components/ColorView";
import { ColorListView } from "../components/ColorListView";
import { ColorSankeyView } from "../components/color/ColorSankeyView";
import { ColorViewModeToolbar, ColorViewModeType } from "../components/ColorViewModeToolbar";
import { ToolCallDisplay } from "../components/ToolCallDisplay";
import { DevPanel } from "../components/DevPanel";
import { ToolResultOverlay } from "../components/tool-results";
import { useViewPage } from "../hooks/useViewPage";

export const ColorsPage: React.FC = () => {
  const [colorViewMode, setColorViewMode] = useState<ColorViewModeType>("canvas");

  const {
    navigate,
    currentEvent,
    previousEvent,
    currentLanguageMetadata,
    graph,
    viewMode,
    voiceSearchResults,
    setVoiceSearchResults,
    toolUIState,
    closeOverlay,
    isVisible,
    handleExecutePrompt,
    isLoading,
    isProcessingText,
  } = useViewPage({ currentView: "colors" });

  if (isLoading) {
    return (
      <div className="h-screen bg-dark-50 text-dark-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-8 h-8 border-2 border-dark-300 border-t-dark-900 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-dark-500 font-light tracking-wide">
            loading design system...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-white text-dark-900 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="w-full bg-white z-40 shrink-0">
        <div
          className={`px-12 pt-12 pb-4 transition-opacity duration-700 ease-out ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={() => navigate("/")}
            className="text-7xl font-bold tracking-tight mr-2 text-dark-400 hover:text-dark-900 transition-colors"
          >
            home
          </button>
          <span className="text-7xl font-bold tracking-tight text-dark-400 mr-2">
            .
          </span>
          <button
            onClick={() => navigate("/editor")}
            className="text-7xl font-bold tracking-tight mr-2 text-dark-400 hover:text-dark-900 transition-colors lowercase"
          >
            {currentLanguageMetadata?.name || "untitled"}
          </button>
          <span className="text-7xl font-bold tracking-tight text-dark-400 mr-2">
            .
          </span>
          <span className="text-7xl font-bold tracking-tight text-dark-900 lowercase">
            colors
          </span>
        </div>
      </div>

      {/* Mini Toolbar */}
      <div className="px-12 pt-4">
        <ColorViewModeToolbar
          viewMode={colorViewMode}
          onViewModeChange={setColorViewMode}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {colorViewMode === "canvas" && (
          <ColorView
            graph={graph!}
            viewMode={viewMode}
            filteredNodes={voiceSearchResults}
            onClearFilter={() => setVoiceSearchResults(null)}
          />
        )}
        {colorViewMode === "list" && (
          <ColorListView
            graph={graph!}
            viewMode={viewMode}
            filteredNodes={voiceSearchResults}
            onClearFilter={() => setVoiceSearchResults(null)}
          />
        )}
        {colorViewMode === "flow" && (
          <ColorSankeyView
            graph={graph!}
            viewMode={viewMode}
            filteredNodes={voiceSearchResults}
            onClearFilter={() => setVoiceSearchResults(null)}
          />
        )}
      </div>

      {/* Tool Call Display */}
      <ToolCallDisplay
        currentEvent={currentEvent}
        previousEvent={previousEvent}
      />

      {/* Dev Panel */}
      <DevPanel
        onExecutePrompt={handleExecutePrompt}
        isProcessing={isProcessingText}
        currentView="colors"
      />

      {/* Tool Result Overlay */}
      <ToolResultOverlay
        result={toolUIState.activeResult}
        isOpen={toolUIState.isOverlayOpen}
        onClose={closeOverlay}
      />
    </div>
  );
};
