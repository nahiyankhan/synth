/**
 * Pure color scale generation using OKLCH color space
 * Ported from interface-machine's brand/core/color.ts
 */

import { formatHex, oklch, clampChroma } from 'culori';

export interface ColorScaleOptions {
  seedColor: string;
  size?: number;
  lightnessRange?: [number, number];
  chromaClamp?: [number, number];
}

export const TOKEN_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

/**
 * Generate a color scale in OKLCH color space
 * Pure deterministic function - given same inputs, returns same outputs
 * 
 * OKLCH is perceptually uniform - equal steps in lightness = equal perceived difference
 */
export function generateColorScale({
  seedColor,
  size = 10,
  lightnessRange = [0.95, 0.20],
  chromaClamp = [0.02, 0.18]
}: ColorScaleOptions): string[] {
  const seedOklch = oklch(seedColor);
  if (!seedOklch) {
    throw new Error(`Invalid seed color: ${seedColor}`);
  }

  const [lightStart, lightEnd] = lightnessRange;
  const [chromaMin, chromaMax] = chromaClamp;

  const scale: string[] = [];

  for (let i = 0; i < size; i++) {
    const step = i / (size - 1);
    const lightness = lightStart + (lightEnd - lightStart) * step;

    // Preserve the seed's chroma, but clamp to reasonable bounds
    let chroma = seedOklch.c || 0.1;
    chroma = Math.max(chromaMin, Math.min(chromaMax, chroma));

    const color = {
      mode: 'oklch' as const,
      l: lightness,
      c: chroma,
      h: seedOklch.h || 0
    };

    // Clamp to RGB gamut to ensure valid colors
    const clamped = clampChroma(color, 'rgb');
    const hex = formatHex(clamped);
    scale.push(hex || '#000000');
  }

  return scale;
}

/**
 * Expand multiple base colors into full scales
 */
export function expandBaseColors(
  baseColors: Record<string, string>,
  size = 10
): Record<string, string[]> {
  const expanded: Record<string, string[]> = {};

  for (const [name, color] of Object.entries(baseColors)) {
    try {
      expanded[name] = generateColorScale({ seedColor: color, size });
    } catch (error) {
      console.warn(`Failed to generate scale for ${name}:`, error);
      // Fallback: just use the original color
      expanded[name] = [color];
    }
  }

  return expanded;
}

export interface ColorToken {
  name: string;
  value: string;
  step?: number;
}

/**
 * Format a color scale into tokens with step names (50, 100, 200, etc.)
 */
export function formatScaleToTokens(role: string, scale: string[]): ColorToken[] {
  const tokens: ColorToken[] = [];

  for (let i = 0; i < scale.length && i < TOKEN_STEPS.length; i++) {
    const step = TOKEN_STEPS[i];
    const value = scale[i];
    if (step !== undefined && value !== undefined) {
      tokens.push({
        name: `${role}.${step}`,
        value: value,
        step
      });
    }
  }

  return tokens;
}

/**
 * Get the middle shade (500) from a scale
 */
export function getMiddleShade(scale: string[]): string {
  // For a 10-step scale, index 5 is the 500 shade
  return scale[5] || scale[Math.floor(scale.length / 2)] || scale[0];
}

