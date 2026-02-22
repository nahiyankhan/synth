/**
 * CircularGenerationView - AISignal-centered generation visualization
 *
 * Streaming elements appear around the AISignal during each phase,
 * then the entire content sweeps off-screen along an arc as the next
 * phase's content sweeps in from the other side.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AISignal, type AISignalState } from "@/components/AISignal";
import { GENERATION_PHASES, PHASE_COLORS, type PhaseKey } from "@/constants/generationPhases";
import type { GenerationStatus } from "@/hooks/useDesignGeneration";
import { useArcAnimation } from "@/hooks/useArcAnimation";
import {
  StreamContainer,
  StreamElement,
  getPhaseElements,
} from "@/components/generation";

interface CircularGenerationViewProps {
  status: GenerationStatus;
}

const TRANSITION_OVERLAP = 450;
const CONTAINER_SIZE = 600;

export const CircularGenerationView: React.FC<CircularGenerationViewProps> = ({
  status,
}) => {
  const containerARef = useRef<HTMLDivElement>(null);
  const containerBRef = useRef<HTMLDivElement>(null);
  const [activeContainer, setActiveContainer] = useState<"A" | "B">("A");
  const [displayedPhase, setDisplayedPhase] = useState<PhaseKey | null>(null);
  const [elementsVisible, setElementsVisible] = useState(false);
  const [isMorphing, setIsMorphing] = useState(false);
  const previousPhaseRef = useRef<PhaseKey | null>(null);
  const isTransitioningRef = useRef(false);

  const arc = useArcAnimation();

  const currentPhaseKey = status.currentPhase as PhaseKey;
  const isGenerating = status.isGenerating;
  const isComplete =
    status.currentPhase === "complete" ||
    (!isGenerating && status.hasGenerated);

  // Get current container ref
  const getContainer = useCallback(
    (which: "A" | "B") => {
      return which === "A" ? containerARef.current : containerBRef.current;
    },
    []
  );

  // Morph AISignal colors
  const morphAISignal = useCallback((phase: PhaseKey) => {
    setIsMorphing(true);
    setTimeout(() => setIsMorphing(false), 400);
  }, []);

  // Enter first phase
  const enterFirstPhase = useCallback(
    async (phase: PhaseKey) => {
      const container = getContainer(activeContainer);
      if (!container) return;

      setDisplayedPhase(phase);
      arc.setPosition(container, arc.config.entryAngle);

      // Start arc animation
      const arcPromise = arc.animateEnter(container);

      // Start morph partway through
      setTimeout(() => morphAISignal(phase), arc.config.duration * 0.4);

      // Show elements when container arrives
      setTimeout(() => setElementsVisible(true), arc.config.duration * 0.6);

      await arcPromise;
    },
    [activeContainer, arc, getContainer, morphAISignal]
  );

  // Transition to next phase
  const transitionToNextPhase = useCallback(
    async (nextPhase: PhaseKey) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      const exitingContainer = getContainer(activeContainer);
      const nextContainer = activeContainer === "A" ? "B" : "A";
      const enteringContainer = getContainer(nextContainer);

      if (!exitingContainer || !enteringContainer) {
        isTransitioningRef.current = false;
        return;
      }

      // Hide elements before exit
      setElementsVisible(false);

      // Prepare entering container
      arc.setPosition(enteringContainer, arc.config.entryAngle);

      // Start exit animation
      const exitPromise = arc.animateExit(exitingContainer);

      // After overlap delay, start enter animation
      await new Promise((r) => setTimeout(r, TRANSITION_OVERLAP));

      // Switch to new container and phase
      setActiveContainer(nextContainer);
      setDisplayedPhase(nextPhase);
      morphAISignal(nextPhase);

      // Show elements for new phase
      setTimeout(() => setElementsVisible(true), arc.config.duration * 0.4);

      // Start entering
      const enterPromise = arc.animateEnter(enteringContainer);

      await Promise.all([exitPromise, enterPromise]);
      isTransitioningRef.current = false;
    },
    [activeContainer, arc, getContainer, morphAISignal]
  );

  // Exit last phase
  const exitLastPhase = useCallback(async () => {
    const container = getContainer(activeContainer);
    if (!container) return;

    setElementsVisible(false);
    await arc.animateExit(container);
    setDisplayedPhase(null);
  }, [activeContainer, arc, getContainer]);

  // Handle phase changes
  useEffect(() => {
    if (currentPhaseKey === "idle" || currentPhaseKey === "complete") {
      return;
    }

    const isValidPhase = GENERATION_PHASES.some((p) => p.key === currentPhaseKey);
    if (!isValidPhase) return;

    // New phase detected
    if (previousPhaseRef.current !== currentPhaseKey) {
      if (previousPhaseRef.current && displayedPhase) {
        // Transition to next phase
        transitionToNextPhase(currentPhaseKey);
      } else {
        // First phase
        enterFirstPhase(currentPhaseKey);
      }
      previousPhaseRef.current = currentPhaseKey;
    }
  }, [currentPhaseKey, displayedPhase, enterFirstPhase, transitionToNextPhase]);

  // Handle completion
  useEffect(() => {
    if (isComplete && displayedPhase) {
      exitLastPhase();
    }
  }, [isComplete, displayedPhase, exitLastPhase]);

  // Initialize container positions
  useEffect(() => {
    const containerA = containerARef.current;
    const containerB = containerBRef.current;
    if (containerA) arc.setPosition(containerA, arc.config.entryAngle);
    if (containerB) arc.setPosition(containerB, arc.config.entryAngle);
  }, [arc]);

  // AISignal state
  const getAISignalState = (): AISignalState => {
    if (isComplete) return "success";
    if (!isGenerating) return "idle";
    if (currentPhaseKey === "component-css") return "streaming";
    return "processing";
  };

  // Get colors for current phase
  const currentColors = displayedPhase
    ? PHASE_COLORS[displayedPhase]
    : PHASE_COLORS["visual-direction"];

  // Get elements for current phase from real preview data
  const currentElements = useMemo(() => {
    if (!displayedPhase) return [];
    // Type assertion needed because status.previews is typed as Record<string, unknown>
    const previews = status.previews as Record<string, unknown>;
    return getPhaseElements(displayedPhase, previews);
  }, [displayedPhase, status.previews]);

  // Phase info
  const currentIndex = GENERATION_PHASES.findIndex((p) => p.key === currentPhaseKey);
  const currentPhaseConfig = GENERATION_PHASES.find((p) => p.key === displayedPhase);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-cream-100 overflow-hidden relative">
      {/* Stream containers */}
      <StreamContainer ref={containerARef} size={CONTAINER_SIZE} className="z-20">
        {activeContainer === "A" &&
          currentElements.map((config, i) => (
            <StreamElement
              key={`a-${i}`}
              config={config}
              index={i}
              total={currentElements.length}
              visible={elementsVisible}
              containerSize={CONTAINER_SIZE}
            />
          ))}
      </StreamContainer>

      <StreamContainer ref={containerBRef} size={CONTAINER_SIZE} className="z-20">
        {activeContainer === "B" &&
          currentElements.map((config, i) => (
            <StreamElement
              key={`b-${i}`}
              config={config}
              index={i}
              total={currentElements.length}
              visible={elementsVisible}
              containerSize={CONTAINER_SIZE}
            />
          ))}
      </StreamContainer>

      {/* AISignal - dead center, always visible */}
      <div
        className={`relative z-50 transition-transform duration-400 ${
          isMorphing ? "scale-95" : "scale-100"
        }`}
        style={{
          // CSS variables for phase colors
          ["--phase-color-1" as string]: currentColors[0],
          ["--phase-color-2" as string]: currentColors[1],
          ["--phase-color-3" as string]: currentColors[2],
        }}
      >
        <AISignal
          state={getAISignalState()}
          size={180}
          showOrbitCircles={true}
          className="text-cream-500"
        />
      </div>

      {/* Phase label - below AISignal */}
      <div className="absolute top-[calc(50%+120px)] left-1/2 -translate-x-1/2 text-center z-60">
        {isGenerating && currentPhaseConfig && (
          <div
            className={`transition-opacity duration-300 ${
              elementsVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="text-lg font-medium text-cream-800">
              {currentPhaseConfig.title}
            </p>
            <p className="text-sm text-cream-500 mt-1">
              {currentPhaseConfig.loadingMessage}
            </p>
          </div>
        )}

        {isComplete && (
          <div className="animate-fade-in">
            <p className="text-lg font-medium text-green-600">Complete</p>
            <p className="text-sm text-cream-500 mt-1">
              Design language generated
            </p>
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div className="absolute top-[calc(50%+200px)] left-1/2 -translate-x-1/2 z-60">
        <div className="flex items-center gap-2">
          {GENERATION_PHASES.map((phase) => {
            const isPhaseComplete = status.completedPhases.has(phase.key);
            const isCurrent = phase.key === currentPhaseKey;

            return (
              <div
                key={phase.key}
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${isCurrent ? "w-6 bg-cream-800" : "w-2"}
                  ${isPhaseComplete ? "bg-green-500" : isCurrent ? "" : "bg-cream-300"}
                `}
              />
            );
          })}
        </div>

        {isGenerating && currentIndex >= 0 && (
          <p className="text-center text-xs text-cream-400 mt-2 font-mono">
            {currentIndex + 1} / {GENERATION_PHASES.length}
          </p>
        )}
      </div>
    </div>
  );
};

export default CircularGenerationView;
