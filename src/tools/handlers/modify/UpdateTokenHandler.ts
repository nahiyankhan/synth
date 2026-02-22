/**
 * UpdateToken Handler
 * Updates the value of an existing design token
 */

import { ToolHandler } from '@/core/ToolHandler';
import { UPDATE_TOKEN_TOOL } from '@/tools/definitions/modify.tools';
import { UpdateTokenParams, UpdateTokenParamsSchema } from '@/tools/schemas/modify.schemas';
import { StyleGraph } from '@/core/StyleGraph';

interface UpdateTokenResult {
  path: string;
  oldValue: any;
  newValue: any;
  version: number;
}

export class UpdateTokenHandler extends ToolHandler<UpdateTokenParams, UpdateTokenResult> {
  constructor(private graph: StyleGraph) {
    super(UPDATE_TOKEN_TOOL);
  }

  protected validate(params: unknown): UpdateTokenParams {
    return UpdateTokenParamsSchema.parse(params);
  }

  protected async handle(params: UpdateTokenParams): Promise<UpdateTokenResult> {
    const node = this.graph.getNode(params.path);

    if (!node) {
      throw new Error(`Token not found: ${params.path}`);
    }

    // Check if it's a spec (composite) - warn user
    if (node.metadata?.isSpec) {
      throw new Error(
        'Cannot edit composite tokens (design specs). These will be replaced by component tracking. Consider editing the underlying primitive or utility tokens instead.'
      );
    }

    // Parse value - check if it's a reference or primitive
    let newValue: any = params.value;

    // If it looks like a reference, keep it as string
    if (params.value.startsWith('{') && params.value.endsWith('}')) {
      newValue = params.value;
    } else if (
      node.type === 'color' ||
      node.type === 'typography' ||
      node.type === 'other'
    ) {
      // Keep as string
      newValue = params.value;
    } else {
      // Try to parse as number for sizes/spacing
      const num = parseFloat(params.value);
      if (!isNaN(num)) {
        newValue = num;
      }
    }

    const change = this.graph.updateNode(node.id, {
      value: newValue,
    });

    return {
      path: params.path,
      oldValue: change.before?.value,
      newValue: newValue,
      version: change.version,
    };
  }

  protected getSuccessMessage(params: UpdateTokenParams, result: UpdateTokenResult): string {
    return `Updated ${params.path} to ${result.newValue}`;
  }
}
