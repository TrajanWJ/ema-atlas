import { create } from "zustand";
import { AGENTS } from "@/lib/types";
import type { AgentEvent } from "@/lib/types";

export type AgentStatus = "working" | "thinking" | "idle";

export interface AgentState {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: AgentStatus;
  lastActivity?: string;
  taskCount: number;
}

interface AgentStore {
  agents: Record<string, AgentState>;
  updateFromEvent: (event: AgentEvent) => void;
  setAgentStatus: (agentId: string, status: AgentStatus, activity?: string) => void;
}

function buildInitialAgents(): Record<string, AgentState> {
  return Object.entries(AGENTS).reduce<Record<string, AgentState>>((acc, [id, info]) => {
    acc[id] = {
      id,
      name: info.name || id,
      emoji: info.emoji,
      color: info.color,
      status: "idle",
      taskCount: 0,
    };
    return acc;
  }, {});
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: buildInitialAgents(),

  updateFromEvent: (event: AgentEvent) => {
    set((s) => {
      const existing = s.agents[event.agentId];
      if (!existing) return s;
      const status: AgentStatus =
        event.status === "running" ? "working" : "idle";
      return {
        agents: {
          ...s.agents,
          [event.agentId]: {
            ...existing,
            status,
            lastActivity: event.task,
            taskCount: event.status === "done" ? existing.taskCount + 1 : existing.taskCount,
          },
        },
      };
    });
  },

  setAgentStatus: (agentId, status, activity) => {
    set((s) => {
      const existing = s.agents[agentId];
      if (!existing) return s;
      return {
        agents: {
          ...s.agents,
          [agentId]: { ...existing, status, lastActivity: activity ?? existing.lastActivity },
        },
      };
    });
  },
}));
