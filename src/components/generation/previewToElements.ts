/**
 * Preview to Stream Elements Transform
 *
 * Converts generation preview data into StreamElementConfig arrays
 * for visualization in CircularGenerationView.
 */

import type { StreamElementConfig } from "./StreamElement";
import { PHASE_TO_PREVIEW_KEY, type PhaseKey } from "@/constants/generationPhases";
import { oklchToHex } from "@/services/colorScience";

/**
 * Convert hue/chroma to hex color using proper OKLCH conversion
 */
function hueChromaToHex(hue: number, chroma: number = 0.15, lightness: number = 0.55): string {
  return oklchToHex({ l: lightness, c: chroma, h: hue });
}

/**
 * Transform visual direction preview to stream elements
 */
function transformVisualDirection(preview: unknown): StreamElementConfig[] {
  if (!preview || typeof preview !== "object") return [];

  const data = preview as Record<string, unknown>;
  const elements: StreamElementConfig[] = [];

  // Add name as text sample
  if (data.name) {
    elements.push({
      type: "text-sample",
      text: String(data.name),
      fontSize: 20,
      fontWeight: 600,
    });
  }

  // Add traits as token chips
  const traits = data.traits as string[] | undefined;
  if (traits && Array.isArray(traits)) {
    traits.slice(0, 4).forEach((trait) => {
      elements.push({
        type: "token-chip",
        text: trait,
      });
    });
  }

  // Add aesthetic preferences as text samples
  const aesthetics = data.aestheticPreferences as string[] | undefined;
  if (aesthetics && Array.isArray(aesthetics)) {
    aesthetics.slice(0, 3).forEach((pref) => {
      elements.push({
        type: "text-sample",
        text: pref,
        fontSize: 14,
      });
    });
  }

  // Add design principles as token chips
  const principles = data.designPrinciples as string[] | undefined;
  if (principles && Array.isArray(principles)) {
    principles.slice(0, 2).forEach((principle) => {
      elements.push({
        type: "token-chip",
        text: principle,
      });
    });
  }

  return elements;
}

/**
 * Transform tailwind color seeds preview to stream elements
 */
function transformTailwindColors(preview: unknown): StreamElementConfig[] {
  if (!preview || typeof preview !== "object") return [];

  const data = preview as Record<string, unknown>;
  const elements: StreamElementConfig[] = [];

  // Primary color
  if (typeof data.primaryHue === "number") {
    const chroma = (data.primaryChroma as number) || 0.15;
    elements.push({
      type: "color-swatch",
      color: hueChromaToHex(data.primaryHue, chroma, 0.55),
      size: 70,
    });
    elements.push({
      type: "token-chip",
      text: `primary ${Math.round(data.primaryHue)}°`,
    });
  }

  // Secondary color
  if (data.hasSecondary && typeof data.secondaryHue === "number") {
    const chroma = (data.secondaryChroma as number) || 0.12;
    elements.push({
      type: "color-swatch",
      color: hueChromaToHex(data.secondaryHue, chroma, 0.55),
      size: 60,
    });
    elements.push({
      type: "token-chip",
      text: `secondary ${Math.round(data.secondaryHue)}°`,
    });
  }

  // Tertiary color
  if (data.hasTertiary && typeof data.tertiaryHue === "number") {
    const chroma = (data.tertiaryChroma as number) || 0.10;
    elements.push({
      type: "color-swatch",
      color: hueChromaToHex(data.tertiaryHue, chroma, 0.55),
      size: 50,
    });
  }

  // Gray warmth indicator
  if (typeof data.grayWarmth === "number") {
    const warmth = data.grayWarmth;
    const grayHue = warmth > 0 ? 40 : 220; // Warm = yellow-ish, cool = blue-ish
    const graySat = Math.abs(warmth) * 0.05;
    elements.push({
      type: "color-swatch",
      color: hueChromaToHex(grayHue, graySat, 0.5),
      size: 45,
    });
    elements.push({
      type: "token-chip",
      text: warmth > 0 ? "warm gray" : warmth < 0 ? "cool gray" : "neutral",
    });
  }

  return elements;
}

/**
 * Transform foundation seeds preview to stream elements
 */
function transformFoundations(preview: unknown): StreamElementConfig[] {
  if (!preview || typeof preview !== "object") return [];

  const data = preview as Record<string, unknown>;
  const elements: StreamElementConfig[] = [];

  // Typography scale
  if (data.typographyScaleRatio) {
    elements.push({
      type: "text-sample",
      text: "Aa",
      fontSize: 28,
      fontWeight: 700,
    });
    elements.push({
      type: "token-chip",
      text: `scale: ${data.typographyScaleRatio}`,
    });
  }

  // Shadow style
  if (data.shadowIntensity) {
    elements.push({
      type: "token-chip",
      text: `shadow: ${data.shadowIntensity}`,
    });
  }

  // Radius style
  if (data.borderRadius) {
    elements.push({
      type: "token-chip",
      text: `radius: ${data.borderRadius}`,
    });
  }

  // Motion style
  if (data.motionStyle) {
    elements.push({
      type: "token-chip",
      text: `motion: ${data.motionStyle}`,
    });
  }

  // Add some visual flair
  elements.push({
    type: "icon-block",
    icon: "◆",
  });

  return elements;
}

