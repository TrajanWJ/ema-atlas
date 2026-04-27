/**
 * Bridge — zustand desktop-store façade. Holds per-user desktop
 * preferences (cursor light, dock autohide, inbox count) that donor
 * components read directly.
 *
 * All fields are local-only workspace-plane state; they never become
 * canon.
 */

import { create } from "zustand";
import { userKey } from "../lib/user-storage";

const STORAGE_KEY = "desktop-prefs-v1";

interface DesktopState {
  readonly cursorLightEnabled: boolean;
  readonly dockAutohideEnabled: boolean;
  readonly inboxCount: number;
  readonly showWelcome: boolean;
  readonly wallpaperKey: string;
  readonly commandPaletteOpen: boolean;
  readonly telescopeOpen: boolean;
}

interface DesktopActions {
  setCursorLightEnabled(value: boolean): void;
  setDockAutohideEnabled(value: boolean): void;
  setInboxCount(value: number): void;
  setShowWelcome(value: boolean): void;
  setWallpaperKey(value: string): void;
  openCommandPalette(): void;
  closeCommandPalette(): void;
  toggleCommandPalette(): void;
  openTelescope(): void;
  closeTelescope(): void;
  toggleTelescope(): void;
  rehydrate(): void;
}

type DesktopStore = DesktopState & DesktopActions;

const DEFAULTS: DesktopState = {
  cursorLightEnabled: false,
  dockAutohideEnabled: false,
  inboxCount: 0,
  showWelcome: true,
  wallpaperKey: "scene-default",
  commandPaletteOpen: false,
  telescopeOpen: false,
};

const EPHEMERAL_KEYS: readonly (keyof DesktopState)[] = [
  "commandPaletteOpen",
  "telescopeOpen",
  "inboxCount",
];

function loadPrefs(): DesktopState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(userKey(STORAGE_KEY));
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<DesktopState>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function persistPrefs(state: DesktopState): void {
  try {
    const persistable: Partial<DesktopState> = { ...state };
    for (const key of EPHEMERAL_KEYS) delete persistable[key];
    localStorage.setItem(userKey(STORAGE_KEY), JSON.stringify(persistable));
  } catch {
    // silent drop
  }
}

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  ...loadPrefs(),

  setCursorLightEnabled(value) {
    set({ cursorLightEnabled: value });
    persistPrefs(get());
  },
  setDockAutohideEnabled(value) {
    set({ dockAutohideEnabled: value });
    persistPrefs(get());
  },
  setInboxCount(value) {
    set({ inboxCount: value });
  },
  setShowWelcome(value) {
    set({ showWelcome: value });
    persistPrefs(get());
  },
  setWallpaperKey(value) {
    set({ wallpaperKey: value });
    persistPrefs(get());
  },
  openCommandPalette() {
    set({ commandPaletteOpen: true, telescopeOpen: false });
  },
  closeCommandPalette() {
    set({ commandPaletteOpen: false });
  },
  toggleCommandPalette() {
    set((s) => ({
      commandPaletteOpen: !s.commandPaletteOpen,
      telescopeOpen: false,
    }));
  },
  openTelescope() {
    set({ telescopeOpen: true, commandPaletteOpen: false });
  },
  closeTelescope() {
    set({ telescopeOpen: false });
  },
  toggleTelescope() {
    set((s) => ({
      telescopeOpen: !s.telescopeOpen,
      commandPaletteOpen: false,
    }));
  },
  rehydrate() {
    set(loadPrefs());
  },
}));
