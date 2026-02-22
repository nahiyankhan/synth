import * as React from "react";
import { cn } from "@/lib/utils";

interface FeedbackItem {
  label: string;
  active?: boolean;
}

interface FeedbackChipsProps {
  title?: string;
  items: FeedbackItem[];
  className?: string;
}

function FeedbackChips({
  title = "What's working",
  items,
  className,
}: FeedbackChipsProps) {
  return (
    <div data-slot="feedback-chips" className={cn("flex flex-col gap-2", className)}>
      {title && (
        <span className="text-xs text-dark-500">
          {title}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={index}
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors",
              item.active
                ? "bg-dark-900 text-white"
                : "bg-transparent border border-dark-300 text-dark-600"
            )}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export { FeedbackChips };
export type { FeedbackChipsProps, FeedbackItem };
