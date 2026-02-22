import { useEffect, useRef } from "react";
import { useDesignLanguage } from "../context/DesignLanguageContext";
import { useApp } from "../context/AppContext";
import { AppState } from "../types/app";
import {
  loadDesignLanguageData,
  loadDesignLanguageMetadata,
  loadContentData,
} from "../services/designLanguageDB";
import { StyleGraph } from "../core/StyleGraph";
import { EnhancedToolHandlers } from "../services/enhancedToolHandlers";
import { initContentService } from "../services/contentService";
import { applyDesignLanguageCSS } from "../services/themeService";

interface UseDesignLanguageLoaderOptions {
  skipLoading?: boolean;
}

export const useDesignLanguageLoader = (
  options: UseDesignLanguageLoaderOptions = {}
) => {
  const { skipLoading = false } = options;

  const {
    selectedLanguage,
    currentLanguageMetadata,
    setCurrentLanguageMetadata,
    setGraph,
    setToolHandlers,
    setFilteredNodes,
    showSpecs,
    graph,
    searchQuery,
  } = useDesignLanguage();
  const { setAppState, addLog } = useApp();

  // Track current selectedLanguage to prevent stale closure updates
  const selectedLanguageRef = useRef(selectedLanguage);
  selectedLanguageRef.current = selectedLanguage;

  // Load design language when selected
  useEffect(() => {
    // Skip if explicitly told to (e.g., in generation mode)
    if (skipLoading) return;

    if (!selectedLanguage) return;

    // Skip loading if we're creating a new language (handled by handleCreateNew)
    if (selectedLanguage === "__creating__") return;

    // Capture the language ID this effect is running for
    const effectLanguageId = selectedLanguage;

    // Check if current metadata matches selected language
    // If metadata is for a different language, we need to do a full reload
    const isMetadataMismatch = currentLanguageMetadata && currentLanguageMetadata.id !== effectLanguageId;

    if (isMetadataMismatch) {
      console.log(`⚠️ Metadata mismatch: metadata.id="${currentLanguageMetadata.id}" but selectedLanguage="${effectLanguageId}" - forcing full reload`);
      // Clear the mismatched state before loading
      setCurrentLanguageMetadata(null);
      setGraph(null);
      // Fall through to full load below
    }

    // Skip loading graph if we already have one AND it matches the selected language
    // But still check if metadata needs to be refreshed (e.g., after generation completes)
    if (graph && graph.nodes.size > 0 && !isMetadataMismatch) {
      console.log("✓ Graph already loaded, checking metadata freshness...");

      // Load fresh metadata from IndexedDB to ensure brandContext etc. are up to date
      loadDesignLanguageMetadata(effectLanguageId).then((freshMetadata) => {
        // Guard against stale closure: only update if we're still on the same language
        if (selectedLanguageRef.current !== effectLanguageId) {
          console.log("⚠️ Skipping metadata update - language changed during load");
          return;
        }

        if (freshMetadata) {
          // Check if current metadata is missing brandContext but fresh one has it
          const currentHasBrandContext = !!currentLanguageMetadata?.generationMetadata?.brandContext;
          const freshHasBrandContext = !!freshMetadata.generationMetadata?.brandContext;

          if (!currentHasBrandContext && freshHasBrandContext) {
            console.log("✓ Updating metadata with brandContext from IndexedDB");
            setCurrentLanguageMetadata(freshMetadata);
          }
        }
      });

      setAppState(AppState.IDLE);
      return;
    }

    const loadDesignSystem = async () => {
      try {
        setAppState(AppState.LOADING);

        // Load metadata, data, and content from IndexedDB
        // Retry logic for when navigating immediately after generation
        let retries = 0;
        const maxRetries = 3;
        let metadata, jsonData, contentData;

        while (retries < maxRetries) {
          [metadata, jsonData, contentData] = await Promise.all([
            loadDesignLanguageMetadata(effectLanguageId),
            loadDesignLanguageData(effectLanguageId),
            loadContentData(effectLanguageId),
          ]);

          if (jsonData) break;

          // If not found, wait a bit and retry (in case save is still in progress)
          retries++;
          if (retries < maxRetries) {
            console.log(
              `⏳ Design language not found, retrying (${retries}/${maxRetries})...`
            );
            await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 500ms before retry
          }
        }

        if (!jsonData) {
          throw new Error(
            `Design language "${effectLanguageId}" not found after ${maxRetries} attempts`
          );
        }

        // Guard against stale closure: abort if language changed during async load
        if (selectedLanguageRef.current !== effectLanguageId) {
          console.log("⚠️ Aborting design system load - language changed during load");
          return;
        }

        setCurrentLanguageMetadata(metadata);

        // Set data-theme attribute for theming system
        if (metadata?.name) {
          const themeName = metadata.name.toLowerCase().replace(/\s+/g, "-");
          document.documentElement.setAttribute("data-theme", themeName);
          addLog(`✓ Theme set to: ${themeName}`);
        }

        // Apply design language CSS (fullCSS includes component styles, tailwindCSS is legacy)
        if (metadata?.generationMetadata?.fullCSS) {
          // New format: theme + component CSS combined
          applyDesignLanguageCSS(metadata.generationMetadata.fullCSS);
          addLog(`✓ Applied design language theme + component styles`);
        } else if (metadata?.generationMetadata?.tailwindCSS) {
          // Legacy format: theme only - just inject the CSS directly
          const styleEl = document.createElement('style');
          styleEl.id = 'tailwind-design-language';
          styleEl.textContent = metadata.generationMetadata.tailwindCSS;
          document.head.appendChild(styleEl);
          addLog(`✓ Applied design language theme (legacy)`);
        }

        const styleGraph = new StyleGraph();
        styleGraph.importFromJSON(jsonData);
        setGraph(styleGraph);

        // Initialize enhanced tool handlers with pagination/filtering
        const handlers = new EnhancedToolHandlers(styleGraph);
        setToolHandlers(handlers);

        // Get core tokens (exclude specs by default)
        const nodes = styleGraph.getNodes({ excludeSpecs: !showSpecs });
        setFilteredNodes(nodes);

        // Initialize content service with loaded content data
        initContentService(contentData?.markdown || null);
        if (contentData?.markdown) {
          addLog('✓ Loaded content guidelines');
        }

        setAppState(AppState.IDLE);
        addLog(
          `✓ Design language "${metadata?.name || effectLanguageId}" loaded`
        );
      } catch (error: any) {
        console.error("Design language load error:", error);
        addLog(
          `❌ Failed to load design language: ${
            error?.message || "Unknown error"
          }`
        );
        setAppState(AppState.ERROR);
      }
    };

    loadDesignSystem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage, showSpecs]);

  // Update filtered nodes when search or filters change
  useEffect(() => {
    if (!graph) return;

    let nodes = graph.getNodes({ excludeSpecs: !showSpecs });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nodes = nodes.filter(
        (n) =>
          n.id.toLowerCase().includes(query) ||
          n.name.toLowerCase().includes(query) ||
          JSON.stringify(n.value).toLowerCase().includes(query)
      );
    }

    setFilteredNodes(nodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, searchQuery, showSpecs]);
};
