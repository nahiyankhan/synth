/**
 * useArcAnimation - Hook for animating elements along a circular arc
 *
 * Creates smooth arc motion by interpolating angles on a giant off-screen wheel.
 * Used for the generation view's sweeping content transitions.
 */

import { useCallback, useRef } from "react";

export interface ArcConfig {
  /** Radius of the giant wheel */
  wheelRadius: number;
  /** How far below the center the wheel's center point is */
  wheelCenterYOffset: number;
  /** Angle where elements enter from (degrees, 0 = top) */
  entryAngle: number;
  /** Angle where elements are active (degrees, 0 = top) */
  activeAngle: number;
  /** Angle where elements exit to (degrees, 0 = top) */
  exitAngle: number;
  /** Duration of arc animation in ms */
  duration: number;
}

export const DEFAULT_ARC_CONFIG: ArcConfig = {
  wheelRadius: 900,
  wheelCenterYOffset: 600,
  entryAngle: 130,
  activeAngle: 0,
  exitAngle: -130,
  duration: 1000,
};

export interface ArcPosition {
  x: number;
  y: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useArcAnimation(config: Partial<ArcConfig> = {}) {
  const fullConfig: ArcConfig = { ...DEFAULT_ARC_CONFIG, ...config };
  const animationRef = useRef<number | null>(null);

  /**
   * Get the center point of the giant wheel
   */
  const getWheelCenter = useCallback((): ArcPosition => {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 + fullConfig.wheelCenterYOffset,
    };
  }, [fullConfig.wheelCenterYOffset]);

  /**
   * Get position on the arc for a given angle
   */
  const getPositionOnArc = useCallback(
    (angleDeg: number): ArcPosition => {
      const angleRad = ((angleDeg - 90) * Math.PI) / 180; // -90 so 0° points up
      const center = getWheelCenter();
      return {
        x: center.x + Math.cos(angleRad) * fullConfig.wheelRadius,
        y: center.y + Math.sin(angleRad) * fullConfig.wheelRadius,
      };
    },
    [getWheelCenter, fullConfig.wheelRadius]
  );

  /**
   * Animate an element along the arc from one angle to another
   */
  const animateArc = useCallback(
    (
      element: HTMLElement,
      fromAngle: number,
      toAngle: number,
      duration: number = fullConfig.duration
    ): Promise<void> => {
      return new Promise((resolve) => {
        const startTime = performance.now();

        const tick = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = easeInOutCubic(progress);

          const angle = fromAngle + (toAngle - fromAngle) * easedProgress;
          const pos = getPositionOnArc(angle);

          element.style.left = `${pos.x}px`;
          element.style.top = `${pos.y}px`;

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(tick);
          } else {
            animationRef.current = null;
            resolve();
          }
        };

        animationRef.current = requestAnimationFrame(tick);
      });
    },
    [fullConfig.duration, getPositionOnArc]
  );

  /**
   * Set element position without animation
   */
  const setPosition = useCallback(
    (element: HTMLElement, angleDeg: number) => {
      const pos = getPositionOnArc(angleDeg);
      element.style.left = `${pos.x}px`;
      element.style.top = `${pos.y}px`;
    },
    [getPositionOnArc]
  );

  /**
   * Animate element entering from off-screen to active position
   */
  const animateEnter = useCallback(
    (element: HTMLElement): Promise<void> => {
      return animateArc(
        element,
        fullConfig.entryAngle,
        fullConfig.activeAngle,
        fullConfig.duration
      );
    },
    [animateArc, fullConfig]
  );

  /**
   * Animate element exiting from active position to off-screen
   */
  const animateExit = useCallback(
    (element: HTMLElement): Promise<void> => {
      return animateArc(
        element,
        fullConfig.activeAngle,
        fullConfig.exitAngle,
        fullConfig.duration
      );
    },
    [animateArc, fullConfig]
  );

  /**
   * Cancel any running animation
   */
  const cancel = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  return {
    config: fullConfig,
    getWheelCenter,
    getPositionOnArc,
    animateArc,
    animateEnter,
    animateExit,
    setPosition,
    cancel,
  };
}
