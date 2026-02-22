/**
 * FindAllReferences Handler
 * Finds all tokens that reference (depend on) a specific token
 */

import { ToolHandler } from '../../../core/ToolHandler';
import { FIND_ALL_REFERENCES_TOOL } from '../../definitions/query.tools';
import { FindAllReferencesParams, FindAllReferencesParamsSchema } from '../../schemas/query.schemas';
import { StyleGraph } from '../../../core/StyleGraph';

interface ReferenceResult {
  path: string;
  directReferences: string[];
  allReferences: string[];
  usageCount: number;
}

export class FindAllReferencesHandler extends ToolHandler<FindAllReferencesParams, ReferenceResult> {
  constructor(private graph: StyleGraph) {
    super(FIND_ALL_REFERENCES_TOOL);
  }

  protected validate(params: unknown): FindAllReferencesParams {
    return FindAllReferencesParamsSchema.parse(params);
  }

  protected async handle(params: FindAllReferencesParams): Promise<ReferenceResult> {
    const result = this.graph.findAllReferences(params.path);

    if (!result) {
      throw new Error(`Token not found: ${params.path}`);
    }

    return result;
  }

  protected getSuccessMessage(params: FindAllReferencesParams, result: ReferenceResult): string {
    const directCount = result.directReferences.length;
    const transitiveCount = result.allReferences.length - directCount;
    return `Found ${result.usageCount} reference${result.usageCount !== 1 ? 's' : ''} to ${params.path} (${directCount} direct, ${transitiveCount} transitive)`;
  }
}
