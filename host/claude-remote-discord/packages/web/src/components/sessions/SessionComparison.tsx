"use client";

import { useEffect, useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { X, ArrowUpDown, DollarSign, MessageSquare, Cpu } from "lucide-react";
import { api } from "@/lib/api";
import { useSessionStore } from "@/stores/session-store";
import type { SessionRecord } from "@claudeforge/shared";

interface ComparisonData {
  sessions: { a: SessionRecord; b: SessionRecord };
  comparison: { costDiff: string; messageDiff: number; tokenDiff: number };
}

function StatRow({
  label,
  icon: Icon,
  valueA,
  valueB,
  diff,
  format,
}: {
  label: string;
  icon: typeof DollarSign;
  valueA: string | number;
  valueB: string | number;
  diff: string | number;
  format?: "cost";
}) {
  const numDiff = typeof diff === "string" ? parseFloat(diff) : diff;
  const diffColor = numDiff > 0 ? "text-error" : numDiff < 0 ? "text-success" : "text-text-muted";
  const diffPrefix = numDiff > 0 ? "+" : "";
  const displayDiff = format === "cost" ? `${diffPrefix}$${Math.abs(numDiff).toFixed(4)}` : `${diffPrefix}${numDiff}`;

  return (
    <div className="grid grid-cols-[1fr_100px_100px_100px] items-center gap-2 px-4 py-2 border-b border-border/50">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon size={14} strokeWidth={1.5} />
        {label}
      </div>
      <div className="text-sm text-text-primary text-right font-mono">
        {format === "cost" ? `$${Number(valueA).toFixed(4)}` : valueA}
      </div>
      <div className="text-sm text-text-primary text-right font-mono">
        {format === "cost" ? `$${Number(valueB).toFixed(4)}` : valueB}
      </div>
      <div className={`text-sm text-right font-mono ${diffColor}`}>{displayDiff}</div>
    </div>
  );
}

export function SessionComparison({
  sessionA,
  sessionB,
  onClose,
}: {
  sessionA: string;
  sessionB: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trapRef = useFocusTrap(true);
  const sessions = useSessionStore((s) => s.sessions);

  useEffect(() => {
    api
      .compareSessions(sessionA, sessionB)
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to compare"));
  }, [sessionA, sessionB]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (error) {
    return (
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
        <div className="fixed inset-0 bg-black/60" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl p-6 text-center">
          <p className="text-error text-sm">{error}</p>
          <button onClick={onClose} className="mt-4 text-sm text-text-muted hover:text-text-primary">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
        <div className="fixed inset-0 bg-black/60" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl p-6 text-center">
          <p className="text-text-muted text-sm">Loading comparison...</p>
        </div>
      </div>
    );
  }

  const { a, b } = data.sessions;
  const { costDiff, messageDiff, tokenDiff } = data.comparison;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh]" role="dialog" aria-modal="true" aria-label="Session comparison" ref={trapRef}>
      <div className="fixed inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xl mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowUpDown size={18} strokeWidth={1.5} className="text-primary" />
            <span className="text-sm font-medium text-text-primary">Session Comparison</span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_100px_100px_100px] items-center gap-2 px-4 py-2 border-b border-border text-[11px] font-medium tracking-wider text-text-muted uppercase">
          <div>Metric</div>
          <div className="text-right truncate" title={a.name}>{a.name}</div>
          <div className="text-right truncate" title={b.name}>{b.name}</div>
          <div className="text-right">Diff</div>
        </div>

        <StatRow label="Messages" icon={MessageSquare} valueA={a.messageCount} valueB={b.messageCount} diff={messageDiff} />
        <StatRow label="Tokens" icon={Cpu} valueA={a.totalTokens} valueB={b.totalTokens} diff={tokenDiff} />
        <StatRow label="Cost" icon={DollarSign} valueA={a.totalCost} valueB={b.totalCost} diff={costDiff} format="cost" />

        <div className="px-4 py-3 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-xs text-text-muted">
            <div>
              <span className="font-medium text-text-secondary">{a.name}</span>
              <div className="mt-1">{a.projectName} &middot; {a.status} &middot; {a.provider}</div>
            </div>
            <div>
              <span className="font-medium text-text-secondary">{b.name}</span>
              <div className="mt-1">{b.projectName} &middot; {b.status} &middot; {b.provider}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
