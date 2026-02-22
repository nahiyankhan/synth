/**
 * ColorView - Data-driven color spectrum layout
 *
 * Displays color tokens with intelligent positioning:
 * - X-axis: Unique hue columns (each distinct hue gets its own column, no gaps)
 * - Y-axis: Lightness (0-1, darkest at bottom, stacked vertically within each hue)
 * - Canvas dimensions calculated dynamically based on actual color data
 */

import React, { useMemo, useState, useRef, useEffect } from "react";
import { StyleGraph } from "@/core/StyleGraph";
import { StyleNode } from "@/types/styleGraph";
import { hexToOKLCH, OKLCHColor } from "@/services/colorScience";
import { ColorSelectionPanel } from "./color/ColorSelectionPanel";

interface ColorViewProps {
  graph: StyleGraph;
  viewMode: "light" | "dark";
  onSelectNode?: (node: StyleNode | null) => void;
  onSelectNodes?: (nodes: StyleNode[]) => void; // Multi-select callback
  filteredNodes?: StyleNode[] | null;
  onClearFilter?: () => void;
  autoSelectFiltered?: boolean; // When true, auto-select filtered nodes (for select_colors tool)
}

interface PositionedColor {
  node: StyleNode;
  color: string;
  oklch: OKLCHColor;
  x: number;
  y: number;
  columnIndex?: number;
}

// const HUE_LABELS = [
//   { hue: 0, label: "Red", color: "#FF0000" },
//   { hue: 30, label: "Orange", color: "#FF8000" },
//   { hue: 60, label: "Yellow", color: "#FFFF00" },
//   { hue: 120, label: "Green", color: "#00FF00" },
//   { hue: 180, label: "Cyan", color: "#00FFFF" },
//   { hue: 240, label: "Blue", color: "#0000FF" },
//   { hue: 270, label: "Purple", color: "#8000FF" },
//   { hue: 300, label: "Magenta", color: "#FF00FF" },
// ];

