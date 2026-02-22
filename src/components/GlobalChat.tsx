/**
 * GlobalChat - Persistent chat panel using AI Elements
 * Renders as a floating panel that persists across page navigation
 */

import React from 'react';
import { useGlobalChat } from '@/context/ChatContext';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from './ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from './ai-elements/message';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from './ai-elements/prompt-input';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from './ai-elements/tool';
import { XIcon, MessageSquareIcon } from 'lucide-react';
import { Button } from './ui/button';
import { TooltipProvider } from './ui/tooltip';
import { AISignal, type AISignalState } from './AISignal';
import type { UIMessage } from 'ai';

/**
 * Map chat status to AISignal state
 */
const getAISignalState = (status: 'ready' | 'submitted' | 'streaming' | 'error'): AISignalState => {
  switch (status) {
    case 'submitted': return 'thinking';
    case 'streaming': return 'streaming';
    case 'error': return 'error';
    default: return 'idle';
  }
};

/**
 * Helper to extract text content from UIMessage parts
 */
const getMessageText = (message: UIMessage): string => {
  if (!message.parts) return '';
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map(part => part.text)
    .join('');
};

/**
 * Tool part type for display purposes
 */
interface ToolPartForDisplay {
  type: string;
  toolCallId: string;
  toolName: string;
  input: unknown;
  state: string;
  output?: unknown;
}

/**
 * Helper to extract tool invocations from UIMessage parts
 * Tool parts have type 'dynamic-tool' or 'tool-{name}'
 */
const getToolInvocations = (message: UIMessage): ToolPartForDisplay[] => {
  if (!message.parts) return [];
  return message.parts
    .filter((part) => part.type === 'dynamic-tool' || (part.type as string).startsWith('tool-'))
    .map((part) => part as unknown as ToolPartForDisplay);
};

/**
 * Floating toggle button for opening/closing the chat
 */
export const ChatToggle = () => {
  const { isOpen, setIsOpen, messages } = useGlobalChat();

  return (
    <Button
      onClick={() => setIsOpen(!isOpen)}
      variant="outline"
      size="icon"
      className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-dark-900 border-dark-700 hover:bg-dark-800 text-white shadow-lg"
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <XIcon className="h-5 w-5" />
      ) : (
        <div className="relative">
          <MessageSquareIcon className="h-5 w-5" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />
          )}
        </div>
      )}
    </Button>
  );
};

/**
 * Tool invocation display component
 */
const ToolInvocationDisplay: React.FC<{ toolPart: ToolPartForDisplay }> = ({ toolPart }) => {
  // Map AI SDK v6 states to AI Elements states
  const elementState = toolPart.state === 'output-available' ? 'output-available' :
                       toolPart.state === 'input-available' ? 'input-available' :
                       'input-streaming';

  return (
    <Tool defaultOpen={false}>
      <ToolHeader
        title={toolPart.toolName}
        type="dynamic-tool"
        state={elementState}
        toolName={toolPart.toolName}
      />
      <ToolContent>
        <ToolInput input={toolPart.input} />
        {toolPart.state === 'output-available' && (
          <ToolOutput
            output={toolPart.output}
            errorText={undefined}
          />
        )}
      </ToolContent>
    </Tool>
  );
};

/**
 * Main chat panel component
 */
export const GlobalChat = () => {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    isOpen,
    setIsOpen,
    pageContext,
    status,
  } = useGlobalChat();

  if (!isOpen) {
    return <ChatToggle />;
  }

  return (
    <TooltipProvider>
      {/* Toggle button */}
      <ChatToggle />

      {/* Chat panel */}
      <div className="fixed bottom-20 right-4 z-50 w-[420px] h-[600px] flex flex-col bg-dark-900 rounded-2xl shadow-2xl border border-dark-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <AISignal state={getAISignalState(status)} size={32} className="text-white" />
            <div className="flex flex-col">
              <h3 className="text-sm font-medium text-white">Chat</h3>
              {pageContext.view && (
                <span className="text-xs text-dark-400">
                  Context: {pageContext.languageName || 'Design System'} / {pageContext.view}
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-dark-400 hover:text-white hover:bg-dark-800"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Conversation area */}
        <Conversation className="flex-1 bg-dark-900">
          <ConversationContent className="p-4 gap-4">
            {messages.length === 0 ? (
              <ConversationEmptyState
                title="Start a conversation"
                description={
                  pageContext.view
                    ? `Ask about your ${pageContext.view} or request navigation to another view.`
                    : 'Ask about your design system or request navigation.'
                }
                className="text-dark-400"
              />
            ) : (
              messages.map((message) => {
                const textContent = getMessageText(message);
                const toolInvocations = getToolInvocations(message);

                return (
                  <Message
                    key={message.id}
                    from={message.role}
                    className="text-white"
                  >
                    <MessageContent className="group-[.is-user]:bg-dark-700 group-[.is-assistant]:text-dark-100">
                      {message.role === 'user' ? (
                        <span>{textContent}</span>
                      ) : (
                        <>
                          {textContent && (
                            <MessageResponse className="prose prose-invert prose-sm max-w-none">
                              {textContent}
                            </MessageResponse>
                          )}
                          {/* Render tool invocations */}
                          {toolInvocations.map((part) => (
                            <ToolInvocationDisplay
                              key={part.toolCallId}
                              toolPart={part}
                            />
                          ))}
                        </>
                      )}
                    </MessageContent>
                  </Message>
                );
              })
            )}
          </ConversationContent>
          <ConversationScrollButton className="bg-dark-800 hover:bg-dark-700 border-dark-600 text-white" />
        </Conversation>

        {/* Input area */}
        <div className="border-t border-dark-700 bg-dark-800 p-3">
          <PromptInput
            onSubmit={({ text }, e) => {
              // The PromptInput handles its own form submission
              // We just need to trigger our handleSubmit
              handleSubmit(e);
            }}
            className="bg-dark-900 rounded-xl border border-dark-600 focus-within:border-dark-500"
          >
            <PromptInputTextarea
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="bg-transparent text-white placeholder:text-dark-500 border-none focus:ring-0 min-h-[44px] resize-none"
            />
            <PromptInputFooter className="px-2 pb-2">
              <div /> {/* Spacer */}
              <PromptInputSubmit
                status={status}
                onStop={stop}
                className="bg-white text-dark-900 hover:bg-dark-100 disabled:bg-dark-700 disabled:text-dark-500"
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </TooltipProvider>
  );
};
