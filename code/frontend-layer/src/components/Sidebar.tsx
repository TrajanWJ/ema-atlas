"use client";

import { useState, useEffect, useCallback } from "react";
import type { ChatMessage, AgentEvent, VaultFile } from "@/lib/types";
import { AGENTS } from "@/lib/types";

interface SidebarProps {
  messages: ChatMessage[];
  agentEvents: AgentEvent[];
  selectedVaultFile?: string;
  fileContent?: string;
  vaultTree?: VaultFile[];
  onOpenFile?: (path: string) => void;
}

interface RelatedNote {
  path: string;
  name: string;
  matchType: "tag" | "link";
}

export default function Sidebar({ messages, agentEvents, selectedVaultFile, fileContent, vaultTree, onOpenFile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [relatedNotes, setRelatedNotes] = useState<RelatedNote[]>([]);

  // Auto-expand on wide viewports
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    setCollapsed(!mq.matches);
    const handler = (e: MediaQueryListEvent) => setCollapsed(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Knowledge Gravity: parse tags and wikilinks from current file
  const findRelatedNotes = useCallback(() => {
    if (!fileContent || !vaultTree) {
      setRelatedNotes([]);
      return;
    }

    const tags: string[] = [];
    const links: string[] = [];

    // Parse frontmatter tags
    const fmMatch = fileContent.match(/^---\s*\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const tagLine = fmMatch[1].match(/tags:\s*\[([^\]]*)\]/);
      if (tagLine) {
        tags.push(...tagLine[1].split(",").map(t => t.trim().replace(/^["']|["']$/g, "")).filter(Boolean));
      }
      // Also handle tags: [tag1, tag2] or tags:\n - tag1
      const tagLines = fmMatch[1].match(/^\s*-\s+(\S+)/gm);
      if (tagLines) {
        tags.push(...tagLines.map(l => l.replace(/^\s*-\s+/, "").trim()));
      }
    }

    // Parse wikilinks
    const wikiMatches = fileContent.matchAll(/\[\[([^\]]+)\]\]/g);
    for (const m of wikiMatches) {
      links.push(m[1].split("|")[0].trim()); // Handle [[link|alias]]
    }

    // Find matching files in tree
    const results: RelatedNote[] = [];
    const currentPath = selectedVaultFile || "";

    function searchTree(nodes: VaultFile[]) {
      for (const node of nodes) {
        if (node.type === "file" && node.path !== currentPath) {
          const baseName = node.name.replace(/\.md$/, "").toLowerCase();
          // Match by wikilink
          if (links.some(l => l.toLowerCase() === baseName)) {
            results.push({ path: node.path, name: node.name, matchType: "link" });
          }
        }
        if (node.children) searchTree(node.children);
      }
    }

    searchTree(vaultTree);

    // Dedupe
    const seen = new Set<string>();
    setRelatedNotes(results.filter(r => {
      if (seen.has(r.path)) return false;
      seen.add(r.path);
      return true;
    }).slice(0, 10));
  }, [fileContent, vaultTree, selectedVaultFile]);

  useEffect(() => {
    findRelatedNotes();
  }, [findRelatedNotes]);

  // Hidden on mobile entirely
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="hidden md:flex w-10 flex-col items-center pt-3 gap-3 border-l cursor-pointer transition-colors hover:bg-[var(--color-surface-elevated)]"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>◀</span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-secondary)", writingMode: "vertical-rl" }}>Context</span>
      </button>
    );
  }

  const activeAgents = new Set(agentEvents.filter((e) => e.status === "running").map((e) => e.agentId));
  const recentMessages = messages.slice(-20);
  const agentMsgCounts: Record<string, number> = {};
  for (const msg of messages) {
    const key = msg.senderAgent || "unknown";
    agentMsgCounts[key] = (agentMsgCounts[key] || 0) + 1;
  }

  return (
    <div className="hidden md:flex w-64 shrink-0 flex-col border-l overflow-y-auto" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--color-border)" }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
          Context
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-xs cursor-pointer transition-colors hover:text-[var(--color-text-primary)]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          ▶
        </button>
      </div>

      {/* Knowledge Gravity Panel */}
      <div className="px-3 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        {selectedVaultFile && relatedNotes.length > 0 ? (
          <>
            <h4 className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--color-text-secondary)" }}>
              🔗 Related ({relatedNotes.length})
            </h4>
            <div className="space-y-1">
              {relatedNotes.map((note) => (
                <button
                  key={note.path}
                  onClick={() => onOpenFile?.(note.path)}
                  className="w-full text-left text-xs py-1 px-1.5 rounded transition-all duration-200 cursor-pointer truncate hover:bg-[var(--color-surface-elevated)]"
                  style={{ color: "var(--color-text-secondary)" }}
                  title={note.path}
                >
                  <span className="text-[10px] mr-1">{note.matchType === "link" ? "🔗" : "🏷️"}</span>
                  {note.name.replace(/\.md$/, "")}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h4 className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--color-text-secondary)" }}>
              {selectedVaultFile ? "🔗 Related Notes" : "📂 Quick Access"}
            </h4>
            <p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
              {selectedVaultFile ? "No related notes found" : "Open a vault file to see related notes"}
            </p>
          </>
        )}
      </div>

      {/* Agent presence */}
      <div className="px-3 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <h4 className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--color-text-secondary)" }}>Agent Roster</h4>
        <div className="space-y-1">
          {Object.values(AGENTS).filter(a => a.id !== "user").map((agent) => {
            const isActive = activeAgents.has(agent.id);
            const count = agentMsgCounts[agent.id] || 0;
            return (
              <div key={agent.id} className="flex items-center gap-2 text-xs transition-all duration-200">
                <span>{agent.emoji}</span>
                <span className="flex-1 truncate" style={{ color: isActive ? agent.color : "var(--color-text-secondary)", opacity: isActive ? 1 : 0.5 }}>
                  {agent.name}
                </span>
                {isActive && (
                  <div className="animate-pulse-dot" style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#22C55E" }} />
                )}
                {count > 0 && (
                  <span className="text-[10px] font-mono" style={{ color: "var(--color-text-secondary)" }}>{count}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent activity digest */}
      <div className="px-3 py-3 flex-1">
        <h4 className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--color-text-secondary)" }}>Recent Messages</h4>
        {recentMessages.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>No messages yet</p>
        ) : (
          <div className="space-y-1.5">
            {recentMessages.slice(-8).map((msg) => {
              const agent = AGENTS[msg.senderAgent || ""] || AGENTS.main;
              return (
                <div key={msg.id} className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                  <span style={{ color: agent.color }}>{agent.emoji}</span>{" "}
                  {msg.content.slice(0, 60)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session stats */}
      <div className="px-3 py-3 border-t" style={{ borderColor: "var(--color-border)" }}>
        <h4 className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--color-text-secondary)" }}>Session</h4>
        <div className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>
          <div>{messages.length} messages</div>
          <div>{agentEvents.length} events</div>
        </div>
      </div>
    </div>
  );
}
