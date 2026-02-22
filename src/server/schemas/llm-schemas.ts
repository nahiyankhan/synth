/**
 * LLM-specific schemas for design system generation
 * These define what the LLM returns, not what consumers use
 */

import { z } from 'zod';

/**
 * Brand Identity - Phase 1 of LLM generation
 */
export const brandIdentitySchema = z.object({
  name: z.string().describe('A memorable 2-word name for this design language (e.g., "Nordic Precision", "Warm Finance", "Bold Retail"). Keep it concise and evocative.'),
  traits: z.array(z.string()).describe('Core brand characteristics and personality traits (3-5 traits)'),
  voiceTone: z.string().describe('The brand voice and communication tone'),
  visualReferences: z.array(z.string()).describe('Visual style references or inspirations'),
  designPrinciples: z.array(z.string()).describe('Key design principles to follow'),
  emotionalResonance: z.array(z.string()).describe('Target emotional response from users'),
  aestheticPreferences: z.array(z.string()).describe('Preferred aesthetic direction (minimal, bold, organic, etc.)')
});

export type BrandIdentity = z.infer<typeof brandIdentitySchema>;

/**
 * Visual Direction - Combined Phase 0 of LLM generation
 * Merges strategy-lite fields with brand identity for a single unified output
 * Replaces separate Strategy + Identity phases
 */
export const visualDirectionSchema = z.object({
  // Strategy-lite fields (3 from Strategy)
  summary: z.string().describe('Brief summary of the design direction (2-3 sentences)'),
  coreMessage: z.string().describe('Central brand message or tagline'),
  direction: z.string().describe('Recommended strategic direction for design system'),

  // Identity fields (7 fields)
  name: z.string().describe('A memorable 2-word name for this design language (e.g., "Nordic Precision", "Warm Finance", "Bold Retail")'),
  traits: z.array(z.string()).describe('Core brand characteristics and personality traits (3-5 traits)'),
  voiceTone: z.string().describe('The brand voice and communication tone'),
  visualReferences: z.array(z.string()).describe('Visual style references or inspirations (2-4 references)'),
  designPrinciples: z.array(z.string()).describe('Key design principles to follow (3-5 principles)'),
  emotionalResonance: z.array(z.string()).describe('Target emotional response from users (2-3 emotions)'),
  aestheticPreferences: z.array(z.string()).describe('Preferred aesthetic direction (2-4 preferences like "minimal", "bold", "organic")')
});

export type VisualDirection = z.infer<typeof visualDirectionSchema>;

/**
 * @deprecated Legacy color choices type - kept for backwards compatibility
 * New code should use Tailwind v4 color seeds instead
 */
