/**
 * useDesignGeneration - Hook for managing design system generation via SSE
 *
 * Orchestrates SSE connection and phase state management for design generation.
 */

import { useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import { StyleGraph } from "@/core/StyleGraph";
import {
  saveDesignLanguage,
  type DesignLanguageMetadata,
} from "@/services/designLanguageDB";
import type { StyleNode } from "@/types/styleGraph";
import type { ImageAttachment } from "@/types/multimodal";
import { oklchToHex } from "@/services/colorScience";
import { applyTailwindColorSystem, applyDesignLanguageCSS } from "@/services/themeService";
import {
  useSSEConnection,
  useGenerationPhases,
  type GenerationPreviews,
  type GenerationPhaseState,
} from "./generation";

// Re-export types for backwards compatibility
export type GenerationStatus = GenerationPhaseState;

export interface UseDesignGenerationProps {
  onComplete?: (languageId: string) => void;
  onError?: (error: string) => void;
  onLiveUpdate?: (graph: StyleGraph, metadata: DesignLanguageMetadata) => void;
}

/**
 * Generate a name from the prompt (first few significant words)
 */
function generateNameFromPrompt(prompt: string): string {
  const words = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["for", "the", "and", "with"].includes(w))
    .slice(0, 2);

  return words.length > 0 ? words.join(" ") : "generated design system";
}

/**
 * Process the complete event and save the design language.
 */
async function processCompleteEvent(
  result: Record<string, unknown>,
  generationId: string,
  liveMetadata: DesignLanguageMetadata,
  prompt: string,
  onComplete?: (languageId: string) => void,
  onError?: (error: string) => void
): Promise<GenerationPreviews> {
  if (!result) {
    throw new Error("No result data received in complete event");
  }

  const styleGraphNodes = (result.styleGraphNodes as StyleNode[]) || [];
  console.log(`📊 Received ${styleGraphNodes.length} style nodes`);

  // Create StyleGraph
  const styleGraph = new StyleGraph();
  styleGraphNodes.forEach((node) => {
    styleGraph.nodes.set(node.id, node);
  });

  // Compute primary color from seeds
  let primaryColor: string | undefined;
  const colorSeeds = result.colorSeeds as { primaryHue?: number; primaryChroma?: number } | undefined;
  if (colorSeeds) {
    try {
      const hue = colorSeeds.primaryHue;
      const chroma = colorSeeds.primaryChroma;
      if (hue !== undefined && chroma !== undefined) {
        primaryColor = oklchToHex({ l: 0.5, c: chroma, h: hue });
      }
    } catch (e) {
      console.warn("Failed to compute primary color:", e);
    }
  }

  // Apply full design language CSS
  if (result.fullCSS) {
    console.log("🎨 Applying full design language CSS...");
    applyDesignLanguageCSS(result.fullCSS as string);
  } else if (result.colorSystem) {
    console.log("🎨 Applying Tailwind color system CSS (no component CSS)...");
    applyTailwindColorSystem(result.colorSystem as Record<string, unknown>);
  }

  // Create metadata
  const visualDirection = result.visualDirection as { name?: string; summary?: string } | undefined;
  const colorSystem = result.colorSystem as { summary?: Record<string, unknown>; css?: string } | undefined;
  const foundationSeeds = result.foundationSeeds as Record<string, unknown> | undefined;
  const typographyChoices = result.typographyChoices as Record<string, unknown> | undefined;
  const componentCSS = result.componentCSS as string | undefined;
  const contrastValidation = result.contrastValidation as Record<string, unknown> | undefined;

  const metadata: DesignLanguageMetadata = {
    id: generationId,
    name: visualDirection?.name || liveMetadata.name,
    description: visualDirection?.summary || "Generated design system",
    tokenCount: styleGraphNodes.length,
    lastModified: new Date().toISOString(),
    createdAt: liveMetadata.createdAt,
    primaryColor,
    generationMetadata: {
      prompt,
      generatedAt: new Date().toISOString(),
      brandContext: { visualDirection },
      tailwindColorSeeds: colorSeeds,
      foundationSeeds,
      tailwindColorSystem: {
        paletteNames: colorSystem?.summary?.paletteNames,
        overlaps: colorSystem?.summary?.overlaps,
        roleMapping: colorSystem?.summary?.roleMapping,
      },
      tailwindCSS: colorSystem?.css,
      componentCSS,
      fullCSS: result.fullCSS as string | undefined,
    },
  };

  // Save to IndexedDB
  console.log(`💾 Saving design language ${metadata.id} to IndexedDB...`);
  await saveDesignLanguage(
    metadata,
    JSON.stringify({
      nodes: Array.from(styleGraph.nodes.values()).map((node) => ({
        ...node,
        dependencies: Array.from(node.dependencies),
        dependents: Array.from(node.dependents),
      })),
    })
  );

  console.log("✅ Saved design language to IndexedDB:", metadata.id);

  // Expose to window for debugging
  (window as unknown as Record<string, unknown>).__generationData__ = {
    metadata,
    result,
    styleGraphNodes,
  };

  console.log(`🎉 Calling onComplete with language ID: ${metadata.id}`);
  onComplete?.(metadata.id);

  return {
    visualDirection,
    tailwindColors: colorSeeds,
    foundations: foundationSeeds,
    tailwindSystem: colorSystem?.summary,
    typography: typographyChoices,
    designTokens: { tokenCount: styleGraphNodes.length },
    componentCSS: { cssLength: componentCSS?.length },
    contrastValidation,
  };
}

