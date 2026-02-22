import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppState } from "../types/app";
import { getApiKey, setApiKey, hasApiKey as checkHasApiKey } from "../utils/apiKeyStorage";

interface AppContextType {
  appState: AppState;
  setAppState: (state: AppState) => void;
  hasApiKey: boolean;
  setHasApiKey: (has: boolean) => void;
  logs: string[];
  addLog: (msg: string) => void;
  updateLastLog: (msg: string) => void;
  isDevPanelOpen: boolean;
  setIsDevPanelOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  // Check for API key synchronously to avoid flash on load
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => {
    const envApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envApiKey && !getApiKey('gemini')) {
      setApiKey('gemini', envApiKey);
    }
    return checkHasApiKey('gemini');
  });
  const [logs, setLogs] = useState<string[]>([]);
  
  // Dev panel state with localStorage persistence
  const [isDevPanelOpen, setIsDevPanelOpen] = useState<boolean>(() => {
    const stored = localStorage.getItem("devPanelOpen");
    return stored ? stored === "true" : false;
  });

  // Persist dev panel state changes
  useEffect(() => {
    localStorage.setItem("devPanelOpen", isDevPanelOpen.toString());
  }, [isDevPanelOpen]);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg].slice(-20));

  const updateLastLog = (msg: string) =>
    setLogs((prev) => {
      if (prev.length === 0) {
        // No logs yet, just add one
        return [msg];
      }
      // Update the last entry
      const updated = [...prev];
      updated[updated.length - 1] = msg;
      return updated;
    });

  return (
    <AppContext.Provider
      value={{
        appState,
        setAppState,
        hasApiKey,
        setHasApiKey,
        logs,
        addLog,
        updateLastLog,
        isDevPanelOpen,
        setIsDevPanelOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
