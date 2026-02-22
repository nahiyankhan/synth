/**
 * Rules-Based Design Language Type System
 *
 * Defines the minimal AI-generated "seeds" that get deterministically
 * expanded into a complete, accessibility-compliant design system.
 */

// =============================================================================
// Core Type Definitions
// =============================================================================

/**
 * Text hierarchy levels - ordered by visual prominence
 */
export type TextLevel = 'primary' | 'secondary' | 'tertiary' | 'disabled';

/**
 * Background hierarchy levels - ordered by elevation
 * sunken < base < surface < elevated
 */
export type BackgroundLevel = 'sunken' | 'base' | 'surface' | 'elevated';

/**
 * Border visibility levels
 */
export type BorderLevel = 'subtle' | 'default' | 'emphasis';

/**
 * Shadow/elevation scale
 */
export type ShadowLevel = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Semantic color categories
 */
export type SemanticColor = 'success' | 'warning' | 'error' | 'info';

/**
 * Color mode
 */
export type ColorMode = 'light' | 'dark';

// =============================================================================
// Design Language Seeds (AI Output)
// =============================================================================

/**
 * DesignLanguage - Minimal AI-generated creative input
 *
 * This is what the LLM produces. Everything else is derived deterministically
 * from these 8 seeds using structural rules.
 *
 * @example
 * {
 *   brandHue: 220,           // Blue brand
 *   brandChroma: 0.15,       // Medium saturation
 *   neutralBase: "#1a1a1a",  // Dark neutral
 *   neutralWarmth: 0.1,      // Slightly warm
 *   mode: "dark",
 *   contrast: "bold",
 *   elevation: "layered",
 *   borders: "subtle"
 * }
 */
export interface DesignLanguage {
  /**
   * Primary brand color hue (0-360 degrees on OKLCH color wheel)
   * This single value determines all accent/brand color variants
   */
  brandHue: number;

  /**
   * Brand color saturation/chroma (0-0.4)
   * Higher = more vibrant, lower = more muted
   */
  brandChroma: number;

  /**
   * Neutral palette anchor color (hex)
   * The foundation from which all background/text colors derive
   */
  neutralBase: string;

  /**
   * Neutral color temperature adjustment (-1 to +1)
   * -1 = cool/blue tint, +1 = warm/yellow tint, 0 = neutral gray
   */
  neutralWarmth: number;

  /**
   * Default color mode
   */
  mode: ColorMode;

  /**
   * Overall contrast level - affects WCAG targets
   * - soft: Lower contrast, gentler on eyes (AA minimum)
   * - normal: Standard WCAG AA/AAA targets
   * - bold: High contrast, maximum readability
   */
  contrast: 'soft' | 'normal' | 'bold';

  /**
   * Visual depth/layering style - affects background hierarchy spread
   * - flat: Minimal elevation differences
   * - subtle: Gentle layering
   * - layered: Pronounced depth with clear hierarchy
   */
  elevation: 'flat' | 'subtle' | 'layered';

  /**
   * Border visibility style
   * - none: No visible borders (relies on spacing/shadows)
   * - subtle: Light, barely visible borders
   * - defined: Clear, visible borders
   */
  borders: 'none' | 'subtle' | 'defined';

  /**
   * Optional overrides for semantic color hues
   * If not provided, uses defaults (green=145, yellow=45, red=25, blue=220)
   */
  semanticOverrides?: {
    successHue?: number;
    warningHue?: number;
    errorHue?: number;
    infoHue?: number;
  };
}

// =============================================================================
// Color Seeds v2 (New Architecture)
// =============================================================================

/**
 * A single color seed with hue, chroma, and LLM justification
 */
export interface ColorSeed {
  /** Hue angle (0-360 degrees on OKLCH color wheel) */
  hue: number;
  /** Chroma/saturation (0.05-0.30 for most use cases) */
  chroma: number;
  /** LLM's reasoning for this color choice */
  justification: string;
}

/**
 * Brand color trio - primary, secondary, tertiary
 */
export interface BrandColors {
  /** Primary brand color - the main identity color */
  primary: ColorSeed;
  /** Secondary brand color - complementary/supporting */
  secondary: ColorSeed;
  /** Tertiary brand color - accent/highlight */
  tertiary: ColorSeed;
}