/**
 * Transform tailwind system preview (expanded palette) to stream elements
 */
function transformTailwindSystem(preview: unknown): StreamElementConfig[] {
  if (!preview || typeof preview !== "object") return [];

  const data = preview as Record<string, unknown>;
  const elements: StreamElementConfig[] = [];

  // Palette names
  const paletteNames = data.paletteNames as string[] | undefined;
  if (paletteNames && Array.isArray(paletteNames)) {
    paletteNames.slice(0, 5).forEach((name) => {
      elements.push({
        type: "token-chip",
        text: name,
      });
    });
  }

  // Role mapping indicators
  const roleMapping = data.roleMapping as Record<string, string> | undefined;
  if (roleMapping) {
    Object.entries(roleMapping).slice(0, 4).forEach(([role, palette]) => {
      elements.push({
        type: "token-chip",
        text: `${role} → ${palette}`,
      });
    });
  }

  // Add color swatches for common palette colors (blues, greens, etc.)
  const commonColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  commonColors.forEach((color, i) => {
    elements.push({
      type: "color-swatch",
      color,
      size: 50 - i * 5,
    });
  });

  return elements;
}

/**
 * Transform typography preview to stream elements
 */
function transformTypography(preview: unknown): StreamElementConfig[] {
  if (!preview || typeof preview !== "object") return [];

  const data = preview as Record<string, unknown>;
  const elements: StreamElementConfig[] = [];

  // Font families
  if (data.headingFont) {
    elements.push({
      type: "text-sample",
      text: "Heading",
      fontSize: 24,
      fontWeight: 700,
    });
  }

  if (data.bodyFont) {
    elements.push({
      type: "text-sample",
      text: "Body text",
      fontSize: 16,
      fontWeight: 400,
    });
  }

  // Type scale samples
  const sizes = [32, 24, 18, 14, 12];
  sizes.forEach((size, i) => {
    elements.push({
      type: "text-sample",
      text: i === 0 ? "Display" : i === 1 ? "Title" : i === 2 ? "Body" : i === 3 ? "Small" : "Tiny",
      fontSize: size,
      fontWeight: i < 2 ? 600 : 400,
    });
  });

  // Line height and tracking tokens
  elements.push({ type: "token-chip", text: "leading-tight" });
  elements.push({ type: "token-chip", text: "tracking-wide" });

  return elements;
}

/**
 * Transform design tokens preview to stream elements
 */
function transformDesignTokens(preview: unknown): StreamElementConfig[] {
  if (!preview || typeof preview !== "object") return [];

  const data = preview as Record<string, unknown>;
  const elements: StreamElementConfig[] = [];

  // Token count indicator
  const tokenCount = data.tokenCount as number | undefined;
  if (tokenCount) {
    elements.push({
      type: "text-sample",
      text: `${tokenCount} tokens`,
      fontSize: 18,
      fontWeight: 600,
    });
  }

  // Common token examples
  const tokenExamples = [
    "color.primary",
    "color.secondary",
    "space.4",
    "radius.md",
    "shadow.lg",
    "font.heading",
    "duration.fast",
  ];

  tokenExamples.forEach((token) => {
    elements.push({
      type: "token-chip",
      text: token,
    });
  });

  // Visual indicator
  elements.push({
    type: "icon-block",
    icon: "●",
    iconColor: "#8b5cf6",
  });

  return elements;
}

/**
 * Transform component CSS preview to stream elements
 */
function transformComponentCSS(preview: unknown): StreamElementConfig[] {
  if (!preview || typeof preview !== "object") return [];

  const data = preview as Record<string, unknown>;
  const elements: StreamElementConfig[] = [];

  // CSS generation progress
  if (data.generating) {
    elements.push({
      type: "text-sample",
      text: "Generating...",
      fontSize: 14,
    });
  }

  // Line count
  const lineCount = data.lineCount as number | undefined;
  if (lineCount) {
    elements.push({
      type: "token-chip",
      text: `${lineCount} lines`,
    });
  }

  // Character count
  const charCount = data.charCount as number | undefined;
  if (charCount) {
    elements.push({
      type: "token-chip",
      text: `${Math.round(charCount / 1000)}KB`,
    });
  }

  // Common component classes
  const components = [".x-btn", ".x-card", ".x-input", ".x-badge", ".x-avatar", ".x-modal"];
  components.forEach((comp) => {
    elements.push({
      type: "token-chip",
      text: comp,
    });
  });

  // Colors for component theming
  elements.push({ type: "color-swatch", color: "#10b981", size: 50 });
  elements.push({ type: "color-swatch", color: "#34d399", size: 45 });

  return elements;
}

