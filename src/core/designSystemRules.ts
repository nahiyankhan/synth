/**
 * Design System Rules - The "Physics" of Design Systems
 *
 * These are fixed structural rules that define how design language seeds
 * expand into a complete, accessible design system. They encode:
 * - WCAG contrast requirements
 * - Valid text/background combinations
 * - Color relationship patterns
 * - Elevation and depth strategies
 */

import type {
  DesignSystemRules,
  ContrastPreset,
  ElevationPreset,
  TextLevel,
  BackgroundLevel,
  BorderLevel,
  ShadowLevel,
  SemanticColor,
  AccentVariant,
} from '../types/designLanguage';

// =============================================================================
// Default Design System Rules
// =============================================================================

/**
 * Default design system rules based on WCAG guidelines and
 * common design system patterns (Material, Radix, shadcn)
 */
export const DEFAULT_DESIGN_SYSTEM_RULES: DesignSystemRules = {
  // Text contrast requirements (WCAG 2.1 based)
  // primary: AAA for normal text (7:1)
  // secondary: AA for normal text (4.5:1)
  // tertiary: AA for large text (3:1)
  // disabled: Intentionally low but readable (2.5:1)
  textContrast: {
    primary: 7.0,
    secondary: 4.5,
    tertiary: 3.0,
    disabled: 2.5,
  },

  // Background levels from lowest to highest elevation
  backgroundLevels: ['sunken', 'base', 'surface', 'elevated'],

  // Interface matrix - which text levels are valid on which backgrounds
  // This is pre-computed to guarantee all combinations work
  interfaceMatrix: new Map<BackgroundLevel, TextLevel[]>([
    ['sunken', ['primary', 'secondary', 'tertiary']], // No disabled on sunken (too subtle)
    ['base', ['primary', 'secondary', 'tertiary', 'disabled']],
    ['surface', ['primary', 'secondary', 'tertiary', 'disabled']],
    ['elevated', ['primary', 'secondary', 'tertiary', 'disabled']],
  ]),

  // Accent color variants with lightness/chroma modifiers
  // These create a coherent set of brand color applications
  accentVariants: [
    { name: 'default', lightnessOffset: 0, chromaMultiplier: 1 },
    { name: 'hover', lightnessOffset: -0.05, chromaMultiplier: 1.1 },
    { name: 'active', lightnessOffset: -0.1, chromaMultiplier: 1.15 },
    { name: 'muted', lightnessOffset: 0.1, chromaMultiplier: 0.7 },
    { name: 'subtle', lightnessOffset: 0.25, chromaMultiplier: 0.4 },
  ],

  // Semantic color hues (brand-agnostic, perceptually balanced)
  // These are fixed because they carry universal meaning
  semanticHues: {
    success: 145, // Green
    warning: 45, // Orange/Amber
    error: 25, // Red
    info: 220, // Blue
  },

  // Border opacity levels - how much foreground to mix into background
  borderOpacity: {
    subtle: 0.08,
    default: 0.15,
    emphasis: 0.3,
  },

  // Shadow elevation scale (blur radius in pixels)
  shadowScale: {
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
};

// =============================================================================
// Contrast Presets
// =============================================================================

/**
 * Contrast presets for different visual styles
 *
 * These adjust the WCAG targets based on design intent:
 * - soft: Gentler, lower contrast (good for long-form reading)
 * - normal: Standard WCAG compliance
 * - bold: Maximum contrast and readability
 */
export const CONTRAST_PRESETS: Record<'soft' | 'normal' | 'bold', ContrastPreset> = {
  soft: {
    textContrast: {
      primary: 5.5, // AA large text
      secondary: 4.0,
      tertiary: 2.5,
      disabled: 2.0,
    },
  },
  normal: {
    textContrast: DEFAULT_DESIGN_SYSTEM_RULES.textContrast,
  },
  bold: {
    textContrast: {
      primary: 10.0, // Well above AAA
      secondary: 7.0, // AAA
      tertiary: 4.5, // AA
      disabled: 3.0,
    },
  },
};

// =============================================================================
// Elevation Presets
// =============================================================================

/**
 * Elevation presets for different depth styles
 *
 * backgroundSpread: How much lightness varies between background levels
 * shadowIntensity: Multiplier for shadow opacity
 */
export const ELEVATION_PRESETS: Record<'flat' | 'subtle' | 'layered', ElevationPreset> = {
  flat: {
    backgroundSpread: 0.02, // Almost no difference between levels
    shadowIntensity: 0.1, // Very light shadows
  },
  subtle: {
    backgroundSpread: 0.05, // Gentle hierarchy
    shadowIntensity: 0.3, // Noticeable but soft shadows
  },
  layered: {
    backgroundSpread: 0.08, // Clear visual depth
    shadowIntensity: 0.5, // Pronounced shadows
  },
};

// =============================================================================
// Border Presets
// =============================================================================

/**
 * Border opacity multipliers based on border style setting
 */
export const BORDER_PRESETS: Record<'none' | 'subtle' | 'defined', number> = {
  none: 0, // No borders
  subtle: 0.5, // Half opacity
  defined: 1.0, // Full opacity
};

// =============================================================================
// Semantic Color Variants
// =============================================================================

/**
 * Variants generated for each semantic color
 */
export const SEMANTIC_VARIANTS = [
  { suffix: '', lightnessOffset: 0, chromaMultiplier: 1 }, // Default
  { suffix: '-subtle', lightnessOffset: 0.3, chromaMultiplier: 0.3 }, // For backgrounds
  { suffix: '-muted', lightnessOffset: 0.15, chromaMultiplier: 0.6 }, // For secondary text
  { suffix: '-emphasis', lightnessOffset: -0.1, chromaMultiplier: 1.2 }, // For emphasis
] as const;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get effective text contrast requirements based on contrast preset
 */
export function getEffectiveTextContrast(
  preset: 'soft' | 'normal' | 'bold'
): Record<TextLevel, number> {
  return CONTRAST_PRESETS[preset].textContrast;
}

/**
 * Get effective elevation settings based on preset
 */
export function getEffectiveElevation(
  preset: 'flat' | 'subtle' | 'layered'
): ElevationPreset {
  return ELEVATION_PRESETS[preset];
}

/**
 * Get effective border opacity multiplier
 */
export function getEffectiveBorderMultiplier(
  preset: 'none' | 'subtle' | 'defined'
): number {
  return BORDER_PRESETS[preset];
}

/**
 * Check if a text level is valid on a background level
 */
export function isValidCombination(
  background: BackgroundLevel,
  text: TextLevel,
  rules: DesignSystemRules = DEFAULT_DESIGN_SYSTEM_RULES
): boolean {
  const validTextLevels = rules.interfaceMatrix.get(background);
  return validTextLevels?.includes(text) ?? false;
}

/**
 * Get all valid text levels for a background
 */
export function getValidTextLevels(
  background: BackgroundLevel,
  rules: DesignSystemRules = DEFAULT_DESIGN_SYSTEM_RULES
): TextLevel[] {
  return rules.interfaceMatrix.get(background) ?? [];
}

/**
 * Get all backgrounds a text level can appear on
 */
export function getValidBackgrounds(
  text: TextLevel,
  rules: DesignSystemRules = DEFAULT_DESIGN_SYSTEM_RULES
): BackgroundLevel[] {
  const validBackgrounds: BackgroundLevel[] = [];
  for (const [bg, textLevels] of rules.interfaceMatrix) {
    if (textLevels.includes(text)) {
      validBackgrounds.push(bg);
    }
  }
  return validBackgrounds;
}