export interface ColorChoices {
  baseColors: Array<{ name: string; hex: string }>;
  semanticRoles: {
    primary: string;
    accent: string;
    surface: string;
    background: string;
    text: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  reasoning: string;
  accessibilityTargets: {
    textOnSurface: 'AA' | 'AAA';
  };
}

// =============================================================================
// Tailwind v4 Color Seeds (NEW - Replaces Design Language Seeds)
// =============================================================================

/**
 * Tailwind Color Seeds - Minimal AI output for Tailwind v4 color generation
 *
 * IMPORTANT: OpenAI's structured output requires ALL fields to be required.
 * We use a flat structure with hasSecondary/hasTertiary flags instead of optional nested objects.
 *
 * The LLM generates these minimal seeds, then deterministic OKLCH expansion
 * creates complete Tailwind-compatible 11-step scales (50-950) with guaranteed
 * WCAG contrast compliance.
 *
 * @example
 * {
 *   primaryHue: 175,
 *   primaryChroma: 0.14,
 *   hasSecondary: true,
 *   secondaryHue: 280,
 *   secondaryChroma: 0.10,
 *   hasTertiary: false,
 *   tertiaryHue: 0,
 *   tertiaryChroma: 0.1,
 *   grayWarmth: 0.2,
 *   graySaturation: 0.012,
 *   reasoning: "Teal conveys innovation while purple adds creative depth..."
 * }
 */
export const tailwindColorSeedsSchema = z.object({
  // Primary brand color (always required)
  primaryHue: z
    .number()
    .min(0)
    .max(360)
    .describe('Primary brand hue (0-360). Examples: 220=blue, 25=red, 145=green, 280=purple, 175=teal'),
  primaryChroma: z
    .number()
    .min(0.05)
    .max(0.30)
    .describe('Primary saturation (0.05-0.30). 0.08=muted, 0.15=balanced, 0.22=vibrant'),

  // Secondary brand color (set hasSecondary=false if not needed)
  hasSecondary: z
    .boolean()
    .describe('Whether to include a secondary brand color. Set false for single-color brands'),
  secondaryHue: z
    .number()
    .min(0)
    .max(360)
    .describe('Secondary brand hue. Ignored if hasSecondary is false. Common: +/-30° (analogous), +/-180° (complementary)'),
  secondaryChroma: z
    .number()
    .min(0.05)
    .max(0.30)
    .describe('Secondary saturation. Ignored if hasSecondary is false'),

  // Tertiary brand color (set hasTertiary=false if not needed)
  hasTertiary: z
    .boolean()
    .describe('Whether to include a tertiary brand color. Only for complex multi-brand UIs'),
  tertiaryHue: z
    .number()
    .min(0)
    .max(360)
    .describe('Tertiary brand hue. Ignored if hasTertiary is false'),
  tertiaryChroma: z
    .number()
    .min(0.05)
    .max(0.30)
    .describe('Tertiary saturation. Ignored if hasTertiary is false'),

  // Gray/neutral configuration
  grayWarmth: z
    .number()
    .min(-1)
    .max(1)
    .describe('Gray temperature: -1=cool/blue, 0=neutral, +1=warm/yellow. Most brands: -0.3 to +0.3'),
  graySaturation: z
    .number()
    .min(0)
    .max(0.02)
    .describe('Gray tint amount: 0=pure gray, 0.015=subtly tinted'),

  reasoning: z
    .string()
    .describe('2-3 sentences explaining how these color choices reflect the brand identity'),
});

export type TailwindColorSeeds = z.infer<typeof tailwindColorSeedsSchema>;

// =============================================================================
// Structural Seeds (DaisyUI-inspired)
// =============================================================================

/**
 * Structural Seeds - Shape and depth characteristics for the design system
 *
 * These define the "feel" of the UI beyond colors:
 * - radiusStyle: How rounded corners are (sharp=technical, pill=friendly)
 * - depthStyle: Shadow intensity (flat=minimal, elevated=material-like)
 *
 * @example
 * {
 *   radiusStyle: "rounded",
 *   depthStyle: "subtle",
 *   reasoning: "Rounded corners convey approachability while subtle shadows add depth without overwhelming..."
 * }
 */
export const structuralSeedsSchema = z.object({
  radiusStyle: z
    .enum(['sharp', 'rounded', 'pill'])
    .describe('Border radius style: "sharp" (0.125-0.375rem, technical/professional), "rounded" (0.375-0.75rem, balanced/modern), "pill" (0.5-1rem, friendly/approachable)'),

  depthStyle: z
    .enum(['flat', 'subtle', 'elevated'])
    .describe('Shadow intensity: "flat" (no shadows, minimalist), "subtle" (light shadows, clean modern), "elevated" (pronounced shadows, material-like depth)'),

  reasoning: z
    .string()
    .describe('1-2 sentences explaining how the structural choices reflect the brand personality'),
});

export type StructuralSeeds = z.infer<typeof structuralSeedsSchema>;

/**
 * Combined design seeds - color + structural
 * This is the complete LLM output for visual token generation
 */
export const designSeedsSchema = z.object({
  colors: tailwindColorSeedsSchema,
  structural: structuralSeedsSchema,
});

export type DesignSeeds = z.infer<typeof designSeedsSchema>;

/**
 * Typography Choices - What LLM returns for typography (type stack focused)
 */
export const typographyChoicesSchema = z.object({
  typeStack: z.object({
    display: z.object({
      fontSize: z.string().describe('Display size (e.g., "4rem", "64px")'),
      lineHeight: z.string().describe('Line height (e.g., "1.1", "1.2")'),
      fontWeight: z.string().describe('Font weight (e.g., "700", "bold")'),
      letterSpacing: z.string().describe('Letter spacing (e.g., "-0.02em", "0")')
    }).describe('Largest heading style for hero sections'),
    h1: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      fontWeight: z.string(),
      letterSpacing: z.string()
    }).describe('Primary heading'),
    h2: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      fontWeight: z.string(),
      letterSpacing: z.string()
    }).describe('Secondary heading'),
    h3: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      fontWeight: z.string(),
      letterSpacing: z.string()
    }).describe('Tertiary heading'),
    body: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      fontWeight: z.string()
    }).describe('Default body text'),
    bodyLarge: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      fontWeight: z.string()
    }).describe('Large body text for emphasis'),
    bodySmall: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      fontWeight: z.string()
    }).describe('Small body text'),
    caption: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      fontWeight: z.string()
    }).describe('Caption text (smallest)'),
    label: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      fontWeight: z.string(),
      textTransform: z.string()
    }).describe('Label/button text'),
    code: z.object({
      fontSize: z.string(),
      lineHeight: z.string(),
      fontFamily: z.string()
    }).describe('Code/monospace text')
  }),
  reasoning: z.string().describe('2-3 sentences on typography strategy'),
  baseFont: z.object({
    family: z.string().describe('Base font family for body/UI'),
    fallback: z.string().describe('Font fallback stack (e.g., "system-ui, sans-serif")')
  }),
  scale: z.object({
    rhythm: z.object({
      grid: z.number().describe('Base grid unit (e.g., 8)'),
      round: z.string().describe('Rounding strategy (e.g., "nearest")')
    })
  })
});

