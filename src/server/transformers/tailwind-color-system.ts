/**
 * Tailwind Color System
 *
 * Main entry point for the Tailwind v4 color generation pipeline.
 *
 * Pipeline:
 *   Seeds (LLM) → Palette Generation → Semantic Mapping → CSS Output
 *
 * @example
 * ```typescript
 * import { generateColorSystem, type ColorSeeds } from './tailwind-color-system';
 *
 * const seeds: ColorSeeds = {
 *   brand: {
 *     primary: { hue: 220, chroma: 0.18 },
 *   },
 *   gray: { warmth: 0.2, saturation: 0.012 },
 * };
 *
 * const result = generateColorSystem(seeds);
 * console.log(result.css);
 * ```
 */

// Main entry point
export { generateColorSystem, generateTailwindCSS } from './tailwind-css-generator';

// Palette generation
export {
  generateScale,
  generateGrayScale,
  generateScaleWithMetadata,
  getLightness,
  getChromaMultiplier,
  type OklchValues,
  type ScaleWithMetadata,
} from './tailwind-palette-generator';

// Color mapping
export {
  hueToTailwindName,
  huesOverlap,
  getTailwindCanonicalHue,
  resolveColorSeeds,
} from './tailwind-color-mapper';

// Semantic tokens
export { generateSemanticTokens, getStepMapping } from './semantic-token-mapper';

// Types
export type {
  // Scale types
  TailwindStep,
  ColorScale11,

  // Color names
  TailwindChromaticColor,
  StatusRole,

  // Seeds
  ColorSeed,
  GraySeed,
  ColorSeeds,

  // Palettes
  PaletteRole,
  ResolvedPalette,
  PaletteOverlap,
  RoleMapping,
  GeneratedPalettes,

  // Semantic tokens
  SemanticTokens,
  SemanticTokenSet,

  // Output
  ColorSystemSummary,
  ColorSystemOutput,
} from '../../types/tailwindPalette';

// Constants
export {
  TAILWIND_STEPS,
  TAILWIND_STEP_PURPOSE,
  TAILWIND_CHROMATIC_COLORS,
  TAILWIND_HUE_RANGES,
  STATUS_COLOR_MAPPING,
  DEFAULT_STATUS_SEEDS,
} from '../../types/tailwindPalette';