/**
 * Grayscale configuration with warmth and saturation
 */
export interface GrayConfig {
  /** Temperature: -1 (cool/blue) to +1 (warm/yellow) */
  warmth: number;
  /** Saturation/tint amount: 0 (pure gray) to 0.03 (tinted) */
  saturation: number;
  /** LLM's reasoning for this gray configuration */
  justification: string;
}

/**
 * Status colors for semantic meaning
 */
export interface StatusColors {
  success: ColorSeed;
  warning: ColorSeed;
  error: ColorSeed;
  info: ColorSeed;
}

/**
 * A named accent color
 */
export interface AccentColor extends ColorSeed {
  /** Descriptive name: "highlight", "callout", "feature", etc. */
  name: string;
}

/**
 * Optional accent colors with LLM reasoning
 */
export interface AccentConfig {
  /** Array of accent colors (0-3 typically) */
  colors: AccentColor[];
  /** LLM's reasoning for why accents are/aren't needed */
  reasoning: string;
}

/**
 * ColorSeeds v2 - New architecture for world-class color generation
 *
 * LLM generates these seeds with justifications, then deterministic
 * expansion creates full 12-step palettes and semantic mappings.
 *
 * @example
 * {
 *   brand: {
 *     primary: { hue: 220, chroma: 0.18, justification: "Blue for trust" },
 *     secondary: { hue: 175, chroma: 0.12, justification: "Teal for freshness" },
 *     tertiary: { hue: 280, chroma: 0.10, justification: "Purple for premium" }
 *   },
 *   gray: { warmth: 0.15, saturation: 0.015, justification: "Warm grays feel approachable" },
 *   status: {
 *     success: { hue: 145, chroma: 0.15, justification: "Classic green" },
 *     warning: { hue: 45, chroma: 0.18, justification: "Amber for attention" },
 *     error: { hue: 25, chroma: 0.20, justification: "Red-orange for urgency" },
 *     info: { hue: 220, chroma: 0.12, justification: "Matches brand primary" }
 *   },
 *   accents: {
 *     colors: [{ name: "highlight", hue: 60, chroma: 0.20, justification: "Yellow for promos" }],
 *     reasoning: "Single accent for professional brand"
 *   },
 *   mode: "light",
 *   contrast: "normal",
 *   elevation: "subtle"
 * }
 */
export interface ColorSeeds {
  /** Brand identity colors (required) */
  brand: BrandColors;

  /** Grayscale configuration (required) */
  gray: GrayConfig;

  /** Status/semantic colors (required) */
  status: StatusColors;

  /** Optional accent colors - LLM decides if needed */
  accents?: AccentConfig;

  /** Default color mode */
  mode: ColorMode;

  /** Contrast level preset */
  contrast: 'soft' | 'normal' | 'bold';

  /** Elevation/depth style */
  elevation: 'flat' | 'subtle' | 'layered';
}

// =============================================================================
// Palette Generation Types (Layer 2)
// =============================================================================

/**
 * 12-step scale step numbers (1-12, Radix-style)
 */
export type ScaleStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Purpose mapping for each scale step
 */
export const SCALE_STEP_PURPOSE: Record<ScaleStep, string> = {
  1: 'app-background',
  2: 'subtle-background',
  3: 'element-background',
  4: 'hovered-element',
  5: 'active-element',
  6: 'subtle-border',
  7: 'element-border',
  8: 'hovered-border',
  9: 'solid-background',
  10: 'hovered-solid',
  11: 'low-contrast-text',
  12: 'high-contrast-text',
};

/**
 * A single step in a color scale with metadata
 */
export interface ColorScaleStep {
  /** Hex color value */
  value: string;
  /** Step number (1-12) */
  step: ScaleStep;
  /** Purpose description */
  purpose: string;
  /** OKLCH values for reference */
  oklch: OKLCHColor;
}

/**
 * A complete 12-step color scale
 */
export type ColorScale = [string, string, string, string, string, string, string, string, string, string, string, string];

/**
 * Generated palettes from color seeds
 */
