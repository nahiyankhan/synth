import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ColorView } from "@/components/ColorView";
import { TypographyView } from "@/components/TypographyView";
import { SizesView } from "@/components/SpacingView";
import { ComponentsView } from "@/components/ComponentsView";
import { ContentView } from "@/components/ContentView";
import { PagesView } from "@/components/PagesView";
import { ToolCallDisplay } from "@/components/ToolCallDisplay";
import { DevPanel } from "@/components/DevPanel";
import { ToolResultOverlay } from "@/components/tool-results";
import { useToolCall } from "@/context/ToolCallContext";
import { useDesignLanguage } from "@/context/DesignLanguageContext";
import { useToolUI } from "@/context/ToolUIContext";
import { useDesignLanguageLoader } from "@/hooks/useDesignLanguageLoader";
import { useToolCallHandler } from "@/hooks/useToolCallHandler";
import { useTextSession } from "@/hooks/useTextSession";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleMode } from "@/types/styleGraph";

type ViewType =
  | "colors"
  | "typography"
  | "sizes"
  | "components"
  | "content"
  | "pages"
  | "visual-direction";

const renderView = (
  view: ViewType,
  graph: StyleGraph,
  viewMode: StyleMode,
  voiceSearchResults: any,
  setVoiceSearchResults: any
) => {
  switch (view) {
    case "colors":
      return (
        <ColorView
          graph={graph}
          viewMode={viewMode}
          filteredNodes={voiceSearchResults}
          onClearFilter={() => setVoiceSearchResults(null)}
        />
      );
    case "typography":
      return (
        <TypographyView
          graph={graph}
          viewMode={viewMode}
          filteredNodes={voiceSearchResults}
          onClearFilter={() => setVoiceSearchResults(null)}
          typographyNodes={graph.getNodes({ type: "typography" })}
        />
      );
    case "sizes":
      return (
        <SizesView
          graph={graph}
          viewMode={viewMode}
          filteredNodes={voiceSearchResults}
          onClearFilter={() => setVoiceSearchResults(null)}
          sizeNodes={graph.getNodes({ type: "size" })}
        />
      );
    case "components":
      return <ComponentsView graph={graph} viewMode={viewMode} />;
    case "content":
      return <ContentView viewMode={viewMode} />;
    case "pages":
      return <PagesView graph={graph} viewMode={viewMode} />;
    default:
      return <div>View not found</div>;
  }
};

export const SplitPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentEvent, previousEvent } = useToolCall();
  const [isVisible, setIsVisible] = useState(false);

  useDesignLanguageLoader({ skipLoading: false });
  const {
    selectedLanguage,
    currentLanguageMetadata,
    graph,
    viewMode,
    voiceSearchResults,
    setVoiceSearchResults,
  } = useDesignLanguage();

  const [isProcessingText, setIsProcessingText] = useState<boolean>(false);

  const { state: toolUIState, closeOverlay } = useToolUI();

  const refreshUI = useCallback(() => {}, []);

  const handleCardClick = useCallback(
    (view: string) => {
      navigate(`/editor/${view}`);
    },
    [navigate]
  );

  const setMultiView = useCallback(
    (left: string, right: string) => {
      navigate(`/editor/split?left=${left}&right=${right}`);
    },
    [navigate]
  );

  const handleToolCall = useToolCallHandler({
    refreshUI,
    setActiveView: handleCardClick,
    setMultiView,
  });

  const { sendMessage: sendTextMessage } = useTextSession(handleToolCall, {
    currentView: null,
  });

  const handleExecutePrompt = useCallback(
    async (prompt: string) => {
      setIsProcessingText(true);
      try {
        await sendTextMessage(prompt);
      } finally {
        setIsProcessingText(false);
      }
    },
    [sendTextMessage]
  );

  const leftView = searchParams.get("left") as ViewType | null;
  const rightView = searchParams.get("right") as ViewType | null;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!selectedLanguage) {
      navigate("/");
    }
  }, [selectedLanguage, navigate]);

  useEffect(() => {
    if (!leftView || !rightView) {
      navigate("/editor");
    }
  }, [leftView, rightView, navigate]);

  if (!graph || !selectedLanguage) {
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

  if (!leftView || !rightView) {
    return null;
  }

  return (
    <div
      className="h-screen bg-dark-50 text-dark-900 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="w-full bg-dark-50 z-40 shrink-0 border-b border-dark-200">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="text-sm font-mono tracking-tight text-dark-400 hover:text-dark-900 transition-colors"
            >
              home
            </button>
            <span className="text-sm font-mono tracking-tight text-dark-400">
              .
            </span>
            <button
              onClick={() => navigate("/editor")}
              className="text-sm font-mono tracking-tight text-dark-400 hover:text-dark-900 transition-colors lowercase"
            >
              {currentLanguageMetadata?.name || "untitled"}
            </button>
            <span className="text-sm font-mono tracking-tight text-dark-400">
              .
            </span>
            <h1 className="text-sm font-mono tracking-tight text-dark-900">
              {leftView} + {rightView}
            </h1>
          </div>
        </div>
      </div>

      {/* Split View Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel */}
        <div className="flex-1 h-full bg-dark-50 border border-dark-200 overflow-hidden flex flex-col">
          <div className="p-4 shrink-0">
            <h3 className="text-base font-mono lowercase text-dark-900">
              {leftView}
            </h3>
          </div>
          <div
            className={`flex-1 ${
              leftView === "colors" ? "overflow-hidden" : "overflow-y-auto"
            }`}
          >
            {renderView(
              leftView,
              graph,
              viewMode,
              voiceSearchResults,
              setVoiceSearchResults
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 h-full bg-dark-50 border border-dark-200 overflow-hidden flex flex-col">
          <div className="p-4 shrink-0">
            <h3 className="text-base font-mono lowercase text-dark-900">
              {rightView}
            </h3>
          </div>
          <div
            className={`flex-1 ${
              rightView === "colors" ? "overflow-hidden" : "overflow-y-auto"
            }`}
          >
            {renderView(
              rightView,
              graph,
              viewMode,
              voiceSearchResults,
              setVoiceSearchResults
            )}
          </div>
        </div>
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
        currentView="split"
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
