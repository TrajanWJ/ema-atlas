"use client";

import { useEffect, useRef } from "react";

import { useWindowStore } from "@/src/stores/window-store";
import type { AppId, WindowPosition } from "../types/window";
import { isVAppId } from "./url-nav";

import { useUrlNav } from "./use-url-nav";
import type { UrlWindowSpec } from "./url-nav";

/**
 * UrlStateRouter — mounts inside the shell, applies URL state to the stores.
 *
 * What it routes (in order, on every URL change):
 *   1. theme / contrast / mode / titlebar / test  (handled inside useUrlNav)
 *   2. ?windows=… and ?window=…  → opens windows at exact positions
 *   3. ?vapps=…  → opens vApps at default positions (in order, after windows)
 *   4. ?vapp=…   → opens a single vApp (or focuses if open)
 *
 * The router does NOT close other windows or wipe state. URL state is
 * additive — drop a vapp param, the existing window stays.
 *
 * Returns the parsed UrlState so the shell can react (e.g., panel mode).
 */
export function useUrlStateRouter() {
  const urlState = useUrlNav();
  const openWindow = useWindowStore((s) => s.openWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const getWindowsByApp = useWindowStore((s) => s.getWindowsByApp);

  // Track which windows we've already opened from this URL state to avoid
  // re-opening on every render.
  const appliedRef = useRef<string>("");

  useEffect(() => {
    const fingerprint = JSON.stringify({
      windows: urlState.windows,
      vapps: urlState.vapps,
      vapp: urlState.vapp,
    });
    if (fingerprint === appliedRef.current) return;
    appliedRef.current = fingerprint;

    // 1. Open ?windows= / ?window= at exact positions
    for (const spec of urlState.windows) {
      openOrFocusAt(spec, openWindow, focusWindow, getWindowsByApp);
    }

    // 2. Open ?vapps= at default positions
    for (const id of urlState.vapps) {
      openOrFocus(id, openWindow, focusWindow, getWindowsByApp);
    }

    // 3. Open ?vapp= (single)
    if (urlState.vapp) {
      openOrFocus(urlState.vapp, openWindow, focusWindow, getWindowsByApp);
    }

    // 4. Sprint 7: treat legacy `?panel=…` / `?mode=panel&vapp=…` as a
    //    Holodeck-shaped request. The canonical route for full-bleed is
    //    `/<appId>`, but old deep-links land here — open / focus the vApp
    //    like any other Holodeck target so the panel parameter never
    //    silently no-ops.
    if (urlState.panel && urlState.panel !== urlState.vapp) {
      openOrFocus(urlState.panel, openWindow, focusWindow, getWindowsByApp);
    }
  }, [
    urlState.windows,
    urlState.vapps,
    urlState.vapp,
    urlState.panel,
    openWindow,
    focusWindow,
    getWindowsByApp,
  ]);

  return urlState;
}

// ---------------------------------------------------------------------------

function openOrFocus(
  id: string,
  openWindow: (appId: AppId, position?: Partial<WindowPosition>) => string,
  focusWindow: (id: string) => void,
  getWindowsByApp: (appId: AppId) => readonly { id: string; minimized: boolean }[],
) {
  if (!isVAppId(id)) return;
  const existing = getWindowsByApp(id as AppId);
  const visible = existing.find((w) => !w.minimized) ?? existing[0];
  if (visible) {
    focusWindow(visible.id);
  } else {
    openWindow(id as AppId);
  }
}

function openOrFocusAt(
  spec: UrlWindowSpec,
  openWindow: (appId: AppId, position?: Partial<WindowPosition>) => string,
  focusWindow: (id: string) => void,
  getWindowsByApp: (appId: AppId) => readonly { id: string; minimized: boolean }[],
) {
  const existing = getWindowsByApp(spec.appId as AppId);
  const visible = existing.find((w) => !w.minimized) ?? existing[0];
  if (visible) {
    focusWindow(visible.id);
    return;
  }
  const position: Partial<WindowPosition> = {
    x: spec.x,
    y: spec.y,
    ...(typeof spec.width === "number" ? { width: spec.width } : {}),
    ...(typeof spec.height === "number" ? { height: spec.height } : {}),
  };
  openWindow(spec.appId as AppId, position);
}
