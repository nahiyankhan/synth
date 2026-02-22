import React, { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LandingPage as LandingComponent } from "../components/LandingPage";
import { VoiceControlBar } from "../components/VoiceControlBar";
import { ToolCallDisplay } from "../components/ToolCallDisplay";
import { DevPanel } from "../components/DevPanel";
import { ToolResultOverlay } from "../components/tool-results";
import { useToolCall } from "../context/ToolCallContext";
import { useDesignLanguage } from "../context/DesignLanguageContext";
import { useApp } from "../context/AppContext";
import { useToolUI } from "../context/ToolUIContext";
import { useVoiceSession } from "../hooks/useVoiceSession";
import { useTextSession } from "../hooks/useTextSession";
import { useToolCallHandler } from "../hooks/useToolCallHandler";
import { AppState } from "../types/app";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { logs, appState } = useApp();
  const { setSelectedLanguage } = useDesignLanguage();
  const { state: toolUIState, showResult, closeOverlay } = useToolUI();
  const { currentEvent, previousEvent } = useToolCall();
  const [textInput, setTextInput] = React.useState("");
  const [isProcessingText, setIsProcessingText] = React.useState(false);

  const handleSelectLanguage = (id: string) => {
    setSelectedLanguage(id);
    navigate("/editor");
  };

  const refreshUI = useCallback(() => {}, []);

  // Get tool call handler
  const toolCallHandler = useToolCallHandler({
    refreshUI,
  });

  const sessionPromiseRefHolder = useRef<React.MutableRefObject<any> | null>(
    null
  );
  const onToolCall = useCallback(
    async (toolCall: any) => {
      if (sessionPromiseRefHolder.current) {
        await toolCallHandler(toolCall, sessionPromiseRefHolder.current);
      }
    },
    [toolCallHandler]
  );

  const { startSession, stopSession, sendProactiveMessage, sessionPromiseRef } =
    useVoiceSession(onToolCall);

  React.useEffect(() => {
    sessionPromiseRefHolder.current = sessionPromiseRef;
  }, [sessionPromiseRef]);

  // Wrap handleToolCall for VoiceControlBar (without session ref)
  const handleToolCall = useCallback(
    async (toolCall: any) => {
      await toolCallHandler(toolCall, { current: null });
    },
    [toolCallHandler]
  );

  // Proactive welcome when first visiting
  React.useEffect(() => {
    // Only run on initial mount and if voice is active
    if (appState === AppState.LISTENING && sendProactiveMessage) {
      const timer = setTimeout(() => {
        sendProactiveMessage(
          "User is looking at the landing page with all their design systems. Ask: 'I see you have some design systems here. Would you like me to tell you about any of them, or shall we create a brand new one?'"
        );
      }, 5000); // Wait 5 seconds after voice starts

      return () => clearTimeout(timer);
    }
  }, []); // Empty deps - only on mount

  // Text session for chat mode
  const { sendMessage: sendTextMessage } = useTextSession(onToolCall);

  // DevPanel handler - uses same text session as chat mode
  const handleExecutePrompt = useCallback(
    async (prompt: string) => {
      await sendTextMessage(prompt);
    },
    [sendTextMessage]
  );

  return (
    <>
      <LandingComponent
        onSelectLanguage={handleSelectLanguage}
      />
      <ToolCallDisplay
        currentEvent={currentEvent}
        previousEvent={previousEvent}
      />
      <VoiceControlBar
        appState={appState}
        onStartSession={startSession}
        onStopSession={stopSession}
        dark
      />
      <DevPanel
        onExecutePrompt={handleExecutePrompt}
        isProcessing={isProcessingText}
        currentView={null}
      />
      <ToolResultOverlay
        result={toolUIState.activeResult}
        isOpen={toolUIState.isOverlayOpen}
        onClose={closeOverlay}
      />
    </>
  );
};
