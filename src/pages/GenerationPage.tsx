/**
 * GenerationPage - Circular generation experience
 *
 * Full-screen circular UI for design system generation.
 * Auto-starts generation if prompt is passed via router state.
 */

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CircularGenerationView } from "@/components/CircularGenerationView";
import { useApp } from "@/context/AppContext";
import { useDesignLanguage } from "@/context/DesignLanguageContext";
import { useDesignGeneration } from "@/hooks/useDesignGeneration";
import { AppState } from "@/types/app";
import { ToolRegistryAdapter } from "@/services/ToolRegistryAdapter";

export const GenerationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAppState, addLog } = useApp();
  const hasStartedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  const {
    setSelectedLanguage,
    setCurrentLanguageMetadata,
    setGraph,
    setToolHandlers,
    setFilteredNodes,
  } = useDesignLanguage();

  // Get prompt from router state (passed from LandingPage)
  const initialPrompt = (location.state as { prompt?: string })?.prompt;

  // Fade in on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Design generation hook
  const { status, generate, cancel } = useDesignGeneration({
    onComplete: (languageId) => {
      console.log("Generation complete! Language ID:", languageId);
      addLog("Design language generated successfully");
      setSelectedLanguage(languageId);
      setAppState(AppState.IDLE);

      // Navigate to editor after a brief delay to show success
      setTimeout(() => {
        navigate(`/editor?language=${languageId}`, {
          replace: true,
          viewTransition: true,
        });
      }, 2000);
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

      const handlers = new ToolRegistryAdapter(liveGraph);
      setToolHandlers(handlers);
    },
  });

  // Auto-start generation if prompt provided
  // Note: Only attempt once - don't retry on error
  useEffect(() => {
    if (initialPrompt && !hasStartedRef.current) {
      hasStartedRef.current = true;
      console.log("Auto-starting generation with prompt:", initialPrompt);
      generate(initialPrompt);
    }
  }, [initialPrompt, generate]);

  // Handle back navigation
  const handleBack = () => {
    if (status.isGenerating) {
      cancel();
    }
    navigate("/", { viewTransition: true });
  };

  return (
    <div
      className={`min-h-screen w-full bg-cream-100 transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Back button */}
      <div className="fixed top-6 left-6 z-10">
        <button
          onClick={handleBack}
          className="px-4 py-2 text-sm text-cream-600 hover:text-cream-800 transition-colors"
        >
          {status.isGenerating ? "Cancel" : "Back"}
        </button>
      </div>

      {/* Main content */}
      <CircularGenerationView status={status} />

      {/* Prompt display */}
      {initialPrompt && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 max-w-md">
          <p className="text-sm text-cream-500 text-center truncate">
            "{initialPrompt}"
          </p>
        </div>
      )}
    </div>
  );
};