export function useDesignGeneration({
  onComplete,
  onError,
  onLiveUpdate,
}: UseDesignGenerationProps = {}) {
  const phases = useGenerationPhases();
  const generationIdRef = useRef<string>("");
  const liveMetadataRef = useRef<DesignLanguageMetadata | null>(null);
  const promptRef = useRef<string>("");

  const handleEvent = useCallback(
    (event: Record<string, unknown>) => {
      const type = event.type as string;
      console.log("📨 Received event:", type, event);

      switch (type) {
        case "connected":
          break;

        case "status":
          phases.setStatusMessage(event.message as string);
          break;

        case "phase-start":
          phases.setCurrentPhase(event.phase as string);
          break;

        case "stream":
          if (event.content) {
            phases.processStream(event.phase as string, event.content as string);
          }
          break;

        case "step":
          console.log("📦 Processing step", event.n, ":", event.message);
          if (event.payload) {
            const payload = event.payload as Record<string, unknown>;
            const stepNumber = event.n as number;

            // Update live metadata for step 1 (visual direction)
            if (stepNumber === 1 && liveMetadataRef.current) {
              if (payload.name) {
                liveMetadataRef.current.name = payload.name as string;
              }
              liveMetadataRef.current.description =
                (payload.summary as string) || "Generated design system";

              // Create empty graph for live update
              const liveGraph = new StyleGraph();
              onLiveUpdate?.(liveGraph, { ...liveMetadataRef.current });
            }

            phases.processStep(stepNumber, payload);
          }
          break;

        case "complete":
          console.log("✨ Design generation complete:", event.result);
          (async () => {
            try {
              const finalPreviews = await processCompleteEvent(
                event.result as Record<string, unknown>,
                generationIdRef.current,
                liveMetadataRef.current!,
                promptRef.current,
                onComplete,
                onError
              );
              phases.completeGeneration(finalPreviews);
            } catch (error) {
              console.error("❌ Failed to save design language:", error);
              const errorMsg =
                error instanceof Error ? error.message : "Failed to save design system";
              onError?.(errorMsg);
              phases.errorGeneration();
            }
          })();
          break;

        case "error":
          console.error("❌ Design generation error:", event.message, event.details);
          phases.errorGeneration();
          onError?.(event.message as string);
          break;
      }
    },
    [phases, onComplete, onError, onLiveUpdate]
  );

  const handleError = useCallback(
    (error: string) => {
      phases.errorGeneration();
      onError?.(error);
    },
    [phases, onError]
  );

  const sse = useSSEConnection({
    onEvent: handleEvent,
    onError: handleError,
  });

  const generate = useCallback(
    async (prompt: string, images?: ImageAttachment[]) => {
      console.log("🚀 useDesignGeneration: generate called", {
        prompt,
        imageCount: images?.length ?? 0,
      });

      // Store refs for use in event handlers
      generationIdRef.current = nanoid();
      promptRef.current = prompt;

      // Create live metadata
      liveMetadataRef.current = {
        id: generationIdRef.current,
        name: generateNameFromPrompt(prompt),
        description: "Generating...",
        tokenCount: 0,
        lastModified: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Immediately show empty graph
      const liveGraph = new StyleGraph();
      onLiveUpdate?.(liveGraph, liveMetadataRef.current);

      // Reset phase state
      phases.startGeneration();

      // Start SSE connection
      console.log("📡 Starting generation...");
      await sse.connect("/api/generate", { prompt, images });
    },
    [phases, sse, onLiveUpdate]
  );

  const cancel = useCallback(() => {
    sse.abort();
    phases.resetGeneration();
  }, [sse, phases]);

  return {
    status: phases.state,
    generate,
    cancel,
  };
}
