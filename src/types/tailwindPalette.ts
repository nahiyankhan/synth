/**
 * Tailwind v4 Color Palette Types
 *
 * Defines the type system for seed-based color generation that outputs
 * Tailwind-compatible 11-step scales and shadcn-compatible semantic tokens.
 */

// =============================================================================
// Tailwind Scale Types
// =============================================================================

/**
 * Tailwind's 11-step color scale (50-950)
 */
export type TailwindStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export const TAILWIND_STEPS: readonly TailwindStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/**
 * A complete 11-step color scale (array of hex/oklch values)
 */
export type ColorScale11 = readonly [string, string, string, string, string, string, string, string, string, string, string];

/**
 * Purpose of each step (Radix-inspired convention, NOT Tailwind official)
 *
 * Adapted from Radix UI's 12-step scale:
 * https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
 *
 * Tailwind does NOT officially document step purposes. Their docs only state
 * that 50 is lightest, 950 is darkest, and 500 is "typically the base color."
 * https://tailwindcss.com/docs/colors
 */
export const TAILWIND_STEP_PURPOSE: Record<TailwindStep, string> = {
  50:  'app-background',           // Radix 1
  100: 'subtle-background',        // Radix 2
  200: 'element-background-hover', // Radix 3-4 (combined)
  300: 'element-background-active',// Radix 5
  400: 'border-subtle',            // Radix 6
  500: 'border-default',           // Radix 7 - ANCHOR (visible on light & dark)
  600: 'solid-background',         // Radix 9 (highest chroma)
  700: 'solid-background-hover',   // Radix 10
  800: 'solid-background-active',  // Radix 8 (repurposed)
  900: 'text-on-light',            // Radix 11
  950: 'text-emphasis',            // Radix 12
};

// =============================================================================
// Tailwind Color Names
// =============================================================================

/**
 * All Tailwind chromatic color names (excluding neutrals)
 */
export const TAILWIND_CHROMATIC_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald',
  'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
  'fuchsia', 'pink', 'rose'
] as const;

export type TailwindChromaticColor = typeof TAILWIND_CHROMATIC_COLORS[number];

/**
 * Status colors mapping to fixed Tailwind names
 */
export const STATUS_COLOR_MAPPING = {
  success: 'green',
  warning: 'amber',
  error: 'red',
  info: 'blue',
} as const;

export type StatusRole = keyof typeof STATUS_COLOR_MAPPING;

/**
 * Hue ranges for mapping arbitrary hues to Tailwind color names
 * [startHue, endHue] - wraps at 360
 */
export const TAILWIND_HUE_RANGES: Record<TailwindChromaticColor, readonly [number, number]> = {
  rose:    [345, 10],
  red:     [10, 35],
  orange:  [35, 50],
  amber:   [50, 62],
  yellow:  [62, 80],
  lime:    [80, 105],
  green:   [105, 140],
  emerald: [140, 165],
  teal:    [165, 185],
  cyan:    [185, 200],
  sky:     [200, 215],
  blue:    [215, 245],
  indigo:  [245, 265],
  violet:  [265, 285],
  purple:  [285, 310],
  fuchsia: [310, 330],
  pink:    [330, 345],
};

// =============================================================================
// Color Seeds (LLM Output)
// =============================================================================

/**
 * A single color seed - minimal input for palette generation
 */
export interface ColorSeed {
  /** Hue angle in OKLCH (0-360) */
  hue: number;
  /** Chroma/saturation (0.05 - 0.30) */
  chroma: number;
}

/**
 * Gray configuration seed
 */
export interface GraySeed {
  /** Temperature: -1 (cool/blue) to +1 (warm/yellow) */
  warmth: number;
  /** Tint amount: 0 (pure gray) to 0.02 (subtly tinted) */
  saturation: number;
}

/**
 * Complete color seeds from LLM
 * This is the ONLY creative input - everything else is deterministic
 */
export interface ColorSeeds {
  /** Brand colors */
  brand: {
    primary: ColorSeed;
    secondary?: ColorSeed;
    tertiary?: ColorSeed;
  };

  /** Additional accent colors (optional) */
  accents?: ColorSeed[];

  /** Gray/neutral configuration */
  gray: GraySeed;

  /** Status color overrides (optional - uses sensible defaults if not provided) */
  status?: {
    success?: ColorSeed;
    warning?: ColorSeed;
    error?: ColorSeed;
    info?: ColorSeed;
  };
}

/**
 * Default status color seeds (used when not overridden)
 */
export const DEFAULT_STATUS_SEEDS: Record<StatusRole, ColorSeed> = {
  success: { hue: 145, chroma: 0.16 },
  warning: { hue: 55, chroma: 0.18 },
  error: { hue: 25, chroma: 0.22 },
  info: { hue: 220, chroma: 0.14 },
};

// =============================================================================
// Generated Palettes
// =============================================================================

/**
 * Palette role indicating what the palette is used for
 */
