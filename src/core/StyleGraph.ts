/**
 * StyleGraph - Core graph data structure for design system
 *
 * Manages design tokens as a directed acyclic graph (DAG) with
 * dependency tracking, reference resolution, and version history.
 */

import { nanoid } from "nanoid";
import {
  StyleNode,
  StyleLayer,
  StyleType,
  StyleMode,
  StyleValue,
  StyleReference,
  StyleChange,
  StyleSnapshot,
  StyleHistory,
  ValidationError,
  ImpactAnalysis,
  GraphStats,
  StyleVisitor,
  StyleTransformer,
  IStyleGraph,
  isReference,
  isModeMap,
  ModeMap,
} from "@/types/styleGraph";
import {
  loadDesignSystem,
  buildDependencyGraph,
  extractReferences,
} from "@/services/tokenParser";
import { computeLayer } from "@/utils/layerComputation";

export class StyleGraph implements IStyleGraph {
  nodes: Map<string, StyleNode>;
  history: StyleHistory;

  private redoStack: StyleChange[];

  constructor() {
    this.nodes = new Map();
    this.redoStack = [];
    this.history = {
      snapshots: [],
      changes: [],
      currentVersion: 0,
      snapshotInterval: 20,
    };
  }

  /**
   * Load design system from YAML files
   */
  async loadFromYAML(designTokensPath: string): Promise<void> {
    const nodes = await loadDesignSystem(designTokensPath);

    // Populate graph (nodes already have ID-based references)
    for (const node of nodes) {
      this.nodes.set(node.id, node);
    }

    // Build dependency edges
    buildDependencyGraph(Array.from(this.nodes.values()));

    // Create initial snapshot
    this.createSnapshot("Initial load from YAML");
  }

  /**
   * Load design system from static JSON export
   * (Used in browser - faster and doesn't require filesystem access)
   */
  async loadFromStatic(): Promise<void> {
    const { loadStaticDesignSystem, hydrateNode } = await import(
      "../services/staticLoader"
    );
    const exportedData = await loadStaticDesignSystem();

    // Populate graph from exported nodes (handle empty/missing data)
    if (!exportedData.nodes || !Array.isArray(exportedData.nodes)) {
      console.warn("No nodes found in static design system");
      return;
    }

    for (const exportedNode of exportedData.nodes) {
      const node = hydrateNode(exportedNode);
      this.nodes.set(node.id, node);
    }

    // Create initial snapshot
    this.createSnapshot(
      `Loaded from static export (${exportedData.metadata.exportedAt})`
    );
  }

  /**
   * Resolve a node by ID to its primitive value
   */
  resolveNode(nodeId: string, mode: StyleMode = "light"): StyleValue | null {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    // Track visited nodes to detect circular references
    const visited = new Set<string>();
    return this.resolveValue(node.value, mode, visited);
  }

  private resolveValue(
    value: any,
    mode: StyleMode,
    visited: Set<string>
  ): StyleValue | null {
    // Handle mode-specific values
    if (isModeMap(value)) {
      const modeValue = value[mode];
      if (modeValue === undefined) {
        // Fallback to light mode if requested mode doesn't exist
        return this.resolveValue(value.light, mode, visited);
      }
      return this.resolveValue(modeValue, mode, visited);
    }

    // Handle references (ID-based)
    if (isReference(value)) {
      const targetId = value.slice(1, -1); // Remove { and } to get node ID

      if (visited.has(targetId)) {
        console.warn(`Circular dependency detected: ${value}`);
        return null;
      }

      visited.add(targetId);
      const targetNode = this.nodes.get(targetId);

      if (!targetNode) {
        console.warn(`Broken reference: ${value} (node not found)`);
        return null;
      }

      return this.resolveValue(targetNode.value, mode, visited);
    }

    // Primitive value
    return value as StyleValue;
  }

