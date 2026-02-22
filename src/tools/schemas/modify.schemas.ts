/**
 * Validation schemas for Modify tools
 */

import { z } from 'zod';

export const CreateTokenParamsSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty'),
  value: z.string().min(1, 'Value cannot be empty'),
  layer: z.enum(['primitive', 'utility']),
  type: z.enum(['color', 'typography', 'size', 'other']),
  description: z.string().optional(),
});

export type CreateTokenParams = z.infer<typeof CreateTokenParamsSchema>;

export const UpdateTokenParamsSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty'),
  value: z.string().min(1, 'Value cannot be empty'),
  description: z.string().optional(),
});

export type UpdateTokenParams = z.infer<typeof UpdateTokenParamsSchema>;

export const DeleteTokenParamsSchema = z.object({
  path: z.string().min(1, 'Path cannot be empty'),
  force: z.boolean().default(false),
});

export type DeleteTokenParams = z.infer<typeof DeleteTokenParamsSchema>;

export const RenameTokenParamsSchema = z.object({
  oldPath: z.string().min(1, 'Old path cannot be empty'),
  newPath: z.string().min(1, 'New path cannot be empty'),
});

export type RenameTokenParams = z.infer<typeof RenameTokenParamsSchema>;

export const FindAndReplaceParamsSchema = z.object({
  searchPattern: z.string().min(1, 'Search pattern cannot be empty'),
  replaceWith: z.string(),
  searchIn: z.enum(['path', 'value', 'both']),
  matchType: z.enum(['exact', 'contains', 'regex']),
  layer: z.enum(['primitive', 'utility']).optional(),
  type: z.enum(['color', 'typography', 'size', 'spacing', 'other']).optional(),
  dryRun: z.boolean().default(true),
  response_mode: z.enum(['summary', 'paginated']).default('summary'),
  page: z.number().int().positive().default(1),
  page_size: z.number().int().positive().max(100).default(20),
});

export type FindAndReplaceParams = z.infer<typeof FindAndReplaceParamsSchema>;

