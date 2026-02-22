import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentedProgressProps {
  value: number;
  segments?: number;
  className?: string;
}

function SegmentedProgress({
  value,
  segments = 10,
  className,
}: SegmentedProgressProps) {
  const filledSegments = Math.round((value / 100) * segments);

  return (
    <div
      data-slot="segmented-progress"
      className={cn("flex gap-1 w-full", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: segments }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-2 flex-1 rounded-sm transition-colors",
            index < filledSegments
              ? "bg-[#00d632]"
              : "bg-dark-300"
          )}
        />
      ))}
    </div>
  );
}

export { SegmentedProgress };
export type { SegmentedProgressProps };
