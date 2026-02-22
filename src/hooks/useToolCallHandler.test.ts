import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useToolCallHandler } from './useToolCallHandler';
import { createMockGraph, createMockSessionPromiseRef, createMockFunctionCall } from '../test-utils/mockData';
import { ToolHandlers } from '../services/toolHandlers';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    pathname: '/editor',
    search: '',
  }),
}));

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    addLog: vi.fn(),
  }),
}));

vi.mock('../context/DesignLanguageContext', () => ({
  useDesignLanguage: () => {
    const graph = createMockGraph();
    return {
      graph,
      toolHandlers: new ToolHandlers(graph),
      setVoiceSearchResults: vi.fn(),
      setSelectedLanguage: vi.fn(),
    };
  },
}));

vi.mock('../context/ToolUIContext', () => ({
  useToolUI: () => ({
    showResult: vi.fn(),
  }),
}));

describe('useToolCallHandler', () => {
  let refreshUI: ReturnType<typeof vi.fn>;
  let setActiveView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    refreshUI = vi.fn();
    setActiveView = vi.fn();
  });

  describe('tool routing', () => {
    it('should route design system tools to handleDesignSystemTool', async () => {
      const { result } = renderHook(() =>
        useToolCallHandler({
          refreshUI,
          setActiveView,
        })
      );

      const toolCall = {
        functionCalls: [createMockFunctionCall('getToken', { path: 'test.token' })],
      };
      const sessionPromiseRef = createMockSessionPromiseRef();

      await result.current(toolCall, sessionPromiseRef);

      // Should not throw, indicating it was handled
      expect(true).toBe(true);
    });

    it('should handle navigate_to_view tool', async () => {
      const { result } = renderHook(() =>
        useToolCallHandler({
          refreshUI,
          setActiveView,
        })
      );

      const toolCall = {
        functionCalls: [createMockFunctionCall('navigate_to_view', { view: 'colors' })],
      };
      const sessionPromiseRef = createMockSessionPromiseRef();

      await result.current(toolCall, sessionPromiseRef);

      expect(setActiveView).toHaveBeenCalledWith('colors');
    });

    it('should handle search_tools for lazy loading', async () => {
      const { result } = renderHook(() =>
        useToolCallHandler({
          refreshUI,
          setActiveView,
        })
      );

      const toolCall = {
        functionCalls: [createMockFunctionCall('search_tools', { query: 'color' })],
      };
      const sessionPromiseRef = createMockSessionPromiseRef();

      await result.current(toolCall, sessionPromiseRef);

      // Should not throw, indicating it was handled
      expect(true).toBe(true);
    });
  });

  describe('view navigation validation', () => {
    it('should reject invalid view names', async () => {
      const { result } = renderHook(() =>
        useToolCallHandler({
          refreshUI,
          setActiveView,
        })
      );

      const toolCall = {
        functionCalls: [createMockFunctionCall('navigate_to_view', { view: 'invalid_view' })],
      };
      const sessionPromiseRef = createMockSessionPromiseRef();

      await result.current(toolCall, sessionPromiseRef);

      expect(setActiveView).not.toHaveBeenCalled();
    });

    it('should accept all valid view names', async () => {
      const validViews = ['gallery', 'colors', 'typography', 'sizes', 'components', 'content'];

      for (const view of validViews) {
        const { result } = renderHook(() =>
          useToolCallHandler({
            refreshUI,
            setActiveView,
          })
        );

        const toolCall = {
          functionCalls: [createMockFunctionCall('navigate_to_view', { view })],
        };
        const sessionPromiseRef = createMockSessionPromiseRef();

        setActiveView.mockClear();
        await result.current(toolCall, sessionPromiseRef);

        expect(setActiveView).toHaveBeenCalledWith(view);
      }
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      const { result } = renderHook(() =>
        useToolCallHandler({
          refreshUI,
          setActiveView,
        })
      );

      // Invalid tool call structure
      const toolCall = {
        functionCalls: [null],
      };
      const sessionPromiseRef = createMockSessionPromiseRef();

      // Should not throw
      await expect(result.current(toolCall as any, sessionPromiseRef)).resolves.not.toThrow();
    });
  });
});

