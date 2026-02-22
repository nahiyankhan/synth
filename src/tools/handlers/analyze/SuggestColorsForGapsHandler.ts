/**
 * SuggestColorsForGaps Handler
 * Analyzes color distribution and suggests colors to fill gaps
 */

import { ToolHandler } from '../../../core/ToolHandler';
import { SUGGEST_COLORS_FOR_GAPS_TOOL } from '../../definitions/colorView.tools';
import { SuggestColorsForGapsParams, SuggestColorsForGapsParamsSchema } from '../../schemas/analyze.schemas';
import { StyleGraph } from '../../../core/StyleGraph';

interface ColorSuggestion {
  suggestedColor: string;
  oklch: { l: number; c: number; h: number };
  gapSize: number;
  position: string;
  nearbyTokens: string[];
  before: string;
  after: string;
  reasoning: string;
}

interface SuggestColorsResult {
  analyzedColors: number;
  gapsDetected: number;
  suggestions: ColorSuggestion[];
  threshold: number;
}

export class SuggestColorsForGapsHandler extends ToolHandler<SuggestColorsForGapsParams, SuggestColorsResult> {
  constructor(private graph: StyleGraph) {
    super(SUGGEST_COLORS_FOR_GAPS_TOOL);
  }

  protected validate(params: unknown): SuggestColorsForGapsParams {
    return SuggestColorsForGapsParamsSchema.parse(params);
  }

  protected async handle(params: SuggestColorsForGapsParams): Promise<SuggestColorsResult> {
    const { hexToOKLCH, detectColorGaps, oklchToHex } = await import(
      '../../../services/colorScience'
    );

    const filter = params.filter || 'all';
    const threshold = params.threshold || 0.15;
    const maxSuggestions = params.maxSuggestions || 10;

    // Get all color tokens based on filter
    let colorNodes = Array.from(this.graph.nodes.values()).filter(
      (n) => n.type === 'color'
    );

    if (filter === 'primitives') {
      colorNodes = colorNodes.filter((n) => n.layer === 'primitive');
    } else if (filter === 'utilities') {
      colorNodes = colorNodes.filter((n) => n.layer === 'utility');
    }

    // Filter out specs
    colorNodes = colorNodes.filter((n) => !n.metadata?.isSpec);

    // Convert to OKLCH with resolved colors
    const colors: Array<{
      nodeId: string;
      color: string;
      oklch: { l: number; c: number; h: number };
    }> = [];

    for (const node of colorNodes) {
      const resolved = this.graph.resolveNode(node.id, 'light');
      if (typeof resolved === 'string' && resolved.startsWith('#')) {
        try {
          const oklch = hexToOKLCH(resolved);
          colors.push({
            nodeId: node.id,
            color: resolved,
            oklch: { l: oklch.l, c: oklch.c, h: oklch.h },
          });
        } catch (error) {
          // Skip invalid colors
        }
      }
    }

    if (colors.length < 2) {
      throw new Error('Need at least 2 color tokens to detect gaps');
    }

    // Detect gaps using color science service
    const gaps = detectColorGaps(
      colors.map((c) => c.oklch),
      threshold
    );

    // Limit suggestions
    const limitedGaps = gaps.slice(0, maxSuggestions);

    // Convert gap suggestions to hex and add context
    const suggestions: ColorSuggestion[] = limitedGaps.map((gap) => {
      // Interpolate between before and after to suggest a color
      const suggestedOKLCH = {
        l: (gap.before.l + gap.after.l) / 2,
        c: (gap.before.c + gap.after.c) / 2,
        h: (gap.before.h + gap.after.h) / 2,
      };

      const suggestedHex = oklchToHex(suggestedOKLCH);

      // Find tokens near this gap
      const beforeIdx = colors.findIndex(
        (c) =>
          c.oklch.l === gap.before.l &&
          c.oklch.c === gap.before.c &&
          c.oklch.h === gap.before.h
      );
      const afterIdx = colors.findIndex(
        (c) =>
          c.oklch.l === gap.after.l &&
          c.oklch.c === gap.after.c &&
          c.oklch.h === gap.after.h
      );

      const nearbyTokens: string[] = [];
      if (beforeIdx >= 0) nearbyTokens.push(colors[beforeIdx].nodeId);
      if (afterIdx >= 0) nearbyTokens.push(colors[afterIdx].nodeId);

      // Determine which dimension has the largest gap
      const lightnessDiff = Math.abs(gap.after.l - gap.before.l);
      const chromaDiff = Math.abs(gap.after.c - gap.before.c);
      const hueDiff = Math.abs(gap.after.h - gap.before.h);

      let position = 'color space';
      if (lightnessDiff > chromaDiff && lightnessDiff > hueDiff) {
        position = 'lightness';
      } else if (chromaDiff > hueDiff) {
        position = 'chroma';
      } else {
        position = 'hue';
      }

      return {
        suggestedColor: suggestedHex,
        oklch: suggestedOKLCH,
        gapSize: Math.round(gap.gap * 1000) / 1000,
        position,
        nearbyTokens,
        before: oklchToHex(gap.before),
        after: oklchToHex(gap.after),
        reasoning: `Gap of ${Math.round(gap.gap * 100) / 100} detected between colors. Largest difference in ${position}.`,
      };
    });

    return {
      analyzedColors: colors.length,
      gapsDetected: gaps.length,
      suggestions,
      threshold,
    };
  }

  protected getSuccessMessage(params: SuggestColorsForGapsParams, result: SuggestColorsResult): string {
    return `Found ${result.gapsDetected} gap${result.gapsDetected !== 1 ? 's' : ''} in color palette. Showing ${result.suggestions.length} suggestion${result.suggestions.length !== 1 ? 's' : ''}.`;
  }
}
