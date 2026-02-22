import React, { createContext, useContext } from 'react';
import { useToolCallDisplay, ToolCallEvent } from '../hooks/useToolCallDisplay';

interface ToolCallContextType {
  currentEvent: ToolCallEvent | null;
  previousEvent: ToolCallEvent | null;
  showEvent: (event: ToolCallEvent) => void;
  clear: () => void;
}

const ToolCallContext = createContext<ToolCallContextType | null>(null);

export const ToolCallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const toolCallDisplay = useToolCallDisplay();

  return (
    <ToolCallContext.Provider value={toolCallDisplay}>
      {children}
    </ToolCallContext.Provider>
  );
};

export const useToolCall = () => {
  const context = useContext(ToolCallContext);
  if (!context) {
    throw new Error('useToolCall must be used within ToolCallProvider');
  }
  return context;
};

