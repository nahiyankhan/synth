import React from "react";
import { ToolCallEvent } from "@/hooks/useToolCallDisplay";

interface ToolCallDisplayProps {
  currentEvent: ToolCallEvent | null;
  previousEvent: ToolCallEvent | null;
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({
  currentEvent,
  previousEvent,
}) => {
  const renderEvent = (event: ToolCallEvent, isFadingOut: boolean) => {
    const baseClasses =
      "bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-dark-200 p-4 transition-all duration-300";
    const animationClasses = isFadingOut
      ? "animate-fadeOutUp opacity-0"
      : "animate-fadeInUp opacity-100";

    return (
      <div key={event.id} className={`${baseClasses} ${animationClasses}`}>
        {event.type === "thinking" && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 text-dark-500 text-sm font-mono">
              💭
            </div>
            <div className="flex-1">
              <div className="text-xs font-mono uppercase tracking-wider text-dark-400 mb-1">
                thinking
              </div>
              <p className="text-sm text-dark-600 font-mono">
                {event.data.thinking}
              </p>
            </div>
          </div>
        )}

        {event.type === "tool_call" && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 text-dark-500 text-sm font-mono">
              🔧
            </div>
            <div className="flex-1">
              <div className="text-xs font-mono uppercase tracking-wider text-dark-400 mb-1">
                tool call
              </div>
              <div className="text-sm font-mono text-dark-900 mb-2">
                {event.data.toolName}
              </div>
              {event.data.args && Object.keys(event.data.args).length > 0 && (
                <div className="text-xs font-mono text-dark-600 bg-dark-50 rounded p-2 max-h-24 overflow-y-auto">
                  {JSON.stringify(event.data.args, null, 2)}
                </div>
              )}
            </div>
          </div>
        )}

        {event.type === "tool_result" && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 text-dark-500 text-sm font-mono">
              ✓
            </div>
            <div className="flex-1">
              <div className="text-xs font-mono uppercase tracking-wider text-dark-400 mb-1">
                result
              </div>
              <div className="text-sm font-mono text-dark-900 mb-2">
                {event.data.toolName}
              </div>
              {event.data.result && (
                <div className="text-xs font-mono text-dark-600">
                  {typeof event.data.result === "string"
                    ? event.data.result
                    : JSON.stringify(event.data.result, null, 2).slice(0, 200) +
                      "..."}
                </div>
              )}
            </div>
          </div>
        )}

        {event.type === "text_delta" && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 text-dark-500 text-sm font-mono">
              🤖
            </div>
            <div className="flex-1">
              <p className="text-sm text-dark-700">
                {event.data.text}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!currentEvent && !previousEvent) {
    return null;
  }

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col gap-3 w-[560px] z-50">
      {previousEvent && renderEvent(previousEvent, true)}
      {currentEvent && renderEvent(currentEvent, false)}
    </div>
  );
};
