import { useState, useEffect, useRef } from "react";

export interface ToolCallEvent {
  id: string;
  type: "tool_call" | "thinking" | "text_delta" | "tool_result";
  timestamp: number;
  data: {
    toolName?: string;
    args?: any;
    result?: any;
    thinking?: string;
    text?: string;
  };
}

export function useToolCallDisplay() {
  const [currentEvent, setCurrentEvent] = useState<ToolCallEvent | null>(null);
  const [previousEvent, setPreviousEvent] = useState<ToolCallEvent | null>(
    null
  );
  const lastEventRef = useRef<string | null>(null);

  const showEvent = (event: ToolCallEvent) => {
    if (event.id !== lastEventRef.current) {
      // Move current to previous
      setPreviousEvent(currentEvent);
      setCurrentEvent(event);
      lastEventRef.current = event.id;

      // Clear previous after fade animation completes
      const timer = setTimeout(() => {
        setPreviousEvent(null);
      }, 400); // Match fadeOutUp duration

      return () => clearTimeout(timer);
    }
  };

  const clear = () => {
    setPreviousEvent(currentEvent);
    setCurrentEvent(null);
    lastEventRef.current = null;

    const timer = setTimeout(() => {
      setPreviousEvent(null);
    }, 400);

    return () => clearTimeout(timer);
  };

  return {
    currentEvent,
    previousEvent,
    showEvent,
    clear,
  };
}
