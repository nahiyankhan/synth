/**
 * CreateToken Handler
 * Creates a new design token
 */

import { ToolHandler } from '@/core/ToolHandler';
import { CREATE_TOKEN_TOOL } from '@/tools/definitions/modify.tools';
import { CreateTokenParams, CreateTokenParamsSchema } from '@/tools/schemas/modify.schemas';
import { StyleGraph } from '@/core/StyleGraph';

interface CreateTokenResult {
  path: string;
  value: any;
  intent?: {
    purpose?: string;
    designedFor?: string[];
    constraints?: string[];
    qualities?: string[];
    rationale?: string;
  };
  computedLayer: string | undefined;
  version: number;
}

export class CreateTokenHandler extends ToolHandler<CreateTokenParams, CreateTokenResult> {
  constructor(private graph: StyleGraph) {
    super(CREATE_TOKEN_TOOL);
  }

  protected validate(params: unknown): CreateTokenParams {
    return CreateTokenParamsSchema.parse(params);
  }

  protected async handle(params: CreateTokenParams): Promise<CreateTokenResult> {
    const pathParts = params.path.split('.');
    const existing = this.graph.getNode(params.path);

    if (existing) {
      throw new Error(`Token already exists: ${params.path}`);
    }

    // Parse value
    let value: any = params.value;
    if (params.value.startsWith('{') && params.value.endsWith('}')) {
      value = params.value;
    } else if (params.type === 'size') {
      const num = parseFloat(params.value);
      if (!isNaN(num)) {
        value = num;
      }
    }

    const change = this.graph.createNode({
      id: pathParts.join('.'),
      name: pathParts[pathParts.length - 1] || pathParts.join('.'),
      type: params.type,
      value: value,
      metadata: {
        description: params.description,
        createdFrom: 'handler',
      },
    });

    return {
      path: params.path,
      value: value,
      computedLayer: change.after?.layer,
      version: change.version,
    };
  }

  protected getSuccessMessage(params: CreateTokenParams, result: CreateTokenResult): string {
    return `Created new ${result.computedLayer} token: ${params.path}`;
  }
}
