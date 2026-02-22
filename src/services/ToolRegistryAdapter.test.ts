import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistryAdapter } from './ToolRegistryAdapter';
import { createMockGraph } from '@/test-utils/mockData';
import { StyleGraph } from '@/core/StyleGraph';

describe('ToolRegistryAdapter', () => {
  let adapter: ToolRegistryAdapter;
  let graph: StyleGraph;

  beforeEach(() => {
    graph = createMockGraph();
    adapter = new ToolRegistryAdapter(graph);
  });

  describe('handleTool - getToken', () => {
    it('should return token info for valid path', async () => {
      const result = await adapter.handleTool('getToken', { path: 'base.color.blue.500' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.path).toBe('base.color.blue.500');
      expect(result.data.layer).toBe('primitive');
      expect(result.data.type).toBe('color');
    });

    it('should return error for missing token', async () => {
      const result = await adapter.handleTool('getToken', { path: 'nonexistent.token' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('handleTool - searchTokens', () => {
    it('should search all tokens without filter', async () => {
      const result = await adapter.handleTool('searchTokens', {});

      expect(result.success).toBe(true);
      expect(result.data.tokens.length).toBeGreaterThan(0);
    });

    it('should filter by layer', async () => {
      const result = await adapter.handleTool('searchTokens', { layer: 'primitive' });

      expect(result.success).toBe(true);
      expect(result.data.tokens.every((t: any) => t.layer === 'primitive')).toBe(true);
    });

    it('should filter by type', async () => {
      const result = await adapter.handleTool('searchTokens', { type: 'color' });

      expect(result.success).toBe(true);
      expect(result.data.tokens.every((t: any) => t.type === 'color')).toBe(true);
    });
  });

  describe('handleTool - updateToken', () => {
    it('should update token value', async () => {
      const result = await adapter.handleTool('updateToken', {
        path: 'base.color.blue.500',
        value: '#0000FF',
      });

      expect(result.success).toBe(true);
      expect(result.data.newValue).toBe('#0000FF');
    });

    it('should return error for non-existent token', async () => {
      const result = await adapter.handleTool('updateToken', {
        path: 'nonexistent.token',
        value: '#000000',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('handleTool - createToken', () => {
    it('should create new token', async () => {
      const result = await adapter.handleTool('createToken', {
        path: 'base.color.green.500',
        value: '#10B981',
        type: 'color',
      });

      expect(result.success).toBe(true);
      expect(result.data.path).toBe('base.color.green.500');
    });

    it('should return error if token already exists', async () => {
      const result = await adapter.handleTool('createToken', {
        path: 'base.color.blue.500',
        value: '#000000',
        type: 'color',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('handleTool - deleteToken', () => {
    it('should delete token without dependents', async () => {
      const result = await adapter.handleTool('deleteToken', {
        path: 'base.spacing.medium',
        force: false,
      });

      expect(result.success).toBe(true);
    });

    it('should return error for token with dependents without force', async () => {
      const result = await adapter.handleTool('deleteToken', {
        path: 'base.color.blue.500',
        force: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('depend on it');
    });
  });

  describe('handleTool - getImpactAnalysis', () => {
    it('should analyze impact for token with dependents', async () => {
      const result = await adapter.handleTool('getImpactAnalysis', {
        path: 'base.color.blue.500',
      });

      expect(result.success).toBe(true);
      expect(result.data.directDependents).toBeGreaterThan(0);
    });
  });

  describe('handleTool - getSystemStats', () => {
    it('should return system statistics', async () => {
      const result = await adapter.handleTool('getSystemStats', {});

      expect(result.success).toBe(true);
      expect(result.data.totalNodes).toBeGreaterThan(0);
      expect(result.data.byLayer).toBeDefined();
      expect(result.data.byType).toBeDefined();
    });
  });

  describe('handleTool - undoChange/redoChange', () => {
    it('should undo a change', async () => {
      // Make a change first
      await adapter.handleTool('updateToken', {
        path: 'base.color.blue.500',
        value: '#0000FF',
      });

      const result = await adapter.handleTool('undoChange', {});

      expect(result.success).toBe(true);
    });

    it('should return error when nothing to undo', async () => {
      const freshGraph = new StyleGraph();
      const freshAdapter = new ToolRegistryAdapter(freshGraph);

      const result = await freshAdapter.handleTool('undoChange', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Nothing to undo');
    });
  });

  describe('handleTool - exportDesignSystem', () => {
    it('should export as JSON by default', async () => {
      const result = await adapter.handleTool('exportDesignSystem', {});

      expect(result.success).toBe(true);
      expect(() => JSON.parse(result.data)).not.toThrow();
    });
  });

  describe('handleTool - unknown tool', () => {
    it('should return error for unknown tool', async () => {
      const result = await adapter.handleTool('unknownTool', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });
  });

  describe('discovery layer - get_design_system_operations', () => {
    it('should list all operations', async () => {
      const result = await adapter.handleTool('get_design_system_operations', {});

      expect(result.success).toBe(true);
      expect(result.data.operations.length).toBeGreaterThan(0);
      expect(result.data.categories).toBeDefined();
    });

    it('should filter by category', async () => {
      const result = await adapter.handleTool('get_design_system_operations', {
        category: 'query',
      });

      expect(result.success).toBe(true);
      expect(result.data.operations.every((op: any) => op.category === 'query')).toBe(true);
    });
  });

  describe('discovery layer - get_operation_info', () => {
    it('should return operation details', async () => {
      const result = await adapter.handleTool('get_operation_info', {
        operation: 'getToken',
      });

      expect(result.success).toBe(true);
      expect(result.data.description).toBeDefined();
    });

    it('should return error for unknown operation', async () => {
      const result = await adapter.handleTool('get_operation_info', {
        operation: 'unknownOperation',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('execution layer - execute_operation', () => {
    it('should execute operation via execute_operation', async () => {
      const result = await adapter.handleTool('execute_operation', {
        operation: 'getToken',
        params: { path: 'base.color.blue.500' },
      });

      expect(result.success).toBe(true);
      expect(result.data.path).toBe('base.color.blue.500');
    });
  });
});
