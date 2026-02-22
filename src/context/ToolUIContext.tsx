import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToolResult, ToolUIState } from '../types/toolUI';

interface ToolUIContextType {
  state: ToolUIState;
  showResult: (result: ToolResult) => void;
  closeOverlay: () => void;
  clearHistory: () => void;
}

const ToolUIContext = createContext<ToolUIContextType | undefined>(undefined);

export const useToolUI = () => {
  const context = useContext(ToolUIContext);
  if (!context) {
    throw new Error('useToolUI must be used within a ToolUIProvider');
  }
  return context;
};

interface ToolUIProviderProps {
  children: ReactNode;
}

export const ToolUIProvider: React.FC<ToolUIProviderProps> = ({ children }) => {
  const [state, setState] = useState<ToolUIState>({
    activeResult: null,
    resultHistory: [],
    isOverlayOpen: false,
  });

  const showResult = useCallback((result: ToolResult) => {
    console.log('🎨 ToolUIContext: showResult called', result);
    setState(prev => ({
      activeResult: result,
      resultHistory: [...prev.resultHistory, result],
      isOverlayOpen: true,
    }));
  }, []);

  const closeOverlay = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOverlayOpen: false,
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      resultHistory: [],
    }));
  }, []);

  return (
    <ToolUIContext.Provider value={{ state, showResult, closeOverlay, clearHistory }}>
      {children}
    </ToolUIContext.Provider>
  );
};

