/**
 * GenerateColorScale Handler
 * Generates a perceptually uniform color scale from a base color
 */

import { ToolHandler } from '../../../core/ToolHandler';
import { GENERATE_COLOR_SCALE_TOOL } from '../../definitions/create.tools';
import { GenerateColorScaleParams, GenerateColorScaleParamsSchema } from '../../schemas/create.schemas';
import { StyleGraph } from '../../../core/StyleGraph';

interface ColorToken {
  path: string;
  value: string;
  step: number;
}

interface GenerateColorScaleResult {
  baseColor: string;
  steps: number;
  tokens: ColorToken[];
}

export class GenerateColorScaleHandler extends ToolHandler<GenerateColorScaleParams, GenerateColorScaleResult> {
  constructor(private graph: StyleGraph) {
    super(GENERATE_COLOR_SCALE_TOOL);
  }

  protected validate(params: unknown): GenerateColorScaleParams {
    return GenerateColorScaleParamsSchema.parse(params);
  }

  protected async handle(params: GenerateColorScaleParams): Promise<GenerateColorScaleResult> {
    // Dynamically import color science utilities
    const { hexToOKLCH, generateScale, oklchToHex } = await import(
      '../../../services/colorScience'
    );

    const steps = params.steps || 9;
    const layer = params.layer || 'primitive';

    // Generate the scale in OKLCH space
    const baseOKLCH = hexToOKLCH(params.baseColor);
    const scale = generateScale(baseOKLCH, steps);

    // Create tokens for each color in the scale
    const createdTokens: ColorToken[] = [];

    for (let i = 0; i < scale.length; i++) {
      const hex = oklchToHex(scale[i]);
      const stepNumber = (i + 1) * (100 / steps);
      const path = params.namingPattern.replace(
        '{step}',
        String(Math.round(stepNumber))
      );

      try {
        this.graph.createNode({
          id: path,
          path: path.split('.'),
          layer: layer,
          type: 'color',
          value: hex,
          metadata: {
            description: `Step ${i + 1}/${steps} of color scale from ${params.baseColor}`,
            colorScience: {
              oklch: { l: scale[i].l, c: scale[i].c, h: scale[i].h },
              computed: true,
            },
          },
        });

        createdTokens.push({
          path,
          value: hex,
          step: Math.round(stepNumber),
        });
      } catch (error) {
        // Token might already exist, skip it
        console.warn(`Skipped creating ${path}: ${error}`);
      }
    }

    return {
      baseColor: params.baseColor,
      steps: steps,
      tokens: createdTokens,
    };
  }

  protected getSuccessMessage(params: GenerateColorScaleParams, result: GenerateColorScaleResult): string {
    return `Generated ${result.tokens.length} color tokens in perceptually uniform scale`;
  }
}
