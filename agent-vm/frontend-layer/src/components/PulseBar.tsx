"use client";

import { useEffect, useState, useRef } from "react";
import type { ConnectionStatus, SystemStatus } from "@/lib/types";

interface PulseBarProps {
  connectionStatus: ConnectionStatus;
  agentCount: number;
}

const STATUS_COLORS: Record<string, string> = {
  connected: "#22C55E",
  connecting: "#EAB308",
  disconnected: "#EF4444",
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function parseUptimeToSeconds(uptime: string): number {
  // Parse "3d 2h" or "5h 30m" or "45m" into seconds
  let total = 0;
  const dMatch = uptime.match(/(\d+)d/);
  const hMatch = uptime.match(/(\d+)h/);
  const mMatch = uptime.match(/(\d+)m/);
  if (dMatch) total += parseInt(dMatch[1]) * 86400;
  if (hMatch) total += parseInt(hMatch[1]) * 3600;
  if (mMatch) total += parseInt(mMatch[1]) * 60;
  return total;
}

export default function PulseBar({ connectionStatus, agentCount }: PulseBarProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [liveAgentCount, setLiveAgentCount] = useState(0);
  const [localUptime, setLocalUptime] = useState(0);
  const lastPollUptime = useRef(0);
  const lastPollTime = useRef(0);

  // Poll system status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/system/status");
        if (res.ok) {
          const data = await res.json();
          setSystemStatus(data);
          if (data.uptime) {
            const secs = parseUptimeToSeconds(data.uptime);
            lastPollUptime.current = secs;
            lastPollTime.current = Date.now();
            setLocalUptime(secs);
          }
        }
      } catch {
        // silent
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Poll agent count
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/system/agents");
        if (res.ok) {
          const data = await res.json();
          setLiveAgentCount(data.count || 0);
        }
      } catch {
        // silent
      }
    }
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  // Tick uptime every 60 seconds client-side between polls
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastPollTime.current > 0) {
        const elapsed = Math.floor((Date.now() - lastPollTime.current) / 1000);
        setLocalUptime(lastPollUptime.current + elapsed);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const gatewayOk = systemStatus?.status === "ok";
  const gatewayColor = gatewayOk ? "#22C55E" : systemStatus?.status === "degraded" ? "#EAB308" : "#EF4444";
  const gatewayLabel = gatewayOk ? "Healthy" : systemStatus?.status === "degraded" ? "Degraded" : "Down";

  const wsColor = STATUS_COLORS[connectionStatus] || STATUS_COLORS.disconnected;
  const wsLabel = connectionStatus === "connected" ? "Live" : connectionStatus === "connecting" ? "..." : "Off";

  const displayAgentCount = liveAgentCount || agentCount;
  const usagePct = systemStatus?.usagePct ?? 0;
  const hasActiveAgents = displayAgentCount > 0;

  return (
    <div
      className="h-10 flex items-center px-2 md:px-4 gap-2 md:gap-6 border-b text-xs relative shrink-0"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      {/* Bottom glow effect */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "var(--color-accent)",
          boxShadow: "0 1px 8px var(--color-accent), 0 1px 3px var(--color-accent)",
          opacity: 0.4,
        }}
      />

      {/* Status dot — always visible, pulses when agents active */}
      <div className="flex items-center gap-1.5">
        <div
          className={hasActiveAgents ? "animate-pulse-glow" : ""}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: gatewayColor,
            boxShadow: `0 0 5px ${gatewayColor}`,
            color: gatewayColor,
          }}
        />
        {/* Full labels: hidden on mobile */}
        <span className="hidden md:inline" style={{ color: "var(--color-text-secondary)" }}>GW</span>
        <span className="hidden md:inline" style={{ color: "var(--color-text-secondary)" }}>{gatewayLabel}</span>
        <span className="hidden md:inline" style={{ color: "var(--color-border)", margin: "0 2px" }}>·</span>
        <span className="hidden md:inline" style={{ color: "var(--color-text-secondary)" }}>WS</span>
        <div
          className={`hidden md:block ${connectionStatus === "connecting" ? "animate-pulse-dot" : ""}`}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: wsColor,
            boxShadow: `0 0 5px ${wsColor}`,
          }}
        />
        <span className="hidden md:inline" style={{ color: "var(--color-text-secondary)" }}>{wsLabel}</span>
      </div>

      {/* Active agents — compact on mobile */}
      <div className="flex items-center gap-1">
        <span style={{ color: "var(--color-accent)" }} className="font-mono font-bold">{displayAgentCount}</span>
        <span className="hidden sm:inline" style={{ color: "var(--color-text-secondary)" }}>
          agent{displayAgentCount !== 1 ? "s" : ""}
        </span>
        <span className="sm:hidden text-[10px]" style={{ color: "var(--color-text-secondary)" }}>🤖</span>
      </div>

      {/* Usage indicator with shimmer */}
      <div className="flex items-center gap-1.5">
        <div className="w-12 md:w-16 h-1.5 rounded-full overflow-hidden shimmer-bar" style={{ background: "var(--color-border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(usagePct, 2)}%`,
              background: usagePct > 75 ? "#EF4444" : usagePct >= 50 ? "#EAB308" : "#22C55E",
            }}
          />
        </div>
        <span className="font-mono" style={{ color: "var(--color-text-secondary)" }}>{usagePct}%</span>
      </div>

      {/* Gateway version — desktop only */}
      {systemStatus?.gatewayVersion && (
        <div className="hidden lg:flex items-center gap-1.5">
          <span style={{ color: "var(--color-text-secondary)" }}>v{systemStatus.gatewayVersion}</span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Uptime — desktop only */}
      <div className="hidden md:flex items-center gap-1.5">
        <span style={{ color: "var(--color-text-secondary)" }}>uptime</span>
        <span className="font-mono" style={{ color: "var(--color-text-primary)" }}>
          {systemStatus?.uptime || formatUptime(localUptime)}
        </span>
      </div>

      {/* Brand with breathing animation */}
      <div className="flex items-center gap-1">
        <span className="animate-breathe font-semibold tracking-wide text-[10px] md:text-xs" style={{ color: "var(--color-accent)" }}>
          OPENCLAW
        </span>
        <span className="hidden md:inline" style={{ color: "var(--color-text-secondary)" }}>observer</span>
      </div>
    </div>
  );
}
