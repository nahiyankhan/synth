/**
 * Semantic Token Mapper
 *
 * Maps generated palettes to shadcn-compatible semantic tokens.
 * This creates the "contract" that components consume.
 */

import { wcagContrast } from 'culori';
import {
  type GeneratedPalettes,
  type SemanticTokens,
  type SemanticTokenSet,
  type TailwindStep,
  type ColorScale11,
  TAILWIND_STEPS,
} from '@/types/tailwindPalette';

// =============================================================================
// Step Index Helpers
// =============================================================================

/**
 * Get index in ColorScale11 array for a TailwindStep
 */
function stepIndex(step: TailwindStep): number {
  return TAILWIND_STEPS.indexOf(step);
}

/**
 * Get color at a specific step from a scale
 */
function getStep(scale: ColorScale11, step: TailwindStep): string {
  return scale[stepIndex(step)];
}

// =============================================================================
// Foreground Color Selection
// =============================================================================

/**
 * Determine the best foreground color for a given background
 * Returns the option with better contrast (preferring light/white when possible)
 *
 * @param bgColor - Background color (hex)
 * @param lightOption - Light foreground option (usually white)
 * @param darkOption - Dark foreground option
 * @param minContrast - Minimum acceptable contrast ratio (default: 4.5 for WCAG AA)
 * @returns The foreground color with better contrast
 */
function selectForeground(
  bgColor: string,
  lightOption: string,
  darkOption: string,
  minContrast: number = 4.5
): string {
  const contrastWithLight = wcagContrast(lightOption, bgColor);
  const contrastWithDark = wcagContrast(darkOption, bgColor);

  // Prefer light (white) if it meets minimum contrast
  if (contrastWithLight >= minContrast && contrastWithLight >= contrastWithDark) {
    return lightOption;
  }

  // Otherwise use dark if it meets minimum
  if (contrastWithDark >= minContrast) {
    return darkOption;
  }

  // Fallback to whichever has higher contrast
  return contrastWithLight > contrastWithDark ? lightOption : darkOption;
}

// =============================================================================
// Step Mappings
// =============================================================================

/**
 * Step mappings for light mode semantic tokens
 *
 * These map semantic purposes to specific palette steps based on Radix conventions
 */
const LIGHT_MODE_STEPS = {
  // Backgrounds
  background: 50 as TailwindStep,
  card: 50 as TailwindStep,
  popover: 50 as TailwindStep,
  muted: 100 as TailwindStep,

  // Foregrounds (text)
  foreground: 950 as TailwindStep,
  mutedForeground: 500 as TailwindStep,

  // Interactive
  primary: 600 as TailwindStep,
  accent: 100 as TailwindStep,
  accentForeground: 900 as TailwindStep,

  // Borders
  border: 200 as TailwindStep,
  input: 300 as TailwindStep,
  ring: 500 as TailwindStep,

  // Status
  statusSolid: 600 as TailwindStep,
  statusSubtle: 100 as TailwindStep,
} as const;

/**
 * Step mappings for dark mode semantic tokens
 */
const DARK_MODE_STEPS = {
  // Backgrounds (inverted)
  background: 950 as TailwindStep,
  card: 900 as TailwindStep,
  popover: 900 as TailwindStep,
  muted: 800 as TailwindStep,

  // Foregrounds (text)
  foreground: 50 as TailwindStep,
  mutedForeground: 400 as TailwindStep,

  // Interactive
  primary: 500 as TailwindStep, // Slightly lighter in dark mode
  accent: 900 as TailwindStep,
  accentForeground: 100 as TailwindStep,

  // Borders
  border: 800 as TailwindStep,
  input: 700 as TailwindStep,
  ring: 400 as TailwindStep,

  // Status
  statusSolid: 500 as TailwindStep,
  statusSubtle: 900 as TailwindStep,
} as const;

// =============================================================================
// Semantic Token Generation
// =============================================================================

/**
 * Generate semantic tokens for a single mode
 */