export type PaletteRole =
  | 'brand-primary'
  | 'brand-secondary'
  | 'brand-tertiary'
  | 'brand-accent'
  | 'status'
  | 'neutral';

/**
 * A resolved palette with its Tailwind name and source
 */
export interface ResolvedPalette {
  /** Tailwind color name (e.g., 'blue', 'teal', 'pink') */
  name: TailwindChromaticColor | 'gray';
  /** The 11-step scale for light mode */
  light: ColorScale11;
  /** The 11-step scale for dark mode */
  dark: ColorScale11;
  /** What this palette is used for */
  role: PaletteRole;
  /** Original seed that generated this */
  seed: ColorSeed | GraySeed;
}

/**
 * Overlap information when brand colors conflict with status colors
 */
export interface PaletteOverlap {
  role: string;
  requestedHue: number;
  mappedTo: TailwindChromaticColor;
  conflictedWith: string;
  resolution: 'merged' | 'renamed';
}

/**
 * Role mapping showing which Tailwind color name each role uses
 */
export interface RoleMapping {
  primary: TailwindChromaticColor;
  secondary?: TailwindChromaticColor;
  tertiary?: TailwindChromaticColor;
  accents: TailwindChromaticColor[];
  success: 'green';
  warning: 'amber';
  error: 'red';
  info: 'blue';
  neutral: 'gray';
}

/**
 * Complete generated palette set
 */
export interface GeneratedPalettes {
  /** All resolved palettes keyed by Tailwind name */
  palettes: Map<string, ResolvedPalette>;

  /** Mapping of semantic roles to Tailwind color names */
  roleMapping: RoleMapping;

  /** Any overlaps that were detected and resolved */
  overlaps: PaletteOverlap[];
}

// =============================================================================
// Semantic Tokens (shadcn Compatibility)
// =============================================================================

/**
 * Semantic token contract (DaisyUI-style naming)
 * These are the tokens that components actually use
 */
export interface SemanticTokens {
  // Surface scale (base-100 is lightest, base-300 is darkest surface)
  base100: string;
  base200: string;
  base300: string;
  baseContent: string;

  // Primary (brand action color)
  primary: string;
  primaryContent: string;

  // Secondary
  secondary: string;
  secondaryContent: string;

  // Accent (subtle primary)
  accent: string;
  accentContent: string;

  // Neutral (for muted elements)
  neutral: string;
  neutralContent: string;

  // Status colors
  success: string;
  successContent: string;
  warning: string;
  warningContent: string;
  error: string;
  errorContent: string;
  info: string;
  infoContent: string;

  // Borders & Inputs
  border: string;
  input: string;
  ring: string;
}

/**
 * Complete semantic token set for both modes
 */
export interface SemanticTokenSet {
  light: SemanticTokens;
  dark: SemanticTokens;
}

// =============================================================================
// Final Output
// =============================================================================

/**
 * Summary information for debugging and validation
 */
export interface ColorSystemSummary {
  paletteCount: number;
  paletteNames: string[];
  overlaps: PaletteOverlap[];
  roleMapping: RoleMapping;
}

/**
 * Foundation tokens (typography, shadow, motion)
 */
export interface FoundationTokens {
  typography: TypographyTokens;
  shadow: ShadowTokens;
  motion: MotionTokens;
}

/**
 * Complete color system output
 */
export interface ColorSystemOutput {
  /** Original seeds */
  seeds: ColorSeeds;

  /** Generated palettes with Tailwind names */
  palettes: GeneratedPalettes;

  /** Semantic tokens for shadcn */
  semantics: SemanticTokenSet;

  /** Generated CSS */
  css: string;

  /** Summary for debugging */
  summary: ColorSystemSummary;

  /** Structural tokens (optional - for enhanced theming) */
  structural?: StructuralTokens;

  /** Foundation tokens (typography, shadow, motion) */
  foundations?: FoundationTokens;
}

// =============================================================================
// Structural Tokens (DaisyUI-inspired)
// =============================================================================

/**
 * Radius style presets
 * - sharp: Minimal border radius, technical/professional feel
 * - rounded: Standard border radius, balanced and modern
 * - pill: Large border radius, friendly and approachable
 */
export type RadiusStyle = 'sharp' | 'rounded' | 'pill';

/**
 * Depth style presets (shadow intensity)
 * - flat: No shadows, minimalist design
 * - subtle: Light shadows, clean modern look
 * - elevated: Pronounced shadows, material-like depth
 */
export type DepthStyle = 'flat' | 'subtle' | 'elevated';

/**
 * Structural seeds from LLM - defines shape and depth characteristics
 */
export interface StructuralSeeds {
  /** Border radius style */
  radiusStyle: RadiusStyle;
  /** Shadow/depth intensity */
  depthStyle: DepthStyle;
  /** Border width preference (1 or 2 px) */
  borderWidth?: 1 | 2;
}

/**
 * Resolved structural tokens (CSS values)
 */
