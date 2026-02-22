/**
 * GetSystemStats Handler
 * Gets overall statistics about the design language
 */

import { ToolHandler } from '../../../core/ToolHandler';
import { GET_SYSTEM_STATS_TOOL } from '../../definitions/analyze.tools';
import { GetSystemStatsParams, GetSystemStatsParamsSchema } from '../../schemas/analyze.schemas';
import { StyleGraph } from '../../../core/StyleGraph';

interface SystemStatsResult {
  totalNodes: number;
  coreTokens: number;
  designSpecs: number;
  byLayer: Record<string, number>;
  byType: Record<string, number>;
  maxDepth: number;
  circularDependencies: number;
}

export class GetSystemStatsHandler extends ToolHandler<GetSystemStatsParams, SystemStatsResult> {
  constructor(private graph: StyleGraph) {
    super(GET_SYSTEM_STATS_TOOL);
  }

  protected validate(params: unknown): GetSystemStatsParams {
    return GetSystemStatsParamsSchema.parse(params);
  }

  protected async handle(params: GetSystemStatsParams): Promise<SystemStatsResult> {
    const stats = this.graph.getStats();

    return {
      totalNodes: stats.totalNodes,
      coreTokens: stats.coreTokensCount,
      designSpecs: stats.specsCount,
      byLayer: stats.byLayer,
      byType: stats.byType,
      maxDepth: stats.maxDepth,
      circularDependencies: stats.circularDependencies.length,
    };
  }

  protected getSuccessMessage(): string | undefined {
    return undefined; // No special message needed
  }
}
