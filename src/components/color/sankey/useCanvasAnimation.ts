/**
 * Canvas Animation Hook
 *
 * Manages node position animations and link draw-in animations.
 * Tracks previous positions to detect moved/new nodes.
 */

import { useState, useRef, useEffect, useCallback, MutableRefObject } from "react";
import {
  SankeyNode,
  AnimatingNode,
  NodePosition,
  NODE_ANIMATION_MS,
  LINK_ANIMATION_MS,
} from "./types";

export function useCanvasAnimation(nodes: SankeyNode[]): {
  animatingNodes: AnimatingNode[];
  isAnimating: boolean;
  animationProgress: MutableRefObject<number>;
  linkAnimationProgress: MutableRefObject<number>;
  updateProgress: (timestamp: number) => void;
  nodeAnimationComplete: MutableRefObject<boolean>;
} {
  const [prevPositions, setPrevPositions] = useState<Map<string, NodePosition>>(
    new Map()
  );
  const [animatingNodes, setAnimatingNodes] = useState<AnimatingNode[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const animationProgress = useRef(0);
  const linkAnimationProgress = useRef(0);
  const nodeAnimationComplete = useRef(false);
  const lastTimestamp = useRef(0);

  useEffect(() => {
    if (!nodes || nodes.length === 0) {
      setAnimatingNodes([]);
      return;
    }

    const newAnimatingNodes: AnimatingNode[] = nodes.map((node) => {
      const prevPos = prevPositions.get(node.id);

      if (prevPos && (prevPos.x0 !== node.x0 || prevPos.y !== node.y)) {
        // Node has moved
        return {
          ...node,
          startX: prevPos.x0,
          startY: prevPos.y,
          targetX: node.x0,
          targetY: node.y,
          opacity: 1,
          isNew: false,
        };
      } else if (!prevPos) {
        // New node - fade in at position
        return {
          ...node,
          startX: node.x0,
          startY: node.y,
          targetX: node.x0,
          targetY: node.y,
          opacity: 0,
          isNew: true,
        };
      } else {
        // Unchanged position
        return {
          ...node,
          startX: node.x0,
          startY: node.y,
          targetX: node.x0,
          targetY: node.y,
          opacity: 1,
          isNew: false,
        };
      }
    });

    // Store current positions for next comparison
    const newPositions = new Map<string, NodePosition>();
    for (const node of nodes) {
      newPositions.set(node.id, { x0: node.x0, y: node.y });
    }
    setPrevPositions(newPositions);

    // Check if any animation is needed
    const needsAnimation = newAnimatingNodes.some(
      (n) => n.startX !== n.targetX || n.startY !== n.targetY || n.isNew
    );

    setAnimatingNodes(newAnimatingNodes);

    if (needsAnimation) {
      setIsAnimating(true);
      animationProgress.current = 0;
      linkAnimationProgress.current = 0;
      nodeAnimationComplete.current = false;
      lastTimestamp.current = 0;
    } else {
      // No animation needed, set to complete state
      nodeAnimationComplete.current = true;
      linkAnimationProgress.current = 1;
    }
  }, [nodes]);

  const updateProgress = useCallback((timestamp: number) => {
    if (!lastTimestamp.current) {
      lastTimestamp.current = timestamp;
    }

    const deltaTime = timestamp - lastTimestamp.current;
    lastTimestamp.current = timestamp;

    if (!nodeAnimationComplete.current) {
      // Node position animation phase
      animationProgress.current = Math.min(
        1,
        animationProgress.current + deltaTime / NODE_ANIMATION_MS
      );

      if (animationProgress.current >= 1) {
        nodeAnimationComplete.current = true;
        lastTimestamp.current = timestamp;
      }
    } else {
      // Link draw-in animation phase
      linkAnimationProgress.current = Math.min(
        1,
        linkAnimationProgress.current + deltaTime / LINK_ANIMATION_MS
      );

      if (linkAnimationProgress.current >= 1) {
        setIsAnimating(false);
      }
    }
  }, []);

  return {
    animatingNodes,
    isAnimating,
    animationProgress,
    linkAnimationProgress,
    updateProgress,
    nodeAnimationComplete,
  };
}

/**
 * Calculate current animated position for a node
 */
export function getAnimatedPosition(
  node: AnimatingNode,
  progress: number,
  easing: (x: number) => number
): { x: number; y: number; opacity: number } {
  const easedProgress = easing(progress);

  const x = node.startX + (node.targetX - node.startX) * easedProgress;
  const y = node.startY + (node.targetY - node.startY) * easedProgress;

  // New nodes fade in during animation
  const opacity = node.isNew ? easedProgress : node.opacity;

  return { x, y, opacity };
}
