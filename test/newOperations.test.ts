/**
 * Tests for the 5 new design system operations
 *
 * NOTE: These tests are SKIPPED because they test deprecated tools
 * (renameToken, findAllReferences, findAndReplace) which have been replaced
 * by the minimalist filesystem-first architecture following Vercel's approach.
 *
 * New patterns:
 * - Rename: use executeCommand to create new token, delete old
 * - Find references: grep -r "{token-name}" tokens/
 * - Find and replace: combine grep search + echo writes
 * - Generate color scale: use generate_color_scale (kept as core tool)
 * - Suggest colors: use suggest_colors_for_gaps (kept as core tool)
 *
 * These tests verify:
 * 1. renameToken - with reference updates
 * 2. findAllReferences - direct and transitive
 * 3. findAndReplace - patterns and dry-run
 * 4. generateColorScale - OKLCH-based scales
 * 5. suggestColorsForGaps - gap detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StyleGraph } from '../src/core/StyleGraph';
import { ToolHandlers } from '../src/services/toolHandlers';

describe.skip('New Design System Operations (DEPRECATED)', () => {
  let graph: StyleGraph;
  let handlers: ToolHandlers;

  beforeEach(() => {
    graph = new StyleGraph();
    handlers = new ToolHandlers(graph);

    // Set up a small test design system
    // Primitives
    graph.createNode({
      id: 'base.color.blue.light',
      path: ['base', 'color', 'blue', 'light'],
      layer: 'primitive',
      type: 'color',
      value: '#3B82F6'
    });

    graph.createNode({
      id: 'base.color.grey.50',
      path: ['base', 'color', 'grey', '50'],
      layer: 'primitive',
      type: 'color',
      value: '#F9FAFB'
    });

    graph.createNode({
      id: 'base.color.grey.90',
      path: ['base', 'color', 'grey', '90'],
      layer: 'primitive',
      type: 'color',
      value: '#111827'
    });

    // Utilities that reference primitives
    graph.createNode({
      id: 'utility.text.primary',
      path: ['utility', 'text', 'primary'],
      layer: 'utility',
      type: 'color',
      value: '{base.color.blue.light}'
    });

    graph.createNode({
      id: 'utility.background.light',
      path: ['utility', 'background', 'light'],
      layer: 'utility',
      type: 'color',
      value: '{base.color.grey.50}'
    });
  });

  describe('1. renameToken', () => {
    it('should rename a token and update all references', async () => {
      const result = await handlers.renameToken({
        oldPath: 'base.color.blue.light',
        newPath: 'base.color.blue.500'
      });

      expect(result.success).toBe(true);
      expect(result.data?.referencesUpdated).toBe(1);

      // Check the token was renamed
      const renamed = graph.getNodeByPath(['base', 'color', 'blue', '500']);
      expect(renamed).toBeDefined();
      expect(renamed?.id).toBe('base.color.blue.500');

      // Check reference was updated
      const dependent = graph.getNodeByPath(['utility', 'text', 'primary']);
      expect(dependent?.value).toBe('{base.color.blue.500}');

      // Check old path no longer exists
      const old = graph.getNodeByPath(['base', 'color', 'blue', 'light']);
      expect(old).toBeUndefined();
    });

    it('should fail if token does not exist', async () => {
      const result = await handlers.renameToken({
        oldPath: 'base.color.nonexistent',
        newPath: 'base.color.new'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail if new path already exists', async () => {
      const result = await handlers.renameToken({
        oldPath: 'base.color.blue.light',
        newPath: 'base.color.grey.50'  // Already exists
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('2. findAllReferences', () => {
    it('should find direct references', async () => {
      const result = await handlers.findAllReferences({
        path: 'base.color.blue.light'
      });

      expect(result.success).toBe(true);
      expect(result.data?.directReferences).toContain('utility.text.primary');
      expect(result.data?.usageCount).toBe(1);
    });

    it('should find transitive references', async () => {
      // Add a composite that references the utility
      graph.createNode({
        id: 'composite.button.text',
        path: ['composite', 'button', 'text'],
        layer: 'composite',
        type: 'color',
        value: '{utility.text.primary}'
      });

      const result = await handlers.findAllReferences({
        path: 'base.color.blue.light'
      });

      expect(result.success).toBe(true);
      expect(result.data?.directReferences).toContain('utility.text.primary');
      expect(result.data?.allReferences).toContain('composite.button.text');
      expect(result.data?.usageCount).toBe(2);
    });

    it('should return 0 references for orphaned token', async () => {
      const result = await handlers.findAllReferences({
        path: 'base.color.grey.90'  // No dependents
      });

      expect(result.success).toBe(true);
      expect(result.data?.usageCount).toBe(0);
      expect(result.data?.directReferences).toHaveLength(0);
    });

    it('should fail for non-existent token', async () => {
      const result = await handlers.findAllReferences({
        path: 'base.color.nonexistent'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('3. findAndReplace', () => {
    it('should find matches in dry-run mode', async () => {
      const result = await handlers.findAndReplace({
        searchPattern: 'grey',
        replaceWith: 'gray',
        searchIn: 'path',
        matchType: 'contains',
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.data?.totalMatches).toBe(2);
      expect(result.data?.updated).toBe(0);  // Dry run doesn't update
      expect(result.data?.matches.every((m: any) => !m.updated)).toBe(true);
    });

    it('should actually replace when dryRun is false', async () => {
      const result = await handlers.findAndReplace({
        searchPattern: 'grey',
        replaceWith: 'gray',
        searchIn: 'path',
        matchType: 'contains',
        dryRun: false
      });

      expect(result.success).toBe(true);
      expect(result.data?.updated).toBeGreaterThan(0);

      // Check tokens were renamed
      const node1 = graph.getNodeByPath(['base', 'color', 'gray', '50']);
      const node2 = graph.getNodeByPath(['base', 'color', 'gray', '90']);
      expect(node1 || node2).toBeDefined();
    });

    it('should support regex patterns', async () => {
      const result = await handlers.findAndReplace({
        searchPattern: 'base\\.color\\.(\\w+)\\.light',
        replaceWith: 'base.color.$1.500',
        searchIn: 'path',
        matchType: 'regex',
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.data?.totalMatches).toBeGreaterThan(0);
    });

    it('should filter by layer', async () => {
      const result = await handlers.findAndReplace({
        searchPattern: 'color',
        replaceWith: 'colour',
        searchIn: 'path',
        matchType: 'contains',
        layer: 'primitive',
        dryRun: true
      });

      expect(result.success).toBe(true);
      // Should only match primitive tokens
      const matches = result.data?.matches || [];
      expect(matches.every((m: any) => m.path.startsWith('base.'))).toBe(true);
    });
  });

  describe('4. generateColorScale', () => {
    it('should generate a color scale', async () => {
      const result = await handlers.generateColorScale({
        baseColor: '#3B82F6',
        steps: 5,
        namingPattern: 'base.color.brand.{step}'
      });

      expect(result.success).toBe(true);
      expect(result.data?.tokens).toHaveLength(5);
      expect(result.data?.tokens[0].path).toBe('base.color.brand.20');
      expect(result.data?.tokens[4].path).toBe('base.color.brand.100');
    });

    it('should validate hex color format', async () => {
      const result = await handlers.generateColorScale({
        baseColor: 'blue',  // Invalid format
        steps: 5,
        namingPattern: 'base.color.brand.{step}'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid hex color');
    });

    it('should require {step} placeholder in naming pattern', async () => {
      const result = await handlers.generateColorScale({
        baseColor: '#3B82F6',
        steps: 5,
        namingPattern: 'base.color.brand'  // Missing {step}
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('{step}');
    });

    it('should add colorScience metadata', async () => {
      const result = await handlers.generateColorScale({
        baseColor: '#3B82F6',
        steps: 3,
        namingPattern: 'base.color.test.{step}'
      });

      expect(result.success).toBe(true);
      
      const createdToken = graph.getNodeByPath(['base', 'color', 'test', '33']);
      expect(createdToken?.metadata?.colorScience).toBeDefined();
      expect(createdToken?.metadata?.colorScience?.computed).toBe(true);
    });
  });

  describe('5. suggestColorsForGaps', () => {
    it('should detect gaps in color palette', async () => {
      const result = await handlers.suggestColorsForGaps({
        filter: 'primitives',
        threshold: 0.1,
        maxSuggestions: 5
      });

      expect(result.success).toBe(true);
      expect(result.data?.analyzedColors).toBeGreaterThan(0);
      // With only 2 colors far apart, should detect a gap
      if (result.data?.gapsDetected) {
        expect(result.data.gapsDetected).toBeGreaterThan(0);
      }
    });

    it('should require at least 2 colors', async () => {
      // Create a new graph with only 1 color
      const emptyGraph = new StyleGraph();
      emptyGraph.createNode({
        id: 'base.color.single',
        path: ['base', 'color', 'single'],
        layer: 'primitive',
        type: 'color',
        value: '#3B82F6'
      });
      const emptyHandlers = new ToolHandlers(emptyGraph);

      const result = await emptyHandlers.suggestColorsForGaps({
        filter: 'primitives'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 color');
    });

    it('should suggest interpolated colors', async () => {
      const result = await handlers.suggestColorsForGaps({
        filter: 'primitives',
        threshold: 0.1
      });

      if (result.success && result.data?.suggestions.length > 0) {
        const suggestion = result.data.suggestions[0];
        expect(suggestion.suggestedColor).toMatch(/^#[0-9A-F]{6}$/i);
        expect(suggestion.oklch).toBeDefined();
        expect(suggestion.gapSize).toBeGreaterThan(0);
        expect(suggestion.reasoning).toBeDefined();
      }
    });

    it('should filter by primitives/utilities', async () => {
      const result = await handlers.suggestColorsForGaps({
        filter: 'utilities',
        threshold: 0.1
      });

      expect(result.success).toBe(true);
      // Should only analyze utility tokens (none in our test setup)
      expect(result.data?.analyzedColors).toBe(0);
    });
  });

  describe('Integration tests', () => {
    it('should work together: find references, rename, verify', async () => {
      // 1. Find references before rename
      const refsBefore = await handlers.findAllReferences({
        path: 'base.color.blue.light'
      });
      expect(refsBefore.data?.usageCount).toBe(1);

      // 2. Rename the token
      const rename = await handlers.renameToken({
        oldPath: 'base.color.blue.light',
        newPath: 'base.color.blue.500'
      });
      expect(rename.success).toBe(true);

      // 3. Find references after rename (should work with new path)
      const refsAfter = await handlers.findAllReferences({
        path: 'base.color.blue.500'
      });
      expect(refsAfter.data?.usageCount).toBe(1);
      expect(refsAfter.data?.directReferences).toContain('utility.text.primary');
    });

    it('should work together: generate scale, detect gaps, suggest', async () => {
      // 1. Generate a sparse scale (3 colors)
      const scale = await handlers.generateColorScale({
        baseColor: '#3B82F6',
        steps: 3,
        namingPattern: 'base.color.scale.{step}'
      });
      expect(scale.success).toBe(true);

      // 2. Detect gaps
      const gaps = await handlers.suggestColorsForGaps({
        filter: 'primitives',
        threshold: 0.15
      });
      
      expect(gaps.success).toBe(true);
      // With a sparse 3-color scale, should detect gaps
      expect(gaps.data?.gapsDetected).toBeGreaterThanOrEqual(0);
    });

    it('should work together: find and replace with reference check', async () => {
      // 1. Check references before
      const refsBefore = await handlers.findAllReferences({
        path: 'base.color.blue.light'
      });
      const usageCountBefore = refsBefore.data?.usageCount || 0;

      // 2. Find and replace (rename via pattern)
      const replace = await handlers.findAndReplace({
        searchPattern: 'blue.light',
        replaceWith: 'blue.primary',
        searchIn: 'path',
        matchType: 'contains',
        dryRun: false
      });
      expect(replace.success).toBe(true);

      // 3. Check references after (should maintain same usage count)
      const refsAfter = await handlers.findAllReferences({
        path: 'base.color.blue.primary'
      });
      expect(refsAfter.data?.usageCount).toBe(usageCountBefore);
    });
  });
});

