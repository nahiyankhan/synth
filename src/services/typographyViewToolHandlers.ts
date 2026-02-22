/**
 * Typography View Tool Handlers
 * Implements typography-specific analysis tools
 */

import { StyleGraph } from '@/core/StyleGraph';
import { ToolResponse } from '@/types/toolRegistry';
import {
  TypeScaleAnalysisResult,
  ReadabilityAnalysisResult,
  TypeHierarchyResult,
  LetterSpacingAnalysisResult
} from '@/types/visualFeedback';

// Common type scale ratios
const KNOWN_RATIOS = [
  { value: 1.067, name: 'Minor Second' },
  { value: 1.125, name: 'Major Second' },
  { value: 1.2, name: 'Minor Third' },
  { value: 1.25, name: 'Major Third' },
  { value: 1.333, name: 'Perfect Fourth' },
  { value: 1.414, name: 'Augmented Fourth' },
  { value: 1.5, name: 'Perfect Fifth' },
  { value: 1.618, name: 'Golden Ratio' },
  { value: 1.667, name: 'Minor Sixth' },
  { value: 2.0, name: 'Octave' },
];

export class TypographyViewToolHandlers {
  constructor(private graph: StyleGraph) {}

  /**
   * Analyze if typography follows a modular scale
   */
  async analyzeTypeScale(params: {
    scope?: 'all' | 'primitives' | 'utilities';
    expectedRatio?: number;
  }): Promise<ToolResponse> {
    try {
      const typographyTokens = this.getTypographyTokens(params.scope || 'all');
      
      if (typographyTokens.length === 0) {
        return {
          success: false,
          error: 'No typography tokens found in the system',
        };
      }

      // Extract font sizes and sort them
      const sizes = typographyTokens
        .map(token => {
          const node = this.graph.getNode(token);
          const fontSize = this.extractFontSize(node?.value);
          return { token, size: fontSize };
        })
        .filter(t => t.size !== null)
        .sort((a, b) => a.size! - b.size!) as Array<{ token: string; size: number }>;

      if (sizes.length < 2) {
        return {
          success: false,
          error: 'Need at least 2 typography tokens with font sizes to analyze scale',
        };
      }

      // Detect ratio if not provided
      let detectedRatio = params.expectedRatio || null;
      let ratioName = null;

      if (!detectedRatio) {
        // Calculate ratios between consecutive sizes
        const ratios: number[] = [];
        for (let i = 1; i < sizes.length; i++) {
          ratios.push(sizes[i].size / sizes[i - 1].size);
        }

        // Average ratio
        const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;

        // Find closest known ratio
        let closestRatio = KNOWN_RATIOS[0];
        let minDiff = Math.abs(avgRatio - closestRatio.value);

        for (const ratio of KNOWN_RATIOS) {
          const diff = Math.abs(avgRatio - ratio.value);
          if (diff < minDiff) {
            minDiff = diff;
            closestRatio = ratio;
          }
        }

        detectedRatio = closestRatio.value;
        ratioName = closestRatio.name;
      } else {
        // Find name for provided ratio
        const match = KNOWN_RATIOS.find(r => Math.abs(r.value - detectedRatio!) < 0.01);
        ratioName = match?.name || `Custom (${detectedRatio.toFixed(3)})`;
      }

      // Calculate adherence
      const baseSize = sizes[0].size;
      const analyzedSizes = sizes.map((item, idx) => {
        const expectedSize = baseSize * Math.pow(detectedRatio!, idx);
        const deviation = ((item.size - expectedSize) / expectedSize) * 100;
        
        return {
          token: item.token,
          size: item.size,
          expectedSize,
          deviation: Math.abs(deviation),
        };
      });

      // Calculate adherence score (100 = perfect, 0 = completely off)
      const avgDeviation = analyzedSizes.reduce((sum, s) => sum + s.deviation, 0) / analyzedSizes.length;
      const adherenceScore = Math.max(0, 100 - avgDeviation);

      // Find gaps in the scale
      const gaps: Array<{
        between: [string, string];
        expectedSize: number;
        suggestedToken: string;
      }> = [];

      for (let i = 1; i < sizes.length; i++) {
        const actualRatio = sizes[i].size / sizes[i - 1].size;
        
        // If gap is larger than 2x the expected ratio, there's a missing step
        if (actualRatio > detectedRatio! * 1.8) {
          const missingSize = sizes[i - 1].size * detectedRatio!;
          gaps.push({
            between: [sizes[i - 1].token, sizes[i].token],
            expectedSize: Math.round(missingSize),
            suggestedToken: this.suggestTokenName(missingSize, sizes),
          });
        }
      }

      // Recommendations
      const recommendations: string[] = [];
      
      if (adherenceScore >= 90) {
        recommendations.push('✅ Excellent modular scale adherence');
      } else if (adherenceScore >= 70) {
        recommendations.push('⚠️ Good scale, but some sizes could be adjusted for better harmony');
      } else {
        recommendations.push('❌ Scale needs refinement to follow a consistent ratio');
      }

      if (gaps.length > 0) {
        recommendations.push(`Consider adding ${gaps.length} intermediate size(s) to fill gaps`);
      }

      const result: TypeScaleAnalysisResult = {
        detectedRatio,
        ratioName,
        adherenceScore: Math.round(adherenceScore),
        sizes: analyzedSizes,
        gaps,
        recommendations,
        scaleVisualization: {
          baseSize,
          ratio: detectedRatio!,
          steps: sizes.map((s, idx) => ({
            level: idx,
            size: s.size,
            hasToken: true,
          })),
        },
      };

      return {
        success: true,
        result,
        visualFeedback: {
          type: 'typeScaleAnalysis',
          data: result,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze type scale: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check readability (line-height to font-size ratios)
   */
  async checkReadability(params: {
    context?: 'all' | 'body' | 'heading' | 'display';
  }): Promise<ToolResponse> {
    try {
      const typographyTokens = this.getTypographyTokens('all');
      
      if (typographyTokens.length === 0) {
        return {
          success: false,
          error: 'No typography tokens found in the system',
        };
      }

      const analyzed: ReadabilityAnalysisResult['tokens'] = [];
      const issues: ReadabilityAnalysisResult['issues'] = [];

      for (const tokenPath of typographyTokens) {
        const node = this.graph.getNode(tokenPath);
        if (!node) continue;

        const fontSize = this.extractFontSize(node.value);
        const lineHeight = this.extractLineHeight(node.value, fontSize);

        if (!fontSize || !lineHeight) continue;

        const ratio = lineHeight / fontSize;
        const context = this.inferTextContext(tokenPath, fontSize);

        // Skip if filtering by context
        if (params.context && params.context !== 'all' && context !== params.context) {
          continue;
        }

        // Evaluate based on context
        const { status, recommendation } = this.evaluateReadability(ratio, context);

        analyzed.push({
          token: tokenPath,
          fontSize,
          lineHeight,
          ratio,
          context,
          status,
          recommendation,
        });

        // Add issues
        if (status === 'warning' || status === 'poor') {
          issues.push({
            token: tokenPath,
            problem: `Line-height ratio ${ratio.toFixed(2)} is ${status === 'poor' ? 'poor' : 'suboptimal'} for ${context} text`,
            suggestion: recommendation,
            severity: status === 'poor' ? 'high' : 'medium',
          });
        }
      }

      const summary = {
        optimal: analyzed.filter(t => t.status === 'optimal').length,
        acceptable: analyzed.filter(t => t.status === 'acceptable').length,
        needsImprovement: analyzed.filter(t => t.status === 'warning' || t.status === 'poor').length,
      };

      const overallScore = Math.round(
        ((summary.optimal * 100 + summary.acceptable * 70) / analyzed.length) || 0
      );

      const result: ReadabilityAnalysisResult = {
        overallScore,
        tokens: analyzed,
        issues,
        summary,
      };

      return {
        success: true,
        result,
        visualFeedback: {
          type: 'readabilityAnalysis',
          data: result,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check readability: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Suggest missing type hierarchy levels
   */
  async suggestTypeHierarchy(params: {
    baseSize?: number;
    ratio?: number;
  }): Promise<ToolResponse> {
    try {
      const baseSize = params.baseSize || 16;
      
      // Get existing typography tokens
      const typographyTokens = this.getTypographyTokens('all');
      
      // Extract current levels
      const currentLevels = typographyTokens
        .map(token => {
          const node = this.graph.getNode(token);
          const fontSize = this.extractFontSize(node?.value);
          const level = this.inferHierarchyLevel(token, fontSize);
          
          return fontSize ? { level, token, size: fontSize } : null;
        })
        .filter(Boolean) as Array<{ level: string; token: string; size: number }>;

      if (currentLevels.length === 0) {
        return {
          success: false,
          error: 'No typography tokens with font sizes found',
        };
      }

      // Detect scale
      const sizes = currentLevels.map(l => l.size).sort((a, b) => a - b);
      let ratio = params.ratio;

      if (!ratio) {
        // Calculate average ratio between sizes
        const ratios: number[] = [];
        for (let i = 1; i < sizes.length; i++) {
          ratios.push(sizes[i] / sizes[i - 1]);
        }
        const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
        
        // Find closest known ratio
        const closest = KNOWN_RATIOS.reduce((prev, curr) =>
          Math.abs(curr.value - avgRatio) < Math.abs(prev.value - avgRatio) ? curr : prev
        );
        
        ratio = closest.value;
      }

      const ratioName = KNOWN_RATIOS.find(r => Math.abs(r.value - ratio!) < 0.01)?.name || 'Custom';

      // Expected hierarchy levels
      const expectedLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'small', 'caption'];
      const existingLevels = new Set(currentLevels.map(l => l.level));

      // Suggest missing levels
      const missingLevels = expectedLevels
        .filter(level => !existingLevels.has(level))
        .map(level => {
          const suggestedSize = this.calculateSizeForLevel(level, baseSize, ratio!);
          
          return {
            level,
            suggestedSize: Math.round(suggestedSize),
            suggestedToken: `typography.${level}`,
            reasoning: this.explainHierarchyLevel(level, suggestedSize, ratio!),
          };
        });

      const completenessScore = Math.round((existingLevels.size / expectedLevels.length) * 100);

      const recommendations: string[] = [];
      
      if (completenessScore === 100) {
        recommendations.push('✅ Complete type hierarchy - all standard levels present');
      } else if (completenessScore >= 70) {
        recommendations.push('⚠️ Good coverage, consider adding remaining levels for completeness');
      } else {
        recommendations.push('❌ Incomplete hierarchy - add missing levels for better content structure');
      }

      const result: TypeHierarchyResult = {
        currentLevels,
        missingLevels,
        detectedScale: {
          baseSize,
          ratio: ratio!,
          ratioName,
        },
        completenessScore,
        recommendations,
      };

      return {
        success: true,
        result,
        visualFeedback: {
          type: 'typeHierarchy',
          data: result,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to suggest type hierarchy: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Analyze letter spacing appropriateness
   */
  async analyzeLetterSpacing(params: {
    scope?: 'all' | 'display' | 'body' | 'small';
  }): Promise<ToolResponse> {
    try {
      const typographyTokens = this.getTypographyTokens('all');
      
      if (typographyTokens.length === 0) {
        return {
          success: false,
          error: 'No typography tokens found in the system',
        };
      }

      const analyzed: LetterSpacingAnalysisResult['tokens'] = [];

      for (const tokenPath of typographyTokens) {
        const node = this.graph.getNode(tokenPath);
        if (!node) continue;

        const fontSize = this.extractFontSize(node.value);
        if (!fontSize) continue;

        const currentTracking = this.extractLetterSpacing(node.value);
        const sizeCategory = this.getSizeCategory(fontSize);

        // Skip if filtering by scope
        if (params.scope && params.scope !== 'all' && sizeCategory !== params.scope) {
          continue;
        }

        const { recommendedTracking, status, reasoning } = this.evaluateLetterSpacing(
          fontSize,
          currentTracking,
          sizeCategory
        );

        analyzed.push({
          token: tokenPath,
          fontSize,
          currentTracking,
          sizeCategory,
          status,
          recommendedTracking,
          reasoning,
        });
      }

      const summary = {
        needsNegativeTracking: analyzed.filter(t => t.recommendedTracking < 0 && t.status === 'needs-adjustment').length,
        needsPositiveTracking: analyzed.filter(t => t.recommendedTracking > 0 && t.status === 'needs-adjustment').length,
        optimal: analyzed.filter(t => t.status === 'optimal').length,
      };

      const recommendations: string[] = [];
      
      if (summary.optimal === analyzed.length) {
        recommendations.push('✅ All letter spacing values are optimal');
      } else {
        if (summary.needsNegativeTracking > 0) {
          recommendations.push(`Apply negative tracking (-0.01 to -0.04em) to ${summary.needsNegativeTracking} large text token(s)`);
        }
        if (summary.needsPositiveTracking > 0) {
          recommendations.push(`Apply positive tracking (+0.02 to +0.05em) to ${summary.needsPositiveTracking} small text token(s)`);
        }
      }

      const result: LetterSpacingAnalysisResult = {
        tokens: analyzed,
        summary,
        recommendations,
      };

      return {
        success: true,
        result,
        visualFeedback: {
          type: 'letterSpacingAnalysis',
          data: result,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze letter spacing: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  // === Helper Methods ===

  private getTypographyTokens(scope: 'all' | 'primitives' | 'utilities'): string[] {
    const allNodes = this.graph.getAllNodes();
    return allNodes
      .filter(node => {
        // Match typography tokens
        if (!node.path.includes('typography') && !node.path.includes('font') && !node.path.includes('text')) {
          return false;
        }

        // Filter by scope
        if (scope === 'primitives' && node.path.includes('utilities')) {
          return false;
        }
        if (scope === 'utilities' && !node.path.includes('utilities')) {
          return false;
        }

        return true;
      })
      .map(node => node.path);
  }

  private extractFontSize(value: any): number | null {
    if (!value) return null;
    
    // Handle object format { fontSize: "16px", ... }
    if (typeof value === 'object' && value.fontSize) {
      const match = String(value.fontSize).match(/(\d+(?:\.\d+)?)(px|rem|em)?/);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2];
        // Convert rem/em to px (assuming 16px base)
        return unit === 'rem' || unit === 'em' ? num * 16 : num;
      }
    }

    // Handle string format "16px" or "1.5rem"
    if (typeof value === 'string') {
      const match = value.match(/(\d+(?:\.\d+)?)(px|rem|em)?/);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2];
        return unit === 'rem' || unit === 'em' ? num * 16 : num;
      }
    }

    return null;
  }

  private extractLineHeight(value: any, fontSize: number | null): number | null {
    if (!value || !fontSize) return null;

    // Handle object format
    if (typeof value === 'object' && value.lineHeight) {
      const lh = String(value.lineHeight);
      
      // Unitless (relative)
      if (/^\d+(\.\d+)?$/.test(lh)) {
        return parseFloat(lh) * fontSize;
      }
      
      // Pixel value
      const match = lh.match(/(\d+(?:\.\d+)?)(px|rem|em)?/);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2];
        return unit === 'rem' || unit === 'em' ? num * 16 : num;
      }
    }

    return null;
  }

  private extractLetterSpacing(value: any): number | null {
    if (!value) return null;

    if (typeof value === 'object' && value.letterSpacing) {
      const ls = String(value.letterSpacing);
      
      // Parse em value (most common for letter-spacing)
      const match = ls.match(/(-?\d+(?:\.\d+)?)(em|px)?/);
      if (match) {
        return parseFloat(match[1]);
      }
    }

    return null;
  }

  private inferTextContext(tokenPath: string, fontSize: number): 'body' | 'heading' | 'display' | 'small' {
    const lower = tokenPath.toLowerCase();
    
    if (lower.includes('display') || fontSize > 48) return 'display';
    if (lower.includes('heading') || lower.includes('h1') || lower.includes('h2') || fontSize > 24) return 'heading';
    if (lower.includes('small') || lower.includes('caption') || fontSize < 14) return 'small';
    
    return 'body';
  }

  private evaluateReadability(ratio: number, context: string): {
    status: 'optimal' | 'acceptable' | 'warning' | 'poor';
    recommendation: string;
  } {
    const ranges = {
      body: { optimal: [1.4, 1.6], acceptable: [1.3, 1.7] },
      heading: { optimal: [1.1, 1.3], acceptable: [1.0, 1.4] },
      display: { optimal: [1.0, 1.2], acceptable: [0.9, 1.3] },
      small: { optimal: [1.5, 1.7], acceptable: [1.4, 1.8] },
    };

    const range = ranges[context as keyof typeof ranges];
    
    if (ratio >= range.optimal[0] && ratio <= range.optimal[1]) {
      return { status: 'optimal', recommendation: 'Line-height is optimal for readability' };
    }
    
    if (ratio >= range.acceptable[0] && ratio <= range.acceptable[1]) {
      return { status: 'acceptable', recommendation: 'Line-height is acceptable but could be optimized' };
    }
    
    if (ratio < range.acceptable[0]) {
      const suggested = range.optimal[0];
      return {
        status: ratio < range.acceptable[0] - 0.2 ? 'poor' : 'warning',
        recommendation: `Increase line-height to ~${suggested.toFixed(1)} for better readability`,
      };
    }
    
    const suggested = range.optimal[1];
    return {
      status: ratio > range.acceptable[1] + 0.2 ? 'poor' : 'warning',
      recommendation: `Decrease line-height to ~${suggested.toFixed(1)} for tighter spacing`,
    };
  }

  private inferHierarchyLevel(tokenPath: string, fontSize: number | null): string {
    const lower = tokenPath.toLowerCase();
    
    // Try to extract from path
    if (lower.includes('h1')) return 'h1';
    if (lower.includes('h2')) return 'h2';
    if (lower.includes('h3')) return 'h3';
    if (lower.includes('h4')) return 'h4';
    if (lower.includes('h5')) return 'h5';
    if (lower.includes('h6')) return 'h6';
    if (lower.includes('body')) return 'body';
    if (lower.includes('small')) return 'small';
    if (lower.includes('caption')) return 'caption';
    if (lower.includes('display')) return 'display';
    
    // Infer from size
    if (fontSize) {
      if (fontSize >= 48) return 'h1';
      if (fontSize >= 36) return 'h2';
      if (fontSize >= 28) return 'h3';
      if (fontSize >= 20) return 'h4';
      if (fontSize >= 18) return 'h5';
      if (fontSize >= 16) return 'body';
      if (fontSize >= 14) return 'small';
      return 'caption';
    }
    
    return 'unknown';
  }

  private calculateSizeForLevel(level: string, baseSize: number, ratio: number): number {
    const hierarchy: { [key: string]: number } = {
      h1: Math.pow(ratio, 5),
      h2: Math.pow(ratio, 4),
      h3: Math.pow(ratio, 3),
      h4: Math.pow(ratio, 2),
      h5: Math.pow(ratio, 1),
      h6: Math.pow(ratio, 0.5),
      body: 1,
      small: 1 / ratio,
      caption: 1 / Math.pow(ratio, 1.5),
    };

    return baseSize * (hierarchy[level] || 1);
  }

  private explainHierarchyLevel(level: string, size: number, ratio: number): string {
    const explanations: { [key: string]: string } = {
      h1: `Largest heading - ${size}px follows ${ratio.toFixed(2)}^5 scale`,
      h2: `Second-level heading - ${size}px follows ${ratio.toFixed(2)}^4 scale`,
      h3: `Third-level heading - ${size}px follows ${ratio.toFixed(2)}^3 scale`,
      h4: `Fourth-level heading - ${size}px follows ${ratio.toFixed(2)}^2 scale`,
      h5: `Fifth-level heading - ${size}px follows ${ratio.toFixed(2)}^1 scale`,
      h6: `Sixth-level heading - ${size}px (smallest heading)`,
      body: `Body text - ${size}px (base size)`,
      small: `Small text - ${size}px (1 step down from base)`,
      caption: `Caption text - ${size}px (smallest text)`,
    };

    return explanations[level] || `${size}px`;
  }

  private getSizeCategory(fontSize: number): 'display' | 'heading' | 'body' | 'small' {
    if (fontSize >= 48) return 'display';
    if (fontSize >= 20) return 'heading';
    if (fontSize >= 14) return 'body';
    return 'small';
  }

  private evaluateLetterSpacing(
    fontSize: number,
    currentTracking: number | null,
    sizeCategory: string
  ): {
    recommendedTracking: number;
    status: 'optimal' | 'acceptable' | 'needs-adjustment';
    reasoning: string;
  } {
    // General rules:
    // - Display (48+px): -0.02 to -0.04em
    // - Heading (20-48px): -0.01 to -0.02em
    // - Body (14-20px): 0 to 0.01em
    // - Small (<14px): 0.02 to 0.05em

    const recommendations: { [key: string]: { range: [number, number]; ideal: number } } = {
      display: { range: [-0.04, -0.02], ideal: -0.03 },
      heading: { range: [-0.02, -0.01], ideal: -0.015 },
      body: { range: [0, 0.01], ideal: 0.005 },
      small: { range: [0.02, 0.05], ideal: 0.03 },
    };

    const rec = recommendations[sizeCategory];
    const ideal = rec.ideal;

    if (currentTracking === null) {
      return {
        recommendedTracking: ideal,
        status: 'needs-adjustment',
        reasoning: `No letter-spacing set - recommend ${ideal}em for ${sizeCategory} text`,
      };
    }

    if (currentTracking >= rec.range[0] && currentTracking <= rec.range[1]) {
      return {
        recommendedTracking: currentTracking,
        status: 'optimal',
        reasoning: `Letter-spacing is optimal for ${sizeCategory} text`,
      };
    }

    const diff = Math.abs(currentTracking - ideal);
    if (diff < 0.01) {
      return {
        recommendedTracking: ideal,
        status: 'acceptable',
        reasoning: `Close to ideal - consider adjusting to ${ideal}em`,
      };
    }

    return {
      recommendedTracking: ideal,
      status: 'needs-adjustment',
      reasoning: `Adjust letter-spacing to ${ideal}em for better ${sizeCategory} text readability`,
    };
  }

  private suggestTokenName(size: number, existingSizes: Array<{ token: string; size: number }>): string {
    // Find where this size would fit
    const index = existingSizes.findIndex(s => s.size > size);
    
    if (index === -1) {
      return 'typography.largest';
    }
    
    // Try to infer naming pattern
    const prevToken = existingSizes[Math.max(0, index - 1)].token;
    const match = prevToken.match(/\.(h\d+|body|small|caption)/);
    
    if (match) {
      const level = match[1];
      if (level.startsWith('h')) {
        const num = parseInt(level.substring(1));
        return `typography.h${num + 1}`;
      }
    }
    
    return `typography.size${Math.round(size)}`;
  }
}

