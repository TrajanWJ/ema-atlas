"use client";

import { useEffect, useState } from "react";
import type { AgentEvent, LiveAgentInfo } from "@/lib/types";
import { AGENTS } from "@/lib/types";

interface AgentActivityProps {
  events: AgentEvent[];
}

function formatDuration(start: number, end?: number): string {
  const ms = (end || Date.now()) - start;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m}m ${rs}s`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  running: { bg: "#22C55E20", text: "#22C55E", label: "running" },
  done: { bg: "#E8A83820", text: "#E8A838", label: "done" },
  failed: { bg: "#EF444420", text: "#EF4444", label: "failed" },
};

export default function AgentActivity({ events }: AgentActivityProps) {
  const [liveAgents, setLiveAgents] = useState<LiveAgentInfo[]>([]);
  const [, setTick] = useState(0);

  // Poll agents from API every 5 seconds
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/system/agents");
        if (res.ok) {
          const data = await res.json();
          setLiveAgents(data.agents || []);
        }
      } catch {
        // silent
      }
    }
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tick for live duration updates
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 tab-content">
      {/* Agent Theatre — Card Grid */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-secondary)" }}>
          🎭 Agent Theatre
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {liveAgents.map((agent) => {
            const info = AGENTS[agent.id] || { emoji: agent.emoji || "🤖", name: agent.name || agent.id, color: agent.color || "#888" };
            const isActive = agent.status === "active";

            return (
              <div
                key={agent.id}
                className="glass-card rounded-lg overflow-hidden transition-all duration-200"
              >
                <div className="flex">
                  {/* Accent bar */}
                  <div
                    className="w-1 shrink-0"
                    style={{ background: info.color }}
                  />
                  <div className="flex-1 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{info.emoji}</span>
                      <span className="font-medium text-sm" style={{ color: info.color }}>
                        {info.name}
                      </span>
                      {isActive ? (
                        <div className="flex items-center gap-1 ml-auto">
                          <div
                            className="animate-pulse-glow"
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: "#22C55E",
                              color: "#22C55E",
                            }}
                          />
                          <span className="text-[10px]" style={{ color: "#22C55E" }}>active</span>
                        </div>
                      ) : (
                        <span className="text-[10px] ml-auto" style={{ color: "var(--color-text-secondary)" }}>idle</span>
                      )}
                    </div>
                    {agent.lastActivity && (
                      <p className="text-[11px] truncate" style={{ color: "var(--color-text-secondary)" }}>
                        {agent.lastActivity}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-mono" style={{ color: "var(--color-text-secondary)" }}>
                        {agent.sessionCount} session{agent.sessionCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {liveAgents.length === 0 && (
          <div className="flex items-center justify-center py-10">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-3">
                <div className="absolute inset-0 rounded-full animate-radar-ping" style={{ background: "var(--color-coder)", opacity: 0.2 }} />
                <div className="absolute inset-2 rounded-full animate-radar-ring" style={{ border: "1px solid var(--color-coder)" }} />
                <div className="absolute inset-0 flex items-center justify-center text-xl">🎭</div>
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Loading agent roster...</p>
            </div>
          </div>
        )}
      </div>

      {/* Events feed */}
      {events.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-secondary)" }}>
            Event Feed
          </h3>
          <div className="space-y-2">
            {[...events].reverse().slice(0, 20).map((event) => {
              const agent = AGENTS[event.agentId] || AGENTS.main;
              const badge = STATUS_BADGE[event.status] || STATUS_BADGE.running;
              return (
                <div
                  key={event.id}
                  className="animate-fade-in rounded-lg p-3 glass-card"
                  style={{ borderLeft: `3px solid ${agent.color}` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{agent.emoji}</span>
                    <span className="font-medium text-xs" style={{ color: agent.color }}>{agent.name}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-mono"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                    <span className="ml-auto text-[10px] font-mono" style={{ color: "var(--color-text-secondary)" }}>
                      {formatTime(event.startTime)}
                    </span>
                  </div>
                  {event.task && (
                    <p className="text-xs pl-6" style={{ color: "var(--color-text-secondary)" }}>{event.task}</p>
                  )}
                  {event.endTime && (
                    <p className="text-[10px] font-mono pl-6 mt-1" style={{ color: "var(--color-text-secondary)" }}>
                      Duration: {formatDuration(event.startTime, event.endTime)}
                    </p>
                  )}
                  {event.result && (
                    <p className="text-xs pl-6 mt-1 line-clamp-2" style={{ color: "var(--color-text-primary)" }}>
                      {event.result}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
