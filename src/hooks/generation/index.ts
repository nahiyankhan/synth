/**
 * Generation Hooks
 *
 * Hooks for managing design system generation.
 */

export { useSSEConnection } from "./useSSEConnection";
export type { SSEEvent, UseSSEConnectionOptions, SSEConnectionReturn } from "./useSSEConnection";

export { useGenerationPhases } from "./useGenerationPhases";
export type {
  GenerationPhase,
  GenerationPreviews,
  GenerationPhaseState,
  UseGenerationPhasesReturn,
} from "./useGenerationPhases";
