import type { WindowState } from "./window-store";

/**
 * Desktop layout artifact — the per-project window arrangement.
 *
 * Canonical path on the workspace plane (doctrine, future wave):
 *   workspace://desktop/layout.<project_id>.json
 *
 * Wave 1 persistence target: localStorage, keyed by project_id. The
 * daemon's workspace-plane writer lands in a later wave; the key name
 * matches the eventual artifact path so that migration is a backend
 * swap, not a refactor.
 *
 * This is NOT control-plane truth — layout is a workspace artifact.
 * Refresh blows the in-memory view away and rehydrates from here.
 */
export type DesktopLayout = {
  project_id: string;
  windows: WindowState[];
  wallpaper_key: string;
  updated_at: string;
};

const STORAGE_PREFIX = "ema:workspace:desktop:layout:";

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`;
}

export function loadLayoutArtifact(projectId: string): DesktopLayout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DesktopLayout;
    if (parsed.project_id !== projectId) return null;
    if (!Array.isArray(parsed.windows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLayoutArtifact(layout: DesktopLayout): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(layout.project_id), JSON.stringify(layout));
  } catch {
    // quota exceeded or storage disabled — drop silently; hydration on next load will be empty
  }
}
