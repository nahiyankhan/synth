/**
 * Validation schemas for Navigation tools
 */

import { z } from 'zod';

export const GetDesignSystemPreviewParamsSchema = z.object({
  id: z.string().min(1, 'ID cannot be empty'),
});

export type GetDesignSystemPreviewParams = z.infer<typeof GetDesignSystemPreviewParamsSchema>;

export const LoadDesignSystemParamsSchema = z.object({
  id: z.string().min(1, 'ID cannot be empty'),
});

export type LoadDesignSystemParams = z.infer<typeof LoadDesignSystemParamsSchema>;

export const DeleteDesignSystemParamsSchema = z.object({
  id: z.string().min(1, 'ID cannot be empty'),
});

export type DeleteDesignSystemParams = z.infer<typeof DeleteDesignSystemParamsSchema>;

export const NavigateToViewParamsSchema = z.object({
  view: z.enum(['gallery', 'colors', 'typography', 'sizes', 'components', 'content']),
});

export type NavigateToViewParams = z.infer<typeof NavigateToViewParamsSchema>;

