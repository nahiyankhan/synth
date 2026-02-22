import * as React from "react";
import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  label?: string;
  className?: string;
}

function ScoreDisplay({
  score,
  label = "% on-brand",
  className,
}: ScoreDisplayProps) {
  return (
    <div
      data-slot="score-display"
      className={cn("flex flex-col items-start", className)}
    >
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-light tracking-tight text-dark-900">
          {Math.round(score)}
        </span>
        <span className="text-sm text-dark-500">
          {label}
        </span>
      </div>
    </div>
  );
}

export { ScoreDisplay };
export type { ScoreDisplayProps };
