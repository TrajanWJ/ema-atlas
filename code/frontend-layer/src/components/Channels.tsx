"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage, ProjectTag } from "@/lib/types";
import { AGENTS } from "@/lib/types";
import { renderMarkdown } from "@/lib/markdown";
import { useWSStore } from "@/lib/stores/wsStore";
import { useGatewayStore } from "@/lib/stores/gatewayStore";
import { useChannelStore, PROJECT_CHANNELS, type SortMode, type ChannelSettings } from "@/lib/stores/channelStore";
import { toSessionKey, fromSessionKey } from "@/lib/sessionKey";

// ─── Agent channel definitions ──────────────────────────────────────────────

interface AgentChannel {
  id: string;
  label: string;
  emoji: string;
  agentId: string | null;
  color: string;
}

const AGENT_CHANNELS: AgentChannel[] = [
  { id: "general", label: "general", emoji: "\u{1F4AC}", agentId: null, color: "#E8A838" },
  { id: "right-hand", label: "Right Hand", emoji: "\u{1F91D}", agentId: "main", color: "#E8A838" },
  { id: "researcher", label: "Researcher", emoji: "\u{1F52C}", agentId: "researcher", color: "#2BA89E" },
  { id: "coder", label: "Coder", emoji: "\u{1F4BB}", agentId: "coder", color: "#57A773" },
  { id: "ops", label: "Ops", emoji: "\u{2699}\u{FE0F}", agentId: "ops", color: "#6C7A89" },
  { id: "security", label: "Security", emoji: "\u{1F6E1}\u{FE0F}", agentId: "security", color: "#E74C3C" },
  { id: "vault-keeper", label: "Vault Keeper", emoji: "\u{1F4DA}", agentId: "vault-keeper", color: "#9B59B6" },
  { id: "concierge", label: "Concierge", emoji: "\u{1F6CE}\u{FE0F}", agentId: "concierge", color: "#1ABC9C" },
  { id: "devils-advocate", label: "Devil's Advocate", emoji: "\u{1F608}", agentId: "devils-advocate", color: "#E91E63" },
];

const COLOR_SWATCHES = ["#E8A838", "#2BA89E", "#57A773", "#E74C3C", "#9B59B6", "#E91E63"];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function filterByAgent(messages: ChatMessage[], channel: AgentChannel): ChatMessage[] {
  if (!channel.agentId) return messages;
  return messages.filter(
    (m) => m.channel === channel.id || m.senderAgent === channel.agentId
  );
}

function filterByProject(messages: ChatMessage[], projectTag: ProjectTag): ChatMessage[] {
  return messages.filter((m) => m.projectTag === projectTag);
}

// ─── Roster avatar bubbles (sidebar) ────────────────────────────────────────

