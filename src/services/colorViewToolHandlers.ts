/**
 * ColorView Tool Handlers with Multi-Option Proposals
 * Implements color-specific analysis and manipulation tools
 */

import { StyleGraph } from '../core/StyleGraph';
import { StyleMode } from '../types/styleGraph';
import { hexToOKLCH, oklchToHex, OKLCHColor } from './colorScience';
import { ToolResponse } from '../types/toolRegistry';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createCatchErrorResponse,
} from '../utils/toolResponseHelpers';
import {
  ColorOptionProposal,
  ColorChangePreview,
  SimilarityResult,
  LightnessScaleResult,
  ColorScaleProposal,
  ContrastCheckResult,
  HueGroupingResult
} from '../types/visualFeedback';

export class ColorViewToolHandlers {
  constructor(private graph: StyleGraph) {}

  /**
   * Adjust colors lightness - Returns MULTI-OPTION proposal
   */
  async adjustColorsLightness(params: {
    colorPaths: string[];
    direction: 'lighter' | 'darker';
    targetHue?: string;
  }): Promise<ToolResponse> {
    try {
      // Resolve which colors to adjust
      const colorsToAdjust = this.resolveColorPaths(params.colorPaths, params.targetHue);
      
      if (colorsToAdjust.length === 0) {
        return {
          success: false,
          error: 'No colors found matching the criteria'
        };
      }

      // Generate 3 options with different intensities
      const adjustments = params.direction === 'lighter' 
        ? [0.08, 0.12, 0.18]  // Conservative, Moderate, Bold
        : [-0.08, -0.12, -0.18];

      const optionNames = ['Conservative', 'Moderate', 'Bold'];
      const optionDescriptions = params.direction === 'lighter'
        ? [
            'Subtle lightness boost for a gentle refresh',
            'Noticeable improvement with good balance',
            'Maximum impact - verify contrast carefully'
          ]
        : [
            'Subtle darkening for refined depth',
            'Noticeable depth with good balance',  
            'Maximum depth - verify legibility'
          ];

      const options = adjustments.map((adjustment, idx) => {
        const previews: ColorChangePreview[] = colorsToAdjust.map(color => {
          const newOKLCH = {
            ...color.oklch,
            l: Math.max(0, Math.min(1, color.oklch.l + adjustment))
          };
          
          return {
            token: color.path,
            before: {
              hex: color.value,
              oklch: color.oklch
            },
            after: {
              hex: oklchToHex(newOKLCH),
              oklch: newOKLCH
            },
            affectedCount: this.graph.getNode(color.path)?.dependents.length || 0,
            componentTypes: this.inferComponentTypes(color.path)
          };
        });

        const totalAffected = previews.reduce((sum, p) => sum + p.affectedCount, 0);

        return {
          id: `option-${idx}`,
          name: `${optionNames[idx]} ${Math.abs(adjustment * 100).toFixed(0)}%`,
          description: optionDescriptions[idx],
          confidence: idx === 1 ? 95 : idx === 0 ? 80 : 65, // Moderate has highest confidence
          reasoning: this.generateReasoning(adjustment, previews, params.direction),
          preview: previews,
          changesCount: previews.length,
          affectedTokensCount: totalAffected,
          estimatedImpact: (idx === 0 ? 'low' : idx === 1 ? 'medium' : 'high') as 'low' | 'medium' | 'high'
        };
      });

      const proposal: ColorOptionProposal = {
        type: 'color',
        question: `How much ${params.direction} should we make ${params.targetHue || 'these colors'}?`,
        options,
        recommendedOptionId: 'option-1', // Moderate is default recommendation
        allowCustom: true,
        customizationHint: 'You can adjust the percentage or pick specific colors',
        
        // Additional color-specific metadata
        affectedHues: [...new Set(colorsToAdjust.map(c => this.getHueName(c.oklch.h)))],
        preservesHarmony: await this.checksHarmonyPreservation(colorsToAdjust, adjustments[1]),
        accessibilityImpact: this.assessAccessibilityImpact(options[1].preview, params.direction)
      };

      return {
        success: true,
        data: proposal,
        message: `Prepared ${options.length} options for ${colorsToAdjust.length} colors`
      };

    } catch (error) {
      return createCatchErrorResponse(error);
    }
  }