export interface GeneratedPalettes {
  /** Brand color scales */
  primary: ColorScale;
  secondary: ColorScale;
  tertiary: ColorScale;

  /** Gray scale (with warmth applied) */
  gray: ColorScale;

  /** Status color scales */
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;

  /** Optional accent scales (keyed by name) */
  accents?: Record<string, ColorScale>;
}

// =============================================================================
// Semantic Mapping Types (Layer 3)
// =============================================================================

/**
 * Universal semantic colors (from gray + brand primary)
 */
export interface UniversalSemantics {
  background: {
    app: string;
    subtle: string;
    element: string;
    elevated: string;
    sunken: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  border: {
    subtle: string;
    default: string;
    emphasis: string;
  };
  interactive: {
    default: string;
    hover: string;
    active: string;
    subtle: string;
    subtleHover: string;
  };
}

/**
 * Status-specific semantic colors
 */
export interface StatusSemantics {
  background: {
    subtle: string;
    solid: string;
  };
  text: {
    default: string;
    onSolid: string;
  };
  border: string;
  icon: string;
}

/**
 * Accent semantic colors
 */
export interface AccentSemantics {
  background: {
    subtle: string;
    solid: string;
  };
  text: {
    default: string;
    onSolid: string;
  };
  border: string;
}

/**
 * Complete semantic mapping for a single mode
 */
export interface SemanticMapping {
  universal: UniversalSemantics;
  status: {
    success: StatusSemantics;
    warning: StatusSemantics;
    error: StatusSemantics;
    info: StatusSemantics;
  };
  accents?: Record<string, AccentSemantics>;
}

// =============================================================================
// Expanded Design System v2 (Output)
// =============================================================================

/**
 * Duplicate hex detection result
 */
export interface DuplicateHex {
  hex: string;
  tokens: string[];
}

/**
 * Enhanced validation result
 */
export interface ValidationResultV2 extends ValidationResult {
  /** Detected duplicate hex values */
  duplicateHexes?: DuplicateHex[];
  /** Text hierarchy issues */
  hierarchyIssues?: string[];
}

/**
 * ExpandedDesignSystemV2 - New architecture output
 *
 * Contains all palettes, semantic mappings, and validation
 * for both light and dark modes.
 */
export interface ExpandedDesignSystemV2 {
  /** Generated 12-step palettes */
  palettes: GeneratedPalettes;

  /** Semantic mappings per mode */
  semantics: {
    light: SemanticMapping;
    dark: SemanticMapping;
  };

  /** Validation results */
  validation: ValidationResultV2;

  /** Original seeds used to generate this system */
  seeds: ColorSeeds;

  /** All justifications from the LLM */
  justifications: {
    brand: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    gray: string;
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    accents?: string;
  };
}

// =============================================================================
// Design System Rules (Fixed "Physics")
// =============================================================================

/**
 * Accent variant definition for generating color variants from brand hue
 */
export interface AccentVariant {
  /** Variant name (e.g., 'default', 'hover', 'muted', 'subtle') */
  name: string;
  /** Lightness offset from base (-0.2 to +0.2) */
  lightnessOffset: number;
  /** Chroma multiplier (0-2, where 1 = unchanged) */
  chromaMultiplier: number;
}

/**
 * DesignSystemRules - Fixed structural rules that define how seeds expand
 *
 * These are the "physics" of the design system - they don't change based on
 * brand identity, they define the relationships and constraints that make
 * a design system work.
 */
export interface DesignSystemRules {
  /**
   * Text contrast requirements (WCAG contrast ratios)
   * Maps each text level to its minimum contrast requirement
   */
  textContrast: Record<TextLevel, number>;

  /**
   * Background levels in elevation order (lowest to highest)
   */
  backgroundLevels: BackgroundLevel[];

  /**
   * Interface matrix - valid text/background combinations
   * Defines which text levels can appear on which backgrounds
   */
  interfaceMatrix: Map<BackgroundLevel, TextLevel[]>;

  /**
   * Accent color variants with their modifiers
   */
  accentVariants: AccentVariant[];

  /**
   * Semantic color hues (brand-agnostic defaults)
   */
  semanticHues: Record<SemanticColor, number>;

