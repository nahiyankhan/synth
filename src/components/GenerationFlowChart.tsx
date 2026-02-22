/**
 * GenerationFlowChart - Horizontal flow chart visualization for design language generation
 *
 * Shows all generation phases connected by arrows as solid color cards.
 * Preview of current phase is shown below the flow chart.
 */

import React from "react";
import type { GenerationStatus } from "../hooks/useDesignGeneration";
import {
  GENERATION_PHASES,
  type PhaseConfig,
  type PhaseKey,
  PHASE_BY_KEY,
} from "../constants/generationPhases";
import {
  VisualDirectionPreview,
  TailwindColorsPreview,
  FoundationsPreview,
  TailwindSystemPreview,
  TypographyPreview,
  DesignTokensPreview,
  ComponentCSSPreview,
  ContrastValidationPreview,
} from "./generation/previews";

interface GenerationFlowChartProps {
  status: GenerationStatus;
}

const FlowArrow: React.FC = () => (
  <div className="flex items-center px-2 flex-shrink-0">
    <svg className="w-6 h-3 text-dark-600" viewBox="0 0 24 12">
      <line
        x1="0"
        y1="6"
        x2="16"
        y2="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <polygon points="16,6 10,2 10,10" fill="currentColor" />
    </svg>
  </div>
);

interface FlowNodeProps {
  phase: PhaseConfig;
  isComplete: boolean;
  isCurrent: boolean;
  isPending: boolean;
}

const FlowNode: React.FC<FlowNodeProps> = ({
  phase,
  isComplete,
  isCurrent,
  isPending,
}) => {
  return (
    <div
      className={`px-4 py-2 rounded-lg flex-shrink-0 transition-all duration-300 flex items-center gap-2 ${
        isCurrent
          ? "bg-blue-600"
          : isComplete
          ? "bg-dark-700 opacity-70"
          : "bg-dark-800 opacity-40"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isComplete
            ? "bg-green-400"
            : isCurrent
            ? "bg-white animate-pulse"
            : "bg-dark-500"
        }`}
      />
      <span
        className={`text-sm font-medium ${
          isCurrent ? "text-white" : "text-dark-200"
        }`}
      >
        {phase.label}
      </span>
    </div>
  );
};

// Preview section component
const PhasePreview: React.FC<{
  phaseKey: PhaseKey;
  preview: unknown;
  isGenerating: boolean;
}> = ({ phaseKey, preview, isGenerating }) => {
  if (!preview && !isGenerating) return null;

  const phaseConfig = PHASE_BY_KEY.get(phaseKey);
  const loadingMessage = phaseConfig?.loadingMessage ?? "Generating...";
  const phaseTitle = phaseConfig?.title ?? "";

  return (
    <div className="bg-dark-800 rounded-lg p-6 animate-fade-in">
      <h3 className="text-lg font-medium text-dark-100 mb-4">{phaseTitle}</h3>
      {preview ? (
        <PreviewContent phaseKey={phaseKey} preview={preview} />
      ) : (
        <div className="text-dark-400 text-sm animate-pulse">
          {loadingMessage}
        </div>
      )}
    </div>
  );
};

const PreviewContent: React.FC<{ phaseKey: PhaseKey; preview: unknown }> = ({
  phaseKey,
  preview,
}) => {
  // Type assertion for preview data - each preview component handles its own data shape
  const data = preview as Record<string, unknown>;

  switch (phaseKey) {
    case "visual-direction":
      return <VisualDirectionPreview data={data as Parameters<typeof VisualDirectionPreview>[0]["data"]} />;
    case "tailwind-colors":
      return <TailwindColorsPreview data={data as Parameters<typeof TailwindColorsPreview>[0]["data"]} />;
    case "foundations":
      return <FoundationsPreview data={data as Parameters<typeof FoundationsPreview>[0]["data"]} />;
    case "tailwind-system":
      return <TailwindSystemPreview data={data as Parameters<typeof TailwindSystemPreview>[0]["data"]} />;
    case "typography":
      return <TypographyPreview data={data as Parameters<typeof TypographyPreview>[0]["data"]} />;
    case "design-tokens":
      return <DesignTokensPreview data={data as Parameters<typeof DesignTokensPreview>[0]["data"]} />;
    case "component-css":
      return <ComponentCSSPreview data={data as Parameters<typeof ComponentCSSPreview>[0]["data"]} />;
    case "contrast-validation":
      return <ContrastValidationPreview data={data as Parameters<typeof ContrastValidationPreview>[0]["data"]} />;
    default:
      return null;
  }
};

export const GenerationFlowChart: React.FC<GenerationFlowChartProps> = ({
  status,
}) => {
  const getPhaseState = (phase: PhaseConfig) => {
    const hasPreview = !!status.previews[phase.previewKey as keyof typeof status.previews];
    const isCurrent = status.currentPhase === phase.key;
    const isComplete = hasPreview && !isCurrent;

    const currentIndex = GENERATION_PHASES.findIndex((p) => p.key === status.currentPhase);
    const thisIndex = GENERATION_PHASES.findIndex((p) => p.key === phase.key);
    const isPending = !hasPreview && thisIndex > currentIndex;

    return { isComplete, isCurrent, isPending, hasPreview };
  };

  // Find the current phase to show preview for
  const currentPhaseKey = status.currentPhase as PhaseKey;
  const isComplete = status.currentPhase === "complete" || (!status.isGenerating && status.hasGenerated);

  // Get current preview (handling previewKey mapping)
  const currentPhase = GENERATION_PHASES.find((p) => p.key === currentPhaseKey);
  const currentPreview = currentPhase
    ? status.previews[currentPhase.previewKey as keyof typeof status.previews]
    : undefined;

  return (
    <div className="space-y-6">
      {/* Flow Chart */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex items-center gap-0 min-w-max">
          {GENERATION_PHASES.map((phase, index) => {
            const { isComplete: phaseComplete, isCurrent, isPending } = getPhaseState(phase);

            return (
              <React.Fragment key={phase.key}>
                <FlowNode
                  phase={phase}
                  isComplete={isComplete ? true : phaseComplete}
                  isCurrent={isComplete ? false : isCurrent}
                  isPending={isComplete ? false : isPending}
                />
                {index < GENERATION_PHASES.length - 1 && <FlowArrow />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Preview Section - During Generation */}
      {!isComplete && status.currentPhase !== "idle" && status.currentPhase !== "complete" && currentPhase && (
        <PhasePreview
          phaseKey={currentPhase.key}
          preview={currentPreview}
          isGenerating={status.isGenerating}
        />
      )}

      {/* Preview Section - After Completion: Show all completed phases */}
      {isComplete && (
        <div className="space-y-4">
          {GENERATION_PHASES.map((phase) => {
            const preview = status.previews[phase.previewKey as keyof typeof status.previews];
            if (!preview) return null;

            return (
              <div key={phase.key} className="bg-dark-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-dark-100 mb-4">
                  {phase.label}
                </h3>
                <PreviewContent phaseKey={phase.key} preview={preview} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
