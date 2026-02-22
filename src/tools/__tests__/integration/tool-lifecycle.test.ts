/**
 * Integration Tests: Tool Lifecycle
 * Tests the complete lifecycle of tool execution
 *
 * NOTE: These tests are SKIPPED because they test the deprecated 3-layer tool architecture
 * (createToken, getToken, updateToken, deleteToken, searchTokens, exportDesignSystem, etc.)
 * which has been replaced by the minimalist filesystem-first architecture following Vercel's approach.
 *
 * New architecture uses executeCommand for CRUD operations:
 * - CREATE: echo '{"id":...}' > tokens/path.json
 * - READ: cat tokens/path.json
 * - UPDATE: echo '{"value":...}' > tokens/path.json
 * - DELETE: rm tokens/path.json
 * - SEARCH: grep -r "pattern" tokens/
 *
 * See test/executeCommand.test.ts for current test coverage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolContext } from '@/core/ToolContext';
import { createMockGraph } from '@/test-utils/mockData';
import { StyleGraph } from '@/core/StyleGraph';

describe.skip('Tool Lifecycle Integration (DEPRECATED - use executeCommand)', () => {
  let context: ToolContext;
  let graph: StyleGraph;

  beforeEach(() => {
    graph = createMockGraph();
    context = new ToolContext(graph);
  });

  it('should complete full CRUD lifecycle for tokens', async () => {
    // CREATE
    const create = await context.executeTool('createToken', {
      path: 'test.color.new',
      value: '#123456',
      layer: 'primitive',
      type: 'color',
    });
    expect(create.success).toBe(true);

    // READ
    const read = await context.executeTool('getToken', {
      path: 'test.color.new',
    });
    expect(read.success).toBe(true);
    expect(read.data.value).toBe('#123456');

    // UPDATE
    const update = await context.executeTool('updateToken', {
      path: 'test.color.new',
      value: '#654321',
    });
    expect(update.success).toBe(true);

    // VERIFY UPDATE
    const verify = await context.executeTool('getToken', {
      path: 'test.color.new',
    });
    expect(verify.success).toBe(true);
    expect(verify.data.value).toBe('#654321');

    // DELETE
    const del = await context.executeTool('deleteToken', {
      path: 'test.color.new',
    });
    expect(del.success).toBe(true);

    // VERIFY DELETE
    const verifyDelete = await context.executeTool('getToken', {
      path: 'test.color.new',
    });
    expect(verifyDelete.success).toBe(false);
  });

  it('should handle undo/redo lifecycle', async () => {
    const originalValue = graph.getNode('base.color.blue.500')?.value;

    // Make a change
    await context.executeTool('updateToken', {
      path: 'base.color.blue.500',
      value: '#FFFFFF',
    });

    // Verify change
    let current = await context.executeTool('getToken', {
      path: 'base.color.blue.500',
    });
    expect(current.data.value).toBe('#FFFFFF');

    // Undo
    const undo = await context.executeTool('undoChange', {});
    expect(undo.success).toBe(true);

    // Verify undo
    current = await context.executeTool('getToken', {
      path: 'base.color.blue.500',
    });
    expect(current.data.value).toBe(originalValue);

    // Redo
    const redo = await context.executeTool('redoChange', {});
    expect(redo.success).toBe(true);

    // Verify redo
    current = await context.executeTool('getToken', {
      path: 'base.color.blue.500',
    });
    expect(current.data.value).toBe('#FFFFFF');
  });

  it('should handle search -> analyze -> modify workflow', async () => {
    // SEARCH for blue tokens
    const search = await context.executeTool('searchTokens', {
      query: 'blue',
      type: 'color',
    });
    expect(search.success).toBe(true);
    expect(search.data.tokens.length).toBeGreaterThan(0);

    // ANALYZE impact of changing one
    const analyze = await context.executeTool('getImpactAnalysis', {
      path: 'base.color.blue.500',
    });
    expect(analyze.success).toBe(true);
    expect(analyze.data.directDependents).toBeDefined();

    // MODIFY if safe
    if (analyze.data.directDependents === 0 || true) { // Force proceed for test
      const modify = await context.executeTool('updateToken', {
        path: 'base.color.blue.500',
        value: '#0000FF',
      });
      expect(modify.success).toBe(true);
    }
  });

  it('should handle export workflow', async () => {
    // Get stats
    const stats = await context.executeTool('getSystemStats', {});
    expect(stats.success).toBe(true);

    // Export as JSON
    const exportJson = await context.executeTool('exportDesignSystem', {
      format: 'json',
    });
    expect(exportJson.success).toBe(true);
    expect(() => JSON.parse(exportJson.data)).not.toThrow();

    // Export as YAML
    const exportYaml = await context.executeTool('exportDesignSystem', {
      format: 'yaml',
    });
    expect(exportYaml.success).toBe(true);
    expect(typeof exportYaml.data).toBe('string');
  });

  it('should handle lazy loading workflow', async () => {
    // Search for a deferred tool
    const searchResults = context.searchTools('color scale', { limit: 5 });
    expect(searchResults.length).toBeGreaterThan(0);

    // Load the tools
    const loaded = context.loadTools(searchResults.map(r => r.name));
    expect(loaded.length).toBeGreaterThan(0);

    // Verify they're now available
    const stats = context.getStats();
    expect(stats.search.loaded).toBeGreaterThan(0);
  });
});

