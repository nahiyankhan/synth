/**
 * StyleGraph Type System
 *
 * Design system treated as an AST/graph data structure where nodes
 * can reference other nodes, creating dependency chains.
 */

// Core primitive types
export type StyleValue = string | number;
export type StyleReference = string; // e.g., '{nodeId123}' - reference by node ID

// Layer system: primitives → utilities → composites
export type StyleLayer = "primitive" | "utility" | "composite";

// Type categorization
export type StyleType = "color" | "typography" | "size" | "other";

// Mode support (light/dark themes, etc.)
export type StyleMode = "light" | "dark";

// Mode-specific values
export interface ModeMap<T> {
  light?: T;
  dark?: T;
  [mode: string]: T | undefined;
}

// Helper to check if a value is a reference
export function isReference(value: any): value is StyleReference {
  return (
    typeof value === "string" && value.startsWith("{") && value.endsWith("}")
  );
}

// Helper to check if value is mode-specific
export function isModeMap(value: any): value is ModeMap<any> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value.hasOwnProperty("light") || value.hasOwnProperty("dark"))
  );
}

/**
 * Token Relationship Types (AI-Native Model)
 */
export type RelationshipType =
  | 'DERIVES_FROM'    // This token derives from another
  | 'ALIASES'         // This is an alias for another token
  | 'OVERRIDES'       // Overrides another token in specific context
  | 'CONSTRAINS'      // Satisfies a constraint
  | 'EXPRESSES'       // Expresses a brand principle
  | 'VIOLATES'        // Violates a constraint
  | 'PREFERRED_FOR'   // Preferred for a usage context
  | 'DISALLOWED_IN'   // Disallowed in a context
  | 'REQUIRED_WITH'   // Must be used with another token
  | 'CONFLICTS_WITH'  // Conflicts with another token
  | 'REPLACES_IN'     // Replaces another token in context
  | 'USED_BY'         // Used by a component
  | 'IMPACTS'         // Impacts another token
  | 'DEPENDS_ON';     // Depends on another token

/**
 * Token Relationship (AI-Native Model)
 */
export interface TokenRelationship {
  type: RelationshipType;
  target: string; // ID of target entity (token, principle, context, constraint)
  reason?: string; // Why this relationship exists
  strength?: number; // For EXPRESSES: 0-1 strength
  when?: string[]; // For PREFERRED_FOR, DISALLOWED_IN: conditions
  metadata?: Record<string, any>; // Additional data (passes, ratio, etc.)
  acknowledged?: boolean; // For VIOLATES: is this violation acknowledged?
  since?: string; // For OVERRIDES: when did this override start?
  scope?: string; // For ALIASES: scope of the alias
}

/**
 * StyleNode - A node in the design system graph
 */
export interface StyleNode {
  // Identity
  id: string; // Unique identifier (short ID like nanoid)
  name: string; // Human-readable name: 'Grey 65', 'Primary Button'

  // NEW: Human-authored intent (all fields optional for MVP)
  intent?: {
    purpose?: string; // "Primary action color"
    designedFor?: string[]; // ["buttons", "CTAs"]
    constraints?: string[]; // ["high emphasis only"]
    qualities?: string[]; // ["trustworthy", "energetic"]
    rationale?: string; // "Chosen for brand alignment"
  };

  // Classification
  layer?: StyleLayer; // NOW OPTIONAL: Will be computed from graph structure
  type: StyleType;

  // Value - can be:
  // - Primitive value: '#FF0000', 16, 400
  // - Reference by ID: '{abc123xyz}'
  // - Mode-specific primitive: { light: '#000', dark: '#FFF' }
  // - Mode-specific reference: { light: '{id1}', dark: '{id2}' }
  value:
    | StyleValue
    | StyleReference
    | ModeMap<StyleValue>
    | ModeMap<StyleReference>;

  // Graph structure (computed)
  dependencies: Set<string>; // Node IDs this depends on
  dependents: Set<string>; // Node IDs that depend on this

  // NEW: AI-Native Relationships (Phase 3)
  relationships?: TokenRelationship[]; // Semantic relationships

  // NEW: Agent-observed tracking
  tracking?: {
    actualUsage?: Array<{
      file: string;
      line: number;
      component: string;
    }>;
    createdAt: number;
    lastModified: number;
    modificationCount: number;
  };

