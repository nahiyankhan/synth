/**
 * GetToken Handler
 * Retrieves detailed information about a specific token
 */

import { ToolHandler } from '@/core/ToolHandler';
import { GET_TOKEN_TOOL } from '@/tools/definitions/query.tools';
import { GetTokenParams, GetTokenParamsSchema } from '@/tools/schemas/query.schemas';
import { TokenInfo } from '@/types/aiTools';
import { StyleGraph } from '@/core/StyleGraph';
import { StyleNode } from '@/types/styleGraph';

export class GetTokenHandler extends ToolHandler<GetTokenParams, TokenInfo> {
  constructor(private graph: StyleGraph) {
    super(GET_TOKEN_TOOL);
  }

  protected validate(params: unknown): GetTokenParams {
    return GetTokenParamsSchema.parse(params);
  }

  protected async handle(params: GetTokenParams): Promise<TokenInfo> {
    const node = this.graph.getNode(params.path);

    if (!node) {
      throw new Error(`Token not found: ${params.path}`);
    }

    return this.nodeToTokenInfo(node);
  }

  private nodeToTokenInfo(node: StyleNode): TokenInfo {
    return {
      path: node.id,
      name: node.name,
      layer: node.layer,
      type: node.type,
      value: node.value,
      resolvedLight: this.graph.resolveNode(node.id, 'light'),
      resolvedDark: this.graph.resolveNode(node.id, 'dark'),
      dependencies: Array.from(node.dependencies).map((id) => {
        const dep = this.graph.getNode(id);
        return dep ? dep.id : id;
      }),
      dependents: Array.from(node.dependents).map((id) => {
        const dep = this.graph.getNode(id);
        return dep ? dep.id : id;
      }),
      isSpec: node.metadata?.isSpec || false,
    };
  }
}

