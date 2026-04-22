'use client';

import { create } from 'zustand';
import type { Tab } from '@contracts/tabs';

type ViewMode = 'terminal' | 'gui' | 'split';

interface WorkspaceState {
  tabs: Tab[];
  activeTabId: string | null;
  mode: ViewMode;
  nextTabNumber: number;

  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  renameTab: (tabId: string, title: string) => void;
  setMode: (mode: ViewMode) => void;
  setTabs: (tabs: Tab[]) => void;
  setActiveTabId: (id: string | null) => void;
  setNextTabNumber: (n: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  tabs: [],
  activeTabId: null,
  mode: 'split',
  nextTabNumber: 1,

  addTab: (tab) =>
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
      nextTabNumber: state.nextTabNumber + 1,
    })),

  removeTab: (tabId) =>
    set((state) => {
      const remaining = state.tabs.filter((t) => t.id !== tabId);
      const newActive =
        state.activeTabId === tabId
          ? remaining[remaining.length - 1]?.id ?? null
          : state.activeTabId;
      return { tabs: remaining, activeTabId: newActive };
    }),

  switchTab: (tabId) => set({ activeTabId: tabId }),

  renameTab: (tabId, title) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, title } : t
      ),
    })),

  setMode: (mode) => set({ mode }),

  setTabs: (tabs) => set({ tabs }),

  setActiveTabId: (id) => set({ activeTabId: id }),

  setNextTabNumber: (n) => set({ nextTabNumber: n }),
}));
