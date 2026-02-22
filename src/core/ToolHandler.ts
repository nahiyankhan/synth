/**
 * Base class for all tool handlers
 * Provides consistent error handling, validation, and execution flow
 */

import { ToolDefinition, ToolResponse } from '../types/toolRegistry';

export abstract class ToolHandler<TParams = any, TResult = any> {
  constructor(protected definition: ToolDefinition) {}

  /**
   * Execute the tool with the given parameters
   * Handles validation, execution, and error handling automatically
   */
  async execute(params: unknown): Promise<ToolResponse<TResult>> {
    try {
      const validated = this.validate(params);
      const result = await this.handle(validated);
      return {
        success: true,
        data: result,
        message: this.getSuccessMessage(validated, result),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Tool execution failed',
      };
    }
  }

  /**
   * Validate and parse the input parameters
   * Should throw an error if validation fails
   */
  protected abstract validate(params: unknown): TParams;

  /**
   * Handle the actual tool logic
   * Should throw an error if execution fails
   */
  protected abstract handle(params: TParams): Promise<TResult>;

  /**
   * Get the tool definition
   */
  getDefinition(): ToolDefinition {
    return this.definition;
  }

  /**
   * Get a success message for the tool execution
   * Can be overridden by subclasses for custom messages
   */
  protected getSuccessMessage(params: TParams, result: TResult): string | undefined {
    return undefined;
  }

  /**
   * Get the tool name
   */
  getName(): string {
    return this.definition.name;
  }

  /**
   * Get the tool version
   */
  getVersion(): string {
    return this.definition.version;
  }

  /**
   * Get the tool category
   */
  getCategory(): string {
    return this.definition.category;
  }
}