function generateSemanticTokensForMode(
  palettes: GeneratedPalettes,
  mode: 'light' | 'dark'
): SemanticTokens {
  const steps = mode === 'light' ? LIGHT_MODE_STEPS : DARK_MODE_STEPS;
  const { roleMapping } = palettes;

  // Get palette scales
  const gray = palettes.palettes.get('gray');
  const primary = palettes.palettes.get(roleMapping.primary);
  const green = palettes.palettes.get('green');
  const amber = palettes.palettes.get('amber');
  const red = palettes.palettes.get('red');
  const blue = palettes.palettes.get('blue');

  if (!gray || !primary || !green || !amber || !red || !blue) {
    throw new Error('Missing required palettes for semantic token generation');
  }

  const grayScale = gray[mode];
  const primaryScale = primary[mode];
  const greenScale = green[mode];
  const amberScale = amber[mode];
  const redScale = red[mode];
  const blueScale = blue[mode];

  // Base content (text on surfaces)
  const baseContent = getStep(grayScale, steps.foreground);

  // Primary button color and its content
  const primaryColor = getStep(primaryScale, steps.primary);
  const primaryContent = selectForeground(
    primaryColor,
    '#ffffff',
    getStep(primaryScale, 950),
    4.5
  );

  // Secondary
  const secondaryColor = getStep(grayScale, steps.muted);
  const secondaryContent = selectForeground(
    secondaryColor,
    getStep(grayScale, 950),
    getStep(grayScale, 50),
    4.5
  );

  // Accent (subtle primary)
  const accentColor = getStep(primaryScale, steps.accent);
  const accentContent = selectForeground(
    accentColor,
    getStep(primaryScale, 950),
    getStep(primaryScale, 50),
    4.5
  );

  // Neutral (muted)
  const neutralColor = getStep(grayScale, steps.muted);
  const neutralContent = getStep(grayScale, steps.mutedForeground);

  // Error
  const errorColor = getStep(redScale, steps.statusSolid);
  const errorContent = selectForeground(errorColor, '#ffffff', getStep(redScale, 950));

  // Success
  const successColor = getStep(greenScale, steps.statusSolid);
  const successContent = selectForeground(successColor, '#ffffff', getStep(greenScale, 950));

  // Warning
  const warningColor = getStep(amberScale, steps.statusSolid);
  const warningContent = selectForeground(warningColor, '#ffffff', getStep(amberScale, 950));

  // Info
  const infoColor = getStep(blueScale, steps.statusSolid);
  const infoContent = selectForeground(infoColor, '#ffffff', getStep(blueScale, 950));

  return {
    // Surface scale
    base100: getStep(grayScale, steps.background),
    base200: getStep(grayScale, steps.muted),
    base300: getStep(grayScale, steps.card),
    baseContent,

    // Primary
    primary: primaryColor,
    primaryContent,

    // Secondary
    secondary: secondaryColor,
    secondaryContent,

    // Accent
    accent: accentColor,
    accentContent,

    // Neutral
    neutral: neutralColor,
    neutralContent,

    // Status colors
    success: successColor,
    successContent,
    warning: warningColor,
    warningContent,
    error: errorColor,
    errorContent,
    info: infoColor,
    infoContent,

    // Borders
    border: getStep(grayScale, steps.border),
    input: getStep(grayScale, steps.input),
    ring: getStep(primaryScale, steps.ring),
  };
}

/**
 * Generate complete semantic token set for both modes
 *
 * @param palettes - Generated palettes from color mapper
 * @returns Semantic tokens for light and dark modes
 */
export function generateSemanticTokens(palettes: GeneratedPalettes): SemanticTokenSet {
  return {
    light: generateSemanticTokensForMode(palettes, 'light'),
    dark: generateSemanticTokensForMode(palettes, 'dark'),
  };
}

/**
 * Get the step mapping for a specific mode (useful for debugging)
 */
export function getStepMapping(mode: 'light' | 'dark') {
  return mode === 'light' ? LIGHT_MODE_STEPS : DARK_MODE_STEPS;
}

// =============================================================================
// Dependency Tracking
// =============================================================================

/**
 * Represents the source of a semantic token value
 */
export interface TokenSource {
  palette: string;  // e.g., 'gray', 'blue', 'green'
  step: TailwindStep;
}

/**
 * Dependencies for a single semantic token (light and dark modes)
 */
export interface TokenDependencies {
  light: TokenSource[];
  dark: TokenSource[];
}

/**
 * Get the palette dependencies for all semantic tokens.
 * This allows visualizations to show which palette steps each semantic token derives from.
 *
 * @param roleMapping - The role mapping from GeneratedPalettes (e.g., { primary: 'blue' })
 * @returns Map of semantic token name to its palette dependencies
 */
