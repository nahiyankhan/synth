import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleNavigationTool, isNavigationTool } from './navigationTools';
import { createMockSessionPromiseRef, createMockFunctionCall } from '../test-utils/mockData';

describe('NavigationTools', () => {
  let addLog: ReturnType<typeof vi.fn>;
  let showResult: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.fn>;
  let setSelectedLanguage: ReturnType<typeof vi.fn>;
  let sessionPromiseRef: ReturnType<typeof createMockSessionPromiseRef>;

  beforeEach(() => {
    addLog = vi.fn();
    showResult = vi.fn();
    navigate = vi.fn();
    setSelectedLanguage = vi.fn();
    sessionPromiseRef = createMockSessionPromiseRef();
  });

  describe('isNavigationTool', () => {
    it('should identify navigation tools correctly', () => {
      // Note: This is the toolCalls version which only has landing page navigation tools
      // The full navigation tool definitions (including navigate_to_view, show_split_view)
      // are in src/tools/definitions/navigation.tools.ts
      expect(isNavigationTool('load_design_system')).toBe(true);
      expect(isNavigationTool('create_new_design_system')).toBe(true);
      expect(isNavigationTool('delete_design_system')).toBe(true);
    });

    it('should return false for non-navigation tools', () => {
      expect(isNavigationTool('getToken')).toBe(false);
      expect(isNavigationTool('searchTokens')).toBe(false);
      // These are in definitions but not in toolCalls NAVIGATION_TOOLS
      expect(isNavigationTool('navigate_to_view')).toBe(false);
      expect(isNavigationTool('show_split_view')).toBe(false);
      // Removed tools
      expect(isNavigationTool('list_design_systems')).toBe(false);
      expect(isNavigationTool('get_design_system_preview')).toBe(false);
    });
  });

  describe('handleNavigationTool', () => {
    describe('create_new_design_system', () => {
      it('should navigate to generation mode', async () => {
        const functionCall = createMockFunctionCall('create_new_design_system');

        await handleNavigationTool({
          functionCall,
          addLog,
          showResult,
          navigate,
          setSelectedLanguage,
          sessionPromiseRef,
        });

        expect(navigate).toHaveBeenCalledWith('/editor/create');
        expect(addLog).toHaveBeenCalledWith(expect.stringContaining('creation'));
      });
    });

    describe('unknown operation', () => {
      it('should handle unknown operations gracefully', async () => {
        const functionCall = createMockFunctionCall('unknown_operation');

        await handleNavigationTool({
          functionCall,
          addLog,
          showResult,
          navigate,
          setSelectedLanguage,
          sessionPromiseRef,
        });

        expect(addLog).toHaveBeenCalledWith(expect.stringContaining('❌'));
      });
    });

    describe('error handling', () => {
      it('should catch and report errors', async () => {
        const functionCall = createMockFunctionCall('load_design_system');

        // Mock navigation to throw error
        vi.spyOn(console, 'error').mockImplementation(() => {});

        // Force an error by providing invalid function call structure
        const badFunctionCall = { ...functionCall, name: null };

        await handleNavigationTool({
          functionCall: badFunctionCall as any,
          addLog,
          showResult,
          navigate,
          setSelectedLanguage,
          sessionPromiseRef,
        });

        expect(addLog).toHaveBeenCalledWith(expect.stringContaining('❌'));
      });
    });
  });
});

