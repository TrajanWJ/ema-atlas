"use client";

import { Layout } from "@/components/layout/Layout";
import { useSystemStore } from "@/stores/system-store";
import { useSessionStore } from "@/stores/session-store";
import {
  Monitor,
  Cpu,
  HardDrive,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Circle,
  Settings,
} from "lucide-react";

function ProgressBar({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  return (
    <div className="w-full h-2 bg-input rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
}

export default function SystemPage() {
  const { health, errors } = useSystemStore();
  const { sessions } = useSessionStore();

  const activeSessions = sessions.filter((s) => s.status === "active");
  const allGreen = health
    ? health.cpu < 80 && health.memory < 80 && health.disk < 80
    : false;

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Monitor size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="text-lg font-semibold">System</h1>
          </div>
          {health && (
            <span
              className={`flex items-center gap-1 text-sm ${
                allGreen ? "text-success" : "text-warning"
              }`}
            >
              {allGreen ? (
                <CheckCircle size={14} />
              ) : (
                <AlertTriangle size={14} />
              )}
              {allGreen ? "All Green" : "Attention Needed"}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Resource usage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={16} className="text-info" />
                <span className="text-sm font-medium">CPU</span>
                <span className="text-sm text-text-muted ml-auto font-mono">
                  {health?.cpu ?? 0}%
                </span>
              </div>
              <ProgressBar
                value={health?.cpu ?? 0}
                color={
                  (health?.cpu ?? 0) > 80
                    ? "bg-error"
                    : (health?.cpu ?? 0) > 60
                    ? "bg-warning"
                    : "bg-success"
                }
              />
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-primary" />
                <span className="text-sm font-medium">Memory</span>
                <span className="text-sm text-text-muted ml-auto font-mono">
                  {health?.memory ?? 0}%
                </span>
              </div>
              <ProgressBar
                value={health?.memory ?? 0}
                color={
                  (health?.memory ?? 0) > 80
                    ? "bg-error"
                    : (health?.memory ?? 0) > 60
                    ? "bg-warning"
                    : "bg-success"
                }
              />
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive size={16} className="text-warning" />
                <span className="text-sm font-medium">Disk</span>
                <span className="text-sm text-text-muted ml-auto font-mono">
                  {health?.disk ?? 0}%
                </span>
              </div>
              <ProgressBar
                value={health?.disk ?? 0}
                color={
                  (health?.disk ?? 0) > 80
                    ? "bg-error"
                    : (health?.disk ?? 0) > 60
                    ? "bg-warning"
                    : "bg-success"
                }
              />
            </div>
          </div>

          {/* Uptime */}
          {health && (
            <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-3">
              <Clock size={16} className="text-text-muted" />
              <span className="text-sm text-text-secondary">Uptime:</span>
              <span className="text-sm font-mono text-text-primary">
                {formatUptime(health.uptime)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active sessions */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Circle size={8} className="text-success fill-success" />
                Active Sessions ({activeSessions.length})
              </h3>
              <div className="space-y-2">
                {activeSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-text-primary">{s.name}</span>
                    <span className="text-xs text-text-muted font-mono">
                      {s.provider} · {s.projectName}
                    </span>
                  </div>
                ))}
                {activeSessions.length === 0 && (
                  <span className="text-xs text-text-muted">
                    No active sessions
                  </span>
                )}
              </div>
            </div>

            {/* Recent errors */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-error" />
                Recent Errors ({errors.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {errors.slice(0, 10).map((err, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-text-muted font-mono">
                      {new Date(err.timestamp).toLocaleTimeString()}
                    </span>{" "}
                    <span
                      className={
                        err.severity === "error"
                          ? "text-error"
                          : "text-warning"
                      }
                    >
                      {err.message}
                    </span>
                  </div>
                ))}
                {errors.length === 0 && (
                  <span className="text-xs text-text-muted">No errors 🎉</span>
                )}
              </div>
            </div>
          </div>

          {/* Config */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings size={14} className="text-text-muted" />
              Configuration
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-text-muted text-xs">Server Port</span>
                <p className="font-mono text-text-primary">3001</p>
              </div>
              <div>
                <span className="text-text-muted text-xs">Web Port</span>
                <p className="font-mono text-text-primary">3000</p>
              </div>
              <div>
                <span className="text-text-muted text-xs">Max Sessions</span>
                <p className="font-mono text-text-primary">8</p>
              </div>
              <div>
                <span className="text-text-muted text-xs">Providers</span>
                <p className="font-mono text-text-primary">Claude, Codex</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
