/**
 * Visual Feedback Types for AI Partnership UX
 * Supports multi-option proposals, before/after comparisons, and animated transitions
 */

import { OKLCHColor } from '@/services/colorScience';

/**
 * Color-specific types
 */
export interface ColorValue {
  hex: string;
  oklch: OKLCHColor;
}

export interface ColorChangePreview {
  token: string;
  before: ColorValue;
  after: ColorValue;
  affectedCount: number; // How many tokens depend on this
  componentTypes?: string[]; // e.g., ['button', 'card', 'text']
}

/**
 * Multi-Option Proposal - AI presents multiple choices
 */
export interface OptionProposal<T = any> {
  type: 'color' | 'typography' | 'spacing';
  question: string; // e.g., "How much lighter should we make the blues?"
  
  options: Array<{
    id: string;
    name: string; // e.g., "Conservative", "Moderate", "Bold"
    description: string;
    confidence: number; // 0-100
    reasoning: string; // AI's explanation
    
    // Type-specific preview data
    preview: T;
    
    // Impact metrics
    changesCount: number;
    affectedTokensCount: number;
    estimatedImpact: 'low' | 'medium' | 'high';
  }>;
  
  recommendedOptionId: string;
  allowCustom: boolean;
  customizationHint?: string;
}

/**
 * Color Option Proposal - Specific to color tools
 */
export interface ColorOptionProposal extends OptionProposal<ColorChangePreview[]> {
  type: 'color';
  
  // Additional color-specific data
  affectedHues?: string[]; // e.g., ['blue', 'cyan']
  preservesHarmony?: boolean;
  accessibilityImpact?: 'positive' | 'neutral' | 'negative';
}

/**
 * Similarity Analysis Result
 */
export interface SimilarColor {
  path: string;
  value: string;
  distance: number; // Perceptual distance
  oklch: OKLCHColor;
  recommendation: 'consolidate' | 'keep' | 'review';
}

export interface SimilarityResult {
  targetColor: {
    path: string;
    value: string;
    oklch: OKLCHColor;
  };
  similarColors: SimilarColor[];
  consolidationOpportunity: boolean;
  
  // Groupings for visual display
  groups?: Array<{
    representative: SimilarColor;
    similar: SimilarColor[];
    suggestion: string;
  }>;
}

/**
 * Lightness Scale Check Result
 */
export interface LightnessScaleResult {
  hueFamily: string;
  colors: Array<{
    path: string;
    lightness: number;
    value: string;
    oklch: OKLCHColor;
  }>;
  gaps: Array<{
    missingLightness: number;
    suggestedName: string;
    suggestedValue: string; // Hex color
  }>;
  scaleType: 'complete' | 'partial' | 'irregular';
  recommendation: string;
  
  // Visualization data
  lightnessRange: [number, number]; // Min/max lightness
  idealScale?: number[]; // Ideal lightness values (e.g., [10, 20, 30, ...])
}

/**
 * Color Scale Generation Result - Multi-option
 */
export interface ColorScaleOption {
  id: string;
  name: string; // "Linear Lightness", "Perceptual Even", etc.
  description: string;
  confidence: number;
  reasoning: string;
  
  scale: Array<{
    level: number; // 100, 200, 300, ..., 900
    hex: string;
    oklch: OKLCHColor;
    suggestedName: string;
  }>;
  
  usageNotes: string;
  
  // Preview data
  previewOnComponents?: Array<{
    componentType: string;
    rendered: string; // Could be SVG or component identifier
  }>;
}

export interface ColorScaleProposal {
  baseColor: {
    path: string;
    value: string;
    oklch: OKLCHColor;
  };
  baseLevel: number;
  
  options: ColorScaleOption[];
  recommendedOptionId: string;
  
  // Comparison data
  comparisonMetrics?: {
    lightnessProgression: string; // "Linear", "Exponential", etc.
    chromaVariation: string;
    perceivedContrast: number;
  };
}

/**
 * Contrast Check Result
 */
export interface ContrastCheckResult {
  contrastRatio: number;
  wcagAA: { normalText: boolean; largeText: boolean };
  wcagAAA: { normalText: boolean; largeText: boolean };
  recommendation: string;
  preview?: {
    normalText: string; // Rendered sample
    largeText: string;  // Rendered sample
  };
}

/**
 * Hue Grouping Result
 */
export interface HueGroupingResult {
  hueGroups: Array<{
    hueName: string;
    hueRange: [number, number];
    colors: Array<{ path: string; value: string; oklch: OKLCHColor }>;
    count: number;
    averageLightness: number;
    averageChroma: number;
  }>;
  dominantHues: string[];
  underrepresentedHues: string[];
}

/**
 * Visual Feedback Configuration
 */
export interface VisualFeedbackConfig {
  type: 'info-panel' | 'comparison-grid' | 'multi-option-proposal' | 'before-after' | 'animated-transition';
  showInOverlay: boolean;
  
  components: string[]; // Component names to render
  
  // Interaction options
  allowSelection?: boolean;
  requiresConfirmation?: boolean;
  allowCustomization?: boolean;
  
