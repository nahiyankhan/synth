/**
 * Canvas Interaction Hook
 *
 * Handles pan, zoom, hover detection, and click events on the canvas.
 * Includes inertia for smooth pan deceleration.
 */

import { useState, useRef, useCallback, useEffect, RefObject, MouseEvent, WheelEvent } from "react";
import {
  AnimatingNode,
  MIN_SCALE,
  MAX_SCALE,
  CLICK_THRESHOLD,
  NODE_HEIGHT,
  FONT_SIZE,
} from "./types";
import { getNodeDimensions } from "./utils";

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface Velocity {
  x: number;
  y: number;
}

export function useCanvasInteraction(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  nodes: AnimatingNode[],
  onNodeClick: (nodeId: string | null) => void,
  getNodePosition: (node: AnimatingNode) => { x: number; y: number }
): {
  transform: Transform;
  hoveredNodeId: string | null;
  isDragging: boolean;
  handleMouseDown: (e: MouseEvent) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: (e: MouseEvent) => void;
  handleMouseLeave: () => void;
  handleWheel: (e: WheelEvent) => void;
} {
  const [transform, setTransform] = useState<Transform>({
    x: 50,
    y: 50,
    scale: 1,
  });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for drag state
  const dragStart = useRef({ x: 0, y: 0 });
  const transformStart = useRef({ x: 0, y: 0 });
  const totalDragDistance = useRef(0);
  const isMouseDown = useRef(false);

  // Inertia state
  const velocity = useRef<Velocity>({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastMoveTime = useRef(0);
  const inertiaFrame = useRef<number | null>(null);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - transform.x) / transform.scale;
      const y = (screenY - rect.top - transform.y) / transform.scale;
      return { x, y };
    },
    [transform, canvasRef]
  );

  // Hit test: find node at canvas position
  const hitTestNode = useCallback(
    (canvasX: number, canvasY: number): string | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Test nodes in reverse order (top-most first)
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const pos = getNodePosition(node);
        const { width } = getNodeDimensions(ctx, node.name, FONT_SIZE);

        if (
          canvasX >= pos.x &&
          canvasX <= pos.x + width &&
          canvasY >= pos.y &&
          canvasY <= pos.y + NODE_HEIGHT
        ) {
          return node.id;
        }
      }

      return null;
    },
    [nodes, canvasRef, getNodePosition]
  );

  // Inertia animation
  const applyInertia = useCallback(() => {
    const friction = 0.95;
    const minVelocity = 0.5;

    velocity.current.x *= friction;
    velocity.current.y *= friction;

    if (
      Math.abs(velocity.current.x) < minVelocity &&
      Math.abs(velocity.current.y) < minVelocity
    ) {
      velocity.current = { x: 0, y: 0 };
      inertiaFrame.current = null;
      return;
    }

    setTransform((prev) => ({
      ...prev,
      x: prev.x + velocity.current.x,
      y: prev.y + velocity.current.y,
    }));

    inertiaFrame.current = requestAnimationFrame(applyInertia);
  }, []);

  // Clean up inertia on unmount
  useEffect(() => {
    return () => {
      if (inertiaFrame.current) {
        cancelAnimationFrame(inertiaFrame.current);
      }
    };
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Cancel any inertia
    if (inertiaFrame.current) {
      cancelAnimationFrame(inertiaFrame.current);
      inertiaFrame.current = null;
    }
    velocity.current = { x: 0, y: 0 };

    isMouseDown.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    transformStart.current = { x: transform.x, y: transform.y };
    totalDragDistance.current = 0;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    lastMoveTime.current = performance.now();
  }, [transform.x, transform.y]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const now = performance.now();

      if (isMouseDown.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        totalDragDistance.current = Math.sqrt(dx * dx + dy * dy);

        if (totalDragDistance.current > CLICK_THRESHOLD) {
          setIsDragging(true);

          // Calculate velocity for inertia
          const timeDelta = now - lastMoveTime.current;
          if (timeDelta > 0) {
            velocity.current = {
              x: (e.clientX - lastMousePos.current.x) / timeDelta * 16,
              y: (e.clientY - lastMousePos.current.y) / timeDelta * 16,
            };
          }

          setTransform((prev) => ({
            ...prev,
            x: transformStart.current.x + dx,
            y: transformStart.current.y + dy,
          }));
        }

        lastMousePos.current = { x: e.clientX, y: e.clientY };
        lastMoveTime.current = now;
      } else {
        // Hover detection
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        const nodeId = hitTestNode(canvasPos.x, canvasPos.y);
        setHoveredNodeId(nodeId);
      }
    },
    [screenToCanvas, hitTestNode]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isMouseDown.current) return;

      isMouseDown.current = false;

      if (totalDragDistance.current <= CLICK_THRESHOLD) {
        // This was a click, not a drag
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        const nodeId = hitTestNode(canvasPos.x, canvasPos.y);
        onNodeClick(nodeId);
      } else {
        // Apply inertia after drag
        if (
          Math.abs(velocity.current.x) > 1 ||
          Math.abs(velocity.current.y) > 1
        ) {
          inertiaFrame.current = requestAnimationFrame(applyInertia);
        }
      }

      setIsDragging(false);
    },
    [screenToCanvas, hitTestNode, onNodeClick, applyInertia]
  );

  const handleMouseLeave = useCallback(() => {
    if (isMouseDown.current) {
      isMouseDown.current = false;
      setIsDragging(false);

      // Apply inertia when leaving canvas while dragging
      if (
        Math.abs(velocity.current.x) > 1 ||
        Math.abs(velocity.current.y) > 1
      ) {
        inertiaFrame.current = requestAnimationFrame(applyInertia);
      }
    }
    setHoveredNodeId(null);
  }, [applyInertia]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Only zoom with Cmd (Mac) or Ctrl (Windows/Linux) or Alt
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        // Regular scroll = pan
        setTransform((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
        return;
      }

      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom toward cursor
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, transform.scale * zoomFactor)
      );

      // Adjust position to zoom toward cursor
      const scaleDiff = newScale / transform.scale;
      const newX = mouseX - (mouseX - transform.x) * scaleDiff;
      const newY = mouseY - (mouseY - transform.y) * scaleDiff;

      setTransform({
        x: newX,
        y: newY,
        scale: newScale,
      });
    },
    [transform, canvasRef]
  );

  return {
    transform,
    hoveredNodeId,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
  };
}
