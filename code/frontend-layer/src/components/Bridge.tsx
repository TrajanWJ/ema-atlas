// ─── cc-switch Integration ──────────────────────────────────────────────────
// cc-switch runs a local proxy at localhost:PORT that handles OpenRouter
// account switching transparently.
//
// Integration pattern:
//   When sending messages to OpenClaw agents, optionally route via the
//   OPENROUTER_BASE_URL or CC_SWITCH_URL environment variable. If set,
//   outbound agent requests go through cc-switch's local proxy, which
//   handles API key rotation and account switching without app changes.
//
//   Example: CC_SWITCH_URL=http://localhost:4181
//
//   The WebSocket connection (ws://localhost:18789) is NOT affected —
//   cc-switch only proxies HTTP/REST calls to LLM providers.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChatMessage } from "@/lib/types";
import { AGENTS } from "@/lib/types";
import { renderMarkdown } from "@/lib/markdown";
import { useWSStore } from "@/lib/stores/wsStore";
import { useUIStore, type RouteTarget } from "@/lib/stores/uiStore";

// ─── Route targets for the quick-route bar ───────────────────────────────────

const ROUTE_TARGETS: { id: RouteTarget; emoji: string; label: string; color: string }[] = [
  { id: "researcher", emoji: "🔬", label: "Researcher", color: "#2BA89E" },
  { id: "coder", emoji: "💻", label: "Coder", color: "#57A773" },
  { id: "vault-keeper", emoji: "💾", label: "Vault-Keeper", color: "#9B59B6" },
  { id: "concierge", emoji: "📋", label: "Concierge", color: "#1ABC9C" },
  { id: "devils-advocate", emoji: "😈", label: "Devil's Advocate", color: "#E91E63" },
];

// ─── Mock messages shown when not connected ───────────────────────────────────

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
    content: "Bridge view shipped. Zustand stores active, streaming output, expandable cards — all working. `pnpm build` clean.",
    timestamp: Date.now() - 2400000,
  },
  {
    id: "mock-4",
    sender: "Trajan",
    senderAgent: "user",
    content: "Route me to the Devil's Advocate. Push the design further.",
    timestamp: Date.now() - 1800000,
  },
  {
    id: "mock-5",
    sender: "Devil's Advocate",
    senderAgent: "devils-advocate",
    content: "**Counter-argument:** The current architecture over-engineers state management for a single-user local tool. Zustand adds indirection. Justify the complexity or simplify.",
    timestamp: Date.now() - 1200000,
  },
  {
    id: "mock-6",
    sender: "Vault-Keeper",
    senderAgent: "vault-keeper",
    content: "Daily digest written → `vault/Logs/2026-03-20.md`. 6 notes modified, 2 orphans resolved, 14 links updated.",
    timestamp: Date.now() - 600000,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// ─── Expandable message card ──────────────────────────────────────────────────

interface MessageCardProps {
  msg: ChatMessage;
}

function MessageCard({ msg }: MessageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const agent = AGENTS[msg.senderAgent || ""] || AGENTS.main;

  // One-liner summary: first sentence or first 120 chars
  const full = msg.content;
  const summary = (() => {
    const firstSentence = full.split(/(?<=[.!?])\s/)[0];
    return firstSentence.length > 120 ? firstSentence.slice(0, 117) + "…" : firstSentence;
  })();
  const hasMore = full.length > summary.length;

  return (
    <div
      className="animate-fade-in rounded-lg overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: `3px solid ${agent.color}`,
        transition: "all 0.2s ease",
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-base leading-none">{agent.emoji}</span>
        <span className="text-xs font-semibold" style={{ color: agent.color }}>
          {agent.name}
        </span>
        <span className="text-[10px] font-mono ml-auto shrink-0" style={{ color: "var(--color-text-secondary)" }}>
          {formatTime(msg.timestamp)}
        </span>
        {hasMore && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="ml-2 text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            style={{
              background: expanded ? `${agent.color}22` : "rgba(255,255,255,0.06)",
              color: expanded ? agent.color : "var(--color-text-secondary)",
              border: `1px solid ${expanded ? agent.color + "44" : "transparent"}`,
            }}
          >
            {expanded ? "▲ collapse" : "▼ expand"}
          </button>
        )}
      </div>

      {/* Summary line (always visible) */}
      {!expanded && (
        <div
          className="px-3 pb-2 text-xs markdown-content"
          style={{ color: "var(--color-text-primary)" }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
        />
      )}

      {/* Full content (expanded) */}
      {expanded && (
        <div
          className="px-3 pb-3 text-xs md:text-sm markdown-content border-t"
          style={{
            color: "var(--color-text-primary)",
            borderColor: `${agent.color}22`,
            animation: "fade-in 0.2s ease-out",
          }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(full) }}
        />
      )}
    </div>
  );
}

