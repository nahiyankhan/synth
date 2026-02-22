/**
 * GenerationPage - Dedicated page for design system generation
 *
 * Handles the full generation flow including prompt input, phase visualization,
 * and navigation to editor after completion.
 */

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GenerationPromptView } from "../components/GenerationPromptView";
import { GenerationErrorBoundary } from "../components/GenerationErrorBoundary";
import { EditorLayout } from "../components/layouts/EditorLayout";
import { useApp } from "../context/AppContext";
import { useToolCall } from "../context/ToolCallContext";
import { useDesignLanguage } from "../context/DesignLanguageContext";
import { useDesignGeneration } from "../hooks/useDesignGeneration";
import { AppState } from "../types/app";
import { EnhancedToolHandlers } from "../services/enhancedToolHandlers";

export const GenerationPage: React.FC = () => {
  const navigate = useNavigate();
  const { appState, setAppState, addLog } = useApp();
  const { currentEvent, previousEvent } = useToolCall();
  const [isVisible, setIsVisible] = useState(false);

  const {
    setSelectedLanguage,
    setCurrentLanguageMetadata,
    setGraph,
    setToolHandlers,
    setFilteredNodes,
  } = useDesignLanguage();

  // Fade in effect on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Design generation hook
  const {
    status: generationStatus,
    generate,
    cancel,
  } = useDesignGeneration({
    onComplete: (languageId) => {
      try {
        console.log("Generation complete! Language ID:", languageId);
        addLog("Design language generated successfully");
        setSelectedLanguage(languageId);
        setAppState(AppState.IDLE);
        // Delay navigation to let user see the completed generation results
        setTimeout(() => {
          navigate(`/editor?language=${languageId}`, { replace: true });
        }, 3000);
      } catch (error) {
        console.error("Error in onComplete:", error);
        addLog(
          `Error after generation: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setAppState(AppState.ERROR);
      }
    },
    onError: (error) => {
      console.error("Generation error:", error);
      addLog(`Generation failed: ${error}`);
      setAppState(AppState.ERROR);
    },
    onLiveUpdate: (liveGraph, metadata) => {
      setGraph(liveGraph);
      setCurrentLanguageMetadata(metadata);
      setFilteredNodes(liveGraph.getNodes({ excludeSpecs: true }));

      const handlers = new EnhancedToolHandlers(liveGraph);
      setToolHandlers(handlers);
    },
  });

  const handleExecutePrompt = useCallback(
    async (prompt: string) => {
      generate(prompt);
    },
    [generate]
  );

  const segments = [
    { label: "home", href: "/" },
    { label: "create new" },
  ];

  return (
    <EditorLayout
      segments={segments}
      isVisible={isVisible}
      dark
      currentEvent={currentEvent}
      previousEvent={previousEvent}
      onExecutePrompt={handleExecutePrompt}
      isProcessing={generationStatus.isGenerating}
      currentView="generate"
    >
      <GenerationErrorBoundary onRetry={cancel}>
        <GenerationPromptView
          status={generationStatus}
          onSubmitPrompt={generate}
          isVoiceActive={false}
        />
      </GenerationErrorBoundary>
    </EditorLayout>
  );
};
