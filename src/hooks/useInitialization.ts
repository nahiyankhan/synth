import { useEffect, useRef } from "react";
import { initDB } from "../services/dbService";
import {
  initDesignLanguageDB,
  saveDesignLanguage,
  designLanguageExists,
  loadContentData,
} from "../services/designLanguageDB";
import { StyleGraph } from "../core/StyleGraph";
import { useApp } from "../context/AppContext";
import { AppState } from "../types/app";
import { ContentData } from "../types/content";

export const useInitialization = () => {
  const { setAppState, addLog } = useApp();
  const initializationStartedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React.StrictMode
    if (initializationStartedRef.current) {
      return;
    }
    initializationStartedRef.current = true;

    const init = async () => {
      try {
        await initDB();
        await initDesignLanguageDB();

        // Migrate design system to IndexedDB if it doesn't exist
        const exists = await designLanguageExists("default");

        // Load content data from static JSON file
        const loadContentFromStatic = async (): Promise<ContentData | undefined> => {
          try {
            const response = await fetch('/data/design-system.json');
            const data = await response.json();
            if (data.content) {
              console.log(`✓ Loaded ${data.content.chunks.length} content guidelines${data.content.markdown ? ' with markdown' : ''}`);
              return data.content;
            }
          } catch (error) {
            console.warn('Could not load content data:', error);
          }
          return undefined;
        };

        if (!exists) {
          console.log("Migrating design language to IndexedDB...");
          const tempGraph = new StyleGraph();
          await tempGraph.loadFromStatic();
          const jsonData = tempGraph.exportToJSON();
          const contentData = await loadContentFromStatic();

          await saveDesignLanguage(
            {
              id: "default",
              name: "Design System",
              description: "Default design language",
              tokenCount: tempGraph.getStats().coreTokensCount,
              lastModified: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
            jsonData,
            contentData
          );
          console.log("✓ Design system migrated to IndexedDB");
        } else {
          // Check if existing data has markdown/content - if not, update it
          const existingContent = await loadContentData("default");
          if (!existingContent || !existingContent.markdown || !existingContent.chunks?.length) {
            console.log("Updating content data...");
            const contentData = await loadContentFromStatic();
            if (contentData) {
              const tempGraph = new StyleGraph();
              await tempGraph.loadFromStatic();
              const jsonData = tempGraph.exportToJSON();

              await saveDesignLanguage(
                {
                  id: "default",
                  name: "Design System",
                  description: "Default design language",
                  tokenCount: tempGraph.getStats().coreTokensCount,
                  lastModified: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                },
                jsonData,
                contentData
              );
              console.log(`✓ Content data updated (${contentData.chunks.length} guidelines)`);
            }
          } else {
            console.log(`✓ Content data already loaded (${existingContent.chunks.length} guidelines)`);
          }
        }
      } catch (error: any) {
        console.error("Initialization error:", error);
        addLog(`❌ Initialization error: ${error?.message || "Unknown error"}`);
        setAppState(AppState.ERROR);
      }
    };
    init();
  }, [setAppState, addLog]);
};
