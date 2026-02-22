/**
 * CSS Utilities
 *
 * Shared utilities for generating CSS custom properties and blocks.
 */

import { toKebabCase } from "@/toolCalls/lib/utils/string-utils";

export interface CSSVariableOptions {
  /** Indentation prefix (default: "  ") */
  indent?: string;
  /** Optional header comment to add above the block */
  headerComment?: string;
  /** CSS variable prefix (default: "--") */
  prefix?: string;
  /** Whether to convert keys to kebab-case (default: true) */
  convertToKebab?: boolean;
}

/**
 * Generate CSS variable declarations from a token object.
 *
 * Example:
 *   const tokens = { shadowXs: "0 1px 2px", shadowSm: "0 2px 4px" };
 *   generateCSSVariables(tokens, { prefix: "--shadow-" });
 *   // Returns: ["  --shadow-xs: 0 1px 2px;", "  --shadow-sm: 0 2px 4px;"]
 */
export function generateCSSVariables<T extends Record<string, string | number>>(
  tokens: T,
  options: CSSVariableOptions = {}
): string[] {
  const {
    indent = "  ",
    headerComment,
    prefix = "--",
    convertToKebab = true,
  } = options;

  const lines: string[] = [];

  if (headerComment) {
    lines.push(`${indent}/* ${headerComment} */`);
  }

  for (const [key, value] of Object.entries(tokens)) {
    if (value === undefined || value === null) continue;

    const cssKey = convertToKebab ? toKebabCase(key) : key;
    lines.push(`${indent}${prefix}${cssKey}: ${value};`);
  }

  return lines;
}

/**
 * Generate a CSS variable block with an optional selector wrapper.
 *
 * Example:
 *   generateCSSVariableBlock(tokens, { selector: ":root" });
 *   // Returns: ":root {\n  --shadow-xs: ...;\n}"
 */
export function generateCSSVariableBlock<T extends Record<string, string | number>>(
  tokens: T,
  options: CSSVariableOptions & { selector?: string } = {}
): string {
  const { selector, ...variableOptions } = options;
  const lines = generateCSSVariables(tokens, variableOptions);

  if (selector) {
    return `${selector} {\n${lines.join("\n")}\n}`;
  }

  return lines.join("\n");
}

/**
 * Generate multiple CSS variable blocks grouped by category.
 *
 * Example:
 *   generateGroupedCSSVariables({
 *     shadows: { xs: "...", sm: "..." },
 *     motion: { durationFast: "100ms" },
 *   }, {
 *     shadows: { prefix: "--shadow-" },
 *     motion: { prefix: "--" },
 *   });
 */
export function generateGroupedCSSVariables<
  T extends Record<string, Record<string, string | number>>
>(
  groups: T,
  groupOptions: { [K in keyof T]?: CSSVariableOptions } = {}
): string[] {
  const allLines: string[] = [];

  for (const [groupKey, tokens] of Object.entries(groups)) {
    const options = groupOptions[groupKey as keyof T] || {};
    const lines = generateCSSVariables(tokens, options);

    if (lines.length > 0) {
      allLines.push(...lines);
      allLines.push(""); // Empty line between groups
    }
  }

  // Remove trailing empty line
  if (allLines[allLines.length - 1] === "") {
    allLines.pop();
  }

  return allLines;
}

/**
 * Format a CSS color value for different output formats.
 *
 * Supports: "hex" (default), "hsl", "rgb"
 */
export function formatCSSColor(
  hex: string,
  format: "hex" | "hsl" | "rgb" = "hex"
): string {
  if (format === "hex") {
    return hex;
  }

  // Remove # and handle alpha
  const cleanHex = hex.replace("#", "");
  const hasAlpha = cleanHex.length === 8;

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const a = hasAlpha ? parseInt(cleanHex.substring(6, 8), 16) / 255 : 1;

  if (format === "rgb") {
    return hasAlpha
      ? `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
      : `rgb(${r}, ${g}, ${b})`;
  }

  // HSL conversion
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return hasAlpha
    ? `hsla(${hDeg}, ${sPct}%, ${lPct}%, ${a.toFixed(2)})`
    : `hsl(${hDeg}, ${sPct}%, ${lPct}%)`;
}
