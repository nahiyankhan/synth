/**
 * RenameToken Handler
 * Renames a token and automatically updates all references
 */

import { ToolHandler } from '../../../core/ToolHandler';
import { RENAME_TOKEN_TOOL } from '../../definitions/modify.tools';
import { RenameTokenParams, RenameTokenParamsSchema } from '../../schemas/modify.schemas';
import { StyleGraph } from '../../../core/StyleGraph';

interface RenameTokenResult {
  oldPath: string;
  newPath: string;
  version: number;
  referencesUpdated: number;
}

export class RenameTokenHandler extends ToolHandler<RenameTokenParams, RenameTokenResult> {
  constructor(private graph: StyleGraph) {
    super(RENAME_TOKEN_TOOL);
  }

  protected validate(params: unknown): RenameTokenParams {
    return RenameTokenParamsSchema.parse(params);
  }

  protected async handle(params: RenameTokenParams): Promise<RenameTokenResult> {
    const change = this.graph.renameToken(params.oldPath, params.newPath);

    // Count updated references
    const references = this.graph.findAllReferences(params.newPath);
    const referenceCount = references ? references.directReferences.length : 0;

    return {
      oldPath: params.oldPath,
      newPath: params.newPath,
      version: change.version,
      referencesUpdated: referenceCount,
    };
  }

  protected getSuccessMessage(params: RenameTokenParams, result: RenameTokenResult): string {
    return `Renamed ${params.oldPath} to ${params.newPath}. Updated ${result.referencesUpdated} reference${result.referencesUpdated !== 1 ? 's' : ''}.`;
  }
}
