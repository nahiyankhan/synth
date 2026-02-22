import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LandingPage as LandingComponent } from "@/components/LandingPage";
import { ToolCallDisplay } from "@/components/ToolCallDisplay";
import { DevPanel } from "@/components/DevPanel";
import { ToolResultOverlay } from "@/components/tool-results";
import { useToolCall } from "@/context/ToolCallContext";
import { useDesignLanguage } from "@/context/DesignLanguageContext";
import { useToolUI } from "@/context/ToolUIContext";
import { useTextSession } from "@/hooks/useTextSession";
import { useToolCallHandler } from "@/hooks/useToolCallHandler";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedLanguage } = useDesignLanguage();
  const { state: toolUIState, closeOverlay } = useToolUI();
  const { currentEvent, previousEvent } = useToolCall();
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

  const handleToolCall = useCallback(
    async (toolCall: any) => {
      await toolCallHandler(toolCall, { current: null });
    },
    [toolCallHandler]
  );

  // Text session for chat mode
  const { sendMessage: sendTextMessage } = useTextSession(handleToolCall);

  // DevPanel handler
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

  return (
    <>
      <LandingComponent
        onSelectLanguage={handleSelectLanguage}
      />
      <ToolCallDisplay
        currentEvent={currentEvent}
        previousEvent={previousEvent}
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