  /**
   * Get node by ID
   */
  getNode(id: string): StyleNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes that this node depends on
   */
  getDependencies(nodeId: string): StyleNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    return Array.from(node.dependencies)
      .map((id) => this.nodes.get(id))
      .filter((n): n is StyleNode => n !== undefined);
  }

  /**
   * Get all nodes that depend on this node
   */
  getDependents(nodeId: string): StyleNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    return Array.from(node.dependents)
      .map((id) => this.nodes.get(id))
      .filter((n): n is StyleNode => n !== undefined);
  }

  /**
   * Get transitive closure of dependents (impact analysis)
   */
  getImpactAnalysis(nodeId: string): ImpactAnalysis {
    const directDependents = this.getDependents(nodeId);
    const allDependents = new Set<string>();
    const affectedComposites = new Set<string>();
    const affectedUtilities = new Set<string>();

    const queue = [...directDependents];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      allDependents.add(current.id);

      if (current.layer === "composite") {
        affectedComposites.add(current.id);
      } else if (current.layer === "utility") {
        affectedUtilities.add(current.id);
      }

      // Add transitive dependents
      const nextLevel = this.getDependents(current.id);
      queue.push(...nextLevel);
    }

    return {
      nodeId,
      directDependents: directDependents.map((n) => n.id),
      allDependents: Array.from(allDependents),
      affectedComposites: Array.from(affectedComposites),
      affectedUtilities: Array.from(affectedUtilities),
    };
  }

  /**
   * Traverse graph with visitor pattern
   */
  traverse(visitor: StyleVisitor): void {
    for (const node of this.nodes.values()) {
      visitor.visitNode?.(node);

      switch (node.layer) {
        case "primitive":
          visitor.visitPrimitive?.(node);
          break;
        case "utility":
          visitor.visitUtility?.(node);
          break;
        case "composite":
          visitor.visitComposite?.(node);
          break;
      }

      // Visit references
      const refs = extractReferences(node);
      for (const ref of refs) {
        visitor.visitReference?.(node, `{${ref}}`);
      }
    }
  }

  /**
   * Transform graph nodes
   */
  transform(transformer: StyleTransformer): void {
    const nodesToUpdate: [string, StyleNode | null][] = [];

    for (const [id, node] of this.nodes.entries()) {
      const transformed = transformer(node);
      nodesToUpdate.push([id, transformed]);
    }

    for (const [id, transformed] of nodesToUpdate) {
      if (transformed === null) {
        this.deleteNode(id);
      } else if (transformed !== this.nodes.get(id)) {
        this.updateNode(id, transformed);
      }
    }
  }

  /**
   * Create a new node
   */
  createNode(
    nodeData: Omit<StyleNode, "dependencies" | "dependents">
  ): StyleChange {
    const node: StyleNode = {
      ...nodeData,
      dependencies: new Set(),
      dependents: new Set(),
      // Add tracking metadata
      tracking: {
        createdAt: Date.now(),
        lastModified: Date.now(),
        modificationCount: 0,
      },
    };

    // Add to graph first (needed for dependency calculation)
    this.nodes.set(node.id, node);

    // If layer not provided, compute it from graph structure
    if (!node.layer) {
      node.layer = computeLayer(node, this.nodes);
    }

    // Update dependencies
    this.updateNodeDependencies(node);

    const change: StyleChange = {
      timestamp: Date.now(),
      version: ++this.history.currentVersion,
      type: "create",
      nodeId: node.id,
      before: null,
      after: structuredClone(node),
    };

    this.recordChange(change);
    return change;
  }

  /**
   * Update an existing node
   */
  updateNode(nodeId: string, updates: Partial<StyleNode>): StyleChange {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const before = structuredClone(node);

    // Update tracking metadata
    const updatedTracking = node.tracking
      ? {
          ...node.tracking,
          lastModified: Date.now(),
          modificationCount: node.tracking.modificationCount + 1,
        }
      : {
          createdAt: Date.now(),
          lastModified: Date.now(),
          modificationCount: 1,
        };

    // Create a new node object instead of mutating in-place
    const updatedNode: StyleNode = {
      ...node,
      ...updates,
      tracking: updatedTracking,
      // Preserve Set objects (spread doesn't work with Sets)
      dependencies: updates.dependencies || node.dependencies,
      dependents: updates.dependents || node.dependents,
    };

    // Replace node in graph
    this.nodes.set(nodeId, updatedNode);

    // Update dependencies if value changed
    if (updates.value !== undefined) {
      this.updateNodeDependencies(updatedNode);
    }

    // Recompute layer if dependencies changed and layer not explicitly set
    if (updates.value !== undefined && !updates.layer) {
      updatedNode.layer = computeLayer(updatedNode, this.nodes);
      // Recompute layers for affected nodes
      this.recomputeLayersForSubgraph(nodeId);
    }

    const change: StyleChange = {
      timestamp: Date.now(),
      version: ++this.history.currentVersion,
      type: "update",
      nodeId,
      before,
      after: structuredClone(updatedNode),
    };

    this.recordChange(change);
    return change;
  }

  /**
   * Delete a node
   */
  deleteNode(nodeId: string): StyleChange {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Remove from dependents' dependency lists
    for (const dependentId of node.dependents) {
      const dependent = this.nodes.get(dependentId);
      if (dependent) {
        dependent.dependencies.delete(nodeId);
      }
    }

    // Remove from dependencies' dependent lists
    for (const dependencyId of node.dependencies) {
      const dependency = this.nodes.get(dependencyId);
      if (dependency) {
        dependency.dependents.delete(nodeId);
      }
    }

    this.nodes.delete(nodeId);

    const change: StyleChange = {
      timestamp: Date.now(),
      version: ++this.history.currentVersion,
      type: "delete",
      nodeId,
      before: structuredClone(node),
      after: null,
    };

    this.recordChange(change);
    return change;
  }

  private updateNodeDependencies(node: StyleNode): void {
    // Clear old dependencies
    for (const oldDepId of node.dependencies) {
      const oldDep = this.nodes.get(oldDepId);
      if (oldDep) {
        oldDep.dependents.delete(node.id);
      }
    }
    node.dependencies.clear();

    // Add new dependencies (refs are now IDs)
    const refIds = extractReferences(node);
    for (const targetId of refIds) {
      const targetNode = this.nodes.get(targetId);
      if (targetNode) {
        node.dependencies.add(targetId);
        targetNode.dependents.add(node.id);
      }
    }
  }

  private recordChange(change: StyleChange): void {
    this.history.changes.push(change);
    this.redoStack = []; // Clear redo stack on new change

    // Create snapshot if interval reached
    if (this.history.changes.length % this.history.snapshotInterval === 0) {
      this.createSnapshot();
    }
  }

  private createSnapshot(description?: string): void {
    const snapshot: StyleSnapshot = {
      version: this.history.currentVersion,
      timestamp: Date.now(),
      nodes: new Map(
        Array.from(this.nodes.entries()).map(([id, node]) => [
          id,
          structuredClone(node),
        ])
      ),
      description,
    };
    this.history.snapshots.push(snapshot);
  }

  /**
   * Undo last change
   */
  undo(): boolean {
    if (this.history.changes.length === 0) return false;

    const change = this.history.changes.pop()!;
    this.redoStack.push(change);

    // Apply inverse of change
    if (change.type === "create") {
      this.nodes.delete(change.nodeId);
    } else if (change.type === "delete" && change.before) {
      this.nodes.set(change.nodeId, structuredClone(change.before));
    } else if (change.type === "update" && change.before) {
      this.nodes.set(change.nodeId, structuredClone(change.before));
    }

    this.history.currentVersion--;
    return true;
  }

  /**
   * Redo last undone change
   */
  redo(): boolean {
    if (this.redoStack.length === 0) return false;

    const change = this.redoStack.pop()!;
    this.history.changes.push(change);

    // Apply change
    if (change.type === "create" && change.after) {
      this.nodes.set(change.nodeId, structuredClone(change.after));
    } else if (change.type === "delete") {
      this.nodes.delete(change.nodeId);
    } else if (change.type === "update" && change.after) {
      this.nodes.set(change.nodeId, structuredClone(change.after));
    }

    this.history.currentVersion++;
    return true;
  }

  /**
   * Revert to specific version
   */
  revertToVersion(version: number): boolean {
    // Find nearest snapshot
    const snapshot = [...this.history.snapshots]
      .reverse()
      .find((s) => s.version <= version);

    if (!snapshot) return false;

    // Restore from snapshot
    this.nodes = new Map(
      Array.from(snapshot.nodes.entries()).map(([id, node]) => [
        id,
        structuredClone(node),
      ])
    );

    // Apply changes from snapshot to target version
    const changesToApply = this.history.changes.filter(
      (c) => c.version > snapshot.version && c.version <= version
    );

    for (const change of changesToApply) {
      if (change.type === "create" && change.after) {
        this.nodes.set(change.nodeId, structuredClone(change.after));
      } else if (change.type === "delete") {
        this.nodes.delete(change.nodeId);
      } else if (change.type === "update" && change.after) {
        this.nodes.set(change.nodeId, structuredClone(change.after));
      }
    }

    this.history.currentVersion = version;
    return true;
  }

  /**
   * Get change history
   */
  getHistory(): StyleChange[] {
    return [...this.history.changes];
  }

  /**
   * Validate entire graph
   */
  validateGraph(): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const node of this.nodes.values()) {
      errors.push(...this.validateNode(node.id));
    }

    // Check for circular dependencies
    const cycles = this.findCircularDependencies();
    for (const cycle of cycles) {
      errors.push({
        type: "circular-dependency",
        nodeId: cycle[0],
        message: `Circular dependency detected: ${cycle.join(" → ")}`,
        affectedNodes: cycle,
      });
    }

    return errors;
  }

  /**
   * Validate a specific node
   */
  validateNode(nodeId: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const node = this.nodes.get(nodeId);

    if (!node) {
      errors.push({
        type: "broken-reference",
        nodeId,
        message: `Node ${nodeId} not found`,
      });
      return errors;
    }

    // Check for broken references (now ID-based)
    const refIds = extractReferences(node);
    for (const targetId of refIds) {
      if (!this.nodes.has(targetId)) {
        errors.push({
          type: "broken-reference",
          nodeId: node.id,
          message: `Broken reference: {${targetId}} in node ${node.name}`,
        });
      }
    }

    return errors;
  }

  /**
   * Find circular dependencies using DFS
   */
  findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const pathStack: string[] = [];

    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      recStack.add(nodeId);
      pathStack.push(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visited.has(depId)) {
            dfs(depId);
          } else if (recStack.has(depId)) {
            // Found cycle
            const cycleStart = pathStack.indexOf(depId);
            const cycle = pathStack.slice(cycleStart);
            cycles.push([...cycle, depId]);
          }
        }
      }

      pathStack.pop();
      recStack.delete(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    return cycles;
  }

  /**
   * Get all nodes, optionally filtered
   */
  getNodes(options?: {
    excludeSpecs?: boolean;
    layer?: StyleLayer;
    type?: StyleType;
  }): StyleNode[] {
    let nodes = Array.from(this.nodes.values());

    if (options?.excludeSpecs) {
      nodes = nodes.filter((n) => !n.metadata?.isSpec);
    }

    if (options?.layer) {
      nodes = nodes.filter((n) => n.layer === options.layer);
    }

    if (options?.type) {
      nodes = nodes.filter((n) => n.type === options.type);
    }

    return nodes;
  }

  /**
   * Get graph statistics
   */
  getStats(): GraphStats {
    const stats: GraphStats = {
      totalNodes: this.nodes.size,
      byLayer: { primitive: 0, utility: 0, composite: 0 },
      byType: { color: 0, typography: 0, size: 0, other: 0 },
      referenceCount: 0,
      primitiveCount: 0,
      maxDepth: 0,
      circularDependencies: this.findCircularDependencies(),
      specsCount: 0,
      coreTokensCount: 0,
    };

    for (const node of this.nodes.values()) {
      stats.byLayer[node.layer]++;
      stats.byType[node.type]++;

      if (node.dependencies.size > 0) {
        stats.referenceCount++;
      } else {
        stats.primitiveCount++;
      }

      // Track specs vs core tokens
      if (node.metadata?.isSpec) {
        stats.specsCount++;
      } else {
        stats.coreTokensCount++;
      }

      // Calculate depth (max dependency chain length)
      const depth = this.calculateDepth(node.id);
      stats.maxDepth = Math.max(stats.maxDepth, depth);
    }

    return stats;
  }

  private calculateDepth(nodeId: string, visited = new Set<string>()): number {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    const node = this.nodes.get(nodeId);
    if (!node || node.dependencies.size === 0) return 0;

    let maxDepth = 0;
    for (const depId of node.dependencies) {
      const depth = this.calculateDepth(depId, new Set(visited));
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth + 1;
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    const data = {
      nodes: Array.from(this.nodes.entries()).map(([id, node]) => ({
        ...node,
        dependencies: Array.from(node.dependencies),
        dependents: Array.from(node.dependents),
      })),
      version: this.history.currentVersion,
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export to YAML (placeholder)
   */
  exportToYAML(): string {
    // TODO: Implement YAML export
    return "# YAML export not yet implemented";
  }

  /**
   * Import from JSON (restore saved design language)
   */
  importFromJSON(jsonData: string): void {
    const data = JSON.parse(jsonData);

    // Clear existing nodes
    this.nodes.clear();

    // Restore nodes
    for (const nodeData of data.nodes) {
      const node: StyleNode = {
        ...nodeData,
        dependencies: new Set(nodeData.dependencies || []),
        dependents: new Set(nodeData.dependents || []),
      };
      this.nodes.set(node.id, node);
    }

    // Restore history
    if (data.version !== undefined) {
      this.history.currentVersion = data.version;
    }

    this.createSnapshot("Imported from JSON");
  }

  /**
   * Static factory: Create empty StyleGraph
   */
  static createEmpty(name: string): StyleGraph {
    const graph = new StyleGraph();
    graph.createSnapshot(`Created empty design language: ${name}`);
    return graph;
  }

  /**
   * Static factory: Create StyleGraph from template
   */
  static createFromTemplate(
    name: string,
    template: "minimal" | "standard" = "minimal"
  ): StyleGraph {
    const graph = new StyleGraph();

    if (template === "minimal") {
      // Add minimal base tokens (with nanoid IDs)

      graph.createNode({
        id: nanoid(),
        name: "Black",
        layer: "primitive",
        type: "color",
        value: "#000000",
        metadata: { description: "Base black color" },
      });

      graph.createNode({
        id: nanoid(),
        name: "White",
        layer: "primitive",
        type: "color",
        value: "#FFFFFF",
        metadata: { description: "Base white color" },
      });

      graph.createNode({
        id: nanoid(),
        name: "Base",
        layer: "primitive",
        type: "size",
        value: 8,
        metadata: { description: "Base spacing unit (8px)" },
      });

      graph.createNode({
        id: nanoid(),
        name: "Base",
        layer: "primitive",
        type: "typography",
        value: 16,
        metadata: { description: "Base font size (16px)" },
      });
    }

    graph.createSnapshot(`Created from ${template} template: ${name}`);
    return graph;
  }

  /**
   * ANALYSIS METHODS FOR DESIGN SYSTEM INSIGHTS
   */

  /**
   * Convert hex color to LAB color space for perceptual comparison
   */
  private hexToLab(hex: string): { l: number; a: number; b: number } | null {
    // Remove # if present
    hex = hex.replace(/^#/, "");

    // Parse hex to RGB
    if (hex.length !== 6) return null;

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Convert RGB to XYZ
    const toLinear = (c: number) => {
      return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
    };

    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);

    // Observer = 2°, Illuminant = D65
    const x = (rLinear * 0.4124 + gLinear * 0.3576 + bLinear * 0.1805) * 100;
    const y = (rLinear * 0.2126 + gLinear * 0.7152 + bLinear * 0.0722) * 100;
    const z = (rLinear * 0.0193 + gLinear * 0.1192 + bLinear * 0.9505) * 100;

    // Convert XYZ to LAB
    const refX = 95.047;
    const refY = 100.0;
    const refZ = 108.883;

    const fx = x / refX;
    const fy = y / refY;
    const fz = z / refZ;

    const toF = (t: number) => {
      return t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
    };

    const fxT = toF(fx);
    const fyT = toF(fy);
    const fzT = toF(fz);

    const l = 116 * fyT - 16;
    const a = 500 * (fxT - fyT);
    const bVal = 200 * (fyT - fzT);

    return { l, a, b: bVal };
  }

  /**
   * Calculate perceptual color distance in LAB space (Delta E)
   */
  private colorDistance(
    lab1: { l: number; a: number; b: number },
    lab2: { l: number; a: number; b: number }
  ): number {
    const deltaL = lab1.l - lab2.l;
    const deltaA = lab1.a - lab2.a;
    const deltaB = lab1.b - lab2.b;

    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
  }

  /**
   * Find similar colors using LAB color space comparison
   * Threshold is Delta E distance (typically 2-5 is barely perceptible, 5-10 is noticeable)
   */
  findSimilarColors(threshold: number = 10): Array<{
    token1: string;
    token2: string;
    color1: string;
    color2: string;
    distance: number;
  }> {
    const similar: Array<{
      token1: string;
      token2: string;
      color1: string;
      color2: string;
      distance: number;
    }> = [];

    // Get all color tokens with resolved hex values
    const colorTokens: Array<{
      path: string;
      value: string;
      lab: { l: number; a: number; b: number };
    }> = [];

    for (const node of this.nodes.values()) {
      if (node.type === "color") {
        const resolved = this.resolveNode(node.id, "light");
        if (typeof resolved === "string" && resolved.startsWith("#")) {
          const lab = this.hexToLab(resolved);
          if (lab) {
            colorTokens.push({
              path: node.id,
              value: resolved,
              lab,
            });
          }
        }
      }
    }

    // Compare all pairs
    for (let i = 0; i < colorTokens.length; i++) {
      for (let j = i + 1; j < colorTokens.length; j++) {
        const distance = this.colorDistance(
          colorTokens[i].lab,
          colorTokens[j].lab
        );

        if (distance > 0 && distance <= threshold) {
          similar.push({
            token1: colorTokens[i].path,
            token2: colorTokens[j].path,
            color1: colorTokens[i].value,
            color2: colorTokens[j].value,
            distance: Math.round(distance * 100) / 100,
          });
        }
      }
    }

    return similar.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Find similar numeric values (sizes, spacing, etc.)
   */
  findSimilarNumericValues(
    thresholdPercent: number = 10,
    thresholdAbsolute: number = 2
  ): Array<{
    token1: string;
    token2: string;
    value1: number;
    value2: number;
    difference: number;
    percentDifference: number;
  }> {
    const similar: Array<{
      token1: string;
      token2: string;
      value1: number;
      value2: number;
      difference: number;
      percentDifference: number;
    }> = [];

    // Get all numeric tokens
    const numericTokens: Array<{ path: string; value: number }> = [];

    for (const node of this.nodes.values()) {
      if (node.type === "size" || node.type === "typography") {
        const resolved = this.resolveNode(node.id, "light");
        if (typeof resolved === "number") {
          numericTokens.push({ path: node.id, value: resolved });
        }
      }
    }

    // Compare all pairs
    for (let i = 0; i < numericTokens.length; i++) {
      for (let j = i + 1; j < numericTokens.length; j++) {
        const val1 = numericTokens[i].value;
        const val2 = numericTokens[j].value;
        const diff = Math.abs(val1 - val2);
        const percentDiff = (diff / Math.max(val1, val2)) * 100;

        if (
          diff > 0 &&
          (diff <= thresholdAbsolute || percentDiff <= thresholdPercent)
        ) {
          similar.push({
            token1: numericTokens[i].path,
            token2: numericTokens[j].path,
            value1: val1,
            value2: val2,
            difference: diff,
            percentDifference: Math.round(percentDiff * 100) / 100,
          });
        }
      }
    }

    return similar.sort((a, b) => a.difference - b.difference);
  }

  /**
   * Find tokens with identical resolved values (semantic duplicates)
   */
  findSemanticDuplicates(): Array<{
    resolvedValue: string | number;
    tokens: string[];
    layer: string;
    type: string;
  }> {
    const valueMap = new Map<
      string | number,
      Array<{ path: string; layer: string; type: string }>
    >();

    // Group tokens by resolved value
    for (const node of this.nodes.values()) {
      // Skip composite specs
      if (node.metadata?.isSpec) continue;

      const resolved = this.resolveNode(node.id, "light");
      if (resolved !== null) {
        const key = typeof resolved === "number" ? resolved : String(resolved);

        if (!valueMap.has(key)) {
          valueMap.set(key, []);
        }

        valueMap.get(key)!.push({
          path: node.id,
          layer: node.layer,
          type: node.type,
        });
      }
    }

    // Filter to only duplicates (2+ tokens with same value)
    const duplicates: Array<{
      resolvedValue: string | number;
      tokens: string[];
      layer: string;
      type: string;
    }> = [];

    for (const [value, tokens] of valueMap.entries()) {
      if (tokens.length > 1) {
        duplicates.push({
          resolvedValue: value,
          tokens: tokens.map((t) => t.path),
          layer: tokens[0].layer,
          type: tokens[0].type,
        });
      }
    }

    return duplicates.sort((a, b) => b.tokens.length - a.tokens.length);
  }

  /**
   * Find orphaned tokens (no dependents, not composites)
   */
  findOrphanedTokens(): Array<{
    path: string;
    layer: string;
    type: string;
    value: any;
    reason: string;
  }> {
    const orphaned: Array<{
      path: string;
      layer: string;
      type: string;
      value: any;
      reason: string;
    }> = [];

    for (const node of this.nodes.values()) {
      // Skip composite specs - they're expected to have no dependents
      if (node.metadata?.isSpec) continue;

      if (node.dependents.size === 0) {
        let reason = "No tokens reference this token";

        if (node.layer === "utility") {
          reason =
            "Utility token is not used by any composite or other utility tokens";
        } else if (node.layer === "primitive") {
          reason =
            "Primitive token is not referenced by any utility or composite tokens";
        }

        orphaned.push({
          path: node.id,
          layer: node.layer,
          type: node.type,
          value: node.value,
          reason,
        });
      }
    }

    return orphaned.sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * Get usage distribution (how many tokens have X dependents)
   */
  findUsageDistribution(): Array<{
    range: string;
    count: number;
    tokens: string[];
  }> {
    const ranges = [
      { min: 0, max: 0, label: "0 (orphaned)" },
      { min: 1, max: 5, label: "1-5" },
      { min: 6, max: 10, label: "6-10" },
      { min: 11, max: 20, label: "11-20" },
      { min: 21, max: Infinity, label: "20+" },
    ];

    const distribution = ranges.map((range) => ({
      range: range.label,
      count: 0,
      tokens: [] as string[],
    }));

    for (const node of this.nodes.values()) {
      // Skip composite specs
      if (node.metadata?.isSpec) continue;

      const dependentCount = node.dependents.size;

      for (let i = 0; i < ranges.length; i++) {
        if (
          dependentCount >= ranges[i].min &&
          dependentCount <= ranges[i].max
        ) {
          distribution[i].count++;
          distribution[i].tokens.push(node.id);
          break;
        }
      }
    }

    return distribution;
  }

  /**
   * Find optimization opportunities (primitives that could reference other tokens)
   */
  findOptimizationOpportunities(): Array<{
    path: string;
    currentValue: any;
    suggestedReference: string;
    reasoning: string;
    impact: "low" | "medium" | "high";
  }> {
    const opportunities: Array<{
      path: string;
      currentValue: any;
      suggestedReference: string;
      reasoning: string;
      impact: "low" | "medium" | "high";
    }> = [];

    // Find primitives with duplicate values that could reference each other
    const duplicates = this.findSemanticDuplicates();

    for (const duplicate of duplicates) {
      // Filter to primitives only
      const primitiveTokens = duplicate.tokens.filter((nodeId) => {
        const node = this.getNode(nodeId);
        return (
          node && node.layer === "primitive" && node.dependencies.size === 0
        );
      });

      if (primitiveTokens.length > 1) {
        // Suggest making all but the first one reference the first
        const baseToken = primitiveTokens[0];

        for (let i = 1; i < primitiveTokens.length; i++) {
          const node = this.getNode(primitiveTokens[i]);
          if (node) {
            const impact =
              node.dependents.size > 5
                ? "high"
                : node.dependents.size > 2
                ? "medium"
                : "low";

            opportunities.push({
              path: primitiveTokens[i],
              currentValue: duplicate.resolvedValue,
              suggestedReference: `{${baseToken}}`,
              reasoning: `Same value as ${baseToken}. Creating a reference reduces redundancy and ensures consistency.`,
              impact,
            });
          }
        }
      }
    }

    return opportunities.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }

  /**
   * Find all references to a token (tokens that depend on it)
   */
  findAllReferences(nodeId: string): {
    nodeId: string;
    nodeName: string;
    directReferences: string[];
    allReferences: string[];
    usageCount: number;
  } | null {
    const node = this.getNode(nodeId);
    if (!node) return null;

    const directReferences = Array.from(node.dependents).map((id) => {
      const dep = this.getNode(id);
      return dep ? dep.id : id;
    });

    // Get all transitive dependents
    const allDependents = new Set<string>();
    const queue = Array.from(node.dependents);

    while (queue.length > 0) {
      const depId = queue.shift()!;
      if (allDependents.has(depId)) continue;

      allDependents.add(depId);
      const depNode = this.getNode(depId);
      if (depNode) {
        queue.push(...Array.from(depNode.dependents));
      }
    }

    const allReferences = Array.from(allDependents);

    return {
      nodeId,
      nodeName: node.name,
      directReferences,
      allReferences,
      usageCount: allReferences.length,
    };
  }

  /**
   * Rename a token (change its display name)
   */
  renameToken(nodeId: string, newName: string): StyleChange {
    const node = this.getNode(nodeId);

    if (!node) {
      throw new Error(`Token not found: ${nodeId}`);
    }

    // Check if it's a spec
    if (node.metadata?.isSpec) {
      throw new Error(
        `Cannot rename composite tokens (design specs). These are loaded from the component library.`
      );
    }

    const oldName = node.name;

    // Update the node
    return this.updateNode(nodeId, {
      name: newName,
      metadata: {
        ...node.metadata,
        description: node.metadata?.description || `Renamed from ${oldName}`,
      },
    });
  }

  /**
   * Helper to replace references in a value
   */
  private replaceReference(value: any, oldId: string, newId: string): any {
    if (typeof value === "string" && value === `{${oldId}}`) {
      return `{${newId}}`;
    }

    if (isModeMap(value)) {
      const result: any = {};
      for (const [mode, modeValue] of Object.entries(value)) {
        result[mode] = this.replaceReference(modeValue, oldId, newId);
      }
      return result;
    }

    return value;
  }

  /**
   * Find and replace pattern across tokens
   * Supports regex patterns for matching names or values
   */
  findAndReplace(options: {
    searchPattern: string;
    replaceWith: string;
    searchIn: "name" | "value" | "both";
    matchType: "exact" | "contains" | "regex";
    layer?: StyleLayer;
    type?: StyleType;
    dryRun?: boolean;
  }): Array<{
    nodeId: string;
    nodeName: string;
    field: "name" | "value";
    before: string;
    after: string;
    updated: boolean;
  }> {
    const results: Array<{
      nodeId: string;
      nodeName: string;
      field: "name" | "value";
      before: string;
      after: string;
      updated: boolean;
    }> = [];

    const {
      searchPattern,
      replaceWith,
      searchIn,
      matchType,
      layer,
      type,
      dryRun = false,
    } = options;

    // Create matcher function based on matchType
    const matches = (text: string): boolean => {
      if (matchType === "exact") return text === searchPattern;
      if (matchType === "contains") return text.includes(searchPattern);
      if (matchType === "regex") {
        try {
          const regex = new RegExp(searchPattern);
          return regex.test(text);
        } catch (e) {
          throw new Error(`Invalid regex pattern: ${searchPattern}`);
        }
      }
      return false;
    };

    const replace = (text: string): string => {
      if (matchType === "exact") return replaceWith;
      if (matchType === "contains")
        return text.replace(searchPattern, replaceWith);
      if (matchType === "regex") {
        const regex = new RegExp(searchPattern, "g");
        return text.replace(regex, replaceWith);
      }
      return text;
    };

    // Iterate through all nodes
    for (const node of this.nodes.values()) {
      // Skip if layer/type filter doesn't match
      if (layer && node.layer !== layer) continue;
      if (type && node.type !== type) continue;

      // Skip composite specs
      if (node.metadata?.isSpec) continue;

      // Check name
      if ((searchIn === "name" || searchIn === "both") && matches(node.name)) {
        const newName = replace(node.name);

        if (!dryRun) {
          try {
            this.renameToken(node.id, newName);
            results.push({
              nodeId: node.id,
              nodeName: node.name,
              field: "name",
              before: node.name,
              after: newName,
              updated: true,
            });
          } catch (error) {
            results.push({
              nodeId: node.id,
              nodeName: node.name,
              field: "name",
              before: node.name,
              after: newName,
              updated: false,
            });
          }
        } else {
          results.push({
            nodeId: node.id,
            nodeName: node.name,
            field: "name",
            before: node.name,
            after: newName,
            updated: false,
          });
        }
      }

      // Check value
      if (searchIn === "value" || searchIn === "both") {
        const valueStr = String(node.value);
        if (matches(valueStr)) {
          const newValue = replace(valueStr);

          if (!dryRun) {
            try {
              this.updateNode(node.id, { value: newValue });
              results.push({
                nodeId: node.id,
                nodeName: node.name,
                field: "value",
                before: valueStr,
                after: newValue,
                updated: true,
              });
            } catch (error) {
              results.push({
                nodeId: node.id,
                nodeName: node.name,
                field: "value",
                before: valueStr,
                after: newValue,
                updated: false,
              });
            }
          } else {
            results.push({
              nodeId: node.id,
              nodeName: node.name,
              field: "value",
              before: valueStr,
              after: newValue,
              updated: false,
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * COLOR GROUPING METHODS
   */

  /**
   * Find tokens by OKLCH criteria
   * Useful for creating custom groupings
   */
  findTokensByOKLCH(criteria: {
    hueRange?: [number, number];
    chromaRange?: [number, number];
    lightnessRange?: [number, number];
    hueCenter?: number; // Find tokens within radius of this hue
    hueRadius?: number; // Degrees around hueCenter
  }): Array<{
    tokenId: string;
    path: string;
    oklch: { l: number; c: number; h: number };
  }> {
    const results: Array<{
      tokenId: string;
      path: string;
      oklch: { l: number; c: number; h: number };
    }> = [];

    for (const node of this.nodes.values()) {
      if (node.type === "color" && node.metadata?.colorScience?.oklch) {
        const oklch = node.metadata.colorScience.oklch;
        let matches = true;

        // Check hue range
        if (criteria.hueRange) {
          if (
            oklch.h < criteria.hueRange[0] ||
            oklch.h > criteria.hueRange[1]
          ) {
            matches = false;
          }
        }

        // Check hue center and radius
        if (
          criteria.hueCenter !== undefined &&
          criteria.hueRadius !== undefined
        ) {
          const hueDiff = Math.abs(oklch.h - criteria.hueCenter);
          if (hueDiff > criteria.hueRadius) {
            matches = false;
          }
        }

        // Check chroma range
        if (criteria.chromaRange) {
          if (
            oklch.c < criteria.chromaRange[0] ||
            oklch.c > criteria.chromaRange[1]
          ) {
            matches = false;
          }
        }

        // Check lightness range
        if (criteria.lightnessRange) {
          if (
            oklch.l < criteria.lightnessRange[0] ||
            oklch.l > criteria.lightnessRange[1]
          ) {
            matches = false;
          }
        }

        if (matches) {
          results.push({
            tokenId: node.id,
            path: node.id,
            oklch,
          });
        }
      }
    }

    return results;
  }

  /**
   * Recompute layers for all nodes in graph
   *
   * Useful after major graph changes or migration
   */
  recomputeAllLayers(): void {
    for (const [id, node] of this.nodes) {
      node.layer = computeLayer(node, this.nodes);
    }
  }

  /**
   * Recompute layers for affected subgraph
   *
   * When a node's dependencies change, recompute layers for
   * the node and all its dependents (recursively)
   */
  private recomputeLayersForSubgraph(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Recompute for this node and all dependents (transitive)
    const toUpdate = new Set([nodeId]);
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const current = this.nodes.get(currentId);
      if (!current) continue;

      for (const depId of current.dependents) {
        if (!toUpdate.has(depId)) {
          toUpdate.add(depId);
          queue.push(depId);
        }
      }
    }

    // Recompute layers for all affected nodes
    for (const id of toUpdate) {
      const n = this.nodes.get(id);
      if (n) {
        n.layer = computeLayer(n, this.nodes);
      }
    }
  }
}
