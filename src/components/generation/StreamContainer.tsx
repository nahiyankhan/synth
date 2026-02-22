/**
 * StreamContainer - Container for streaming generation elements
 *
 * Holds streaming elements that appear around the AISignal during generation.
 * The entire container moves along the arc, carrying its elements with it.
 */

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface StreamContainerProps {
  children?: React.ReactNode;
  className?: string;
  /** Container size in pixels */
  size?: number;
}

export const StreamContainer = forwardRef<HTMLDivElement, StreamContainerProps>(
  ({ children, className, size = 600 }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute pointer-events-none",
          // Transform to center the container on its position
          "-translate-x-1/2 -translate-y-1/2",
          className
        )}
        style={{
          width: size,
          height: size,
        }}
      >
        {children}
      </div>
    );
  }
);

StreamContainer.displayName = "StreamContainer";
