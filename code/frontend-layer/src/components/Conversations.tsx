"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { AGENTS } from "@/lib/types";
import { renderMarkdown } from "@/lib/markdown";

interface ConversationsProps {
  messages: ChatMessage[];
}

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "mock-1",
    sender: "Right Hand",
    senderAgent: "main",
    content: "Morning. Vault sync completed — 47 notes indexed, 3 orphans flagged. Running evolution cycle now.",
    timestamp: Date.now() - 3600000,
  },
  {
    id: "mock-2",
    sender: "Researcher",
    senderAgent: "researcher",
    content: "Finished deep dive on **agent delegation patterns**. Found 3 promising papers from DeepMind. Summary written to `vault/Research/delegation-patterns.md`.",
    timestamp: Date.now() - 3000000,
  },
  {
    id: "mock-3",
    sender: "Coder",
    senderAgent: "coder",
    content: "Frontend layer iteration 4 shipped. Vault browser, search, pulse bar, frontmatter pills — all working. `pnpm build` clean.",
    timestamp: Date.now() - 2400000,
  },
  {
    id: "mock-4",
    sender: "Trajan",
    senderAgent: "user",
    content: "Push the design further. I want command palette, mobile responsive, the works.",
    timestamp: Date.now() - 1800000,
  },
  {
    id: "mock-5",
    sender: "Right Hand",
    senderAgent: "main",
    content: "On it. Spawning Coder for iteration 5 — mobile-first responsive, ⌘K palette, agent theatre, glassmorphism. ETA ~30min.",
    timestamp: Date.now() - 1200000,
  },
  {
    id: "mock-6",
    sender: "Security",
    senderAgent: "security",
    content: "Audit complete. No exposed ports found. SSH config hardened. `fail2ban` active with 3 banned IPs in the last 24h.",
    timestamp: Date.now() - 600000,
  },
];

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export default function Conversations({ messages }: ConversationsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [inputValue, setInputValue] = useState("");

  const displayMessages = messages.length > 0 ? messages : MOCK_MESSAGES;
  const isMock = messages.length === 0;

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayMessages, autoScroll]);

  function handleScroll() {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(atBottom);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 tab-content">
      {/* Mock data banner */}
      {isMock && (
        <div
          className="px-3 py-1.5 text-[10px] text-center"
          style={{ background: "rgba(232, 168, 56, 0.1)", color: "var(--color-accent)" }}
        >
          📡 Not connected to live messages yet — showing example conversation
        </div>
      )}

      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
          }}
          className="mx-auto my-1 px-3 py-1 rounded-full text-xs cursor-pointer transition-colors"
          style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
        >
          ↓ Jump to latest
        </button>
      )}

      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-2 md:px-4 py-2 space-y-1.5">
        {displayMessages.map((msg) => {
          const agent = AGENTS[msg.senderAgent || ""] || AGENTS.main;
          return (
            <div
              key={msg.id}
              className="animate-fade-in flex gap-2 md:gap-3 py-2 px-2 md:px-3 rounded-lg glass-card"
              style={{ borderLeft: `3px solid ${agent.color}` }}
            >
              <div className="shrink-0 w-12 md:w-16">
                <div className="flex items-center gap-1">
                  <span className="text-sm">{agent.emoji}</span>
                  <span className="text-[10px] md:text-xs font-medium truncate" style={{ color: agent.color }}>
                    {agent.name}
                  </span>
                </div>
                <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
              <div
                className="flex-1 min-w-0 text-xs md:text-sm markdown-content"
                style={{ color: "var(--color-text-primary)" }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
            </div>
          );
        })}
      </div>

      {/* Message input */}
      <div className="p-2 md:p-3 border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message (not connected)..."
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{
              background: "var(--color-surface-elevated)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
            disabled={isMock}
          />
          <button
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              background: isMock ? "var(--color-surface-elevated)" : "var(--color-accent)",
              color: isMock ? "var(--color-text-secondary)" : "var(--color-bg)",
              opacity: isMock ? 0.5 : 1,
            }}
            disabled={isMock}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
