"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage, AgentEvent, SystemStatus, LiveAgentInfo } from "@/lib/types";
import { AGENTS } from "@/lib/types";
import RadialGauge from "./RadialGauge";
import ComposeOverlay from "./ComposeOverlay";
import ConfirmModal from "./ConfirmModal";
import ExecutiveDashboard from "./ExecutiveDashboard";
import { useToast } from "./ToastProvider";

// ── Widget system for extensible dashboard ──
interface WidgetConfig {
  id: string;
  type: "status-card" | "agent-card" | "action-button" | "feed-item";
  title: string;
  emoji: string;
  color?: string;
  data?: Record<string, unknown>;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "health", type: "status-card", title: "System Health", emoji: "💚" },
  { id: "agents", type: "status-card", title: "Active Agents", emoji: "🤖" },
  { id: "usage", type: "status-card", title: "API Usage", emoji: "📊" },
  { id: "uptime", type: "status-card", title: "Uptime", emoji: "⏱️" },
];

type TabId = "executive" | "home" | "agents" | "vault" | "system";

interface MobileAppProps {
  status: "connected" | "connecting" | "disconnected";
  messages: ChatMessage[];
  agentEvents: AgentEvent[];
}

// ── Recent Activity (mock for now, will be replaced by SSE) ──
const MOCK_ACTIVITY = [
  { id: "1", agentId: "coder", emoji: "💻", description: "Frontend iteration 7 shipped", time: "2m ago", color: "#57A773" },
  { id: "2", agentId: "researcher", emoji: "🔬", description: "Deep dive on delegation patterns", time: "15m ago", color: "#2BA89E" },
  { id: "3", agentId: "main", emoji: "🤝", description: "Vault reorganization complete", time: "32m ago", color: "#E8A838" },
  { id: "4", agentId: "ops", emoji: "⚙️", description: "System health check passed", time: "1h ago", color: "#6C7A89" },
  { id: "5", agentId: "security", emoji: "🛡️", description: "Port scan audit — all clear", time: "2h ago", color: "#E74C3C" },
];

