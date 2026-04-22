"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import dynamic from "next/dynamic";
import { useSessionStore } from "@/stores/session-store";
import { SessionHeader } from "./SessionHeader";
import { MessageBubble, MessageGroup } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { MessageSearch } from "./MessageSearch";
import { SessionMetrics } from "./SessionMetrics";
import { FileTree } from "./FileTree";
import { ChatSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { MessageSquare, Send } from "lucide-react";
import { useToastStore } from "@/components/ui/Toast";
import type { ChatMessage, MessageAnnotation } from "@claudeforge/shared";

const Terminal = dynamic(() => import("./Terminal").then((m) => ({ default: m.Terminal })), {
  ssr: false,
});

function VirtualMessageList({
  groups,
  scrollRef,
  highlightedMessageId,
  streaming,
  annotations,
  onAnnotate,
  onDeleteAnnotation,
  autoScroll,
}: {
  groups: Array<{ role: string; messages: ChatMessage[]; id: string }>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  highlightedMessageId: string | null;
  streaming?: string;
  annotations?: MessageAnnotation[];
  onAnnotate?: (messageId: string, type: "bookmark" | "note", content?: string) => void;
  onDeleteAnnotation?: (id: string) => void;
  autoScroll?: boolean;
}) {
  const virtualizer = useVirtualizer({
    count: groups.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 120,
    overscan: 8,
  });

  // Scroll to bottom when new groups arrive and auto-scroll is on
  useEffect(() => {
    if (autoScroll && groups.length > 0) {
      virtualizer.scrollToIndex(groups.length - 1, { align: "end" });
    }
  }, [groups.length, streaming, autoScroll, virtualizer]);

  return (
    <div
      style={{ height: virtualizer.getTotalSize(), position: "relative" }}
      role="log"
      aria-label="Chat messages"
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const group = groups[virtualRow.index];

        // Streaming indicator
        if (group.role === "__streaming__") {
          return (
            <div
              key="__streaming__"
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="px-4 py-2 flex gap-3" aria-live="polite" aria-atomic="false">
                <div className="w-7 h-7 rounded-full bg-accent-warm/20 text-accent-warm flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-text-primary flex items-center gap-2 mb-0.5">
                    Claude
                    <span className="dot-bounce flex items-center gap-0.5" aria-label="typing">
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>
                  <div className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap">
                    {streaming}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Grouped messages
        return (
          <div
            key={group.id}
            ref={virtualizer.measureElement}
            data-index={virtualRow.index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {group.messages.length === 1 ? (
              <div
                id={`msg-${group.messages[0].id}`}
                className={
                  highlightedMessageId === group.messages[0].id
                    ? "bg-primary/5 transition-colors"
                    : "transition-colors"
                }
              >
                <MessageBubble
                  message={group.messages[0]}
                  annotations={(annotations ?? []).filter((a) => a.messageId === group.messages[0].id)}
                  onAnnotate={onAnnotate}
                  onDeleteAnnotation={onDeleteAnnotation}
                />
              </div>
            ) : (
              <MessageGroup
                messages={group.messages}
                highlightedMessageId={highlightedMessageId}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ChatView() {
  const {
    activeSessionId,
    sessions,
    messages,
    streamingText,
    setMessages,
    sendOptimisticMessage,
  } = useSessionStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<MessageAnnotation[]>([]);
  const addToast = useToastStore((s) => s.addToast);

  const session = sessions.find((s) => s.id === activeSessionId);
  const sessionMessages = activeSessionId
    ? messages.get(activeSessionId) ?? []
    : [];
  const streaming = activeSessionId
    ? streamingText.get(activeSessionId)
    : undefined;

  // Group consecutive messages by role for visual grouping
  const messageGroups = useMemo(() => {
    const groups: Array<{ role: string; messages: ChatMessage[]; id: string }> = [];
    for (const msg of sessionMessages) {
      const last = groups[groups.length - 1];
      // Group consecutive messages from same role (but not tool calls — those stay individual)
      if (last && last.role === msg.role && !msg.toolCall && !last.messages.some(m => m.toolCall)) {
        last.messages.push(msg);
      } else {
        groups.push({ role: msg.role, messages: [msg], id: msg.id });
      }
    }
    // Add streaming indicator as a virtual group
    if (streaming) {
      groups.push({ role: "__streaming__", messages: [], id: "__streaming__" });
    }
    return groups;
  }, [sessionMessages, streaming]);

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId) return;
    if (messages.has(activeSessionId)) return;

    setLoading(true);
    api
      .getMessages(activeSessionId)
      .then((msgs) => setMessages(activeSessionId, msgs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSessionId]);

  // Load annotations when session changes
  useEffect(() => {
    if (!activeSessionId) return;
    api.getAnnotations(activeSessionId).then(setAnnotations).catch(console.error);
  }, [activeSessionId]);

  const handleAnnotate = useCallback(
    async (messageId: string, type: "bookmark" | "note", content?: string) => {
      if (!activeSessionId) return;
      try {
        const annotation = await api.createAnnotation(activeSessionId, messageId, type, content);
        setAnnotations((prev) => [...prev, annotation]);
      } catch {
        addToast("error", "Failed to create annotation");
      }
    },
    [activeSessionId, addToast],
  );

  const handleDeleteAnnotation = useCallback(
    async (id: string) => {
      try {
        await api.deleteAnnotation(id);
        setAnnotations((prev) => prev.filter((a) => a.id !== id));
      } catch {
        addToast("error", "Failed to delete annotation");
      }
    },
    [addToast],
  );

  // Detect manual scroll to pause auto-scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
  }, []);

  // Ctrl+F keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f" && session) {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session]);

  // Scroll to highlighted message
  useEffect(() => {
    if (!highlightedMessageId) return;
    const el = document.getElementById(`msg-${highlightedMessageId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedMessageId]);

  const handleSend = async (content: string) => {
    if (!activeSessionId) return;
    sendOptimisticMessage(activeSessionId, content);
    try {
      await api.sendMessage(activeSessionId, content);
    } catch {
      addToast("error", "Failed to send message");
    }
  };

  const handleSearchHighlight = useCallback(
    (messageId: string | null) => {
      setHighlightedMessageId(messageId);
    },
    [],
  );

  // No session selected
  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        <div className="text-center">
          <MessageSquare
            size={48}
            strokeWidth={1}
            className="mx-auto mb-4 opacity-30"
          />
          <p className="text-lg font-medium">No session selected</p>
          <p className="text-sm mt-1">
            Select a session from the sidebar or use{" "}
            <code className="text-text-secondary bg-surface-elevated px-1.5 py-0.5 rounded text-xs">
              /open
            </code>{" "}
            in Discord
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* File tree panel */}
      {showFiles && (
        <div className="w-64 border-r border-border shrink-0 overflow-hidden">
          <FileTree sessionId={session.id} />
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        <SessionHeader
          session={session}
          onStop={() => api.stopSession(session.id).catch(console.error)}
          onResume={() => api.resumeSession(session.id).catch(console.error)}
          onToggleTerminal={() => setShowTerminal((p) => !p)}
          onToggleSearch={() => setShowSearch((p) => !p)}
          onToggleMetrics={() => setShowMetrics((p) => !p)}
          onToggleFiles={() => setShowFiles((p) => !p)}
          showTerminal={showTerminal}
          showFiles={showFiles}
          showMetrics={showMetrics}
        />

        {/* Message search */}
        {showSearch && (
          <MessageSearch
            messages={sessionMessages}
            onClose={() => {
              setShowSearch(false);
              setHighlightedMessageId(null);
            }}
            onHighlight={handleSearchHighlight}
          />
        )}

        {/* Messages area — virtualized */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto" role="region" aria-label="Session messages">
          {loading ? (
            <ChatSkeleton />
          ) : sessionMessages.length === 0 && !streaming ? (
            <div className="flex-1 flex items-center justify-center h-full text-text-muted">
              <div className="text-center">
                <Send
                  size={32}
                  strokeWidth={1}
                  className="mx-auto mb-3 opacity-30"
                />
                <p className="text-sm">Send a message to start...</p>
              </div>
            </div>
          ) : (
            <VirtualMessageList
              groups={messageGroups}
              scrollRef={scrollRef}
              highlightedMessageId={highlightedMessageId}
              streaming={streaming}
              annotations={annotations}
              onAnnotate={handleAnnotate}
              onDeleteAnnotation={handleDeleteAnnotation}
              autoScroll={autoScroll}
            />
          )}
        </div>

        {/* Terminal panel (lazy loaded) */}
        {showTerminal && <Terminal sessionId={session.id} />}

        <InputBar
          onSend={handleSend}
          disabled={session.status === "stopped"}
        />
      </div>

      {/* Metrics panel */}
      {showMetrics && (
        <SessionMetrics
          session={session}
          messages={sessionMessages}
          onClose={() => setShowMetrics(false)}
        />
      )}
    </div>
  );
}
