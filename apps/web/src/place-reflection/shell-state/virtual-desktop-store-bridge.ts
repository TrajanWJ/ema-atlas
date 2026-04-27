/**
 * Bridge — zustand virtual-desktop-store façade. Local-only workspace-plane
 * state; per user decision window grouping never becomes canon.
 */

import { create } from "zustand";
import { createId } from "../lib/id";
import { userKey } from "../lib/user-storage";

interface VirtualDesktop {
  readonly id: string;
  readonly name: string;
  readonly windowIds: string[];
}

interface VirtualDesktopState {
  readonly desktops: VirtualDesktop[];
  readonly activeDesktopId: string;
  readonly transitioning: boolean;
  readonly transitionDirection: "left" | "right" | null;
}

interface VirtualDesktopActions {
  switchTo(id: string): void;
  switchLeft(): void;
  switchRight(): void;
  addDesktop(): void;
  removeDesktop(id: string): void;
  renameDesktop(id: string, name: string): void;
  moveWindowToDesktop(windowId: string, desktopId: string): void;
  addWindowToActive(windowId: string): void;
  removeWindow(windowId: string): void;
  rehydrate(): void;
}

type VirtualDesktopStore = VirtualDesktopState & VirtualDesktopActions;

const STORAGE_KEY = "virtual-desktops-v1";

interface PersistShape {
  desktops: VirtualDesktop[];
  activeDesktopId: string;
}

function persist(state: VirtualDesktopState): void {
  try {
    const payload: PersistShape = {
      desktops: state.desktops,
      activeDesktopId: state.activeDesktopId,
    };
    localStorage.setItem(userKey(STORAGE_KEY), JSON.stringify(payload));
  } catch {
    // silent drop
  }
}

function hydrateInitial(): VirtualDesktopState {
  const defaults: VirtualDesktopState = {
    desktops: [
      { id: "desktop-1", name: "Desktop 1", windowIds: [] },
      { id: "desktop-2", name: "Desktop 2", windowIds: [] },
    ],
    activeDesktopId: "desktop-1",
    transitioning: false,
    transitionDirection: null,
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(userKey(STORAGE_KEY));
    if (!raw) return defaults;
    const data = JSON.parse(raw) as PersistShape;
    if (!Array.isArray(data.desktops) || data.desktops.length === 0) return defaults;
    return {
      desktops: data.desktops,
      activeDesktopId: data.activeDesktopId || data.desktops[0]?.id || defaults.activeDesktopId,
      transitioning: false,
      transitionDirection: null,
    };
  } catch {
    return defaults;
  }
}

const TRANSITION_DURATION_MS = 300;

function beginTransition(
  set: (partial: Partial<VirtualDesktopState>) => void,
  direction: "left" | "right",
  targetId: string,
): void {
  set({ transitioning: true, transitionDirection: direction });
  setTimeout(() => {
    set({ activeDesktopId: targetId, transitioning: false, transitionDirection: null });
  }, TRANSITION_DURATION_MS);
}

const initialState = hydrateInitial();

export const useVirtualDesktopStore = create<VirtualDesktopStore>((set, get) => ({
  ...initialState,

  switchTo(id) {
    const { activeDesktopId, desktops, transitioning } = get();
    if (id === activeDesktopId || transitioning) return;
    const currentIdx = desktops.findIndex((d) => d.id === activeDesktopId);
    const targetIdx = desktops.findIndex((d) => d.id === id);
    if (targetIdx === -1) return;
    const direction: "left" | "right" = targetIdx > currentIdx ? "right" : "left";
    beginTransition(set, direction, id);
  },

  switchLeft() {
    const { desktops, activeDesktopId, transitioning } = get();
    if (transitioning) return;
    const idx = desktops.findIndex((d) => d.id === activeDesktopId);
    if (idx <= 0) return;
    const target = desktops[idx - 1];
    if (!target) return;
    beginTransition(set, "left", target.id);
  },

  switchRight() {
    const { desktops, activeDesktopId, transitioning } = get();
    if (transitioning) return;
    const idx = desktops.findIndex((d) => d.id === activeDesktopId);
    if (idx >= desktops.length - 1) return;
    const target = desktops[idx + 1];
    if (!target) return;
    beginTransition(set, "right", target.id);
  },

  addDesktop() {
    const { desktops } = get();
    if (desktops.length >= 8) return;
    const next: VirtualDesktop = {
      id: createId(),
      name: `Desktop ${desktops.length + 1}`,
      windowIds: [],
    };
    set({ desktops: [...desktops, next] });
  },

  removeDesktop(id) {
    const { desktops, activeDesktopId } = get();
    if (desktops.length <= 1) return;
    const removing = desktops.find((d) => d.id === id);
    if (!removing) return;
    const remaining = desktops.filter((d) => d.id !== id);
    const first = remaining[0];
    if (!first) return;
    if (removing.windowIds.length > 0) {
      remaining[0] = {
        ...first,
        windowIds: [...first.windowIds, ...removing.windowIds],
      };
    }
    const newActive = activeDesktopId === id ? first.id : activeDesktopId;
    set({ desktops: remaining, activeDesktopId: newActive });
  },

  renameDesktop(id, name) {
    const { desktops } = get();
    set({ desktops: desktops.map((d) => (d.id === id ? { ...d, name } : d)) });
  },

  moveWindowToDesktop(windowId, desktopId) {
    const { desktops } = get();
    set({
      desktops: desktops.map((d) => {
        const without = d.windowIds.filter((wid) => wid !== windowId);
        if (d.id === desktopId) {
          return { ...d, windowIds: [...without, windowId] };
        }
        return { ...d, windowIds: without };
      }),
    });
  },

  addWindowToActive(windowId) {
    const { desktops, activeDesktopId } = get();
    set({
      desktops: desktops.map((d) =>
        d.id === activeDesktopId ? { ...d, windowIds: [...d.windowIds, windowId] } : d,
      ),
    });
  },

  removeWindow(windowId) {
    const { desktops } = get();
    set({
      desktops: desktops.map((d) => ({
        ...d,
        windowIds: d.windowIds.filter((wid) => wid !== windowId),
      })),
    });
  },

  rehydrate() {
    const state = hydrateInitial();
    set({ desktops: state.desktops, activeDesktopId: state.activeDesktopId });
  },
}));

useVirtualDesktopStore.subscribe((state, prev) => {
  if (state.desktops !== prev.desktops || state.activeDesktopId !== prev.activeDesktopId) {
    persist(state);
  }
});
