/**
 * FilterBanner - Displays filtered count with clear action
 *
 * A reusable banner component that shows how many items are being filtered
 * and provides a clear filter action.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FilterBannerProps {
  /** Number of items after filtering */
  count: number;
  /** Label for the type of items (e.g., "colors", "tokens", "items") */
  itemLabel?: string;
  /** Callback when clear filter is clicked */
  onClear?: () => void;
  /** Additional className for the container */
  className?: string;
  /** Custom message format. Use {count} as placeholder. */
  message?: string;
  /** Visual variant - light (default) or dark for dark backgrounds */
  variant?: "light" | "dark";
}

const variantStyles = {
  light: {
    container: "bg-blue-50 border-blue-200 rounded-lg",
    text: "text-blue-700",
    button: "text-blue-600 hover:text-blue-800",
  },
  dark: {
    container: "bg-blue-900/30 border-blue-800/50 border-b",
    text: "text-blue-300",
    button: "text-blue-400 hover:text-blue-300",
  },
};

/**
 * A banner showing filtered count with optional clear button.
 *
 * @example
 * ```tsx
 * <FilterBanner
 *   count={filteredNodes.length}
 *   itemLabel="colors"
 *   onClear={() => setFilter(null)}
 * />
 *
 * // Dark variant for dark backgrounds
 * <FilterBanner
 *   count={10}
 *   variant="dark"
 *   onClear={handleClear}
 * />
 * ```
 */
export function FilterBanner({
  count,
  itemLabel = "items",
  onClear,
  className,
  message,
  variant = "light",
}: FilterBannerProps) {
  const displayMessage = message
    ? message.replace("{count}", String(count))
    : `Filtered to ${count} ${itemLabel}`;

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "px-4 py-2 flex items-center justify-between",
        variant === "light" && "mb-6",
        styles.container,
        className
      )}
    >
      <span className={cn("text-sm", styles.text)}>{displayMessage}</span>
      {onClear && (
        <button
          onClick={onClear}
          className={cn("text-sm underline", styles.button)}
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
