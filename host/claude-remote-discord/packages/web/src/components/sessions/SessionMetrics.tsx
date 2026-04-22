"use client";

import { useMemo } from "react";
import {
  MessageSquare,
  DollarSign,
  Zap,
  Clock,
  FileCode,
  Terminal,
  Pencil,
  Search,
  Eye,
  ChevronLeft,
} from "lucide-react";
import type { SessionRecord, ChatMessage } from "@claudeforge/shared";

interface SessionMetricsProps {
  session: SessionRecord;
  messages: ChatMessage[];
  onClose: () => void;
}

export function SessionMetrics({
  session,
  messages,
  onClose,
}: SessionMetricsProps) {
  const stats = useMemo(() => {
    const toolCalls = messages.filter((m) => m.toolCall);
    const breakdown: Record<string, number> = {};
    const filesTouched = new Set<string>();

    for (const msg of toolCalls) {
      const kind = msg.toolCall?.kind ?? "generic";
      breakdown[kind] = (breakdown[kind] ?? 0) + 1;
      if (msg.toolCall?.filePath) {
        filesTouched.add(msg.toolCall.filePath);
      }
    }

    const durationMs = Date.now() - session.createdAt;
    const durationMin = Math.floor(durationMs / 60000);
    const durationHours = Math.floor(durationMin / 60);
    const duration =
      durationHours > 0
        ? `${durationHours}h ${durationMin % 60}m`
        : `${durationMin}m`;

    return { breakdown, filesTouched: Array.from(filesTouched), duration };
  }, [messages, session.createdAt]);

  const TOOL_ICONS: Record<string, typeof Eye> = {
    read: Eye,
    edit: Pencil,
    write: FileCode,
    bash: Terminal,
    search: Search,
  };

  return (
    <div className="w-64 bg-surface border-l border-border flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
          Metrics
        </span>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors"
          title="Close metrics"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Summary */}
        <div className="space-y-2">
          <MetricRow
            icon={<MessageSquare size={14} />}
            label="Messages"
            value={String(session.messageCount)}
          />
          <MetricRow
            icon={<DollarSign size={14} />}
            label="Cost"
            value={`$${session.totalCost.toFixed(4)}`}
          />
          <MetricRow
            icon={<Zap size={14} />}
            label="Tokens"
            value={session.totalTokens.toLocaleString()}
          />
          <MetricRow
            icon={<Clock size={14} />}
            label="Duration"
            value={stats.duration}
          />
        </div>

        {/* Tool call breakdown */}
        {Object.keys(stats.breakdown).length > 0 && (
          <div>
            <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
              Tool Calls
            </div>
            <div className="space-y-1.5">
              {Object.entries(stats.breakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([kind, count]) => {
                  const Icon = TOOL_ICONS[kind] ?? Zap;
                  return (
                    <MetricRow
                      key={kind}
                      icon={<Icon size={12} />}
                      label={kind}
                      value={String(count)}
                    />
                  );
                })}
            </div>
          </div>
        )}

        {/* Files touched */}
        {stats.filesTouched.length > 0 && (
          <div>
            <div className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
              Files Touched ({stats.filesTouched.length})
            </div>
            <div className="space-y-0.5">
              {stats.filesTouched.slice(0, 20).map((fp) => (
                <div
                  key={fp}
                  className="flex items-center gap-1.5 text-xs text-text-secondary truncate"
                  title={fp}
                >
                  <FileCode size={10} className="shrink-0 text-info" />
                  <span className="truncate">
                    {fp.split("/").pop()}
                  </span>
                </div>
              ))}
              {stats.filesTouched.length > 20 && (
                <div className="text-[11px] text-text-muted">
                  +{stats.filesTouched.length - 20} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-text-secondary">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-mono text-text-primary">{value}</span>
    </div>
  );
}
