/**
 * Centralized Error Handler
 * Provides consistent error response format across all API endpoints
 */

import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * Global error handler for Hono app
 * Handles Zod validation errors, API key errors, and generic errors
 */
export const errorHandler: ErrorHandler = (err, c) => {
  console.error('API Error:', err);

  // Zod validation errors (Zod v4 uses .issues)
  if (err instanceof ZodError) {
    return c.json<ApiError>(
      {
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
      400
    );
  }

  // API key related errors
  if (err.message?.toLowerCase().includes('api key')) {
    return c.json<ApiError>(
      {
        success: false,
        error: 'Missing or invalid API key',
        code: 'MISSING_API_KEY',
      },
      401
    );
  }

  // Rate limit errors (if using external APIs)
  if (err.message?.toLowerCase().includes('rate limit')) {
    return c.json<ApiError>(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT',
      },
      429
    );
  }

  // Generic error
  return c.json<ApiError>(
    {
      success: false,
      error: err.message || 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    500
  );
};
