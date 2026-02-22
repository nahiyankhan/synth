/**
 * RedoChange Handler
 * Redoes a previously undone change
 */

import { ToolHandler } from '@/core/ToolHandler';
import { REDO_CHANGE_TOOL } from '@/tools/definitions/history.tools';
import { StyleGraph } from '@/core/StyleGraph';

interface RedoResult {
  redone: boolean;
}

export class RedoChangeHandler extends ToolHandler<void, RedoResult> {
  constructor(private graph: StyleGraph) {
    super(REDO_CHANGE_TOOL);
  }

  protected validate(): void {
    // No params to validate
    return;
  }

  protected async handle(): Promise<RedoResult> {
    const success = this.graph.redo();

    if (!success) {
      throw new Error('Nothing to redo');
    }

    return { redone: true };
  }

  protected getSuccessMessage(): string {
    return 'Redid change';
  }
}
