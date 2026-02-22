/**
 * Validation schemas for Content tools
 */

import { z } from 'zod';

export const AuditTextParamsSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(5000, 'Text too long (max 5000 characters)'),
  topK: z.number().int().positive().max(20).default(5).optional(),
});

export type AuditTextParams = z.infer<typeof AuditTextParamsSchema>;

export const SearchGuidelinesParamsSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  type: z.enum(['all', 'rule', 'example', 'dont']).default('all').optional(),
  topK: z.number().int().positive().max(20).default(5).optional(),
});

export type SearchGuidelinesParams = z.infer<typeof SearchGuidelinesParamsSchema>;

