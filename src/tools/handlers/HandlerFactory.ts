/**
 * Handler Factory
 * Creates tool handlers by wrapping existing ToolHandlers methods
 * This allows us to migrate incrementally without rewriting all handlers at once
 */

import { ToolHandler } from '@/core/ToolHandler';
import { ToolDefinition, ToolResponse } from '@/types/toolRegistry';
import { ToolHandlers } from '@/services/toolHandlers';
import { z } from 'zod';

/**
 * Generic handler that wraps an existing ToolHandlers method
 */
export class LegacyToolHandler<TParams = any, TResult = any> extends ToolHandler<TParams, TResult> {
  constructor(
    definition: ToolDefinition,
    private toolHandlers: ToolHandlers,
    private methodName: string,
    private schema?: z.ZodSchema<TParams>
  ) {
    super(definition);
  }

  protected validate(params: unknown): TParams {
    if (this.schema) {
      return this.schema.parse(params);
    }
    // If no schema provided, pass through (for gradual migration)
    return params as TParams;
  }

  protected async handle(params: TParams): Promise<TResult> {
    // Call the corresponding method on ToolHandlers
    const method = (this.toolHandlers as any)[this.methodName];
    
    if (typeof method !== 'function') {
      throw new Error(`Method ${this.methodName} not found on ToolHandlers`);
    }

    const result = await method.call(this.toolHandlers, params);
    
    // ToolHandlers returns ToolResponse, extract the data
    if (result && typeof result === 'object' && 'success' in result) {
      if (!result.success) {
        throw new Error(result.error || 'Operation failed');
      }
      return result.data as TResult;
    }
    
    return result as TResult;
  }

  protected getSuccessMessage(params: TParams, result: TResult): string | undefined {
    // Try to extract message from result if it's a ToolResponse-like object
    if (result && typeof result === 'object' && 'message' in result) {
      return (result as any).message;
    }
    return undefined;
  }
}

/**
 * Factory to create handlers from tool definitions
 */
export class HandlerFactory {
  constructor(private toolHandlers: ToolHandlers) {}

  /**
   * Create a handler for a tool definition
   * Maps tool names to their corresponding ToolHandlers methods
   */
  createHandler(definition: ToolDefinition, schema?: z.ZodSchema): ToolHandler {
    const methodName = this.getMethodName(definition.name);
    return new LegacyToolHandler(definition, this.toolHandlers, methodName, schema);
  }

  /**
   * Map tool names to ToolHandlers method names
   * Handles naming inconsistencies (e.g., snake_case to camelCase)
   */
  private getMethodName(toolName: string): string {
    // Handle special cases
    const methodMap: Record<string, string> = {
      'get_design_system_operations': 'getDesignSystemOperations',
      'get_operation_info': 'getOperationInfo',
      'execute_operation': 'executeOperation',
    };

    if (methodMap[toolName]) {
      return methodMap[toolName];
    }

    // Default: tool name is the method name
    return toolName;
  }

  /**
   * Create handlers for all tool definitions
   */
  createAllHandlers(definitions: ToolDefinition[], schemas?: Map<string, z.ZodSchema>): ToolHandler[] {
    return definitions.map(def => {
      const schema = schemas?.get(def.name);
      return this.createHandler(def, schema);
    });
  }
}

