/**
 * Layer Computation Utility
 *
 * Computes token layers automatically from graph structure
 * rather than requiring manual specification.
 */

import { StyleNode, StyleLayer } from "../types/styleGraph";

/**
 * Configuration for layer computation thresholds
 */
export interface LayerConfig {
  primitiveThreshold: number; // Min dependents for primitive classification
  utilityThreshold: number; // Min dependents for utility classification
}

const DEFAULT_CONFIG: LayerConfig = {
  primitiveThreshold: 5,
  utilityThreshold: 3,
};

/**
 * Compute layer from graph structure and metadata
 *
 * Heuristics:
 * - Composite: Explicitly marked as spec
 * - Primitive: No dependencies + used by 5+ tokens
 * - Utility: Has dependencies + used by 3+ tokens OR has dependencies
 * - Default: Standalone primitive
 *
 * @param token - The token to compute layer for
 * @param graph - The full token graph
 * @param config - Layer computation thresholds (optional)
 * @returns Computed layer classification
 */
export function computeLayer(
  token: StyleNode,
  graph: Map<string, StyleNode>,
  config: LayerConfig = DEFAULT_CONFIG
): StyleLayer {
  // If explicitly marked as spec → composite
  if (token.metadata?.isSpec) return "composite";

  const deps = token.dependencies.size;
  const dependents = token.dependents.size;

  // Foundation: no dependencies, used by many
  if (deps === 0 && dependents >= config.primitiveThreshold) return "primitive";

  // Bridge: references foundations, used by several
  if (deps > 0 && dependents >= config.utilityThreshold) return "utility";

  // Specific usage with dependencies
  if (deps > 0) return "utility";

  // Default: standalone primitive
  return "primitive";
}

/**
 * Enrich node with computed layer
 *
 * If the node already has a layer, it's preserved.
 * Otherwise, compute it from graph structure.
 *
 * @param token - The token to enrich
 * @param graph - The full token graph
 * @param config - Layer computation thresholds (optional)
 * @returns Token with layer field set
 */
export function enrichWithComputedLayer(
  token: StyleNode,
  graph: Map<string, StyleNode>,
  config?: LayerConfig
): StyleNode {
  return {
    ...token,
    layer: token.layer || computeLayer(token, graph, config),
  };
}
