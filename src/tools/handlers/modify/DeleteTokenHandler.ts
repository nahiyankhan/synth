/**
 * DeleteToken Handler
 * Deletes a design token (with optional force flag)
 */

import { ToolHandler } from '@/core/ToolHandler';
import { DELETE_TOKEN_TOOL } from '@/tools/definitions/modify.tools';
import { DeleteTokenParams, DeleteTokenParamsSchema } from '@/tools/schemas/modify.schemas';
import { StyleGraph } from '@/core/StyleGraph';
import { ToolResponse } from '@/types/toolRegistry';

interface DeleteTokenResult {
  path: string;
  version: number;
  dependents?: string[];
}

export class DeleteTokenHandler extends ToolHandler<DeleteTokenParams, DeleteTokenResult> {
  constructor(private graph: StyleGraph) {
    super(DELETE_TOKEN_TOOL);
  }

  protected validate(params: unknown): DeleteTokenParams {
    return DeleteTokenParamsSchema.parse(params);
  }

  protected async handle(params: DeleteTokenParams): Promise<DeleteTokenResult> {
    const node = this.graph.getNode(params.path);

    if (!node) {
      throw new Error(`Token not found: ${params.path}`);
    }

    // Check if it's a spec
    if (node.metadata?.isSpec) {
      throw new Error(
        'Cannot delete composite tokens (design specs). These are loaded from the component library.'
      );
    }

    // Check for dependents
    if (node.dependents.size > 0 && !params.force) {
      const dependentsList = Array.from(node.dependents).map((id) => {
        const dep = this.graph.getNode(id);
        return dep ? dep.id : id;
      });

      throw new Error(
        `Cannot delete ${params.path}: ${node.dependents.size} tokens depend on it. Use force=true to delete anyway. Dependents: ${dependentsList.slice(0, 5).join(', ')}${dependentsList.length > 5 ? '...' : ''}`
      );
    }

    const change = this.graph.deleteNode(node.id);

    return {
      path: params.path,
      version: change.version,
    };
  }

  protected getSuccessMessage(params: DeleteTokenParams): string {
    return `Deleted token: ${params.path}`;
  }
}
