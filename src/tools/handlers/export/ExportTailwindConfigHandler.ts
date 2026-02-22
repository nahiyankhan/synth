/**
 * ExportTailwindConfig Handler
 * Exports design system as Tailwind v4 CSS configuration
 */

import { z } from 'zod';
import { ToolHandler } from '@/core/ToolHandler';
import { EXPORT_TAILWIND_CONFIG_TOOL } from '@/tools/definitions/export.tools';
import { StyleGraph } from '@/core/StyleGraph';

const ExportTailwindConfigParamsSchema = z.object({
  exportType: z.enum(['theme', 'tokens', 'both']).default('both'),
  includeReadme: z.boolean().default(true),
});

type ExportTailwindConfigParams = z.infer<typeof ExportTailwindConfigParamsSchema>;

interface ExportTailwindConfigResult {
  files: Record<string, string>;
  exportType: string;
}

export class ExportTailwindConfigHandler extends ToolHandler<ExportTailwindConfigParams, ExportTailwindConfigResult> {
  constructor(private graph: StyleGraph) {
    super(EXPORT_TAILWIND_CONFIG_TOOL);
  }

  protected validate(params: unknown): ExportTailwindConfigParams {
    return ExportTailwindConfigParamsSchema.parse(params);
  }

  protected async handle(params: ExportTailwindConfigParams): Promise<ExportTailwindConfigResult> {
    const { generateTailwindExport } = await import('../../../services/tailwindConfigGenerator');
    const exportType = params.exportType || 'both';
    const includeReadme = params.includeReadme ?? true;

    const result = generateTailwindExport(this.graph);

    // Build response based on export type
    const files: Record<string, string> = {};

    if (exportType === 'theme' || exportType === 'both') {
      files['theme.css'] = result.themeConfig;
    }

    if (exportType === 'tokens' || exportType === 'both') {
      files['tokens.css'] = result.tokenUtilities;
    }

    if (includeReadme) {
      files['README.md'] = result.readme;
    }

    return {
      files,
      exportType,
    };
  }

  protected getSuccessMessage(params: ExportTailwindConfigParams): string {
    const includeReadme = params.includeReadme ?? true;
    return `Generated Tailwind v4 configuration (${params.exportType || 'both'} export${includeReadme ? ' with README' : ''})`;
  }
}
