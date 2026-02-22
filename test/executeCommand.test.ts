/**
 * Test for ExecuteCommandHandler
 * Verifies that filesystem exploration works with VirtualFileSystem
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StyleGraph } from '../src/core/StyleGraph';
import { ExecuteCommandHandler } from '../src/tools/handlers/filesystem/ExecuteCommandHandler';

describe('ExecuteCommandHandler', () => {
  let graph: StyleGraph;
  let handler: ExecuteCommandHandler;

  beforeEach(() => {
    graph = new StyleGraph();

    // Create sample tokens for testing with proper dot-notation names
    // This matches real-world usage where names like "base.color.primary"
    // get converted to paths like "tokens/base/color/primary.json"
    graph.createNode({
      id: 'color-primary',
      name: 'base.color.primary',
      type: 'color',
      value: '#0066CC',
      metadata: {
        description: 'Primary brand color',
      },
      intent: {
        purpose: 'Primary action color',
        designedFor: ['buttons', 'CTAs'],
        qualities: ['trustworthy', 'professional'],
      },
    });

    graph.createNode({
      id: 'color-secondary',
      name: 'base.color.secondary',
      type: 'color',
      value: '#FF6600',
      metadata: {
        description: 'Secondary brand color',
      },
    });

    graph.createNode({
      id: 'font-size-base',
      name: 'base.typography.fontSize',
      type: 'typography',
      value: '16px',
    });

    handler = new ExecuteCommandHandler(graph);
  });

  it('should execute ls command', async () => {
    const result = await handler.execute({ command: 'ls tokens/' });
    
    expect(result.success).toBe(true);
    expect(result.data.stdout).toBeTruthy();
    expect(result.data.exitCode).toBe(0);
  });

  it('should execute cat command', async () => {
    const result = await handler.execute({ command: 'cat metadata/stats.json' });
    
    expect(result.success).toBe(true);
    expect(result.data.stdout).toContain('"totalNodes"');
    expect(result.data.exitCode).toBe(0);
  });

  it('should execute grep command', async () => {
    const result = await handler.execute({ command: 'grep -r "primary" tokens/' });

    expect(result.success).toBe(true);
    // Should find "base.color.primary" in the token file content
    expect(result.data.stdout).toContain('primary');
    expect(result.data.exitCode).toBe(0);
  });

  it('should execute find command', async () => {
    // Use -path to match files with "color" in their path (not just filename)
    const result = await handler.execute({ command: 'find tokens/ -path "*color*"' });

    expect(result.success).toBe(true);
    // Should find files in the tokens/base/color/ directory
    expect(result.data.stdout).toContain('color');
    expect(result.data.exitCode).toBe(0);
  });

  it('should execute tree command', async () => {
    const result = await handler.execute({ command: 'tree -L 2 tokens/' });
    
    expect(result.success).toBe(true);
    expect(result.data.stdout).toBeTruthy();
    expect(result.data.exitCode).toBe(0);
  });

  it('should execute wc command', async () => {
    const result = await handler.execute({ command: 'wc metadata/stats.json' });
    
    expect(result.success).toBe(true);
    expect(result.data.stdout).toMatch(/\d+\s+\d+\s+\d+/);
    expect(result.data.exitCode).toBe(0);
  });

  it('should fail with empty command', async () => {
    const result = await handler.execute({ command: '' });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should fail with invalid command', async () => {
    const result = await handler.execute({ command: 'invalid-command' });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should handle file not found', async () => {
    const result = await handler.execute({ command: 'cat nonexistent.json' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  // ============================================
  // WRITE COMMAND TESTS
  // ============================================

  describe('Write Commands', () => {
    it('should execute echo command without redirect (standard echo)', async () => {
      const result = await handler.execute({ command: 'echo hello world' });

      expect(result.success).toBe(true);
      expect(result.data.stdout).toBe('hello world');
      expect(result.data.exitCode).toBe(0);
    });

    it('should create token with echo redirect', async () => {
      const tokenJson = JSON.stringify({
        id: 'test-token',
        name: 'test.color',
        type: 'color',
        value: '#FF0000'
      });

      const result = await handler.execute({
        command: `echo '${tokenJson}' > tokens/test/color.json`
      });

      expect(result.success).toBe(true);
      expect(result.data.exitCode).toBe(0);
      expect(result.data.isWriteCommand).toBe(true);

      // Verify token was created in graph
      const node = Array.from(graph.nodes.values()).find(n => n.name === 'test.color');
      expect(node).toBeDefined();
      expect(node?.value).toBe('#FF0000');
    });

    it('should reject writes outside tokens/ directory', async () => {
      const result = await handler.execute({
        command: `echo '{"test": true}' > schema/hack.json`
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('only permitted in tokens/');
    });

    it('should reject invalid JSON in echo', async () => {
      const result = await handler.execute({
        command: `echo 'not valid json' > tokens/test.json`
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('valid JSON');
    });

    it('should delete token with rm command', async () => {
      // First verify the token exists
      const initialNodeCount = graph.nodes.size;

      // Create a standalone token (no dependents) for deletion
      graph.createNode({
        id: 'deletable-token',
        name: 'deletable.test',
        type: 'color',
        value: '#999999',
      });

      expect(graph.nodes.size).toBe(initialNodeCount + 1);

      // Refresh handler to pick up new token
      handler.refresh();

      const result = await handler.execute({
        command: 'rm tokens/deletable/test.json'
      });

      expect(result.success).toBe(true);
      expect(result.data.exitCode).toBe(0);
      expect(graph.nodes.size).toBe(initialNodeCount);
    });

    it('should warn when deleting token with dependents', async () => {
      // Create a token with a dependent
      graph.createNode({
        id: 'base-token',
        name: 'base.color.test',
        type: 'color',
        value: '#000000',
      });

      graph.createNode({
        id: 'dependent-token',
        name: 'semantic.color.test',
        type: 'color',
        value: '{base-token}', // References base-token
      });

      handler.refresh();

      const result = await handler.execute({
        command: 'rm tokens/base/color/test.json'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('dependent');
      expect(result.error).toContain('-f');
    });

    it('should force delete with rm -f', async () => {
      // Create tokens with dependency
      graph.createNode({
        id: 'force-base',
        name: 'force.base.test',
        type: 'color',
        value: '#111111',
      });

      graph.createNode({
        id: 'force-dep',
        name: 'force.dep.test',
        type: 'color',
        value: '{force-base}',
      });

      const initialCount = graph.nodes.size;
      handler.refresh();

      const result = await handler.execute({
        command: 'rm -f tokens/force/base/test.json'
      });

      expect(result.success).toBe(true);
      expect(graph.nodes.size).toBe(initialCount - 1);
    });

    it('should reject rm outside tokens/ directory', async () => {
      const result = await handler.execute({
        command: 'rm schema/colors.cube.yaml'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('only permitted in tokens/');
    });

    it('should create directory with mkdir', async () => {
      const result = await handler.execute({
        command: 'mkdir tokens/new/category'
      });

      // mkdir without -p should fail if parent doesn't exist
      expect(result.success).toBe(false);
    });

    it('should create nested directories with mkdir -p', async () => {
      const result = await handler.execute({
        command: 'mkdir -p tokens/deep/nested/path'
      });

      expect(result.success).toBe(true);
      expect(result.data.exitCode).toBe(0);
    });

    it('should reject mkdir outside tokens/', async () => {
      const result = await handler.execute({
        command: 'mkdir -p schema/new/path'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('only permitted');
    });
  });

  // ============================================
  // BRAND CONTEXT TESTS
  // ============================================

  describe('Brand Context Files', () => {
    it('should have brand directory when context provided', async () => {
      // Create handler with brand context
      const handlerWithBrand = new ExecuteCommandHandler(graph);
      handlerWithBrand.setPersistenceCallbacks({
        getBrandContext: async () => ({
          strategy: {
            analysis: {
              industry: 'Technology',
              audience: 'Developers',
            },
            recommendation: {
              direction: 'Modern and minimal',
            },
          },
          identity: {
            traits: ['Professional', 'Innovative'],
            designPrinciples: ['Clarity first', 'Consistency'],
          },
        }),
      });

      // Force VFS recreation
      handlerWithBrand.refresh();

      const result = await handlerWithBrand.execute({ command: 'ls brand/' });

      expect(result.success).toBe(true);
      expect(result.data.stdout).toContain('strategy.json');
      expect(result.data.stdout).toContain('identity.json');
    });
  });

  // ============================================
  // EXPORT FILES TESTS
  // ============================================

  describe('Export Files', () => {
    it('should have exports directory', async () => {
      const result = await handler.execute({ command: 'ls exports/' });

      expect(result.success).toBe(true);
      expect(result.data.stdout).toContain('css');
      expect(result.data.stdout).toContain('json');
      expect(result.data.stdout).toContain('scss');
    });

    it('should generate CSS tokens', async () => {
      const result = await handler.execute({ command: 'cat exports/css/tokens.css' });

      expect(result.success).toBe(true);
      expect(result.data.stdout).toContain(':root');
      expect(result.data.stdout).toContain('--');
    });

    it('should generate DTCG JSON format', async () => {
      const result = await handler.execute({ command: 'cat exports/json/tokens.json' });

      expect(result.success).toBe(true);
      const json = JSON.parse(result.data.stdout);
      expect(json).toBeDefined();
    });

    it('should generate SCSS variables', async () => {
      const result = await handler.execute({ command: 'cat exports/scss/_variables.scss' });

      expect(result.success).toBe(true);
      expect(result.data.stdout).toContain('$');
    });
  });

  // ============================================
  // PATH-NODE MAPPING TESTS
  // ============================================

  describe('Path-Node Mapping', () => {
    it('should map path to node correctly via echo/cat roundtrip', async () => {
      const tokenJson = JSON.stringify({
        id: 'roundtrip-test',
        name: 'roundtrip.test.color',
        type: 'color',
        value: '#AABBCC'
      });

      // Create token via echo
      await handler.execute({
        command: `echo '${tokenJson}' > tokens/roundtrip/test/color.json`
      });

      // Read it back via cat
      const result = await handler.execute({
        command: 'cat tokens/roundtrip/test/color.json'
      });

      expect(result.success).toBe(true);
      const parsed = JSON.parse(result.data.stdout);
      expect(parsed.value).toBe('#AABBCC');
    });
  });
});

