/**
 * Force-Directed Layout Algorithm
 *
 * Computes node positions using force simulation with:
 * - Repulsion between all nodes
 * - Attraction along links
 * - Center gravity to prevent drifting
 */

import {
  CanvasNode,
  CanvasLink,
  ForceLayoutConfig,
  Velocity,
} from "../../../types/canvas";

export class ForceLayout {
  private config: ForceLayoutConfig;
  private velocities: Map<string, Velocity> = new Map();

  constructor(config: Partial<ForceLayoutConfig> = {}) {
    this.config = {
      width: 800,
      height: 600,
      iterations: 50, // Reduced from 300 for performance
      linkStrength: 0.1,
      repulsionStrength: 100,
      centerStrength: 0.01,
      ...config,
    };
  }

  /**
   * Compute layout positions for nodes
   */
  compute(nodes: CanvasNode[], links: CanvasLink[]): CanvasNode[] {
    // Limit iterations based on node count to prevent freezing
    let iterations = this.config.iterations;
    if (nodes.length > 1000) {
      iterations = 20;
    } else if (nodes.length > 500) {
      iterations = 30;
    } else if (nodes.length > 200) {
      iterations = 40;
    }

    // Initialize positions if not set
    nodes.forEach((node) => {
      if (!node.x && !node.y) {
        node.x = Math.random() * this.config.width;
        node.y = Math.random() * this.config.height;
      }
      if (!this.velocities.has(node.id)) {
        this.velocities.set(node.id, { vx: 0, vy: 0 });
      }
    });

    const startTime = performance.now();

    // Run simulation
    for (let i = 0; i < iterations; i++) {
      const alpha = 1 - i / iterations;
      this.step(nodes, links, alpha);

      // Safety check: abort if taking too long
      if (performance.now() - startTime > 5000) {
        console.warn(`ForceLayout: Aborting after ${i} iterations (timeout)`);
        break;
      }
    }

    return nodes;
  }

  /**
   * Single simulation step
   */
  private step(nodes: CanvasNode[], links: CanvasLink[], alpha: number) {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    // Reset forces
    nodes.forEach((node) => {
      const vel = this.velocities.get(node.id)!;
      vel.vx = 0;
      vel.vy = 0;
    });

    // Repulsion between all nodes (O(n²) - could optimize with Barnes-Hut)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 1) continue; // Avoid division by zero

        const dist = Math.sqrt(distSq);
        const force = (this.config.repulsionStrength * alpha) / dist;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const velA = this.velocities.get(nodeA.id)!;
        const velB = this.velocities.get(nodeB.id)!;

        velA.vx -= fx;
        velA.vy -= fy;
        velB.vx += fx;
        velB.vy += fy;
      }
    }

    // Attraction along links
    links.forEach((link) => {
      const source = nodes.find((n) => n.id === link.source);
      const target = nodes.find((n) => n.id === link.target);

      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) return;

      const force = this.config.linkStrength * alpha * dist * link.strength;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      const velSource = this.velocities.get(source.id)!;
      const velTarget = this.velocities.get(target.id)!;

      velSource.vx += fx;
      velSource.vy += fy;
      velTarget.vx -= fx;
      velTarget.vy -= fy;
    });

    // Center gravity (prevents graph from drifting)
    nodes.forEach((node) => {
      const vel = this.velocities.get(node.id)!;
      vel.vx += (centerX - node.x) * this.config.centerStrength * alpha;
      vel.vy += (centerY - node.y) * this.config.centerStrength * alpha;
    });

    // Apply velocities with damping
    const damping = 0.6;
    nodes.forEach((node) => {
      const vel = this.velocities.get(node.id)!;
      node.x += vel.vx * damping;
      node.y += vel.vy * damping;
    });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ForceLayoutConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset velocity state
   */
  reset() {
    this.velocities.clear();
  }
}
