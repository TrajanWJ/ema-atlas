"use client";

/**
 * Tiny localStorage-backed appearance store for the Settings vApp.
 *
 * The URL nav layer (`use-url-nav.ts`) is the source of truth at runtime
 * for theme/contrast/mode/titlebar — this hook only persists what the
 * user picks via the Settings UI so it survives a reload when no URL
 * params are present.
 *
 * Storage key: `ema:appearance` (JSON `{ theme, contrast, mode, titlebar }`).
 */

import { useCallback, useEffect, useState } from "react";

import type { BaseMode, ContrastMode, TitlebarVariant } from "./url-nav";

const STORAGE_KEY = "ema:appearance";

export type AppearanceState = {
  readonly theme: string;
  readonly contrast: ContrastMode;
  readonly mode: BaseMode;
  readonly titlebar: TitlebarVariant;
};

const DEFAULT_STATE: AppearanceState = {
  theme: "default",
  contrast: "default",
  mode: "default",
  titlebar: "default",
};

function isContrast(value: unknown): value is ContrastMode {
  return value === "default" || value === "increased" || value === "high";
}

function isMode(value: unknown): value is BaseMode {
  return value === "default" || value === "light" || value === "dark";
}

function isTitlebar(value: unknown): value is TitlebarVariant {
  return value === "default" || value === "compact" || value === "hidden";
}

export function readAppearance(): AppearanceState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      theme: typeof parsed.theme === "string" ? parsed.theme : DEFAULT_STATE.theme,
      contrast: isContrast(parsed.contrast) ? parsed.contrast : DEFAULT_STATE.contrast,
      mode: isMode(parsed.mode) ? parsed.mode : DEFAULT_STATE.mode,
      titlebar: isTitlebar(parsed.titlebar) ? parsed.titlebar : DEFAULT_STATE.titlebar,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeAppearance(state: AppearanceState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode, quota); fail silent.
  }
}

export function useThemeStore(): {
  readonly state: AppearanceState;
  readonly setTheme: (theme: string) => void;
  readonly setContrast: (contrast: ContrastMode) => void;
  readonly setMode: (mode: BaseMode) => void;
  readonly setTitlebar: (titlebar: TitlebarVariant) => void;
} {
  const [state, setState] = useState<AppearanceState>(DEFAULT_STATE);

  // Hydrate from localStorage on mount (skip during SSR).
  useEffect(() => {
    setState(readAppearance());
  }, []);

  const update = useCallback((next: AppearanceState) => {
    setState(next);
    writeAppearance(next);
  }, []);

  return {
    state,
    setTheme: useCallback((theme: string) => update({ ...readAppearance(), theme }), [update]),
    setContrast: useCallback(
      (contrast: ContrastMode) => update({ ...readAppearance(), contrast }),
      [update],
    ),
    setMode: useCallback((mode: BaseMode) => update({ ...readAppearance(), mode }), [update]),
    setTitlebar: useCallback(
      (titlebar: TitlebarVariant) => update({ ...readAppearance(), titlebar }),
      [update],
    ),
  };
}

export const APPEARANCE_STORAGE_KEY = STORAGE_KEY;
