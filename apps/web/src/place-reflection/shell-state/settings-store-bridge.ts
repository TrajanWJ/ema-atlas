/**
 * Bridge — zustand settings-store façade. Matches donor API for
 * SettingsState. All fields are local-only user preferences; never canon.
 */

import { create } from "zustand";
import { userKey } from "../lib/user-storage";
import {
  DEFAULT_SETTINGS,
  type DockSize,
  type SettingsState,
} from "../types/settings";

const STORAGE_KEY = "settings-v1";

interface SettingsActions {
  setDockSize(size: DockSize): void;
  setDockMagnification(value: boolean): void;
  setVirtualDesktopsEnabled(value: boolean): void;
  setReducedMotion(value: boolean): void;
  setSoundEnabled(value: boolean): void;
  setWallpaperFit(value: SettingsState["wallpaperFit"]): void;
  setWallpaperTint(value: string): void;
  setWindowRadius(value: number): void;
  setInactiveWindowOpacity(value: number): void;
  rehydrate(): void;
}

type SettingsStore = SettingsState & SettingsActions;

function loadSettings(): SettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(userKey(STORAGE_KEY));
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(state: SettingsState): void {
  try {
    localStorage.setItem(userKey(STORAGE_KEY), JSON.stringify(state));
  } catch {
    // silent drop
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...loadSettings(),

  setDockSize(size) {
    set({ dockSize: size });
    persistSettings(get());
  },
  setDockMagnification(value) {
    set({ dockMagnification: value });
    persistSettings(get());
  },
  setVirtualDesktopsEnabled(value) {
    set({ virtualDesktopsEnabled: value });
    persistSettings(get());
  },
  setReducedMotion(value) {
    set({ reducedMotion: value });
    persistSettings(get());
  },
  setSoundEnabled(value) {
    set({ soundEnabled: value });
    persistSettings(get());
  },
  setWallpaperFit(value) {
    set({ wallpaperFit: value });
    persistSettings(get());
  },
  setWallpaperTint(value) {
    set({ wallpaperTint: value });
    persistSettings(get());
  },
  setWindowRadius(value) {
    set({ windowRadius: value });
    persistSettings(get());
  },
  setInactiveWindowOpacity(value) {
    set({ inactiveWindowOpacity: value });
    persistSettings(get());
  },
  rehydrate() {
    set(loadSettings());
  },
}));
