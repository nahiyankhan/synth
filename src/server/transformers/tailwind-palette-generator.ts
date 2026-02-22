/**
 * Tailwind Palette Generator
 *
 * Generates 11-step OKLCH color scales from seeds.
 * Deterministic: same seed always produces same palette.
 *
 * Step purposes are based on Radix UI's 12-step scale convention:
 * https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
 */

import { formatHex, clampChroma, type Oklch } from 'culori';
import {
  type TailwindStep,
  type ColorScale11,
  type ColorSeed,
  type GraySeed,
  TAILWIND_STEPS,
} from '../../types/tailwindPalette';

// =============================================================================
// Lightness Curves
// =============================================================================

/**
 * Light mode lightness values per step
 * Tuned for OKLCH perceptual uniformity
 *
 * Adapted from Radix 12-step to Tailwind 11-step
 */
const LIGHTNESS_LIGHT: Record<TailwindStep, number> = {
  50:  0.970, // App background - nearly white
  100: 0.940, // Subtle background
  200: 0.900, // Element background / hover
  300: 0.850, // Active / pressed states
  400: 0.750, // Subtle borders
  500: 0.640, // ANCHOR - borders, focus rings (visible on light & dark)
  600: 0.560, // Solid backgrounds (buttons) - highest chroma
  700: 0.480, // Solid hover
  800: 0.390, // Solid active / emphasis
  900: 0.290, // Text on light backgrounds
  950: 0.190, // Maximum contrast text
};

/**
 * Dark mode lightness values per step
 * Inverted relationship for dark backgrounds
 */
const LIGHTNESS_DARK: Record<TailwindStep, number> = {
  50:  0.130, // App background - nearly black
  100: 0.160, // Subtle background
  200: 0.200, // Element background / hover
  300: 0.250, // Active / pressed states
  400: 0.330, // Subtle borders
  500: 0.450, // ANCHOR - borders, focus rings
  600: 0.560, // Solid backgrounds (often same as light mode)
  700: 0.640, // Solid hover
  800: 0.730, // Solid active
  900: 0.830, // Text on dark backgrounds
  950: 0.920, // Maximum contrast text
};

/**
 * Chroma multipliers per step
 * Controls saturation distribution across the scale
 *
 * 600 has maximum chroma (1.0) as it's the primary brand expression point
 */
const CHROMA_CURVE: Record<TailwindStep, number> = {
  50:  0.08, // Very subtle tint
  100: 0.15, // Subtle tint
  200: 0.28, // Light saturation
  300: 0.45, // Medium-light
  400: 0.65, // Medium
  500: 0.85, // Near-full
  600: 1.00, // Full chroma - primary brand expression
  700: 1.00, // Full chroma for hover
  800: 0.92, // Slightly reduced
  900: 0.78, // Reduced for text readability
  950: 0.62, // Further reduced for high contrast
};

/**
 * Gray chroma multipliers (much lower than chromatic colors)
 */
const GRAY_CHROMA_CURVE: Record<TailwindStep, number> = {
  50:  0.20,
  100: 0.30,
  200: 0.45,
  300: 0.60,
  400: 0.75,
  500: 0.90,
  600: 1.00,
  700: 1.00,
  800: 0.90,
  900: 0.75,
  950: 0.60,
};

// =============================================================================
// Core Generation Functions
// =============================================================================

/**
 * Generate a single OKLCH color and convert to hex
 */
function generateColor(l: number, c: number, h: number): string {
  const color: Oklch = {
    mode: 'oklch',
    l: Math.max(0.01, Math.min(0.99, l)),
    c: Math.max(0, Math.min(0.4, c)),
    h: Number.isNaN(h) ? 0 : ((h % 360) + 360) % 360,
  };

  const clamped = clampChroma(color, 'rgb');
  return formatHex(clamped) || '#000000';
}

/**
 * Generate an 11-step color scale from a seed
 *
 * @param seed - Color seed with hue and chroma
 * @param mode - 'light' or 'dark' mode
 * @returns 11-step color scale as hex values
 */
export function generateScale(
  seed: ColorSeed,
  mode: 'light' | 'dark'
): ColorScale11 {
  const lightnessScale = mode === 'light' ? LIGHTNESS_LIGHT : LIGHTNESS_DARK;
  const baseChroma = Math.max(0.02, Math.min(0.30, seed.chroma));

  const scale = TAILWIND_STEPS.map((step) => {
    const lightness = lightnessScale[step];
    const chromaMultiplier = CHROMA_CURVE[step];
    const stepChroma = baseChroma * chromaMultiplier;
    return generateColor(lightness, stepChroma, seed.hue);
  });

  return scale as unknown as ColorScale11;
}

/**
 * Generate an 11-step gray scale from warmth/saturation
 *
 * @param seed - Gray seed with warmth and saturation
 * @param mode - 'light' or 'dark' mode
 * @returns 11-step gray scale as hex values
 */
export function generateGrayScale(
  seed: GraySeed,
  mode: 'light' | 'dark'
): ColorScale11 {
  const lightnessScale = mode === 'light' ? LIGHTNESS_LIGHT : LIGHTNESS_DARK;

  // Determine hue based on warmth direction
  // Positive warmth → warm yellow/orange hue (45°)
  // Negative warmth → cool blue hue (220°)
  const hue = seed.warmth >= 0 ? 45 : 220;

  // Effective saturation = base saturation × warmth magnitude
  const effectiveSaturation = seed.saturation * Math.abs(seed.warmth);

  const scale = TAILWIND_STEPS.map((step) => {
    const lightness = lightnessScale[step];
    const chromaMultiplier = GRAY_CHROMA_CURVE[step];
    // Gray chroma is much lower - max around 0.02-0.03
    const stepChroma = effectiveSaturation * chromaMultiplier;
    return generateColor(lightness, stepChroma, hue);
  });

  return scale as unknown as ColorScale11;
}

// =============================================================================
// Metadata & Debugging
// =============================================================================

/**
 * OKLCH values for a single step
 */
export interface OklchValues {
  l: number;
  c: number;
  h: number;
}

/**
 * Scale with OKLCH metadata for debugging/validation
 */
export interface ScaleWithMetadata {
  scale: ColorScale11;
  oklch: OklchValues[];
}

/**
 * Generate scale with OKLCH values for debugging/validation
 */
export function generateScaleWithMetadata(
  seed: ColorSeed,
  mode: 'light' | 'dark'
): ScaleWithMetadata {
  const lightnessScale = mode === 'light' ? LIGHTNESS_LIGHT : LIGHTNESS_DARK;
  const baseChroma = Math.max(0.02, Math.min(0.30, seed.chroma));

  const oklch: OklchValues[] = [];

  const scale = TAILWIND_STEPS.map((step) => {
    const l = lightnessScale[step];
    const c = baseChroma * CHROMA_CURVE[step];
    const h = seed.hue;
    oklch.push({ l, c, h });
    return generateColor(l, c, h);
  });

  return {
    scale: scale as unknown as ColorScale11,
    oklch,
  };
}

/**
 * Get the lightness value for a specific step and mode
 */
export function getLightness(step: TailwindStep, mode: 'light' | 'dark'): number {
  return mode === 'light' ? LIGHTNESS_LIGHT[step] : LIGHTNESS_DARK[step];
}

/**
 * Get the chroma multiplier for a specific step
 */
export function getChromaMultiplier(step: TailwindStep): number {
  return CHROMA_CURVE[step];
}
