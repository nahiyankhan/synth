/**
 * useAIChat - Custom hook for AI chat functionality
 * Uses plain React state and fetch to interact with /api/chat
 */

import { useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDesignLanguage } from '@/context/DesignLanguageContext';
import { useToolCall } from '@/context/ToolCallContext';
import { useApp } from '@/context/AppContext';
import { getApiKeyHeaders } from '@/utils/apiKeyStorage';
import type { ImageAttachment } from '@/types/multimodal';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UseAIChatOptions {
  currentView?: string | null;
  onToolCall?: (toolCall: any) => Promise<void>;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const location = useLocation();
  const { currentLanguageMetadata } = useDesignLanguage();
  const { showEvent } = useToolCall();
  const { addLog } = useApp();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Build context for the API
  const getContext = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    return {
      route: location.pathname,
      mode: searchParams.get('mode'),
      currentView: options.currentView,
      languageName: currentLanguageMetadata?.name,
    };
  }, [location.pathname, location.search, options.currentView, currentLanguageMetadata?.name]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(async (
    e: React.FormEvent,
    _images?: ImageAttachment[]
  ) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    addLog(`You: ${userMessage.content}`);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiKeyHeaders(),
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: getContext(),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
      };

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Parse the AI SDK data stream format
        // The format is: "0:"text"\n" for text deltas
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          // Text delta format: 0:"text content"
          if (line.startsWith('0:')) {
            try {
              const textContent = JSON.parse(line.slice(2));
              assistantContent += textContent;

              // Update the assistant message with accumulated content
              setMessages(prev => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: assistantContent,
                  };
                }
                return updated;
              });
            } catch {
              // Ignore parse errors for non-text chunks
            }
          }

          // Tool call format: 9:{"toolCallId":"...", "toolName":"...", "args":{...}}
          if (line.startsWith('9:')) {
            try {
              const toolCall = JSON.parse(line.slice(2));

              // Show tool call in UI
              showEvent({
                id: toolCall.toolCallId,
                type: 'tool_call',
                timestamp: Date.now(),
                data: {
                  toolName: toolCall.toolName,
                  args: toolCall.args,
                },
              });

              // Call the external handler if provided
              if (options.onToolCall) {
                options.onToolCall({
                  functionCalls: [{
                    id: toolCall.toolCallId,
                    name: toolCall.toolName,
                    args: toolCall.args,
                  }],
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      addLog(`Assistant: ${assistantContent}`);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, don't set error
        return;
      }

      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      addLog(`Chat error: ${error.message}`);

      // Remove the pending assistant message on error
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && !updated[updated.length - 1].content) {
          updated.pop();
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, messages, getContext, addLog, showEvent, options]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const append = useCallback((message: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...message, id: generateId() }]);
  }, []);

  const reload = useCallback(async () => {
    // Remove last assistant message and resend
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
        updated.pop();
      }
      return updated;
    });
    // Re-trigger the last user message if available
  }, []);

  return {
    // Chat state
    messages,
    input,
    isLoading,
    error,

    // Input handlers
    handleInputChange,
    handleSubmit,
    setInput,

    // Message management
    setMessages,
    append,
    clearMessages,

    // Actions
    reload,
    stop,
  };
}
