/**
 * Contrast Validator
 *
 * Parses generated component CSS, validates text/background color pairs against
 * WCAG 2.1 contrast requirements, and auto-fixes violations by finding passing
 * alternatives from the generated palette.
 *
 * WCAG Requirements:
 * - Normal text: 4.5:1 minimum (AA), 7:1 (AAA)
 * - Large text (18pt+ or 14pt bold): 3:1 minimum (AA), 4.5:1 (AAA)
 */

import { wcagContrast } from 'culori';
import { TAILWIND_STEPS, type ColorSystemOutput, type TailwindStep, type ColorScale11 } from '../../types/tailwindPalette';
import { toKebabCase } from '../../lib/utils/string-utils';

// =============================================================================
// Types
// =============================================================================

export interface ContrastViolation {
  /** CSS selector where violation occurred */
  selector: string;
  /** The text/foreground color */
  foreground: string;
  /** The background color */
  background: string;
  /** Resolved hex value of foreground */
  foregroundHex: string;
  /** Resolved hex value of background */
  backgroundHex: string;
  /** Actual contrast ratio */
  ratio: number;
  /** Required contrast ratio */
  required: number;
  /** WCAG level that failed */
  level: 'AA' | 'AAA';
}

export interface ContrastFix {
  /** CSS selector that was fixed */
  selector: string;
  /** Original foreground value */
  originalForeground: string;
  /** New foreground value */
  newForeground: string;
  /** Original contrast ratio */
  originalRatio: number;
  /** New contrast ratio */
  newRatio: number;
  /** Explanation of the fix */
  reason: string;
}

export interface ContrastValidationResult {
  /** Whether all checks passed (no violations after fixing) */
  valid: boolean;
  /** Original violations found */
  violations: ContrastViolation[];
  /** Fixes that were applied */
  fixes: ContrastFix[];
  /** The corrected CSS */
  fixedCSS: string;
  /** Any violations that couldn't be auto-fixed */
  unfixable: ContrastViolation[];
}

interface ParsedRule {
  selector: string;
  properties: Map<string, string>;
  rawBlock: string;
  startIndex: number;
  endIndex: number;
}

interface ColorPair {
  selector: string;
  foreground: string | null;
  background: string | null;
  rule: ParsedRule;
}

// =============================================================================
// CSS Parsing
// =============================================================================

/**
 * Parse CSS into individual rules with their properties
 */
