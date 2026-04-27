/**
 * use-wallpaper — subscribe to the daemon's `desktop.wallpaper`
 * projection and expose a scene key usable by the wallpaper chrome.
 *
 * Until the Runtime writer ships, falls back to a stable per-project
 * scene pick (layout-artifact default). Consumers should treat `key`
 * as authoritative regardless of online/offline.
 *
 * Shape defined in `@ema/surface-core/adapter` (WallpaperProjection).
 * Pending daemon writer — see
 * `docs/orchestration/handoffs/surface-to-runtime-2026-04-24.md`.
 */

import { useMemo } from "react";
import type { WallpaperProjection } from "@ema/surface-core/adapter";
import { useProjection } from "../../lib/ipc";

const SCENES = ["scene-forest", "scene-ember", "scene-dusk", "scene-slate"];

function fallbackSceneKey(projectId: string): string {
  const hash = Array.from(projectId).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return SCENES[hash % SCENES.length] ?? SCENES[0]!;
}

export type WallpaperView = {
  readonly raw: WallpaperProjection | null;
  readonly key: string;
  readonly offline: boolean;
};

export function useWallpaper(projectId: string): WallpaperView {
  const raw = useProjection<WallpaperProjection>("desktop.wallpaper");
  return useMemo(() => {
    return {
      raw: raw ?? null,
      key: raw?.wallpaper_key ?? fallbackSceneKey(projectId),
      offline: !raw,
    };
  }, [raw, projectId]);
}
