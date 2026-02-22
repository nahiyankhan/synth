/**
 * Generation Phases Configuration
 *
 * Single source of truth for generation pipeline phases.
 * Used by GenerationFlowChart, useDesignGeneration, and orchestrator.
 */

/**
 * Phase keys as they appear in the generation pipeline
 */
export type PhaseKey =
  | "visual-direction"
  | "tailwind-colors"
  | "foundations"
  | "tailwind-system"
  | "typography"
  | "design-tokens"
  | "component-css"
  | "contrast-validation";

/**
 * All valid phase states including idle and complete
 */
export type PhaseState = "idle" | PhaseKey | "complete";

/**
 * Configuration for a single generation phase
 */
export interface PhaseConfig {
  /** Unique key for the phase (kebab-case) */
  key: PhaseKey;
  /** Display label for UI */
  label: string;
  /** Key used in previews object (camelCase, defaults to camelCase of key) */
  previewKey: string;
  /** Step number in orchestrator (1-indexed) */
  stepNumber: number;
  /** Message shown during loading */
  loadingMessage: string;
  /** Full title for phase details */
  title: string;
}

/**
 * All generation phases in order
 */
export const GENERATION_PHASES: readonly PhaseConfig[] = [
  {
    key: "visual-direction",
    label: "Direction",
    previewKey: "visualDirection",
    stepNumber: 1,
    loadingMessage: "Developing visual direction...",
    title: "Visual Direction",
  },
  {
    key: "tailwind-colors",
    label: "Colors",
    previewKey: "tailwindColors",
    stepNumber: 2,
    loadingMessage: "Generating Tailwind colors...",
    title: "Tailwind Colors",
  },
  {
    key: "foundations",
    label: "Foundations",
    previewKey: "foundations",
    stepNumber: 3,
    loadingMessage: "Creating foundation tokens...",
    title: "Design Foundations",
  },
  {
    key: "tailwind-system",
    label: "System",
    previewKey: "tailwindSystem",
    stepNumber: 4,
    loadingMessage: "Building color system...",
    title: "Tailwind System",
  },
  {
    key: "typography",
    label: "Typography",
    previewKey: "typography",
    stepNumber: 5,
    loadingMessage: "Generating typography scale...",
    title: "Typography",
  },
  {
    key: "design-tokens",
    label: "Tokens",
    previewKey: "designTokens",
    stepNumber: 6,
    loadingMessage: "Building design tokens...",
    title: "Design Tokens",
  },
  {
    key: "component-css",
    label: "Components",
    previewKey: "componentCSS",
    stepNumber: 7,
    loadingMessage: "Generating component styles...",
    title: "Component CSS",
  },
  {
    key: "contrast-validation",
    label: "Validation",
    previewKey: "contrastValidation",
    stepNumber: 8,
    loadingMessage: "Validating contrast ratios...",
    title: "Contrast Validation",
  },
] as const;

/**
 * Preview keys (camelCase versions of phase keys)
 */
export type PreviewKey =
  | "visualDirection"
  | "tailwindColors"
  | "foundations"
  | "tailwindSystem"
  | "typography"
  | "designTokens"
  | "componentCSS"
  | "contrastValidation";

/**
 * Map of step number to phase config
 */
export const PHASE_BY_STEP = new Map<number, PhaseConfig>(
  GENERATION_PHASES.map((phase) => [phase.stepNumber, phase])
);

/**
 * Map of phase key to phase config
 */
export const PHASE_BY_KEY = new Map<PhaseKey, PhaseConfig>(
  GENERATION_PHASES.map((phase) => [phase.key, phase])
);

/**
 * Map step number to phase key
 * Derived from GENERATION_PHASES - single source of truth
 */
export const STEP_TO_PHASE: Record<number, PhaseKey> = Object.fromEntries(
  GENERATION_PHASES.map((phase) => [phase.stepNumber, phase.key])
) as Record<number, PhaseKey>;

/**
 * Map step number to preview key
 * Derived from GENERATION_PHASES - single source of truth
 */
export const STEP_TO_PREVIEW_KEY: Record<number, PreviewKey> = Object.fromEntries(
  GENERATION_PHASES.map((phase) => [phase.stepNumber, phase.previewKey])
) as Record<number, PreviewKey>;

/**
 * Map phase key to preview key
 * Derived from GENERATION_PHASES - single source of truth
 */
export const PHASE_TO_PREVIEW_KEY: Record<PhaseKey, PreviewKey> = Object.fromEntries(
  GENERATION_PHASES.map((phase) => [phase.key, phase.previewKey])
) as Record<PhaseKey, PreviewKey>;

/**
 * All phase keys in order (for iteration)
 */
export const ALL_PHASE_KEYS: readonly PhaseKey[] = GENERATION_PHASES.map((p) => p.key);

/**
 * Get preview key for a phase (camelCase version of the key)
 */
export function getPreviewKey(phaseKey: PhaseKey): string {
  return PHASE_BY_KEY.get(phaseKey)?.previewKey ?? phaseKey;
}

/**
 * Get phase config by step number
 */
export function getPhaseByStep(stepNumber: number): PhaseConfig | undefined {
  return PHASE_BY_STEP.get(stepNumber);
}

/**
 * Check if a phase is complete based on current phase
 */
export function isPhaseComplete(phaseKey: PhaseKey, currentPhase: PhaseState): boolean {
  if (currentPhase === "complete") return true;
  if (currentPhase === "idle") return false;

  const phaseIndex = GENERATION_PHASES.findIndex((p) => p.key === phaseKey);
  const currentIndex = GENERATION_PHASES.findIndex((p) => p.key === currentPhase);

  return phaseIndex < currentIndex;
}

/**
 * Check if a phase is the current active phase
 */
export function isPhaseCurrent(phaseKey: PhaseKey, currentPhase: PhaseState): boolean {
  return phaseKey === currentPhase;
}

/**
 * Get the next phase after the given phase
 */
export function getNextPhase(currentPhase: PhaseState): PhaseState {
  if (currentPhase === "idle") return GENERATION_PHASES[0].key;
  if (currentPhase === "complete") return "complete";

  const currentIndex = GENERATION_PHASES.findIndex((p) => p.key === currentPhase);
  if (currentIndex === -1 || currentIndex >= GENERATION_PHASES.length - 1) {
    return "complete";
  }

  return GENERATION_PHASES[currentIndex + 1].key;
}
