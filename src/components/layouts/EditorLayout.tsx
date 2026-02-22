import React from "react";
import { ToolCallDisplay } from "../ToolCallDisplay";
import { DevPanel } from "../DevPanel";
import { ToolResultOverlay } from "../tool-results";
import { PageHeader, BreadcrumbSegment } from "./PageHeader";

export interface EditorLayoutProps {
  children: React.ReactNode;
  segments: BreadcrumbSegment[];
  isVisible?: boolean;
  dark?: boolean;
  currentEvent: unknown;
  previousEvent: unknown;
  onExecutePrompt: (prompt: string) => Promise<void>;
  isProcessing: boolean;
  currentView: string;
  toolUIState?: {
    activeResult: unknown;
    isOverlayOpen: boolean;
  };
  onCloseOverlay?: () => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  children,
  segments,
  isVisible = true,
  dark = false,
  currentEvent,
  previousEvent,
  onExecutePrompt,
  isProcessing,
  currentView,
  toolUIState,
  onCloseOverlay,
}) => {
  const bgColor = dark ? "bg-dark-900" : "bg-white";
  const textColor = dark ? "text-dark-50" : "text-dark-900";

  return (
    <div className={`h-screen ${bgColor} ${textColor} flex flex-col overflow-hidden relative`}>
      <PageHeader segments={segments} isVisible={isVisible} dark={dark} />

      <div className="flex-1 relative overflow-y-auto">
        {children}
      </div>

      <ToolCallDisplay
        currentEvent={currentEvent}
        previousEvent={previousEvent}
      />

      <DevPanel
        onExecutePrompt={onExecutePrompt}
        isProcessing={isProcessing}
        currentView={currentView}
      />

      {toolUIState && onCloseOverlay && (
        <ToolResultOverlay
          result={toolUIState.activeResult}
          isOpen={toolUIState.isOverlayOpen}
          onClose={onCloseOverlay}
        />
      )}
    </div>
  );
};
