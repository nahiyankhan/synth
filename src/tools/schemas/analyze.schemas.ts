/**
 * Validation schemas for Analyze tools
 */

import { z } from 'zod';

export const GetImpactAnalysisParamsSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty'),
  response_mode: z.enum(['summary', 'full']).default('summary'),
});

export type GetImpactAnalysisParams = z.infer<typeof GetImpactAnalysisParamsSchema>;

export const GetSystemStatsParamsSchema = z.object({
  includeSpecs: z.boolean().default(false),
});

export type GetSystemStatsParams = z.infer<typeof GetSystemStatsParamsSchema>;

export const AnalyzeDesignSystemParamsSchema = z.object({
  category: z.enum(['all', 'usage', 'redundancy', 'health', 'optimization']).default('all'),
  layer: z.enum(['primitive', 'utility', 'composite']).optional(),
  type: z.enum(['color', 'typography', 'size', 'spacing', 'other']).optional(),
  response_mode: z.enum(['summary', 'full']).default('summary'),
});

export type AnalyzeDesignSystemParams = z.infer<typeof AnalyzeDesignSystemParamsSchema>;

export const SuggestColorsForGapsParamsSchema = z.object({
  filter: z.enum(['all', 'primitives', 'utilities']).default('all'),
  threshold: z.number().min(0).max(1).default(0.15),
  maxSuggestions: z.number().int().positive().max(50).default(10),
});

export type SuggestColorsForGapsParams = z.infer<typeof SuggestColorsForGapsParamsSchema>;