export const ColorView: React.FC<ColorViewProps> = ({
  graph,
  viewMode,
  onSelectNode,
  onSelectNodes,
  filteredNodes,
  onClearFilter,
  autoSelectFiltered = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredColor, setHoveredColor] = useState<PositionedColor | null>(
    null
  );
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [didPan, setDidPan] = useState(false);
  const justFinishedSelectingRef = useRef(false);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1); // Track zoom in ref for immediate updates

  // Momentum state
  const velocityRef = useRef({ x: 0, y: 0 });
  const momentumFrameRef = useRef<number | null>(null);
  const lastWheelTimeRef = useRef(0);

  // Touch/pinch state
  const touchStartDistanceRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);

  // Mouse position for zoom
  const mousePositionRef = useRef({ x: 0, y: 0 });

  // Zoom constraints
  const MAX_ZOOM = 3;
  const [minZoom, setMinZoom] = useState(0.05);
  const minZoomRef = useRef(0.05);

  // Track container dimensions for minimum canvas size
  const [containerWidth, setContainerWidth] = useState(800);
  const [containerHeight, setContainerHeight] = useState(600);

  // Throttle zoom updates to reduce jitter
  const lastZoomUpdateRef = useRef<number>(0);
  const pendingZoomRef = useRef<number | null>(null);

  // Track if we've done initial positioning (use state so React knows to re-render)
  const [hasInitialized, setHasInitialized] = useState(false);

  // Track previous filteredNodes to detect filter changes
  const prevFilteredNodesRef = useRef<StyleNode[] | null | undefined>(
    undefined
  );

  // Track previous viewMode to detect mode changes
  const prevViewModeRef = useRef<"light" | "dark">(viewMode);

  // Animation state - pop colors in from left to right
  // IMPORTANT: Must start false so colors are hidden initially
  const [animateColors, setAnimateColors] = useState(false);

  // Track if we should auto-select filtered nodes (from select_colors tool)
  const shouldAutoSelectRef = useRef(false);

  // Track previous positioned colors for smooth transitions
  const prevPositionedColorsRef = useRef<Map<string, PositionedColor>>(
    new Map()
  );

  // Track if we've already triggered the initial animation
  const hasTriggeredInitialAnimationRef = useRef(false);

  // Reset initialization flag on mount to ensure animation plays
  useEffect(() => {
    setHasInitialized(false);
    hasTriggeredInitialAnimationRef.current = false;
  }, []);

  // Track colors that are leaving (fading out)
  const [leavingColors, setLeavingColors] = useState<
    Map<string, PositionedColor>
  >(new Map());

  // Track if we're in a filter transition
  const [isFilterTransition, setIsFilterTransition] = useState(false);

  // Sync zoom ref with state
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Sync minZoom ref with state
  useEffect(() => {
    minZoomRef.current = minZoom;
  }, [minZoom]);

  // Layout configuration
  const RECT_WIDTH = 120; // Width of each color rectangle
  const RECT_HEIGHT = 120; // Height of each color rectangle
  const RECT_SPACING = 4; // Gap between rectangles to prevent overlaps
  const CANVAS_PADDING = 2000; // Massive padding for truly infinite canvas feel

  // Helper function for chroma-based border radius
  // Low chroma (greys) = circular, High chroma (saturated) = rectangular
  const getColorBorderRadius = (
    oklch: OKLCHColor,
    isHovered: boolean
  ): string => {
    const baseRadius = Math.min(RECT_WIDTH, RECT_HEIGHT) / 2; // Maximum possible radius (perfect circle)
    const chromaFactor = 1 - Math.min(oklch.c * 2.5, 1); // Inverse relationship
    const radius = baseRadius * chromaFactor;
    return isHovered ? `${radius + 8}px` : `${radius}px`;
  };

  // Helper function to constrain scroll position within boundaries
  const constrainScroll = (
    container: HTMLDivElement,
    canvas: HTMLDivElement
  ) => {
    // Get the actual canvas dimensions from DOM (to avoid closure issues)
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;

    // Get the scaled canvas dimensions
    const scaledWidth = canvasWidth * zoomRef.current;
    const scaledHeight = canvasHeight * zoomRef.current;

    // Calculate max scroll positions (prevent scrolling beyond the canvas)
    const maxScrollLeft = Math.max(0, scaledWidth - container.clientWidth);
    const maxScrollTop = Math.max(0, scaledHeight - container.clientHeight);

    // Constrain scroll positions (but allow negative for centered infinite canvas feel)
    // Only constrain to prevent scrolling too far beyond the canvas
    container.scrollLeft = Math.max(
      -500, // Allow scrolling 500px before canvas starts
      Math.min(container.scrollLeft, maxScrollLeft + 500) // Allow 500px beyond canvas
    );
    container.scrollTop = Math.max(
      -500,
      Math.min(container.scrollTop, maxScrollTop + 500)
    );
  };

  // Helper function to zoom relative to a point
  const zoomToPoint = (
    newZoom: number,
    clientX: number,
    clientY: number,
    immediate = false
  ) => {
    const container = scrollContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Clamp zoom to min/max
    const clampedZoom = Math.max(
      minZoomRef.current,
      Math.min(MAX_ZOOM, newZoom)
    );

    // Skip if zoom didn't actually change
    if (Math.abs(clampedZoom - zoomRef.current) < 0.001) {
      return;
    }

    // Get container bounds
    const rect = container.getBoundingClientRect();

    // Mouse position relative to container viewport
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    // Current zoom level
    const currentZoom = zoomRef.current;

    // Find which canvas point is currently under the mouse
    // Canvas point = (scroll position + mouse position in viewport) / current zoom
    const canvasX = (container.scrollLeft + mouseX) / currentZoom;
    const canvasY = (container.scrollTop + mouseY) / currentZoom;

    // Calculate where to scroll so that same canvas point stays under mouse at new zoom
    // New scroll = (canvas point * new zoom) - mouse position in viewport
    const newScrollLeft = canvasX * clampedZoom - mouseX;
    const newScrollTop = canvasY * clampedZoom - mouseY;

    // Update zoom ref
    zoomRef.current = clampedZoom;

    // Apply transform immediately for visual feedback
    canvas.style.transform = `scale(${clampedZoom})`;

    // Set scroll position immediately (no RAF - more responsive)
    container.scrollLeft = newScrollLeft;
    container.scrollTop = newScrollTop;

    // Update React state for consistency
    setZoom(clampedZoom);
  };

  // Touchpad panning with momentum and zoom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Detect pinch gesture (Ctrl key indicates pinch zoom on trackpad)
      const isPinch = e.ctrlKey;

      if (isPinch) {
        e.preventDefault();

        // Zoom with pinch gesture, centered on mouse position
        // Balanced sensitivity: 0.005 (between original 0.01 and too-slow 0.002)
        const zoomDelta = -e.deltaY * 0.005;
        const newZoom = zoomRef.current + zoomDelta;
        zoomToPoint(newZoom, e.clientX, e.clientY);

        return;
      }

      // Prevent default scroll behavior - we'll handle it manually
      e.preventDefault();

      const now = Date.now();
      const timeDelta = now - lastWheelTimeRef.current;
      lastWheelTimeRef.current = now;

      // Apply touchpad scroll immediately
      container.scrollLeft += e.deltaX;
      container.scrollTop += e.deltaY;

      // Constrain to boundaries (soft limits for infinite canvas feel)
      const canvas = canvasRef.current;
      if (canvas) {
        constrainScroll(container, canvas);
      }

      // Update velocity for momentum (with smoothing for better feel)
      const damping = 0.3;
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
        if (Date.now() - lastWheelTimeRef.current > 50) {
          startMomentumAnimation();
        }
      }, 50);
    };

    const startMomentumAnimation = () => {
      const animate = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Store scroll positions before applying velocity
        const prevScrollLeft = container.scrollLeft;
        const prevScrollTop = container.scrollTop;

        // Apply velocity to scroll position
        container.scrollLeft += velocityRef.current.x;
        container.scrollTop += velocityRef.current.y;

        // Constrain to boundaries (soft limits for infinite canvas feel)
        const canvas = canvasRef.current;
        if (canvas) {
          constrainScroll(container, canvas);
        }

        // Check if we hit a boundary and stop momentum in that direction
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

        // Decay velocity (momentum friction)
        const friction = 0.92;
        velocityRef.current.x *= friction;
        velocityRef.current.y *= friction;

        // Continue animation if velocity is significant
        const speed = Math.sqrt(
          velocityRef.current.x ** 2 + velocityRef.current.y ** 2
        );

        if (speed > 0.5) {
          momentumFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Stop animation
          velocityRef.current = { x: 0, y: 0 };
          momentumFrameRef.current = null;
        }
      };

      momentumFrameRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (momentumFrameRef.current) {
        cancelAnimationFrame(momentumFrameRef.current);
      }
    };
  }, []);

  // Track mouse position for zoom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Touch pinch gesture handling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Two fingers - prepare for pinch
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        touchStartDistanceRef.current = distance;
        touchStartZoomRef.current = zoomRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDistanceRef.current !== null) {
        e.preventDefault();

        // Calculate current distance between fingers
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        // Calculate center point between fingers
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;

        // Calculate zoom based on distance ratio
        const scale = distance / touchStartDistanceRef.current;
        const newZoom = touchStartZoomRef.current * scale;

        zoomToPoint(newZoom, centerX, centerY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        touchStartDistanceRef.current = null;
      }
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Filter and position color tokens - only root colors (not derived from others)
  // Use filteredNodes if provided (from voice search), otherwise get all
  const colorNodes = useMemo(() => {
    const nodes = filteredNodes || graph.getNodes({ excludeSpecs: true });
    return nodes.filter((node) => {
      if (node.type !== "color") return false;

      // Check if this color is a root (not derived from another color)
      // A root color has a direct hex value, not a reference to another color
      const value = node.value[viewMode];
      if (!value) return false;

      // If value is a string starting with #, it's a root color
      if (typeof value === "string" && value.startsWith("#")) {
        return true;
      }

      // If value is an object with a reference (id), it's derived
      if (typeof value === "object" && "id" in value) {
        return false;
      }

      return false;
    });
  }, [graph, viewMode, filteredNodes]);

  const positionedColors = useMemo(() => {
    // First, extract all valid colors with their OKLCH values
    const colors: Array<{
      node: StyleNode;
      color: string;
      oklch: OKLCHColor;
      columnIndex?: number;
    }> = [];

    colorNodes.forEach((node) => {
      const resolved = graph.resolveNode(node.id, viewMode);
      if (
        !resolved ||
        typeof resolved !== "string" ||
        !resolved.startsWith("#")
      ) {
        return;
      }

      try {
        const oklch = hexToOKLCH(resolved);
        colors.push({ node, color: resolved, oklch });
      } catch (error) {
        console.warn(`Failed to convert color ${resolved}:`, error);
      }
    });

    // Data-driven approach:
    // 1. Find all unique hues (rounded to buckets for grouping similar hues)
    // 2. Each unique hue gets its own column (no gaps for missing hues)
    // 3. Colors with same hue stack vertically by lightness

    const HUE_BUCKET_SIZE = 5; // Group hues within 5 degrees together

    // Group colors by hue bucket
    type HueKey = string;
    const hueGroups = new Map<
      HueKey,
      Array<{
        node: StyleNode;
        color: string;
        oklch: OKLCHColor;
        effectiveHue: number;
      }>
    >();

    colors.forEach(({ node, color, oklch }) => {
      // Only truly achromatic colors (c < 0.005) go to grey column
      // This preserves warm/cool neutrals in their hue columns
      const isGrey = oklch.c < 0.005 || isNaN(oklch.h);
      const effectiveHue = isGrey ? -1 : oklch.h; // Greys get -1

      // Round hue to bucket
      const hueBucket = isGrey
        ? "grey"
        : Math.round(effectiveHue / HUE_BUCKET_SIZE) * HUE_BUCKET_SIZE;

      const key = String(hueBucket);

      if (!hueGroups.has(key)) {
        hueGroups.set(key, []);
      }

      hueGroups.get(key)!.push({
        node,
        color,
        oklch,
        effectiveHue,
      });
    });

    // Sort hue groups by hue (greys first, then by hue value)
    const sortedHueKeys = Array.from(hueGroups.keys()).sort((a, b) => {
      if (a === "grey") return -1;
      if (b === "grey") return 1;
      return Number(a) - Number(b);
    });

    // Now position colors with proper collision detection
    const positioned: PositionedColor[] = [];

    // Grid configuration
    const LIGHTNESS_BUCKET_SIZE = 0.1; // Snap to 10% lightness increments for grid-like feel
    const LIGHTNESS_GRID_HEIGHT = RECT_HEIGHT + RECT_SPACING; // Each lightness row height

    // Track occupied rectangles to prevent overlaps
    interface OccupiedRect {
      x: number;
      y: number;
      width: number;
      height: number;
    }
    const occupiedRects: OccupiedRect[] = [];

    // Helper function to check if two rectangles overlap
    const rectsOverlap = (
      rect1: OccupiedRect,
      rect2: OccupiedRect
    ): boolean => {
      return !(
        rect1.x + rect1.width <= rect2.x ||
        rect2.x + rect2.width <= rect1.x ||
        rect1.y + rect1.height <= rect2.y ||
        rect2.y + rect2.height <= rect1.y
      );
    };

    // Helper function to find a non-overlapping position
    // CRITICAL: Only moves vertically - never horizontally to preserve hue columns
    const findNonOverlappingPosition = (
      idealX: number,
      idealY: number,
      columnIndex: number
    ): { x: number; y: number } => {
      // Try the ideal position first
      let testRect: OccupiedRect = {
        x: idealX,
        y: idealY,
        width: RECT_WIDTH,
        height: RECT_HEIGHT,
      };

      if (!occupiedRects.some((rect) => rectsOverlap(rect, testRect))) {
        return { x: idealX, y: idealY };
      }

      // If ideal position is taken, search ONLY vertically
      // NEVER move horizontally to preserve hue columns
      // Try DECREASING Y first (toward bottom) to keep darker colors below
      for (let offset = 1; offset < 50; offset++) {
        // Try down first (decrease Y - toward bottom of screen)
        testRect = {
          x: idealX,
          y: idealY - offset * (RECT_HEIGHT + RECT_SPACING),
          width: RECT_WIDTH,
          height: RECT_HEIGHT,
        };
        if (
          testRect.y >= 0 &&
          !occupiedRects.some((rect) => rectsOverlap(rect, testRect))
        ) {
          return { x: idealX, y: testRect.y };
        }

        // Try up (increase Y - toward top of screen)
        testRect = {
          x: idealX,
          y: idealY + offset * (RECT_HEIGHT + RECT_SPACING),
          width: RECT_WIDTH,
          height: RECT_HEIGHT,
        };
        if (!occupiedRects.some((rect) => rectsOverlap(rect, testRect))) {
          return { x: idealX, y: testRect.y };
        }
      }

      // Fallback: stack it way below if we can't find a spot
      return {
        x: idealX,
        y: idealY + 50 * (RECT_HEIGHT + RECT_SPACING),
      };
    };

    sortedHueKeys.forEach((hueKey, columnIndex) => {
      const group = hueGroups.get(hueKey)!;

      // Sort this hue group by lightness (ascending - darkest at bottom)
      // Then by chroma (most saturated first for same lightness)
      group.sort((a, b) => {
        const lightnessDiff = a.oklch.l - b.oklch.l;
        if (Math.abs(lightnessDiff) > 0.01) return lightnessDiff;
        return b.oklch.c - a.oklch.c;
      });

      // Position each color based on its lightness bucket (snapped to grid)
      group.forEach((item) => {
        // Snap lightness to bucket for grid alignment
        const lightnessBucket = Math.round(
          item.oklch.l / LIGHTNESS_BUCKET_SIZE
        );

        // Ideal position based on hue column and snapped lightness
        // Add CANVAS_PADDING to offset from edges
        const idealX =
          CANVAS_PADDING + columnIndex * (RECT_WIDTH + RECT_SPACING);
        const idealY = CANVAS_PADDING + lightnessBucket * LIGHTNESS_GRID_HEIGHT;

        // Find a non-overlapping position
        const { x, y } = findNonOverlappingPosition(
          idealX,
          idealY,
          columnIndex
        );

        // Mark this position as occupied
        occupiedRects.push({
          x,
          y,
          width: RECT_WIDTH,
          height: RECT_HEIGHT,
        });

        positioned.push({
          node: item.node,
          color: item.color,
          oklch: item.oklch,
          x,
          y,
          columnIndex, // Store column index for animation
        });
      });
    });

    // VERIFICATION PASS: Fix any inverted lightness ordering within columns
    // WITHOUT destroying the grid-based Y positions
    const columnGroups = new Map<number, typeof positioned>();
    positioned.forEach((item) => {
      if (!columnGroups.has(item.x)) {
        columnGroups.set(item.x, []);
      }
      columnGroups.get(item.x)!.push(item);
    });

    // For each column, check and fix lightness ordering by swapping Y positions
    columnGroups.forEach((columnColors) => {
      // Multiple passes to bubble sort any inversions
      let swapped = true;
      let passes = 0;

      while (swapped && passes < 10) {
        swapped = false;

        // Sort by current Y position
        columnColors.sort((a, b) => a.y - b.y);

        for (let i = 0; i < columnColors.length - 1; i++) {
          const lower = columnColors[i]; // Lower Y (toward bottom)
          const upper = columnColors[i + 1]; // Higher Y (toward top)

          // If lower color is lighter than upper color, swap their Y positions
          if (lower.oklch.l > upper.oklch.l) {
            const tempY = lower.y;
            lower.y = upper.y;
            upper.y = tempY;

            // Update in positioned array
            const lowerIdx = positioned.findIndex(
              (p) => p.node.id === lower.node.id
            );
            const upperIdx = positioned.findIndex(
              (p) => p.node.id === upper.node.id
            );
            if (lowerIdx !== -1) positioned[lowerIdx].y = lower.y;
            if (upperIdx !== -1) positioned[upperIdx].y = upper.y;

            swapped = true;
          }
        }

        passes++;
      }
    });

    return positioned;
  }, [colorNodes, graph, viewMode, RECT_HEIGHT, RECT_WIDTH, RECT_SPACING]);

  // Handle filter transitions with smooth animations
  useEffect(() => {
    const isViewModeChange = prevViewModeRef.current !== viewMode;
    const isFilterChange = prevFilteredNodesRef.current !== filteredNodes;

    // Update previous viewMode
    prevViewModeRef.current = viewMode;

    if (positionedColors.length === 0) {
      // No colors to show - clear leaving colors and reset state
      setLeavingColors(new Map());
      setAnimateColors(false);
      prevPositionedColorsRef.current = new Map();
      prevFilteredNodesRef.current = filteredNodes;
      return;
    }

    // Initial load - do the pop-in animation (check this FIRST before anything else)
    // Only trigger once using the ref
    if (!hasInitialized && !hasTriggeredInitialAnimationRef.current) {
      hasTriggeredInitialAnimationRef.current = true;
      setAnimateColors(false);
      const timer = setTimeout(() => {
        setAnimateColors(true);
        // Mark as initialized AFTER animation completes (longest column delay + animation duration)
        // Max column index * delay + animation duration = last color finishes
        setTimeout(() => {
          setHasInitialized(true);
        }, 600 + 500); // 60ms * 10 columns + 500ms animation duration
      }, 50);
      return () => clearTimeout(timer);
    }

    // If we already triggered initial animation but not yet initialized, don't do anything
    if (!hasInitialized && hasTriggeredInitialAnimationRef.current) {
      return;
    }

    // If it's just a view mode change (light/dark toggle), don't animate
    if (isViewModeChange && !isFilterChange) {
      // Just keep everything visible without re-animating
      setAnimateColors(true);
      prevFilteredNodesRef.current = filteredNodes;
      return;
    }

    // Handle filter changes with smooth transitions
    if (isFilterChange) {
      const currentColorIds = new Set(positionedColors.map((c) => c.node.id));
      const previousColors = prevPositionedColorsRef.current;

      // Find colors that are leaving (were in previous, not in current)
      const newLeavingColors = new Map<string, PositionedColor>();

      // Check if we have previous positioned colors
      if (previousColors.size > 0) {
        previousColors.forEach((prevColor, id) => {
          if (!currentColorIds.has(id)) {
            // This color is leaving - add it for fade-out animation
            newLeavingColors.set(id, prevColor);
          }
        });
      }

      // Set leaving colors to trigger fade-out animation
      setLeavingColors(newLeavingColors);
      setIsFilterTransition(true);

      // Show current colors immediately with transition enabled
      setAnimateColors(true);

      // Clear leaving colors after animation completes
      const clearTimer = setTimeout(() => {
        setLeavingColors(new Map());
        setIsFilterTransition(false);
      }, 400); // Match CSS transition duration

      // Update previous filter reference
      prevFilteredNodesRef.current = filteredNodes;

      return () => clearTimeout(clearTimer);
    }

    // Default: show colors (only after initialization)
    setAnimateColors(true);
    prevFilteredNodesRef.current = filteredNodes;
  }, [positionedColors, viewMode, filteredNodes, graph, hasInitialized]);

  // Update previous positioned colors after each render
  useEffect(() => {
    const newPositions = new Map<string, PositionedColor>();
    positionedColors.forEach((color) => {
      newPositions.set(color.node.id, color);
    });
    prevPositionedColorsRef.current = newPositions;
  }, [positionedColors]);

  // Auto-select all filtered colors (only when autoSelectFiltered is true - for select_colors tool)
  useEffect(() => {
    // Only auto-select if explicitly requested (not for regular filter/search operations)
    if (!autoSelectFiltered) {
      // If flag was on but now off, and we had a selection from auto-select, keep it
      // but clear the internal flag
      if (shouldAutoSelectRef.current) {
        shouldAutoSelectRef.current = false;
      }
      return;
    }

    // When filteredNodes change, auto-select all of them
    if (filteredNodes && filteredNodes.length > 0) {
      const colorIds = new Set(filteredNodes.map((node) => node.id));
      setSelectedColors(colorIds);

      // Notify parent of selection
      if (onSelectNodes) {
        onSelectNodes(filteredNodes);
      }

      // Set flag to trigger on next change
      shouldAutoSelectRef.current = true;
    } else if (
      shouldAutoSelectRef.current &&
      (!filteredNodes || filteredNodes.length === 0)
    ) {
      // Clear selection when filter is cleared
      setSelectedColors(new Set());
      if (onSelectNodes) {
        onSelectNodes([]);
      }
      shouldAutoSelectRef.current = false;
    }
  }, [filteredNodes, onSelectNodes, autoSelectFiltered]);

  // Dynamically calculate canvas dimensions based on positioned colors
  const { CANVAS_WIDTH, CANVAS_HEIGHT } = useMemo(() => {
    if (positionedColors.length === 0) {
      return {
        CANVAS_WIDTH: 5000, // Huge default canvas for infinite feel
        CANVAS_HEIGHT: 5000,
      };
    }

    // Find the maximum extents (already includes CANVAS_PADDING on left/top)
    const maxX = Math.max(...positionedColors.map((c) => c.x + RECT_WIDTH));
    const maxY = Math.max(...positionedColors.map((c) => c.y + RECT_HEIGHT));

    // Add generous padding on all sides for infinite canvas feel
    const width = maxX + CANVAS_PADDING;
    const height = maxY + CANVAS_PADDING;

    return {
      CANVAS_WIDTH: width,
      CANVAS_HEIGHT: height,
    };
  }, [positionedColors, RECT_WIDTH, RECT_HEIGHT, CANVAS_PADDING]);

  // Calculate grid line positions (full grid across canvas)
  const { verticalGridLines, horizontalGridLines } = useMemo(() => {
    // Create a full grid across the entire canvas
    const GRID_SPACING = RECT_WIDTH + RECT_SPACING; // Match the column spacing

    const verticalLines: number[] = [];
    const horizontalLines: number[] = [];

    // Generate vertical grid lines across full canvas width
    for (
      let x = CANVAS_PADDING + RECT_WIDTH / 2;
      x < CANVAS_WIDTH - CANVAS_PADDING;
      x += GRID_SPACING
    ) {
      verticalLines.push(x);
    }

    // Generate horizontal grid lines across full canvas height
    const LIGHTNESS_GRID_HEIGHT = RECT_HEIGHT + RECT_SPACING;
    for (
      let y = CANVAS_PADDING + RECT_HEIGHT / 2;
      y < CANVAS_HEIGHT - CANVAS_PADDING;
      y += LIGHTNESS_GRID_HEIGHT
    ) {
      horizontalLines.push(y);
    }

    return {
      verticalGridLines: verticalLines,
      horizontalGridLines: horizontalLines,
    };
  }, [
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    RECT_WIDTH,
    RECT_HEIGHT,
    RECT_SPACING,
    CANVAS_PADDING,
  ]);

  // Calculate minimum zoom based on viewport width and track container dimensions
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateMinZoom = () => {
      // Update container dimensions
      const viewportWidth = container.clientWidth;
      const viewportHeight = container.clientHeight;
      setContainerWidth(viewportWidth);
      setContainerHeight(viewportHeight);

      // Calculate zoom that makes canvas width fit viewport width
      const calculatedMinZoom = viewportWidth / CANVAS_WIDTH;

      // Allow much smaller zoom for infinite canvas feel (0.05 instead of 0.1)
      const newMinZoom = Math.max(0.05, Math.min(1, calculatedMinZoom));

      setMinZoom(newMinZoom);

      // If current zoom is below new minimum, adjust it
      if (zoomRef.current < newMinZoom) {
        const canvas = canvasRef.current;
        if (canvas) {
          zoomRef.current = newMinZoom;
          canvas.style.transform = `scale(${newMinZoom})`;
          setZoom(newMinZoom);
        }
      }
    };

    // Update on mount and when canvas dimensions change
    updateMinZoom();

    // Update on window resize
    const resizeObserver = new ResizeObserver(updateMinZoom);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [CANVAS_WIDTH]);

  // Set default zoom on initial load and center the view
  // Also recenter when filters change
  useEffect(() => {
    const container = scrollContainerRef.current;
    const canvas = canvasRef.current;

    // Check if filter changed (applied or cleared)
    const filterChanged = prevFilteredNodesRef.current !== filteredNodes;
    const isInitialLoad = !hasInitialized;

    // Only run if:
    // 1. Initial load with colors available, OR
    // 2. Filter changed
    if (
      !container ||
      !canvas ||
      positionedColors.length === 0 ||
      (!isInitialLoad && !filterChanged)
    ) {
      return;
    }

    // Update previous filter reference
    prevFilteredNodesRef.current = filteredNodes;

    // Calculate zoom to fit all content in viewport with padding
    const padding = 40;
    const viewportWidth = container.clientWidth - padding * 2;
    const viewportHeight = container.clientHeight - padding * 2;

    const scaleX = viewportWidth / CANVAS_WIDTH;
    const scaleY = viewportHeight / CANVAS_HEIGHT;
    const fitZoom = Math.min(scaleX, scaleY);

    // Default to a more zoomed-in view (80% zoom or fit zoom, whichever is larger)
    // This gives a nice balanced view that's not too far out
    const defaultZoom = Math.max(
      minZoomRef.current,
      Math.min(Math.max(0.8, fitZoom * 1.2), MAX_ZOOM)
    );

    // Update zoom refs and DOM
    zoomRef.current = defaultZoom;
    canvas.style.transform = `scale(${defaultZoom})`;
    setZoom(defaultZoom);

    // Find the area with the most concentration (most occupied grid cells)
    const GRID_SIZE = 200; // Size of grid cells
    const SEARCH_RADIUS = 2; // Look at 5x5 grid (2 cells in each direction)

    // Mark which grid cells are occupied
    const occupiedCells = new Set<string>();
    const cellCenters = new Map<string, { x: number; y: number }>();

    positionedColors.forEach((color) => {
      const centerX = color.x + RECT_WIDTH / 2;
      // IMPORTANT: color.y is distance from BOTTOM, convert to distance from TOP
      const centerYFromTop = CANVAS_HEIGHT - color.y - RECT_HEIGHT / 2;

      const gridX = Math.floor(centerX / GRID_SIZE);
      const gridY = Math.floor(centerYFromTop / GRID_SIZE);
      const key = `${gridX},${gridY}`;

      occupiedCells.add(key);
      if (!cellCenters.has(key)) {
        cellCenters.set(key, {
          x: gridX * GRID_SIZE + GRID_SIZE / 2,
          y: gridY * GRID_SIZE + GRID_SIZE / 2,
        });
      }
    });

    // Find the region with the most occupied cells nearby (sliding window)
    let maxOccupiedCount = 0;
    let densestCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

    cellCenters.forEach((center, key) => {
      const [gx, gy] = key.split(",").map(Number);

      // Count occupied cells in the surrounding area
      let occupiedCount = 0;
      for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx++) {
        for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy++) {
          const neighborKey = `${gx + dx},${gy + dy}`;
          if (occupiedCells.has(neighborKey)) {
            occupiedCount++;
          }
        }
      }

      if (occupiedCount > maxOccupiedCount) {
        maxOccupiedCount = occupiedCount;
        densestCenter = center;
      }
    });

    console.log(
      "Initial view - Densest region at (from top):",
      densestCenter,
      "with",
      maxOccupiedCount,
      "occupied cells out of",
      occupiedCells.size,
      "total occupied cells",
      "Canvas size:",
      { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }
    );

    // Center the view on the densest cluster
    requestAnimationFrame(() => {
      if (!container) return;

      // Center horizontally on the densest cluster
      const scaledCenterX = densestCenter.x * defaultZoom;
      const centerScrollLeft = scaledCenterX - container.clientWidth / 2;

      // Center vertically on the densest cluster
      const scaledCenterY = densestCenter.y * defaultZoom;
      const centerScrollTop = scaledCenterY - container.clientHeight / 2;

      container.scrollLeft = Math.max(0, centerScrollLeft);
      container.scrollTop = Math.max(0, centerScrollTop);

      console.log("Centered view on densest cluster:", {
        left: container.scrollLeft,
        top: container.scrollTop,
        clusterCenter: densestCenter,
      });
    });

    // Don't mark as initialized here - let the animation effect handle it
    // This ensures animation completes before hasInitialized becomes true
  }, [
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    positionedColors.length,
    RECT_WIDTH,
    RECT_HEIGHT,
    filteredNodes, // Recenter when filter changes
    hasInitialized,
  ]);

  const handleColorClick = (color: PositionedColor, e?: React.MouseEvent) => {
    const isMultiSelect = e && (e.metaKey || e.ctrlKey || e.shiftKey);

    if (isMultiSelect) {
      // Multi-select mode: toggle this color in the selection
      setSelectedColors((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(color.node.id)) {
          newSet.delete(color.node.id);
        } else {
          newSet.add(color.node.id);
        }

        // Notify parent with full selection
        const selectedNodes = Array.from(newSet)
          .map((id) => positionedColors.find((c) => c.node.id === id)?.node)
          .filter(Boolean) as StyleNode[];
        onSelectNodes?.(selectedNodes);

        return newSet;
      });
    } else {
      // Single select mode: select only this color
      setSelectedColors(new Set([color.node.id]));
      onSelectNode?.(color.node);
      onSelectNodes?.([color.node]);
    }
  };

  const handleBackgroundClick = () => {
    // Don't deselect if we just panned or were selecting
    if (didPan || isSelecting || justFinishedSelectingRef.current) return;

    // Clicking on background deselects all
    setSelectedColors(new Set());
    onSelectNode?.(null);
    onSelectNodes?.([]);
  };

  // Check if rectangles intersect (for drag-to-select)
  const rectsIntersect = (
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): boolean => {
    return !(
      rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y
    );
  };

  // Selection handlers (panning is handled by trackpad)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle left mouse button
    if (e.button !== 0) return;

    // Color elements call stopPropagation(), so if we get here, we're not clicking a color
    // This means we should start drag selection

    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel any ongoing momentum animation
    if (momentumFrameRef.current) {
      cancelAnimationFrame(momentumFrameRef.current);
      momentumFrameRef.current = null;
    }
    velocityRef.current = { x: 0, y: 0 };

    // Start selection mode with drag (default behavior)
    const rect = canvas.getBoundingClientRect();
    const startX = (e.clientX - rect.left) / zoom;
    const startY = (e.clientY - rect.top) / zoom;

    // Clear the "just finished selecting" flag when starting a new selection
    justFinishedSelectingRef.current = false;

    setIsSelecting(true);
    setSelectionRect({ startX, startY, endX: startX, endY: startY });
    setDidPan(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Always track mouse position for zoom
    mousePositionRef.current = { x: e.clientX, y: e.clientY };

    if (!isSelecting) return;

    // Update selection rectangle
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas || !selectionRect) return;

    const rect = canvas.getBoundingClientRect();
    const endX = (e.clientX - rect.left) / zoom;
    const endY = (e.clientY - rect.top) / zoom;

    setSelectionRect((prev) => (prev ? { ...prev, endX, endY } : null));

    // Calculate which colors are in the selection rectangle
    const minX = Math.min(selectionRect.startX, endX);
    const maxX = Math.max(selectionRect.startX, endX);
    const minY = Math.min(selectionRect.startY, endY);
    const maxY = Math.max(selectionRect.startY, endY);

    const selectionBounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    // Find colors that intersect with selection rectangle
    // Get canvas height directly (offsetHeight returns CSS height, not scaled height)
    const canvasHeight = canvas.offsetHeight;

    const selectedIds = new Set<string>();
    positionedColors.forEach((color) => {
      const colorBounds = {
        x: color.x,
        y: canvasHeight - color.y - RECT_HEIGHT, // Convert from bottom-origin to top-origin
        width: RECT_WIDTH,
        height: RECT_HEIGHT,
      };

      if (rectsIntersect(selectionBounds, colorBounds)) {
        selectedIds.add(color.node.id);
      }
    });

    setSelectedColors(selectedIds);

    // Notify parent of selection change during drag
    const selectedNodes = Array.from(selectedIds)
      .map((id) => positionedColors.find((c) => c.node.id === id)?.node)
      .filter(Boolean) as StyleNode[];
    onSelectNodes?.(selectedNodes);
  };

  const handleMouseUp = () => {
    if (isSelecting) {
      // Finalize the selection before clearing the rectangle
      // This ensures we capture the final state even if mouse didn't move much
      if (selectionRect) {
        const canvas = canvasRef.current;
        if (canvas) {
          // Get canvas height directly (offsetHeight returns CSS height, not scaled height)
          const canvasHeight = canvas.offsetHeight;

          const minX = Math.min(selectionRect.startX, selectionRect.endX);
          const maxX = Math.max(selectionRect.startX, selectionRect.endX);
          const minY = Math.min(selectionRect.startY, selectionRect.endY);
          const maxY = Math.max(selectionRect.startY, selectionRect.endY);

          const selectionBounds = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          };

          // Find colors that intersect with selection rectangle
          const selectedIds = new Set<string>();
          positionedColors.forEach((color) => {
            const colorBounds = {
              x: color.x,
              y: canvasHeight - color.y - RECT_HEIGHT,
              width: RECT_WIDTH,
              height: RECT_HEIGHT,
            };

            if (rectsIntersect(selectionBounds, colorBounds)) {
              selectedIds.add(color.node.id);
            }
          });

          // Update selection state
          setSelectedColors(selectedIds);

          // Notify parent
          const selectedNodes = Array.from(selectedIds)
            .map((id) => positionedColors.find((c) => c.node.id === id)?.node)
            .filter(Boolean) as StyleNode[];
          onSelectNodes?.(selectedNodes);
        }
      }

      // Mark that we just finished selecting to prevent handleBackgroundClick from clearing
      justFinishedSelectingRef.current = true;
      setTimeout(() => {
        justFinishedSelectingRef.current = false;
      }, 100);

      // End selection mode
      setIsSelecting(false);
      setSelectionRect(null);
      return;
    }

    // Reset didPan to ensure clicks work
    setDidPan(false);
  };

  const handleMouseLeave = () => {
    if (isSelecting) {
      // Finalize the selection before ending
      if (selectionRect) {
        const canvas = canvasRef.current;
        if (canvas) {
          // Get canvas height directly (offsetHeight returns CSS height, not scaled height)
          const canvasHeight = canvas.offsetHeight;

          const minX = Math.min(selectionRect.startX, selectionRect.endX);
          const maxX = Math.max(selectionRect.startX, selectionRect.endX);
          const minY = Math.min(selectionRect.startY, selectionRect.endY);
          const maxY = Math.max(selectionRect.startY, selectionRect.endY);

          const selectionBounds = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          };

          const selectedIds = new Set<string>();
          positionedColors.forEach((color) => {
            const colorBounds = {
              x: color.x,
              y: canvasHeight - color.y - RECT_HEIGHT,
              width: RECT_WIDTH,
              height: RECT_HEIGHT,
            };

            if (rectsIntersect(selectionBounds, colorBounds)) {
              selectedIds.add(color.node.id);
            }
          });

          setSelectedColors(selectedIds);

          const selectedNodes = Array.from(selectedIds)
            .map((id) => positionedColors.find((c) => c.node.id === id)?.node)
            .filter(Boolean) as StyleNode[];
          onSelectNodes?.(selectedNodes);
        }
      }

      // Mark that we just finished selecting
      justFinishedSelectingRef.current = true;
      setTimeout(() => {
        justFinishedSelectingRef.current = false;
      }, 100);

      setIsSelecting(false);
      setSelectionRect(null);
    }
    setDidPan(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const newZoom = zoomRef.current * 1.25; // Faster zoom increment

    // Zoom to mouse position if available, otherwise center of viewport
    const rect = container.getBoundingClientRect();
    const centerX = mousePositionRef.current.x || rect.left + rect.width / 2;
    const centerY = mousePositionRef.current.y || rect.top + rect.height / 2;

    zoomToPoint(newZoom, centerX, centerY, true); // immediate = true for button clicks
  };

  const handleZoomOut = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const newZoom = zoomRef.current / 1.25; // Faster zoom decrement

    // Zoom to mouse position if available, otherwise center of viewport
    const rect = container.getBoundingClientRect();
    const centerX = mousePositionRef.current.x || rect.left + rect.width / 2;
    const centerY = mousePositionRef.current.y || rect.top + rect.height / 2;

    zoomToPoint(newZoom, centerX, centerY, true); // immediate = true for button clicks
  };

  const handleZoomToFit = () => {
    const container = scrollContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const padding = 40;
    const viewportWidth = container.clientWidth - padding * 2;
    const viewportHeight = container.clientHeight - padding * 2;

    const scaleX = viewportWidth / CANVAS_WIDTH;
    const scaleY = viewportHeight / CANVAS_HEIGHT;

    // Clamp to min zoom
    const fitZoom = Math.max(
      minZoomRef.current,
      Math.min(scaleX, scaleY, MAX_ZOOM)
    );

    // Update zoom refs and DOM
    zoomRef.current = fitZoom;
    canvas.style.transform = `scale(${fitZoom})`;
    setZoom(fitZoom);

    // Center the view
    requestAnimationFrame(() => {
      if (!container) return;
      const scaledWidth = CANVAS_WIDTH * fitZoom;
      const scaledHeight = CANVAS_HEIGHT * fitZoom;

      const centerScrollLeft = (scaledWidth - container.clientWidth) / 2;
      const centerScrollTop = (scaledHeight - container.clientHeight) / 2;

      container.scrollLeft = Math.max(0, centerScrollLeft);
      container.scrollTop = Math.max(0, centerScrollTop);
    });
  };

  const handleZoomReset = () => {
    const container = scrollContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    zoomToPoint(1, centerX, centerY, true);
  };

  return (
    <div className="w-full h-full bg-white px-12 pt-4 pb-8 flex flex-col">
      {/* Filter Banner */}
      {filteredNodes && (
        <div className="mb-6 bg-white border border-dark-200 rounded-lg shadow-sm shrink-0">
          <div className="flex items-center justify-between py-2.5 px-6">
            <div className="flex items-center gap-3">
              <svg
                className="w-4 h-4 text-dark-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-dark-700">
                  Filtered:
                </span>
                <span className="text-sm text-dark-600">
                  {colorNodes.length} color{colorNodes.length !== 1 ? "s" : ""}{" "}
                  found
                </span>
              </div>
            </div>
            {onClearFilter && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFilter();
                }}
                className="px-3 py-1.5 text-xs font-medium text-dark-600 hover:text-dark-900 hover:bg-dark-100 rounded-md transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bordered canvas container */}
      <div className="flex-1 border border-dark-200 rounded-2xl overflow-hidden bg-white min-h-0">
        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-auto relative bg-white select-none"
          style={{ cursor: isSelecting ? "crosshair" : "default" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={canvasRef}
            className="bg-white relative inline-block origin-top-left"
            onClick={handleBackgroundClick}
            onDragStart={(e) => e.preventDefault()}
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Grid lines through centers of colors */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Vertical grid lines (hue columns) */}
              {verticalGridLines.map((x, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute top-0 bottom-0 border-l border-dark-50/5"
                  style={{ left: `${x}px` }}
                />
              ))}

              {/* Horizontal grid lines (lightness rows) */}
              {horizontalGridLines.map((y, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute left-0 right-0 border-t border-dark-50/5"
                  style={{ bottom: `${y}px` }}
                />
              ))}
            </div>

            {/* Coordinate lines - appear on hover */}
            {hoveredColor && (
              <>
                {/* Vertical line (hue axis) */}
                <div
                  className="absolute top-0 bottom-0 w-[1px] bg-black/20 pointer-events-none animate-fade-in"
                  style={{
                    left: `${hoveredColor.x + RECT_WIDTH / 2}px`,
                  }}
                />

                {/* Horizontal line (lightness axis) */}
                <div
                  className="absolute left-0 right-0 h-[1px] bg-black/20 pointer-events-none animate-fade-in"
                  style={{
                    bottom: `${hoveredColor.y + RECT_HEIGHT / 2}px`,
                  }}
                />
              </>
            )}

            {/* Selection rectangle */}
            {isSelecting && selectionRect && (
              <div
                className="absolute pointer-events-none border-2 border-blue-500 bg-blue-500/10 animate-fade-in"
                style={{
                  left: `${Math.min(
                    selectionRect.startX,
                    selectionRect.endX
                  )}px`,
                  top: `${Math.min(
                    selectionRect.startY,
                    selectionRect.endY
                  )}px`,
                  width: `${Math.abs(
                    selectionRect.endX - selectionRect.startX
                  )}px`,
                  height: `${Math.abs(
                    selectionRect.endY - selectionRect.startY
                  )}px`,
                }}
              />
            )}

            {/* Leaving colors (fade out with random delays) */}
            {Array.from(leavingColors.values()).map((color) => {
              const borderRadius = getColorBorderRadius(color.oklch, false);

              // Random delay between 0-200ms for organic fade-out
              const randomDelay = Math.random() * 200;

              return (
                <div
                  key={`leaving-${color.node.id}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${color.x}px`,
                    bottom: `${color.y}px`,
                    opacity: 0,
                    transform: "scale(0.8)",
                    transition: `opacity 0.3s ease-out ${randomDelay}ms, transform 0.3s ease-out ${randomDelay}ms`,
                  }}
                >
                  <div
                    style={{
                      width: `${RECT_WIDTH}px`,
                      height: `${RECT_HEIGHT}px`,
                      backgroundColor: color.color,
                      borderRadius,
                    }}
                  />
                </div>
              );
            })}

            {/* Color rectangles - each unique hue in its own column */}
            {positionedColors.map((color, index) => {
              const isHovered = hoveredColor?.node.id === color.node.id;
              const isSelected = selectedColors.has(color.node.id);

              // Calculate dynamic border radius based on chroma
              // Low chroma (greys) = circular, High chroma (saturated) = rectangular
              const borderRadius = getColorBorderRadius(color.oklch, isHovered);

              // Calculate animation delay based on column index
              // Stagger from left to right (only for initial load)
              const animationDelay =
                color.columnIndex !== undefined && !hasInitialized
                  ? `${color.columnIndex * 60}ms`
                  : "0ms";

              // Use smooth transitions for filter changes, pop-in animation for initial load
              const useTransition = isFilterTransition || hasInitialized;

              // Staggered transition delay for filter changes (slight delay per color)
              const transitionDelay = isFilterTransition ? index * 8 : 0; // 8ms stagger per color

              return (
                <div
                  key={color.node.id}
                  className={`absolute ${
                    !useTransition && animateColors ? "animate-pop-in" : ""
                  }`}
                  style={{
                    left: `${color.x}px`,
                    bottom: `${color.y}px`,
                    animationDelay,
                    // Smooth transitions for position changes during filter
                    ...(useTransition && {
                      transition: `left 0.4s ease-out ${transitionDelay}ms, bottom 0.4s ease-out ${transitionDelay}ms, opacity 0.4s ease-out ${transitionDelay}ms`,
                      opacity: animateColors ? 1 : 0,
                    }),
                    // Start completely hidden for initial load animation
                    ...(!useTransition &&
                      !animateColors && {
                        opacity: 0,
                        transform: "scale(0.7)",
                      }),
                    pointerEvents: "auto",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorClick(color, e);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDidPan(false);
                  }}
                >
                  <div
                    style={{
                      width: `${RECT_WIDTH}px`,
                      height: `${RECT_HEIGHT}px`,
                      backgroundColor: color.color,
                      border: isSelected ? "3px solid #3B82F6" : "none",
                      borderRadius,
                      transform: isHovered ? "scale(1.1)" : "scale(1)",
                      transition:
                        "transform 0.2s ease-out, border-radius 0.2s ease-out, opacity 0.2s ease-out, background-color 0.2s ease-out, border 0.15s ease-out",
                      zIndex: isHovered || isSelected ? 20 : 10,
                      boxShadow: isSelected
                        ? "0 0 0 1px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(59, 130, 246, 0.25)"
                        : "none",
                      cursor: "pointer",
                      opacity: 1,
                      pointerEvents: "auto",
                      position: "relative",
                    }}
                    onMouseEnter={() => setHoveredColor(color)}
                    onMouseLeave={() => setHoveredColor(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorClick(color, e);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDidPan(false);
                    }}
                  >
                    {color.node.metadata?.isSeed && (
                      <div
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                          border: "2px solid white",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1,
                        }}
                        title="Seed color"
                      >
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 20 20"
                          fill="white"
                          style={{ opacity: 0.95 }}
                        >
                          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Enhanced info card on hover */}
            {hoveredColor &&
              (() => {
                // Card dimensions (approximate)
                const CARD_WIDTH = 220;
                const CARD_HEIGHT = 180;
                const GAP = 20; // Gap between color and card

                // Calculate color center position
                const colorCenterY = hoveredColor.y + RECT_HEIGHT / 2;

                // Smart positioning to avoid canvas edges
                // Try right first, then left
                const spaceOnRight =
                  CANVAS_WIDTH - (hoveredColor.x + RECT_WIDTH);
                const spaceOnLeft = hoveredColor.x;
                const shouldFlipHorizontal =
                  spaceOnRight < CARD_WIDTH + GAP &&
                  spaceOnLeft >= CARD_WIDTH + GAP;

                // Calculate horizontal position
                const left = shouldFlipHorizontal
                  ? hoveredColor.x - CARD_WIDTH - GAP
                  : hoveredColor.x + RECT_WIDTH + GAP;

                // Calculate vertical position (centered on color)
                // Using transform to center perfectly
                const bottom = colorCenterY;

                return (
                  <div
                    className="absolute z-30 bg-white border border-dark-300 rounded-lg shadow-xl pointer-events-none animate-fade-in"
                    style={{
                      left: `${left}px`,
                      bottom: `${bottom}px`,
                      transform: "translateY(50%)",
                      minWidth: `${CARD_WIDTH}px`,
                    }}
                  >
                    <div className="p-3">
                      {/* Color name and hex */}
                      <div className="mb-3 pb-2.5 border-b border-dark-200">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-dark-900 text-sm">
                            {hoveredColor.node.name}
                          </div>
                          {hoveredColor.node.metadata?.isSeed && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <svg
                                className="w-2.5 h-2.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                              </svg>
                              SEED
                            </span>
                          )}
                        </div>
                        <code className="text-xs font-mono text-dark-600">
                          {hoveredColor.color.toUpperCase()}
                        </code>
                      </div>

                      {/* OKLCH specs */}
                      <div className="space-y-1.5 text-xs mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-dark-500">Lightness</span>
                          <span className="font-mono text-dark-800 font-medium">
                            {hoveredColor.oklch.l.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-dark-500">Chroma</span>
                          <span className="font-mono text-dark-800 font-medium">
                            {hoveredColor.oklch.c.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-dark-500">Hue</span>
                          <span className="font-mono text-dark-800 font-medium">
                            {isNaN(hoveredColor.oklch.h)
                              ? "0°"
                              : `${Math.round(hoveredColor.oklch.h)}°`}
                          </span>
                        </div>
                      </div>

                      {/* Derived colors count */}
                      <div className="pt-2.5 border-t border-dark-200 mb-2.5">
                        <div className="flex items-center gap-2 text-xs">
                          <svg
                            className="w-4 h-4 text-dark-400 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          <span className="text-dark-700">
                            <span className="font-medium">
                              {hoveredColor.node.dependents.size}
                            </span>{" "}
                            derived color
                            {hoveredColor.node.dependents.size !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Layer badge */}
                      <div>
                        <span className="inline-block px-2 py-0.5 text-[11px] rounded-full bg-dark-100 text-dark-600 font-medium capitalize">
                          {hoveredColor.node.layer}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>

          {/* Keyboard shortcuts handler */}
          {(() => {
            useEffect(() => {
              const handleKeyDown = (e: KeyboardEvent) => {
                // Escape to clear selection
                if (e.key === "Escape") {
                  setSelectedColors(new Set());
                  onSelectNode?.(null);
                  onSelectNodes?.([]);
                }
                // Cmd/Ctrl+A to select all visible colors
                if ((e.metaKey || e.ctrlKey) && e.key === "a") {
                  e.preventDefault();
                  const allIds = new Set(
                    positionedColors.map((c) => c.node.id)
                  );
                  setSelectedColors(allIds);

                  // Notify parent
                  const allNodes = positionedColors.map((c) => c.node);
                  onSelectNodes?.(allNodes);
                }
              };

              window.addEventListener("keydown", handleKeyDown);
              return () => window.removeEventListener("keydown", handleKeyDown);
            }, [positionedColors.length]);

            return null;
          })()}

          {/* Selection panel - handles both single and multi-selection */}
          <ColorSelectionPanel
            selectedColors={selectedColors}
            positionedColors={positionedColors}
            graph={graph}
            viewMode={viewMode}
            onClearSelection={() => {
              setSelectedColors(new Set());
              onSelectNode?.(null);
              onSelectNodes?.([]);
            }}
            onRemoveColor={(colorId) => {
              setSelectedColors((prev) => {
                const newSet = new Set(prev);
                newSet.delete(colorId);
                return newSet;
              });
            }}
            onSelectNode={onSelectNode}
            onSelectNodes={onSelectNodes}
            getColorBorderRadius={getColorBorderRadius}
          />

          {/* Instructions overlay */}
          {/* <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-sm border border-dark-200 rounded-lg shadow-lg px-4 py-2 text-xs text-dark-600 pointer-events-none">
        <div className="flex items-center gap-4">
          <span>🖱️ Drag to select</span>
          <span>·</span>
          <span>🤏 Trackpad to pan/zoom</span>
          <span>·</span>
          <span>⌘/Ctrl + click to multi-select</span>
          <span>·</span>
          <span>Esc to clear</span>
        </div>
      </div> */}

          {/* Zoom controls */}
          {/* <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="bg-white/90 backdrop-blur-sm border border-dark-200 rounded-lg px-3 py-2 text-sm text-dark-700 hover:bg-white hover:border-dark-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:border-dark-200"
          title={
            zoom >= MAX_ZOOM ? `Maximum zoom (${MAX_ZOOM * 100}%)` : "Zoom In"
          }
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          disabled={zoom <= minZoom}
          className="bg-white/90 backdrop-blur-sm border border-dark-200 rounded-lg px-3 py-2 text-sm text-dark-700 hover:bg-white hover:border-dark-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:border-dark-200"
          title={
            zoom <= minZoom
              ? `Minimum zoom (${Math.round(minZoom * 100)}%)`
              : "Zoom Out"
          }
        >
          −
        </button>
        <button
          onClick={handleZoomToFit}
          className="bg-white/90 backdrop-blur-sm border border-dark-200 rounded-lg px-3 py-2 text-xs text-dark-700 hover:bg-white hover:border-dark-300 transition-all shadow-sm"
          title="Zoom to Fit"
        >
          Fit
        </button>
        <button
          onClick={handleZoomReset}
          className="bg-white/90 backdrop-blur-sm border border-dark-200 rounded-lg px-3 py-2 text-xs text-dark-700 hover:bg-white hover:border-dark-300 transition-all shadow-sm"
          title="Reset Zoom (100%)"
        >
          100%
        </button>
      </div> */}
        </div>
      </div>
    </div>
  );
};
