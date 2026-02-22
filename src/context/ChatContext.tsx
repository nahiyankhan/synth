/**
 * ChatContext - Global chat state using Vercel AI SDK v6's useChat hook
 * Provides persistent chat across page navigation with auto-injected page context
 */

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useDesignLanguage } from './DesignLanguageContext';
import { useToolCall } from './ToolCallContext';
import { useApp } from './AppContext';

/**
 * Page context that gets auto-injected into chat requests
 */
export interface PageContext {
  route: string;
  view: string | null;
  mode: string | null;
  languageId: string | null;
  languageName: string | null;
}

interface ChatContextType {
  // Chat state
  messages: UIMessage[];
  input: string;
  isLoading: boolean;
  error: Error | undefined;
  status: 'ready' | 'submitted' | 'streaming' | 'error';

  // Input handlers
  handleInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e?: FormEvent<HTMLFormElement>) => void;
  setInput: (input: string) => void;

  // Message management
  setMessages: (messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])) => void;
  reload: () => void;
  stop: () => void;

  // UI state
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;

  // Page context
  pageContext: PageContext;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedLanguage, currentLanguageMetadata } = useDesignLanguage();
  const { showEvent } = useToolCall();
  const { addLog } = useApp();

  // UI state for chat panel visibility
  const [isOpen, setIsOpen] = useState(false);

  // Managed input state (AI SDK v6 doesn't provide this for useChat)
  const [input, setInput] = useState('');

  // Derive page context from current route
  const pageContext = useMemo<PageContext>(() => {
    const searchParams = new URLSearchParams(location.search);
    const pathParts = location.pathname.split('/');

    // Extract view from pathname: /editor/colors -> colors, /editor -> gallery
    let view: string | null = null;
    if (pathParts[1] === 'editor') {
      view = pathParts[2] || 'gallery';
    }

    return {
      route: location.pathname,
      view,
      mode: searchParams.get('mode'),
      languageId: selectedLanguage,
      languageName: currentLanguageMetadata?.name || null,
    };
  }, [location.pathname, location.search, selectedLanguage, currentLanguageMetadata?.name]);

  // Handle navigation tool calls
  const handleNavigationToolCall = useCallback(
    (toolName: string, args: Record<string, unknown>) => {
      switch (toolName) {
        case 'navigate_to_view': {
          const view = args.view as string;
          if (view === 'gallery') {
            navigate('/editor');
          } else {
            navigate(`/editor/${view}`);
          }
          return { success: true, message: `Navigated to ${view}` };
        }
        case 'show_split_view': {
          const left = args.left as string;
          const right = args.right as string;
          navigate(`/editor/split?left=${left}&right=${right}`);
          return { success: true, message: `Split view: ${left} | ${right}` };
        }
        case 'load_design_system': {
          const id = args.id as string;
          navigate('/editor');
          return { success: true, message: `Loading ${id}` };
        }
        case 'create_new_design_system': {
          navigate('/editor/create');
          return { success: true, message: 'Opening creation page' };
        }
        default:
          return null;
      }
    },
    [navigate]
  );

  // Use Vercel AI SDK v6's useChat hook
  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    stop,
    status,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        context: pageContext,
      },
    }),
    onToolCall: ({ toolCall }) => {
      // Show tool call in UI
      showEvent({
        id: toolCall.toolCallId,
        type: 'tool_call',
        timestamp: Date.now(),
        data: {
          toolName: toolCall.toolName,
          args: toolCall.input as Record<string, unknown>,
        },
      });

      // Handle navigation tools - execute immediately
      handleNavigationToolCall(
        toolCall.toolName,
        toolCall.input as Record<string, unknown>
      );
    },
    onFinish: ({ message }) => {
      // Get text content from message parts
      const textContent = message.parts
        ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map(part => part.text)
        .join('') || '';
      addLog(`Assistant: ${textContent.slice(0, 100)}${textContent.length > 100 ? '...' : ''}`);
    },
    onError: (error) => {
      addLog(`Chat error: ${error.message}`);
    },
  });

  // Input change handler
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  // Submit handler - uses sendMessage from AI SDK v6
  const handleSubmit = useCallback(
    (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      if (input.trim()) {
        addLog(`You: ${input}`);
        sendMessage({ text: input });
        setInput('');
      }
    },
    [sendMessage, input, addLog]
  );

  // Map status to isLoading for backwards compatibility
  const isLoading = status === 'submitted' || status === 'streaming';

  const value = useMemo<ChatContextType>(
    () => ({
      messages,
      input,
      isLoading,
      error,
      status,
      handleInputChange,
      handleSubmit,
      setInput,
      setMessages,
      reload: regenerate,
      stop,
      isOpen,
      setIsOpen,
      pageContext,
    }),
    [
      messages,
      input,
      isLoading,
      error,
      status,
      handleInputChange,
      handleSubmit,
      setMessages,
      regenerate,
      stop,
      isOpen,
      pageContext,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useGlobalChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useGlobalChat must be used within ChatProvider');
  }
  return context;
};
