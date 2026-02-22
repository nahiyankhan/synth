/**
 * OKLCHDisplay - Displays OKLCH color values in a grid
 *
 * Reusable component for showing Lightness, Chroma, and Hue values
 * from OKLCH color space with light/dark theme variants.
 */

import React from "react";
import { cn } from "../../../lib/utils";
import type { OKLCHColor } from "../../../services/colorScience";

export interface OKLCHDisplayProps {
  /** OKLCH color values */
  oklch: OKLCHColor;
  /** Visual variant - light (default) or dark */
  variant?: "light" | "dark";
  /** Whether to show full labels or abbreviated */
  showFullLabels?: boolean;
  /** Precision for chroma display (default: 3) */
  chromaPrecision?: number;
  /** Additional className for the container */
  className?: string;
}

const variantStyles = {
  light: {
    container: "bg-dark-50",
    value: "text-dark-900",
    label: "text-dark-500",
  },
  dark: {
    container: "bg-dark-700",
    value: "text-white",
    label: "text-dark-400",
  },
};

const labels = {
  full: { l: "Lightness", c: "Chroma", h: "Hue" },
  short: { l: "L", c: "C", h: "H" },
};

/**
 * A grid showing L/C/H values from OKLCH color space.
 *
 * @example
 * ```tsx
 * // Light theme with full labels
 * <OKLCHDisplay oklch={color.oklch} showFullLabels />
 *
 * // Dark theme with short labels
 * <OKLCHDisplay oklch={color.oklch} variant="dark" />
 * ```
 */
export function OKLCHDisplay({
  oklch,
  variant = "light",
  showFullLabels = false,
  chromaPrecision = 3,
  className,
}: OKLCHDisplayProps) {
  const styles = variantStyles[variant];
  const labelSet = showFullLabels ? labels.full : labels.short;

  const values = [
    {
      value: `${(oklch.l * 100).toFixed(0)}%`,
      label: labelSet.l,
    },
    {
      value: chromaPrecision === 0
        ? `${(oklch.c * 100).toFixed(0)}%`
        : oklch.c.toFixed(chromaPrecision),
      label: labelSet.c,
    },
    {
      value: `${oklch.h.toFixed(0)}°`,
      label: labelSet.h,
    },
  ];

  return (
    <div className={cn("grid grid-cols-3 gap-2 text-center", className)}>
      {values.map(({ value, label }) => (
        <div
          key={label}
          className={cn("rounded-lg p-2", styles.container)}
        >
          <div className={cn("text-lg font-semibold", styles.value)}>
            {value}
          </div>
          <div className={cn("text-xs", styles.label)}>{label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Format OKLCH values as an inline string.
 *
 * @example
 * formatOKLCHInline(oklch) // "L: 50% C: 0.120 H: 220°"
 * formatOKLCHInline(oklch, 1) // "L: 50.0% C: 0.1 H: 220.0°"
 */
export function formatOKLCHInline(
  oklch: OKLCHColor,
  precision: number = 0
): string {
  const { l, c, h } = oklch;
  return `L: ${(l * 100).toFixed(precision)}% C: ${c.toFixed(precision === 0 ? 3 : precision)} H: ${h.toFixed(precision)}°`;
}
