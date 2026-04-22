"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProjectTag } from "@/lib/types";

export type SortMode = "agents" | "projects";

export interface ProjectChannel {
  id: ProjectTag;
  label: string;
  emoji: string;
  color: string;
  tags: string[];
}

export const PROJECT_CHANNELS: ProjectChannel[] = [
  { id: "frontend", label: "Frontend", emoji: "📁", color: "#E8A838", tags: ["frontend", "ui", "ema", "place"] },
  { id: "research", label: "Research", emoji: "🔬", color: "#2BA89E", tags: ["research", "vault", "knowledge"] },
  { id: "ops", label: "Ops", emoji: "⚙️", color: "#6C7A89", tags: ["ops", "infra", "deploy", "system"] },
  { id: "strategy", label: "Strategy", emoji: "🧠", color: "#9B59B6", tags: ["strategy", "planning", "goals"] },
  { id: "code", label: "Code", emoji: "💻", color: "#57A773", tags: ["code", "build", "coder", "debug"] },
  { id: "misc", label: "Misc", emoji: "📦", color: "#95A5A6", tags: [] },
];

export interface ChannelConfig {
  roster: string[]; // agent IDs
}

export interface ChannelSettings {
  daemonMode: boolean;
  executionMode: 'sequential' | 'parallel';
  discordChannelId?: string;
  discordChannelName?: string;
  telegramChatId?: string;
  telegramChatName?: string;
  customName?: string;
  customColor?: string;
}

const DEFAULT_CHANNEL_SETTINGS: ChannelSettings = {
  daemonMode: false,
  executionMode: 'parallel',
};

const DEFAULT_AGENT_ROSTERS: Record<string, string[]> = {
  general: ["main", "researcher", "coder", "ops", "security", "vault-keeper", "concierge", "devils-advocate"],
  "right-hand": ["main"],
  researcher: ["researcher"],
  coder: ["coder"],
  ops: ["ops"],
  security: ["security"],
  "vault-keeper": ["vault-keeper"],
  concierge: ["concierge"],
  "devils-advocate": ["devils-advocate"],
};

const DEFAULT_PROJECT_ROSTERS: Record<ProjectTag, string[]> = {
  frontend: ["coder", "main"],
  research: ["researcher", "vault-keeper"],
  ops: ["ops", "main"],
  strategy: ["main", "devils-advocate"],
  code: ["coder"],
  misc: ["main"],
};

export type TransportMode = "openclaw" | "agent-cli";

interface ChannelStore {
  sortMode: SortMode;
  mode: TransportMode;
  agentRosters: Record<string, string[]>;
  projectRosters: Record<string, string[]>;
  channelSettings: Record<string, ChannelSettings>;
  setSortMode: (mode: SortMode) => void;
  setMode: (mode: TransportMode) => void;
  getRoster: (channelId: string) => string[];
  addToRoster: (channelId: string, agentId: string) => void;
  removeFromRoster: (channelId: string, agentId: string) => void;
  getChannelSettings: (channelId: string) => ChannelSettings;
  updateChannelSettings: (channelId: string, partial: Partial<ChannelSettings>) => void;
  resetChannelSettings: (channelId: string) => void;
}

export const useChannelStore = create<ChannelStore>()(
  persist(
    (set, get) => ({
      sortMode: "agents",
      mode: "openclaw",
      agentRosters: { ...DEFAULT_AGENT_ROSTERS },
      projectRosters: { ...DEFAULT_PROJECT_ROSTERS },
      channelSettings: {},

      setSortMode: (mode) => set({ sortMode: mode }),
      setMode: (mode) => set({ mode }),

      getRoster: (channelId) => {
        const { sortMode, agentRosters, projectRosters } = get();
        const rosters = sortMode === "agents" ? agentRosters : projectRosters;
        return rosters[channelId] ?? [];
      },

      addToRoster: (channelId, agentId) =>
        set((s) => {
          const key = s.sortMode === "agents" ? "agentRosters" : "projectRosters";
          const rosters = s[key];
          const current = rosters[channelId] ?? [];
          if (current.includes(agentId)) return s;
          return { [key]: { ...rosters, [channelId]: [...current, agentId] } };
        }),

      removeFromRoster: (channelId, agentId) =>
        set((s) => {
          const key = s.sortMode === "agents" ? "agentRosters" : "projectRosters";
          const rosters = s[key];
          const current = rosters[channelId] ?? [];
          return { [key]: { ...rosters, [channelId]: current.filter((id) => id !== agentId) } };
        }),

      getChannelSettings: (channelId) => {
        const { channelSettings } = get();
        return channelSettings[channelId] ?? { ...DEFAULT_CHANNEL_SETTINGS };
      },

      updateChannelSettings: (channelId, partial) =>
        set((s) => {
          const current = s.channelSettings[channelId] ?? { ...DEFAULT_CHANNEL_SETTINGS };
          return {
            channelSettings: {
              ...s.channelSettings,
              [channelId]: { ...current, ...partial },
            },
          };
        }),

      resetChannelSettings: (channelId) =>
        set((s) => {
          const next = { ...s.channelSettings };
          delete next[channelId];
          return { channelSettings: next };
        }),
    }),
    {
      name: "channel-store",
      partialize: (state) => ({
        sortMode: state.sortMode,
        mode: state.mode,
        agentRosters: state.agentRosters,
        projectRosters: state.projectRosters,
        channelSettings: state.channelSettings,
      }),
    }
  )
);
