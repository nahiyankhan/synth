/**
 * DesignLanguageDataContext
 * Holds the core data: graph, metadata, toolHandlers
 * Changes infrequently - only when switching design languages
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StyleGraph } from '@/core/StyleGraph';
import { DesignLanguageMetadata } from '@/services/designLanguageDB';
import { ToolResponse } from '@/types/toolRegistry';

/**
 * Interface for tool handlers - implemented by both legacy ToolHandlers and ToolRegistryAdapter
 */
export interface IToolHandlers {
  handleTool(toolName: string, params: any): Promise<ToolResponse>;
}

interface DesignLanguageDataContextType {
  // Selected language ID
  selectedLanguage: string | null;
  setSelectedLanguage: (id: string | null) => void;

  // Language metadata
  currentLanguageMetadata: DesignLanguageMetadata | null;
  setCurrentLanguageMetadata: (metadata: DesignLanguageMetadata | null) => void;

  // Core data structures
  graph: StyleGraph | null;
  setGraph: (graph: StyleGraph | null) => void;
  toolHandlers: IToolHandlers | null;
  setToolHandlers: (handlers: IToolHandlers | null) => void;
}

const DesignLanguageDataContext = createContext<DesignLanguageDataContextType | undefined>(undefined);

export const DesignLanguageDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize selectedLanguage from localStorage
  const [selectedLanguage, setSelectedLanguageState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('selected_language');
    } catch {
      return null;
    }
  });

  // Wrapper to persist to localStorage
  const setSelectedLanguage = (id: string | null) => {
    setSelectedLanguageState(id);
    if (id) {
      localStorage.setItem('selected_language', id);
    } else {
      localStorage.removeItem('selected_language');
    }
  };

  const [currentLanguageMetadata, setCurrentLanguageMetadata] = useState<DesignLanguageMetadata | null>(null);
  const [graph, setGraph] = useState<StyleGraph | null>(null);
  const [toolHandlers, setToolHandlers] = useState<IToolHandlers | null>(null);

  return (
    <DesignLanguageDataContext.Provider
      value={{
        selectedLanguage,
        setSelectedLanguage,
        currentLanguageMetadata,
        setCurrentLanguageMetadata,
        graph,
        setGraph,
        toolHandlers,
        setToolHandlers,
      }}
    >
      {children}
    </DesignLanguageDataContext.Provider>
  );
};

export const useDesignLanguageData = () => {
  const context = useContext(DesignLanguageDataContext);
  if (!context) {
    throw new Error('useDesignLanguageData must be used within DesignLanguageDataProvider');
  }
  return context;
};

export { DesignLanguageDataContext };
