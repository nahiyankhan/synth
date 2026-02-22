/**
 * D3 Force-Directed Layout Wrapper
 * 
 * Uses D3's force simulation for better performance and features
 */

import * as d3 from 'd3-force';
import type { CanvasNode, CanvasLink } from '../../../types/canvas';

export interface D3ForceConfig {
  width: number;
  height: number;
  linkStrength?: number;
  chargeStrength?: number;
  collisionRadius?: number;
}

export class D3ForceLayout {
  private config: D3ForceConfig;

  constructor(config: D3ForceConfig) {
    this.config = {
      linkStrength: 0.1,
      chargeStrength: -100,
      collisionRadius: 10,
      ...config,
    };
  }

  /**
   * Compute layout positions using D3 force simulation
   */
  compute(nodes: CanvasNode[], links: CanvasLink[]): CanvasNode[] {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    // Initialize random positions if not set
    nodes.forEach(node => {
      if (!node.x && !node.y) {
        node.x = centerX + (Math.random() - 0.5) * 100;
        node.y = centerY + (Math.random() - 0.5) * 100;
      }
    });

    // Create D3 force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links as any)
        .id((d: any) => d.id)
        .strength(this.config.linkStrength)
      )
      .force('charge', d3.forceManyBody()
        .strength(this.config.chargeStrength)
        .distanceMin(10)
      )
      .force('center', d3.forceCenter(centerX, centerY))
      .force('collision', d3.forceCollide()
        .radius((d: any) => d.radius + this.config.collisionRadius!)
      )
      .force('x', d3.forceX(centerX).strength(0.01))
      .force('y', d3.forceY(centerY).strength(0.01));

    // Run simulation to completion (static rendering)
    const iterations = Math.ceil(
      Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())
    );

    for (let i = 0; i < iterations; i++) {
      simulation.tick();
    }

    // Stop the simulation
    simulation.stop();

    return nodes;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<D3ForceConfig>) {
    this.config = { ...this.config, ...config };
  }
}

