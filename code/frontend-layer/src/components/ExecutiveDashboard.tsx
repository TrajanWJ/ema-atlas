"use client";

import { useState, useEffect } from "react";

interface ExecutiveData {
  greeting: string;
  date: string;
  priority_tasks: Array<{
    id: string;
    priority: string;
    description: string;
    agent: string;
    status: string;
  }>;
  pending_dispatch: Array<{
    id: string;
    priority: string;
    description: string;
    agent: string;
    status: string;
  }>;
  active_dispatch: Array<{
    id: string;
    priority: string;
    description: string;
    agent: string;
    status: string;
  }>;
  vault_changes_24h: Array<{
    name: string;
    relativePath: string;
    modified: string;
  }>;
  active_projects: Array<{
    name: string;
    status: string;
    stack?: string;
    description?: string;
  }>;
  system_health: {
    cpu?: number;
    memory?: { totalMB: number; usedMB: number; percent: number };
    disk?: { total: string; used: string; percent: number };
    gateway?: string;
  };
  agent_sessions: {
    count: number;
    raw: string;
  };
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: "#EF4444",
  P1: "#F97316",
  P2: "#EAB308",
  P3: "#22C55E",
  P4: "#6B7280",
};

const AGENT_EMOJIS: Record<string, string> = {
  main: "🤝",
  researcher: "🔬",
  coder: "💻",
  ops: "⚙️",
  security: "🛡️",
  "vault-keeper": "📚",
  "browser-automation": "🔭",
  "prompt-engineer": "🎯",
  concierge: "🛎️",
  "devils-advocate": "😈",
  strategist: "🧠",
  unassigned: "❓",
};

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/executive/daily");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const toggleTask = (id: string) => {
    setCheckedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="text-3xl animate-pulse">🧠</div>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Gathering your day...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm" style={{ color: "#EF4444" }}>{error || "No data"}</p>
          <button
            onClick={() => { setLoading(true); setError(null); }}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "var(--color-surface)", color: "var(--color-accent)" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const healthGatewayColor = data.system_health.gateway === "healthy" ? "#22C55E" :
    data.system_health.gateway === "degraded" ? "#EAB308" : "#EF4444";

  return (
    <div className="p-4 md:p-6 space-y-5 pb-24 overflow-y-auto max-w-4xl mx-auto">
      {/* Hero greeting */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          {data.greeting} ☀️
        </h1>
        <p className="text-sm font-mono" style={{ color: "var(--color-text-secondary)" }}>
          {data.date}
        </p>
      </div>

      {/* System Health Mini-Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <HealthCard
          label="Gateway"
          value={data.system_health.gateway || "unknown"}
          color={healthGatewayColor}
          emoji="🌐"
        />
        <HealthCard
          label="CPU"
          value={`${data.system_health.cpu?.toFixed(1) ?? "?"}%`}
          color={(data.system_health.cpu ?? 0) > 80 ? "#EF4444" : "#22C55E"}
          emoji="🧮"
        />
        <HealthCard
          label="Memory"
          value={`${data.system_health.memory?.percent ?? 0}%`}
          color={(data.system_health.memory?.percent ?? 0) > 80 ? "#EF4444" : "#22C55E"}
          emoji="💾"
          subtitle={data.system_health.memory ? `${data.system_health.memory.usedMB}/${data.system_health.memory.totalMB}MB` : undefined}
        />
        <HealthCard
          label="Disk"
          value={`${data.system_health.disk?.percent ?? 0}%`}
          color={(data.system_health.disk?.percent ?? 0) > 80 ? "#EF4444" : "#22C55E"}
          emoji="💿"
          subtitle={data.system_health.disk ? `${data.system_health.disk.used}/${data.system_health.disk.total}` : undefined}
        />
      </div>

      {/* Priority Tasks */}
      <DashboardCard title="Priority Tasks" emoji="🎯" count={data.priority_tasks.length} emptyText="No tasks in queue — all clear!">
        <div className="space-y-2">
          {data.priority_tasks.map(task => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-xl transition-all"
              style={{
                background: checkedTasks.has(task.id) ? "var(--color-surface-elevated)" : "transparent",
                opacity: checkedTasks.has(task.id) ? 0.5 : 1,
              }}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors"
                style={{
                  borderColor: checkedTasks.has(task.id) ? "#22C55E" : "var(--color-border)",
                  background: checkedTasks.has(task.id) ? "#22C55E20" : "transparent",
                }}
              >
                {checkedTasks.has(task.id) && <span className="text-xs" style={{ color: "#22C55E" }}>✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm"
                  style={{
                    color: "var(--color-text-primary)",
                    textDecoration: checkedTasks.has(task.id) ? "line-through" : "none",
                  }}
                >
                  {task.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{ color: PRIORITY_COLORS[task.priority] || "#888", background: `${PRIORITY_COLORS[task.priority] || "#888"}15` }}
                  >
                    {task.priority}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
                    {AGENT_EMOJIS[task.agent] || "🤖"} {task.agent}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      color: task.status === "active" ? "#22C55E" : "var(--color-text-secondary)",
                      background: task.status === "active" ? "#22C55E15" : "var(--color-surface-elevated)",
                    }}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Dispatch Queue */}
      {(data.pending_dispatch.length > 0 || data.active_dispatch.length > 0) && (
        <DashboardCard
          title="Dispatch Queue"
          emoji="📤"
          count={data.pending_dispatch.length + data.active_dispatch.length}
        >
          <div className="space-y-2">
            {[...data.active_dispatch, ...data.pending_dispatch].map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "var(--color-surface-elevated)" }}>
                <span className="text-base">{AGENT_EMOJIS[task.agent] || "🤖"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "var(--color-text-primary)" }}>{task.description}</p>
                </div>
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{ color: PRIORITY_COLORS[task.priority] || "#888", background: `${PRIORITY_COLORS[task.priority] || "#888"}15` }}
                >
                  {task.priority}
                </span>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status === "active" ? "#22C55E" : "#EAB308" }} />
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* Active Projects */}
      <DashboardCard title="Active Projects" emoji="🚀" count={data.active_projects.length} emptyText="No projects found">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.active_projects.map(project => (
            <div key={project.name} className="p-3 rounded-xl" style={{ background: "var(--color-surface-elevated)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{project.name}</p>
              {project.description && (
                <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>{project.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#3B82F620", color: "#3B82F6" }}>
                  {project.status}
                </span>
                {project.stack && (
                  <span className="text-[10px] truncate" style={{ color: "var(--color-text-secondary)" }}>{project.stack}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Vault Changes */}
      <DashboardCard title="What Changed Today" emoji="📝" count={data.vault_changes_24h.length} emptyText="No vault changes in the last 24h">
        <div className="space-y-1">
          {data.vault_changes_24h.slice(0, 15).map(change => (
            <div key={change.relativePath} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors">
              <span className="text-xs shrink-0">📄</span>
              <span className="text-xs flex-1 min-w-0 truncate" style={{ color: "var(--color-text-primary)" }}>
                {change.name}
              </span>
              <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--color-text-secondary)" }}>
                {change.relativePath.split("/").slice(0, -1).join("/")}
              </span>
              <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--color-text-secondary)" }}>
                {timeAgo(change.modified)}
              </span>
            </div>
          ))}
          {data.vault_changes_24h.length > 15 && (
            <p className="text-[10px] text-center py-1" style={{ color: "var(--color-text-secondary)" }}>
              +{data.vault_changes_24h.length - 15} more changes
            </p>
          )}
        </div>
      </DashboardCard>

      {/* Agent Sessions */}
      <div className="p-3 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <span>🤖</span>
          <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>Agent Sessions</span>
          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--color-surface-elevated)", color: "var(--color-accent)" }}>
            {data.agent_sessions.count} active
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Reusable Components ──

function HealthCard({ label, value, color, emoji, subtitle }: {
  label: string; value: string; color: string; emoji: string; subtitle?: string;
}) {
  return (
    <div className="p-3 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{emoji}</span>
        <span className="text-[10px] uppercase" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      </div>
      <p className="text-sm font-mono font-bold mt-1" style={{ color }}>{value}</p>
      {subtitle && <p className="text-[10px] font-mono" style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>}
    </div>
  );
}

function DashboardCard({ title, emoji, count, children, emptyText }: {
  title: string; emoji: string; count?: number; children: React.ReactNode; emptyText?: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <span>{emoji}</span>
        <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</span>
        {typeof count === "number" && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded ml-auto" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-secondary)" }}>
            {count}
          </span>
        )}
      </div>
      <div className="p-3">
        {count === 0 && emptyText ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--color-text-secondary)" }}>{emptyText}</p>
        ) : children}
      </div>
    </div>
  );
}
