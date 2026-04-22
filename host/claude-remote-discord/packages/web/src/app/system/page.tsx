"use client";

import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SystemSkeleton } from "@/components/ui/Skeleton";
import { useSystemStore } from "@/stores/system-store";
import { useSessionStore } from "@/stores/session-store";
import { api } from "@/lib/api";
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
  ScrollText,
  RefreshCw,
  Database,
  Wifi,
  Server,
  Zap,
} from "lucide-react";

interface ExtendedHealth {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  processUptime?: number;
  nodeVersion?: string;
  version?: string;
  activeSessions?: number;
  totalSessions?: number;
  processMemory?: { rss: number; heapUsed: number; heapTotal: number };
  dbSizeBytes?: number;
  wsConnections?: number;
  providerProcesses?: number;
  providerHealth?: Array<{ name: string; available: boolean; healthy: boolean; error?: string | null }>;
  messagesLast5Min?: number;
}

function ProgressBar({ value, color }: { value: number; color: string }) {
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getProgressColor(value: number): string {
  if (value > 80) return "bg-error";
  if (value > 60) return "bg-warning";
  return "bg-success";
}

export default function SystemPage() {
  const { health, errors } = useSystemStore();
  const { sessions } = useSessionStore();
  const [extHealth, setExtHealth] = useState<ExtendedHealth | null>(null);
  const [events, setEvents] = useState<Array<{ type: string; timestamp: number; data?: Record<string, unknown> }>>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const fetchEvents = useCallback(() => {
    setEventsError(null);
    api.getEvents(30).then(setEvents).catch((err) => {
      console.error(err);
      setEventsError(err instanceof Error ? err.message : "Failed to load events");
    });
  }, []);

  const fetchExtendedHealth = useCallback(() => {
    api.getHealth().then((data) => setExtHealth(data as ExtendedHealth)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchExtendedHealth();
    const interval = setInterval(fetchExtendedHealth, 15_000);
    return () => clearInterval(interval);
  }, [fetchEvents, fetchExtendedHealth]);

  const displayHealth = extHealth ?? health;
  const activeSessions = sessions.filter((s) => s.status === "active");
  const allGreen = displayHealth
    ? displayHealth.cpu < 80 && displayHealth.memory < 80 && displayHealth.disk < 80
    : false;

  return (
    <Layout>
      <ErrorBoundary>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Monitor size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="text-lg font-semibold">System</h1>
          </div>
          <div className="flex items-center gap-3">
            {extHealth?.version && (
              <span className="text-xs text-text-muted font-mono">v{extHealth.version}</span>
            )}
            {displayHealth && (
              <span className={`flex items-center gap-1 text-sm ${allGreen ? "text-success" : "text-warning"}`}>
                {allGreen ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                {allGreen ? "All Green" : "Attention Needed"}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!displayHealth && <SystemSkeleton />}
          {displayHealth && (
          <>
          {/* Resource usage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={16} className="text-info" />
                <span className="text-sm font-medium">CPU</span>
                <span className="text-sm text-text-muted ml-auto font-mono">{displayHealth.cpu}%</span>
              </div>
              <ProgressBar value={displayHealth.cpu} color={getProgressColor(displayHealth.cpu)} />
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-primary" />
                <span className="text-sm font-medium">Memory</span>
                <span className="text-sm text-text-muted ml-auto font-mono">{displayHealth.memory}%</span>
              </div>
              <ProgressBar value={displayHealth.memory} color={getProgressColor(displayHealth.memory)} />
            </div>

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive size={16} className="text-warning" />
                <span className="text-sm font-medium">Disk</span>
                <span className="text-sm text-text-muted ml-auto font-mono">{displayHealth.disk}%</span>
              </div>
              <ProgressBar value={displayHealth.disk} color={getProgressColor(displayHealth.disk)} />
            </div>
          </div>

          {/* System cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-text-muted" />
                <span className="text-xs text-text-muted">Uptime</span>
              </div>
              <p className="text-lg font-mono text-text-primary">{formatUptime(displayHealth.uptime)}</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wifi size={14} className="text-text-muted" />
                <span className="text-xs text-text-muted">WS Clients</span>
              </div>
              <p className="text-lg font-mono text-text-primary">{extHealth?.wsConnections ?? 0}</p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Database size={14} className="text-text-muted" />
                <span className="text-xs text-text-muted">DB Size</span>
              </div>
              <p className="text-lg font-mono text-text-primary">
                {extHealth?.dbSizeBytes ? formatBytes(extHealth.dbSizeBytes) : "—"}
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-text-muted" />
                <span className="text-xs text-text-muted">Msgs (5min)</span>
              </div>
              <p className="text-lg font-mono text-text-primary">{extHealth?.messagesLast5Min ?? 0}</p>
            </div>
          </div>

          {/* Process memory */}
          {extHealth?.processMemory && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Process Memory</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-text-muted text-xs">RSS</span>
                  <p className="font-mono text-text-primary">{formatBytes(extHealth.processMemory.rss)}</p>
                </div>
                <div>
                  <span className="text-text-muted text-xs">Heap Used</span>
                  <p className="font-mono text-text-primary">{formatBytes(extHealth.processMemory.heapUsed)}</p>
                </div>
                <div>
                  <span className="text-text-muted text-xs">Heap Total</span>
                  <p className="font-mono text-text-primary">{formatBytes(extHealth.processMemory.heapTotal)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Provider Health */}
          {extHealth?.providerHealth && extHealth.providerHealth.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Server size={14} className="text-primary" />
                Provider Health
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {extHealth.providerHealth.map((p) => (
                  <div key={p.name} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${p.healthy ? "bg-success animate-pulse" : p.available ? "bg-warning" : "bg-error"}`} />
                      <span className="text-sm font-medium text-text-primary capitalize">{p.name}</span>
                    </div>
                    <div className="text-xs text-text-muted">
                      {p.healthy ? "Healthy" : p.error ?? "Unavailable"}
                    </div>
                  </div>
                ))}
              </div>
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
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{s.name}</span>
                    <span className="text-xs text-text-muted font-mono">{s.provider} · {s.projectName}</span>
                  </div>
                ))}
                {activeSessions.length === 0 && (
                  <span className="text-xs text-text-muted">No active sessions</span>
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
                    <span className="text-text-muted font-mono">{new Date(err.timestamp).toLocaleTimeString()}</span>{" "}
                    <span className={err.severity === "error" ? "text-error" : "text-warning"}>{err.message}</span>
                  </div>
                ))}
                {errors.length === 0 && (
                  <span className="text-xs text-text-muted">No errors</span>
                )}
              </div>
            </div>
          </div>

          {/* Events log */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ScrollText size={14} className="text-primary" />
              Recent Events
            </h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {eventsError ? (
                <div className="flex items-center gap-2 text-xs text-error">
                  <AlertTriangle size={12} />
                  <span>{eventsError}</span>
                  <button onClick={fetchEvents} className="ml-2 text-primary hover:text-primary-hover">
                    <RefreshCw size={12} />
                  </button>
                </div>
              ) : events.length > 0 ? events.map((evt, i) => (
                <div key={i} className="flex items-center gap-3 text-xs py-1">
                  <span className="text-text-muted font-mono shrink-0">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  <span className="text-text-secondary font-mono">{evt.type}</span>
                </div>
              )) : (
                <span className="text-xs text-text-muted">No recent events</span>
              )}
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
                <p className="font-mono text-text-primary">3002</p>
              </div>
              <div>
                <span className="text-text-muted text-xs">Node</span>
                <p className="font-mono text-text-primary">{extHealth?.nodeVersion ?? "—"}</p>
              </div>
              <div>
                <span className="text-text-muted text-xs">Sessions</span>
                <p className="font-mono text-text-primary">{extHealth?.totalSessions ?? sessions.length}</p>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
      </ErrorBoundary>
    </Layout>
  );
}
