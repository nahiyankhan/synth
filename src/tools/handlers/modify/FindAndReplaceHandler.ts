/**
 * FindAndReplace Handler
 * Finds and replaces patterns across token paths or values
 */

import { ToolHandler } from '../../../core/ToolHandler';
import { FIND_AND_REPLACE_TOOL } from '../../definitions/modify.tools';
import { FindAndReplaceParams, FindAndReplaceParamsSchema } from '../../schemas/modify.schemas';
import { StyleGraph } from '../../../core/StyleGraph';

interface FindAndReplaceMatch {
  path: string;
  field: 'path' | 'value';
  before: string;
  after: string;
  updated: boolean;
}

interface FindAndReplaceResult {
  matches: FindAndReplaceMatch[];
  totalMatches: number;
  updated: number;
}

export class FindAndReplaceHandler extends ToolHandler<FindAndReplaceParams, FindAndReplaceResult> {
  constructor(private graph: StyleGraph) {
    super(FIND_AND_REPLACE_TOOL);
  }

  protected validate(params: unknown): FindAndReplaceParams {
    return FindAndReplaceParamsSchema.parse(params);
  }

  protected async handle(params: FindAndReplaceParams): Promise<FindAndReplaceResult> {
    const results = this.graph.findAndReplace({
      searchPattern: params.searchPattern,
      replaceWith: params.replaceWith,
      searchIn: params.searchIn,
      matchType: params.matchType,
      layer: params.layer,
      type: params.type,
      dryRun: params.dryRun !== false, // default to true
    });

    const updatedCount = results.filter((r) => r.updated).length;

    return {
      matches: results,
      totalMatches: results.length,
      updated: updatedCount,
    };
  }

  protected getSuccessMessage(params: FindAndReplaceParams, result: FindAndReplaceResult): string {
    const isDryRun = params.dryRun !== false;
    return isDryRun
      ? `Found ${result.totalMatches} match${result.totalMatches !== 1 ? 'es' : ''} (dry run - no changes made)`
      : `Updated ${result.updated} of ${result.totalMatches} match${result.totalMatches !== 1 ? 'es' : ''}`;
  }
}
