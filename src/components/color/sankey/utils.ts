/**
 * Sankey Canvas Utilities
 *
 * Canvas setup, easing functions, and measurement helpers.
 */

import {
  NODE_HEIGHT,
  NODE_MIN_WIDTH,
  PREVIEW_WIDTH,
  HORIZONTAL_PADDING,
} from "./types";

/**
 * Set up canvas for high-DPI displays
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  dpr: number
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const rect = canvas.getBoundingClientRect();

  // Set canvas size accounting for device pixel ratio
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Scale context to match
  ctx.scale(dpr, dpr);

  // Set CSS size
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  return ctx;
}

/**
 * Cubic ease-out function for smooth animations
 */
export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Get node dimensions based on text width
 */
export function getNodeDimensions(
  ctx: CanvasRenderingContext2D,
  name: string,
  fontSize: number
): { width: number; height: number } {
  ctx.font = `500 ${fontSize}px system-ui`;
  const textWidth = ctx.measureText(name).width;
  const width = Math.max(
    textWidth + PREVIEW_WIDTH + HORIZONTAL_PADDING,
    NODE_MIN_WIDTH
  );
  return { width, height: NODE_HEIGHT };
}

// Re-export shortenTokenName as shortenName for backwards compatibility
export { shortenTokenName as shortenName } from "@/components/color/utils/token-name-utils";

/**
 * Draw a rounded rectangle path
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Draw a rounded rectangle path with only left corners rounded
 * (for color preview swatch)
 */
export function roundRectLeft(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
