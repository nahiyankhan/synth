/**
 * SearchTokens Handler
 * Searches for tokens based on query, layer, type filters
 */

import { ToolHandler } from '@/core/ToolHandler';
import { SEARCH_TOKENS_TOOL } from '@/tools/definitions/query.tools';
import { SearchTokensParams, SearchTokensParamsSchema } from '@/tools/schemas/query.schemas';
import { SearchResult, TokenInfo } from '@/types/aiTools';
import { StyleGraph } from '@/core/StyleGraph';
import { StyleNode } from '@/types/styleGraph';

export class SearchTokensHandler extends ToolHandler<SearchTokensParams, SearchResult> {
  constructor(private graph: StyleGraph) {
    super(SEARCH_TOKENS_TOOL);
  }

  protected validate(params: unknown): SearchTokensParams {
    return SearchTokensParamsSchema.parse(params);
  }

  protected async handle(params: SearchTokensParams): Promise<SearchResult> {
    const excludeSpecs = params.layer !== 'composite';
    let nodes = this.graph.getNodes({ excludeSpecs });

    // Filter by layer
    if (params.layer) {
      nodes = nodes.filter((n) => n.layer === params.layer);
    }

    // Filter by type
    if (params.type) {
      nodes = nodes.filter((n) => n.type === params.type);
    }

    // Filter by query
    if (params.query) {
      const query = params.query.toLowerCase();
      nodes = nodes.filter(
        (n) =>
          n.id.toLowerCase().includes(query) ||
          n.name.toLowerCase().includes(query) ||
          JSON.stringify(n.value).toLowerCase().includes(query)
      );
    }

    const limit = params.limit || nodes.length;
    const tokens = nodes.slice(0, limit).map((n) => this.nodeToTokenInfo(n));

    return {
      tokens,
      total: nodes.length,
      query: params.query || 'all',
    };
  }

  protected getSuccessMessage(params: SearchTokensParams, result: SearchResult): string {
    return `Found ${result.total} token${result.total !== 1 ? 's' : ''}`;
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

