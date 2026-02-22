/**
 * useCanvasView Hook
 * 
 * Reusable canvas interaction logic for all view components.
 * Handles pan, zoom, scroll, hover, and selection states.
 */

import { useState, useCallback, useRef, RefObject } from 'react';

export interface CanvasItem {
  x: number;
  y: number;
  [key: string]: any;
}

export interface UseCanvasViewOptions<T extends CanvasItem> {
  items: T[];
  containerRef: RefObject<HTMLDivElement>;
  initialCenter?: { x: number; y: number };
  onSelect?: (item: T | null) => void;
}

export interface UseCanvasViewReturn<T extends CanvasItem> {
  // State
  isPanning: boolean;
  hoveredItem: T | null;
  selectedItem: T | null;
  
  // Actions
  setHoveredItem: (item: T | null) => void;
  setSelectedItem: (item: T | null) => void;
  scrollToCenter: (center: { x: number; y: number }) => void;
  
  // Event handlers
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
}

/**
 * Hook for canvas-based view interactions
 */
export function useCanvasView<T extends CanvasItem>({
  items,
  containerRef,
  initialCenter,
  onSelect,
}: UseCanvasViewOptions<T>): UseCanvasViewReturn<T> {
  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startScroll, setStartScroll] = useState({ left: 0, top: 0 });
  
  // Interaction state
  const [hoveredItem, setHoveredItem] = useState<T | null>(null);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  
  // Track if we actually panned (to distinguish click vs drag)
  const hasPanned = useRef(false);

  /**
   * Scroll canvas to center on a specific point
   */
  const scrollToCenter = useCallback((center: { x: number; y: number }) => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate scroll position to center the point
    const scrollLeft = center.x - containerWidth / 2;
    const scrollTop = center.y - containerHeight / 2;

    container.scrollTo({
      left: scrollLeft,
      top: scrollTop,
      behavior: 'smooth',
    });
  }, [containerRef]);

  /**
   * Start panning
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan on left click, and not if clicking on an interactive element
    if (e.button !== 0) return;
    
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) return;

    const container = containerRef.current;
    if (!container) return;

    setIsPanning(true);
    hasPanned.current = false;
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartScroll({
      left: container.scrollLeft,
      top: container.scrollTop,
    });

    // Prevent text selection while panning
    e.preventDefault();
  }, [containerRef]);

  /**
   * Pan the canvas
   */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;

    const container = containerRef.current;
    if (!container) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    // Mark as panned if moved more than 5px
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasPanned.current = true;
    }

    container.scrollLeft = startScroll.left - deltaX;
    container.scrollTop = startScroll.top - deltaY;
  }, [isPanning, startPos, startScroll, containerRef]);

  /**
   * Stop panning
   */
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  /**
   * Stop panning when mouse leaves
   */
  const handleMouseLeave = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  /**
   * Update selected item and call callback
   */
  const selectItem = useCallback((item: T | null) => {
    setSelectedItem(item);
    if (onSelect) {
      onSelect(item);
    }
  }, [onSelect]);

  return {
    // State
    isPanning,
    hoveredItem,
    selectedItem,
    
    // Actions
    setHoveredItem,
    setSelectedItem: selectItem,
    scrollToCenter,
    
    // Event handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  };
}



