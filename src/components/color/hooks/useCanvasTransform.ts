/**
 * useCanvasTransform - Hook for canvas pan/zoom transformation
 *
 * Provides simple pan/zoom state management for canvas-based visualizations.
 * Handles mouse drag for panning and wheel events for zooming.
 */

import React, { useState, useRef, useCallback } from "react";

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface UseCanvasTransformOptions {
  /** Initial transform state */
  initialTransform?: Partial<Transform>;
  /** Minimum zoom scale (default: 0.25) */
  minScale?: number;
  /** Maximum zoom scale (default: 3) */
  maxScale?: number;
  /** Zoom sensitivity multiplier (default: 0.001) */
  zoomSensitivity?: number;
  /** Whether to require modifier key for zoom (default: true) */
  requireModifierForZoom?: boolean;
}

export interface UseCanvasTransformReturn {
  /** Current transform state */
  transform: Transform;
  /** Whether the user is currently panning */
  isPanning: boolean;
  /** Start panning on mouse down */
  handleMouseDown: (e: React.MouseEvent) => void;
  /** Update pan position on mouse move */
  handleMouseMove: (e: React.MouseEvent) => void;
  /** Stop panning on mouse up */
  handleMouseUp: () => void;
  /** Handle wheel events for zoom */
  handleWheel: (e: React.WheelEvent) => void;
  /** Reset transform to initial state */
  resetTransform: () => void;
  /** Manually set transform */
  setTransform: React.Dispatch<React.SetStateAction<Transform>>;
}

const DEFAULT_TRANSFORM: Transform = { x: 0, y: 0, scale: 1 };

/**
 * Hook for managing canvas pan/zoom transformation.
 *
 * @example
 * ```tsx
 * const {
 *   transform,
 *   isPanning,
 *   handleMouseDown,
 *   handleMouseMove,
 *   handleMouseUp,
 *   handleWheel,
 *   resetTransform,
 * } = useCanvasTransform({ minScale: 0.5, maxScale: 2 });
 *
 * return (
 *   <div
 *     onMouseDown={handleMouseDown}
 *     onMouseMove={handleMouseMove}
 *     onMouseUp={handleMouseUp}
 *     onMouseLeave={handleMouseUp}
 *     onWheel={handleWheel}
 *   >
 *     <div style={{
 *       transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
 *       transformOrigin: "0 0",
 *     }}>
 *       {children}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useCanvasTransform(
  options: UseCanvasTransformOptions = {}
): UseCanvasTransformReturn {
  const {
    initialTransform,
    minScale = 0.25,
    maxScale = 3,
    zoomSensitivity = 0.001,
    requireModifierForZoom = true,
  } = options;

  const initial: Transform = { ...DEFAULT_TRANSFORM, ...initialTransform };

  const [transform, setTransform] = useState<Transform>(initial);
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Check if modifier key is required
    if (requireModifierForZoom && !e.ctrlKey && !e.metaKey) {
      return;
    }

    e.preventDefault();

    const delta = -e.deltaY * zoomSensitivity;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(minScale, Math.min(maxScale, prev.scale + delta)),
    }));
  }, [minScale, maxScale, zoomSensitivity, requireModifierForZoom]);

  const resetTransform = useCallback(() => {
    setTransform(initial);
  }, [initial]);

  return {
    transform,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    resetTransform,
    setTransform,
  };
}

/**
 * Get CSS transform string from Transform object.
 *
 * @example
 * ```tsx
 * style={{ transform: getTransformStyle(transform) }}
 * ```
 */
export function getTransformStyle(transform: Transform): string {
  return `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
}

/**
 * Format scale as percentage string.
 *
 * @example
 * formatScalePercent(1.5) // "150%"
 */
export function formatScalePercent(scale: number): string {
  return `${Math.round(scale * 100)}%`;
}
