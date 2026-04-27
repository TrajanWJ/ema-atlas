/**
 * Adapter layer — workspace-plane desktop layout artifact.
 *
 * Window geometry, dock pinning, and virtual-desktop grouping live on
 * the **workspace plane** forever (confirmed with Trajan 2026-04-24).
 * They are per-device preference, not canon — no `window.*` control-plane
 * event family will ship.
 *
 * Canonical path (future daemon writer): `workspace://desktop/layout.<project_id>.json`
 * Wave 1 persistence target: localStorage, keyed by project_id.
 */

export type WindowGeometry = {
  id: string;
  surface_id: string; // e.g. "launchpad", "hq", "blueprint"
  title: string;
  route: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  // snap is a local affordance; null when the window is in free-drag mode
  snap: "left" | "right" | "top" | "bottom" | "maximized" | null;
  // desktop grouping for the virtual-desktop switcher
  virtual_desktop_id: string;
};

export type VirtualDesktopRecord = {
  id: string;
  name: string;
};

export type DesktopLayoutV2 = {
  version: 2;
  project_id: string;
  windows: WindowGeometry[];
  virtual_desktops: VirtualDesktopRecord[];
  active_virtual_desktop_id: string;
  dock_pinned: string[]; // surface_ids
  wallpaper_key: string;
  updated_at: string;
};

// v1 is the shape currently written to localStorage by apps/web/src/shell/layout-artifact.ts.
// Migration happens on load: readLayoutArtifact returns v2 regardless.
export type DesktopLayoutV1 = {
  project_id: string;
  windows: Array<{
    id: string;
    vapp: string;
    title: string;
    route: string;
    x: number;
    y: number;
    width: number;
    height: number;
    z: number;
    minimized: boolean;
  }>;
  wallpaper_key: string;
  updated_at: string;
};

export const DEFAULT_VIRTUAL_DESKTOP_ID = "desktop-1";

export function makeDefaultVirtualDesktops(): VirtualDesktopRecord[] {
  return [
    { id: DEFAULT_VIRTUAL_DESKTOP_ID, name: "Desktop 1" },
    { id: "desktop-2", name: "Desktop 2" },
  ];
}
