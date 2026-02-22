/**
 * Tool Error Classes
 * Standardized error types for tool execution
 */

export class ToolError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

export class ToolValidationError extends ToolError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class ToolNotFoundError extends ToolError {
  constructor(toolName: string) {
    super(`Tool not found: ${toolName}`, 'NOT_FOUND', { toolName });
  }
}

export class ToolExecutionError extends ToolError {
  constructor(message: string, details?: any) {
    super(message, 'EXECUTION_ERROR', details);
  }
}

export class TokenNotFoundError extends ToolError {
  constructor(path: string) {
    super(`Token not found: ${path}`, 'TOKEN_NOT_FOUND', { path });
  }
}

export class DependencyError extends ToolError {
  constructor(message: string, details?: any) {
    super(message, 'DEPENDENCY_ERROR', details);
  }
}

/**
 * Format tool errors for user-friendly display
 */
export function formatToolError(error: ToolError | Error): string {
  if (!(error instanceof ToolError)) {
    return error.message || 'Unknown error occurred';
  }

  switch (error.code) {
    case 'VALIDATION_ERROR':
      return `Invalid parameters: ${error.message}${
        error.details ? `\nDetails: ${JSON.stringify(error.details, null, 2)}` : ''
      }`;
    
    case 'NOT_FOUND':
      return `Resource not found: ${error.message}`;
    
    case 'TOKEN_NOT_FOUND':
      return `Token "${error.details?.path}" not found in the design system`;
    
    case 'DEPENDENCY_ERROR':
      return `Dependency issue: ${error.message}`;
    
    case 'EXECUTION_ERROR':
      return `Execution failed: ${error.message}`;
    
    default:
      return error.message;
  }
}

/**
 * Format validation details from Zod errors
 */
export function formatValidationDetails(details: any): string {
  if (!details) return '';
  
  if (Array.isArray(details)) {
    return details.map(err => `  - ${err.path.join('.')}: ${err.message}`).join('\n');
  }
  
  return JSON.stringify(details, null, 2);
}

