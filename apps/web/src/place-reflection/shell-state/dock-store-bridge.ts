/**
 * Bridge — zustand dock-store façade. Same API as donor, EMA-scoped
 * defaults.
 */

import { create } from "zustand";
import { userKey } from "../lib/user-storage";
import type { AppId } from "../types/window";

const STORAGE_KEY = "dock-pinned-v1";

const DEFAULT_PINNED: readonly AppId[] = [
  "launchpad",
  "hq",
  "blueprint",
  "agent-work",
];

interface DockState {
  readonly pinnedAppIds: readonly AppId[];
}

interface DockActions {
  pin(appId: AppId): void;
  unpin(appId: AppId): void;
  reorder(appIds: readonly AppId[]): void;
  rehydrate(): void;
}

type DockStore = DockState & DockActions;

function readPinned(): AppId[] {
  if (typeof window === "undefined") return [...DEFAULT_PINNED];
  try {
    const raw = window.localStorage.getItem(userKey(STORAGE_KEY));
    if (!raw) return [...DEFAULT_PINNED];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_PINNED];
    return parsed.filter((v): v is AppId => typeof v === "string");
  } catch {
    return [...DEFAULT_PINNED];
  }
}

function writePinned(ids: readonly AppId[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(userKey(STORAGE_KEY), JSON.stringify(ids));
  } catch {
    // silent drop
  }
}

export const useDockStore = create<DockStore>((set, get) => ({
  pinnedAppIds: readPinned(),

  pin(appId) {
    const current = get().pinnedAppIds;
    if (current.includes(appId)) return;
    const next = [...current, appId];
    set({ pinnedAppIds: next });
    writePinned(next);
  },

  unpin(appId) {
    const next = get().pinnedAppIds.filter((id) => id !== appId);
    set({ pinnedAppIds: next });
    writePinned(next);
  },

  reorder(appIds) {
    const next = [...appIds];
    set({ pinnedAppIds: next });
    writePinned(next);
  },

  rehydrate() {
    set({ pinnedAppIds: readPinned() });
  },
}));
