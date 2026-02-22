/**
 * Spacing View Tool Handlers
 * Implements spacing/sizing-specific analysis tools
 */

import { StyleGraph } from '../core/StyleGraph';
import { ToolResponse } from '../types/toolRegistry';
import {
  SpacingScaleAnalysisResult,
  SpacingConsistencyResult,
  SpacingTokenSuggestionsResult,
  SizeHarmonyResult
} from '../types/visualFeedback';

// Common base units for spacing systems
const COMMON_BASE_UNITS = [4, 8, 5, 6, 10, 12, 16];

export class SpacingViewToolHandlers {
  constructor(private graph: StyleGraph) {}

  /**
   * Analyze if spacing follows a consistent scale (4px, 8px base, etc.)
   */
  async analyzeSpacingScale(params: {
    scope?: 'all' | 'spacing' | 'sizing' | 'primitives' | 'utilities';
    expectedBase?: number;
  }): Promise<ToolResponse> {
    try {
      const spacingTokens = this.getSpacingSizeTokens(params.scope || 'all');
      
      if (spacingTokens.length === 0) {
        return {
          success: false,
          error: 'No spacing/sizing tokens found in the system',
        };
      }

      // Extract numeric values
      const values = spacingTokens
        .map(token => {
          const node = this.graph.getNode(token);
          const value = this.extractNumericValue(node?.value);
          return value ? { token, value } : null;
        })
        .filter(Boolean) as Array<{ token: string; value: number }>;

      if (values.length === 0) {
        return {
          success: false,
          error: 'No numeric spacing values found',
        };
      }

      // Detect or use provided base unit
      let detectedBase = params.expectedBase || this.detectBaseUnit(values.map(v => v.value));

      if (!detectedBase) {
        return {
          success: false,
          error: 'Could not detect a consistent base unit',
        };
      }

      // Analyze adherence to base unit
      const analyzed = values.map(item => {
        const expectedValue = Math.round(item.value / detectedBase!) * detectedBase!;
        const deviation = Math.abs(item.value - expectedValue);
        const isOnGrid = deviation <= 1; // 1px tolerance

        return {
          token: item.token,
          value: item.value,
          expectedValue,
          deviation,
          isOnGrid,
        };
      });

      // Calculate adherence score
      const onGridCount = analyzed.filter(a => a.isOnGrid).length;
      const adherenceScore = Math.round((onGridCount / analyzed.length) * 100);

      // Find gaps in the progression
      const sortedValues = [...new Set(values.map(v => v.value))].sort((a, b) => a - b);
      const gaps: Array<{ value: number; suggestedToken: string; reasoning: string }> = [];

      const maxValue = Math.max(...sortedValues);
      for (let expected = detectedBase!; expected <= maxValue; expected += detectedBase!) {
        if (!sortedValues.some(v => Math.abs(v - expected) <= 2)) {
          gaps.push({
            value: expected,
            suggestedToken: this.suggestSpacingTokenName(expected, detectedBase!),
            reasoning: `${expected}px is a missing step in the ${detectedBase}px grid`,
          });
        }
      }

      // Recommendations
      const recommendations: string[] = [];
      
      if (adherenceScore >= 90) {
        recommendations.push('✅ Excellent grid adherence - spacing follows a consistent scale');
      } else if (adherenceScore >= 70) {
        recommendations.push('⚠️ Good adherence, but some values are off-grid');
      } else {
        recommendations.push('❌ Poor grid adherence - consider standardizing to a consistent base unit');
      }

      const offGridCount = analyzed.filter(a => !a.isOnGrid).length;
      if (offGridCount > 0) {
        recommendations.push(`Adjust ${offGridCount} off-grid value(s) to nearest ${detectedBase}px multiple`);
      }

      if (gaps.length > 0 && gaps.length <= 5) {
        recommendations.push(`Consider adding ${gaps.length} missing value(s) to complete the progression`);
      }

      const result: SpacingScaleAnalysisResult = {
        detectedBase,
        adherenceScore,
        values: analyzed,
        gaps: gaps.slice(0, 10), // Limit to 10 suggestions
        recommendations,
        scaleVisualization: {
          baseUnit: detectedBase!,
          range: { min: Math.min(...sortedValues), max: Math.max(...sortedValues) },
          onGrid: onGridCount,
          offGrid: offGridCount,
        },
      };

      return {
        success: true,
        result,
        visualFeedback: {
          type: 'spacingScaleAnalysis',
          data: result,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze spacing scale: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check for inconsistencies in spacing values
   */
  async checkSpacingConsistency(params: {
    tolerance?: number;
    minDistance?: number;
  }): Promise<ToolResponse> {
    try {
      const tolerance = params.tolerance || 1;
      const minDistance = params.minDistance || 4;

      const spacingTokens = this.getSpacingSizeTokens('all');
      
      if (spacingTokens.length === 0) {
        return {
          success: false,
          error: 'No spacing/sizing tokens found in the system',
        };
      }

      // Extract values
      const values = spacingTokens
        .map(token => {
          const node = this.graph.getNode(token);
          const value = this.extractNumericValue(node?.value);
          return value ? { token, value } : null;
        })
        .filter(Boolean) as Array<{ token: string; value: number }>;

      // Detect base unit
      const detectedBase = this.detectBaseUnit(values.map(v => v.value)) || 8;

      // Find off-grid values
      const offGridValues = values
        .map(item => {
          const nearestGrid = Math.round(item.value / detectedBase) * detectedBase;
          const deviation = Math.abs(item.value - nearestGrid);
          
          if (deviation > tolerance) {
            return {
              token: item.token,
              value: item.value,
              nearestGrid,
              deviation,
              severity: (deviation > tolerance * 3 ? 'high' : deviation > tolerance * 1.5 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
            };
          }
          return null;
        })
        .filter(Boolean) as SpacingConsistencyResult['offGridValues'];

      // Find redundant values (too close together)
      const redundantValues: SpacingConsistencyResult['redundantValues'] = [];
      const sortedValues = [...values].sort((a, b) => a.value - b.value);

      for (let i = 0; i < sortedValues.length - 1; i++) {
        const distance = sortedValues[i + 1].value - sortedValues[i].value;
        if (distance < minDistance && distance > 0) {
          redundantValues.push({
            tokens: [sortedValues[i + 1].token],
            value: sortedValues[i + 1].value,
            tooCloseTo: sortedValues[i].token,
            distance,
          });
        }
      }

      // Find pattern breaks
      const patternBreaks: SpacingConsistencyResult['patternBreaks'] = [];
      
      // Check for linear progression breaks
      for (let i = 1; i < sortedValues.length - 1; i++) {
        const prev = sortedValues[i - 1].value;
        const curr = sortedValues[i].value;
        const next = sortedValues[i + 1].value;
        
        const step1 = curr - prev;
        const step2 = next - curr;
        
        // If steps are very different, it might be a pattern break
        if (Math.abs(step2 - step1) > detectedBase && step1 > 0 && step2 > 0) {
          patternBreaks.push({
            token: sortedValues[i].token,
            value: curr,
            expectedPattern: `Linear progression with ~${step1}px steps`,
            issue: `Next step is ${step2}px instead of ${step1}px`,
          });
        }
      }

      const summary = {
        onGrid: values.length - offGridValues.length,
        offGrid: offGridValues.length,
        redundant: redundantValues.length,
        total: values.length,
      };

      const overallScore = Math.round(
        ((summary.onGrid * 100 + (summary.total - summary.redundant - summary.offGrid) * 50) / (summary.total * 100)) * 100
      );

      const recommendations: string[] = [];
      
      if (offGridValues.length === 0 && redundantValues.length === 0) {
        recommendations.push('✅ All spacing values are consistent and on-grid');
      } else {
        if (offGridValues.length > 0) {
          recommendations.push(`Align ${offGridValues.length} off-grid value(s) to ${detectedBase}px grid`);
        }
        if (redundantValues.length > 0) {
          recommendations.push(`Consolidate ${redundantValues.length} redundant value(s) that are too close together`);
        }
        if (patternBreaks.length > 0) {
          recommendations.push(`Review ${patternBreaks.length} pattern break(s) in progression`);
        }
      }

      const result: SpacingConsistencyResult = {
        overallScore,
        offGridValues,
        redundantValues,
        patternBreaks,
        summary,
        recommendations,
      };

      return {
        success: true,
        result,
        visualFeedback: {
          type: 'spacingConsistency',
          data: result,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check spacing consistency: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Suggest missing spacing tokens
   */
  async suggestSpacingTokens(params: {
    baseUnit?: number;
    range?: { min: number; max: number };
  }): Promise<ToolResponse> {
    try {
      const spacingTokens = this.getSpacingSizeTokens('all');
      
      // Extract existing values
      const existingTokens = spacingTokens
        .map(token => {
          const node = this.graph.getNode(token);
          const value = this.extractNumericValue(node?.value);
          return value ? { token, value } : null;
        })
        .filter(Boolean) as Array<{ token: string; value: number }>;

      const existingValues = new Set(existingTokens.map(t => t.value));

      // Detect base unit
      const detectedBase = params.baseUnit || this.detectBaseUnit(Array.from(existingValues)) || 8;
      
      // Determine range
      const range = params.range || { min: 0, max: 128 };

      // Generate suggestions
      const suggestions: SpacingTokenSuggestionsResult['suggestions'] = [];

      for (let value = range.min; value <= range.max; value += detectedBase) {
        if (value === 0 || existingValues.has(value)) continue;

        // Check if this would be useful
        const hasNearby = Array.from(existingValues).some(v => Math.abs(v - value) <= detectedBase);
        
        const priority = this.calculateSpacingPriority(value, existingValues);
        const useCase = this.getSpacingUseCase(value);

        if (priority !== 'low' || suggestions.length < 10) {
          suggestions.push({
            value,
            suggestedToken: this.suggestSpacingTokenName(value, detectedBase),
            reasoning: hasNearby
              ? `Fills gap between existing values`
              : `Standard ${detectedBase}px grid value`,
            priority,
            useCase,
          });
        }
      }

      // Analyze coverage
      const coverage = {
        micro: existingTokens.filter(t => t.value > 0 && t.value <= 8).length,
        small: existingTokens.filter(t => t.value > 8 && t.value <= 16).length,
        medium: existingTokens.filter(t => t.value > 16 && t.value <= 32).length,
        large: existingTokens.filter(t => t.value > 32 && t.value <= 64).length,
        xlarge: existingTokens.filter(t => t.value > 64).length,
      };

      const recommendations: string[] = [];
      
      if (suggestions.length === 0) {
        recommendations.push('✅ Spacing scale is complete for the current range');
      } else {
        const highPriority = suggestions.filter(s => s.priority === 'high').length;
        if (highPriority > 0) {
          recommendations.push(`Add ${highPriority} high-priority spacing value(s) to fill critical gaps`);
        }
        
        if (coverage.micro === 0) {
          recommendations.push('Consider adding micro spacing values (1-8px) for tight layouts');
        }
        if (coverage.xlarge === 0) {
          recommendations.push('Consider adding larger spacing values (64px+) for section margins');
        }
      }

      const result: SpacingTokenSuggestionsResult = {
        detectedBase,
        currentRange: {
          min: existingTokens.length > 0 ? Math.min(...existingTokens.map(t => t.value)) : 0,
          max: existingTokens.length > 0 ? Math.max(...existingTokens.map(t => t.value)) : 0,
        },
        suggestions: suggestions.slice(0, 15), // Limit to 15 suggestions
        existingTokens,
        coverage,
        recommendations,
      };

      return {
        success: true,
        result,
        visualFeedback: {
          type: 'spacingTokenSuggestions',
          data: result,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to suggest spacing tokens: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Validate size harmony (for width, height, etc.)
   */
  async validateSizeHarmony(params: {
    sizeType?: 'all' | 'width' | 'height' | 'max-width' | 'min-width';
  }): Promise<ToolResponse> {
    try {
      const sizeTokens = this.getSizeTokens(params.sizeType || 'all');
      
      if (sizeTokens.length === 0) {
        return {
          success: false,
          error: 'No size tokens found in the system',
        };
      }

      // Extract values
      const sizes = sizeTokens
        .map(token => {
          const node = this.graph.getNode(token);
          const value = this.extractNumericValue(node?.value);
          const category = this.inferSizeCategory(token);
          return value ? { token, value, category } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a!.value - b!.value) as Array<{ token: string; value: number; category: SizeHarmonyResult['sizes'][0]['category'] }>;

      if (sizes.length < 2) {
        return {
          success: false,
          error: 'Need at least 2 size tokens to analyze harmony',
        };
      }

      // Calculate ratios
      const analyzed = sizes.map((size, idx) => {
        const nextValue = idx < sizes.length - 1 ? sizes[idx + 1].value : null;
        const ratio = nextValue ? nextValue / size.value : null;
        
        return {
          token: size.token,
          value: size.value,
          category: size.category,
          ratio,
          isHarmonic: false, // Will be calculated
        };
      });

      // Detect if there's a consistent ratio
      const ratios = analyzed.map(a => a.ratio).filter(Boolean) as number[];
      const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
      
      // Check variance
      const variance = ratios.reduce((sum, r) => sum + Math.pow(r - avgRatio, 2), 0) / ratios.length;
      const stdDev = Math.sqrt(variance);
      
      const hasHarmonicProgression = stdDev < 0.1; // Low variance = harmonic
      
      // Mark harmonic sizes
      if (hasHarmonicProgression) {
        analyzed.forEach(a => {
          if (a.ratio && Math.abs(a.ratio - avgRatio) < 0.1) {
            a.isHarmonic = true;
          }
        });
      }

      // Find outliers
      const outliers: SizeHarmonyResult['outliers'] = [];
      
      analyzed.forEach(size => {
        if (size.ratio && Math.abs(size.ratio - avgRatio) > 0.2) {
          outliers.push({
            token: size.token,
            value: size.value,
            issue: `Ratio ${size.ratio.toFixed(2)} deviates from average ${avgRatio.toFixed(2)}`,
            suggestion: `Consider adjusting to ${Math.round(size.value * avgRatio)}px for consistency`,
          });
        }
      });

      const harmonicCount = analyzed.filter(a => a.isHarmonic).length;
      const ratioConsistency = Math.round((harmonicCount / analyzed.length) * 100);
      const adherenceScore = hasHarmonicProgression ? Math.round((1 - stdDev) * 100) : 0;

      const recommendations: string[] = [];
      
      if (hasHarmonicProgression && outliers.length === 0) {
        recommendations.push('✅ Sizes follow a harmonic progression');
      } else if (hasHarmonicProgression) {
        recommendations.push('⚠️ Mostly harmonic, but some outliers exist');
      } else {
        recommendations.push('❌ No clear harmonic progression detected');
        recommendations.push('Consider using a consistent ratio (e.g., 1.5x, 2x) between sizes');
      }

      if (outliers.length > 0) {
        recommendations.push(`Review ${outliers.length} outlier(s) that break the progression`);
      }

      const result: SizeHarmonyResult = {
        ratioConsistency,
        sizes: analyzed,
        outliers,
        harmonicProgression: {
          detected: hasHarmonicProgression,
          ratio: hasHarmonicProgression ? avgRatio : null,
          adherenceScore,
        },
        recommendations,
      };

      return {
        success: true,
        result,
        visualFeedback: {
          type: 'sizeHarmony',
          data: result,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate size harmony: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  // === Helper Methods ===

  private getSpacingSizeTokens(scope: string): string[] {
    const allNodes = this.graph.getAllNodes();
    return allNodes
      .filter(node => {
        const path = node.path.toLowerCase();
        
        // Match spacing/sizing tokens
        const isSpacingSizing = 
          path.includes('spacing') || 
          path.includes('space') || 
          path.includes('gap') || 
          path.includes('margin') || 
          path.includes('padding') ||
          path.includes('size') ||
          path.includes('width') ||
          path.includes('height');

        if (!isSpacingSizing) return false;

        // Filter by scope
        if (scope === 'spacing' && !path.includes('spacing') && !path.includes('space') && !path.includes('gap')) {
          return false;
        }
        if (scope === 'sizing' && !path.includes('size') && !path.includes('width') && !path.includes('height')) {
          return false;
        }
        if (scope === 'primitives' && path.includes('utilities')) {
          return false;
        }
        if (scope === 'utilities' && !path.includes('utilities')) {
          return false;
        }

        return true;
      })
      .map(node => node.path);
  }

  private getSizeTokens(sizeType: string): string[] {
    const allNodes = this.graph.getAllNodes();
    return allNodes
      .filter(node => {
        const path = node.path.toLowerCase();
        
        if (sizeType === 'all') {
          return path.includes('width') || path.includes('height') || path.includes('size');
        }
        
        return path.includes(sizeType.toLowerCase());
      })
      .map(node => node.path);
  }

  private extractNumericValue(value: any): number | null {
    if (!value) return null;

    // Handle string formats
    if (typeof value === 'string') {
      const match = value.match(/(\d+(?:\.\d+)?)(px|rem|em)?/);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2];
        // Convert rem/em to px (assuming 16px base)
        return unit === 'rem' || unit === 'em' ? num * 16 : num;
      }
    }

    // Handle number directly
    if (typeof value === 'number') {
      return value;
    }

    // Handle object format { value: "16px" }
    if (typeof value === 'object' && value.value) {
      return this.extractNumericValue(value.value);
    }

    return null;
  }

  private detectBaseUnit(values: number[]): number | null {
    // Try common base units
    for (const base of COMMON_BASE_UNITS) {
      const onGrid = values.filter(v => v % base === 0 || Math.abs(v % base) <= 1).length;
      const adherence = onGrid / values.length;
      
      if (adherence >= 0.7) {
        return base;
      }
    }

    // Try GCD approach
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const commonDivisor = values.reduce((a, b) => gcd(Math.round(a), Math.round(b)));
    
    if (commonDivisor >= 2 && commonDivisor <= 16) {
      return commonDivisor;
    }

    return null;
  }

  private suggestSpacingTokenName(value: number, base: number): string {
    // Generate semantic name based on value
    const step = Math.round(value / base);
    
    if (value <= 8) return `spacing.xs${value === base ? '' : `-${step}`}`;
    if (value <= 16) return `spacing.sm${value === 16 ? '' : `-${step}`}`;
    if (value <= 32) return `spacing.md${value === 24 ? '' : `-${step}`}`;
    if (value <= 64) return `spacing.lg${value === 48 ? '' : `-${step}`}`;
    return `spacing.xl${value === 96 ? '' : `-${step}`}`;
  }

  private calculateSpacingPriority(value: number, existingValues: Set<number>): 'high' | 'medium' | 'low' {
    // Common critical values
    const critical = [4, 8, 12, 16, 24, 32, 48, 64];
    if (critical.includes(value)) {
      return 'high';
    }

    // Check if it fills a large gap
    const sorted = Array.from(existingValues).sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (value > sorted[i] && value < sorted[i + 1]) {
        const gap = sorted[i + 1] - sorted[i];
        if (gap > 16) return 'high';
        if (gap > 8) return 'medium';
      }
    }

    return 'low';
  }

  private getSpacingUseCase(value: number): string {
    if (value <= 4) return 'Micro spacing for tight layouts (borders, dividers)';
    if (value <= 8) return 'Small spacing for compact components';
    if (value <= 16) return 'Standard spacing for component padding';
    if (value <= 32) return 'Medium spacing for component margins';
    if (value <= 64) return 'Large spacing for section separation';
    return 'Extra large spacing for page-level margins';
  }

  private inferSizeCategory(tokenPath: string): 'width' | 'height' | 'max-width' | 'min-width' | 'other' {
    const lower = tokenPath.toLowerCase();
    
    if (lower.includes('max-width') || lower.includes('maxwidth')) return 'max-width';
    if (lower.includes('min-width') || lower.includes('minwidth')) return 'min-width';
    if (lower.includes('width')) return 'width';
    if (lower.includes('height')) return 'height';
    
    return 'other';
  }
}

