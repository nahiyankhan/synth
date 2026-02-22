/**
 * Tailwind CSS Generator
 *
 * Generates Tailwind v4 compatible CSS from palettes and semantic tokens.
 * Output can be directly used with @import in a Tailwind project.
 */

import {
  type GeneratedPalettes,
  type SemanticTokens,
  type SemanticTokenSet,
  type ColorSeeds,
  type ColorScale11,
  type ColorSystemOutput,
  type ColorSystemSummary,
  type StructuralSeeds,
  type StructuralTokens,
  type TypographySeeds,
  type ShadowSeeds,
  type TypographyTokens,
  type ShadowTokens,
  type MotionTokens,
  TAILWIND_STEPS,
  RADIUS_PRESETS,
  DEPTH_PRESETS,
  DEFAULT_STRUCTURAL_SEEDS,
} from '@/types/tailwindPalette';

import { toKebabCase } from '@/lib/utils/string-utils';
import { resolveColorSeeds } from './tailwind-color-mapper';
import { generateSemanticTokens } from './semantic-token-mapper';
import {
  generateTypographyTokens,
  generateTypographyCSS,
  generateShadowTokens,
  generateShadowCSS,
  generateMotionCSS,
  getMotionTokens,
  type FoundationTokens,
} from './foundation-generators';

// =============================================================================
// CSS Generation Helpers
// =============================================================================

/**
 * Generate CSS variable declarations for a palette scale
 */
function generatePaletteCSS(
  name: string,
  scale: ColorScale11,
  indent: string = '  '
): string[] {
  return TAILWIND_STEPS.map(
    (step, i) => `${indent}--color-${name}-${step}: ${scale[i]};`
  );
}

/**
 * Generate semantic token CSS variables
 */
function generateSemanticCSS(
  tokens: SemanticTokens,
  indent: string = '  '
): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(tokens)) {
    const cssKey = toKebabCase(key);
    lines.push(`${indent}--color-${cssKey}: ${value};`);
  }

  return lines;
}

/**
 * Resolve structural seeds to concrete token values
 */
function resolveStructuralTokens(seeds: StructuralSeeds): StructuralTokens {
  const radiusValues = RADIUS_PRESETS[seeds.radiusStyle];
  const depthValue = DEPTH_PRESETS[seeds.depthStyle];

  return {
    radiusSelector: radiusValues.radiusSelector,
    radiusField: radiusValues.radiusField,
    radiusBox: radiusValues.radiusBox,
    radiusFull: '9999px',
    depth: depthValue,
    ringWidth: '2px',
    ringOffset: '2px',
    borderWidth: `${seeds.borderWidth ?? 1}px`,
  };
}

/**
 * Generate structural token CSS variables
 */
function generateStructuralCSS(
  tokens: StructuralTokens,
  indent: string = '  '
): string[] {
  return [
    '',
    `${indent}/* =========================================================`,
    `${indent} * Structural Tokens`,
    `${indent} * ========================================================= */`,
    '',
    `${indent}/* Radius Scale */`,
    `${indent}--radius: ${tokens.radiusField};`,
    `${indent}--radius-selector: ${tokens.radiusSelector};`,
    `${indent}--radius-field: ${tokens.radiusField};`,
    `${indent}--radius-box: ${tokens.radiusBox};`,
    `${indent}--radius-full: ${tokens.radiusFull};`,
    '',
    `${indent}/* Depth & Effects */`,
    `${indent}--depth: ${tokens.depth};`,
    '',
    `${indent}/* Focus Ring */`,
    `${indent}--ring-width: ${tokens.ringWidth};`,
    `${indent}--ring-offset: ${tokens.ringOffset};`,
    '',
    `${indent}/* Border Width */`,
    `${indent}--border-width: ${tokens.borderWidth};`,
  ];
}

// =============================================================================
// Main CSS Generation
// =============================================================================

/**
 * Generate complete Tailwind v4 CSS theme
 *
 * @param palettes - Generated palettes with Tailwind names
 * @param semantics - Semantic tokens for both modes
 * @param structural - Optional structural tokens for radius, depth, etc.
 * @param foundations - Optional foundation tokens for typography, shadow, motion
 * @returns Complete CSS string
 */
