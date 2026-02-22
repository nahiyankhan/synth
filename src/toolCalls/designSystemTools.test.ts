import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleDesignSystemTool } from './designSystemTools';
import { ToolHandlers } from '../services/toolHandlers';
import { createMockGraph, createMockSessionPromiseRef, createMockFunctionCall } from '../test-utils/mockData';

describe('DesignSystemTools', () => {
  let toolHandlers: ToolHandlers;
  let addLog: ReturnType<typeof vi.fn>;
  let refreshUI: ReturnType<typeof vi.fn>;
  let setVoiceSearchResults: ReturnType<typeof vi.fn>;
  let showResult: ReturnType<typeof vi.fn>;
  let sessionPromiseRef: ReturnType<typeof createMockSessionPromiseRef>;
  let graph: ReturnType<typeof createMockGraph>;

  beforeEach(() => {
    graph = createMockGraph();
    toolHandlers = new ToolHandlers(graph);
    addLog = vi.fn();
    refreshUI = vi.fn();
    setVoiceSearchResults = vi.fn();
    showResult = vi.fn();
    sessionPromiseRef = createMockSessionPromiseRef();
  });

  describe('handleDesignSystemTool', () => {
    it('should handle getToken call', async () => {
      const functionCall = createMockFunctionCall('getToken', {
        path: 'base.color.blue.500',
      });

      await handleDesignSystemTool({
        functionCall,
        toolHandlers,
        sessionPromiseRef,
        addLog,
        graph,
        refreshUI,
        setVoiceSearchResults,
        showResult,
      });

      expect(addLog).toHaveBeenCalledWith(expect.stringContaining('✓'));
    });

    it('should handle searchTokens call', async () => {
      const functionCall = createMockFunctionCall('searchTokens', {
        type: 'color',
      });

      await handleDesignSystemTool({
        functionCall,
        toolHandlers,
        sessionPromiseRef,
        addLog,
        graph,
        refreshUI,
        setVoiceSearchResults,
        showResult,
      });

      expect(addLog).toHaveBeenCalledWith(expect.stringContaining('✓'));
      expect(setVoiceSearchResults).toHaveBeenCalled();
    });

    it('should refresh UI for modifying operations', async () => {
      const functionCall = createMockFunctionCall('updateToken', {
        path: 'base.color.blue.500',
        value: '#0000FF',
      });

      await handleDesignSystemTool({
        functionCall,
        toolHandlers,
        sessionPromiseRef,
        addLog,
        graph,
        refreshUI,
        setVoiceSearchResults,
        showResult,
      });

      expect(refreshUI).toHaveBeenCalled();
    });

    it('should show result for getSystemStats', async () => {
      const functionCall = createMockFunctionCall('getSystemStats', {});

      await handleDesignSystemTool({
        functionCall,
        toolHandlers,
        sessionPromiseRef,
        addLog,
        graph,
        refreshUI,
        setVoiceSearchResults,
        showResult,
      });

      expect(showResult).toHaveBeenCalled();
    });

    it('should show result for analyzeDesignSystem', async () => {
      const functionCall = createMockFunctionCall('analyzeDesignSystem', {
        category: 'all',
      });

      await handleDesignSystemTool({
        functionCall,
        toolHandlers,
        sessionPromiseRef,
        addLog,
        graph,
        refreshUI,
        setVoiceSearchResults,
        showResult,
      });

      expect(showResult).toHaveBeenCalled();
    });

    it('should log error for failed tool execution', async () => {
      const functionCall = createMockFunctionCall('getToken', {
        path: 'nonexistent.token',
      });

      await handleDesignSystemTool({
        functionCall,
        toolHandlers,
        sessionPromiseRef,
        addLog,
        graph,
        refreshUI,
        setVoiceSearchResults,
        showResult,
      });

      expect(addLog).toHaveBeenCalledWith(expect.stringContaining('❌'));
    });

    it('should send tool response to AI session', async () => {
      const functionCall = createMockFunctionCall('getToken', {
        path: 'base.color.blue.500',
      });

      const mockSession = await sessionPromiseRef.current;

      await handleDesignSystemTool({
        functionCall,
        toolHandlers,
        sessionPromiseRef,
        addLog,
        graph,
        refreshUI,
        setVoiceSearchResults,
        showResult,
      });

      expect(mockSession.sendToolResponse).toHaveBeenCalled();
    });
  });
});

