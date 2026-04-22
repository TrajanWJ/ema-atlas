"use client";

import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { api } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Clock,
  Activity,
  AlertTriangle,
  RefreshCw,
  Download,
  Server,
} from "lucide-react";

interface SessionRecord {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  provider: string;
  status: string;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
}

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

interface ProviderStats {
  name: string;
  sessions: number;
  messages: number;
  cost: number;
  tokens: number;
  active: number;
  health: { healthy: boolean; available: boolean; error?: string | null } | null;
}

interface TimelineSession {
  id: string;
  name: string;
  provider: string;
  projectName: string;
  status: string;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  totalCost: number;
  durationMs: number;
}

interface CostPeriod {
  period: string;
  cost: number;
  tokens: number;
  sessions: number;
  messages: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-text-muted mb-2">
        <Icon size={16} strokeWidth={1.5} />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {sub ? <p className="text-xs text-text-muted mt-1">{sub}</p> : null}
    </div>
  );
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ActivityHeatmap({ data }: { data: HeatmapCell[] }) {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxCount = 1;
  for (const cell of data) {
    if (cell.day >= 0 && cell.day < 7 && cell.hour >= 0 && cell.hour < 24) {
      grid[cell.day][cell.hour] = cell.count;
      if (cell.count > maxCount) maxCount = cell.count;
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="flex gap-px mb-1 ml-10">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 text-center text-[9px] text-text-muted">
              {h % 3 === 0 ? `${h}` : ""}
            </div>
          ))}
        </div>
        {DAY_NAMES.map((day, di) => (
          <div key={day} className="flex items-center gap-px mb-px">
            <span className="w-9 text-[10px] text-text-muted text-right pr-1">{day}</span>
            {Array.from({ length: 24 }, (_, h) => {
              const count = grid[di][h];
              const intensity = count / maxCount;
              return (
                <div
                  key={h}
                  className="flex-1 aspect-square rounded-sm transition-colors"
                  style={{
                    backgroundColor: count === 0
                      ? "rgba(46, 46, 74, 0.3)"
                      : `rgba(123, 97, 255, ${0.15 + intensity * 0.85})`,
                  }}
                  title={`${day} ${h}:00 — ${count} messages`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function CostChart({ data }: { data: CostPeriod[] }) {
  if (data.length === 0) {
    return <p className="text-text-muted text-sm">No cost data available.</p>;
  }

  const maxCost = Math.max(...data.map((d) => d.cost), 0.01);

  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((period) => (
        <div key={period.period} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="w-full flex items-end justify-center h-32">
            <div
              className="w-full max-w-[24px] bg-primary/60 hover:bg-primary/80 rounded-t transition-all duration-300 cursor-default"
              style={{
                height: period.cost > 0 ? `${Math.max((period.cost / maxCost) * 100, 3)}%` : "2px",
              }}
              title={`${period.period}: $${period.cost.toFixed(4)} (${period.sessions} sessions, ${period.messages} msgs)`}
            />
          </div>
          <span className="text-[9px] text-text-muted truncate w-full text-center">
            {period.period.replace(/^\d{4}-/, "")}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProviderCards({ providers }: { providers: ProviderStats[] }) {
  if (providers.length === 0) {
    return <p className="text-text-muted text-sm">No provider data available.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {providers.map((p) => (
        <div key={p.name} className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server size={16} strokeWidth={1.5} className="text-primary" />
              <span className="font-medium text-text-primary capitalize">{p.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  p.health?.healthy ? "bg-success" : p.health?.available ? "bg-warning" : "bg-error"
                }`}
              />
              <span className="text-xs text-text-muted">
                {p.health?.healthy ? "Healthy" : p.health?.available ? "Degraded" : "Unavailable"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-text-muted text-xs">Sessions</span>
              <p className="font-mono text-text-primary">{p.sessions}</p>
            </div>
            <div>
              <span className="text-text-muted text-xs">Active</span>
              <p className="font-mono text-text-primary">{p.active}</p>
            </div>
            <div>
              <span className="text-text-muted text-xs">Messages</span>
              <p className="font-mono text-text-primary">{p.messages.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-text-muted text-xs">Cost</span>
              <p className="font-mono text-text-primary">${p.cost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionTimeline({ sessions }: { sessions: TimelineSession[] }) {
  if (sessions.length === 0) {
    return <p className="text-text-muted text-sm">No session data available.</p>;
  }

  const recent = sessions.slice(0, 20);
  const maxDuration = Math.max(...recent.map((s) => s.durationMs), 1);

  const statusColors: Record<string, string> = {
    active: "bg-success/70",
    idle: "bg-primary/60",
    stopped: "bg-text-muted/40",
    error: "bg-error/60",
  };

  return (
    <div className="space-y-2">
      {recent.map((s) => (
        <div key={s.id} className="flex items-center gap-3">
          <span className="text-xs text-text-muted w-28 truncate shrink-0" title={s.name}>
            {s.name}
          </span>
          <div className="flex-1 h-5 bg-surface-elevated rounded overflow-hidden">
            <div
              className={`h-full rounded transition-all duration-500 ${statusColors[s.status] ?? "bg-primary/40"}`}
              style={{ width: `${Math.max((s.durationMs / maxDuration) * 100, 2)}%` }}
              title={`${Math.round(s.durationMs / 60000)}min — ${s.provider} — ${s.messageCount} msgs`}
            />
          </div>
          <span className="text-[10px] text-text-muted w-14 text-right shrink-0">
            {s.durationMs >= 3600000
              ? `${Math.round(s.durationMs / 3600000)}h`
              : `${Math.round(s.durationMs / 60000)}m`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [providers, setProviders] = useState<ProviderStats[]>([]);
  const [timeline, setTimeline] = useState<TimelineSession[]>([]);
  const [costSeries, setCostSeries] = useState<CostPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsData, heatmapData, providerData, timelineData, costData] = await Promise.all([
        api.getSessions(),
        api.getAnalyticsHeatmap(7),
        api.getAnalyticsProviders(),
        api.getAnalyticsTimeline(),
        api.getCostAnalytics("daily", 30),
      ]);
      setSessions(sessionsData as SessionRecord[]);
      setHeatmap((heatmapData as any).heatmap ?? []);
      setProviders((providerData as any).providers ?? []);
      setTimeline((timelineData as any).sessions ?? []);
      setCostSeries((costData as any).timeSeries ?? []);
    } catch (err) {
      console.error("[Analytics] Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalSessions = sessions.length;
  const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
  const totalCost = sessions.reduce((sum, s) => sum + s.totalCost, 0);
  const totalTokens = sessions.reduce((sum, s) => sum + s.totalTokens, 0);

  const handleExportCsv = () => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/analytics/export?format=csv&days=30`,
      "_blank",
    );
  };

  return (
    <ErrorBoundary>
      <Layout>
        <div className="flex flex-col h-full overflow-auto bg-surface">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 size={24} strokeWidth={1.5} className="text-primary" />
              <h1 className="text-xl font-semibold text-text-primary">Analytics</h1>
            </div>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border rounded-lg hover:border-primary/40 transition-colors"
            >
              <Download size={14} strokeWidth={1.5} />
              Export CSV
            </button>
          </div>

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Activity size={24} strokeWidth={1.5} className="text-text-muted animate-pulse" />
                <span className="ml-2 text-text-muted">Loading analytics...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <AlertTriangle size={32} strokeWidth={1.5} className="mx-auto mb-3 text-error" />
                  <p className="text-text-primary font-medium mb-1">Failed to load analytics</p>
                  <p className="text-sm text-text-muted mb-4">{error}</p>
                  <button
                    onClick={fetchData}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <RefreshCw size={14} /> Retry
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={BarChart3}
                    label="Total Sessions"
                    value={totalSessions.toString()}
                    sub={`${sessions.filter((s) => s.status === "active").length} active`}
                  />
                  <StatCard
                    icon={MessageSquare}
                    label="Total Messages"
                    value={totalMessages.toLocaleString()}
                  />
                  <StatCard
                    icon={DollarSign}
                    label="Total Cost"
                    value={`$${totalCost.toFixed(2)}`}
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Total Tokens"
                    value={totalTokens.toLocaleString()}
                  />
                </div>

                {/* Activity Heatmap */}
                <div className="bg-surface border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={16} strokeWidth={1.5} className="text-text-muted" />
                    <h2 className="text-sm font-medium text-text-secondary">
                      Activity Heatmap (Last 7 Days)
                    </h2>
                  </div>
                  <ActivityHeatmap data={heatmap} />
                </div>

                {/* Cost Over Time */}
                <div className="bg-surface border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={16} strokeWidth={1.5} className="text-text-muted" />
                    <h2 className="text-sm font-medium text-text-secondary">
                      Daily Cost (Last 30 Days)
                    </h2>
                  </div>
                  <CostChart data={costSeries} />
                </div>

                {/* Provider Comparison */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Server size={16} strokeWidth={1.5} className="text-text-muted" />
                    <h2 className="text-sm font-medium text-text-secondary">
                      Provider Comparison
                    </h2>
                  </div>
                  <ProviderCards providers={providers} />
                </div>

                {/* Session Timeline */}
                <div className="bg-surface border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={16} strokeWidth={1.5} className="text-text-muted" />
                    <h2 className="text-sm font-medium text-text-secondary">
                      Session Timeline (Recent 20)
                    </h2>
                  </div>
                  <SessionTimeline sessions={timeline} />
                </div>
              </>
            )}
          </div>
        </div>
      </Layout>
    </ErrorBoundary>
  );
}
