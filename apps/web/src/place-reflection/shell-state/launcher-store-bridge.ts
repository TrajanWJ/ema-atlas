/**
 * Bridge — zustand launcher-store façade. Matches donor API. Holds
 * open/close state for the KickoffLauncher panel plus a list of favorite
 * AppIds for quick-access.
 */

import { create } from "zustand";
import { userKey } from "../lib/user-storage";
import type { AppId } from "../types/window";

const STORAGE_KEY = "launcher-favorites-v1";

const DEFAULT_FAVORITES: readonly AppId[] = ["launchpad", "hq", "agent-work", "blueprint"];

interface LauncherState {
  readonly isOpen: boolean;
  readonly favorites: readonly AppId[];
}

interface LauncherActions {
  open(): void;
  close(): void;
  toggle(): void;
  addFavorite(appId: AppId): void;
  removeFavorite(appId: AppId): void;
  rehydrate(): void;
}

function loadFavorites(): readonly AppId[] {
  if (typeof window === "undefined") return DEFAULT_FAVORITES;
  try {
    const raw = window.localStorage.getItem(userKey(STORAGE_KEY));
    if (!raw) return DEFAULT_FAVORITES;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_FAVORITES;
    return parsed.filter((v): v is AppId => typeof v === "string");
  } catch {
    return DEFAULT_FAVORITES;
  }
}

function persistFavorites(favorites: readonly AppId[]): void {
  try {
    localStorage.setItem(userKey(STORAGE_KEY), JSON.stringify(favorites));
  } catch {
    // silent drop
  }
}

export const useLauncherStore = create<LauncherState & LauncherActions>((set) => ({
  isOpen: false,
  favorites: loadFavorites(),

  open() {
    set({ isOpen: true });
  },

  close() {
    set({ isOpen: false });
  },

  toggle() {
    set((s) => ({ isOpen: !s.isOpen }));
  },

  addFavorite(appId) {
    set((s) => {
      if (s.favorites.includes(appId)) return s;
      const next = [...s.favorites, appId];
      persistFavorites(next);
      return { favorites: next };
    });
  },

  removeFavorite(appId) {
    set((s) => {
      const next = s.favorites.filter((id) => id !== appId);
      persistFavorites(next);
      return { favorites: next };
    });
  },

  rehydrate() {
    set({ favorites: loadFavorites() });
  },
}));
