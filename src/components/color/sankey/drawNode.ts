/**
 * Node Drawing Function
 *
 * Draws a single Sankey node with color preview swatch and text.
 */

import {
  AnimatingNode,
  NODE_HEIGHT,
  PREVIEW_WIDTH,
  HORIZONTAL_PADDING,
  INACTIVE_OPACITY,
  FONT_SIZE,
} from "./types";
import { colors, ThemeColors } from "./colors";
import {
  getNodeDimensions,
  roundRect,
  roundRectLeft,
  shortenName,
} from "./utils";

interface DrawNodeOptions {
  ctx: CanvasRenderingContext2D;
  node: AnimatingNode;
  currentX: number;
  currentY: number;
  theme: "light" | "dark";
  colorMode: "light" | "dark";
  opacity: number;
  isHovered: boolean;
  isActive: boolean;
  hasActiveSelection: boolean;
}

export function drawNode(options: DrawNodeOptions): void {
  const {
    ctx,
    node,
    currentX,
    currentY,
    theme,
    colorMode,
    opacity,
    isHovered,
    isActive,
    hasActiveSelection,
  } = options;

  const themeColors = colors[theme];
  const { width: nodeWidth } = getNodeDimensions(ctx, node.name, FONT_SIZE);
  const radius = 8;

  // Determine opacity based on active state
  const shouldBeActive = !hasActiveSelection || isActive;
  const finalOpacity = opacity * (shouldBeActive ? 1 : INACTIVE_OPACITY);

  ctx.save();
  ctx.globalAlpha = finalOpacity;

  // Draw background
  ctx.fillStyle = themeColors.bg;
  roundRect(ctx, currentX, currentY, nodeWidth, NODE_HEIGHT, radius);
  ctx.fill();

  // Draw border
  ctx.strokeStyle = getBorderColor(themeColors, isHovered, isActive);
  ctx.lineWidth = isActive ? 2 : 1;
  roundRect(ctx, currentX, currentY, nodeWidth, NODE_HEIGHT, radius);
  ctx.stroke();

  // Draw color preview swatch
  ctx.fillStyle = node.hex[colorMode];
  roundRectLeft(ctx, currentX, currentY, PREVIEW_WIDTH, NODE_HEIGHT, radius);
  ctx.fill();

  // Draw separator line between swatch and text
  ctx.strokeStyle = themeColors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(currentX + PREVIEW_WIDTH, currentY);
  ctx.lineTo(currentX + PREVIEW_WIDTH, currentY + NODE_HEIGHT);
  ctx.stroke();

  // Draw name text
  const textX = currentX + PREVIEW_WIDTH + HORIZONTAL_PADDING / 2;
  const displayName = shortenName(node.name);

  ctx.fillStyle = themeColors.text;
  ctx.font = `500 ${FONT_SIZE}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText(displayName, textX, currentY + NODE_HEIGHT / 2 - 10);

  // Draw hex value
  ctx.fillStyle = themeColors.textMuted;
  ctx.font = `400 ${FONT_SIZE - 2}px ui-monospace, monospace`;
  ctx.fillText(node.hex[colorMode], textX, currentY + NODE_HEIGHT / 2 + 10);

  ctx.restore();
}

function getBorderColor(
  themeColors: ThemeColors,
  isHovered: boolean,
  isActive: boolean
): string {
  if (isActive) {
    return themeColors.borderActive;
  }
  if (isHovered) {
    return themeColors.borderHover;
  }
  return themeColors.borderStandard;
}

/**
 * Draw layer column headers
 */
export function drawColumnHeaders(
  ctx: CanvasRenderingContext2D,
  theme: "light" | "dark",
  layerWidth: number
): void {
  const themeColors = colors[theme];
  const headers = ["PRIMITIVES", "SEMANTIC"];

  ctx.save();
  ctx.fillStyle = themeColors.textMuted;
  ctx.font = `600 11px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = "top";

  for (let i = 0; i < headers.length; i++) {
    const x = i * layerWidth;
    ctx.fillText(headers[i], x, -30);
  }

  ctx.restore();
}