function parseCSS(css: string): ParsedRule[] {
  const rules: ParsedRule[] = [];

  // Match CSS rules: selector { properties }
  // Handles nested selectors and media queries by capturing the outermost blocks
  const ruleRegex = /([^{}]+)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;

  let match;
  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();

    // Skip @-rules like @media, @keyframes (they need special handling)
    if (selector.startsWith('@')) {
      continue;
    }

    // Parse properties
    const properties = new Map<string, string>();
    const propRegex = /([a-z-]+)\s*:\s*([^;]+);?/gi;
    let propMatch;
    while ((propMatch = propRegex.exec(body)) !== null) {
      properties.set(propMatch[1].toLowerCase(), propMatch[2].trim());
    }

    rules.push({
      selector,
      properties,
      rawBlock: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return rules;
}

/**
 * Extract color pairs (foreground + background) from parsed rules
 */
function extractColorPairs(rules: ParsedRule[]): ColorPair[] {
  const pairs: ColorPair[] = [];

  for (const rule of rules) {
    const foreground = rule.properties.get('color') || null;
    const background = rule.properties.get('background-color') ||
                       rule.properties.get('background') || null;

    // Only include if we have at least a foreground color
    // (background might be inherited or transparent)
    if (foreground) {
      pairs.push({
        selector: rule.selector,
        foreground,
        background,
        rule,
      });
    }
  }

  return pairs;
}

// =============================================================================
// Color Resolution
// =============================================================================

/**
 * Build a lookup map from CSS variable names to hex values
 */
function buildColorLookup(colorSystem: ColorSystemOutput): Map<string, { light: string; dark: string }> {
  const lookup = new Map<string, { light: string; dark: string }>();

  // Add semantic tokens
  const semanticKeys = Object.keys(colorSystem.semantics.light) as (keyof typeof colorSystem.semantics.light)[];
  for (const key of semanticKeys) {
    // Convert camelCase to kebab-case for CSS variable matching
    const cssName = toKebabCase(key);
    lookup.set(cssName, {
      light: colorSystem.semantics.light[key],
      dark: colorSystem.semantics.dark[key],
    });
    // Also store without conversion for direct matches
    lookup.set(key.toLowerCase(), {
      light: colorSystem.semantics.light[key],
      dark: colorSystem.semantics.dark[key],
    });
  }

  // Add palette colors
  const steps = TAILWIND_STEPS;
  for (const [paletteName, palette] of colorSystem.palettes.palettes) {
    for (let i = 0; i < steps.length; i++) {
      const varName = `${paletteName}-${steps[i]}`;
      lookup.set(varName, {
        light: palette.light[i],
        dark: palette.dark[i],
      });
    }
  }

  return lookup;
}

/**
 * Resolve a CSS color value to a hex color
 * Handles: var(--color-name), hex, rgb(), etc.
 */
function resolveColor(
  value: string,
  lookup: Map<string, { light: string; dark: string }>,
  mode: 'light' | 'dark' = 'light'
): string | null {
  if (!value) return null;

  // Handle CSS variables: var(--color-name) or var(--color-name, fallback)
  const varMatch = value.match(/var\(\s*--(?:color-)?([^,)]+)(?:,\s*([^)]+))?\s*\)/);
  if (varMatch) {
    const varName = varMatch[1].trim();
    const fallback = varMatch[2]?.trim();

    const resolved = lookup.get(varName);
    if (resolved) {
      return mode === 'light' ? resolved.light : resolved.dark;
    }

    // Try fallback
    if (fallback) {
      return resolveColor(fallback, lookup, mode);
    }

    return null;
  }

  // Handle direct hex colors
  if (value.startsWith('#')) {
    return value;
  }

  // Handle rgb/rgba - convert to hex
  const rgbMatch = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Handle oklch() - would need conversion, skip for now
  if (value.includes('oklch')) {
    return null;
  }

  // Handle color keywords (basic ones)
  const keywords: Record<string, string> = {
    white: '#ffffff',
    black: '#000000',
    transparent: null as any,
    inherit: null as any,
    currentColor: null as any,
  };

  if (value in keywords) {
    return keywords[value];
  }

  return null;
}

// =============================================================================
// Contrast Checking
// =============================================================================

/**
 * Check contrast ratio between two colors
 */
function checkContrast(fg: string, bg: string): number {
  try {
    return wcagContrast(fg, bg);
  } catch {
    return 0;
  }
}

/**
 * Find violations in color pairs
 */
function findViolations(
  pairs: ColorPair[],
  lookup: Map<string, { light: string; dark: string }>,
  minRatio: number = 4.5
): ContrastViolation[] {
  const violations: ContrastViolation[] = [];

  for (const pair of pairs) {
    if (!pair.foreground) continue;

    // Resolve colors (check light mode - dark mode would need separate pass)
    const fgHex = resolveColor(pair.foreground, lookup, 'light');

    // For background, use white as default if not specified
    let bgHex = pair.background
      ? resolveColor(pair.background, lookup, 'light')
      : '#ffffff';

    if (!fgHex || !bgHex) continue;

    const ratio = checkContrast(fgHex, bgHex);

    if (ratio < minRatio) {
      violations.push({
        selector: pair.selector,
        foreground: pair.foreground,
        background: pair.background || '(inherited white)',
        foregroundHex: fgHex,
        backgroundHex: bgHex,
        ratio: Math.round(ratio * 100) / 100,
        required: minRatio,
        level: minRatio >= 7 ? 'AAA' : 'AA',
      });
    }
  }

  return violations;
}

// =============================================================================
// Auto-Fix
// =============================================================================

/**
 * Find a passing color from the palette that's closest to the original
 * Searches BOTH directions (lighter and darker) and picks the closest passing option
 */
