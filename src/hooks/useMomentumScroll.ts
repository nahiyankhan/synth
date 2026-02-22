import { useRef, useEffect, useCallback, RefObject } from 'react';

export interface MomentumScrollOptions {
  /**
   * Friction coefficient for momentum decay (0-1, higher = slower decay)
   * @default 0.92
   */
  friction?: number;
  /**
   * Damping coefficient for velocity smoothing (0-1, higher = more responsive)
   * @default 0.3
   */
  damping?: number;
  /**
   * Minimum speed threshold to continue momentum animation
   * @default 0.5
   */
  minSpeed?: number;
  /**
   * Delay before starting momentum animation after wheel stops (ms)
   * @default 50
   */
  momentumDelay?: number;
  /**
   * Enable boundary detection to stop momentum when hitting scroll limits
   * @default true
   */
  detectBoundaries?: boolean;
  /**
   * Whether zooming (ctrl+wheel) is handled externally
   * @default false
   */
  externalZoom?: boolean;
  /**
   * Callback when zooming is detected (only called if externalZoom is true)
   */
  onZoom?: (e: WheelEvent) => void;
  /**
   * Callback after scroll position changes (useful for custom constraints)
   */
  onScroll?: () => void;
}

export interface MomentumScrollReturn {
  /**
   * Cancel any ongoing momentum animation and reset velocity
   */
  cancelMomentum: () => void;
  /**
   * Current velocity ref (for external inspection if needed)
   */
  velocityRef: RefObject<{ x: number; y: number }>;
}

/**
 * Hook for adding momentum/inertia scrolling to a container element.
 * Provides smooth touchpad-like panning with physics-based deceleration.
 *
 * @param containerRef - Ref to the scrollable container element
 * @param options - Configuration options for momentum behavior
 * @returns Object with cancelMomentum function and velocityRef
 *
 * @example
 * ```tsx
 * const scrollContainerRef = useRef<HTMLDivElement>(null);
 * const { cancelMomentum } = useMomentumScroll(scrollContainerRef, {
 *   friction: 0.92,
 *   onZoom: (e) => handleZoom(e),
 *   externalZoom: true,
 * });
 *
 * // Call cancelMomentum when starting other interactions like dragging
 * const handleMouseDown = () => {
 *   cancelMomentum();
 *   // ... start drag
 * };
 * ```
 */
export function useMomentumScroll(
  containerRef: RefObject<HTMLElement | null>,
  options: MomentumScrollOptions = {}
): MomentumScrollReturn {
  const {
    friction = 0.92,
    damping = 0.3,
    minSpeed = 0.5,
    momentumDelay = 50,
    detectBoundaries = true,
    externalZoom = false,
    onZoom,
    onScroll,
  } = options;

  // Momentum state refs
  const velocityRef = useRef({ x: 0, y: 0 });
  const momentumFrameRef = useRef<number | null>(null);
  const lastWheelTimeRef = useRef(0);

  /**
   * Cancel any ongoing momentum animation and reset velocity
   */
  const cancelMomentum = useCallback(() => {
    if (momentumFrameRef.current) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }
    velocityRef.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Handle zoom separately if externalZoom is enabled
      if (e.ctrlKey || e.metaKey) {
        if (externalZoom && onZoom) {
          e.preventDefault();
          onZoom(e);
        }
        return;
      }

      e.preventDefault();
      lastWheelTimeRef.current = Date.now();

      // Apply scroll delta directly
      container.scrollLeft += e.deltaX;
      container.scrollTop += e.deltaY;

      // Call scroll callback for custom constraints
      onScroll?.();

      // Update velocity for momentum (with smoothing for better feel)
      velocityRef.current.x =
        velocityRef.current.x * (1 - damping) + e.deltaX * damping;
      velocityRef.current.y =
        velocityRef.current.y * (1 - damping) + e.deltaY * damping;

      // Cancel existing momentum animation
      if (momentumFrameRef.current) {
        cancelAnimationFrame(momentumFrameRef.current);
        momentumFrameRef.current = null;
      }

      // Start new momentum animation after a short delay (when user stops scrolling)
      setTimeout(() => {
        if (Date.now() - lastWheelTimeRef.current > momentumDelay) {
          startMomentumAnimation();
        }
      }, momentumDelay + 10);
    };

    const startMomentumAnimation = () => {
      const animate = () => {
        if (!container) return;

        // Store scroll positions before applying velocity (for boundary detection)
        const prevScrollLeft = container.scrollLeft;
        const prevScrollTop = container.scrollTop;

        // Apply velocity to scroll position
        container.scrollLeft += velocityRef.current.x;
        container.scrollTop += velocityRef.current.y;

        // Call scroll callback for custom constraints
        onScroll?.();

        // Check if we hit a boundary and stop momentum in that direction
        if (detectBoundaries) {
          if (
            container.scrollLeft === prevScrollLeft &&
            Math.abs(velocityRef.current.x) > 0.1
          ) {
            velocityRef.current.x = 0;
          }
          if (
            container.scrollTop === prevScrollTop &&
            Math.abs(velocityRef.current.y) > 0.1
          ) {
            velocityRef.current.y = 0;
          }
        }

        // Decay velocity (momentum friction)
        velocityRef.current.x *= friction;
        velocityRef.current.y *= friction;

        // Continue animation if velocity is significant
        const speed = Math.sqrt(
          velocityRef.current.x ** 2 + velocityRef.current.y ** 2
        );

        if (speed > minSpeed) {
          momentumFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Stop animation
          velocityRef.current = { x: 0, y: 0 };
          momentumFrameRef.current = null;
        }
      };

      momentumFrameRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (momentumFrameRef.current) {
        cancelAnimationFrame(momentumFrameRef.current);
      }
    };
  }, [containerRef, friction, damping, minSpeed, momentumDelay, detectBoundaries, externalZoom, onZoom, onScroll]);

  return {
    cancelMomentum,
    velocityRef,
  };
}
