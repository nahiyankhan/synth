/**
 * Tool Response Helper Utilities
 *
 * Standardized response creators for tool handlers.
 * Reduces boilerplate and ensures consistent response format.
 */

import { ToolResponse } from '../types/toolRegistry';

/**
 * Create a successful tool response
 *
 * @param data - The response data
 * @param message - Optional success message
 * @returns Formatted success response
 *
 * @example
 * return createSuccessResponse({ tokens: foundTokens });
 * return createSuccessResponse(result, 'Token updated successfully');
 */
export function createSuccessResponse<T>(data: T, message?: string): ToolResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Create an error tool response
 *
 * @param error - Error message or Error object
 * @returns Formatted error response
 *
 * @example
 * return createErrorResponse('Token not found');
 * return createErrorResponse(error); // in catch block
 */
export function createErrorResponse(error: string | Error): ToolResponse {
  return {
    success: false,
    error: error instanceof Error ? error.message : error,
  };
}

/**
 * Create an error response from a catch block
 * Safely extracts error message from unknown error type
 *
 * @param error - The caught error (unknown type)
 * @param fallbackMessage - Message to use if error can't be stringified
 * @returns Formatted error response
 *
 * @example
 * try {
 *   // operation
 * } catch (error) {
 *   return createCatchErrorResponse(error, 'Operation failed');
 * }
 */
export function createCatchErrorResponse(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred'
): ToolResponse {
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  if (typeof error === 'string') {
    return { success: false, error };
  }
  return { success: false, error: fallbackMessage };
}

/**
 * Create a "not found" error response
 *
 * @param entityType - Type of entity (e.g., 'Token', 'Color')
 * @param identifier - The identifier that wasn't found
 * @returns Formatted not found error response
 *
 * @example
 * return createNotFoundResponse('Token', 'primary-color');
 * return createNotFoundResponse('Design language', id);
 */
export function createNotFoundResponse(entityType: string, identifier: string): ToolResponse {
  return {
    success: false,
    error: `${entityType} not found: ${identifier}`,
  };
}

/**
 * Create a validation error response
 *
 * @param fieldName - Name of the invalid field
 * @param reason - Why validation failed
 * @returns Formatted validation error response
 *
 * @example
 * return createValidationErrorResponse('color', 'must be a valid hex color');
 */
export function createValidationErrorResponse(fieldName: string, reason: string): ToolResponse {
  return {
    success: false,
    error: `Invalid ${fieldName}: ${reason}`,
  };
}

/**
 * Wrap an async operation with error handling
 *
 * @param operation - The async operation to execute
 * @param errorMessage - Error message prefix for failures
 * @returns The operation result or error response
 *
 * @example
 * return withErrorHandling(
 *   async () => {
 *     const result = await doSomething();
 *     return createSuccessResponse(result);
 *   },
 *   'Failed to process request'
 * );
 */
export async function withErrorHandling<T>(
  operation: () => Promise<ToolResponse<T>>,
  errorMessage?: string
): Promise<ToolResponse<T>> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage ? `${errorMessage}: ${message}` : message,
    };
  }
}
