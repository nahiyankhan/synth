/**
 * DesignLanguageUIContext
 * Holds UI state: selection, filtering, search, view mode
 * Changes frequently during user interaction
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StyleNode, StyleMode } from '@/types/styleGraph';

interface DesignLanguageUIContextType {
  // Selection state
  selectedNode: StyleNode | null;
  setSelectedNode: (node: StyleNode | null) => void;
  selectedNodes: string[]; // IDs of multiple selected nodes
  setSelectedNodes: (nodeIds: string[]) => void;

  // Filter state
  filteredNodes: StyleNode[];
  setFilteredNodes: (nodes: StyleNode[]) => void;
  voiceSearchResults: StyleNode[] | null;
  setVoiceSearchResults: (results: StyleNode[] | null) => void;
  autoSelectFilteredNodes: boolean;
  setAutoSelectFilteredNodes: (autoSelect: boolean) => void;

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // View state
  showSpecs: boolean;
  setShowSpecs: (show: boolean) => void;
  viewMode: StyleMode;
  setViewMode: (mode: StyleMode) => void;
}

const DesignLanguageUIContext = createContext<DesignLanguageUIContextType | undefined>(undefined);

export const DesignLanguageUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedNode, setSelectedNode] = useState<StyleNode | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<StyleNode[]>([]);
  const [voiceSearchResults, setVoiceSearchResults] = useState<StyleNode[] | null>(null);
  const [autoSelectFilteredNodes, setAutoSelectFilteredNodes] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSpecs, setShowSpecs] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<StyleMode>('light');

  return (
    <DesignLanguageUIContext.Provider
      value={{
        selectedNode,
        setSelectedNode,
        selectedNodes,
        setSelectedNodes,
        filteredNodes,
        setFilteredNodes,
        voiceSearchResults,
        setVoiceSearchResults,
        autoSelectFilteredNodes,
        setAutoSelectFilteredNodes,
        searchQuery,
        setSearchQuery,
        showSpecs,
        setShowSpecs,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </DesignLanguageUIContext.Provider>
  );
};

export const useDesignLanguageUI = () => {
  const context = useContext(DesignLanguageUIContext);
  if (!context) {
    throw new Error('useDesignLanguageUI must be used within DesignLanguageUIProvider');
  }
  return context;
};

export { DesignLanguageUIContext };