export function generateTailwindCSS(
  palettes: GeneratedPalettes,
  semantics: SemanticTokenSet,
  structural?: StructuralTokens,
  foundations?: FoundationTokens
): string {
  const lines: string[] = [];

  // Header
  lines.push('/**');
  lines.push(' * Design Language - Tailwind v4 Theme');
  lines.push(' * Auto-generated color system with shadcn compatibility');
  lines.push(' *');
  lines.push(' * Step purposes adapted from Radix UI (not official Tailwind):');
  lines.push(' * https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale');
  lines.push(' *');
  lines.push(' * Palette scales: bg-{color}-{50-950}, text-{color}-{50-950}');
  lines.push(' * Semantic tokens: bg-background, text-foreground, bg-primary, etc.');
  lines.push(' */');
  lines.push('');

  // Light mode (default) - use :root for runtime injection
  lines.push(':root {');
  lines.push('  /* =========================================================');
  lines.push('   * Color Palette Scales');
  lines.push('   * Usage: bg-gray-100, text-blue-600, border-red-300');
  lines.push('   * ========================================================= */');
  lines.push('');

  // Generate palette scales (light mode)
  for (const [name, palette] of palettes.palettes) {
    lines.push(`  /* ${name} - ${palette.role} */`);
    lines.push(...generatePaletteCSS(name, palette.light));
    lines.push('');
  }

  lines.push('  /* =========================================================');
  lines.push('   * Semantic Tokens (shadcn compatible)');
  lines.push('   * Usage: bg-background, text-foreground, bg-primary, etc.');
  lines.push('   * ========================================================= */');
  lines.push('');

  // Generate semantic tokens (light mode)
  lines.push(...generateSemanticCSS(semantics.light));

  // Generate structural tokens (same for light/dark)
  if (structural) {
    lines.push(...generateStructuralCSS(structural));
  }

  // Generate foundation tokens (typography, shadow, motion)
  if (foundations) {
    lines.push(...generateTypographyCSS(foundations.typography));
    lines.push(...generateShadowCSS(foundations.shadow));
    lines.push(...generateMotionCSS(foundations.motion));
  }

  lines.push('}');
  lines.push('');

  // Dark mode - use .dark class for runtime
  lines.push('.dark {');
  lines.push('  /* =========================================================');
  lines.push('   * Dark Mode - Palette Scales');
  lines.push('   * ========================================================= */');
  lines.push('');

  // Generate palette scales (dark mode)
  for (const [name, palette] of palettes.palettes) {
    lines.push(`  /* ${name} */`);
    lines.push(...generatePaletteCSS(name, palette.dark));
    lines.push('');
  }

  lines.push('  /* =========================================================');
  lines.push('   * Dark Mode - Semantic Tokens');
  lines.push('   * ========================================================= */');
  lines.push('');

  // Generate semantic tokens (dark mode)
  lines.push(...generateSemanticCSS(semantics.dark));


  lines.push('}');

  // Usage examples
  lines.push('');
  lines.push('/* =========================================================');
  lines.push(' * Usage Examples');
  lines.push(' * =========================================================');
  lines.push(' *');
  lines.push(' * Semantic (recommended for components):');
  lines.push(' *   <div class="bg-background text-foreground">');
  lines.push(' *   <button class="bg-primary text-primary-foreground">');
  lines.push(' *   <div class="border border-border">');
  lines.push(' *   <span class="text-muted-foreground">');
  lines.push(' *');
  lines.push(' * Palette scales (for custom styling):');
  lines.push(' *   <div class="bg-blue-100 border-blue-300">');
  lines.push(' *   <span class="text-gray-600">');
  lines.push(' *   <button class="bg-teal-500 hover:bg-teal-600">');
  lines.push(' *');
  lines.push(' * Status colors:');
  lines.push(' *   <div class="bg-destructive text-destructive-foreground">');
  lines.push(' *   <span class="text-success">');
  lines.push(' *   <div class="bg-warning text-warning-foreground">');
  lines.push(' * ========================================================= */');

  return lines.join('\n');
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Foundation seeds for typography and shadow
 */
export interface FoundationSeeds {
  typography?: TypographySeeds;
  shadow?: ShadowSeeds;
}

/**
 * Generate complete color system from seeds
 *
 * This is the main entry point - takes LLM seeds and produces
 * Tailwind-compatible CSS with semantic tokens and foundations.
 *
 * @param seeds - Color seeds from LLM
 * @param structuralSeeds - Optional structural seeds for radius, depth, etc.
 * @param foundationSeeds - Optional foundation seeds for typography, shadow
 * @returns Complete color system with CSS, palettes, and semantic tokens
 *
 * @example
 * ```typescript
 * const seeds: ColorSeeds = {
 *   brand: {
 *     primary: { hue: 220, chroma: 0.18 },
 *     secondary: { hue: 175, chroma: 0.12 },
 *   },
 *   gray: { warmth: 0.2, saturation: 0.012 },
 * };
 *
 * const structuralSeeds: StructuralSeeds = {
 *   radiusStyle: 'rounded',
 *   depthStyle: 'subtle',
 * };
 *
 * const foundationSeeds: FoundationSeeds = {
 *   typography: { scaleRatio: 'majorThird' },
 *   shadow: { intensity: 'subtle', colorStyle: 'neutral', blurStyle: 'soft' },
 * };
 *
 * const result = generateColorSystem(seeds, structuralSeeds, foundationSeeds);
 * console.log(result.css);
 * ```
 */
export function generateColorSystem(
  seeds: ColorSeeds,
  structuralSeeds?: StructuralSeeds,
  foundationSeeds?: FoundationSeeds
): ColorSystemOutput {
  // 1. Resolve seeds to Tailwind-named palettes
  const palettes = resolveColorSeeds(seeds);

  // 2. Generate semantic tokens
  const semantics = generateSemanticTokens(palettes);

  // 3. Resolve structural tokens (use defaults if not provided)
  const effectiveStructuralSeeds = structuralSeeds ?? DEFAULT_STRUCTURAL_SEEDS;
  const structural = resolveStructuralTokens(effectiveStructuralSeeds);

  // 4. Generate foundation tokens (typography, shadow, motion)
  const foundations: FoundationTokens = {
    typography: generateTypographyTokens(foundationSeeds?.typography),
    shadow: generateShadowTokens(foundationSeeds?.shadow),
    motion: getMotionTokens(),
  };

  // 5. Generate CSS
  const css = generateTailwindCSS(palettes, semantics, structural, foundations);

  // 6. Build summary
  const paletteNames = Array.from(palettes.palettes.keys());

  const summary: ColorSystemSummary = {
    paletteCount: paletteNames.length,
    paletteNames,
    overlaps: palettes.overlaps,
    roleMapping: palettes.roleMapping,
  };

  return {
    seeds,
    palettes,
    semantics,
    css,
    summary,
    structural,
    foundations,
  };
}

// =============================================================================
// Utility Exports
// =============================================================================

export { resolveColorSeeds } from './tailwind-color-mapper';
export { generateSemanticTokens } from './semantic-token-mapper';
export {
  generateScale,
  generateGrayScale,
  generateScaleWithMetadata,
} from './tailwind-palette-generator';
export { hueToTailwindName, huesOverlap } from './tailwind-color-mapper';