export interface StructuralTokens {
  /** Border radius for small interactive elements (buttons, tabs) */
  radiusSelector: string;
  /** Border radius for form fields (inputs, textareas) */
  radiusField: string;
  /** Border radius for containers (cards, dialogs) */
  radiusBox: string;
  /** Full pill radius */
  radiusFull: string;
  /** Depth multiplier (0-2) */
  depth: number;
  /** Focus ring width */
  ringWidth: string;
  /** Focus ring offset */
  ringOffset: string;
  /** Default border width */
  borderWidth: string;
}

/**
 * Radius presets mapping styles to concrete values
 */
export const RADIUS_PRESETS: Record<RadiusStyle, Pick<StructuralTokens, 'radiusSelector' | 'radiusField' | 'radiusBox'>> = {
  sharp: {
    radiusSelector: '0.125rem',
    radiusField: '0.25rem',
    radiusBox: '0.375rem',
  },
  rounded: {
    radiusSelector: '0.375rem',
    radiusField: '0.5rem',
    radiusBox: '0.75rem',
  },
  pill: {
    radiusSelector: '0.5rem',
    radiusField: '0.75rem',
    radiusBox: '1rem',
  },
};

/**
 * Depth presets mapping styles to multiplier values
 */
export const DEPTH_PRESETS: Record<DepthStyle, number> = {
  flat: 0,
  subtle: 1,
  elevated: 2,
};

/**
 * Default structural seeds
 */
export const DEFAULT_STRUCTURAL_SEEDS: StructuralSeeds = {
  radiusStyle: 'rounded',
  depthStyle: 'subtle',
  borderWidth: 1,
};

// =============================================================================
// Typography Scale
// =============================================================================

/**
 * Typography scale ratios - each creates different hierarchy intensity
 */
export type TypographyScaleRatio =
  | 'majorSecond'    // 1.125 - subtle, dense UI
  | 'minorThird'     // 1.200 - balanced, most apps
  | 'majorThird'     // 1.250 - clear hierarchy
  | 'perfectFourth'  // 1.333 - bold, high contrast
  | 'goldenRatio';   // 1.618 - premium, editorial

export const TYPOGRAPHY_RATIOS: Record<TypographyScaleRatio, number> = {
  majorSecond: 1.125,
  minorThird: 1.200,
  majorThird: 1.250,
  perfectFourth: 1.333,
  goldenRatio: 1.618,
};

/**
 * Typography seeds - minimal input for scale generation
 */
export interface TypographySeeds {
  /** Scale ratio for type hierarchy */
  scaleRatio: TypographyScaleRatio;
  /** Base font size in pixels (default: 16) */
  baseFontSize?: number;
  /** Line height for body text (default: 1.5) */
  lineHeightBody?: number;
  /** Line height for headings (default: 1.2) */
  lineHeightHeading?: number;
}

/**
 * Generated typography tokens
 */
export interface TypographyTokens {
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeBase: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontSize2xl: string;
  fontSize3xl: string;
  fontSize4xl: string;
  lineHeightTight: number;
  lineHeightNormal: number;
  lineHeightRelaxed: number;
}

export const DEFAULT_TYPOGRAPHY_SEEDS: TypographySeeds = {
  scaleRatio: 'majorThird',
  baseFontSize: 16,
  lineHeightBody: 1.5,
  lineHeightHeading: 1.2,
};

// =============================================================================
// Shadow Scale
// =============================================================================

/**
 * Shadow intensity presets
 */
export type ShadowIntensity = 'none' | 'subtle' | 'medium' | 'dramatic';

/**
 * Shadow color style
 */
export type ShadowColorStyle = 'neutral' | 'tinted';

/**
 * Shadow blur style
 */
export type ShadowBlurStyle = 'sharp' | 'soft';

/**
 * Shadow seeds - minimal input for shadow generation
 */
export interface ShadowSeeds {
  /** How strong the shadows are */
  intensity: ShadowIntensity;
  /** Whether shadows use neutral black or brand tint */
  colorStyle: ShadowColorStyle;
  /** Sharp (small blur) vs soft (large blur) */
  blurStyle: ShadowBlurStyle;
}

/**
 * Generated shadow tokens
 */
export interface ShadowTokens {
  shadowXs: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
}

export const DEFAULT_SHADOW_SEEDS: ShadowSeeds = {
  intensity: 'subtle',
  colorStyle: 'neutral',
  blurStyle: 'soft',
};

// =============================================================================
// Motion (Deterministic - No Seeds)
// =============================================================================

/**
 * Motion tokens - standard values that work across brands
 */
export interface MotionTokens {
  durationFast: string;
  durationNormal: string;
  durationSlow: string;
  easeDefault: string;
  easeIn: string;
  easeOut: string;
  easeBounce: string;
}

export const MOTION_TOKENS: MotionTokens = {
  durationFast: '150ms',
  durationNormal: '250ms',
  durationSlow: '400ms',
  easeDefault: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};