export function getSemanticTokenDependencies(
  roleMapping: { primary: string; secondary?: string }
): Record<string, TokenDependencies> {
  const primary = roleMapping.primary;

  return {
    // Surface scale - all from gray
    base100: {
      light: [{ palette: 'gray', step: LIGHT_MODE_STEPS.background }],
      dark: [{ palette: 'gray', step: DARK_MODE_STEPS.background }],
    },
    base200: {
      light: [{ palette: 'gray', step: LIGHT_MODE_STEPS.muted }],
      dark: [{ palette: 'gray', step: DARK_MODE_STEPS.muted }],
    },
    base300: {
      light: [{ palette: 'gray', step: LIGHT_MODE_STEPS.card }],
      dark: [{ palette: 'gray', step: DARK_MODE_STEPS.card }],
    },
    baseContent: {
      light: [{ palette: 'gray', step: LIGHT_MODE_STEPS.foreground }],
      dark: [{ palette: 'gray', step: DARK_MODE_STEPS.foreground }],
    },

    // Primary - from roleMapping.primary palette
    primary: {
      light: [{ palette: primary, step: LIGHT_MODE_STEPS.primary }],
      dark: [{ palette: primary, step: DARK_MODE_STEPS.primary }],
    },
    primaryContent: {
      // Computed via selectForeground - depends on primary solid step
      light: [{ palette: primary, step: LIGHT_MODE_STEPS.primary }],
      dark: [{ palette: primary, step: DARK_MODE_STEPS.primary }],
    },

    // Secondary - from gray
    secondary: {
      light: [{ palette: 'gray', step: LIGHT_MODE_STEPS.muted }],
      dark: [{ palette: 'gray', step: DARK_MODE_STEPS.muted }],
    },
    secondaryContent: {
      light: [{ palette: 'gray', step: 950 as TailwindStep }],
      dark: [{ palette: 'gray', step: 50 as TailwindStep }],
    },

    // Accent - subtle version of primary
    accent: {
      light: [{ palette: primary, step: LIGHT_MODE_STEPS.accent }],
      dark: [{ palette: primary, step: DARK_MODE_STEPS.accent }],
    },
    accentContent: {
      light: [{ palette: primary, step: LIGHT_MODE_STEPS.accentForeground }],
      dark: [{ palette: primary, step: DARK_MODE_STEPS.accentForeground }],
    },

    // Neutral - from gray
    neutral: {
      light: [{ palette: 'gray', step: LIGHT_MODE_STEPS.muted }],
      dark: [{ palette: 'gray', step: DARK_MODE_STEPS.muted }],
    },
    neutralContent: {
      light: [{ palette: 'gray', step: LIGHT_MODE_STEPS.mutedForeground }],
      dark: [{ palette: 'gray', step: DARK_MODE_STEPS.mutedForeground }],
    },

    // Status colors - fixed palettes
    success: {
      light: [{ palette: 'green', step: LIGHT_MODE_STEPS.statusSolid }],
      dark: [{ palette: 'green', step: DARK_MODE_STEPS.statusSolid }],
    },
    successContent: {
      light: [{ palette: 'green', step: LIGHT_MODE_STEPS.statusSolid }],
      dark: [{ palette: 'green', step: DARK_MODE_STEPS.statusSolid }],
    },
    warning: {
      light: [{ palette: 'amber', step: LIGHT_MODE_STEPS.statusSolid }],
      dark: [{ palette: 'amber', step: DARK_MODE_STEPS.statusSolid }],
    },
    warningContent: {
      light: [{ palette: 'amber', step: LIGHT_MODE_STEPS.statusSolid }],
      dark: [{ palette: 'amber', step: DARK_MODE_STEPS.statusSolid }],
    },
    error: {
      light: [{ palette: 'red', step: LIGHT_MODE_STEPS.statusSolid }],
      dark: [{ palette: 'red', step: DARK_MODE_STEPS.statusSolid }],
    },
    errorContent: {
      light: [{ palette: 'red', step: LIGHT_MODE_STEPS.statusSolid }],
      dark: [{ palette: 'red', step: DARK_MODE_STEPS.statusSolid }],
    },
    info: {
      light: [{ palette: 'blue', step: LIGHT_MODE_STEPS.statusSolid }],
      dark: [{ palette: 'blue', step: DARK_MODE_STEPS.statusSolid }],
    },
    infoContent: {
      light: [{ palette: 'blue', step: LIGHT_MODE_STEPS.statusSolid }],
      dark: [{ palette: 'blue', step: DARK_MODE_STEPS.statusSolid }],
    },

    // Borders - from gray and primary
    border: {
      light: [{ palette: 'gray', step: LIGHT_MODE_STEPS.border }],
      dark: [{ palette: 'gray', step: DARK_MODE_STEPS.border }],
    },
    input: {
      light: [{ palette: 'gray', step: LIGHT_MODE_STEPS.input }],
      dark: [{ palette: 'gray', step: DARK_MODE_STEPS.input }],
    },
    ring: {
      light: [{ palette: primary, step: LIGHT_MODE_STEPS.ring }],
      dark: [{ palette: primary, step: DARK_MODE_STEPS.ring }],
    },
  };
}
