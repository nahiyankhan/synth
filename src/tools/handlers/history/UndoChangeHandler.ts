/**
 * UndoChange Handler
 * Undoes the last change made to the design language
 */

import { ToolHandler } from '@/core/ToolHandler';
import { UNDO_CHANGE_TOOL } from '@/tools/definitions/history.tools';
import { StyleGraph } from '@/core/StyleGraph';

interface UndoResult {
  undone: boolean;
}

export class UndoChangeHandler extends ToolHandler<void, UndoResult> {
  constructor(private graph: StyleGraph) {
    super(UNDO_CHANGE_TOOL);
  }

  protected validate(): void {
    // No params to validate
    return;
  }

  protected async handle(): Promise<UndoResult> {
    const success = this.graph.undo();

    if (!success) {
      throw new Error('Nothing to undo');
    }

    return { undone: true };
  }

  protected getSuccessMessage(): string {
    return 'Undid last change';
  }
}
