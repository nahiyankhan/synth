/**
 * CanvasWrapper - Figma-like canvas with pan and zoom
 *
 * Unified canvas wrapper supporting both simple children and virtualized render patterns.
 *
 * Provides:
 * - Pan with mouse drag or trackpad
 * - Zoom with scroll wheel or pinch gesture
 * - Mac trackpad gesture support
 * - Optional transform state exposure for virtualization
 *
 * @example Simple usage:
 * ```tsx
 * <CanvasWrapper>
 *   <YourContent />
 * </CanvasWrapper>
 * ```
 *
 * @example Virtualized usage:
 * ```tsx
 * <CanvasWrapper>
 *   {(transform) => <VirtualizedContent transform={transform} />}
 * </CanvasWrapper>
 * ```
 */

import React, { useRef, useState, useCallback, useEffect } from "react";

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

type CanvasChildren = React.ReactNode | ((transform: Transform) => React.ReactNode);

interface CanvasWrapperProps {
  children: CanvasChildren;
}

/**
 * Unified canvas wrapper supporting both simple and virtualized patterns
 */
export const CanvasWrapperWithVirtualization: React.FC<CanvasWrapperProps> = ({
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  });

  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);

  // Reset view
  const handleReset = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      setTransform({
        x: Math.max(50, (containerWidth - 1200) / 2),
        y: 50,
        scale: 1,
      });
    }
  }, []);

  // Zoom in
  const handleZoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(5, prev.scale * 1.2),
    }));
  }, []);

  // Zoom out
  const handleZoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.1, prev.scale / 1.2),
    }));
  }, []);

  // Center content on initial load
  useEffect(() => {
    if (!initialized && containerRef.current && contentRef.current) {
      handleReset();
      setInitialized(true);
    }
  }, [initialized, handleReset]);

  // Handle keyboard for space key and shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space key for panning
      if (e.code === "Space" && !isSpacePressed) {
        setIsSpacePressed(true);
        e.preventDefault();
      }

      // Cmd/Ctrl + 0 to reset zoom
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        handleReset();
        e.preventDefault();
      }

      // Cmd/Ctrl + Plus to zoom in
      if ((e.metaKey || e.ctrlKey) && (e.key === "+" || e.key === "=")) {
        handleZoomIn();
        e.preventDefault();
      }

      // Cmd/Ctrl + Minus to zoom out
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        handleZoomOut();
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed, handleReset, handleZoomIn, handleZoomOut]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Pan with middle mouse button or space + left click
      if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
        setIsPanning(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        e.preventDefault();
      }
    },
    [isSpacePressed]
  );

  // Handle mouse move for panning
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setTransform((prev) => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isPanning, dragStart]
  );

  // Handle mouse up to stop panning
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle wheel for panning and zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    // Detect pinch gesture (ctrlKey is set on Mac trackpad pinch)
    const isPinch = e.ctrlKey;

    if (isPinch) {
      // Pinch to zoom
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomDelta = -e.deltaY * 0.01;

      setTransform((prev) => {
        const newScale = Math.max(
          0.1,
          Math.min(5, prev.scale * (1 + zoomDelta))
        );

        // Zoom towards mouse position
        const scaleDiff = newScale - prev.scale;
        const newX = prev.x - (mouseX - prev.x) * (scaleDiff / prev.scale);
        const newY = prev.y - (mouseY - prev.y) * (scaleDiff / prev.scale);

        return {
          x: newX,
          y: newY,
          scale: newScale,
        };
      });
    } else {
      // Regular scroll to pan
      setTransform((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isPanning) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // Add wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  // Render children - supports both ReactNode and render function patterns
  const renderChildren = () => {
    if (typeof children === "function") {
      return children(transform);
    }
    return children;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseDown={handleMouseDown}
      style={{
        cursor: isPanning ? "grabbing" : isSpacePressed ? "grab" : "default",
        backgroundColor: "#E5E5E5",
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      }}
    >
      {/* Canvas content */}
      <div
        ref={contentRef}
        className="inline-block"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
          transition: isPanning ? "none" : "transform 0.1s ease-out",
          willChange: "transform",
          minWidth: "1200px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        {renderChildren()}
      </div>

      {/* Canvas controls */}
      <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-2 bg-white border border-dark-200 rounded-lg shadow-lg p-2">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-dark-100 rounded transition-colors"
          title="Zoom In (⌘+)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        <button
          onClick={handleReset}
          className="p-2 hover:bg-dark-100 rounded transition-colors text-xs font-light"
          title="Reset View (⌘0)"
        >
          {Math.round(transform.scale * 100)}%
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-dark-100 rounded transition-colors"
          title="Zoom Out (⌘−)"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * @deprecated Use CanvasWrapperWithVirtualization instead
 * Alias for backwards compatibility
 */
export const CanvasWrapper = CanvasWrapperWithVirtualization;
