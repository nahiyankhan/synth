/**
 * EditorPage - Gallery view for design language exploration
 *
 * Shows the overview of a loaded design language with navigation cards
 * to different aspects (colors, typography, components, etc.)
 */

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GalleryView } from "../components/GalleryView";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { EditorLayout } from "../components/layouts/EditorLayout";
import { useApp } from "../context/AppContext";
import { useToolCall } from "../context/ToolCallContext";
import { useDesignLanguage } from "../context/DesignLanguageContext";
import { useToolUI } from "../context/ToolUIContext";
import { useDesignLanguageLoader } from "../hooks/useDesignLanguageLoader";
import { useVoiceSession } from "../hooks/useVoiceSession";
import { useToolCallHandler } from "../hooks/useToolCallHandler";
import { useTextSession } from "../hooks/useTextSession";
import { AppState } from "../types/app";

export const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { appState, setAppState } = useApp();
  const { currentEvent, previousEvent } = useToolCall();
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessingText, setIsProcessingText] = useState(false);

  // Load design language
  useDesignLanguageLoader({ skipLoading: false });

  const {
    selectedLanguage,
    setSelectedLanguage,
    currentLanguageMetadata,
    setCurrentLanguageMetadata,
    graph,
    setGraph,
    setToolHandlers,
    setFilteredNodes,
    voiceSearchResults,
    setVoiceSearchResults,
    viewMode,
  } = useDesignLanguage();

  const { state: toolUIState, closeOverlay } = useToolUI();

  // Fade in effect
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect to landing if no language selected
  useEffect(() => {
    if (!selectedLanguage) {
      navigate("/");
    }
  }, [selectedLanguage, navigate]);

  const refreshUI = useCallback(() => {
    if (!graph) return;
    const nodes = graph.getNodes({ excludeSpecs: true });
    setFilteredNodes(nodes);
  }, [graph, setFilteredNodes]);

  const handleCardClick = useCallback(
    (view: string) => {
      navigate(`/editor/${view}`);
    },
    [navigate]
  );

  const clearViews = useCallback(() => {
    navigate("/editor");
  }, [navigate]);

  const setMultiView = useCallback(
    (left: string, right: string) => {
      navigate(`/editor/split?left=${left}&right=${right}`);
    },
    [navigate]
  );

  const toolCallHandler = useToolCallHandler({
    refreshUI,
    setActiveView: (view: string) => {
      if (view === "gallery") {
        clearViews();
      } else {
        handleCardClick(view);
      }
    },
    setMultiView,
  });

  const handleToolCall = useCallback(
    async (toolCall: any, sessionRef: React.MutableRefObject<any>) => {
      await toolCallHandler(toolCall, sessionRef);
    },
    [toolCallHandler]
  );

  const { startSession, stopSession, sendProactiveMessage } = useVoiceSession(
    handleToolCall,
    { currentView: "gallery" }
  );

  const { sendMessage: sendTextMessage } = useTextSession(handleToolCall, {
    currentView: "gallery",
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

  // Proactive follow-up when search results are shown
  useEffect(() => {
    if (
      !voiceSearchResults ||
      appState !== AppState.LISTENING ||
      !sendProactiveMessage
    )
      return;

    const timeoutId = setTimeout(() => {
      const count = voiceSearchResults.length;
      if (count === 0) {
        sendProactiveMessage(
          "No results found for that search. Say: 'Hmm, I didn't find any matches for that. Try a different search term, or I can show you all colors, typography, or size tokens. What would help?'"
        );
      } else if (count > 50) {
        sendProactiveMessage(
          `Search returned ${count} results - that's a lot! Say: 'I found ${count} tokens matching your search. Would you like me to narrow it down by type, like just colors or sizes? Or search for something more specific?'`
        );
      } else if (count === 1) {
        sendProactiveMessage(
          "Found exactly one token! Say: 'Perfect! I found one token that matches. Would you like to update it, see its details, or check what depends on it?'"
        );
      } else {
        sendProactiveMessage(
          `Found ${count} tokens. Say: 'I found ${count} tokens that match. Would you like to update any of them, or would you like me to explain what they do?'`
        );
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [voiceSearchResults, appState, sendProactiveMessage]);

  const handleBack = useCallback(() => {
    setSelectedLanguage(null);
    setCurrentLanguageMetadata(null);
    setGraph(null);
    setToolHandlers(null);
    setAppState(AppState.IDLE);
    navigate("/");
  }, [
    setSelectedLanguage,
    setCurrentLanguageMetadata,
    setGraph,
    setToolHandlers,
    setAppState,
    navigate,
  ]);

  // Loading state
  if (appState === AppState.LOADING) {
    return (
      <div className="h-screen bg-dark-900 text-dark-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-8 h-8 border-2 border-dark-600 border-t-dark-50 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-dark-500 font-light tracking-wide">
            loading design system...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (appState === AppState.ERROR) {
    return (
      <div className="h-screen bg-dark-900 text-dark-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-lg px-4">
          <div className="text-4xl">Warning</div>
          <div>
            <h2 className="text-xl font-medium mb-2">
              Failed to load design system
            </h2>
            <p className="text-sm text-dark-500 mb-4">
              There was an error loading the design system.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-dark-800 text-white rounded hover:bg-dark-700 transition-colors"
            >
              Back to Home
            </button>
            <p className="text-xs text-dark-400 mt-6">
              Check the browser console for detailed error messages.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading graph
  if (!graph || !selectedLanguage) {
    return (
      <div className="h-screen bg-dark-900 text-dark-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-8 h-8 border-2 border-dark-600 border-t-dark-50 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-dark-500 font-light tracking-wide">
            loading design system...
          </p>
        </div>
      </div>
    );
  }

  const segments = [
    { label: "home", href: "/" },
    { label: currentLanguageMetadata?.name || "untitled design language" },
  ];

  return (
    <EditorLayout
      segments={segments}
      isVisible={isVisible}
      dark
      appState={appState}
      currentEvent={currentEvent}
      previousEvent={previousEvent}
      onStartSession={startSession}
      onStopSession={stopSession}
      onExecutePrompt={handleExecutePrompt}
      isProcessing={isProcessingText}
      currentView="gallery"
      toolUIState={toolUIState}
      onCloseOverlay={closeOverlay}
    >
      <ErrorBoundary>
        <GalleryView
          graph={graph}
          viewMode={viewMode}
          hasBrandContext={
            !!currentLanguageMetadata?.generationMetadata?.brandContext
          }
          hasPages={selectedLanguage === "default"}
          hasContent={selectedLanguage === "default"}
        />
      </ErrorBoundary>
    </EditorLayout>
  );
};
