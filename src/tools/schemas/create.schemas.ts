/**
 * Validation schemas for Create tools
 */

import { z } from 'zod';

export const GenerateColorScaleParamsSchema = z.object({
  baseColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color (#RRGGBB)'),
  steps: z.number().int().min(3).max(15).default(9),
  namingPattern: z.string().min(1).refine(
    val => val.includes('{step}'),
    'Naming pattern must include {step} placeholder'
  ),
  layer: z.enum(['primitive', 'utility']).default('primitive'),
});

export type GenerateColorScaleParams = z.infer<typeof GenerateColorScaleParamsSchema>;

export const GenerateDesignSystemParamsSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  focus: z.enum(['full', 'colors', 'typography']).default('full'),
});

export type GenerateDesignSystemParams = z.infer<typeof GenerateDesignSystemParamsSchema>;

