"use client";

import {
  Bot,
  Clock,
  Terminal,
  Circle,
  Square,
  Play,
  Copy,
} from "lucide-react";
import type { SessionRecord } from "@claudeforge/shared";

const PROVIDER_ICONS: Record<string, { emoji: string; color: string }> = {
  claude: { emoji: "🤖", color: "text-accent-warm" },
  codex: { emoji: "💻", color: "text-success" },
};

export function SessionHeader({
  session,
  onStop,
  onResume,
}: {
  session: SessionRecord;
  onStop: () => void;
  onResume: () => void;
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
              className={`text-xs px-2 py-0.5 rounded-full ${
                session.status === "active"
                  ? "bg-success/20 text-success"
                  : session.status === "idle"
                  ? "bg-info/20 text-info"
                  : session.status === "error"
                  ? "bg-error/20 text-error"
                  : "bg-text-muted/20 text-text-muted"
              }`}
            >
              {session.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
            <span>{session.provider} · {session.model ?? "default"}</span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {uptime}m
            </span>
            <span>{session.messageCount} msgs</span>
            {session.totalCost > 0 && (
              <span>${session.totalCost.toFixed(4)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `tmux attach -t ${session.tmuxName}`
            );
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-primary/5 rounded transition-colors"
          title="Copy tmux attach command"
        >
          <Terminal size={12} />
          <Copy size={10} />
        </button>

        {session.status === "active" ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-error/10 text-error hover:bg-error/20 rounded transition-colors"
          >
            <Square size={12} />
            Stop
          </button>
        ) : session.status !== "stopped" ? null : (
          <button
            onClick={onResume}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-success/10 text-success hover:bg-success/20 rounded transition-colors"
          >
            <Play size={12} />
            Resume
          </button>
        )}
      </div>
    </div>
  );
}