export default function MobileApp({ status, messages, agentEvents }: MobileAppProps) {
  const [activeTab, setActiveTab] = useState<TabId>("executive");
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [liveAgents, setLiveAgents] = useState<LiveAgentInfo[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeAgent, setComposeAgent] = useState<string | undefined>();
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const { toast } = useToast();

  // SSE for real-time updates
  const [pulse, setPulse] = useState(false);

  // Poll system status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/system/status");
        if (res.ok) setSystemStatus(await res.json());
      } catch { /* silent */ }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Poll agents
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/system/agents");
        if (res.ok) {
          const data = await res.json();
          setLiveAgents(data.agents || []);
        }
      } catch { /* silent */ }
    }
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  // SSE connection for real-time updates
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/system/events");
      es.addEventListener("health", () => {
        setPulse(true);
        setTimeout(() => setPulse(false), 1000);
      });
      es.onerror = () => {
        es?.close();
        // Reconnect after 10s
        setTimeout(() => {
          // Will reconnect on next render
        }, 10000);
      };
    } catch { /* SSE not supported */ }
    return () => es?.close();
  }, []);

  const switchTab = useCallback((tab: TabId) => {
    const order: TabId[] = ["executive", "home", "agents", "vault", "system"];
    const currentIdx = order.indexOf(activeTab);
    const nextIdx = order.indexOf(tab);
    setSlideDirection(nextIdx > currentIdx ? "right" : "left");
    setActiveTab(tab);
  }, [activeTab]);

  const openCompose = useCallback((agentId?: string) => {
    setComposeAgent(agentId);
    setComposeOpen(true);
  }, []);

  // Derived values
  const healthPct = systemStatus?.usagePct ?? 0;
  const healthColor = healthPct > 75 ? "#EF4444" : healthPct >= 50 ? "#EAB308" : "#22C55E";
  const agentCount = liveAgents.length || agentEvents.filter(e => e.status === "running").length;
  const uptime = systemStatus?.uptime || "—";

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      {/* Mini status bar */}
      <div
        className="h-10 flex items-center px-3 gap-3 shrink-0"
        style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className={pulse ? "animate-pulse" : ""}
            style={{
              width: 7, height: 7, borderRadius: "50%",
              backgroundColor: status === "connected" ? "#22C55E" : status === "connecting" ? "#EAB308" : "#EF4444",
              boxShadow: `0 0 5px ${status === "connected" ? "#22C55E" : "#EF4444"}`,
            }}
          />
          <span className="text-[10px] font-mono" style={{ color: "var(--color-text-secondary)" }}>
            {status === "connected" ? "Live" : status === "connecting" ? "..." : "Off"}
          </span>
        </div>
        <div className="flex-1" />
        <span className="font-semibold tracking-wide text-[10px]" style={{ color: "var(--color-accent)" }}>
          OPENCLAW
        </span>
      </div>

      {/* Tab content area */}
      <div className="flex-1 overflow-hidden relative">
        <div
          key={activeTab}
          className="absolute inset-0 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: "touch",
            animation: `slide-${slideDirection} 0.25s ease-out`,
          }}
        >
          {activeTab === "executive" && (
            <ExecutiveDashboard />
          )}
          {activeTab === "home" && (
            <HomeView
              healthPct={healthPct}
              healthColor={healthColor}
              agentCount={agentCount}
              uptime={uptime}
              liveAgents={liveAgents}
              widgets={DEFAULT_WIDGETS}
              systemStatus={systemStatus}
              onAgentTap={(id) => switchTab("agents")}
              pulse={pulse}
            />
          )}
          {activeTab === "agents" && (
            <AgentsView
              liveAgents={liveAgents}
              onSendTask={(agentId) => openCompose(agentId)}
              toast={toast}
            />
          )}
          {activeTab === "vault" && (
            <VaultView toast={toast} />
          )}
          {activeTab === "system" && (
            <SystemView
              systemStatus={systemStatus}
              connectionStatus={status}
              toast={toast}
            />
          )}
        </div>
      </div>

      {/* FAB - Compose message */}
      <button
        onClick={() => openCompose()}
        className="fixed z-40 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg active:scale-90 transition-transform"
        style={{
          bottom: 90,
          right: 20,
          background: "var(--color-accent)",
          boxShadow: "0 4px 20px rgba(232, 168, 56, 0.4)",
        }}
      >
        💬
      </button>

      {/* Floating bottom nav bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div
          className="flex items-center gap-1 px-4 py-2 rounded-full"
          style={{
            background: "rgba(20, 20, 25, 0.85)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {([
            { id: "executive" as TabId, icon: "🧠" },
            { id: "home" as TabId, icon: "🏠" },
            { id: "agents" as TabId, icon: "🤖" },
            { id: "vault" as TabId, icon: "📚" },
            { id: "system" as TabId, icon: "⚙️" },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className="relative w-14 h-12 flex flex-col items-center justify-center rounded-xl transition-all active:scale-90"
              style={{
                background: activeTab === tab.id ? "rgba(255,255,255,0.08)" : "transparent",
              }}
            >
              <span className="text-xl" style={{ filter: activeTab === tab.id ? "none" : "grayscale(50%) opacity(0.6)" }}>
                {tab.icon}
              </span>
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Compose overlay */}
      <ComposeOverlay
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        preselectedAgent={composeAgent}
      />

      {/* Slide animations */}
      <style jsx global>{`
        @keyframes slide-right {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-left {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════
// HOME VIEW
// ══════════════════════════════════════════════════
function HomeView({
  healthPct, healthColor, agentCount, uptime, liveAgents, widgets, systemStatus, onAgentTap, pulse,
}: {
  healthPct: number; healthColor: string; agentCount: number; uptime: string;
  liveAgents: LiveAgentInfo[]; widgets: WidgetConfig[]; systemStatus: SystemStatus | null;
  onAgentTap: (id: string) => void; pulse: boolean;
}) {
  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Radial gauge hero */}
      <div
        className={`rounded-2xl p-5 relative overflow-hidden transition-shadow duration-500 ${pulse ? "ring-1 ring-green-500/30" : ""}`}
        style={{
          background: `linear-gradient(135deg, ${healthColor}08, ${healthColor}15)`,
          border: `1px solid ${healthColor}25`,
        }}
      >
        <div className="flex items-center justify-center">
          <RadialGauge value={100 - healthPct} size={140} color={healthColor} label={String(agentCount)} sublabel="agents" />
        </div>
        <div className="flex justify-center gap-6 mt-3">
          <div className="text-center">
            <span className="text-xs font-mono font-bold" style={{ color: "var(--color-text-primary)" }}>{healthPct}% used</span>
          </div>
          <div className="text-center">
            <span className="text-xs font-mono font-bold" style={{ color: "var(--color-text-primary)" }}>{uptime} uptime</span>
          </div>
        </div>
      </div>

      {/* Agent strip */}
      <div>
        <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--color-text-secondary)" }}>Agents</h3>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {(liveAgents.length > 0 ? liveAgents : Object.values(AGENTS).filter(a => a.id !== "user")).map((agent) => {
            const info = AGENTS[agent.id] || { emoji: (agent as LiveAgentInfo).emoji || "🤖", name: (agent as LiveAgentInfo).name || agent.id, color: (agent as LiveAgentInfo).color || "#888" };
            const isActive = (agent as LiveAgentInfo).status === "active";
            return (
              <button key={agent.id} className="flex flex-col items-center gap-1 shrink-0 active:scale-90 transition-transform"
                onClick={() => onAgentTap(agent.id)}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg relative"
                  style={{ border: `2px solid ${info.color}`, background: `${info.color}15`, boxShadow: isActive ? `0 0 10px ${info.color}40` : "none" }}
                >
                  {info.emoji}
                  {isActive && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ backgroundColor: "#22C55E", borderColor: "var(--color-bg)" }} />}
                </div>
                <span className="text-[9px] truncate max-w-[48px]" style={{ color: "var(--color-text-secondary)" }}>{info.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Widget grid (extensible) */}
      <div>
        <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--color-text-secondary)" }}>Dashboard</h3>
        <div className="grid grid-cols-2 gap-3">
          {widgets.map(w => (
            <div key={w.id} className="rounded-xl p-3" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <span className="text-lg">{w.emoji}</span>
              <p className="text-[10px] mt-1" style={{ color: "var(--color-text-secondary)" }}>{w.title}</p>
              <p className="text-sm font-mono font-bold mt-0.5" style={{ color: "var(--color-text-primary)" }}>
                {w.id === "health" ? (systemStatus?.status === "ok" ? "Healthy" : systemStatus?.status || "—") :
                 w.id === "agents" ? String(agentCount) :
                 w.id === "usage" ? `${healthPct}%` :
                 w.id === "uptime" ? uptime : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div>
        <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--color-text-secondary)" }}>Recent Activity</h3>
        <div className="space-y-2">
          {MOCK_ACTIVITY.map(a => (
            <div key={a.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: a.color }} />
              <span className="text-base shrink-0">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate" style={{ color: "var(--color-text-primary)" }}>{a.description}</p>
              </div>
              <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--color-text-secondary)" }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// AGENTS VIEW
// ══════════════════════════════════════════════════
function AgentsView({
  liveAgents, onSendTask, toast,
}: {
  liveAgents: LiveAgentInfo[];
  onSendTask: (agentId: string) => void;
  toast: (msg: string, type?: "success" | "error" | "warning" | "info") => void;
}) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [confirmKill, setConfirmKill] = useState<string | null>(null);
  const [killing, setKilling] = useState(false);

  const allAgents: LiveAgentInfo[] = liveAgents.length > 0
    ? liveAgents
    : Object.values(AGENTS).filter(a => a.id !== "user").map(a => ({
        ...a, status: "idle" as const, sessionCount: 0, lastActivity: undefined,
      }));

  const handleKill = async (agentId: string) => {
    setKilling(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/kill`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast(`Sessions killed for ${AGENTS[agentId]?.name || agentId}`, "success");
      } else {
        toast(data.error || "Kill failed", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setKilling(false);
      setConfirmKill(null);
    }
  };

  return (
    <div className="p-4 space-y-3 pb-24">
      <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Agent Control</h2>
      <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
        {allAgents.filter(a => a.status === "active").length} active · {allAgents.length} total
      </p>

      {allAgents.map(agent => {
        const info = AGENTS[agent.id] || agent;
        const isActive = agent.status === "active";
        const isExpanded = expandedAgent === agent.id;

        return (
          <div key={agent.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <button
              className="w-full flex items-center gap-3 p-4 active:opacity-80"
              onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ border: `2px solid ${info.color}`, background: `${info.color}10` }}
              >
                {info.emoji}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: info.color }}>{info.name}</p>
                <p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
                  {agent.sessionCount} sessions · {agent.lastActivity || (isActive ? "Active now" : "Idle")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isActive ? "#22C55E" : "var(--color-border)" }} />
                <span className="text-xs" style={{ color: "var(--color-text-secondary)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-2" style={{ animation: "slide-right 0.2s ease-out" }}>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSendTask(agent.id)}
                    className="py-2.5 rounded-xl text-xs font-medium active:scale-95 transition-transform"
                    style={{ background: `${info.color}15`, color: info.color, border: `1px solid ${info.color}30` }}
                  >
                    📩 Send Task
                  </button>
                  <button
                    onClick={() => toast(`Sessions: ${agent.sessionCount}`, "info")}
                    className="py-2.5 rounded-xl text-xs font-medium active:scale-95 transition-transform"
                    style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-secondary)" }}
                  >
                    📋 View Sessions
                  </button>
                </div>
                {agent.sessionCount > 0 && (
                  <button
                    onClick={() => setConfirmKill(agent.id)}
                    className="w-full py-2.5 rounded-xl text-xs font-medium active:scale-95 transition-transform"
                    style={{ background: "#EF444415", color: "#EF4444", border: "1px solid #EF444430" }}
                  >
                    🛑 Kill Sessions
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      <ConfirmModal
        open={confirmKill !== null}
        title="Kill Agent Sessions"
        message={`Stop all active sessions for ${AGENTS[confirmKill || ""]?.name || confirmKill}? This cannot be undone.`}
        confirmLabel={killing ? "Killing..." : "Kill Sessions"}
        confirmColor="#EF4444"
        onConfirm={() => confirmKill && handleKill(confirmKill)}
        onCancel={() => setConfirmKill(null)}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════
// VAULT VIEW
// ══════════════════════════════════════════════════
interface VaultFileData {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: VaultFileData[];
}

function VaultView({ toast }: { toast: (msg: string, type?: "success" | "error" | "warning" | "info") => void }) {
  const [tree, setTree] = useState<VaultFileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadTree() {
      try {
        const res = await fetch("/api/vault/tree");
        if (res.ok) {
          const data = await res.json();
          setTree(data.tree || []);
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    loadTree();
  }, []);

  const openFile = async (path: string) => {
    setSelectedFile(path);
    setEditing(false);
    try {
      const res = await fetch(`/api/vault/file?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
        setEditContent(data.content);
      } else {
        setFileContent("Failed to load file");
      }
    } catch {
      setFileContent("Network error");
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/vault/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedFile, content: editContent }),
      });
      if (res.ok) {
        setFileContent(editContent);
        setEditing(false);
        toast("File saved", "success");
      } else {
        toast("Save failed", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteFile = async () => {
    if (!selectedFile) return;
    try {
      const res = await fetch(`/api/vault/file?path=${encodeURIComponent(selectedFile)}`, { method: "DELETE" });
      if (res.ok) {
        toast("File deleted", "success");
        setSelectedFile(null);
        setConfirmDelete(false);
      } else {
        toast("Delete failed", "error");
      }
    } catch {
      toast("Network error", "error");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fileContent).then(
      () => toast("Copied to clipboard", "success"),
      () => toast("Copy failed", "error"),
    );
  };

  // File detail view
  if (selectedFile) {
    const fileName = selectedFile.split("/").pop() || selectedFile;
    return (
      <div className="flex flex-col h-full pb-24">
        {/* File header */}
        <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <button onClick={() => { setSelectedFile(null); setEditing(false); }} className="text-sm" style={{ color: "var(--color-accent)" }}>← Back</button>
          <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--color-text-primary)" }}>📄 {fileName}</span>
        </div>

        {/* Action buttons */}
        <div className="px-4 py-2 flex gap-2 shrink-0">
          {!editing ? (
            <>
              <button onClick={() => setEditing(true)} className="flex-1 py-2 rounded-lg text-xs font-medium"
                style={{ background: "var(--color-accent)20", color: "var(--color-accent)", border: "1px solid var(--color-accent)40" }}>
                ✏️ Edit
              </button>
              <button onClick={copyToClipboard} className="flex-1 py-2 rounded-lg text-xs font-medium"
                style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-secondary)" }}>
                📋 Copy
              </button>
              <button onClick={() => setConfirmDelete(true)} className="py-2 px-3 rounded-lg text-xs font-medium"
                style={{ background: "#EF444415", color: "#EF4444" }}>
                🗑️
              </button>
            </>
          ) : (
            <>
              <button onClick={saveFile} disabled={saving} className="flex-1 py-2 rounded-lg text-xs font-semibold"
                style={{ background: "#22C55E20", color: "#22C55E", border: "1px solid #22C55E40", opacity: saving ? 0.5 : 1 }}>
                {saving ? "Saving..." : "💾 Save"}
              </button>
              <button onClick={() => { setEditing(false); setEditContent(fileContent); }} className="flex-1 py-2 rounded-lg text-xs font-medium"
                style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-secondary)" }}>
                Cancel
              </button>
            </>
          )}
        </div>

        {/* File content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {editing ? (
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full h-full min-h-[300px] resize-none text-xs font-mono p-3 rounded-xl outline-none"
              style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}
            />
          ) : (
            <pre className="text-xs font-mono whitespace-pre-wrap p-3 rounded-xl"
              style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", border: "1px solid var(--color-border)" }}>
              {fileContent}
            </pre>
          )}
        </div>

        <ConfirmModal
          open={confirmDelete}
          title="Delete File"
          message={`Delete "${fileName}" permanently? This cannot be undone.`}
          confirmLabel="Delete"
          confirmColor="#EF4444"
          onConfirm={deleteFile}
          onCancel={() => setConfirmDelete(false)}
        />
      </div>
    );
  }

  // File browser
  return (
    <div className="p-4 pb-24 space-y-3">
      <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Vault</h2>

      <input
        type="text"
        placeholder="Search vault..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
      />

      {loading ? (
        <p className="text-xs text-center py-8" style={{ color: "var(--color-text-secondary)" }}>Loading vault...</p>
      ) : (
        <VaultTree items={tree} onFileClick={openFile} depth={0} filter={searchQuery} />
      )}
    </div>
  );
}

function VaultTree({ items, onFileClick, depth, filter }: { items: VaultFileData[]; onFileClick: (p: string) => void; depth: number; filter: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = filter
    ? items.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()) || (i.type === "directory"))
    : items;

  return (
    <div style={{ paddingLeft: depth > 0 ? 12 : 0 }}>
      {filtered.map(item => (
        <div key={item.path}>
          {item.type === "directory" ? (
            <>
              <button
                className="w-full flex items-center gap-2 py-2 px-2 rounded-lg text-xs active:opacity-70"
                onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(item.path) ? n.delete(item.path) : n.add(item.path); return n; })}
                style={{ color: "var(--color-text-primary)" }}
              >
                <span style={{ transform: expanded.has(item.path) ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▶</span>
                <span>📁 {item.name}</span>
              </button>
              {expanded.has(item.path) && item.children && (
                <VaultTree items={item.children} onFileClick={onFileClick} depth={depth + 1} filter={filter} />
              )}
            </>
          ) : (
            <button
              className="w-full flex items-center gap-2 py-2 px-2 rounded-lg text-xs active:opacity-70"
              onClick={() => onFileClick(item.path)}
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span>📄</span>
              <span className="truncate">{item.name}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════
// SYSTEM VIEW
// ══════════════════════════════════════════════════
function SystemView({
  systemStatus, connectionStatus, toast,
}: {
  systemStatus: SystemStatus | null;
  connectionStatus: string;
  toast: (msg: string, type?: "success" | "error" | "warning" | "info") => void;
}) {
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [fullStatus, setFullStatus] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [crons, setCrons] = useState<Array<{ name: string; schedule: string; nextRun?: string; command: string }>>([]);

  // Fetch crons on mount
  useEffect(() => {
    async function fetchCrons() {
      try {
        const res = await fetch("/api/system/crons");
        if (res.ok) {
          const data = await res.json();
          setCrons(data.crons || []);
        }
      } catch { /* silent */ }
    }
    fetchCrons();
  }, []);

  const handleRestart = async () => {
    setRestarting(true);
    try {
      const res = await fetch("/api/system/restart", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast("Gateway restart initiated", "warning");
      } else {
        toast(data.error || "Restart failed", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setRestarting(false);
      setConfirmRestart(false);
    }
  };

  const fetchFullStatus = async () => {
    try {
      const res = await fetch("/api/system/full-status");
      if (res.ok) {
        setFullStatus(await res.json());
        toast("Status refreshed", "info");
      }
    } catch {
      toast("Failed to fetch status", "error");
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/system/logs?lines=50");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch {
      toast("Failed to fetch logs", "error");
    } finally {
      setLoadingLogs(false);
    }
  };

  const clearCache = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/system/clear-cache", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast("Cache cleared", "success");
      } else {
        toast("Clear failed", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setClearing(false);
    }
  };

  const copyLogs = () => {
    if (logs) {
      navigator.clipboard.writeText(logs).then(
        () => toast("Logs copied", "success"),
        () => toast("Copy failed", "error"),
      );
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>System</h2>

      {/* Status grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Gateway", value: systemStatus?.status === "ok" ? "Healthy" : systemStatus?.status || "—", color: systemStatus?.status === "ok" ? "#22C55E" : "#EF4444" },
          { label: "WebSocket", value: connectionStatus === "connected" ? "Live" : "Off", color: connectionStatus === "connected" ? "#22C55E" : "#EF4444" },
          { label: "Agents", value: String(systemStatus?.activeAgents ?? 0), color: "var(--color-accent)" },
          { label: "Usage", value: `${systemStatus?.usagePct ?? 0}%`, color: (systemStatus?.usagePct ?? 0) > 75 ? "#EF4444" : "#22C55E" },
          { label: "Uptime", value: systemStatus?.uptime || "—", color: "var(--color-text-primary)" },
          { label: "Version", value: systemStatus?.gatewayVersion ? `v${systemStatus.gatewayVersion}` : "—", color: "var(--color-text-primary)" },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <span className="text-[10px] uppercase" style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
            <p className="text-sm font-mono font-bold mt-0.5" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions that DO things */}
      <div>
        <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--color-text-secondary)" }}>Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setConfirmRestart(true)}
            className="rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
            style={{ background: "#EF444410", border: "1px solid #EF444425", color: "#EF4444" }}
          >
            <span className="text-2xl">🔄</span>
            <span className="text-xs font-medium">Restart Gateway</span>
          </button>
          <button
            onClick={fetchFullStatus}
            className="rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          >
            <span className="text-2xl">📊</span>
            <span className="text-xs font-medium">Full Status</span>
          </button>
          <button
            onClick={clearCache}
            disabled={clearing}
            className="rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", opacity: clearing ? 0.5 : 1 }}
          >
            <span className="text-2xl">🗑️</span>
            <span className="text-xs font-medium">{clearing ? "Clearing..." : "Clear Cache"}</span>
          </button>
          <button
            onClick={fetchLogs}
            disabled={loadingLogs}
            className="rounded-xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", opacity: loadingLogs ? 0.5 : 1 }}
          >
            <span className="text-2xl">📋</span>
            <span className="text-xs font-medium">{loadingLogs ? "Loading..." : "View Logs"}</span>
          </button>
        </div>
      </div>

      {/* Full status expanded view */}
      {fullStatus && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: "var(--color-text-secondary)" }}>Detailed Status</h3>
          <div className="space-y-2">
            {fullStatus.memory && typeof fullStatus.memory === "object" ? (
              <StatusBar label="Memory" value={`${(fullStatus.memory as { usedMB: number }).usedMB}MB / ${(fullStatus.memory as { totalMB: number }).totalMB}MB`}
                percent={(fullStatus.memory as { percent: number }).percent} />
            ) : null}
            {typeof fullStatus.cpuPercent === "number" ? (
              <StatusBar label="CPU" value={`${(fullStatus.cpuPercent as number).toFixed(1)}%`} percent={fullStatus.cpuPercent as number} />
            ) : null}
            {fullStatus.disk && typeof fullStatus.disk === "object" ? (
              <StatusBar label="Disk" value={`${(fullStatus.disk as { used: string }).used} / ${(fullStatus.disk as { total: string }).total}`}
                percent={parseInt((fullStatus.disk as { percent: string }).percent) || 0} />
            ) : null}
            {fullStatus.loadAvg && typeof fullStatus.loadAvg === "object" ? (
              <div className="p-3 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <span className="text-[10px] uppercase" style={{ color: "var(--color-text-secondary)" }}>Load Average</span>
                <p className="text-xs font-mono mt-1" style={{ color: "var(--color-text-primary)" }}>
                  {(fullStatus.loadAvg as { "1m": number })["1m"]} / {(fullStatus.loadAvg as { "5m": number })["5m"]} / {(fullStatus.loadAvg as { "15m": number })["15m"]}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Cron Timeline */}
      {crons.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider px-1" style={{ color: "var(--color-text-secondary)" }}>Cron Jobs</h3>
          <div className="space-y-2">
            {crons.map((cron, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{cron.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--color-surface-elevated)", color: "var(--color-accent)" }}>
                    {cron.schedule}
                  </span>
                </div>
                <p className="text-[10px] font-mono mt-1 truncate" style={{ color: "var(--color-text-secondary)" }}>{cron.command}</p>
                {cron.nextRun && (
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                    Next: {cron.nextRun.startsWith("Every") ? cron.nextRun : new Date(cron.nextRun).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs view */}
      {logs && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>Gateway Logs</h3>
            <button onClick={copyLogs} className="text-[10px] font-medium" style={{ color: "var(--color-accent)" }}>Copy</button>
          </div>
          <pre className="text-[10px] font-mono p-3 rounded-xl overflow-x-auto max-h-60 overflow-y-auto"
            style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
            {logs}
          </pre>
        </div>
      )}

      <ConfirmModal
        open={confirmRestart}
        title="Restart Gateway"
        message="This will restart the OpenClaw gateway. Active sessions may be interrupted."
        confirmLabel={restarting ? "Restarting..." : "Restart"}
        confirmColor="#EF4444"
        onConfirm={handleRestart}
        onCancel={() => setConfirmRestart(false)}
      />
    </div>
  );
}

function StatusBar({ label, value, percent }: { label: string; value: string; percent: number }) {
  const color = percent > 80 ? "#EF4444" : percent > 60 ? "#EAB308" : "#22C55E";
  return (
    <div className="p-3 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <div className="flex justify-between mb-1.5">
        <span className="text-[10px] uppercase" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
        <span className="text-xs font-mono" style={{ color: "var(--color-text-primary)" }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface-elevated)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(percent, 100)}%`, background: color }} />
      </div>
    </div>
  );
}