  /**
   * Generate color scale - Returns MULTI-OPTION proposal with 3 algorithmic approaches
   */
  async generateColorScale(params: {
    baseColor: string;
    baseLevel: number;
  }): Promise<ToolResponse> {
    try {
      // Resolve base color
      const baseColorNode = this.graph.getNode(params.baseColor);
      let baseHex: string;
      let basePath: string;

      if (baseColorNode) {
        baseHex = this.graph.resolveNode(params.baseColor, 'light') as string;
        basePath = params.baseColor;
      } else if (params.baseColor.startsWith('#')) {
        baseHex = params.baseColor;
        basePath = 'custom';
      } else {
        return createNotFoundResponse('Color', params.baseColor);
      }

      const baseOKLCH = hexToOKLCH(baseHex);
      const levels = [100, 200, 300, 400, 500, 600, 700, 800, 900];

      // Generate 3 different scale approaches
      const options = [
        // Option 1: Linear Lightness
        {
          id: 'linear',
          name: 'Linear Lightness',
          description: 'Even lightness steps - predictable and systematic',
          confidence: 85,
          reasoning: 'Uses linear interpolation in OKLCH lightness. Simple and predictable, great for technical applications.',
          scale: this.generateLinearScale(baseOKLCH, params.baseLevel, levels),
          usageNotes: 'Best for: Data visualization, technical UIs, when you need predictable increments'
        },

        // Option 2: Perceptual Even
        {
          id: 'perceptual',
          name: 'Perceptual Even',
          description: 'Equal perceived difference between steps',
          confidence: 95,
          reasoning: 'Adjusts for human perception - each step feels equally different. Recommended for most use cases.',
          scale: this.generatePerceptualScale(baseOKLCH, params.baseLevel, levels),
          usageNotes: 'Best for: Marketing sites, brand applications, general UI work'
        },

        // Option 3: Chroma Adjusted
        {
          id: 'chroma',
          name: 'Chroma Adjusted',
          description: 'Reduces saturation at extremes for natural look',
          confidence: 78,
          reasoning: 'Lighter colors have less chroma (more pastel), darker colors also desaturate. Mimics natural light behavior.',
          scale: this.generateChromaAdjustedScale(baseOKLCH, params.baseLevel, levels),
          usageNotes: 'Best for: Natural aesthetics, backgrounds, subtle UI elements'
        }
      ];

      const proposal: ColorScaleProposal = {
        baseColor: {
          path: basePath,
          value: baseHex,
          oklch: baseOKLCH
        },
        baseLevel: params.baseLevel,
        options,
        recommendedOptionId: 'perceptual',
        comparisonMetrics: {
          lightnessProgression: 'Varies by option',
          chromaVariation: 'Constant (linear, perceptual) vs Variable (chroma)',
          perceivedContrast: 95
        }
      };

      return {
        success: true,
        data: proposal,
        message: `Generated 3 scale approaches from ${basePath}`
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Find similar colors
   */
  async findSimilarColors(params: {
    targetColor: string;
    threshold: number;
  }): Promise<ToolResponse> {
    try {
      const targetNode = this.graph.getNode(params.targetColor);
      if (!targetNode) {
        return { success: false, error: `Color not found: ${params.targetColor}` };
      }
      
      const targetValue = this.graph.resolveNode(params.targetColor, 'light');
      if (typeof targetValue !== 'string' || !targetValue.startsWith('#')) {
        return { success: false, error: `Target color is not a valid hex color: ${targetValue}` };
      }
      
      const targetOKLCH = hexToOKLCH(targetValue);
      const allColors = this.getColorNodes('all', 'light');
      
      const similarColors = allColors
        .filter(c => c.path !== params.targetColor)
        .map(color => {
          const distance = this.calculatePerceptualDistance(targetOKLCH, color.oklch);
          return {
            path: color.path,
            value: color.value,
            distance,
            oklch: color.oklch,
            recommendation: (distance < 0.05 ? 'consolidate' : distance < params.threshold ? 'review' : 'keep') as 'consolidate' | 'review' | 'keep'
          };
        })
        .filter(c => c.distance < params.threshold)
        .sort((a, b) => a.distance - b.distance);
      
      const consolidationOpportunity = similarColors.some(c => c.distance < 0.05);
      
      const result: SimilarityResult = {
        targetColor: {
          path: params.targetColor,
          value: targetValue,
          oklch: targetOKLCH
        },
        similarColors,
        consolidationOpportunity
      };

      return {
        success: true,
        data: result,
        message: `Found ${similarColors.length} similar color${similarColors.length !== 1 ? 's' : ''}`
      };
      
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check lightness scale
   */
  async checkLightnessScale(params: {
    hueFamily: string;
  }): Promise<ToolResponse> {
    try {
      const allColors = this.getColorNodes('all', 'light');
      
      // Filter colors by hue family
      const familyColors = allColors.filter(color => {
        const hueName = this.getHueName(color.oklch.h).toLowerCase();
        return hueName === params.hueFamily.toLowerCase() || 
               color.path.toLowerCase().includes(params.hueFamily.toLowerCase());
      });

      if (familyColors.length === 0) {
        return {
          success: false,
          error: `No colors found for hue family "${params.hueFamily}"`
        };
      }

      // Sort by lightness
      const sortedColors = familyColors
        .map(c => ({
          path: c.path,
          lightness: c.oklch.l,
          value: c.value,
          oklch: c.oklch
        }))
        .sort((a, b) => b.lightness - a.lightness);

      // Check for gaps
      const gaps = [];
      const idealScale = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
      
      for (const idealL of idealScale) {
        const hasClose = sortedColors.some(c => Math.abs(c.lightness - idealL) < 0.05);
        if (!hasClose) {
          const hueName = this.getHueName(sortedColors[0].oklch.h);
          const level = Math.round(idealL * 900 + 100);
          gaps.push({
            missingLightness: idealL,
            suggestedName: `color.${hueName.toLowerCase()}.${level}`,
            suggestedValue: oklchToHex({
              l: idealL,
              c: sortedColors[0].oklch.c,
              h: sortedColors[0].oklch.h
            })
          });
        }
      }

      const scaleType: 'complete' | 'partial' | 'irregular' = 
        gaps.length === 0 ? 'complete' :
        gaps.length <= 3 ? 'partial' :
        'irregular';

      const result: LightnessScaleResult = {
        hueFamily: params.hueFamily,
        colors: sortedColors,
        gaps,
        scaleType,
        recommendation: scaleType === 'complete' 
          ? `Your ${params.hueFamily} scale is complete!`
          : `Add ${gaps.length} intermediate values to complete the scale`,
        lightnessRange: [
          Math.min(...sortedColors.map(c => c.lightness)),
          Math.max(...sortedColors.map(c => c.lightness))
        ],
        idealScale: idealScale.map(l => l * 100)
      };

      return {
        success: true,
        data: result,
        message: `Found ${sortedColors.length} colors in ${params.hueFamily} family with ${gaps.length} gaps`
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check color contrast
   */
  async checkColorContrast(params: {
    foreground: string;
    background: string;
  }): Promise<ToolResponse> {
    try {
      const fgValue = this.graph.resolveNode(params.foreground, 'light');
      const bgValue = this.graph.resolveNode(params.background, 'light');

      if (typeof fgValue !== 'string' || typeof bgValue !== 'string') {
        return { success: false, error: 'Colors must resolve to hex values' };
      }

      const ratio = this.calculateContrastRatio(fgValue, bgValue);

      const result: ContrastCheckResult = {
        contrastRatio: ratio,
        wcagAA: {
          normalText: ratio >= 4.5,
          largeText: ratio >= 3
        },
        wcagAAA: {
          normalText: ratio >= 7,
          largeText: ratio >= 4.5
        },
        recommendation: ratio >= 7 
          ? 'Excellent! Passes WCAG AAA for all text sizes.'
          : ratio >= 4.5
          ? 'Good! Passes WCAG AA for all text sizes.'
          : ratio >= 3
          ? 'Passes WCAG AA for large text only. Increase contrast for small text.'
          : 'Poor contrast. Fails WCAG standards. Increase contrast significantly.'
      };

      return {
        success: true,
        data: result,
        message: `Contrast ratio: ${ratio.toFixed(2)}:1`
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Group colors by hue
   */
  async groupColorsByHue(params: {
    scope: 'all' | 'primitives' | 'utilities';
  }): Promise<ToolResponse> {
    try {
      const colors = this.getColorNodes(params.scope, 'light');
      
      if (colors.length === 0) {
        return { success: false, error: 'No colors found' };
      }

      const hueRanges = [
        { min: 0, max: 30, name: 'Red' },
        { min: 30, max: 60, name: 'Orange' },
        { min: 60, max: 90, name: 'Yellow' },
        { min: 90, max: 150, name: 'Green' },
        { min: 150, max: 210, name: 'Cyan' },
        { min: 210, max: 270, name: 'Blue' },
        { min: 270, max: 330, name: 'Purple' },
        { min: 330, max: 360, name: 'Magenta' }
      ];

      const hueGroups = hueRanges.map(range => {
        const groupColors = colors.filter(c => 
          c.oklch.h >= range.min && c.oklch.h < range.max
        );

        return {
          hueName: range.name,
          hueRange: [range.min, range.max] as [number, number],
          colors: groupColors,
          count: groupColors.length,
          averageLightness: groupColors.length > 0
            ? groupColors.reduce((sum, c) => sum + c.oklch.l, 0) / groupColors.length
            : 0,
          averageChroma: groupColors.length > 0
            ? groupColors.reduce((sum, c) => sum + c.oklch.c, 0) / groupColors.length
            : 0
        };
      }).filter(g => g.count > 0);

      const dominantHues = hueGroups
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(g => g.hueName);

      const underrepresentedHues = hueRanges
        .filter(range => !hueGroups.some(g => g.hueName === range.name))
        .map(r => r.name);

      const result: HueGroupingResult = {
        hueGroups,
        dominantHues,
        underrepresentedHues
      };

      return {
        success: true,
        data: result,
        message: `Grouped ${colors.length} colors into ${hueGroups.length} hue families`
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // Helper Methods
  // ========================================

  private resolveColorPaths(paths: string[], targetHue?: string) {
    let colors: Array<{ path: string; value: string; oklch: OKLCHColor }>;

    if (paths.includes('*') && targetHue) {
      // Auto-detect colors matching hue
      colors = this.getColorNodes('all', 'light')
        .filter(c => this.getHueName(c.oklch.h).toLowerCase() === targetHue.toLowerCase());
    } else {
      // Specific paths
      colors = paths
        .map(path => {
          const node = this.graph.getNode(path);
          if (!node) return null;
          const value = this.graph.resolveNode(path, 'light');
          if (typeof value !== 'string' || !value.startsWith('#')) return null;
          return {
            path,
            value,
            oklch: hexToOKLCH(value)
          };
        })
        .filter(Boolean) as any[];
    }

    return colors;
  }

  private getColorNodes(scope: string, viewMode: StyleMode) {
    let nodes = this.graph.getNodes({ type: 'color', excludeSpecs: true });
    
    if (scope === 'primitives') {
      nodes = nodes.filter(n => n.layer === 'primitive');
    } else if (scope === 'utilities') {
      nodes = nodes.filter(n => n.layer === 'utility');
    }
    
    return nodes.map(node => {
      const value = this.graph.resolveNode(node.id, viewMode);
      if (typeof value !== 'string' || !value.startsWith('#')) return null;
      
      return {
        path: node.id,
        value,
        oklch: hexToOKLCH(value)
      };
    }).filter(Boolean) as Array<{ path: string; value: string; oklch: OKLCHColor }>;
  }

  private getHueName(hue: number): string {
    const hueNames = [
      { min: 0, max: 30, name: 'Red' },
      { min: 30, max: 60, name: 'Orange' },
      { min: 60, max: 90, name: 'Yellow' },
      { min: 90, max: 150, name: 'Green' },
      { min: 150, max: 210, name: 'Cyan' },
      { min: 210, max: 270, name: 'Blue' },
      { min: 270, max: 330, name: 'Purple' },
      { min: 330, max: 360, name: 'Magenta' }
    ];

    return hueNames.find(h => hue >= h.min && hue < h.max)?.name || 'Red';
  }

  private inferComponentTypes(tokenPath: string): string[] {
    const types: string[] = [];
    
    if (tokenPath.includes('button') || tokenPath.includes('primary')) types.push('button');
    if (tokenPath.includes('text')) types.push('text');
    if (tokenPath.includes('background')) types.push('card', 'background');
    if (tokenPath.includes('border')) types.push('input', 'card');
    
    return types.length > 0 ? types : ['general'];
  }

  private generateReasoning(adjustment: number, previews: ColorChangePreview[], direction: string): string {
    const percentage = Math.abs(adjustment * 100).toFixed(0);
    const affectedCount = previews.reduce((sum, p) => sum + p.affectedCount, 0);
    
    if (Math.abs(adjustment) <= 0.1) {
      return `A gentle ${percentage}% ${direction === 'lighter' ? 'lightness boost' : 'darkening'} that maintains your current aesthetic while providing subtle refinement. Safe for all contexts, affects ${affectedCount} dependent tokens.`;
    } else if (Math.abs(adjustment) <= 0.15) {
      return `A ${percentage}% ${direction === 'lighter' ? 'lightness increase' : 'darkening'} that creates noticeable improvement without dramatic change. Good balance of impact and safety. Affects ${affectedCount} dependent tokens - review contrast ratios.`;
    } else {
      return `A bold ${percentage}% ${direction === 'lighter' ? 'lightness boost' : 'darkening'} for maximum impact. This will significantly change your palette's character. Carefully verify contrast ratios and accessibility. Affects ${affectedCount} dependent tokens.`;
    }
  }

  private async checksHarmonyPreservation(_colors: any[], adjustment: number): Promise<boolean> {
    // Simplified check - in practice, would re-analyze harmony after adjustment
    return Math.abs(adjustment) <= 0.15;
  }

  private assessAccessibilityImpact(previews: ColorChangePreview[], direction: string): 'positive' | 'neutral' | 'negative' {
    // Simplified - in practice would check actual contrast ratios
    if (direction === 'lighter') {
      return previews.some(p => p.after.oklch.l > 0.8) ? 'negative' : 'neutral';
    } else {
      return previews.some(p => p.after.oklch.l < 0.3) ? 'negative' : 'neutral';
    }
  }

  private generateLinearScale(baseOKLCH: OKLCHColor, baseLevel: number, levels: number[]) {
    return levels.map(level => {
      const t = (level - 100) / 800; // 0 to 1
      const lightness = 0.95 - (t * 0.90); // 95% to 5%
      
      const adjustedOKLCH = {
        l: level === baseLevel ? baseOKLCH.l : lightness,
        c: baseOKLCH.c,
        h: baseOKLCH.h
      };

      return {
        level,
        hex: oklchToHex(adjustedOKLCH),
        oklch: adjustedOKLCH,
        suggestedName: `color.${this.getHueName(baseOKLCH.h).toLowerCase()}.${level}`
      };
    });
  }

  private generatePerceptualScale(baseOKLCH: OKLCHColor, baseLevel: number, levels: number[]) {
    // Easing function for perceptual evenness
    const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    
    return levels.map(level => {
      const t = (level - 100) / 800;
      const easedT = easeInOutQuad(t);
      const lightness = 0.95 - (easedT * 0.90);
      
      const adjustedOKLCH = {
        l: level === baseLevel ? baseOKLCH.l : lightness,
        c: baseOKLCH.c,
        h: baseOKLCH.h
      };

      return {
        level,
        hex: oklchToHex(adjustedOKLCH),
        oklch: adjustedOKLCH,
        suggestedName: `color.${this.getHueName(baseOKLCH.h).toLowerCase()}.${level}`
      };
    });
  }

  private generateChromaAdjustedScale(baseOKLCH: OKLCHColor, baseLevel: number, levels: number[]) {
    return levels.map(level => {
      const t = (level - 100) / 800;
      const lightness = 0.95 - (t * 0.90);
      
      // Reduce chroma at extremes
      let chromaMultiplier = 1;
      if (lightness > 0.8) chromaMultiplier = 0.6; // Lighter = more pastel
      if (lightness < 0.3) chromaMultiplier = 0.7; // Darker = less saturated
      
      const adjustedOKLCH = {
        l: level === baseLevel ? baseOKLCH.l : lightness,
        c: baseOKLCH.c * chromaMultiplier,
        h: baseOKLCH.h
      };

      return {
        level,
        hex: oklchToHex(adjustedOKLCH),
        oklch: adjustedOKLCH,
        suggestedName: `color.${this.getHueName(baseOKLCH.h).toLowerCase()}.${level}`
      };
    });
  }

  private calculatePerceptualDistance(color1: OKLCHColor, color2: OKLCHColor): number {
    // Simplified CIEDE2000-like calculation
    const dL = color1.l - color2.l;
    const dC = color1.c - color2.c;
    const dH = Math.min(Math.abs(color1.h - color2.h), 360 - Math.abs(color1.h - color2.h));
    
    return Math.sqrt(dL * dL + dC * dC + (dH / 360) * (dH / 360)) / 2;
  }

  private calculateContrastRatio(hex1: string, hex2: string): number {
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = ((rgb >> 16) & 0xff) / 255;
      const g = ((rgb >> 8) & 0xff) / 255;
      const b = (rgb & 0xff) / 255;
      
      const [rs, gs, bs] = [r, g, b].map(c => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const lum1 = getLuminance(hex1);
    const lum2 = getLuminance(hex2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Select colors - with optional filter
   */
  async selectColors(params: {
    filter?: string;
    scope?: 'all' | 'primitives' | 'utilities';
  }): Promise<ToolResponse> {
    try {
      const scope = params.scope || 'all';
      let colors = this.getColorNodes(scope, 'light');

      // If filter is provided, search and filter colors first
      if (params.filter) {
        const filterLower = params.filter.toLowerCase();
        
        // Filter by color name/path or by hue
        colors = colors.filter(color => {
          // Check if path matches filter
          if (color.path.toLowerCase().includes(filterLower)) {
            return true;
          }

          // Check if it's a hue-based filter (e.g., "green", "blue", "red")
          const hueName = this.getHueName(color.oklch.h).toLowerCase();
          if (hueName.includes(filterLower) || filterLower.includes(hueName)) {
            return true;
          }

          return false;
        });
      }

      if (colors.length === 0) {
        return {
          success: false,
          error: params.filter 
            ? `No colors found matching filter: "${params.filter}"`
            : 'No colors found in the current scope'
        };
      }

      // Return the selection data
      const selectionData = {
        colors: colors.map(c => ({
          path: c.path,
          value: c.value,
          oklch: c.oklch,
          layer: this.graph.getNode(c.path)?.layer || 'primitive'
        })),
        filter: params.filter,
        scope,
        count: colors.length
      };

      return {
        success: true,
        data: selectionData,
        message: params.filter 
          ? `Selected ${colors.length} color${colors.length !== 1 ? 's' : ''} matching "${params.filter}"`
          : `Selected all ${colors.length} visible color${colors.length !== 1 ? 's' : ''}`,
        // Include node IDs for selection
        nodeIds: colors.map(c => c.path)
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}





