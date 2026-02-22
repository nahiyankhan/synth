/**
 * Link Drawing Function
 *
 * Draws bezier curve links between Sankey nodes.
 * Supports active highlighting and dash animation.
 */

import {
  SankeyLink,
  AnimatingNode,
  INACTIVE_OPACITY,
  NODE_HEIGHT,
  VERTICAL_OFFSET,
  TARGET_OFFSET,
  LINK_RADIUS,
  FONT_SIZE,
} from "./types";
import { colors } from "./colors";
import { getNodeDimensions } from "./utils";

interface DrawLinkOptions {
  ctx: CanvasRenderingContext2D;
  link: SankeyLink;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
  sourceNode: AnimatingNode;
  targetNode: AnimatingNode;
  theme: "light" | "dark";
  isActive: boolean;
  hasActiveSelection: boolean;
  linkProgress: number;
}

export function drawLink(options: DrawLinkOptions): void {
  const {
    ctx,
    sourcePos,
    targetPos,
    sourceNode,
    targetNode,
    theme,
    isActive,
    hasActiveSelection,
    linkProgress,
  } = options;

  const themeColors = colors[theme];

  // Calculate source and target connection points
  const sourceWidth = getNodeDimensions(ctx, sourceNode.name, FONT_SIZE).width;

  // Source: right edge of node, vertically centered
  const sourceX = sourcePos.x + sourceWidth;
  const sourceY = sourcePos.y + NODE_HEIGHT / 2;

  // Target: left edge of node, vertically centered
  const targetX = targetPos.x;
  const targetY = targetPos.y + NODE_HEIGHT / 2;

  // Determine opacity
  const shouldBeActive = !hasActiveSelection || isActive;
  const opacity = shouldBeActive ? 1 : INACTIVE_OPACITY;

  ctx.save();
  ctx.globalAlpha = opacity;

  // Set line style
  ctx.strokeStyle = isActive ? themeColors.linkActive : themeColors.linkDefault;
  ctx.lineWidth = isActive ? 2 : 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Draw the curved path
  drawBezierLink(ctx, sourceX, sourceY, targetX, targetY);

  // For active links, add dash animation
  if (isActive && linkProgress < 1) {
    drawAnimatedDash(ctx, sourceX, sourceY, targetX, targetY, linkProgress);
  }

  ctx.restore();
}

/**
 * Draw a bezier curve link between two points
 * Uses a quadratic curve with a vertical bend near the target
 */
function drawBezierLink(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);

  // Calculate control points for smooth curve
  const midX = (x1 + x2) / 2;

  // Horizontal line from source
  ctx.lineTo(midX - LINK_RADIUS, y1);

  // Curve toward target
  if (Math.abs(y2 - y1) > LINK_RADIUS * 2) {
    // Need vertical segment
    const curveDir = y2 > y1 ? 1 : -1;

    // First curve (horizontal to vertical)
    ctx.arcTo(midX, y1, midX, y1 + curveDir * LINK_RADIUS, LINK_RADIUS);

    // Vertical segment
    const verticalEnd = y2 - curveDir * LINK_RADIUS;
    ctx.lineTo(midX, verticalEnd);

    // Second curve (vertical to horizontal)
    ctx.arcTo(midX, y2, midX + LINK_RADIUS, y2, LINK_RADIUS);
  } else {
    // Direct curve for small vertical differences
    ctx.quadraticCurveTo(midX, y1, midX, (y1 + y2) / 2);
    ctx.quadraticCurveTo(midX, y2, midX + LINK_RADIUS, y2);
  }

  // Horizontal line to target
  ctx.lineTo(x2, y2);

  ctx.stroke();
}

/**
 * Draw animated dash effect on active link
 */
function drawAnimatedDash(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  progress: number
): void {
  ctx.save();

  // Brighter color for the dash
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 3;

  // Estimate path length for dash offset calculation
  const pathLength = Math.abs(x2 - x1) + Math.abs(y2 - y1);
  const dashLength = 20;
  const gapLength = 10;

  ctx.setLineDash([dashLength, gapLength]);
  ctx.lineDashOffset = -progress * pathLength;

  drawBezierLink(ctx, x1, y1, x2, y2);

  ctx.restore();
}

/**
 * Draw all links with proper layering (inactive first, then active)
 */
export function drawAllLinks(
  ctx: CanvasRenderingContext2D,
  links: SankeyLink[],
  nodePositions: Map<string, { x: number; y: number }>,
  animatingNodes: AnimatingNode[],
  activeLinks: Set<string>,
  theme: "light" | "dark",
  linkProgress: number
): void {
  const nodeMap = new Map(animatingNodes.map((n) => [n.id, n]));
  const hasActiveSelection = activeLinks.size > 0;

  // Separate inactive and active links
  const inactiveLinks: SankeyLink[] = [];
  const activeLinksArray: SankeyLink[] = [];

  for (const link of links) {
    if (activeLinks.has(link.id)) {
      activeLinksArray.push(link);
    } else {
      inactiveLinks.push(link);
    }
  }

  // Draw inactive links first (below)
  for (const link of inactiveLinks) {
    const sourcePos = nodePositions.get(link.sourceId);
    const targetPos = nodePositions.get(link.targetId);
    const sourceNode = nodeMap.get(link.sourceId);
    const targetNode = nodeMap.get(link.targetId);

    if (!sourcePos || !targetPos || !sourceNode || !targetNode) continue;

    drawLink({
      ctx,
      link,
      sourcePos,
      targetPos,
      sourceNode,
      targetNode,
      theme,
      isActive: false,
      hasActiveSelection,
      linkProgress: 1,
    });
  }

  // Draw active links on top
  for (const link of activeLinksArray) {
    const sourcePos = nodePositions.get(link.sourceId);
    const targetPos = nodePositions.get(link.targetId);
    const sourceNode = nodeMap.get(link.sourceId);
    const targetNode = nodeMap.get(link.targetId);

    if (!sourcePos || !targetPos || !sourceNode || !targetNode) continue;

    drawLink({
      ctx,
      link,
      sourcePos,
      targetPos,
      sourceNode,
      targetNode,
      theme,
      isActive: true,
      hasActiveSelection,
      linkProgress,
    });
  }
}
