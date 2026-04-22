import { create } from "zustand";

export type AppTab = "executive" | "bridge" | "channels" | "activity" | "vault";

// Agent route targets for the Bridge quick-route bar
export type RouteTarget =
  | "concierge"
  | "researcher"
  | "coder"
  | "vault-keeper"
  | "devils-advocate"
  | "main";

interface UIStore {
  activeTab: AppTab;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  shortcutsOpen: boolean;
  // Bridge-specific
  routeTarget: RouteTarget;
  // Actions
  setActiveTab: (tab: AppTab) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setRouteTarget: (target: RouteTarget) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: "executive",
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  shortcutsOpen: false,
  routeTarget: "concierge",

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  setRouteTarget: (target) => set({ routeTarget: target }),
}));