function RosterBubbles({ roster }: { roster: string[] }) {
  const maxShow = 3;
  const visible = roster.slice(0, maxShow);
  const overflow = roster.length - maxShow;

  return (
    <div className="flex items-center -space-x-1.5 ml-auto shrink-0">
      {visible.map((agentId) => {
        const agent = AGENTS[agentId];
        if (!agent) return null;
        return (
          <span
            key={agentId}
            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] border"
            style={{
              background: `${agent.color}33`,
              borderColor: `${agent.color}66`,
            }}
            title={agent.name}
          >
            {agent.emoji}
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-mono border"
          style={{
            background: "rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.15)",
            color: "var(--color-text-secondary)",
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ─── Daemon dot (pulsing green) ─────────────────────────────────────────────

function DaemonDot() {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{
        background: "#22C55E",
        boxShadow: "0 0 6px #22C55E88",
        animation: "pulse 2s ease-in-out infinite",
      }}
      title="Daemon mode active"
    />
  );
}

// ─── Roster bar (header) ────────────────────────────────────────────────────

function RosterBar({
  channelId,
  roster,
  daemonOn,
}: {
  channelId: string;
  roster: string[];
  daemonOn: boolean;
}) {
  const { addToRoster, removeFromRoster } = useChannelStore();
  const [showAdd, setShowAdd] = useState(false);

  const allAgentIds = Object.keys(AGENTS).filter((id) => id !== "user");
  const available = allAgentIds.filter((id) => !roster.includes(id));

  return (
    <div
      className="flex items-center gap-1.5 px-4 py-1.5 border-b text-[10px]"
      style={{ borderColor: "var(--color-border)", background: "rgba(0,0,0,0.08)" }}
    >
      <span style={{ color: "var(--color-text-secondary)" }}>Members:</span>
      {roster.map((agentId) => {
        const agent = AGENTS[agentId];
        if (!agent) return null;
        return (
          <span
            key={agentId}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full"
            style={{
              background: `${agent.color}18`,
              color: agent.color,
              border: `1px solid ${agent.color}33`,
            }}
          >
            <span className="text-[9px]">{agent.emoji}</span>
            <span>{agent.name}</span>
            <button
              onClick={() => removeFromRoster(channelId, agentId)}
              className="ml-0.5 opacity-50 hover:opacity-100 cursor-pointer"
              title={`Remove ${agent.name}`}
            >
              ×
            </button>
          </span>
        );
      })}
      <div className="relative ml-1">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-1.5 py-0.5 rounded-full cursor-pointer transition-colors"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "var(--color-text-secondary)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          + Add
        </button>
        {showAdd && available.length > 0 && (
          <div
            className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg z-50 min-w-[140px]"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            {available.map((id) => {
              const agent = AGENTS[id];
              if (!agent) return null;
              return (
                <button
                  key={id}
                  onClick={() => {
                    addToRoster(channelId, id);
                    setShowAdd(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1 text-[10px] cursor-pointer hover:bg-[rgba(255,255,255,0.05)] text-left"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <span>{agent.emoji}</span>
                  <span>{agent.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {daemonOn && (
        <span
          className="ml-auto text-[9px] italic"
          style={{ color: "#22C55E" }}
        >
          Agents are listening...
        </span>
      )}
    </div>
  );
}

// ─── Message bubble ─────────────────────────────────────────────────────────

function ChannelMessage({ msg }: { msg: ChatMessage }) {
  const agent = AGENTS[msg.senderAgent || ""] || AGENTS.main;

  return (
    <div className="flex gap-2 py-1.5 px-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm"
        style={{ background: `${agent.color}22`, border: `1px solid ${agent.color}44` }}
      >
        {agent.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold" style={{ color: agent.color }}>
            {agent.name}
          </span>
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {formatTime(msg.timestamp)}
          </span>
          {msg.projectTag && msg.projectTag !== "misc" && (
            <span
              className="text-[8px] px-1 py-0.5 rounded"
              style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)" }}
            >
              {msg.projectTag}
            </span>
          )}
        </div>
        <div
          className="text-xs mt-0.5 markdown-content"
          style={{ color: "var(--color-text-primary)" }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
        />
      </div>
    </div>
  );
}

// ─── Sort toggle ────────────────────────────────────────────────────────────

function SortToggle({ mode, onChange }: { mode: SortMode; onChange: (m: SortMode) => void }) {
  return (
    <div
      className="flex mx-2 my-2 rounded-lg overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {(["agents", "projects"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className="flex-1 px-2 py-1 text-[10px] font-medium cursor-pointer transition-all capitalize"
          style={{
            background: mode === m ? "rgba(255,255,255,0.1)" : "transparent",
            color: mode === m ? "var(--color-text-primary)" : "var(--color-text-secondary)",
          }}
        >
          {m === "agents" ? "Agents" : "Projects"}
        </button>
      ))}
    </div>
  );
}

// ─── Settings Panel ─────────────────────────────────────────────────────────

function SettingsPanel({
  channelId,
  channelLabel,
  settings,
  roster,
  onClose,
}: {
  channelId: string;
  channelLabel: string;
  settings: ChannelSettings;
  roster: string[];
  onClose: () => void;
}) {
  const {
    updateChannelSettings,
    resetChannelSettings,
    addToRoster,
    removeFromRoster,
  } = useChannelStore();
  const { sendMessage } = useWSStore();

  const allAgentIds = Object.keys(AGENTS).filter((id) => id !== "user");
  const available = allAgentIds.filter((id) => !roster.includes(id));
  const [showAddAgent, setShowAddAgent] = useState(false);

  return (
    <div
      className="flex-1 flex flex-col min-h-0 overflow-y-auto"
      style={{ background: "var(--color-surface)" }}
    >
      {/* Header */}
      <div
        className="shrink-0 px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          #{channelLabel} Settings
        </span>
        <button
          onClick={onClose}
          className="text-lg cursor-pointer hover:opacity-80"
          style={{ color: "var(--color-text-secondary)" }}
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* ── 1. Daemon Mode ── */}
        <section>
          <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            Daemon Mode
          </h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              onClick={() => updateChannelSettings(channelId, { daemonMode: !settings.daemonMode })}
              className="w-9 h-5 rounded-full relative transition-colors cursor-pointer"
              style={{
                background: settings.daemonMode ? "#22C55E" : "rgba(255,255,255,0.15)",
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{
                  left: settings.daemonMode ? "18px" : "2px",
                }}
              />
            </button>
            <span className="text-xs" style={{ color: "var(--color-text-primary)" }}>
              Agents respond autonomously
            </span>
          </label>

          <div className="mt-3 ml-1 space-y-1.5">
            <span className="text-[10px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Execution Mode
            </span>
            {(["sequential", "parallel"] as const).map((mode) => (
              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`exec-mode-${channelId}`}
                  checked={settings.executionMode === mode}
                  onChange={() => updateChannelSettings(channelId, { executionMode: mode })}
                  className="accent-current cursor-pointer"
                  style={{ accentColor: mode === "sequential" ? "#F59E0B" : "#14B8A6" }}
                />
                <span className="text-[11px]" style={{ color: "var(--color-text-primary)" }}>
                  {mode === "sequential" ? "Sequential" : "Parallel"}
                </span>
                <span className="text-[9px]" style={{ color: "var(--color-text-secondary)" }}>
                  {mode === "sequential"
                    ? "— Agents respond in order, each sees previous output"
                    : "— All agents respond simultaneously"}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* ── 2. Agent Roster ── */}
        <section>
          <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            Agent Roster
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {roster.map((agentId) => {
              const agent = AGENTS[agentId];
              if (!agent) return null;
              return (
                <span
                  key={agentId}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px]"
                  style={{
                    background: `${agent.color}18`,
                    color: agent.color,
                    border: `1px solid ${agent.color}33`,
                  }}
                >
                  {agent.emoji} {agent.name}
                  <button
                    onClick={() => removeFromRoster(channelId, agentId)}
                    className="ml-1 opacity-50 hover:opacity-100 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
          <div className="relative mt-2">
            <button
              onClick={() => setShowAddAgent(!showAddAgent)}
              className="px-2 py-1 rounded text-[10px] cursor-pointer transition-colors"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "var(--color-text-secondary)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              + Add Agent
            </button>
            {showAddAgent && available.length > 0 && (
              <div
                className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg z-50 min-w-[160px]"
                style={{
                  background: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {available.map((id) => {
                  const agent = AGENTS[id];
                  if (!agent) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        addToRoster(channelId, id);
                        setShowAddAgent(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] cursor-pointer hover:bg-[rgba(255,255,255,0.05)] text-left"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {agent.emoji} {agent.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── 3. Bridge to External Channels ── */}
        <section>
          <h3 className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Bridge to External Channels
          </h3>
          <p className="text-[9px] mb-3" style={{ color: "var(--color-text-secondary)" }}>
            Sync messages with external channels
          </p>

          {/* Discord */}
          <div className="mb-3">
            <span className="text-[10px] font-medium" style={{ color: "#5865F2" }}>
              Discord Channel
            </span>
            <div className="mt-1 space-y-1.5">
              <input
                type="text"
                placeholder="Channel ID"
                value={settings.discordChannelId ?? ""}
                onChange={(e) => updateChannelSettings(channelId, { discordChannelId: e.target.value || undefined })}
                className="w-full px-2 py-1 rounded text-[10px] outline-none"
                style={{
                  background: "var(--color-surface-elevated)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
              />
              <input
                type="text"
                placeholder="Channel Name (e.g. #research-feed)"
                value={settings.discordChannelName ?? ""}
                onChange={(e) => updateChannelSettings(channelId, { discordChannelName: e.target.value || undefined })}
                className="w-full px-2 py-1 rounded text-[10px] outline-none"
                style={{
                  background: "var(--color-surface-elevated)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
              />
              {settings.discordChannelId && (
                <button
                  onClick={() =>
                    sendMessage({
                      type: "channel_bridge_test",
                      provider: "discord",
                      channelId: settings.discordChannelId,
                      channel: channelId,
                    })
                  }
                  className="px-2 py-1 rounded text-[9px] cursor-pointer transition-colors"
                  style={{
                    background: "#5865F222",
                    color: "#5865F2",
                    border: "1px solid #5865F244",
                  }}
                >
                  Test Connection
                </button>
              )}
            </div>
          </div>

          {/* Telegram */}
          <div>
            <span className="text-[10px] font-medium" style={{ color: "#229ED9" }}>
              Telegram Chat
            </span>
            <div className="mt-1 space-y-1.5">
              <input
                type="text"
                placeholder="Chat ID"
                value={settings.telegramChatId ?? ""}
                onChange={(e) => updateChannelSettings(channelId, { telegramChatId: e.target.value || undefined })}
                className="w-full px-2 py-1 rounded text-[10px] outline-none"
                style={{
                  background: "var(--color-surface-elevated)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
              />
              <input
                type="text"
                placeholder="Chat Name"
                value={settings.telegramChatName ?? ""}
                onChange={(e) => updateChannelSettings(channelId, { telegramChatName: e.target.value || undefined })}
                className="w-full px-2 py-1 rounded text-[10px] outline-none"
                style={{
                  background: "var(--color-surface-elevated)",
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
              />
              {settings.telegramChatId && (
                <button
                  onClick={() =>
                    sendMessage({
                      type: "channel_bridge_test",
                      provider: "telegram",
                      channelId: settings.telegramChatId,
                      channel: channelId,
                    })
                  }
                  className="px-2 py-1 rounded text-[9px] cursor-pointer transition-colors"
                  style={{
                    background: "#229ED922",
                    color: "#229ED9",
                    border: "1px solid #229ED944",
                  }}
                >
                  Test Connection
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── 4. Channel Identity ── */}
        <section>
          <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            Channel Identity
          </h3>
          <input
            type="text"
            placeholder="Custom display name"
            value={settings.customName ?? ""}
            onChange={(e) => updateChannelSettings(channelId, { customName: e.target.value || undefined })}
            className="w-full px-2 py-1 rounded text-[10px] outline-none mb-2"
            style={{
              background: "var(--color-surface-elevated)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
          />
          <div className="flex gap-2">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                onClick={() => updateChannelSettings(channelId, { customColor: c })}
                className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110"
                style={{
                  background: c,
                  border: settings.customColor === c ? "2px solid white" : "2px solid transparent",
                  boxShadow: settings.customColor === c ? `0 0 8px ${c}66` : "none",
                }}
              />
            ))}
            {settings.customColor && (
              <button
                onClick={() => updateChannelSettings(channelId, { customColor: undefined })}
                className="text-[9px] px-2 py-0.5 rounded cursor-pointer"
                style={{ color: "var(--color-text-secondary)", background: "rgba(255,255,255,0.06)" }}
              >
                Reset
              </button>
            )}
          </div>
        </section>

        {/* ── 5. Danger Zone ── */}
        <section>
          <h3 className="text-xs font-semibold mb-2" style={{ color: "#E74C3C" }}>
            Danger Zone
          </h3>
          <button
            onClick={() => {
              resetChannelSettings(channelId);
              onClose();
            }}
            className="px-3 py-1.5 rounded text-[10px] cursor-pointer transition-colors"
            style={{
              background: "rgba(231,76,60,0.12)",
              color: "#E74C3C",
              border: "1px solid rgba(231,76,60,0.3)",
            }}
          >
            Reset to defaults
          </button>
        </section>
      </div>
    </div>
  );
}

// ─── Main Channels component ────────────────────────────────────────────────

export default function Channels() {
  const { status, messages, sendMessage } = useWSStore();
  const gateway = useGatewayStore();
  const { sortMode, setSortMode, mode, setMode, getRoster, getChannelSettings } = useChannelStore();
  const [activeChannel, setActiveChannel] = useState("general");
  const [inputValue, setInputValue] = useState("");
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [streamingMessages, setStreamingMessages] = useState<Record<string, string>>({});
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastMsgCountRef = useRef(0);

  const isConnected = mode === "openclaw" ? gateway.connected : status === "connected";
  const settings = getChannelSettings(activeChannel);
  const roster = getRoster(activeChannel);

  // ── Gateway event listener for chat events ──
  useEffect(() => {
    if (!gateway.connected) return;
    const unsub = gateway.on("chat", (payload: unknown) => {
      const p = payload as {
        sessionKey?: string;
        delta?: string;
        content?: string;
        done?: boolean;
        sender?: string;
        runId?: string;
      };
      if (!p.sessionKey) return;
      const info = fromSessionKey(p.sessionKey);
      if (!info) return;

      if (p.done && p.content) {
        // Final message — add to local messages and clear streaming
        const msg: ChatMessage = {
          id: `gw-${Date.now()}-${p.runId || ""}`,
          sender: p.sender || info.agentId,
          senderAgent: info.agentId,
          content: p.content,
          timestamp: Date.now(),
          channel: info.channelId,
        };
        setLocalMessages((prev) => [...prev.slice(-500), msg]);
        setStreamingMessages((prev) => {
          const next = { ...prev };
          delete next[info.channelId];
          return next;
        });
      } else if (p.delta) {
        // Streaming delta — accumulate
        setStreamingMessages((prev) => ({
          ...prev,
          [info.channelId]: (prev[info.channelId] || "") + p.delta,
        }));
      }
    });
    return unsub;
  }, [gateway.connected, gateway]);

  // Helper to add optimistic user message
  const addLocalMessage = useCallback((partial: Omit<ChatMessage, "id" | "timestamp">) => {
    const msg: ChatMessage = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      ...partial,
    };
    setLocalMessages((prev) => [...prev.slice(-500), msg]);
  }, []);

  // ── Daemon dispatch ──
  useEffect(() => {
    const currentCount = messages.length;
    if (currentCount <= lastMsgCountRef.current) {
      lastMsgCountRef.current = currentCount;
      return;
    }
    lastMsgCountRef.current = currentCount;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    // Only trigger for messages in the active channel (or untagged in general)
    const msgChannel = lastMsg.channel || "general";

    // Look up settings for the message's channel
    const chSettings = getChannelSettings(msgChannel);
    if (!chSettings.daemonMode) return;

    // Don't trigger on agent messages (avoid loops)
    if (lastMsg.senderAgent && lastMsg.senderAgent !== "user") return;

    const chRoster = getRoster(msgChannel);
    if (chRoster.length === 0) return;

    if (chSettings.executionMode === "parallel") {
      for (const agentId of chRoster) {
        sendMessage({
          type: "agent_trigger",
          channel: msgChannel,
          triggerAgent: agentId,
          sourceMessage: lastMsg.content,
          mode: "parallel",
        });
      }
    } else {
      sendMessage({
        type: "agent_trigger",
        channel: msgChannel,
        roster: chRoster,
        sourceMessage: lastMsg.content,
        mode: "sequential",
      });
    }
  }, [messages.length, messages, getChannelSettings, getRoster, sendMessage]);

  // When switching modes, reset to first channel
  const handleModeChange = useCallback(
    (mode: SortMode) => {
      setSortMode(mode);
      setActiveChannel(mode === "agents" ? "general" : "frontend");
      setSettingsPanelOpen(false);
    },
    [setSortMode]
  );

  // Resolve active channel info
  const agentChannel = AGENT_CHANNELS.find((c) => c.id === activeChannel);
  const projectChannel = PROJECT_CHANNELS.find((c) => c.id === activeChannel);

  const channelLabel =
    settings.customName ??
    (sortMode === "agents"
      ? agentChannel?.label ?? "general"
      : projectChannel?.label ?? "Frontend");
  const channelEmoji =
    sortMode === "agents"
      ? agentChannel?.emoji ?? "\u{1F4AC}"
      : projectChannel?.emoji ?? "\u{1F4C1}";
  const channelColor =
    settings.customColor ??
    (sortMode === "agents"
      ? agentChannel?.color ?? "#E8A838"
      : projectChannel?.color ?? "#E8A838");

  // Merge WS messages + local gateway messages, then filter
  const allMessages = [...messages, ...localMessages];
  const filtered =
    sortMode === "agents"
      ? filterByAgent(allMessages, agentChannel ?? AGENT_CHANNELS[0])
      : filterByProject(allMessages, (projectChannel?.id ?? "frontend") as ProjectTag);

  // Current channel streaming text
  const streamingText = streamingMessages[activeChannel];

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filtered.length, streamingText]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || !isConnected) return;

    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (mode === "openclaw" && gateway.connected) {
      const agentId = agentChannel?.agentId || "main";
      const sessionKey = toSessionKey(agentId, activeChannel);
      const idempotencyKey = crypto.randomUUID();

      // Add user message optimistically
      addLocalMessage({ sender: "You", content: text, senderAgent: "user", channel: activeChannel });

      try {
        await gateway.chatSend({
          sessionKey,
          message: text,
          agentId,
          idempotencyKey,
        });
      } catch (e) {
        console.error("[gateway] chatSend failed:", e);
        addLocalMessage({
          sender: "system",
          senderAgent: "main",
          content: `Failed to send: ${e instanceof Error ? e.message : "Unknown error"}`,
          channel: activeChannel,
        });
      }
    } else {
      // Fallback: existing WS send to all agents in roster
      const targets = roster.length > 0 ? roster : [agentChannel?.agentId || "main"];
      for (const target of targets) {
        sendMessage({
          type: "message",
          content: text,
          target,
          channel: activeChannel,
        });
      }
    }
  }, [inputValue, isConnected, roster, agentChannel, activeChannel, sendMessage, mode, gateway, addLocalMessage]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  return (
    <div className="flex-1 flex min-h-0 tab-content">
      {/* ── Pulse animation ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* ── Channel sidebar ── */}
      <div
        className="w-48 shrink-0 flex flex-col border-r overflow-y-auto"
        style={{
          borderColor: "var(--color-border)",
          background: "rgba(0,0,0,0.15)",
        }}
      >
        <SortToggle mode={sortMode} onChange={handleModeChange} />

        <div
          className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {sortMode === "agents" ? "Channels" : "Projects"}
        </div>

        {sortMode === "agents"
          ? AGENT_CHANNELS.map((ch) => {
              const isActive = ch.id === activeChannel;
              const count = ch.agentId
                ? messages.filter((m) => m.senderAgent === ch.agentId).length
                : messages.length;
              const chRoster = getRoster(ch.id);
              const chSettings = getChannelSettings(ch.id);

              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannel(ch.id);
                    setSettingsPanelOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer transition-all text-left"
                  style={{
                    background: isActive ? `${ch.color}15` : "transparent",
                    color: isActive ? ch.color : "var(--color-text-secondary)",
                    borderLeft: isActive ? `2px solid ${ch.color}` : "2px solid transparent",
                  }}
                >
                  {chSettings.daemonMode && <DaemonDot />}
                  <span className="text-sm shrink-0">{ch.emoji}</span>
                  <span className="truncate flex-1 min-w-0">#{ch.label}</span>
                  {chSettings.discordChannelId && (
                    <span className="text-[8px] shrink-0" title="Discord bridge">D</span>
                  )}
                  {chSettings.telegramChatId && (
                    <span className="text-[8px] shrink-0" title="Telegram bridge">T</span>
                  )}
                  <RosterBubbles roster={chRoster} />
                  {count > 0 && (
                    <span
                      className="text-[9px] px-1 py-0.5 rounded-full font-mono shrink-0"
                      style={{
                        background: isActive ? `${ch.color}22` : "rgba(255,255,255,0.06)",
                        color: isActive ? ch.color : "var(--color-text-secondary)",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })
          : PROJECT_CHANNELS.map((ch) => {
              const isActive = ch.id === activeChannel;
              const count = messages.filter((m) => m.projectTag === ch.id).length;
              const chRoster = getRoster(ch.id);
              const chSettings = getChannelSettings(ch.id);

              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannel(ch.id);
                    setSettingsPanelOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer transition-all text-left"
                  style={{
                    background: isActive ? `${ch.color}15` : "transparent",
                    color: isActive ? ch.color : "var(--color-text-secondary)",
                    borderLeft: isActive ? `2px solid ${ch.color}` : "2px solid transparent",
                  }}
                >
                  {chSettings.daemonMode && <DaemonDot />}
                  <span className="text-sm shrink-0">{ch.emoji}</span>
                  <span className="truncate flex-1 min-w-0">{ch.label}</span>
                  {chSettings.discordChannelId && (
                    <span className="text-[8px] shrink-0" title="Discord bridge">D</span>
                  )}
                  {chSettings.telegramChatId && (
                    <span className="text-[8px] shrink-0" title="Telegram bridge">T</span>
                  )}
                  <RosterBubbles roster={chRoster} />
                  {count > 0 && (
                    <span
                      className="text-[9px] px-1 py-0.5 rounded-full font-mono shrink-0"
                      style={{
                        background: isActive ? `${ch.color}22` : "rgba(255,255,255,0.06)",
                        color: isActive ? ch.color : "var(--color-text-secondary)",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
      </div>

      {/* ── Message area / Settings panel ── */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Channel header */}
        <div
          className="shrink-0 px-4 py-2 flex items-center gap-2 border-b"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        >
          <span className="text-base">{channelEmoji}</span>
          <span className="text-sm font-semibold" style={{ color: channelColor }}>
            {sortMode === "agents" ? `#${channelLabel}` : channelLabel}
          </span>

          {/* Daemon badge */}
          {settings.daemonMode && (
            <span
              className="text-[9px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: settings.executionMode === "sequential"
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(20,184,166,0.15)",
                color: settings.executionMode === "sequential" ? "#F59E0B" : "#14B8A6",
                border: `1px solid ${
                  settings.executionMode === "sequential"
                    ? "rgba(245,158,11,0.3)"
                    : "rgba(20,184,166,0.3)"
                }`,
              }}
            >
              DAEMON ON — {settings.executionMode === "sequential" ? "Sequential" : "Parallel"}
            </span>
          )}

          {sortMode === "agents" && agentChannel?.agentId && !settings.daemonMode && (
            <span
              className="text-[10px] ml-2 px-2 py-0.5 rounded-full"
              style={{
                background: `${channelColor}15`,
                color: channelColor,
                border: `1px solid ${channelColor}33`,
              }}
            >
              Direct channel
            </span>
          )}
          {sortMode === "projects" && !settings.daemonMode && (
            <span
              className="text-[10px] ml-2 px-2 py-0.5 rounded-full"
              style={{
                background: `${channelColor}15`,
                color: channelColor,
                border: `1px solid ${channelColor}33`,
              }}
            >
              Project
            </span>
          )}

          {/* Transport mode badge */}
          <button
            onClick={() => setMode(mode === "openclaw" ? "agent-cli" : "openclaw")}
            className="text-[9px] px-2 py-0.5 rounded-full font-medium cursor-pointer transition-colors"
            style={{
              background: mode === "openclaw" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
              color: mode === "openclaw" ? "#22C55E" : "var(--color-text-secondary)",
              border: `1px solid ${mode === "openclaw" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
            }}
            title={`Transport: ${mode}. Click to toggle.`}
          >
            {mode === "openclaw" ? "\u26A1 OpenClaw" : "\u2699\uFE0F CLI"}
          </button>

          <div className="ml-auto flex items-center gap-2">
            {!isConnected && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: "rgba(231,76,60,0.15)", color: "#E74C3C" }}
              >
                Disconnected
              </span>
            )}
            <button
              onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
              className="text-sm cursor-pointer hover:opacity-80 transition-opacity px-1"
              style={{ color: settingsPanelOpen ? channelColor : "var(--color-text-secondary)" }}
              title="Channel settings"
            >
              {"\u{2699}\u{FE0F}"}
            </button>
          </div>
        </div>

        {settingsPanelOpen ? (
          <SettingsPanel
            channelId={activeChannel}
            channelLabel={channelLabel}
            settings={settings}
            roster={roster}
            onClose={() => setSettingsPanelOpen(false)}
          />
        ) : (
          <>
            {/* Roster bar */}
            <RosterBar channelId={activeChannel} roster={roster} daemonOn={settings.daemonMode} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div
                  className="flex items-center justify-center h-full text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  No messages in {sortMode === "agents" ? `#${channelLabel}` : channelLabel}
                </div>
              ) : (
                <div className="py-2">
                  {filtered.map((msg) => (
                    <ChannelMessage key={msg.id} msg={msg} />
                  ))}
                  {streamingText && (
                    <div className="flex gap-2 py-1.5 px-3">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm animate-pulse"
                        style={{ background: `${channelColor}22`, border: `1px solid ${channelColor}44` }}
                      >
                        {channelEmoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold" style={{ color: channelColor }}>
                            {agentChannel?.agentId || "agent"}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full italic"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            typing...
                          </span>
                        </div>
                        <div
                          className="text-xs mt-0.5 markdown-content"
                          style={{ color: "var(--color-text-primary)", opacity: 0.8 }}
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingText) }}
                        />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div
              className="shrink-0 px-4 py-3 border-t"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            >
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isConnected
                      ? `Message ${sortMode === "agents" ? `#${channelLabel}` : channelLabel}... (shift+enter for newline)`
                      : "Not connected..."
                  }
                  rows={1}
                  disabled={!isConnected}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none transition-colors"
                  style={{
                    background: "var(--color-surface-elevated)",
                    color: "var(--color-text-primary)",
                    border: isConnected
                      ? `1px solid ${channelColor}44`
                      : "1px solid var(--color-border)",
                    minHeight: "36px",
                    maxHeight: "120px",
                    lineHeight: "1.5",
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!isConnected || !inputValue.trim()}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer shrink-0"
                  style={{
                    background:
                      isConnected && inputValue.trim()
                        ? channelColor
                        : "var(--color-surface-elevated)",
                    color:
                      isConnected && inputValue.trim()
                        ? "#0A0A0A"
                        : "var(--color-text-secondary)",
                    opacity: isConnected && inputValue.trim() ? 1 : 0.5,
                    boxShadow:
                      isConnected && inputValue.trim()
                        ? `0 0 12px ${channelColor}44`
                        : "none",
                  }}
                >
                  Send {"\u{21B5}"}
                </button>
              </div>
              {roster.length > 1 && isConnected && (
                <div
                  className="text-[9px] mt-1 pl-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Dispatching to {roster.length} agents
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
