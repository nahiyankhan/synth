/**
 * UI Generation Hook
 *
 * Handles SSE streaming for UI component tree generation.
 * Uses json-render's flat UITree format: { root: string, elements: Record<string, UIElement> }
 *
 * Supports design language integration:
 * - Accept StyleGraph to generate token context for AI
 * - Generated UIs can use { token: "name" } references for styling
 */

import { useState, useCallback } from 'react';
import type { UITree } from '@json-render/core';
import type { StyleGraph } from '@/core/StyleGraph';
import { generateTokenPromptSection } from '@/toolCalls/lib/token-prompt-generator';
import { getApiKeyHeaders } from '@/utils/apiKeyStorage';

// =============================================================================
// Types
// =============================================================================

interface UIGenerationState {
  /** Current generation status */
  status: 'idle' | 'generating' | 'complete' | 'error';
  /** Status message for user feedback */
  message: string;
  /** Generated UI tree in flat format (null until complete) */
  tree: UITree | null;
  /** Partial JSON during streaming (for live preview) */
  streamContent: string;
  /** Component count in generated tree */
  componentCount: number;
}

interface GenerateOptions {
  /** Natural language prompt describing the UI */
  prompt: string;
  /** Optional StyleGraph for design language token context */
  graph?: StyleGraph | null;
}

interface UseUIGenerationReturn extends UIGenerationState {
  /** Generate UI from a prompt (with optional design language context) */
  generate: (options: GenerateOptions | string) => Promise<void>;
  /** Reset to idle state */
  reset: () => void;
  /** Whether generation is in progress */
  isGenerating: boolean;
}

// =============================================================================
// Hook
// =============================================================================

export function useUIGeneration(): UseUIGenerationReturn {
  const [state, setState] = useState<UIGenerationState>({
    status: 'idle',
    message: '',
    tree: null,
    streamContent: '',
    componentCount: 0,
  });

  const generate = useCallback(async (options: GenerateOptions | string) => {
    // Support both string and options object for backward compatibility
    const { prompt, graph } = typeof options === 'string'
      ? { prompt: options, graph: undefined }
      : options;

    // Generate token context from design language if available
    const tokenContext = graph ? generateTokenPromptSection(graph) : undefined;

    // Reset state and start generating
    setState({
      status: 'generating',
      message: 'Connecting...',
      tree: null,
      streamContent: '',
      componentCount: 0,
    });

    try {
      const response = await fetch('/api/generate/ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiKeyHeaders(),
        },
        body: JSON.stringify({ prompt, tokenContext }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              handleSSEEvent(data, setState);
            } catch (e) {
              // Ignore parse errors for keepalive comments
              if (!line.includes('keepalive')) {
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('UI generation error:', error);
      setState((s) => ({
        ...s,
        status: 'error',
        message: error instanceof Error ? error.message : 'Generation failed',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      message: '',
      tree: null,
      streamContent: '',
      componentCount: 0,
    });
  }, []);

  return {
    ...state,
    generate,
    reset,
    isGenerating: state.status === 'generating',
  };
}

// =============================================================================
// Event Handler
// =============================================================================

type SSEEvent =
  | { type: 'connected'; message: string }
  | { type: 'status'; message: string }
  | { type: 'stream'; content: string }
  | { type: 'complete'; result: UITree; metadata: { componentCount: number } }
  | { type: 'error'; message: string; details?: string };

function handleSSEEvent(
  event: SSEEvent,
  setState: React.Dispatch<React.SetStateAction<UIGenerationState>>
) {
  switch (event.type) {
    case 'connected':
      setState((s) => ({
        ...s,
        message: 'Connected to server',
      }));
      break;

    case 'status':
      setState((s) => ({
        ...s,
        message: event.message,
      }));
      break;

    case 'stream':
      setState((s) => ({
        ...s,
        streamContent: event.content,
      }));
      break;

    case 'complete':
      setState({
        status: 'complete',
        message: `Generated ${event.metadata.componentCount} components`,
        tree: event.result,
        streamContent: '',
        componentCount: event.metadata.componentCount,
      });
      break;

    case 'error':
      setState((s) => ({
        ...s,
        status: 'error',
        message: event.message,
      }));
      break;
  }
}
