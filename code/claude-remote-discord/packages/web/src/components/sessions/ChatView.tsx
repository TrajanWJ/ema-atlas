"use client";

import { useEffect, useRef } from "react";
import { useSessionStore } from "@/stores/session-store";
import { SessionHeader } from "./SessionHeader";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { api } from "@/lib/api";
import { MessageSquare } from "lucide-react";

export function ChatView() {
  const {
    activeSessionId,
    sessions,
    messages,
    streamingText,
    setMessages,
  } = useSessionStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const session = sessions.find((s) => s.id === activeSessionId);
  const sessionMessages = activeSessionId
    ? messages.get(activeSessionId) ?? []
    : [];
  const streaming = activeSessionId
    ? streamingText.get(activeSessionId)
    : undefined;

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId) return;
    if (messages.has(activeSessionId)) return;

    api
      .getMessages(activeSessionId)
      .then((msgs) => setMessages(activeSessionId, msgs))
      .catch(console.error);
  }, [activeSessionId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessionMessages.length, streaming]);

  const handleSend = async (content: string) => {
    if (!activeSessionId) return;
    try {
      await api.sendMessage(activeSessionId, content);
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

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
            <code className="text-text-secondary">/open</code> in Discord
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SessionHeader
        session={session}
        onStop={() => api.stopSession(session.id).catch(console.error)}
        onResume={() => api.resumeSession(session.id).catch(console.error)}
      />

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {sessionMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming text */}
        {streaming && (
          <div className="px-4 py-2 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-warm/20 text-accent-warm flex items-center justify-center shrink-0">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary">
                Claude{" "}
                <span className="text-xs text-text-muted animate-pulse">
                  typing...
                </span>
              </div>
              <div className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap">
                {streaming}
              </div>
            </div>
          </div>
        )}
      </div>

      <InputBar
        onSend={handleSend}
        disabled={session.status === "stopped"}
      />
    </div>
  );
}
