/**
 * GenerationPage - Dedicated page for design system generation
 *
 * Handles the full generation flow including prompt input, phase visualization,
 * and navigation to editor after completion.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GenerationPromptView } from "../components/GenerationPromptView";
import { GenerationErrorBoundary } from "../components/GenerationErrorBoundary";
import { EditorLayout } from "../components/layouts/EditorLayout";
import { useApp } from "../context/AppContext";
import { useToolCall } from "../context/ToolCallContext";
import { useDesignLanguage } from "../context/DesignLanguageContext";
import { useDesignGeneration } from "../hooks/useDesignGeneration";
import { useVoiceSession } from "../hooks/useVoiceSession";
import { AppState } from "../types/app";
import { StyleGraph } from "../core/StyleGraph";
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

  // Create ref to store sessionPromiseRef
  const sessionPromiseRefHolder = useRef<React.MutableRefObject<any> | null>(
    null
  );

  // Handle tool calls - special handling for generate_design_system
  const handleToolCall = useCallback(
    async (toolCall: any) => {
      const functionCall = toolCall.functionCalls?.[0];

      if (functionCall?.name === "generate_design_system") {
        const { prompt } = functionCall.args || {};

        if (prompt) {
          addLog(`Generating design system: ${prompt}`);
          generate(prompt);

          // Send response back to AI (only for voice sessions)
          try {
            if (sessionPromiseRefHolder.current?.current) {
              const session = await sessionPromiseRefHolder.current.current;
              if (session) {
                session.sendToolResponse({
                  functionResponses: [
                    {
                      id: functionCall.id,
                      name: functionCall.name,
                      response: {
                        success: true,
                        message:
                          "Generation started - you will see live updates as phases complete",
                      },
                    },
                  ],
                });
              }
            }
          } catch (error) {
            console.error("Failed to send tool response:", error);
          }
        } else {
          addLog("No prompt provided for generation");
        }
        return;
      }

      // Other tools not handled on this page
      console.warn("Unhandled tool call on generation page:", functionCall?.name);
    },
    [generate, addLog]
  );

  const { startSession, stopSession, sendProactiveMessage, sessionPromiseRef } =
    useVoiceSession(handleToolCall, {
      currentView: "generate",
    });

  // Store sessionPromiseRef in holder
  useEffect(() => {
    sessionPromiseRefHolder.current = sessionPromiseRef;
  }, [sessionPromiseRef]);

  // Send orientation message when entering
  useEffect(() => {
    if (sendProactiveMessage && appState === AppState.IDLE) {
      const timer = setTimeout(() => {
        sendProactiveMessage("What kind of vibe are you going for?");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [sendProactiveMessage, appState]);

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
      appState={appState}
      currentEvent={currentEvent}
      previousEvent={previousEvent}
      onStartSession={startSession}
      onStopSession={stopSession}
      onExecutePrompt={handleExecutePrompt}
      isProcessing={generationStatus.isGenerating}
      currentView="generate"
    >
      <GenerationErrorBoundary onRetry={cancel}>
        <GenerationPromptView
          status={generationStatus}
          onSubmitPrompt={generate}
          isVoiceActive={appState === AppState.LISTENING}
        />
      </GenerationErrorBoundary>
    </EditorLayout>
  );
};
