'use client';

import { useEffect, useRef, useState, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { useEditorStore } from '@/store/editor-store';
import { api } from '@/lib/api';

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}

function SparkleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-accent"
    >
      <path
        d="M8 1L9.5 5.5L14 7L9.5 8.5L8 13L6.5 8.5L2 7L6.5 5.5L8 1Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M12.5 2L13.25 3.75L15 4.5L13.25 5.25L12.5 7L11.75 5.25L10 4.5L11.75 3.75L12.5 2Z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 12V2M7 2L3 6M7 2L11 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-text-muted"
    >
      <rect
        x="4"
        y="8"
        width="32"
        height="24"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <path
        d="M12 18H22M12 23H18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M28 4L29.5 7.5L33 9L29.5 10.5L28 14L26.5 10.5L23 9L26.5 7.5L28 4Z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-start justify-start">
      <div className="bg-bg-tertiary rounded-xl px-4 py-3 max-w-[85%] animate-slide-up">
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}

const SUGGESTION_CHIPS = [
  'Explain this code',
  'Find bugs',
  'Optimize performance',
];

export default function AiPanel() {
  const {
    chatMessages,
    isChatLoading,
    clearChat,
    selectedCode,
    activeFilePath,
    aiPanelOpen,
    toggleAiPanel,
    sendQuery,
    addChatMessage,
    setChatLoading,
  } = useEditorStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const lineHeight = 20;
    const maxHeight = lineHeight * 5 + 24; // 5 rows + padding
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isChatLoading) return;

      setInputValue('');
      sendQuery(trimmed);
    },
    [isChatLoading, sendQuery]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleActionClick = (action: string) => {
    if (!selectedCode || !activeFilePath) return;
    sendMessage(action);
  };

  const handleApplyChanges = async () => {
    if (!selectedCode || !activeFilePath) return;

    const lastAssistantMsg = chatMessages
      .filter(m => m.role === 'assistant')
      .pop();
    if (!lastAssistantMsg) return;

    try {
      setChatLoading(true);
      addChatMessage({ role: 'assistant', content: 'Applying changes...' });

      const result = await api<{ success: boolean; error?: string }>('/apply-changes', {
        method: 'POST',
        body: {
          instruction: lastAssistantMsg.content,
          files: [activeFilePath],
        },
      });

      addChatMessage({
        role: 'assistant',
        content: result.success
          ? 'Changes applied successfully.'
          : `Failed to apply changes: ${result.error || 'Unknown error'}`,
      });
    } catch (err) {
      addChatMessage({
        role: 'assistant',
        content: `Error applying changes: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setChatLoading(false);
    }
  };

  if (!aiPanelOpen) return null;

  const hasSelectedCode = Boolean(selectedCode && activeFilePath);
  const fileName = activeFilePath?.split('/').pop() ?? '';

  return (
    <div className="h-full flex flex-col bg-secondary border-l border-bg-border">
      {/* Header */}
      <div className="h-[44px] min-h-[44px] flex items-center justify-between px-4 border-b border-bg-border">
        <div className="flex items-center gap-2">
          <SparkleIcon />
          <span className="font-medium text-sm text-text-primary">
            AI Assistant
          </span>
        </div>
        <button
          onClick={toggleAiPanel}
          className="flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          aria-label="Close AI panel"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin"
      >
        {chatMessages.length === 0 && !isChatLoading ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center gap-4 animate-fade-in">
            <EmptyStateIcon />
            <p className="text-sm text-text-secondary">
              Ask me anything about your code
            </p>
            <div className="flex flex-col gap-2 w-full max-w-[240px]">
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSuggestionClick(chip)}
                  className="bg-bg-hover border border-bg-border rounded-lg px-3 py-2 text-sm text-text-secondary hover:border-accent-border hover:text-text-primary transition-all cursor-pointer text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex animate-slide-up ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-accent-muted'
                      : 'bg-bg-tertiary'
                  } rounded-xl px-4 py-3`}
                >
                  {/* Code Context Badge */}
                  {msg.codeContext && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="inline-flex items-center gap-1 font-mono text-2xs bg-bg-hover rounded-md px-2 py-1 text-text-secondary">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          className="text-text-muted"
                        >
                          <path
                            d="M3 3L1 5L3 7M7 3L9 5L7 7"
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {msg.codeContext.filePath.split('/').pop()}
                        <span className="text-text-muted mx-0.5">&middot;</span>
                        <span className="text-text-muted">Selected code</span>
                      </span>
                    </div>
                  )}
                  {/* Message Content */}
                  <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                  {/* Timestamp */}
                  <p
                    className={`text-2xs text-text-muted mt-1.5 ${
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isChatLoading && <LoadingDots />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Buttons */}
      {hasSelectedCode && (
        <div className="border-t border-bg-border py-2 px-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={handleApplyChanges}
              className="flex-none rounded-lg text-xs px-3 py-1.5 bg-accent text-white hover:bg-accent-hover transition-colors font-medium"
            >
              Apply Changes
            </button>
            <button
              onClick={() => handleActionClick('Explain this code')}
              className="flex-none rounded-lg text-xs px-3 py-1.5 border border-bg-border text-text-secondary hover:border-accent-border hover:text-text-primary transition-colors"
            >
              Explain
            </button>
            <button
              onClick={() => handleActionClick('Refactor this code')}
              className="flex-none rounded-lg text-xs px-3 py-1.5 border border-bg-border text-text-secondary hover:border-accent-border hover:text-text-primary transition-colors"
            >
              Refactor
            </button>
            <button
              onClick={() => handleActionClick('Add tests for this code')}
              className="flex-none rounded-lg text-xs px-3 py-1.5 border border-bg-border text-text-secondary hover:border-accent-border hover:text-text-primary transition-colors"
            >
              Add Tests
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-bg-border p-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code..."
            rows={1}
            className="w-full bg-bg-tertiary border border-bg-border rounded-xl px-4 py-3 pr-12 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-muted transition-colors leading-5"
            style={{ minHeight: '44px' }}
          />
          {inputValue.trim().length > 0 && (
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={isChatLoading}
              className="absolute bottom-2.5 right-2.5 w-7 h-7 flex items-center justify-center bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
