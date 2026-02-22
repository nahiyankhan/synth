/**
 * GetImpactAnalysis Handler
 * Analyzes the impact of changing a token
 */

import { ToolHandler } from '../../../core/ToolHandler';
import { GET_IMPACT_ANALYSIS_TOOL } from '../../definitions/analyze.tools';
import { GetImpactAnalysisParams, GetImpactAnalysisParamsSchema } from '../../schemas/analyze.schemas';
import { StyleGraph } from '../../../core/StyleGraph';
import { ImpactAnalysisResult } from '../../../types/aiTools';

export class GetImpactAnalysisHandler extends ToolHandler<GetImpactAnalysisParams, ImpactAnalysisResult> {
  constructor(private graph: StyleGraph) {
    super(GET_IMPACT_ANALYSIS_TOOL);
  }

  protected validate(params: unknown): GetImpactAnalysisParams {
    return GetImpactAnalysisParamsSchema.parse(params);
  }

  protected async handle(params: GetImpactAnalysisParams): Promise<ImpactAnalysisResult> {
    const node = this.graph.getNode(params.path);

    if (!node) {
      throw new Error(`Token not found: ${params.path}`);
    }

    const impact = this.graph.getImpactAnalysis(node.id);

    return {
      path: params.path,
      directDependents: impact.directDependents.length,
      totalAffected: impact.allDependents.length,
      affectedUtilities: impact.affectedUtilities.map((id) => {
        const n = this.graph.getNode(id);
        return n ? n.id : id;
      }),
      affectedComposites: impact.affectedComposites.map((id) => {
        const n = this.graph.getNode(id);
        return n ? n.id : id;
      }),
      wouldBreak: false, // Could add validation logic here
    };
  }

  protected getSuccessMessage(params: GetImpactAnalysisParams, result: ImpactAnalysisResult): string {
    return `Changing ${params.path} would affect ${result.totalAffected} tokens`;
  }
}
