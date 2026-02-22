/**
 * AI-Native Token Authoring Handler
 *
 * Handles creation and modification of AI-native tokens with relationships
 */

import { ToolHandler } from '@/core/ToolHandler';
import { ToolResponse } from '@/types/toolRegistry';
import { StyleGraph } from '@/core/StyleGraph';
import { StyleNode, TokenRelationship } from '@/types/styleGraph';
import { nanoid } from 'nanoid';

// Re-export for consumers
export type { TokenRelationship };

export interface CreateAITokenParams {
  id: string;
  label: string;
  value: any;
  relationships?: TokenRelationship[];
  context?: {
    createdFor?: string;
    brandIntent?: string;
    colorScience?: {
      oklch: { l: number; c: number; h: number };
      computed?: boolean;
    };
  };
  type?: 'color' | 'typography' | 'size' | 'other';
}

export interface UpdateAITokenParams {
  id: string;
  label?: string;
  value?: any;
  relationships?: TokenRelationship[];
  addRelationships?: TokenRelationship[];
  removeRelationships?: Array<{ type: string; target: string }>;
  context?: any;
  changeReason?: string;
}

export interface AddRelationshipParams {
  tokenId: string;
  relationship: TokenRelationship;
}

export interface RemoveRelationshipParams {
  tokenId: string;
  relationshipType: string;
  targetId: string;
}

export class AITokenHandler extends ToolHandler {
  constructor(private graph: StyleGraph) {
    super();
  }

  /**
   * Create a new AI-native token with relationships
   */
  async createToken(params: CreateAITokenParams): Promise<ToolResponse> {
    try {
      // Validate ID doesn't already exist
      if (this.graph.getNode(params.id)) {
        return {
          success: false,
          error: `Token with ID "${params.id}" already exists`,
        };
      }

      // Detect type from value if not specified
      const type = params.type || this.detectType(params.value);

      // Create node (extend with relationships later when StyleGraph supports it)
      const node: Omit<StyleNode, 'dependencies' | 'dependents'> = {
        id: params.id,
        name: params.label,
        type,
        value: params.value,
        layer: 'primitive', // Will be computed
        // @ts-ignore - relationships not yet in StyleNode type
        relationships: params.relationships || [],
        metadata: {
          createdFrom: 'manual',
          ...params.context,
        },
      };

      const change = this.graph.createNode(node);

      return {
        success: true,
        message: `Created AI-native token: ${params.label}`,
        data: {
          id: params.id,
          label: params.label,
          value: params.value,
          relationshipCount: params.relationships?.length || 0,
          version: change.version,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create token: ${error.message}`,
      };
    }
  }

  /**
   * Update an existing token
   */
  async updateToken(params: UpdateAITokenParams): Promise<ToolResponse> {
    try {
      const node = this.graph.getNode(params.id);
      if (!node) {
        return {
          success: false,
          error: `Token "${params.id}" not found`,
        };
      }

      // Build updates object
      const updates: Partial<StyleNode> = {};

      if (params.label !== undefined) {
        updates.name = params.label;
      }

      if (params.value !== undefined) {
        updates.value = params.value;
      }

      // Handle relationships
      // @ts-ignore - relationships not yet in StyleNode type
      if (params.relationships !== undefined) {
        // @ts-ignore
        updates.relationships = params.relationships;
      } else if (params.addRelationships || params.removeRelationships) {
        // @ts-ignore
        const currentRelationships = (node as any).relationships || [];
        let newRelationships = [...currentRelationships];

        if (params.removeRelationships) {
          newRelationships = newRelationships.filter(rel =>
            !params.removeRelationships!.some(
              rem => rem.type === rel.type && rem.target === rel.target
            )
          );
        }

        if (params.addRelationships) {
          newRelationships.push(...params.addRelationships);
        }

        // @ts-ignore
        updates.relationships = newRelationships;
      }

      if (params.context) {
        updates.metadata = {
          ...node.metadata,
          ...params.context,
        };
      }

      const change = this.graph.updateNode(params.id, updates);

      return {
        success: true,
        message: `Updated token: ${node.name}`,
        data: {
          id: params.id,
          updates: Object.keys(updates),
          version: change.version,
          changeReason: params.changeReason,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to update token: ${error.message}`,
      };
    }
  }

  /**
   * Add a single relationship to a token
   */
  async addRelationship(params: AddRelationshipParams): Promise<ToolResponse> {
    try {
      const node = this.graph.getNode(params.tokenId);
      if (!node) {
        return {
          success: false,
          error: `Token "${params.tokenId}" not found`,
        };
      }

      // @ts-ignore - relationships not yet in StyleNode type
      const currentRelationships = (node as any).relationships || [];
      const newRelationships = [...currentRelationships, params.relationship];

      const change = this.graph.updateNode(params.tokenId, {
        // @ts-ignore
        relationships: newRelationships,
      });

      return {
        success: true,
        message: `Added ${params.relationship.type} relationship to ${node.name}`,
        data: {
          tokenId: params.tokenId,
          relationship: params.relationship,
          version: change.version,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to add relationship: ${error.message}`,
      };
    }
  }

  /**
   * Remove a relationship from a token
   */
  async removeRelationship(params: RemoveRelationshipParams): Promise<ToolResponse> {
    try {
      const node = this.graph.getNode(params.tokenId);
      if (!node) {
        return {
          success: false,
          error: `Token "${params.tokenId}" not found`,
        };
      }

      // @ts-ignore - relationships not yet in StyleNode type
      const currentRelationships = (node as any).relationships || [];
      const newRelationships = currentRelationships.filter(
        (rel: TokenRelationship) =>
          !(rel.type === params.relationshipType && rel.target === params.targetId)
      );

      if (newRelationships.length === currentRelationships.length) {
        return {
          success: false,
          error: `Relationship not found: ${params.relationshipType} -> ${params.targetId}`,
        };
      }

      const change = this.graph.updateNode(params.tokenId, {
        // @ts-ignore
        relationships: newRelationships,
      });

      return {
        success: true,
        message: `Removed ${params.relationshipType} relationship from ${node.name}`,
        data: {
          tokenId: params.tokenId,
          removedType: params.relationshipType,
          removedTarget: params.targetId,
          version: change.version,
        },
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to remove relationship: ${error.message}`,
      };
    }
  }

  /**
   * Detect token type from value
   */
  private detectType(value: any): 'color' | 'typography' | 'size' | 'other' {
    if (typeof value === 'string') {
      // Check if it's a color
      if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
        return 'color';
      }
      // Check if it's a size
      if (value.match(/^\d+(\.\d+)?(px|rem|em|%|vh|vw)$/)) {
        return 'size';
      }
      // Check if it's a font family
      if (value.includes(',') || value.match(/^[a-zA-Z\s-]+$/)) {
        return 'typography';
      }
    } else if (typeof value === 'number') {
      return 'size';
    }
    return 'other';
  }

  validate(params: any): { valid: boolean; error?: string } {
    // Basic validation - specific validation in each method
    return { valid: true };
  }
}

