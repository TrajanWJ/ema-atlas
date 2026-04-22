"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { VaultFile } from "@/lib/types";
import { AGENTS } from "@/lib/types";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onAction: (action: CommandAction) => void;
  vaultTree: VaultFile[];
}

export type CommandAction =
  | { type: "search-vault"; query: string }
  | { type: "open-file"; path: string }
  | { type: "system-status" }
  | { type: "agent-info"; agentId: string };

function flattenTree(nodes: VaultFile[]): VaultFile[] {
  const result: VaultFile[] = [];
  for (const n of nodes) {
    if (n.type === "file") result.push(n);
    if (n.children) result.push(...flattenTree(n.children));
  }
  return result;
}

function FileIcon({ name }: { name: string }) {
  if (name.endsWith(".md")) return <span className="text-xs">📝</span>;
  if (name.endsWith(".json") || name.endsWith(".yaml") || name.endsWith(".yml")) return <span className="text-xs">🔧</span>;
  if (name.endsWith(".sh")) return <span className="text-xs">⚙️</span>;
  return <span className="text-xs">📄</span>;
}

interface ResultItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  detail?: string;
  action: CommandAction;
}

export default function CommandPalette({ open, onClose, onAction, vaultTree }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const allFiles = useCallback(() => flattenTree(vaultTree), [vaultTree]);

  // Build results based on query
  const results: ResultItem[] = [];
  const q = query.toLowerCase().trim();

  if (q === "") {
    // Show quick actions when empty
    results.push({
      id: "status",
      icon: <span className="text-xs">📊</span>,
      label: "System Status",
      detail: "View system health",
      action: { type: "system-status" },
    });
    // Show agents
    Object.values(AGENTS)
      .filter((a) => a.id !== "user")
      .slice(0, 5)
      .forEach((a) => {
        results.push({
          id: `agent-${a.id}`,
          icon: <span className="text-xs">{a.emoji}</span>,
          label: a.name,
          detail: "Agent info",
          action: { type: "agent-info", agentId: a.id },
        });
      });
  } else if (q.startsWith("search vault:") || q.startsWith("search:") || q.startsWith("s:")) {
    const searchQ = q.replace(/^(search vault:|search:|s:)\s*/, "");
    if (searchQ) {
      results.push({
        id: "search",
        icon: <span className="text-xs">🔍</span>,
        label: `Search vault: "${searchQ}"`,
        action: { type: "search-vault", query: searchQ },
      });
    }
  } else if (q.startsWith("agent:") || q.startsWith("a:")) {
    const agentQ = q.replace(/^(agent:|a:)\s*/, "").toLowerCase();
    Object.values(AGENTS)
      .filter((a) => a.id !== "user" && (a.name.toLowerCase().includes(agentQ) || a.id.includes(agentQ)))
      .forEach((a) => {
        results.push({
          id: `agent-${a.id}`,
          icon: <span className="text-xs">{a.emoji}</span>,
          label: a.name,
          detail: `Agent • ${a.id}`,
          action: { type: "agent-info", agentId: a.id },
        });
      });
  } else {
    // Fuzzy match files
    const files = allFiles();
    const matched = files
      .filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
      .slice(0, 10);
    matched.forEach((f) => {
      results.push({
        id: `file-${f.path}`,
        icon: <FileIcon name={f.name} />,
        label: f.name,
        detail: f.path,
        action: { type: "open-file", path: f.path },
      });
    });

    // Also offer vault search
    results.push({
      id: "search-fallback",
      icon: <span className="text-xs">🔍</span>,
      label: `Search vault for "${q}"`,
      action: { type: "search-vault", query: q },
    });

    // Match agents
    Object.values(AGENTS)
      .filter((a) => a.id !== "user" && (a.name.toLowerCase().includes(q) || a.id.includes(q)))
      .forEach((a) => {
        results.push({
          id: `agent-${a.id}`,
          icon: <span className="text-xs">{a.emoji}</span>,
          label: a.name,
          detail: "Agent",
          action: { type: "agent-info", agentId: a.id },
        });
      });

    // System status if matches
    if ("system status".includes(q) || "health".includes(q)) {
      results.push({
        id: "status",
        icon: <span className="text-xs">📊</span>,
        label: "System Status",
        action: { type: "system-status" },
      });
    }
  }

  const clampedIndex = Math.min(selectedIndex, results.length - 1);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[clampedIndex]) {
      e.preventDefault();
      onAction(results[clampedIndex].action);
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--color-text-primary)" }}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
              No results found
            </div>
          ) : (
            results.map((item, i) => (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors cursor-pointer"
                style={{
                  background: i === clampedIndex ? "var(--color-surface-elevated)" : "transparent",
                  color: "var(--color-text-primary)",
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => { onAction(item.action); onClose(); }}
              >
                <span className="w-6 text-center shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{item.label}</div>
                  {item.detail && (
                    <div className="text-[10px] truncate" style={{ color: "var(--color-text-secondary)" }}>
                      {item.detail}
                    </div>
                  )}
                </div>
                {i === clampedIndex && (
                  <span className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>↵</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t text-[10px]" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span className="ml-auto">s: search • a: agent</span>
        </div>
      </div>
    </div>
  );
}
