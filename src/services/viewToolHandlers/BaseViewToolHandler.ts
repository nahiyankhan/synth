/**
 * BaseViewToolHandler
 *
 * Shared base class for view-specific tool handlers.
 * Provides common utilities for working with graph nodes and values.
 */

import { StyleGraph } from '../../core/StyleGraph';
import { StyleNode } from '../../types/styleGraph';
import { ToolResponse } from '../../types/toolRegistry';
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
} from '../../utils/toolResponseHelpers';

// Re-export response helpers for convenience
export { createSuccessResponse, createErrorResponse, createNotFoundResponse };

export abstract class BaseViewToolHandler {
  protected graph: StyleGraph;

  constructor(graph: StyleGraph) {
    this.graph = graph;
  }

  /**
   * Extract numeric value from various formats
   * Handles: numbers, strings with units (px, rem, em), nested objects
   *
   * @param value - The value to extract from
   * @param baseSize - Base font size for rem/em conversion (default: 16)
   * @returns The numeric value in pixels, or null if extraction failed
   */
  protected extractNumericValue(value: any, baseSize = 16): number | null {
    if (!value) return null;

    // Handle string formats (e.g., "16px", "1rem", "2em")
    if (typeof value === 'string') {
      const match = value.match(/(\d+(?:\.\d+)?)(px|rem|em)?/);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2];
        // Convert rem/em to px
        return unit === 'rem' || unit === 'em' ? num * baseSize : num;
      }
    }

    // Handle number directly
    if (typeof value === 'number') {
      return value;
    }

    // Handle object format { value: "16px" }
    if (typeof value === 'object' && value.value !== undefined) {
      return this.extractNumericValue(value.value, baseSize);
    }

    return null;
  }

  /**
   * Get all nodes from the graph
   */
  protected getAllNodes(): StyleNode[] {
    return this.graph.getAllNodes();
  }

  /**
   * Get a node by ID
   */
  protected getNode(id: string): StyleNode | undefined {
    return this.graph.getNode(id);
  }

  /**
   * Filter nodes by type
   */
  protected getNodesByType(type: string): StyleNode[] {
    return this.getAllNodes().filter((node) => node.type === type);
  }

  /**
   * Filter nodes by layer
   */
  protected getNodesByLayer(layer: string): StyleNode[] {
    return this.getAllNodes().filter((node) => node.layer === layer);
  }

  /**
   * Filter nodes matching a predicate
   */
  protected filterNodes(predicate: (node: StyleNode) => boolean): StyleNode[] {
    return this.getAllNodes().filter(predicate);
  }

  /**
   * Resolve a node's value for a given mode
   */
  protected resolveNodeValue(
    nodeId: string,
    mode: 'light' | 'dark' = 'light'
  ): any {
    return this.graph.resolveNode(nodeId, mode);
  }

  /**
   * Create a success response with typed data
   */
  protected success<T>(data: T, message?: string): ToolResponse<T> {
    return createSuccessResponse(data, message);
  }

  /**
   * Create an error response
   */
  protected error(message: string): ToolResponse {
    return createErrorResponse(message);
  }

  /**
   * Create a not found response
   */
  protected notFound(entityType: string, identifier: string): ToolResponse {
    return createNotFoundResponse(entityType, identifier);
  }

  /**
   * Get nodes that match a path pattern
   */
  protected getNodesByPathPattern(pattern: RegExp): StyleNode[] {
    return this.getAllNodes().filter((node) =>
      pattern.test(node.path || node.id)
    );
  }

  /**
   * Check if a value is a color (hex format)
   */
  protected isColorValue(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^#[0-9a-fA-F]{3,8}$/.test(value);
  }

  /**
   * Check if a value is numeric
   */
  protected isNumericValue(value: any): boolean {
    return this.extractNumericValue(value) !== null;
  }
}
