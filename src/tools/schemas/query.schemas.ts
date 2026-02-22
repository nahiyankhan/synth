/**
 * Validation schemas for Query tools
 */

import { z } from 'zod';

export const GetTokenParamsSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty'),
  mode: z.enum(['light', 'dark']).optional(),
});

export type GetTokenParams = z.infer<typeof GetTokenParamsSchema>;

export const SearchTokensParamsSchema = z.object({
  query: z.string().optional(),
  layer: z.enum(['primitive', 'utility', 'composite']).optional(),
  type: z.enum(['color', 'typography', 'size', 'other']).optional(),
  limit: z.number().int().positive().optional(),
  response_mode: z.enum(['summary', 'full', 'paginated']).default('summary'),
  page: z.number().int().positive().default(1),
  page_size: z.number().int().positive().max(100).default(20),
});

export type SearchTokensParams = z.infer<typeof SearchTokensParamsSchema>;

export const FindAllReferencesParamsSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty'),
  response_mode: z.enum(['summary', 'full']).default('summary'),
});

export type FindAllReferencesParams = z.infer<typeof FindAllReferencesParamsSchema>;

