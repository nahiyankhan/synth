/**
 * Integration Tests: Tool Routing
 * Tests that tools are correctly routed based on context
 *
 * NOTE: These tests are SKIPPED because they test the deprecated 3-layer tool architecture
 * (getToken, searchTokens, getDesignSystemOperations, etc.) which has been replaced by the
 * minimalist filesystem-first architecture following Vercel's approach.
 *
 * New architecture uses:
 * - executeCommand with cat/grep/find for queries
 * - executeCommand with echo/rm for modifications
 * - see MIGRATION.md in VirtualFileSystem for migration guide
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolContext } from '../../../core/ToolContext';
import { createMockGraph } from '../../../test-utils/mockData';

describe.skip('Tool Routing Integration (DEPRECATED - use executeCommand)', () => {
  let context: ToolContext;

  beforeEach(() => {
    const graph = createMockGraph();
    context = new ToolContext(graph);
  });

  it('should route query tools correctly', async () => {
    const result = await context.executeTool('getToken', {
      path: 'base.color.blue.500',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should route modify tools correctly', async () => {
    const result = await context.executeTool('updateToken', {
      path: 'base.color.blue.500',
      value: '#0000FF',
    });

    expect(result.success).toBe(true);
  });

  it('should route analyze tools correctly', async () => {
    const result = await context.executeTool('getSystemStats', {
      includeSpecs: false,
    });

    expect(result.success).toBe(true);
    expect(result.data.totalNodes).toBeDefined();
  });

  it('should handle unknown tools gracefully', async () => {
    const result = await context.executeTool('unknownTool', {});

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown tool');
  });

  it('should validate parameters correctly', async () => {
    const result = await context.executeTool('getToken', {
      path: '', // Invalid: empty path
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Path cannot be empty');
  });

  it('should execute layered operations (discovery -> planning -> execution)', async () => {
    // Layer 1: Discovery
    const operations = await context.executeTool('getDesignSystemOperations', {});
    expect(operations.success).toBe(true);
    expect(operations.data.operations.length).toBeGreaterThan(0);

    // Layer 2: Planning
    const info = await context.executeTool('getOperationInfo', {
      operation: 'getToken',
    });
    expect(info.success).toBe(true);
    expect(info.data.parameters).toBeDefined();

    // Layer 3: Execution
    const execution = await context.executeTool('executeOperation', {
      operation: 'getToken',
      params: { path: 'base.color.blue.500' },
    });
    expect(execution.success).toBe(true);
  });
});

