/**
 * useViewPage - Composite hook for view page state management
 *
 * Consolidates ~80 lines of duplicated state management from page components
 * (ColorsPage, TypographyPage, SizesPage, ContentPage, ComponentsPage, PagesViewPage)
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useToolCall } from '@/context/ToolCallContext';
import { useDesignLanguage } from '@/context/DesignLanguageContext';
import { useToolUI } from '@/context/ToolUIContext';
import { useDesignLanguageLoader } from './useDesignLanguageLoader';
import { useToolCallHandler } from './useToolCallHandler';
import { useTextSession } from './useTextSession';

export interface UseViewPageOptions {
  /** Current view name for context-aware AI interactions */
  currentView: string;
  /** Skip loading design language (for pages that manage their own loading) */
  skipLoading?: boolean;
}

export interface UseViewPageReturn {
  // Navigation
  navigate: ReturnType<typeof useNavigate>;

  // App state
  appState: ReturnType<typeof useApp>['appState'];

  // Tool call state
  currentEvent: ReturnType<typeof useToolCall>['currentEvent'];
  previousEvent: ReturnType<typeof useToolCall>['previousEvent'];

  // Design language state
  selectedLanguage: string | null;
  currentLanguageMetadata: ReturnType<typeof useDesignLanguage>['currentLanguageMetadata'];
  graph: ReturnType<typeof useDesignLanguage>['graph'];
  viewMode: ReturnType<typeof useDesignLanguage>['viewMode'];
  voiceSearchResults: ReturnType<typeof useDesignLanguage>['voiceSearchResults'];
  setVoiceSearchResults: ReturnType<typeof useDesignLanguage>['setVoiceSearchResults'];

  // Tool UI state
  toolUIState: ReturnType<typeof useToolUI>['state'];
  closeOverlay: ReturnType<typeof useToolUI>['closeOverlay'];

  // Text input state
  textInput: string;
  setTextInput: (value: string) => void;
  isProcessingText: boolean;

  // UI state
  isVisible: boolean;

  // Text session handlers
  handleTextSubmit: (e: React.FormEvent) => Promise<void>;
  handleExecutePrompt: (prompt: string) => Promise<void>;

  // Tool call handler
  handleToolCall: (toolCall: any) => Promise<void>;

  // Current view for context
  currentView: string;

  // Loading state
  isLoading: boolean;
}

export function useViewPage(options: UseViewPageOptions): UseViewPageReturn {
  const { currentView, skipLoading = false } = options;

  const navigate = useNavigate();
  const { appState } = useApp();
  const { currentEvent, previousEvent } = useToolCall();
  const [isVisible, setIsVisible] = useState(false);

  // Load design language
  useDesignLanguageLoader({ skipLoading });
  const {
    selectedLanguage,
    currentLanguageMetadata,
    graph,
    viewMode,
    voiceSearchResults,
    setVoiceSearchResults,
  } = useDesignLanguage();

  // Text input state
  const [textInput, setTextInput] = useState<string>('');
  const [isProcessingText, setIsProcessingText] = useState<boolean>(false);

  // Tool UI state
  const { state: toolUIState, closeOverlay } = useToolUI();

  // Navigation helpers for voice commands
  const handleCardClick = useCallback(
    (view: string) => {
      navigate(`/editor/${view}`);
    },
    [navigate]
  );

  const setMultiView = useCallback(
    (left: string, right: string) => {
      navigate(`/editor/split?left=${left}&right=${right}`);
    },
    [navigate]
  );

  // Refresh UI callback (for tool handlers)
  const refreshUI = useCallback(() => {
    // Individual pages don't need complex refresh logic
    // The graph updates will trigger re-renders automatically
  }, []);

  // Tool call handler
  const handleToolCall = useToolCallHandler({
    refreshUI,
    setActiveView: handleCardClick,
    setMultiView,
  });

  // Text session (chat mode)
  const { sendMessage: sendTextMessage } = useTextSession(handleToolCall, {
    currentView,
  });

  // Handle DevPanel prompt execution
  const handleExecutePrompt = useCallback(
    async (prompt: string) => {
      setIsProcessingText(true);
      try {
        await sendTextMessage(prompt);
      } finally {
        setIsProcessingText(false);
      }
    },
    [sendTextMessage]
  );

  // Handle text form submission
  const handleTextSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!textInput.trim() || isProcessingText) return;

      const userMessage = textInput.trim();
      setTextInput('');
      setIsProcessingText(true);

      try {
        await sendTextMessage(userMessage);
      } finally {
        setIsProcessingText(false);
      }
    },
    [textInput, isProcessingText, sendTextMessage]
  );

  // Visibility fade-in effect
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect to home if no language selected
  useEffect(() => {
    if (!selectedLanguage) {
      navigate('/');
    }
  }, [selectedLanguage, navigate]);

  const isLoading = !graph || !selectedLanguage;

  // Wrap handleToolCall to match expected interface (without session ref)
  const wrappedToolCall = useCallback(
    async (toolCall: any) => {
      await handleToolCall(toolCall, { current: null });
    },
    [handleToolCall]
  );

  return {
    navigate,
    appState,
    currentEvent,
    previousEvent,
    selectedLanguage,
    currentLanguageMetadata,
    graph,
    viewMode,
    voiceSearchResults,
    setVoiceSearchResults,
    toolUIState,
    closeOverlay,
    textInput,
    setTextInput,
    isProcessingText,
    isVisible,
    handleTextSubmit,
    handleExecutePrompt,
    handleToolCall: wrappedToolCall,
    currentView,
    isLoading,
  };
}