// ─── Main Bridge component ────────────────────────────────────────────────────

export default function Bridge() {
  const { status, messages, sendMessage } = useWSStore();
  const { routeTarget, setRouteTarget } = useUIStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [inputValue, setInputValue] = useState("");

  const isConnected = status === "connected";
  const displayMessages = messages.length > 0 ? messages : MOCK_MESSAGES;
  const isMock = messages.length === 0;

  const currentRoute = ROUTE_TARGETS.find((r) => r.id === routeTarget) ?? ROUTE_TARGETS[3];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayMessages, autoScroll]);

  function handleScroll() {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 40);
  }

  function jumpToBottom() {
    setAutoScroll(true);
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  }

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || !isConnected) return;

    sendMessage({
      type: "agent.command",
      payload: {
        agent_id: routeTarget,
        message: text,
        route: routeTarget,
      },
    });

    setInputValue("");
  }, [inputValue, isConnected, routeTarget, sendMessage]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 tab-content">
      {/* Mock data banner */}
      {isMock && (
        <div
          className="px-3 py-1.5 text-[10px] text-center shrink-0"
          style={{ background: "rgba(232, 168, 56, 0.08)", color: "var(--color-accent)" }}
        >
          📡 Not connected — showing example conversation
        </div>
      )}

      {/* Jump to bottom button */}
      {!autoScroll && (
        <button
          onClick={jumpToBottom}
          className="mx-auto my-1 px-3 py-1 rounded-full text-xs cursor-pointer transition-colors shrink-0 z-10"
          style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
        >
          ↓ Jump to latest
        </button>
      )}

      {/* Message feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 md:px-4 py-2 space-y-2"
      >
        {displayMessages.map((msg) => (
          <MessageCard key={msg.id} msg={msg} />
        ))}
      </div>

      {/* ── Persistent input dock ──────────────────────────────────────── */}
      <div
        className="shrink-0 border-t"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        {/* Quick-Route Bar */}
        <div
          className="flex items-center gap-1 px-3 pt-2"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <span className="text-[10px] mr-1" style={{ color: "var(--color-text-secondary)" }}>
            Route:
          </span>
          {ROUTE_TARGETS.map((rt) => (
            <button
              key={rt.id}
              onClick={() => setRouteTarget(rt.id)}
              title={rt.label}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] cursor-pointer transition-all"
              style={{
                background: routeTarget === rt.id ? `${rt.color}22` : "transparent",
                color: routeTarget === rt.id ? rt.color : "var(--color-text-secondary)",
                border: routeTarget === rt.id ? `1px solid ${rt.color}55` : "1px solid transparent",
                boxShadow: routeTarget === rt.id ? `0 0 8px ${rt.color}33` : "none",
              }}
            >
              <span>{rt.emoji}</span>
              <span className="hidden md:inline">{rt.label}</span>
            </button>
          ))}
        </div>

        {/* Route indicator + input */}
        <div className="px-3 py-2">
          {/* Route indicator label */}
          <div
            className="text-[10px] mb-1.5 font-mono"
            style={{ color: currentRoute.color }}
          >
            → {currentRoute.label}
          </div>

          {/* Input row */}
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={
                isConnected
                  ? `Message ${currentRoute.label}… (shift+enter for newline)`
                  : "Not connected…"
              }
              rows={1}
              disabled={!isConnected}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none transition-colors"
              style={{
                background: "var(--color-surface-elevated)",
                color: "var(--color-text-primary)",
                border: isConnected
                  ? `1px solid ${currentRoute.color}44`
                  : "1px solid var(--color-border)",
                minHeight: "36px",
                maxHeight: "120px",
                lineHeight: "1.5",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!isConnected || !inputValue.trim()}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer shrink-0"
              style={{
                background:
                  isConnected && inputValue.trim()
                    ? currentRoute.color
                    : "var(--color-surface-elevated)",
                color:
                  isConnected && inputValue.trim()
                    ? "#0A0A0A"
                    : "var(--color-text-secondary)",
                opacity: isConnected && inputValue.trim() ? 1 : 0.5,
                boxShadow:
                  isConnected && inputValue.trim()
                    ? `0 0 12px ${currentRoute.color}44`
                    : "none",
              }}
            >
              Send ↵
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
