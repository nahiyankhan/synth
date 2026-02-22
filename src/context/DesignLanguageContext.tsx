import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { StyleGraph } from '@/core/StyleGraph';
import { StyleNode, StyleMode } from '@/types/styleGraph';
import { ToolHandlers } from '@/services/toolHandlers';
import { DesignLanguageMetadata } from '@/services/designLanguageDB';
import { getTokenByPath, getTokensByType, getTokensByLayer } from '@/utils/designLanguageTokenMapper';

interface DesignLanguageContextType {
  selectedLanguage: string | null;
  setSelectedLanguage: (id: string | null) => void;
  currentLanguageMetadata: DesignLanguageMetadata | null;
  setCurrentLanguageMetadata: (metadata: DesignLanguageMetadata | null) => void;
  graph: StyleGraph | null;
  setGraph: (graph: StyleGraph | null) => void;
  toolHandlers: ToolHandlers | null;
  setToolHandlers: (handlers: ToolHandlers | null) => void;
  selectedNode: StyleNode | null;
  setSelectedNode: (node: StyleNode | null) => void;
  selectedNodes: string[]; // IDs of multiple selected nodes (for AI context)
  setSelectedNodes: (nodeIds: string[]) => void;
  filteredNodes: StyleNode[];
  setFilteredNodes: (nodes: StyleNode[]) => void;
  voiceSearchResults: StyleNode[] | null;
  setVoiceSearchResults: (results: StyleNode[] | null) => void;
  autoSelectFilteredNodes: boolean;
  setAutoSelectFilteredNodes: (autoSelect: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showSpecs: boolean;
  setShowSpecs: (show: boolean) => void;
  viewMode: StyleMode;
  setViewMode: (mode: StyleMode) => void;
  // Token query methods
  getTokenByPath: (path: string) => StyleNode | undefined;
  getTokensByType: (type: string) => StyleNode[];
  getTokensByLayer: (layer: string) => StyleNode[];
}

const DesignLanguageContext = createContext<DesignLanguageContextType | undefined>(undefined);

export const DesignLanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
  const [toolHandlers, setToolHandlers] = useState<ToolHandlers | null>(null);
  const [selectedNode, setSelectedNode] = useState<StyleNode | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<StyleNode[]>([]);
  const [voiceSearchResults, setVoiceSearchResults] = useState<StyleNode[] | null>(null);
  const [autoSelectFilteredNodes, setAutoSelectFilteredNodes] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSpecs, setShowSpecs] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<StyleMode>('light');

  // Token query methods
  const nodes = useMemo(() => {
    return graph ? Array.from(graph.nodes.values()) : [];
  }, [graph]);

  const queryTokenByPath = (path: string) => getTokenByPath(nodes, path);
  const queryTokensByType = (type: string) => getTokensByType(nodes, type);
  const queryTokensByLayer = (layer: string) => getTokensByLayer(nodes, layer);

  return (
    <DesignLanguageContext.Provider
      value={{
        selectedLanguage,
        setSelectedLanguage,
        currentLanguageMetadata,
        setCurrentLanguageMetadata,
        graph,
        setGraph,
        toolHandlers,
        setToolHandlers,
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
        getTokenByPath: queryTokenByPath,
        getTokensByType: queryTokensByType,
        getTokensByLayer: queryTokensByLayer,
      }}
    >
      {children}
    </DesignLanguageContext.Provider>
  );
};

export const useDesignLanguage = () => {
  const context = useContext(DesignLanguageContext);
  if (!context) {
    throw new Error('useDesignLanguage must be used within DesignLanguageProvider');
  }
  return context;
};

