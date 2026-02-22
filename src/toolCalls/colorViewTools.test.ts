import { describe, it, expect } from 'vitest';
import { isColorViewTool, COLOR_VIEW_TOOLS } from './colorViewTools';

describe('ColorViewTools', () => {
  describe('isColorViewTool', () => {
    it('should identify color view tools correctly', () => {
      expect(isColorViewTool('find_similar_colors')).toBe(true);
      expect(isColorViewTool('adjust_colors_lightness')).toBe(true);
      expect(isColorViewTool('generate_color_scale')).toBe(true);
      expect(isColorViewTool('check_lightness_scale')).toBe(true);
      expect(isColorViewTool('check_color_contrast')).toBe(true);
      expect(isColorViewTool('group_colors_by_hue')).toBe(true);
    });

    it('should return false for non-color-view tools', () => {
      expect(isColorViewTool('getToken')).toBe(false);
      expect(isColorViewTool('searchTokens')).toBe(false);
    });
  });

  describe('COLOR_VIEW_TOOLS', () => {
    it('should have 7 color view tools defined', () => {
      // Note: This is the toolCalls version (7 tools), not the definitions version (8 tools)
      expect(COLOR_VIEW_TOOLS).toHaveLength(7);
    });

    it('should have all tools marked for deferred loading', () => {
      expect(COLOR_VIEW_TOOLS.every(tool => tool.defer_loading === true)).toBe(true);
    });

    it('should have all tools with proper category', () => {
      // Categories: analyze, query, navigate (for select_colors)
      const validCategories = ['analyze', 'query', 'navigate'];
      expect(COLOR_VIEW_TOOLS.every(tool => validCategories.includes(tool.category))).toBe(true);
    });

    it('should have all tools with input examples', () => {
      expect(COLOR_VIEW_TOOLS.every(tool => tool.input_examples && tool.input_examples.length > 0)).toBe(true);
    });

    it('should have all tools with parameters defined', () => {
      expect(COLOR_VIEW_TOOLS.every(tool => tool.parameters && Object.keys(tool.parameters).length > 0)).toBe(true);
    });
  });

  describe('Tool definitions', () => {
    it('should have find_similar_colors tool properly defined', () => {
      const tool = COLOR_VIEW_TOOLS.find(t => t.name === 'find_similar_colors');
      expect(tool).toBeDefined();
      expect(tool?.description).toContain('similar');
      expect(tool?.parameters.targetColor).toBeDefined();
      expect(tool?.parameters.threshold).toBeDefined();
    });

    it('should have adjust_colors_lightness tool properly defined', () => {
      const tool = COLOR_VIEW_TOOLS.find(t => t.name === 'adjust_colors_lightness');
      expect(tool).toBeDefined();
      expect(tool?.description).toContain('lightness');
      expect(tool?.parameters.colorPaths).toBeDefined();
      expect(tool?.parameters.direction).toBeDefined();
      expect(tool?.sideEffects).toContain('None');
    });

    it('should have check_color_contrast tool properly defined', () => {
      const tool = COLOR_VIEW_TOOLS.find(t => t.name === 'check_color_contrast');
      expect(tool).toBeDefined();
      expect(tool?.description).toContain('WCAG');
      expect(tool?.parameters.foreground).toBeDefined();
      expect(tool?.parameters.background).toBeDefined();
    });
  });
});

