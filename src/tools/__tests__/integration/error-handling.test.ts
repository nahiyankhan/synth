/**
 * Integration Tests: Error Handling
 * Tests error propagation and handling across the system
 *
 * NOTE: These tests are SKIPPED because they test the deprecated 3-layer tool architecture
 * (createToken, getToken, updateToken, deleteToken) which has been replaced by the
 * minimalist filesystem-first architecture following Vercel's approach.
 *
 * Error handling for the new architecture is tested in:
 * - test/executeCommand.test.ts (file not found, invalid JSON, etc.)
 *
 * New error patterns:
 * - cat nonexistent.json -> "File not found: nonexistent.json"
 * - echo 'invalid' > tokens/x.json -> "Content must be valid JSON"
 * - rm tokens/has-deps.json -> "Token has N dependent(s)"
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolContext } from '../../../core/ToolContext';
import { createMockGraph } from '../../../test-utils/mockData';
import { formatToolError } from '../../errors';

describe.skip('Error Handling Integration (DEPRECATED - use executeCommand)', () => {
  let context: ToolContext;

  beforeEach(() => {
    const graph = createMockGraph();
    context = new ToolContext(graph);
  });

  it('should handle validation errors gracefully', async () => {
    const result = await context.executeTool('createToken', {
      path: '',  // Invalid
      value: '#000000',
      layer: 'primitive',
      type: 'color',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('cannot be empty');
  });

  it('should handle not found errors gracefully', async () => {
    const result = await context.executeTool('getToken', {
      path: 'nonexistent.token.path',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should handle dependency errors gracefully', async () => {
    const result = await context.executeTool('deleteToken', {
      path: 'base.color.blue.500', // Has dependents
      force: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('depend on it');
  });

  it('should provide helpful error messages', async () => {
    const result = await context.executeTool('updateToken', {
      path: 'nonexistent.token',
      value: '#000000',
    });

    expect(result.success).toBe(false);
    const formattedError = formatToolError(new Error(result.error || ''));
    expect(formattedError).toBeTruthy();
    expect(typeof formattedError).toBe('string');
  });

  it('should handle execution errors gracefully', async () => {
    // Try to execute operation with bad params
    const result = await context.executeTool('executeOperation', {
      operation: 'getToken',
      params: { path: '' },  // Invalid params
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle unknown operation errors', async () => {
    const result = await context.executeTool('executeOperation', {
      operation: 'nonexistentOperation',
      params: {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown');
  });
});

