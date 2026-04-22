"use client";

import { Layout } from "@/components/layout/Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSessionStore } from "@/stores/session-store";
import { Bot, Circle, Hash, Zap, Plus, DollarSign } from "lucide-react";
import type { ProviderName } from "@claudeforge/shared";

interface AgentInfo {
  name: string;
  provider: ProviderName;
  emoji: string;
  color: string;
  description: string;
}

const AGENTS: AgentInfo[] = [
  {
    name: "Claude Code",
    provider: "claude",
    emoji: "🤖",
    color: "border-accent-warm",
    description: "Full-featured AI coding agent with file editing, terminal access, and MCP tools.",
  },
  {
    name: "Codex",
    provider: "codex",
    emoji: "💻",
    color: "border-success",
    description: "OpenAI's coding agent with configurable sandbox and approval policies.",
  },
];

export default function AgentsPage() {
  const { sessions } = useSessionStore();

  return (
    <Layout>
      <ErrorBoundary>
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bot size={20} strokeWidth={1.5} className="text-primary" />
            <h1 className="text-lg font-semibold">Agents</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map((agent) => {
              const agentSessions = sessions.filter(
                (s) => s.provider === agent.provider
              );
              const activeSessions = agentSessions.filter(
                (s) => s.status === "active"
              );

              return (
                <div
                  key={agent.provider}
                  className={`bg-surface border border-border border-t-2 ${agent.color} rounded-lg p-5 hover:border-primary/25 transition-colors`}
                >
                  <div className="text-center mb-4">
                    <span className="text-3xl">{agent.emoji}</span>
                    <h3 className="text-base font-semibold mt-2">
                      {agent.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-center gap-1 mb-3" role="status" aria-label={`${agent.name}: ${activeSessions.length > 0 ? `${activeSessions.length} active` : "idle"}`}>
                    <Circle
                      size={8}
                      aria-hidden="true"
                      className={`fill-current ${
                        activeSessions.length > 0
                          ? "text-success animate-pulse"
                          : "text-text-muted"
                      }`}
                    />
                    <span className="text-sm text-text-secondary">
                      {activeSessions.length > 0
                        ? `${activeSessions.length} ACTIVE`
                        : "IDLE"}
                    </span>
                  </div>

                  <p className="text-xs text-text-muted text-center mb-4">
                    {agent.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-xs text-text-muted border-t border-border pt-3">
                    <span className="flex items-center gap-1">
                      <Hash size={10} /> {agentSessions.length} sessions
                    </span>
                    <span className="flex items-center gap-1 justify-center">
                      <Zap size={10} />{" "}
                      {agentSessions.reduce((sum, s) => sum + s.messageCount, 0)} msgs
                    </span>
                    <span className="flex items-center gap-1 justify-end font-mono">
                      <DollarSign size={10} />
                      {agentSessions.reduce((sum, s) => sum + s.totalCost, 0).toFixed(4)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Add agent card */}
            <div className="bg-surface/50 border border-dashed border-border rounded-lg p-5 flex flex-col items-center justify-center text-text-muted hover:text-text-secondary hover:border-text-muted transition-colors cursor-pointer">
              <Plus size={24} strokeWidth={1} className="mb-2" />
              <span className="text-sm">Add Agent</span>
            </div>
          </div>
        </div>
      </div>
      </ErrorBoundary>
    </Layout>
  );
}