  // Metadata
  metadata?: {
    description?: string;
    deprecated?: boolean;
    tags?: string[];
    compositeFor?: string; // e.g., 'button', 'input' (for composite layer)
    isSpec?: boolean; // True for composite layer - these are design specs, not core tokens
    createdFrom?: "voice" | "manual" | "import" | "rules-based-expansion" | "tailwind-color-system";
    isSeed?: boolean; // True if this is a seed color (for color generation)
    // Canvas positioning (for manual layout mode)
    canvasX?: number;
    canvasY?: number;
    // Color science data (for color tokens)
    colorScience?: {
      oklch: { l: number; c: number; h: number }; // OKLCH color space values
      computed?: boolean; // true if auto-computed from hex
    };
    // Entity type (for brand principles, contexts, constraints)
    entityType?: 'brand-principle' | 'usage-context' | 'constraint';
    constraintType?: 'accessibility' | 'brand' | 'technical' | 'ux';
    severity?: 'critical' | 'high' | 'medium' | 'low';
    conditions?: string[];
    examples?: string[];
  };
}

/**
 * Change tracking for version history
 */
export interface StyleChange {
  timestamp: number;
  version: number;
  type: "create" | "update" | "delete";
  nodeId: string;
  before: StyleNode | null;
  after: StyleNode | null;
  description?: string;
}

/**
 * Snapshot for efficient history
 */
export interface StyleSnapshot {
  version: number;
  timestamp: number;
  nodes: Map<string, StyleNode>;
  description?: string;
}

/**
 * History tracking
 */
export interface StyleHistory {
  snapshots: StyleSnapshot[]; // Full graph states
  changes: StyleChange[]; // Individual mutations
  currentVersion: number;
  snapshotInterval: number; // Create snapshot every N changes
}

/**
 * Validation error types
 */
export interface ValidationError {
  type:
    | "circular-dependency"
    | "broken-reference"
    | "invalid-value"
    | "type-mismatch";
  nodeId: string;
  message: string;
  path?: string[];
  affectedNodes?: string[];
}

/**
 * Impact analysis result
 */
export interface ImpactAnalysis {
  nodeId: string;
  directDependents: string[];
  allDependents: string[]; // Transitive closure
  affectedComposites: string[];
  affectedUtilities: string[];
}

/**
 * Graph statistics
 */
export interface GraphStats {
  totalNodes: number;
  byLayer: Record<StyleLayer, number>;
  byType: Record<StyleType, number>;
  referenceCount: number;
  primitiveCount: number;
  maxDepth: number;
  circularDependencies: string[][];
  specsCount: number; // Number of nodes marked as specs (composite layer)
  coreTokensCount: number; // Primitives + utilities (actual design system)
}

/**
 * Visitor pattern for graph traversal
 */
export interface StyleVisitor {
  visitNode?(node: StyleNode): void;
  visitPrimitive?(node: StyleNode): void;
  visitUtility?(node: StyleNode): void;
  visitComposite?(node: StyleNode): void;
  visitReference?(node: StyleNode, reference: StyleReference): void;
}

/**
 * Transform function for batch operations
 */
export type StyleTransformer = (node: StyleNode) => StyleNode | null;

/**
 * Main StyleGraph class interface
 */
export interface IStyleGraph {
  // Graph state
  nodes: Map<string, StyleNode>;
  history: StyleHistory;

  // Loading
  loadFromYAML(designTokensPath: string): Promise<void>;

  // Resolution
  resolveNode(nodeId: string, mode?: StyleMode): StyleValue | null;

  // Graph queries
  getNode(id: string): StyleNode | undefined;
  getDependencies(nodeId: string): StyleNode[];
  getDependents(nodeId: string): StyleNode[];
  getImpactAnalysis(nodeId: string): ImpactAnalysis;

  // Traversal
  traverse(visitor: StyleVisitor): void;
  transform(transformer: StyleTransformer): void;

  // Mutations
  createNode(node: Omit<StyleNode, "dependencies" | "dependents">): StyleChange;
  updateNode(nodeId: string, updates: Partial<StyleNode>): StyleChange;
  deleteNode(nodeId: string): StyleChange;

  // History
  undo(): boolean;
  redo(): boolean;
  revertToVersion(version: number): boolean;
  getHistory(): StyleChange[];

  // Validation
  validateGraph(): ValidationError[];
  validateNode(nodeId: string): ValidationError[];
  findCircularDependencies(): string[][];

  // Statistics
  getStats(): GraphStats;

  // Export
  exportToJSON(): string;
  exportToYAML(): string;
}