function findPassingAlternative(
  originalValue: string,
  backgroundHex: string,
  colorSystem: ColorSystemOutput,
  minRatio: number = 4.5
): { value: string; hex: string; ratio: number } | null {
  // Extract the palette name from the original value
  // e.g., "var(--color-primary-400)" -> "primary"
  const varMatch = originalValue.match(/var\(\s*--(?:color-)?([a-z]+-?)(\d+)/i);

  if (!varMatch) {
    // Can't determine palette, try white/black or any passing color
    return findAnyPassingColor(backgroundHex, colorSystem, minRatio);
  }

  const paletteName = varMatch[1].replace(/-$/, '');
  const originalStep = parseInt(varMatch[2]) as TailwindStep;

  // Get the palette
  const palette = colorSystem.palettes.palettes.get(paletteName);
  if (!palette) {
    return findAnyPassingColor(backgroundHex, colorSystem, minRatio);
  }

  const steps = TAILWIND_STEPS;
  const originalIndex = steps.indexOf(originalStep);

  // Find ALL passing colors in the palette with their distance from original
  const passingOptions: Array<{
    step: TailwindStep;
    hex: string;
    ratio: number;
    distance: number;
  }> = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const hex = palette.light[i];
    const ratio = checkContrast(hex, backgroundHex);

    if (ratio >= minRatio) {
      passingOptions.push({
        step,
        hex,
        ratio: Math.round(ratio * 100) / 100,
        distance: Math.abs(i - originalIndex),
      });
    }
  }

  // If we found passing options in the palette, pick the closest one
  if (passingOptions.length > 0) {
    // Sort by distance (closest first), then by ratio (higher is better for ties)
    passingOptions.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return b.ratio - a.ratio;
    });

    const best = passingOptions[0];
    return {
      value: `var(--color-${paletteName}-${best.step})`,
      hex: best.hex,
      ratio: best.ratio,
    };
  }

  // No passing color in same palette, try white/black or gray
  return findAnyPassingColor(backgroundHex, colorSystem, minRatio);
}

/**
 * Find any passing color - tries white/black first, then gray palette
 */
function findAnyPassingColor(
  backgroundHex: string,
  colorSystem: ColorSystemOutput,
  minRatio: number = 4.5
): { value: string; hex: string; ratio: number } | null {
  const bgLightness = getLightness(backgroundHex);

  // Try white and black first - they're often the best universal fallbacks
  const whiteRatio = checkContrast('#ffffff', backgroundHex);
  const blackRatio = checkContrast('#000000', backgroundHex);

  // For light backgrounds, prefer black; for dark backgrounds, prefer white
  // But use whichever passes with better ratio
  if (bgLightness > 0.5) {
    // Light background - try black first
    if (blackRatio >= minRatio) {
      return {
        value: '#000000',
        hex: '#000000',
        ratio: Math.round(blackRatio * 100) / 100,
      };
    }
    if (whiteRatio >= minRatio) {
      return {
        value: '#ffffff',
        hex: '#ffffff',
        ratio: Math.round(whiteRatio * 100) / 100,
      };
    }
  } else {
    // Dark background - try white first
    if (whiteRatio >= minRatio) {
      return {
        value: '#ffffff',
        hex: '#ffffff',
        ratio: Math.round(whiteRatio * 100) / 100,
      };
    }
    if (blackRatio >= minRatio) {
      return {
        value: '#000000',
        hex: '#000000',
        ratio: Math.round(blackRatio * 100) / 100,
      };
    }
  }

  // Try gray palette as a middle ground
  const steps = TAILWIND_STEPS;
  const grayPalette = colorSystem.palettes.palettes.get('gray');

  if (grayPalette) {
    // Try all gray steps, sorted by expected contrast
    const searchSteps = bgLightness > 0.5
      ? [...TAILWIND_STEPS].reverse()
      : [...TAILWIND_STEPS];

    for (const step of searchSteps) {
      const idx = steps.indexOf(step as TailwindStep);
      const hex = grayPalette.light[idx];
      const ratio = checkContrast(hex, backgroundHex);

      if (ratio >= minRatio) {
        return {
          value: `var(--color-gray-${step})`,
          hex,
          ratio: Math.round(ratio * 100) / 100,
        };
      }
    }
  }

  // Last resort: return white or black even if they don't quite meet the ratio
  // (better than nothing)
  if (whiteRatio > blackRatio) {
    return {
      value: '#ffffff',
      hex: '#ffffff',
      ratio: Math.round(whiteRatio * 100) / 100,
    };
  }
  return {
    value: '#000000',
    hex: '#000000',
    ratio: Math.round(blackRatio * 100) / 100,
  };
}

