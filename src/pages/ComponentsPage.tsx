import React from "react";
import { ComponentsView } from "@/components/ComponentsView";
import { ToolCallDisplay } from "@/components/ToolCallDisplay";
import { DevPanel } from "@/components/DevPanel";
import { useViewPage } from "@/hooks/useViewPage";

export const ComponentsPage: React.FC = () => {
  const {
    navigate,
    currentEvent,
    previousEvent,
    currentLanguageMetadata,
    graph,
    viewMode,
    isVisible,
    handleExecutePrompt,
    isLoading,
    isProcessingText,
  } = useViewPage({ currentView: "components" });

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
    <div className="h-screen bg-white text-dark-900 flex flex-col overflow-hidden">
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
            components
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ComponentsView graph={graph!} viewMode={viewMode} />
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
        currentView="components"
      />
    </div>
  );
};
