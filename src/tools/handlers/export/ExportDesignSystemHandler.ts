/**
 * ExportDesignSystem Handler
 * Exports the design language to JSON or YAML format
 */

import { z } from 'zod';
import { ToolHandler } from '../../../core/ToolHandler';
import { EXPORT_DESIGN_SYSTEM_TOOL } from '../../definitions/export.tools';
import { StyleGraph } from '../../../core/StyleGraph';

const ExportDesignSystemParamsSchema = z.object({
  format: z.enum(['json', 'yaml']).default('json'),
});

type ExportDesignSystemParams = z.infer<typeof ExportDesignSystemParamsSchema>;

interface ExportResult {
  format: string;
  data: string;
}

export class ExportDesignSystemHandler extends ToolHandler<ExportDesignSystemParams, ExportResult> {
  constructor(private graph: StyleGraph) {
    super(EXPORT_DESIGN_SYSTEM_TOOL);
  }

  protected validate(params: unknown): ExportDesignSystemParams {
    return ExportDesignSystemParamsSchema.parse(params);
  }

  protected async handle(params: ExportDesignSystemParams): Promise<ExportResult> {
    const format = params.format || 'json';

    let data: string;
    if (format === 'yaml') {
      data = this.graph.exportToYAML();
    } else {
      data = this.graph.exportToJSON();
    }

    return {
      format,
      data,
    };
  }

  protected getSuccessMessage(params: ExportDesignSystemParams): string {
    return `Exported design language as ${(params.format || 'json').toUpperCase()}`;
  }
}
