/**
 * ColorDetailPanel - Shared wrapper for color detail panels
 *
 * A fixed-position panel that displays color details with a color preview header,
 * title, close button, and custom content area.
 */

import React from "react";
import { cn } from "../../../lib/utils";

export interface ColorDetailPanelProps {
  /** Hex color for the preview header */
  color: string;
  /** Panel title */
  title: string;
  /** Optional subtitle (typically the hex value) */
  subtitle?: string;
  /** Called when close button is clicked */
  onClose: () => void;
  /** Height of the color preview in pixels (default: 80) */
  previewHeight?: number;
  /** Width class (e.g., "w-80", "w-96") */
  width?: string;
  /** Panel content */
  children: React.ReactNode;
  /** Additional className for the panel */
  className?: string;
  /** Variant for light/dark themes */
  variant?: "light" | "dark";
}

/**
 * A reusable panel for displaying color details.
 *
 * @example
 * ```tsx
 * <ColorDetailPanel
 *   color="#3b82f6"
 *   title="primary.500"
 *   subtitle="#3b82f6"
 *   onClose={() => setSelected(null)}
 * >
 *   <OKLCHDisplay oklch={color.oklch} />
 *   <div>Custom content...</div>
 * </ColorDetailPanel>
 * ```
 */
export function ColorDetailPanel({
  color,
  title,
  subtitle,
  onClose,
  previewHeight = 80,
  width = "w-80",
  children,
  className,
  variant = "light",
}: ColorDetailPanelProps) {
  const isLight = variant === "light";

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 rounded-xl shadow-xl overflow-hidden z-40",
        isLight
          ? "bg-white border border-dark-200"
          : "bg-dark-800 border border-dark-700",
        width,
        className
      )}
    >
      {/* Color preview header */}
      <div
        className="w-full"
        style={{ backgroundColor: color, height: previewHeight }}
      />

      {/* Content area */}
      <div className="p-4 space-y-3">
        {/* Header with title and close button */}
        <div className="flex items-start justify-between">
          <div>
            <h4
              className={cn(
                "font-semibold",
                isLight ? "text-dark-900" : "text-white"
              )}
            >
              {title}
            </h4>
            {subtitle && (
              <p
                className={cn(
                  "text-sm font-mono",
                  isLight ? "text-dark-500" : "text-dark-400"
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
          <CloseButton onClick={onClose} variant={variant} />
        </div>

        {/* Custom content */}
        {children}
      </div>
    </div>
  );
}

/**
 * Close button component for panels
 */
interface CloseButtonProps {
  onClick: () => void;
  variant?: "light" | "dark";
}

function CloseButton({ onClick, variant = "light" }: CloseButtonProps) {
  const isLight = variant === "light";

  return (
    <button
      onClick={onClick}
      className={cn(
        "p-1 rounded transition-colors",
        isLight ? "hover:bg-dark-100" : "hover:bg-dark-700"
      )}
    >
      <svg
        className={cn(
          "w-5 h-5",
          isLight ? "text-dark-400" : "text-dark-400"
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}
