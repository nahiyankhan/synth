/**
 * Entity Handler
 * 
 * Handles creation of brand principles, usage contexts, and constraints
 * These are the entities that tokens can have relationships with
 */

import { ToolHandler } from '../../../core/ToolHandler';
import { ToolResponse } from '../../../types/toolRegistry';
import { StyleGraph } from '../../../core/StyleGraph';
import { nanoid } from 'nanoid';

export interface CreateBrandPrincipleParams {
  id: string;
  label: string;
  description: string;
  examples?: string[];
}

export interface CreateUsageContextParams {
  id: string;
  label: string;
  description: string;
  conditions?: string[];
}

export interface CreateConstraintParams {
  id: string;
  label: string;
  type: 'accessibility' | 'brand' | 'technical' | 'ux';
  description: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export class EntityHandler extends ToolHandler {
  constructor(private graph: StyleGraph) {
    super();
  }

  /**
   * Create a brand principle
   */
  async createBrandPrinciple(params: CreateBrandPrincipleParams): Promise<ToolResponse> {
    try {
      // Check if ID already exists
      if (this.graph.getNode(params.id)) {
        return {
          success: false,
          error: `Entity with ID "${params.id}" already exists`,
        };
      }

      // Create as a special token type
      const node = {
        id: params.id,
        name: params.label,
        type: 'other' as const,
        value: params.description,
        layer: 'primitive' as const,
        metadata: {
          entityType: 'brand-principle',
          description: params.description,
          examples: params.examples || [],
        },
      };

      const change = this.graph.createNode(node);

      return {
        success: true,
        message: `Created brand principle: ${params.label}`,
        data: {
          id: params.id,
          label: params.label,
          description: params.description,
          version: change.version,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create brand principle: ${error.message}`,
      };
    }
  }

  /**
   * Create a usage context
   */
  async createUsageContext(params: CreateUsageContextParams): Promise<ToolResponse> {
    try {
      if (this.graph.getNode(params.id)) {
        return {
          success: false,
          error: `Entity with ID "${params.id}" already exists`,
        };
      }

      const node = {
        id: params.id,
        name: params.label,
        type: 'other' as const,
        value: params.description,
        layer: 'primitive' as const,
        metadata: {
          entityType: 'usage-context',
          description: params.description,
          conditions: params.conditions || [],
        },
      };

      const change = this.graph.createNode(node);

      return {
        success: true,
        message: `Created usage context: ${params.label}`,
        data: {
          id: params.id,
          label: params.label,
          description: params.description,
          version: change.version,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create usage context: ${error.message}`,
      };
    }
  }

  /**
   * Create a design constraint
   */
  async createConstraint(params: CreateConstraintParams): Promise<ToolResponse> {
    try {
      if (this.graph.getNode(params.id)) {
        return {
          success: false,
          error: `Entity with ID "${params.id}" already exists`,
        };
      }

      const node = {
        id: params.id,
        name: params.label,
        type: 'other' as const,
        value: params.description,
        layer: 'primitive' as const,
        metadata: {
          entityType: 'constraint',
          constraintType: params.type,
          description: params.description,
          severity: params.severity || 'medium',
        },
      };

      const change = this.graph.createNode(node);

      return {
        success: true,
        message: `Created ${params.type} constraint: ${params.label}`,
        data: {
          id: params.id,
          label: params.label,
          type: params.type,
          severity: params.severity || 'medium',
          version: change.version,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create constraint: ${error.message}`,
      };
    }
  }

  validate(params: any): { valid: boolean; error?: string } {
    return { valid: true };
  }
}

