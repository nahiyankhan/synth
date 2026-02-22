/**
 * DesignLanguageContext
 * Composite provider that combines Data and UI contexts
 * Provides backward-compatible useDesignLanguage() hook
 */

import React, { ReactNode, useMemo } from 'react';
import { DesignLanguageDataProvider, useDesignLanguageData } from './DesignLanguageDataContext';
import { DesignLanguageUIProvider, useDesignLanguageUI } from './DesignLanguageUIContext';
import { useDesignLanguageQuery } from '@/hooks/useDesignLanguageQuery';

// Re-export individual hooks for granular usage
export { useDesignLanguageData } from './DesignLanguageDataContext';
export { useDesignLanguageUI } from './DesignLanguageUIContext';
export { useDesignLanguageQuery } from '@/hooks/useDesignLanguageQuery';

/**
 * Composite provider - wraps both data and UI providers
 */
export const DesignLanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <DesignLanguageDataProvider>
      <DesignLanguageUIProvider>
        {children}
      </DesignLanguageUIProvider>
    </DesignLanguageDataProvider>
  );
};

/**
 * Backward-compatible hook that combines all contexts
 * @deprecated Use specific hooks for better performance:
 * - useDesignLanguageData() for graph, metadata, toolHandlers
 * - useDesignLanguageUI() for selection, filters, search
 * - useDesignLanguageQuery() for query methods
 */
export const useDesignLanguage = () => {
  const data = useDesignLanguageData();
  const ui = useDesignLanguageUI();
  const query = useDesignLanguageQuery();

  // Combine all into single object for backward compatibility
  return useMemo(() => ({
    // Data context
    selectedLanguage: data.selectedLanguage,
    setSelectedLanguage: data.setSelectedLanguage,
    currentLanguageMetadata: data.currentLanguageMetadata,
    setCurrentLanguageMetadata: data.setCurrentLanguageMetadata,
    graph: data.graph,
    setGraph: data.setGraph,
    toolHandlers: data.toolHandlers,
    setToolHandlers: data.setToolHandlers,

    // UI context
    selectedNode: ui.selectedNode,
    setSelectedNode: ui.setSelectedNode,
    selectedNodes: ui.selectedNodes,
    setSelectedNodes: ui.setSelectedNodes,
    filteredNodes: ui.filteredNodes,
    setFilteredNodes: ui.setFilteredNodes,
    voiceSearchResults: ui.voiceSearchResults,
    setVoiceSearchResults: ui.setVoiceSearchResults,
    autoSelectFilteredNodes: ui.autoSelectFilteredNodes,
    setAutoSelectFilteredNodes: ui.setAutoSelectFilteredNodes,
    searchQuery: ui.searchQuery,
    setSearchQuery: ui.setSearchQuery,
    showSpecs: ui.showSpecs,
    setShowSpecs: ui.setShowSpecs,
    viewMode: ui.viewMode,
    setViewMode: ui.setViewMode,

    // Query methods
    getTokenByPath: query.getTokenByPath,
    getTokensByType: query.getTokensByType,
    getTokensByLayer: query.getTokensByLayer,
  }), [data, ui, query]);
};
