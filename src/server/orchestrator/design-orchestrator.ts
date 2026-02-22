/**
 * Design System Orchestrator - Multi-model LLM orchestration for design system generation
 *
 * This handles all LLM interactions using AI models and transforms their outputs into StyleGraph nodes.
 * Uses the Tailwind v4 color system approach with Visual Direction for unified brand identity.
 */

import { nanoid } from "nanoid";
import { generateObject, streamObject } from "ai";
import type { UserContent } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import {
  brandIdentitySchema,
  visualDirectionSchema,
  tailwindColorSeedsSchema,
  foundationSeedsSchema,
  type BrandIdentity,
  type VisualDirection,
  type TypographyChoices,
  type TailwindColorSeeds,
  type FoundationSeeds as LLMFoundationSeeds,
} from "@/server/schemas/llm-schemas";
import {
  COMPONENT_CSS_SYSTEM_PROMPT,
  buildComponentCSSUserPrompt,
} from "@/server/prompts/component-css-prompt";
import { generateColorSystem, type ColorSeeds, type ColorSystemOutput } from "@/server/transformers/tailwind-color-system";
import { TAILWIND_STEPS, type TypographySeeds, type ShadowSeeds, type TypographyScaleRatio, type ShadowIntensity, type ShadowColorStyle, type ShadowBlurStyle } from "@/types/tailwindPalette";
import {
  generateTypographyTokens,
  typographyTokensToChoices,
} from "@/server/transformers/foundation-generators";
import { transformTailwindToStyleGraph } from "@/server/transformers/tailwind-to-stylegraph";
import {
  validateAndFixContrast,
  type ContrastFix,
  type ContrastViolation,
} from "@/server/validators/contrast-validator";
import type { StyleNode } from "@/types/styleGraph";
import type { ImageAttachment } from "@/types/multimodal";

/**
 * Helper to simulate streaming for deterministic phases.
 * Yields stream events progressively with small delays to match LLM response feel.
 */