export type TypographyChoices = z.infer<typeof typographyChoicesSchema>;

// =============================================================================
// Foundation Seeds (Typography + Shadow)
// =============================================================================

/**
 * Foundation Seeds - Typography and Shadow characteristics
 *
 * These define the foundational tokens beyond colors:
 * - Typography: Scale ratio determines hierarchy intensity
 * - Shadow: Intensity, color style, and blur define shadow aesthetics
 *
 * @example
 * {
 *   typographyScaleRatio: "majorThird",
 *   shadowIntensity: "subtle",
 *   shadowColorStyle: "neutral",
 *   shadowBlurStyle: "soft",
 *   reasoning: "Clear hierarchy with Major Third ratio for marketing-focused UI..."
 * }
 */
export const foundationSeedsSchema = z.object({
  typographyScaleRatio: z
    .enum(['majorSecond', 'minorThird', 'majorThird', 'perfectFourth', 'goldenRatio'])
    .describe('Typography scale ratio: "majorSecond" (1.125, subtle/dense UI), "minorThird" (1.200, balanced), "majorThird" (1.250, clear hierarchy), "perfectFourth" (1.333, bold/high contrast), "goldenRatio" (1.618, premium/editorial)'),

  shadowIntensity: z
    .enum(['none', 'subtle', 'medium', 'dramatic'])
    .describe('Shadow intensity: "none" (flat design), "subtle" (light shadows), "medium" (balanced depth), "dramatic" (heavy shadows)'),

  shadowColorStyle: z
    .enum(['neutral', 'tinted'])
    .describe('Shadow color: "neutral" (black/gray shadows), "tinted" (shadows use primary brand color)'),

  shadowBlurStyle: z
    .enum(['sharp', 'soft'])
    .describe('Shadow blur: "sharp" (small blur radius, crisp edges), "soft" (large blur radius, diffused)'),

  reasoning: z
    .string()
    .describe('1-2 sentences explaining how typography and shadow choices reflect the brand personality'),
});

export type FoundationSeeds = z.infer<typeof foundationSeedsSchema>;

/**
 * Complete design system seeds - colors + structural + foundations
 * This is the full LLM output for design token generation
 */
export const completeDesignSeedsSchema = z.object({
  colors: tailwindColorSeedsSchema,
  structural: structuralSeedsSchema,
  foundations: foundationSeedsSchema,
});

export type CompleteDesignSeeds = z.infer<typeof completeDesignSeedsSchema>;