  // Animation settings
  animationDuration?: number;
  autoPlay?: boolean;
}

/**
 * Typography-specific types
 */

export interface TypeScaleAnalysisResult {
  detectedRatio: number | null; // e.g., 1.333 (perfect fourth)
  ratioName: string | null; // e.g., "Perfect Fourth", "Golden Ratio"
  adherenceScore: number; // 0-100, how well does it follow the ratio
  
  sizes: Array<{
    token: string;
    size: number; // in px
    expectedSize: number | null; // what it should be for perfect adherence
    deviation: number; // percentage off from expected
  }>;
  
  gaps: Array<{
    between: [string, string]; // token paths
    expectedSize: number;
    suggestedToken: string; // e.g., "typography.h4"
  }>;
  
  recommendations: string[];
  
  // Visualization data
  scaleVisualization: {
    baseSize: number;
    ratio: number;
    steps: Array<{ level: number; size: number; hasToken: boolean }>;
  };
}

export interface ReadabilityAnalysisResult {
  overallScore: number; // 0-100
  
  tokens: Array<{
    token: string;
    fontSize: number;
    lineHeight: number;
    ratio: number; // line-height / font-size
    context: 'body' | 'heading' | 'display' | 'small';
    status: 'optimal' | 'acceptable' | 'warning' | 'poor';
    recommendation: string;
  }>;
  
  issues: Array<{
    token: string;
    problem: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  
  summary: {
    optimal: number; // count
    acceptable: number;
    needsImprovement: number;
  };
}

export interface TypeHierarchyResult {
  currentLevels: Array<{
    level: string; // e.g., "h1", "h2", "body"
    token: string;
    size: number;
  }>;
  
  missingLevels: Array<{
    level: string; // e.g., "h3", "h5"
    suggestedSize: number;
    suggestedToken: string; // e.g., "typography.h3"
    reasoning: string;
  }>;
  
  detectedScale: {
    baseSize: number;
    ratio: number;
    ratioName: string;
  };
  
  completenessScore: number; // 0-100
  recommendations: string[];
}

export interface LetterSpacingAnalysisResult {
  tokens: Array<{
    token: string;
    fontSize: number;
    currentTracking: number | null; // in em or px
    sizeCategory: 'display' | 'heading' | 'body' | 'small';
    status: 'optimal' | 'acceptable' | 'needs-adjustment';
    recommendedTracking: number; // suggested value
    reasoning: string;
  }>;
  
  summary: {
    needsNegativeTracking: number; // large sizes
    needsPositiveTracking: number; // small sizes
    optimal: number;
  };
  
  recommendations: string[];
}

/**
 * Spacing/Size-specific types
 */

export interface SpacingScaleAnalysisResult {
  detectedBase: number | null; // e.g., 4, 8
  adherenceScore: number; // 0-100
  
  values: Array<{
    token: string;
    value: number; // in px
    expectedValue: number | null; // closest multiple of base
    deviation: number; // how far off from grid
    isOnGrid: boolean;
  }>;
  
  gaps: Array<{
    value: number; // missing value
    suggestedToken: string;
    reasoning: string;
  }>;
  
  recommendations: string[];
  
  // Visualization data
  scaleVisualization: {
    baseUnit: number;
    range: { min: number; max: number };
    onGrid: number;
    offGrid: number;
  };
}

export interface SpacingConsistencyResult {
  overallScore: number; // 0-100
  
  offGridValues: Array<{
    token: string;
    value: number;
    nearestGrid: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  
  redundantValues: Array<{
    tokens: string[];
    value: number;
    tooCloseTo: string; // another token
    distance: number; // px
  }>;
  
  patternBreaks: Array<{
    token: string;
    value: number;
    expectedPattern: string;
    issue: string;
  }>;
  
  summary: {
    onGrid: number;
    offGrid: number;
    redundant: number;
    total: number;
  };
  
  recommendations: string[];
}

export interface SpacingTokenSuggestionsResult {
  detectedBase: number;
  currentRange: { min: number; max: number };
  
  suggestions: Array<{
    value: number;
    suggestedToken: string;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
    useCase: string; // e.g., "Micro spacing for tight layouts"
  }>;
  
  existingTokens: Array<{
    token: string;
    value: number;
  }>;
  
  coverage: {
    micro: number; // 0-8px
    small: number; // 8-16px
    medium: number; // 16-32px
    large: number; // 32-64px
    xlarge: number; // 64px+
  };
  
  recommendations: string[];
}

export interface SizeHarmonyResult {
  ratioConsistency: number; // 0-100
  
  sizes: Array<{
    token: string;
    value: number;
    category: 'width' | 'height' | 'max-width' | 'min-width' | 'other';
    ratio: number | null; // ratio to next size
    isHarmonic: boolean;
  }>;
  
  outliers: Array<{
    token: string;
    value: number;
    issue: string;
    suggestion: string;
  }>;
  
  harmonicProgression: {
    detected: boolean;
    ratio: number | null;
    adherenceScore: number;
  };
  
  recommendations: string[];
}