async function* simulateStreaming<T extends Record<string, unknown>>(
  data: T,
  phase: string,
  delayMs: number = 150
): AsyncGenerator<StreamEvent> {
  const keys = Object.keys(data);
  const partial: Record<string, unknown> = {};

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    partial[key] = data[key];

    // Emit partial result as stream
    yield {
      type: "stream",
      content: JSON.stringify(partial),
      phase,
    };

    // Add delay between chunks (except for last one)
    if (i < keys.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

// 🔑 Base expert identity shared across all tasks
const BASE_EXPERT_PROMPT = `
You are a DESIGN SYSTEM expert who understands how brand identity translates into systematic UI foundations.
Your job is to turn abstract brand inputs (traits, tone, principles, aesthetics) into clear, reusable SEEDS that deterministic scripts will later expand into tokens, themes, and components.

## Core Role
- Interpret brand identity with taste and rigor.
- Propose expressive, on-brief **base materials** (e.g., named base colors, type pairings, spacing sensibilities).
- Map **semantic roles** (e.g., primary, surface, text, success) to those base materials.
- Produce **seeds and mappings only**. Do **not** emit full token sets, CSS, or code; deterministic scripts handle that.

## Operating Principles
1) **Brand-first, System-aware**: Preserve brand essence while shaping outputs that scale across UI systems.
2) **Separation of concerns**:
   - **Base** layer = creative pigments or raw materials with human-readable names (e.g., "ocean-blue", "charcoal").
   - **Semantic** layer = usage roles that ALIAS to base (e.g., primary → "ocean-blue").
3) **No premature assumptions**:
   - Do NOT assume audience, channel, or context of use unless explicitly provided.
   - Keep direction open-ended and adaptable.
4) **Clarity & Justification**:
   - Name things clearly, consistently, and memorably.
   - Briefly justify choices when helpful.
5) **Deterministic handoff**:
   - Outputs must be structured so scripts can parse them without guesswork.

## Output Discipline
- Do NOT output scales, token files, CSS, or code.
- Do NOT emit usage personas or channel assumptions unless provided.
- Keep rationale concise.
- **Item limits**: keep lists small (3–6 items).
- **Name limits**: kebab-case or single word, ≤24 characters.
`;

/**
 * Tailwind Color Seeds Prompt - Tailwind v4 approach
 *
 * Generates minimal seeds that map directly to Tailwind color names.
 * The LLM chooses hue + chroma, then deterministic expansion creates
 * 11-step scales (50-950) compatible with Tailwind v4 @theme.
 */
const TAILWIND_COLOR_SEEDS_PROMPT = `
${BASE_EXPERT_PROMPT}

## TASK: Tailwind Color Seeds (Phase 2 - Tailwind v4)
Based on the brand identity, generate color seeds for Tailwind v4's color system.

You are defining MINIMAL seeds (hue + chroma pairs) that will be deterministically expanded into complete 11-step Tailwind scales (50-950) with guaranteed WCAG contrast compliance.

## How It Works
1. You provide hue (0-360) + chroma (0.05-0.30) for each color
2. Your hues automatically map to Tailwind color names:
   - 345-10°: rose
   - 10-35°: red
   - 35-50°: orange
   - 50-62°: amber
   - 62-80°: yellow
   - 80-105°: lime
   - 105-140°: green
   - 140-165°: emerald
   - 165-185°: teal
   - 185-200°: cyan
   - 200-215°: sky
   - 215-245°: blue
   - 245-265°: indigo
   - 265-285°: violet
   - 285-310°: purple
   - 310-330°: fuchsia
   - 330-345°: pink
3. Status colors (success/warning/error/info) always use fixed names: green, amber, red, blue
4. If your brand primary maps to a status color name (e.g., hue 220 → blue), they share the palette

## What You're Defining

### brand.primary (required)
The main brand color for CTAs, links, and key UI elements.
- Pick a hue that represents the brand essence
- chroma 0.08-0.12 = muted, professional
- chroma 0.14-0.18 = balanced, versatile
- chroma 0.20-0.25 = vibrant, energetic

### brand.secondary (optional)
A complementary color for variety. Only include if the brand needs more than one color.
Common strategies:
- Analogous: +/- 30° from primary
- Complementary: +/- 180° from primary
- Triadic: +/- 120° from primary

### brand.tertiary (optional)
A third accent for complex UIs. Rarely needed.

### accents (optional, max 3)
Additional colors beyond brand colors. Only add if genuinely needed.

### gray (required)
Neutral color configuration:
- warmth: -1 (cool/blue) to +1 (warm/yellow), most brands use -0.2 to +0.3
- saturation: 0 (pure gray) to 0.02 (tinted), most use 0.008-0.015

## Examples

### Tech SaaS (trust, professional):
{
  "primaryHue": 220,
  "primaryChroma": 0.16,
  "hasSecondary": false,
  "secondaryHue": 0,
  "secondaryChroma": 0.1,
  "hasTertiary": false,
  "tertiaryHue": 0,
  "tertiaryChroma": 0.1,
  "grayWarmth": -0.1,
  "graySaturation": 0.008,
  "reasoning": "Blue conveys trust and professionalism. Cool grays maintain a technical feel."
}

### E-commerce (energetic, warm):
{
  "primaryHue": 25,
  "primaryChroma": 0.22,
  "hasSecondary": true,
  "secondaryHue": 175,
  "secondaryChroma": 0.12,
  "hasTertiary": false,
  "tertiaryHue": 0,
  "tertiaryChroma": 0.1,
  "grayWarmth": 0.25,
  "graySaturation": 0.012,
  "reasoning": "Warm red-orange drives action. Teal provides balance. Warm grays feel approachable."
}

### Health/Wellness (calm, natural):
{
  "primaryHue": 160,
  "primaryChroma": 0.14,
  "hasSecondary": false,
  "secondaryHue": 0,
  "secondaryChroma": 0.1,
  "hasTertiary": false,
  "tertiaryHue": 0,
  "tertiaryChroma": 0.1,
  "grayWarmth": 0.15,
  "graySaturation": 0.010,
  "reasoning": "Emerald green evokes nature and health. Slightly warm grays feel organic."
}

Be intentional. Every seed choice should reflect the brand identity.`;

/**
 * Visual Direction Prompt - Combined Strategy + Identity in single phase
 */
const VISUAL_DIRECTION_PROMPT = `
${BASE_EXPERT_PROMPT}

## TASK: Visual Direction Foundation (Phase 0)
Analyze the user request and establish a complete visual direction that combines strategic analysis with brand personality. This single output will drive all subsequent design system decisions.

## Your Mission
Create a unified visual direction that captures:
- **Strategic Summary**: What is the design system for and what should it achieve?
- **Core Message**: What's the central brand message or tagline?
- **Strategic Direction**: What systematic needs and design priorities emerge?
- **Brand Personality**: Traits, voice, principles that will inform component behavior

## Structured Output Required
Return a JSON object with these exact 10 fields:

### Strategy-lite (3 fields)
- summary: string (2-3 sentences overview of the design direction)
- coreMessage: string (Central brand message or tagline)
- direction: string (Recommended strategic direction for the design system)

### Identity (7 fields)
- name: string (A memorable 2-word name like "Nordic Precision", "Warm Finance", "Bold Retail")
- traits: string[] (3-5 system-actionable traits like "Anticipatory", "Precise", "Encouraging")
- voiceTone: string (1-2 sentences describing communication style)
- visualReferences: string[] (2-4 references that inform systematic decisions)
- designPrinciples: string[] (3-5 component-actionable principles)
- emotionalResonance: string[] (2-3 emotional goals)
- aestheticPreferences: string[] (2-4 aesthetic directions like "minimal", "bold", "organic")

Be specific, actionable, and systematic. Each field should directly inform design system decisions.`;

/**
 * Foundation Seeds Prompt - Typography and Shadow characteristics
 */
const FOUNDATION_SEEDS_PROMPT = `
${BASE_EXPERT_PROMPT}

## TASK: Foundation Seeds (Typography & Shadow)
Based on the brand identity, generate foundation seeds for typography scale and shadow style.

These seeds will be deterministically expanded into complete token scales.

## Typography Scale Ratios
Choose a ratio that matches the brand's hierarchy needs:
- majorSecond (1.125): Subtle, dense UI - dashboards, data-heavy apps
- minorThird (1.200): Balanced, most applications
- majorThird (1.250): Clear hierarchy - marketing sites, content-focused
- perfectFourth (1.333): Bold, high contrast - landing pages, editorial
- goldenRatio (1.618): Premium, dramatic - luxury brands, magazines

## Shadow Characteristics

### Intensity
- none: Flat design, no shadows - minimalist, technical
- subtle: Light shadows - clean, modern SaaS
- medium: Balanced depth - general purpose
- dramatic: Heavy shadows - bold, impactful

### Color Style
- neutral: Black/gray shadows - professional, versatile
- tinted: Shadows use brand primary color - cohesive, branded

### Blur Style
- sharp: Small blur radius, crisp edges - technical, precise
- soft: Large blur radius, diffused - friendly, approachable

## Examples

### Tech SaaS (professional, data-focused):
{
  "typographyScaleRatio": "minorThird",
  "shadowIntensity": "subtle",
  "shadowColorStyle": "neutral",
  "shadowBlurStyle": "soft",
  "reasoning": "Balanced type scale for dashboard readability. Subtle neutral shadows maintain clean aesthetics."
}

### E-commerce (bold, conversion-focused):
{
  "typographyScaleRatio": "perfectFourth",
  "shadowIntensity": "medium",
  "shadowColorStyle": "neutral",
  "shadowBlurStyle": "soft",
  "reasoning": "High-contrast type hierarchy draws attention to CTAs. Medium shadows add depth to product cards."
}

### Luxury Brand (premium, editorial):
{
  "typographyScaleRatio": "goldenRatio",
  "shadowIntensity": "dramatic",
  "shadowColorStyle": "tinted",
  "shadowBlurStyle": "soft",
  "reasoning": "Dramatic type scale creates editorial feel. Tinted shadows reinforce brand color throughout."
}

### Minimalist App (clean, focused):
{
  "typographyScaleRatio": "majorSecond",
  "shadowIntensity": "none",
  "shadowColorStyle": "neutral",
  "shadowBlurStyle": "sharp",
  "reasoning": "Subtle type scale keeps UI dense. No shadows for flat, focused design."
}

Match the foundation choices to the brand personality.`;

export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "phase-start"; phase: string }
  | { type: "stream"; content: string; phase: string }
  | { type: "step"; n: number; message: string; payload?: any }
  | { type: "complete"; result: any; metadata: any }
  | { type: "error"; message: string; details?: string }
  | { type: "result"; data: any };

/**
 * Result from Visual Direction based generation
 * Uses unified visual direction instead of separate strategy + identity
 */
export interface VisualDirectionOrchestrationResult {
  visualDirection: VisualDirection;
  colorSeeds: TailwindColorSeeds;
  foundationSeeds: LLMFoundationSeeds;
  colorSystem: ColorSystemOutput;
  typographyChoices: TypographyChoices;
  styleGraphNodes: StyleNode[];
  componentCSS: string;
  fullCSS: string;
  /** Contrast validation results */
  contrastValidation?: {
    /** Whether all contrast checks passed */
    valid: boolean;
    /** Fixes that were auto-applied */
    fixes: ContrastFix[];
    /** Violations that couldn't be auto-fixed */
    unfixable: ContrastViolation[];
  };
}

export class DesignOrchestrator {
  private openaiModel: ReturnType<ReturnType<typeof createOpenAI>>;
  private anthropicModel: ReturnType<ReturnType<typeof createAnthropic>>;

  /**
   * Create a new DesignOrchestrator
   * @param openaiApiKey - OpenAI API key (required)
   * @param anthropicApiKey - Anthropic API key (optional, for future use)
   */
  constructor(openaiApiKey?: string, anthropicApiKey?: string) {
    // Support both direct API key and environment variable fallback
    const resolvedOpenaiKey = openaiApiKey || process.env.OPENAI_API_KEY || "";

    if (!resolvedOpenaiKey) {
      throw new Error("OpenAI API key is required for design generation");
    }

    const openaiClient = createOpenAI({ apiKey: resolvedOpenaiKey });
    // Keep anthropic client for future use (currently unused)
    const anthropicClient = createAnthropic({
      apiKey: anthropicApiKey || process.env.ANTHROPIC_API_KEY || "dummy",
    });

    // Use gpt-5.2 (latest flagship model)
    this.openaiModel = openaiClient("gpt-5.2");
    this.anthropicModel = anthropicClient("claude-3-5-sonnet-20241022");

    console.log("✓ Design orchestrator initialized");
    console.log("  Using GPT-5.2 for all generation phases");
  }

  /**
   * Phase 0: Generate visual direction with streaming (combined strategy + identity)
   * Supports multimodal input with images
   */
  private async *generateVisualDirectionStreaming(
    prompt: string,
    images?: ImageAttachment[]
  ): AsyncGenerator<StreamEvent> {
    console.log("🔧 Using GPT-5.2 for visual direction generation");

    // Build multimodal message content
    const userContent: UserContent = [];

    userContent.push({
      type: "text",
      text: `Analyze and develop a complete visual direction for: ${prompt}`,
    });

    // Add images if present
    if (images && images.length > 0) {
      userContent.push({
        type: "text",
        text: "\n\nReference images attached. Use your judgment based on the prompt - extract design direction if the user asks for extraction, or use as inspiration. Analyze colors, typography, spacing, and overall aesthetic from the images.",
      });

      for (const img of images) {
        if (img.type === "url") {
          userContent.push({
            type: "image",
            image: new URL(img.source),
          });
        } else {
          userContent.push({
            type: "image",
            image: img.source,
            mediaType: img.mimeType,
          });
        }
      }
    }

    try {
      const { partialObjectStream, object } = streamObject({
        model: this.openaiModel,
        schema: visualDirectionSchema,
        system: VISUAL_DIRECTION_PROMPT,
        messages: [{ role: "user", content: userContent }],
        temperature: 0.7,
      });

      let lastPartial: string | null = null;
      let chunkCount = 0;
      for await (const partialObject of partialObjectStream) {
        chunkCount++;
        const jsonStr = JSON.stringify(partialObject, null, 2);
        if (lastPartial !== jsonStr) {
          console.log(`📦 Visual direction stream chunk ${chunkCount}`);
          yield { type: "stream", content: jsonStr, phase: "visual-direction" };
          lastPartial = jsonStr;
        }
      }

      console.log(`✅ Visual direction streaming complete (${chunkCount} chunks)`);

      if (chunkCount === 0) {
        console.warn("⚠️ Warning: 0 chunks received - model may not support structured streaming");
      }

      const visualDirection = await object;
      console.log("🔍 Visual direction object:", visualDirection ? "Valid" : "NULL");

      if (!visualDirection) {
        throw new Error("No visual direction response received");
      }

      yield { type: "result", data: visualDirection };
    } catch (error) {
      console.error("❌ Visual direction generation error:", error);
      throw error;
    }
  }

  /**
   * Generate Tailwind color seeds with streaming
   */
  private async *generateTailwindColorSeedsStreaming(
    identity: BrandIdentity
  ): AsyncGenerator<StreamEvent> {
    const userPrompt = `Based on this brand identity: ${JSON.stringify(identity)}

Generate Tailwind color seeds that capture the brand's visual identity. These seeds will be expanded into complete Tailwind v4 color scales.

Remember:
- hue is 0-360 (e.g., 220 for blue, 145 for green, 25 for red)
- chroma is 0.05-0.30 (e.g., 0.15 for balanced, 0.22 for vibrant)
- warmth is -1 to +1 (e.g., -0.1 for cool tech, +0.2 for warm friendly)
- saturation is 0-0.02 (e.g., 0.01 for subtle tint)

Only include secondary/tertiary/accents if the brand genuinely needs multiple colors.`;

    console.log("🔧 Using GPT-5.2 for Tailwind color seeds generation");
    console.log("📝 User prompt length:", userPrompt.length);
    console.log("📝 System prompt length:", TAILWIND_COLOR_SEEDS_PROMPT.length);

    try {
      console.log("🚀 Starting streamObject call for Tailwind color seeds...");

      const { partialObjectStream, object } = streamObject({
        model: this.openaiModel,
        schema: tailwindColorSeedsSchema,
        system: TAILWIND_COLOR_SEEDS_PROMPT,
        prompt: userPrompt,
        temperature: 0.7,
      });

      let lastPartial: string | null = null;
      let chunkCount = 0;
      for await (const partialObject of partialObjectStream) {
        chunkCount++;
        const jsonStr = JSON.stringify(partialObject, null, 2);
        if (lastPartial !== jsonStr) {
          console.log(`📦 Tailwind color seeds stream chunk ${chunkCount}`);
          yield { type: "stream", content: jsonStr, phase: "tailwind-colors" };
          lastPartial = jsonStr;
        }
      }

      console.log(`✅ Tailwind color seeds streaming complete (${chunkCount} chunks)`);

      const colorSeeds = await object;
      if (!colorSeeds) {
        throw new Error("No Tailwind color seeds response");
      }

      console.log("🔍 Tailwind color seeds received:", JSON.stringify(colorSeeds, null, 2));

      yield { type: "result", data: colorSeeds };
    } catch (error) {
      console.error("❌ Tailwind color seeds generation error:", error);
      console.error("❌ Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Generate foundation seeds (typography scale ratio + shadow style)
   */
  private async *generateFoundationSeedsStreaming(
    identity: BrandIdentity
  ): AsyncGenerator<StreamEvent> {
    const userPrompt = `Based on this brand identity: ${JSON.stringify(identity)}

Generate foundation seeds for typography and shadow that match the brand personality.

Consider:
- How much type hierarchy contrast does the brand need?
- Should shadows be subtle or dramatic?
- Would tinted shadows reinforce the brand, or is neutral better?
- Should edges be sharp (technical) or soft (friendly)?`;

    console.log("🔧 Using GPT-5.2 for foundation seeds generation");

    try {
      const { partialObjectStream, object } = streamObject({
        model: this.openaiModel,
        schema: foundationSeedsSchema,
        system: FOUNDATION_SEEDS_PROMPT,
        prompt: userPrompt,
        temperature: 0.7,
      });

      let lastPartial: string | null = null;
      let chunkCount = 0;
      for await (const partialObject of partialObjectStream) {
        chunkCount++;
        const jsonStr = JSON.stringify(partialObject, null, 2);
        if (lastPartial !== jsonStr) {
          console.log(`📦 Foundation seeds stream chunk ${chunkCount}`);
          yield { type: "stream", content: jsonStr, phase: "foundations" };
          lastPartial = jsonStr;
        }
      }

      console.log(`✅ Foundation seeds streaming complete (${chunkCount} chunks)`);

      const foundationSeeds = await object;
      if (!foundationSeeds) {
        throw new Error("No foundation seeds response");
      }

      console.log("🔍 Foundation seeds received:", JSON.stringify(foundationSeeds, null, 2));

      yield { type: "result", data: foundationSeeds };
    } catch (error) {
      console.error("❌ Foundation seeds generation error:", error);
      throw error;
    }
  }

  /**
   * Phase 5: Generate component CSS based on visual direction and foundation tokens
   * AI outputs raw CSS using design tokens for radius, shadow, typography, motion
   */
  private async *generateComponentCSSStreaming(
    visualDirection: VisualDirection,
    foundationTokens: {
      radius: { selector: string; field: string; box: string };
      shadow: { style: string };
      typography: { scaleRatio: string };
    }
  ): AsyncGenerator<StreamEvent> {
    const userPrompt = buildComponentCSSUserPrompt(
      {
        name: visualDirection.name,
        traits: visualDirection.traits,
        aestheticPreferences: visualDirection.aestheticPreferences,
        designPrinciples: visualDirection.designPrinciples,
        emotionalResonance: visualDirection.emotionalResonance,
      },
      foundationTokens
    );

    console.log("🔧 Using GPT-5.2 for component CSS generation");

    try {
      const { textStream, text } = await import("ai").then((ai) =>
        ai.streamText({
          model: this.openaiModel,
          system: COMPONENT_CSS_SYSTEM_PROMPT,
          prompt: userPrompt,
          temperature: 0.7,
        })
      );

      let fullContent = "";
      let chunkCount = 0;

      for await (const chunk of textStream) {
        chunkCount++;
        fullContent += chunk;
        // Stream progress periodically
        if (chunkCount % 10 === 0) {
          yield { type: "stream", content: fullContent, phase: "component-css" };
        }
      }

      console.log(`✅ Component CSS streaming complete (${chunkCount} chunks)`);

      // Extract CSS from response (strip markdown fences if present)
      const css = this.extractCSS(fullContent);

      yield { type: "result", data: css };
    } catch (error) {
      console.error("❌ Component CSS generation error:", error);
      throw error;
    }
  }

  /**
   * Extract CSS from LLM response, stripping markdown fences if present
   */
  private extractCSS(response: string): string {
    // Try to extract from markdown code block
    const cssMatch = response.match(/```css\n?([\s\S]*?)\n?```/);
    if (cssMatch) {
      return cssMatch[1].trim();
    }
    // Try generic code block
    const genericMatch = response.match(/```\n?([\s\S]*?)\n?```/);
    if (genericMatch) {
      return genericMatch[1].trim();
    }
    // Assume raw CSS
    return response.trim();
  }

  /**
   * Generate design system using Tailwind v4 color system
   *
   * Pipeline:
   * - Phase 0: Visual Direction (combined strategy + identity)
   * - Phase 1: Generate TailwindColorSeeds (hue + chroma for brand/gray)
   * - Phase 2: Deterministic expansion to 11-step Tailwind scales
   * - Phase 3: Typography generation
   * - Phase 4: Transform to StyleGraph nodes
   */
  async *generateTailwindStreaming(
    prompt: string,
    images?: ImageAttachment[]
  ): AsyncGenerator<StreamEvent> {
    try {
      console.log("🚀 Starting Tailwind v4 design generation for prompt:", prompt);
      if (images?.length) {
        console.log(`📸 With ${images.length} reference images`);
      }

      // Phase 0: Generate visual direction (combined strategy + identity)
      console.log("📋 Starting Phase 0: Visual Direction");
      yield { type: "phase-start", phase: "visual-direction" };
      yield { type: "status", message: "Developing visual direction..." };

      let visualDirection: VisualDirection | null = null;
      for await (const event of this.generateVisualDirectionStreaming(prompt, images)) {
        if (event.type === "result") {
          visualDirection = event.data;
        } else {
          yield event;
        }
      }
      if (!visualDirection) throw new Error("No visual direction generated");
      yield { type: "step", n: 1, message: "Visual direction established", payload: visualDirection };

      // Phase 1: Generate Tailwind color seeds
      console.log("🎨 Starting Phase 1: Tailwind Color Seeds");
      yield { type: "phase-start", phase: "tailwind-colors" };
      yield { type: "status", message: "Generating Tailwind color seeds..." };

      // Convert visual direction to identity-like object for color generation
      const identityForColors: BrandIdentity = {
        name: visualDirection.name,
        traits: visualDirection.traits,
        voiceTone: visualDirection.voiceTone,
        visualReferences: visualDirection.visualReferences,
        designPrinciples: visualDirection.designPrinciples,
        emotionalResonance: visualDirection.emotionalResonance,
        aestheticPreferences: visualDirection.aestheticPreferences,
      };

      let colorSeeds: TailwindColorSeeds | null = null;
      for await (const event of this.generateTailwindColorSeedsStreaming(identityForColors)) {
        if (event.type === "result") {
          colorSeeds = event.data;
        } else {
          yield event;
        }
      }
      if (!colorSeeds) throw new Error("No Tailwind color seeds generated");
      yield { type: "step", n: 2, message: "Tailwind color seeds generated", payload: colorSeeds };

      // Phase 2a: Generate foundation seeds (typography scale + shadow style)
      console.log("🎨 Starting Phase 2a: Foundation Seeds");
      yield { type: "phase-start", phase: "foundations" };
      yield { type: "status", message: "Generating foundation seeds..." };

      let foundationSeeds: LLMFoundationSeeds | null = null;
      for await (const event of this.generateFoundationSeedsStreaming(identityForColors)) {
        if (event.type === "result") {
          foundationSeeds = event.data;
        } else {
          yield event;
        }
      }
      if (!foundationSeeds) throw new Error("No foundation seeds generated");
      yield { type: "step", n: 3, message: "Foundation seeds generated", payload: foundationSeeds };

      // Phase 2b: Deterministic expansion to Tailwind color system (NO LLM)
      console.log("⚙️ Starting Phase 2b: Tailwind Color System Expansion");
      yield { type: "phase-start", phase: "tailwind-system" };
      yield { type: "status", message: "Expanding to Tailwind v4 color system..." };

      // Convert flat LLM seeds to nested ColorSeeds format
      const seeds: ColorSeeds = {
        brand: {
          primary: { hue: colorSeeds.primaryHue, chroma: colorSeeds.primaryChroma },
          ...(colorSeeds.hasSecondary && {
            secondary: { hue: colorSeeds.secondaryHue, chroma: colorSeeds.secondaryChroma },
          }),
          ...(colorSeeds.hasTertiary && {
            tertiary: { hue: colorSeeds.tertiaryHue, chroma: colorSeeds.tertiaryChroma },
          }),
        },
        gray: {
          warmth: colorSeeds.grayWarmth,
          saturation: colorSeeds.graySaturation,
        },
      };

      // Convert LLM foundation seeds to internal format
      const typographySeeds: TypographySeeds = {
        scaleRatio: foundationSeeds!.typographyScaleRatio as TypographyScaleRatio,
      };

      const shadowSeeds: ShadowSeeds = {
        intensity: foundationSeeds!.shadowIntensity as ShadowIntensity,
        colorStyle: foundationSeeds!.shadowColorStyle as ShadowColorStyle,
        blurStyle: foundationSeeds!.shadowBlurStyle as ShadowBlurStyle,
      };

      // Generate color system with foundation seeds
      const colorSystem = generateColorSystem(seeds, undefined, {
        typography: typographySeeds,
        shadow: shadowSeeds,
      });

      yield { type: "step", n: 4, message: "Tailwind color system generated", payload: {
        paletteCount: colorSystem.summary.paletteCount,
        paletteNames: colorSystem.summary.paletteNames,
        overlaps: colorSystem.summary.overlaps,
        roleMapping: colorSystem.summary.roleMapping,
      }};

      // Phase 3: Generate typography deterministically from foundation seeds (NO LLM)
      console.log("📝 Starting Phase 3: Typography (deterministic)");
      yield { type: "phase-start", phase: "typography" };
      yield { type: "status", message: "Generating typography from scale ratio..." };

      const typographyTokens = generateTypographyTokens(typographySeeds);
      const typographyChoices = typographyTokensToChoices(typographyTokens, typographySeeds);

      // Simulate streaming to match LLM response feel
      for await (const event of simulateStreaming(typographyChoices, "typography", 120)) {
        yield event;
      }

      yield { type: "step", n: 5, message: "Typography system generated", payload: typographyChoices };

      // Phase 4: Transform to StyleGraph nodes
      yield { type: "phase-start", phase: "design-tokens" };
      yield { type: "status", message: "Transforming to design tokens..." };

      const styleGraphNodes = transformTailwindToStyleGraph(
        colorSystem,
        typographyChoices
      );

      // Count tokens by type for richer preview
      const colorTokens = styleGraphNodes.filter((n) => n.type === "color").length;
      const typographyTokensCount = styleGraphNodes.filter((n) => n.type === "typography").length;
      const spacingTokens = styleGraphNodes.filter((n) => n.type === "spacing").length;
      const motionTokens = styleGraphNodes.filter((n) => n.type === "motion").length;

      const tokenPreview = {
        colorTokens,
        typographyTokens: typographyTokensCount,
        spacingTokens,
        motionTokens,
        tokenCount: styleGraphNodes.length,
      };

      // Simulate streaming to match LLM response feel
      for await (const event of simulateStreaming(tokenPreview, "design-tokens", 100)) {
        yield event;
      }

      yield { type: "step", n: 6, message: "Design tokens created", payload: tokenPreview };

      // Phase 5: Generate component CSS with foundation tokens
      console.log("🎨 Starting Phase 5: Component CSS");
      yield { type: "phase-start", phase: "component-css" };
      yield { type: "status", message: "Generating component styles..." };

      // Build foundation tokens for component CSS prompt
      const foundationTokensForCSS = {
        radius: {
          selector: colorSystem.structural?.radiusSelector || '0.375rem',
          field: colorSystem.structural?.radiusField || '0.5rem',
          box: colorSystem.structural?.radiusBox || '0.75rem',
        },
        shadow: {
          style: foundationSeeds!.shadowIntensity,
        },
        typography: {
          scaleRatio: foundationSeeds!.typographyScaleRatio,
        },
        palettes: {
          primary: colorSystem.palettes.roleMapping.primary,
        },
      };

      let componentCSS = "";
      for await (const event of this.generateComponentCSSStreaming(visualDirection, foundationTokensForCSS)) {
        if (event.type === "result") {
          componentCSS = event.data;
        } else {
          yield event;
        }
      }

      yield {
        type: "step",
        n: 7,
        message: "Component styles generated",
        payload: { cssLength: componentCSS.length },
      };

      // Phase 6: Validate and fix contrast issues (deterministic - no LLM)
      console.log("✅ Starting Phase 6: Contrast Validation");
      yield { type: "phase-start", phase: "contrast-validation" };
      yield { type: "status", message: "Validating accessibility contrast..." };

      const contrastResult = validateAndFixContrast(componentCSS, colorSystem, {
        minRatio: 4.5, // WCAG AA for normal text
        autoFix: true,
      });

      // Use fixed CSS if fixes were applied
      const validatedComponentCSS = contrastResult.fixedCSS;

      if (contrastResult.fixes.length > 0) {
        console.log(`🔧 Fixed ${contrastResult.fixes.length} contrast issues`);
        yield {
          type: "step",
          n: 8,
          message: `Contrast validated (${contrastResult.fixes.length} auto-fixed)`,
          payload: {
            valid: contrastResult.valid,
            fixCount: contrastResult.fixes.length,
            fixes: contrastResult.fixes.map(f => ({
              selector: f.selector,
              change: `${f.originalRatio}:1 → ${f.newRatio}:1`,
            })),
            unfixableCount: contrastResult.unfixable.length,
          },
        };
      } else {
        console.log("✅ All contrast checks passed");
        yield {
          type: "step",
          n: 8,
          message: "Contrast validated (all checks passed)",
          payload: {
            valid: true,
            fixCount: 0,
            fixes: [],
            unfixableCount: 0,
          },
        };
      }

      // Combine theme CSS + validated component CSS
      const fullCSS = `/* ===== Design Language Theme ===== */
${colorSystem.css}

/* ===== Component Stylesheet ===== */
${validatedComponentCSS}`;

      // Complete with all results
      const result: VisualDirectionOrchestrationResult = {
        visualDirection,
        colorSeeds,
        foundationSeeds: foundationSeeds!,
        colorSystem,
        typographyChoices,
        styleGraphNodes,
        componentCSS: validatedComponentCSS,
        fullCSS,
        contrastValidation: {
          valid: contrastResult.valid,
          fixes: contrastResult.fixes,
          unfixable: contrastResult.unfixable,
        },
      };

      yield {
        type: "complete",
        result,
        metadata: {
          visualDirection,
          colorSeeds,
          foundationSeeds,
          paletteCount: colorSystem.summary.paletteCount,
          paletteNames: colorSystem.summary.paletteNames,
          tokenCount: styleGraphNodes.length,
          componentCSSLength: validatedComponentCSS.length,
          contrastValidation: {
            valid: contrastResult.valid,
            fixCount: contrastResult.fixes.length,
            unfixableCount: contrastResult.unfixable.length,
          },
        },
      };

    } catch (error) {
      console.error("❌ Tailwind design generation failed:", error);
      yield {
        type: "error",
        message: error instanceof Error ? error.message : "Design generation failed",
        details: error instanceof Error ? error.stack : undefined,
      };
    }
  }
}