/**
 * Transform contrast validation preview to stream elements
 */
function transformContrastValidation(preview: unknown): StreamElementConfig[] {
  if (!preview || typeof preview !== "object") return [];

  const data = preview as Record<string, unknown>;
  const elements: StreamElementConfig[] = [];

  // Validation status
  const valid = data.valid as boolean | undefined;
  if (valid !== undefined) {
    elements.push({
      type: "icon-block",
      icon: valid ? "✓" : "⚠",
      iconColor: valid ? "#22c55e" : "#f59e0b",
    });
    elements.push({
      type: "token-chip",
      text: valid ? "WCAG Pass" : "Issues Found",
    });
  }

  // Fixes applied
  const fixes = data.fixes as unknown[] | undefined;
  if (fixes && fixes.length > 0) {
    elements.push({
      type: "token-chip",
      text: `${fixes.length} fixes`,
    });
    elements.push({
      type: "icon-block",
      icon: "✓",
      iconColor: "#22c55e",
    });
  }

  // Contrast ratio examples
  elements.push({ type: "token-chip", text: "4.5:1 AA" });
  elements.push({ type: "token-chip", text: "7:1 AAA" });
  elements.push({
    type: "icon-block",
    icon: "✓",
    iconColor: "#22c55e",
  });

  return elements;
}

/**
 * Transform preview data to stream elements for a specific phase
 */
export function previewToElements(
  phase: PhaseKey,
  previews: Record<string, unknown>
): StreamElementConfig[] {
  // Use centralized mapping from generationPhases.ts
  const previewKey = PHASE_TO_PREVIEW_KEY[phase];
  if (!previewKey) return [];

  const preview = previews[previewKey];
  if (!preview) return [];

  switch (phase) {
    case "visual-direction":
      return transformVisualDirection(preview);
    case "tailwind-colors":
      return transformTailwindColors(preview);
    case "foundations":
      return transformFoundations(preview);
    case "tailwind-system":
      return transformTailwindSystem(preview);
    case "typography":
      return transformTypography(preview);
    case "design-tokens":
      return transformDesignTokens(preview);
    case "component-css":
      return transformComponentCSS(preview);
    case "contrast-validation":
      return transformContrastValidation(preview);
    default:
      return [];
  }
}

/**
 * Get all elements for the current phase, with fallback to defaults if no preview
 */
export function getPhaseElements(
  phase: PhaseKey,
  previews: Record<string, unknown>
): StreamElementConfig[] {
  const elements = previewToElements(phase, previews);

  // If we got elements from preview data, use them
  if (elements.length > 0) {
    return elements;
  }

  // Fallback to minimal placeholder elements while loading
  return getDefaultPhaseElements(phase);
}

/**
 * Get default placeholder elements for a phase (used before data arrives)
 */
function getDefaultPhaseElements(phase: PhaseKey): StreamElementConfig[] {
  switch (phase) {
    case "visual-direction":
      return [
        { type: "text-sample", text: "Analyzing...", fontSize: 16 },
        { type: "icon-block", icon: "◆" },
      ];
    case "tailwind-colors":
      return [
        { type: "color-swatch", color: "#94a3b8", size: 50 },
        { type: "color-swatch", color: "#64748b", size: 45 },
        { type: "token-chip", text: "generating..." },
      ];
    case "foundations":
      return [
        { type: "token-chip", text: "typography" },
        { type: "token-chip", text: "shadows" },
        { type: "token-chip", text: "radius" },
      ];
    case "tailwind-system":
      return [
        { type: "color-swatch", color: "#3b82f6", size: 50 },
        { type: "color-swatch", color: "#10b981", size: 45 },
        { type: "token-chip", text: "expanding..." },
      ];
    case "typography":
      return [
        { type: "text-sample", text: "Aa", fontSize: 28, fontWeight: 700 },
        { type: "text-sample", text: "Body", fontSize: 16 },
      ];
    case "design-tokens":
      return [
        { type: "token-chip", text: "tokens" },
        { type: "icon-block", icon: "●", iconColor: "#8b5cf6" },
      ];
    case "component-css":
      return [
        { type: "token-chip", text: ".x-btn" },
        { type: "token-chip", text: ".x-card" },
        { type: "color-swatch", color: "#10b981", size: 45 },
      ];
    case "contrast-validation":
      return [
        { type: "icon-block", icon: "✓", iconColor: "#22c55e" },
        { type: "token-chip", text: "checking..." },
      ];
    default:
      return [];
  }
}
