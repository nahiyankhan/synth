import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SizesView } from "@/components/SpacingView";
import { ToolCallDisplay } from "@/components/ToolCallDisplay";
import { DevPanel } from "@/components/DevPanel";
import { ToolResultOverlay } from "@/components/tool-results";
import { useToolCall } from "@/context/ToolCallContext";
import { useDesignLanguage } from "@/context/DesignLanguageContext";
import { useToolUI } from "@/context/ToolUIContext";
import { useDesignLanguageLoader } from "@/hooks/useDesignLanguageLoader";
import { useToolCallHandler } from "@/hooks/useToolCallHandler";
import { useTextSession } from "@/hooks/useTextSession";

export const SizesPage: React.FC = () => {
  const navigate = useNavigate();
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

  const handleCardClick = useCallback((view: string) => {
    navigate(`/editor/${view}`);
  }, [navigate]);

  const setMultiView = useCallback((left: string, right: string) => {
    navigate(`/editor/split?left=${left}&right=${right}`);
  }, [navigate]);

  const toolCallHandler = useToolCallHandler({
    refreshUI,
    setActiveView: handleCardClick,
    setMultiView,
  });

  const handleToolCall = useCallback(
    async (toolCall: any) => {
      await toolCallHandler(toolCall, { current: null });
    },
    [toolCallHandler]
  );

  const { sendMessage: sendTextMessage } = useTextSession(toolCallHandler, {
    currentView: "sizes",
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

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!selectedLanguage) {
      navigate("/");
    }
  }, [selectedLanguage, navigate]);

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
            spacing
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <SizesView
          graph={graph}
          viewMode={viewMode}
          filteredNodes={voiceSearchResults}
          onClearFilter={() => setVoiceSearchResults(null)}
          sizeNodes={graph.getNodes({ type: "size" })}
        />
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
        currentView="sizes"
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
