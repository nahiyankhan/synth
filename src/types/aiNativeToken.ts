/**
 * AI-Native Design Token Structure
 *
 * Relationship-first, semantic-explicit, graph-native design tokens.
 * No path hierarchies - only meaningful relationships and constraints.
 */

// Re-export relationship types from the canonical location
export { RelationshipType, TokenRelationship } from './styleGraph';

/**
 * Relationship strength (for weighted graphs)
 */
export type RelationshipStrength = number; // 0.0 to 1.0

/**
 * Brand principle or quality
 */
export interface BrandPrinciple {
  id: string;
  name: string;
  description: string;
  qualities: string[]; // "trustworthy", "energetic", "minimal"
}

/**
 * Design constraint or rule
 */
export interface DesignConstraint {
  id: string;
  name: string;
  type: 'accessibility' | 'brand' | 'technical' | 'ux';
  rule: string;
  required: boolean;
  testable: boolean;
}

/**
 * Usage context
 */
export interface UsageContext {
  id: string;
  name: string;
  description: string;
  tags: string[]; // "primary-action", "error-state", "high-emphasis"
}

/**
 * AI-Native Design Token
 */
export interface AIToken {
  // Identity
  id: string; // Unique, stable ID
  label: string; // Human-readable name (e.g., "Brand Blue", "Heading XL")
  
  // Value
  value: any; // The actual value (color, size, font, etc.)
  type: 'color' | 'typography' | 'size' | 'spacing' | 'shadow' | 'radius' | 'other';
  
  // Relationships (THE CORE)
  relationships: TokenRelationship[];
  
  // Context & Intent
  context: {
    createdFor?: string; // What problem does this solve?
    brandIntent?: string; // What brand message does this convey?
    usageNotes?: string; // When/how to use this
    accessibility?: {
      wcagLevel?: 'A' | 'AA' | 'AAA';
      contrastRatio?: number;
      readableOn?: string[]; // IDs of tokens this is readable on
    };
  };
  
  // Metadata
  metadata: {
    layer?: 'seed' | 'base' | 'semantic' | 'component'; // Still useful for visualization
    deprecated?: boolean;
    deprecationReason?: string;
    replacedBy?: string; // ID of replacement token
    createdAt: string;
    modifiedAt: string;
    modifiedBy?: 'human' | 'ai' | 'system';
    version: number;
    tags?: string[];
  };
  
  // Type-specific data
  colorScience?: {
    oklch: { l: number; c: number; h: number };
    p3?: string; // Display P3 color space
    contrastWith?: Record<string, number>; // Precomputed contrast ratios
  };
  
  typography?: {
    family: string;
    size: number;
    weight: number;
    lineHeight: number;
    letterSpacing?: number;
    scale?: string; // Type scale category
  };
}

/**
 * Graph query result
 */
export interface TokenGraphQuery {
  token: AIToken;
  relationships: {
    outgoing: TokenRelationship[];
    incoming: TokenRelationship[];
  };
  impact: {
    directDependents: string[]; // IDs
    transitiveDependents: string[]; // IDs
    affectedComponents: string[];
    affectedPrinciples: string[];
  };
}

/**
 * Relationship query
 */
export interface RelationshipQuery {
  fromToken?: string; // ID
  toToken?: string; // ID
  relationshipType?: RelationshipType | RelationshipType[];
  minStrength?: number;
  maxStrength?: number;
  tags?: string[];
}

/**
 * Graph analytics
 */
export interface GraphAnalytics {
  // Centrality
  mostUsed: Array<{ tokenId: string; usageCount: number }>;
  mostImpactful: Array<{ tokenId: string; impactScore: number }>;
  
  // Violations
  violations: Array<{
    tokenId: string;
    constraintId: string;
    acknowledged: boolean;
    severity: 'low' | 'medium' | 'high';
  }>;
  
  // Brand alignment
  brandAlignment: Array<{
    principleId: string;
    tokensExpressing: number;
    averageStrength: number;
  }>;
  
  // Orphans
  orphanedTokens: string[]; // No relationships
  deadEnds: string[]; // Nothing depends on them
}

/**
 * Migration helper (temporary)
 */
export interface LegacyTokenMapping {
  oldPath: string; // e.g., "base.color.primary"
  newId: string;
  newLabel: string;
}

