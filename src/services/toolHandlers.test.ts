import { describe, it, expect, beforeEach } from 'vitest';
import { ToolHandlers } from './toolHandlers';
import { createMockGraph } from '@/test-utils/mockData';
import { StyleGraph } from '@/core/StyleGraph';

describe('ToolHandlers', () => {
  let handlers: ToolHandlers;
  let graph: StyleGraph;

  beforeEach(() => {
    graph = createMockGraph();
    handlers = new ToolHandlers(graph);
  });

  describe('getToken', () => {
    it('should return token info for valid path', async () => {
      const result = await handlers.getToken({ path: 'base.color.blue.500' });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.path).toBe('base.color.blue.500');
      expect(result.data.layer).toBe('primitive');
      expect(result.data.type).toBe('color');
    });

    it('should return error for missing token', async () => {
      const result = await handlers.getToken({ path: 'nonexistent.token' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should resolve dependencies correctly', async () => {
      const result = await handlers.getToken({ path: 'semantic.color.primary' });
      
      expect(result.success).toBe(true);
      expect(result.data.dependencies).toContain('base.color.blue.500');
    });
  });

  describe('searchTokens', () => {
    it('should search all tokens without filter', async () => {
      const result = await handlers.searchTokens({});
      
      expect(result.success).toBe(true);
      expect(result.data.tokens.length).toBeGreaterThan(0);
    });

    it('should filter by layer', async () => {
      const result = await handlers.searchTokens({ layer: 'primitive' });
      
      expect(result.success).toBe(true);
      expect(result.data.tokens.every((t: any) => t.layer === 'primitive')).toBe(true);
    });

    it('should filter by type', async () => {
      const result = await handlers.searchTokens({ type: 'color' });
      
      expect(result.success).toBe(true);
      expect(result.data.tokens.every((t: any) => t.type === 'color')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const result = await handlers.searchTokens({ limit: 2 });
      
      expect(result.success).toBe(true);
      expect(result.data.tokens.length).toBeLessThanOrEqual(2);
    });

    it('should search by query string', async () => {
      const result = await handlers.searchTokens({ query: 'blue' });
      
      expect(result.success).toBe(true);
      expect(result.data.tokens.some((t: any) => t.path.includes('blue'))).toBe(true);
    });
  });

  describe('updateToken', () => {
    it('should update token value', async () => {
      const result = await handlers.updateToken({
        path: 'base.color.blue.500',
        value: '#0000FF',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.newValue).toBe('#0000FF');
    });

    it('should return error for non-existent token', async () => {
      const result = await handlers.updateToken({
        path: 'nonexistent.token',
        value: '#000000',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should update numeric values', async () => {
      const result = await handlers.updateToken({
        path: 'base.spacing.medium',
        value: '24',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.newValue).toBe(24);
    });
  });

  describe('createToken', () => {
    it('should create new primitive token', async () => {
      const result = await handlers.createToken({
        path: 'base.color.green.500',
        value: '#10B981',
        layer: 'primitive',
        type: 'color',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.path).toBe('base.color.green.500');
    });

    it('should create new utility token with reference', async () => {
      const result = await handlers.createToken({
        path: 'semantic.color.success',
        value: '{base.color.blue.500}',
        layer: 'utility',
        type: 'color',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.value).toBe('{base.color.blue.500}');
    });

    it('should return error if token already exists', async () => {
      const result = await handlers.createToken({
        path: 'base.color.blue.500',
        value: '#000000',
        layer: 'primitive',
        type: 'color',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('deleteToken', () => {
    it('should delete token without dependents', async () => {
      const result = await handlers.deleteToken({
        path: 'base.spacing.medium',
        force: false,
      });
      
      expect(result.success).toBe(true);
    });

    it('should return error for token with dependents without force', async () => {
      const result = await handlers.deleteToken({
        path: 'base.color.blue.500',
        force: false,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('depend on it');
    });

    it('should delete token with dependents when force=true', async () => {
      const result = await handlers.deleteToken({
        path: 'base.color.blue.500',
        force: true,
      });
      
      expect(result.success).toBe(true);
    });

    it('should return error for non-existent token', async () => {
      const result = await handlers.deleteToken({
        path: 'nonexistent.token',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getImpactAnalysis', () => {
    it('should analyze impact for token with dependents', async () => {
      const result = await handlers.getImpactAnalysis({
        path: 'base.color.blue.500',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.directDependents).toBeGreaterThan(0);
      expect(result.data.affectedUtilities).toBeDefined();
    });

    it('should return zero impact for token without dependents', async () => {
      const result = await handlers.getImpactAnalysis({
        path: 'base.spacing.medium',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.directDependents).toBe(0);
    });
  });

  describe('getSystemStats', () => {
    it('should return system statistics', async () => {
      const result = await handlers.getSystemStats({});
      
      expect(result.success).toBe(true);
      expect(result.data.totalNodes).toBeGreaterThan(0);
      expect(result.data.byLayer).toBeDefined();
      expect(result.data.byType).toBeDefined();
    });
  });

  describe('undoChange', () => {
    it('should undo a change', async () => {
      // Make a change first
      await handlers.updateToken({
        path: 'base.color.blue.500',
        value: '#0000FF',
      });
      
      const result = await handlers.undoChange();
      
      expect(result.success).toBe(true);
    });

    it('should return error when nothing to undo', async () => {
      // Clear history by creating new graph
      const freshGraph = new StyleGraph();
      const freshHandlers = new ToolHandlers(freshGraph);
      
      const result = await freshHandlers.undoChange();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nothing to undo');
    });
  });

  describe('redoChange', () => {
    it('should redo a change', async () => {
      // Make and undo a change
      await handlers.updateToken({
        path: 'base.color.blue.500',
        value: '#0000FF',
      });
      await handlers.undoChange();
      
      const result = await handlers.redoChange();
      
      expect(result.success).toBe(true);
    });

    it('should return error when nothing to redo', async () => {
      const result = await handlers.redoChange();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nothing to redo');
    });
  });

  describe('exportDesignSystem', () => {
    it('should export as JSON by default', async () => {
      const result = await handlers.exportDesignSystem({});
      
      expect(result.success).toBe(true);
      expect(() => JSON.parse(result.data)).not.toThrow();
    });

    it('should export as YAML when specified', async () => {
      const result = await handlers.exportDesignSystem({ format: 'yaml' });
      
      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
    });
  });

  describe('analyzeDesignSystem', () => {
    it('should analyze full system', async () => {
      const result = await handlers.analyzeDesignSystem({
        category: 'all',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.insights).toBeDefined();
      expect(result.data.summary).toBeDefined();
    });

    it('should analyze specific category', async () => {
      const result = await handlers.analyzeDesignSystem({
        category: 'health',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.health).toBeDefined();
    });
  });

  describe('renameToken', () => {
    it('should rename token and update references', async () => {
      const result = await handlers.renameToken({
        oldPath: 'base.color.blue.500',
        newPath: 'base.color.primary.500',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.newPath).toBe('base.color.primary.500');
    });
  });

  describe('findAllReferences', () => {
    it('should find references to a token', async () => {
      const result = await handlers.findAllReferences({
        path: 'base.color.blue.500',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.directReferences).toBeDefined();
      expect(result.data.usageCount).toBeGreaterThanOrEqual(0);
    });

    it('should return error for non-existent token', async () => {
      const result = await handlers.findAllReferences({
        path: 'nonexistent.token',
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('handleTool dispatcher', () => {
    it('should route to correct handler', async () => {
      const result = await handlers.handleTool('getToken', {
        path: 'base.color.blue.500',
      });
      
      expect(result.success).toBe(true);
    });

    it('should return error for unknown tool', async () => {
      const result = await handlers.handleTool('unknownTool', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });
  });

  describe('getDesignSystemOperations', () => {
    it('should list all operations', async () => {
      const result = await handlers.getDesignSystemOperations({});
      
      expect(result.success).toBe(true);
      expect(result.data.operations.length).toBeGreaterThan(0);
      expect(result.data.categories).toBeDefined();
    });

    it('should filter by category', async () => {
      const result = await handlers.getDesignSystemOperations({
        category: 'query',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.operations.every((op: any) => op.category === 'query')).toBe(true);
    });
  });

  describe('getOperationInfo', () => {
    it('should return operation details', async () => {
      const result = await handlers.getOperationInfo({
        operation: 'getToken',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.parameters).toBeDefined();
      expect(result.data.description).toBeDefined();
    });

    it('should return error for unknown operation', async () => {
      const result = await handlers.getOperationInfo({
        operation: 'unknownOperation',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown operation');
    });
  });
});