/**
 * Get approximate lightness of a hex color (0-1)
 */
function getLightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Simple relative luminance approximation
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Apply fixes to the CSS
 */
function applyFixes(
  css: string,
  violations: ContrastViolation[],
  colorSystem: ColorSystemOutput
): { fixedCSS: string; fixes: ContrastFix[]; unfixable: ContrastViolation[] } {
  const fixes: ContrastFix[] = [];
  const unfixable: ContrastViolation[] = [];
  let fixedCSS = css;

  for (const violation of violations) {
    const alternative = findPassingAlternative(
      violation.foreground,
      violation.backgroundHex,
      colorSystem,
      violation.required
    );

    if (alternative) {
      // Replace in CSS - need to be careful to only replace in the right selector
      const selectorEscaped = violation.selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(
        `(${selectorEscaped}\\s*\\{[^}]*color\\s*:\\s*)${escapeRegex(violation.foreground)}`,
        'g'
      );

      fixedCSS = fixedCSS.replace(pattern, `$1${alternative.value}`);

      fixes.push({
        selector: violation.selector,
        originalForeground: violation.foreground,
        newForeground: alternative.value,
        originalRatio: violation.ratio,
        newRatio: alternative.ratio,
        reason: `${violation.ratio}:1 → ${alternative.ratio}:1 (WCAG ${violation.level} requires ${violation.required}:1)`,
      });
    } else {
      unfixable.push(violation);
    }
  }

  return { fixedCSS, fixes, unfixable };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Validate and auto-fix contrast issues in generated CSS
 *
 * @param css - The generated component CSS
 * @param colorSystem - The generated color system with palettes
 * @param options - Validation options
 * @returns Validation result with fixed CSS and change report
 */
export function validateAndFixContrast(
  css: string,
  colorSystem: ColorSystemOutput,
  options: {
    /** Minimum contrast ratio (default: 4.5 for WCAG AA normal text) */
    minRatio?: number;
    /** Whether to apply fixes (default: true) */
    autoFix?: boolean;
  } = {}
): ContrastValidationResult {
  const { minRatio = 4.5, autoFix = true } = options;

  // Parse CSS
  const rules = parseCSS(css);
  const pairs = extractColorPairs(rules);

  // Build color lookup
  const lookup = buildColorLookup(colorSystem);

  // Find violations
  const violations = findViolations(pairs, lookup, minRatio);

  if (violations.length === 0) {
    return {
      valid: true,
      violations: [],
      fixes: [],
      fixedCSS: css,
      unfixable: [],
    };
  }

  if (!autoFix) {
    return {
      valid: false,
      violations,
      fixes: [],
      fixedCSS: css,
      unfixable: violations,
    };
  }

  // Apply fixes
  const { fixedCSS, fixes, unfixable } = applyFixes(css, violations, colorSystem);

  return {
    valid: unfixable.length === 0,
    violations,
    fixes,
    fixedCSS,
    unfixable,
  };
}

/**
 * Quick check if CSS has any contrast issues (without fixing)
 */
export function hasContrastIssues(
  css: string,
  colorSystem: ColorSystemOutput,
  minRatio: number = 4.5
): boolean {
  const rules = parseCSS(css);
  const pairs = extractColorPairs(rules);
  const lookup = buildColorLookup(colorSystem);
  const violations = findViolations(pairs, lookup, minRatio);
  return violations.length > 0;
}
