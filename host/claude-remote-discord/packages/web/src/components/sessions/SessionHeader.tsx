"use client";

import { useState, useRef, useEffect } from "react";
import {
  Clock,
  Terminal,
  Circle,
  Square,
  Play,
  Copy,
  Search,
  BarChart3,
  FolderTree,
  MoreHorizontal,
  Download,
  Hash,
  Trash2,
  Check,
} from "lucide-react";
import type { SessionRecord } from "@claudeforge/shared";
import { api } from "@/lib/api";
import { useToastStore } from "@/components/ui/Toast";

const PROVIDER_ICONS: Record<string, { emoji: string; color: string }> = {
  claude: { emoji: "\u{1F916}", color: "text-accent-warm" },
  codex: { emoji: "\u{1F4BB}", color: "text-success" },
};

function SessionActionsMenu({
  session,
  onDelete,
}: {
  session: SessionRecord;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const addToast = useToastStore((s) => s.addToast);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleExport = async () => {
    try {
      const data = await api.exportSession(session.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `session-${session.name}-${session.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("success", "Session exported");
    } catch {
      addToast("error", "Failed to export session");
    }
    setOpen(false);
  };

  const handleCopyTmux = () => {
    navigator.clipboard.writeText(`tmux attach -t ${session.tmuxName}`);
    addToast("success", "tmux command copied");
    setOpen(false);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(session.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await api.deleteSession(session.id);
      addToast("success", "Session deleted");
      onDelete?.();
    } catch {
      addToast("error", "Failed to delete session");
    }
    setOpen(false);
    setConfirmDelete(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => { setOpen(!open); setConfirmDelete(false); }}
        className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-primary/5 rounded transition-colors"
        title="Session actions"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-surface-elevated border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-primary/5 transition-colors"
          >
            <Download size={14} /> Export Session
          </button>
          <button
            onClick={handleCopyTmux}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-primary/5 transition-colors"
          >
            <Terminal size={14} /> View in Terminal
          </button>
          <button
            onClick={handleCopyId}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-primary/5 transition-colors"
          >
            {copiedId ? <Check size={14} className="text-success" /> : <Hash size={14} />}
            {copiedId ? "Copied!" : "Copy Session ID"}
          </button>
          <div className="h-px bg-border my-1" />
          <button
            onClick={handleDelete}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
              confirmDelete
                ? "text-error bg-error/10 hover:bg-error/20"
                : "text-text-secondary hover:text-error hover:bg-error/5"
            }`}
          >
            <Trash2 size={14} />
            {confirmDelete ? "Confirm Delete" : "Delete Session"}
          </button>
        </div>
      )}
    </div>
  );
}

export function SessionHeader({
  session,
  onStop,
  onResume,
  onToggleTerminal,
  onToggleSearch,
  onToggleMetrics,
  onToggleFiles,
  onDeleteSession,
  showTerminal,
  showFiles,
  showMetrics,
}: {
  session: SessionRecord;
  onStop: () => void;
  onResume: () => void;
  onToggleTerminal?: () => void;
  onToggleSearch?: () => void;
  onToggleMetrics?: () => void;
  onToggleFiles?: () => void;
  onDeleteSession?: () => void;
  showTerminal?: boolean;
  showFiles?: boolean;
  showMetrics?: boolean;
}) {
  const uptime = Math.floor((Date.now() - session.createdAt) / 60000);
  const provider = PROVIDER_ICONS[session.provider] ?? PROVIDER_ICONS.claude;

  return (
    <div className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className={provider.color}>{provider.emoji}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">
              {session.name}
            </span>
            <span
              role="status"
              aria-label={`Session status: ${session.status}`}
              className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                session.status === "active"
                  ? "bg-success/20 text-success"
                  : session.status === "idle"
                  ? "bg-info/20 text-info"
                  : session.status === "error"
                  ? "bg-error/20 text-error"
                  : "bg-text-muted/20 text-text-muted"
              }`}
            >
              {session.status === "active" && (
                <Circle size={6} aria-hidden="true" className="fill-success text-success animate-pulse" />
              )}
              {session.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5 flex-wrap">
            <span className="font-mono truncate max-w-[200px] hidden sm:inline" title={session.directory}>
              {session.directory}
            </span>
            <span className="hidden sm:inline">{session.provider} · {session.model ?? "default"}</span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {uptime}m
            </span>
            <span>{session.messageCount} msgs</span>
            <span className="font-mono hidden sm:inline">${session.totalCost.toFixed(4)}</span>
            <span className="font-mono hidden md:inline">{session.totalTokens.toLocaleString()} tok</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Panel toggles */}
        {onToggleFiles && (
          <button
            onClick={onToggleFiles}
            aria-label="Toggle file tree"
            aria-pressed={showFiles}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              showFiles
                ? "text-primary bg-primary/10"
                : "text-text-secondary hover:text-text-primary hover:bg-primary/5"
            }`}
            title="Toggle file tree"
          >
            <FolderTree size={14} />
          </button>
        )}
        {onToggleSearch && (
          <button
            onClick={onToggleSearch}
            aria-label="Search messages"
            className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-primary/5 rounded transition-colors"
            title="Search messages (Ctrl+F)"
          >
            <Search size={14} />
          </button>
        )}
        {onToggleTerminal && (
          <button
            onClick={onToggleTerminal}
            aria-label="Toggle terminal"
            aria-pressed={showTerminal}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              showTerminal
                ? "text-primary bg-primary/10"
                : "text-text-secondary hover:text-text-primary hover:bg-primary/5"
            }`}
            title="Toggle terminal"
          >
            <Terminal size={14} />
          </button>
        )}
        {onToggleMetrics && (
          <button
            onClick={onToggleMetrics}
            aria-label="Toggle metrics"
            aria-pressed={showMetrics}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              showMetrics
                ? "text-primary bg-primary/10"
                : "text-text-secondary hover:text-text-primary hover:bg-primary/5"
            }`}
            title="Toggle metrics"
          >
            <BarChart3 size={14} />
          </button>
        )}

        <div className="w-px h-5 bg-border mx-1" />

        <SessionActionsMenu session={session} onDelete={onDeleteSession} />

        {session.status === "active" ? (
          <button
            onClick={onStop}
            aria-label="Stop session"
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-error/10 text-error hover:bg-error/20 rounded transition-colors"
          >
            <Square size={12} />
            Stop
          </button>
        ) : (session.status === "stopped" || session.status === "idle") ? (
          <button
            onClick={onResume}
            aria-label="Resume session"
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-success/10 text-success hover:bg-success/20 rounded transition-colors"
          >
            <Play size={12} />
            Resume
          </button>
        ) : null}
      </div>
    </div>
  );
}
