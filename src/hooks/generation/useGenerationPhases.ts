/**
 * useGenerationPhases - Hook for managing generation phase state
 *
 * Handles phase transitions and preview data for the design generation flow.
 * Uses centralized phase configuration from generationPhases.ts.
 */

import { useState, useCallback } from "react";
import {
  type PhaseKey,
  type PhaseState,
  type PreviewKey,
  STEP_TO_PHASE,
  STEP_TO_PREVIEW_KEY,
  PHASE_TO_PREVIEW_KEY,
  ALL_PHASE_KEYS,
} from "@/constants/generationPhases";

export type GenerationPhase = PhaseState;

export interface GenerationPreviews {
  visualDirection?: unknown;
  tailwindColors?: unknown;
  foundations?: unknown;
  tailwindSystem?: unknown;
  typography?: unknown;
  designTokens?: unknown;
  componentCSS?: unknown;
  contrastValidation?: unknown;
}

export interface GenerationPhaseState {
  isGenerating: boolean;
  hasGenerated: boolean;
  currentPhase: GenerationPhase;
  statusMessage?: string;
  completedPhases: Set<PhaseKey>;
  previews: GenerationPreviews;
}

const initialState: GenerationPhaseState = {
  isGenerating: false,
  hasGenerated: false,
  currentPhase: "idle",
  completedPhases: new Set(),
  previews: {},
};

export interface UseGenerationPhasesReturn {
  state: GenerationPhaseState;
  /** Check if a specific phase is complete */
  isPhaseComplete: (phase: PhaseKey) => boolean;
  /** Start generation - resets state and sets to generating */
  startGeneration: () => void;
  /** Update status message */
  setStatusMessage: (message: string) => void;
  /** Set current phase (triggered by phase-start event) */
  setCurrentPhase: (phase: string) => void;
  /** Process a step completion */
  processStep: (stepNumber: number, payload: unknown) => void;
  /** Process a stream update */
  processStream: (phase: string, content: string) => void;
  /** Mark generation as complete with final previews */
  completeGeneration: (finalPreviews: GenerationPreviews) => void;
  /** Mark generation as errored */
  errorGeneration: () => void;
  /** Cancel/reset generation */
  resetGeneration: () => void;
}

/**
 * Hook for managing generation phase state machine.
 */
export function useGenerationPhases(): UseGenerationPhasesReturn {
  const [state, setState] = useState<GenerationPhaseState>(initialState);

  const isPhaseComplete = useCallback(
    (phase: PhaseKey) => state.completedPhases.has(phase),
    [state.completedPhases]
  );

  const startGeneration = useCallback(() => {
    // Start with empty completedPhases - phases are marked complete only when they actually complete
    setState({
      isGenerating: true,
      hasGenerated: false,
      currentPhase: "visual-direction",
      completedPhases: new Set(),
      previews: {},
    });
  }, []);

  const setStatusMessage = useCallback((message: string) => {
    setState((prev) => ({ ...prev, statusMessage: message }));
  }, []);

  const setCurrentPhase = useCallback((phase: string) => {
    // Only update currentPhase - completion is handled by processStep
    setState((prev) => ({
      ...prev,
      currentPhase: phase as GenerationPhase,
    }));
  }, []);

  const processStep = useCallback((stepNumber: number, payload: unknown) => {
    const phase = STEP_TO_PHASE[stepNumber];
    const previewKey = STEP_TO_PREVIEW_KEY[stepNumber];

    if (!phase || !previewKey) return;

    setState((prev) => {
      const newCompletedPhases = new Set(prev.completedPhases);

      // Mark this phase and all previous phases as complete
      const phaseIndex = ALL_PHASE_KEYS.indexOf(phase);
      for (let i = 0; i <= phaseIndex; i++) {
        newCompletedPhases.add(ALL_PHASE_KEYS[i]);
      }

      // For component-css (step 7), merge with existing stream data instead of overwriting
      let newPreviewValue = payload;
      if (previewKey === "componentCSS" && prev.previews.componentCSS) {
        const existingPreview = prev.previews.componentCSS as Record<string, unknown>;
        newPreviewValue = {
          ...existingPreview,
          ...(payload as Record<string, unknown>),
          generating: false, // Mark as no longer generating
        };
      }

      return {
        ...prev,
        currentPhase: phase,
        completedPhases: newCompletedPhases,
        previews: {
          ...prev.previews,
          [previewKey]: newPreviewValue,
        },
      };
    });
  }, []);

  const processStream = useCallback((phase: string, content: string) => {
    const previewKey = PHASE_TO_PREVIEW_KEY[phase as PhaseKey];
    if (!previewKey) return;

    // component-css streams raw text - track progress
    if (phase === "component-css") {
      const lines = content.split("\n");
      const lineCount = lines.length;
      const charCount = content.length;
      // Get last few non-empty lines as preview
      const recentLines = lines
        .filter((line) => line.trim().length > 0)
        .slice(-5)
        .join("\n");

      setState((prev) => ({
        ...prev,
        currentPhase: "component-css",
        previews: {
          ...prev.previews,
          componentCSS: {
            generating: true,
            charCount,
            lineCount,
            preview: recentLines,
          },
        },
      }));
      return;
    }

    // Other phases stream JSON
    try {
      const parsed = JSON.parse(content);

      setState((prev) => ({
        ...prev,
        currentPhase: phase as GenerationPhase,
        previews: {
          ...prev.previews,
          [previewKey]: parsed,
        },
      }));
    } catch {
      // Ignore parse errors - content may be partial JSON
    }
  }, []);

  const completeGeneration = useCallback((finalPreviews: GenerationPreviews) => {
    setState({
      isGenerating: false,
      hasGenerated: true,
      currentPhase: "complete",
      completedPhases: new Set(ALL_PHASE_KEYS),
      previews: finalPreviews,
    });
  }, []);

  const errorGeneration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      currentPhase: "idle",
    }));
  }, []);

  const resetGeneration = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    isPhaseComplete,
    startGeneration,
    setStatusMessage,
    setCurrentPhase,
    processStep,
    processStream,
    completeGeneration,
    errorGeneration,
    resetGeneration,
  };
}
