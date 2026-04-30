"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import {
  THEME_PRESETS,
  applyTheme,
  setBaseTheme,
  setContrast,
  setTitlebar,
} from "@ema/design-system";

import { parseUrlState, type UrlState } from "./url-nav";

/**
 * Reads URL nav params and applies them to the shell on every history change.
 *
 * What it owns (always — the URL is the source of truth for these):
 *   - theme preset (writes inline `--place-*` token props on <html>)
 *   - contrast mode  ([data-contrast])
 *   - base theme     ([data-theme])
 *   - titlebar       ([data-titlebar])
 *   - test mode      ([data-test])  — components opt into deterministic mode
 *
 * What it returns (for consumers to act on — opening windows, etc):
 *   - the parsed UrlState
 *
 * The hook never writes back to the URL. Pages that want shareable URLs
 * should use `encodeUrlState()` from ./url-nav and call router.replace().
 */
export function useUrlNav(): UrlState {
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() ?? "";
  const state = parseUrlState(queryString);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // Theme preset
    if (state.theme) {
      const preset = THEME_PRESETS.find((p) => p.id === state.theme);
      if (preset) applyTheme(preset);
    }

    // Contrast / base mode / titlebar
    setContrast(state.contrast);
    setBaseTheme(state.mode);
    setTitlebar(state.titlebar);

    // Test mode — components can opt into deterministic behavior with
    //   const isTest = document.documentElement.dataset.test === "1";
    if (state.test) {
      root.dataset.test = "1";
    } else {
      delete root.dataset.test;
    }

    // Reduced-motion fallback for test runs (kills ambient motion automatically)
    if (state.test) {
      root.style.setProperty("--ema-test-reduced-motion", "1");
    } else {
      root.style.removeProperty("--ema-test-reduced-motion");
    }
  }, [state.theme, state.contrast, state.mode, state.titlebar, state.test]);

  return state;
}
