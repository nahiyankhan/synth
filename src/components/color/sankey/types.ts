/**
 * Sankey Visualization Types
 *
 * Type definitions for the color token flow Sankey diagram.
 * Currently supports 2 columns (primitive → semantic).
 * Future: Add 3rd column for component usage.
 */

import { StyleNode } from "../../../types/styleGraph";

/**
 * A node in the Sankey diagram
 */
export interface SankeyNode {
  id: string;
  name: string;
  node: StyleNode;
  hex: { light: string; dark: string };
  layer: 0 | 1; // 0=primitive, 1=semantic (future: 2=component)
  layerName: "primitive" | "semantic";
  x0: number;
  x1: number;
  y: number;
  index: number;
  visited: boolean;
  sourceLinks: SankeyLink[];
  targetLinks: SankeyLink[];
}

/**
 * A link between nodes in the Sankey diagram
 */
export interface SankeyLink {
  id: string;
  index: number;
  sourceId: string;
  targetId: string;
  source: SankeyNode;
  target: SankeyNode;
  y: number;
}

/**
 * Node with animation state
 */
export interface AnimatingNode extends SankeyNode {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  opacity: number;
  isNew: boolean;
}

/**
 * Stored position for animation tracking
 */
export interface NodePosition {
  x0: number;
  y: number;
}

// ============================================================================
// Configuration Constants
// ============================================================================

/** Horizontal spacing between columns */
export const LAYER_WIDTH = 320;

/** Vertical spacing between nodes */
export const NODE_PADDING = 100;

/** Node rectangle height */
export const NODE_HEIGHT = 80;

/** Minimum node width */
export const NODE_MIN_WIDTH = 200;

/** Color preview swatch width */
export const PREVIEW_WIDTH = 80;

/** Horizontal padding inside node */
export const HORIZONTAL_PADDING = 32;

/** Number of relaxation iterations for layout */
export const ITERATIONS = 16;

/** Opacity for inactive nodes/links */
export const INACTIVE_OPACITY = 0.3;

/** Duration of node position animation (ms) */
export const NODE_ANIMATION_MS = 500;

/** Duration of link draw-in animation (ms) */
export const LINK_ANIMATION_MS = 250;

/** Pixels of movement before considering a drag vs click */
export const CLICK_THRESHOLD = 3;

/** Minimum zoom scale */
export const MIN_SCALE = 0.25;

/** Maximum zoom scale */
export const MAX_SCALE = 3.5;

/** Font size for node text */
export const FONT_SIZE = 14;

/** Vertical offset from node center for link attachment */
export const VERTICAL_OFFSET = 40;

/** Distance from target node where link bend occurs */
export const TARGET_OFFSET = 40;

/** Radius for curved corners on links */
export const LINK_RADIUS = 12;
