/**
 * Bridge — zustand window-store façade.
 *
 * Matches donor `@/src/stores/window-store` API byte-for-byte so donor
 * components (Dock, Window, WindowManager) mount without edits. Internally
 * backed by the workspace-plane layout artifact (localStorage, key prefix
 * `ema:workspace:desktop:layout:<project_id>`).
 *
 * Per user decision 2026-04-24, window geometry stays workspace-plane
 * forever — this bridge never talks to the daemon.
 */

import { create } from "zustand";
import { createId } from "../lib/id";
import { DEFAULT_WINDOW_SIZES } from "../lib/constants";
import { userKey } from "../lib/user-storage";
import type { AppId, ProcessWindow, WindowPosition } from "../types/window";

const STORAGE_KEY = "desktop-windows-v5";

interface PersistShape {
  readonly windows: ReadonlyArray<ProcessWindow>;
  readonly zCounter: number;
}

interface WindowState {
  readonly windows: ReadonlyMap<string, ProcessWindow>;
  readonly zCounter: number;
  readonly activeWindowId: string | null;
}

interface WindowActions {
  openWindow(appId: AppId, position?: Partial<WindowPosition>): string;
  closeWindow(id: string): void;
  focusWindow(id: string): void;
  minimizeWindow(id: string): void;
  maximizeWindow(id: string): void;
  restoreWindow(id: string): void;
  moveWindow(id: string, x: number, y: number): void;
  resizeWindow(id: string, width: number, height: number): void;
  getWindowsByApp(appId: AppId): readonly ProcessWindow[];
  rehydrate(): void;
}

type WindowStore = WindowState & WindowActions;

function readPersisted(): PersistShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(userKey(STORAGE_KEY));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistShape;
    if (!Array.isArray(parsed.windows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(windows: ReadonlyMap<string, ProcessWindow>, zCounter: number): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistShape = {
      windows: [...windows.values()],
      zCounter,
    };
    window.localStorage.setItem(userKey(STORAGE_KEY), JSON.stringify(payload));
  } catch {
    // quota exceeded — silently drop
  }
}

function hydrateInitial(): WindowState {
  const persisted = readPersisted();
  if (!persisted || persisted.windows.length === 0) {
    return { windows: new Map(), zCounter: 10, activeWindowId: null };
  }
  const map = new Map<string, ProcessWindow>();
  for (const w of persisted.windows) map.set(w.id, w);
  return {
    windows: map,
    zCounter: Math.max(persisted.zCounter, 10),
    activeWindowId: null,
  };
}

function findSmartPosition(
  defaults: WindowPosition,
  existing: readonly ProcessWindow[],
): WindowPosition {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 720;
  const maxX = Math.max(12, vw - defaults.width - 12);
  const maxY = Math.max(12, vh - defaults.height - 56);
  const visible = existing.filter((w) => !w.minimized);
  if (visible.length === 0) {
    return {
      ...defaults,
      x: Math.max(12, Math.floor((vw - defaults.width) / 2)),
      y: Math.max(40, Math.floor((vh - defaults.height) / 2)),
    };
  }
  const sorted = [...visible].sort((a, b) => b.zIndex - a.zIndex);
  const top = sorted[0];
  if (top) {
    const cx = Math.min(maxX, top.position.x + 40);
    const cy = Math.min(maxY, top.position.y + 40);
    return { ...defaults, x: cx, y: cy };
  }
  return defaults;
}

const initialState = hydrateInitial();

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: initialState.windows,
  zCounter: initialState.zCounter,
  activeWindowId: initialState.activeWindowId,

  openWindow(appId, position) {
    const id = createId();
    const defaults = DEFAULT_WINDOW_SIZES[appId];
    const existing = [...get().windows.values()];
    const smart: WindowPosition = position
      ? {
          x: position.x ?? defaults.x,
          y: position.y ?? defaults.y,
          width: position.width ?? defaults.width,
          height: position.height ?? defaults.height,
        }
      : findSmartPosition(defaults, existing);
    const zCounter = get().zCounter + 1;
    const w: ProcessWindow = {
      id,
      appId,
      position: smart,
      zIndex: zCounter,
      minimized: false,
      maximized: false,
    };
    const windows = new Map(get().windows);
    windows.set(id, w);
    set({ windows, zCounter, activeWindowId: id });
    persist(windows, zCounter);
    return id;
  },

  closeWindow(id) {
    const windows = new Map(get().windows);
    windows.delete(id);
    const activeWindowId = get().activeWindowId === id ? null : get().activeWindowId;
    set({ windows, activeWindowId });
    persist(windows, get().zCounter);
  },

  focusWindow(id) {
    const existing = get().windows.get(id);
    if (!existing) return;
    if (get().activeWindowId === id && !existing.minimized) {
      const maxZ = Math.max(...[...get().windows.values()].map((w) => w.zIndex));
      if (existing.zIndex >= maxZ) return;
    }
    const zCounter = get().zCounter + 1;
    const windows = new Map(get().windows);
    windows.set(id, { ...existing, zIndex: zCounter, minimized: false });
    set({ windows, zCounter, activeWindowId: id });
    persist(windows, zCounter);
  },

  minimizeWindow(id) {
    const existing = get().windows.get(id);
    if (!existing) return;
    const windows = new Map(get().windows);
    windows.set(id, { ...existing, minimized: true });
    const activeWindowId = get().activeWindowId === id ? null : get().activeWindowId;
    set({ windows, activeWindowId });
    persist(windows, get().zCounter);
  },

  maximizeWindow(id) {
    const existing = get().windows.get(id);
    if (!existing) return;
    const windows = new Map(get().windows);
    windows.set(id, { ...existing, maximized: !existing.maximized });
    set({ windows });
    persist(windows, get().zCounter);
  },

  restoreWindow(id) {
    const existing = get().windows.get(id);
    if (!existing) return;
    const zCounter = get().zCounter + 1;
    const windows = new Map(get().windows);
    windows.set(id, {
      ...existing,
      minimized: false,
      maximized: false,
      zIndex: zCounter,
    });
    set({ windows, zCounter, activeWindowId: id });
    persist(windows, zCounter);
  },

  moveWindow(id, x, y) {
    const existing = get().windows.get(id);
    if (!existing) return;
    const windows = new Map(get().windows);
    windows.set(id, { ...existing, position: { ...existing.position, x, y } });
    set({ windows });
    persist(windows, get().zCounter);
  },

  resizeWindow(id, width, height) {
    const existing = get().windows.get(id);
    if (!existing) return;
    const windows = new Map(get().windows);
    windows.set(id, {
      ...existing,
      position: { ...existing.position, width, height },
    });
    set({ windows });
    persist(windows, get().zCounter);
  },

  getWindowsByApp(appId) {
    return [...get().windows.values()].filter((w) => w.appId === appId);
  },

  rehydrate() {
    const state = hydrateInitial();
    set({
      windows: state.windows,
      zCounter: state.zCounter,
      activeWindowId: null,
    });
  },
}));