  /**
   * Border opacity levels (0-1)
   */
  borderOpacity: Record<BorderLevel, number>;

  /**
   * Shadow elevation scale (in pixels)
   */
  shadowScale: Record<ShadowLevel, number>;
}

/**
 * Contrast level presets
 */
export interface ContrastPreset {
  textContrast: Record<TextLevel, number>;
}

/**
 * Elevation level presets
 */
export interface ElevationPreset {
  /** How much backgrounds spread apart in lightness */
  backgroundSpread: number;
  /** Shadow intensity multiplier */
  shadowIntensity: number;
}

// =============================================================================
// Expanded Design System (Output)
// =============================================================================

/**
 * Mode-specific color record
 */
export interface ModeColors<T extends string> {
  light: Record<T, string>;
  dark: Record<T, string>;
}

/**
 * Contrast validation issue
 */
export interface ContrastIssue {
  text: TextLevel;
  background: BackgroundLevel;
  actual: number;
  required: number;
  mode: ColorMode;
}

/**
 * Validation results for the expanded design system
 */
export interface ValidationResult {
  /** Whether all interface matrix combinations pass */
  passed: boolean;
  /** List of contrast issues found */
  contrastIssues: ContrastIssue[];
}

/**
 * ExpandedDesignSystem - Result of deterministic expansion
 *
 * Contains all computed colors for both light and dark modes,
 * with validation results confirming accessibility compliance.
 */
export interface ExpandedDesignSystem {
  /**
   * Background colors for the hierarchy
   */
  backgrounds: ModeColors<BackgroundLevel>;

  /**
   * Text colors (guaranteed contrast against valid backgrounds)
   */
  text: ModeColors<TextLevel>;

  /**
   * Accent/brand color variants
   */
  accent: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };

  /**
   * Border colors
   */
  borders: ModeColors<BorderLevel>;

  /**
   * Semantic colors (success/warning/error/info + variants)
   */
  semantic: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };

  /**
   * Shadow values (mode-independent)
   */
  shadows: Record<ShadowLevel, string>;

  /**
   * Validation results
   */
  validation: ValidationResult;

  /**
   * Original seeds used to generate this system
   */
  seeds: DesignLanguage;
}

// =============================================================================
// Tailwind Class Vocabulary (Final Output)
// =============================================================================

/**
 * Single class entry in the vocabulary manifest
 */
export interface TailwindClassEntry {
  /** CSS custom property name (e.g., '--color-bg-base') */
  cssVariable: string;
  /** Light mode value (hex) */
  light: string;
  /** Dark mode value (hex) */
  dark: string;
  /** Contrast ratio against primary background (for text classes) */
  contrastRatio?: number;
  /** Which background classes this text class is valid on */
  validOn?: string[];
}

/**
 * TailwindClassVocabulary - Explicit manifest for generative UI
 *
 * This is what generative AI consumes to know exactly which classes
 * are available and what they mean.
 */
export interface TailwindClassVocabulary {
  /**
   * Available background utility classes
   * e.g., ['bg-base', 'bg-surface', 'bg-elevated', 'bg-sunken']
   */
  backgrounds: string[];

  /**
   * Available text utility classes
   * e.g., ['text-primary', 'text-secondary', 'text-tertiary', 'text-disabled']
   */
  text: string[];

  /**
   * Available accent utility classes
   * e.g., ['accent', 'accent-hover', 'accent-muted', 'accent-subtle']
   */
  accent: string[];

  /**
   * Available border utility classes
   * e.g., ['border-subtle', 'border-default', 'border-emphasis']
   */
  borders: string[];

  /**
   * Available semantic utility classes
   * e.g., ['success', 'success-subtle', 'warning', 'error', 'info']
   */
  semantic: string[];

  /**
   * Full manifest mapping class names to their values
   */
  manifest: Record<string, TailwindClassEntry>;

  /**
   * Version identifier for cache invalidation
   */
  version: string;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Helper type for functions that work with either mode
 */
export type ForMode<T> = (mode: ColorMode) => T;

/**
 * OKLCH color representation
 */
export interface OKLCHColor {
  l: number; // Lightness 0-1
  c: number; // Chroma 0-0.4+
  h: number; // Hue 0-360
}
