import { useWallpaper } from "../place-reflection/projections/use-wallpaper";
import { DotsBg } from "../place-reflection/components/desktop/DotsBg";
import { ParticlesBg } from "../place-reflection/components/desktop/ParticlesBg";

/**
 * Wallpaper layer — per-project scene.
 *
 * Subscribes via `useWallpaper(projectId)` (place-reflection projection
 * hook, Wave 6). Falls back to a stable per-project scene key when the
 * daemon writer hasn't shipped.
 *
 * Mounts donor chrome behind the scene:
 *   - DotsBg (subtle connected particle field) — always on.
 *   - ParticlesBg (upward-drifting embers) — on for ember/dusk scenes.
 *
 * RIP: place.org ambient breathing (`--ema-wallpaper-breath-rate`) +
 *      place.org `DotsBg.tsx` + `ParticlesBg.tsx` as pure chrome.
 */
export function Wallpaper({ projectId }: { projectId: string }) {
  const { key } = useWallpaper(projectId);
  const showParticles = key === "scene-ember" || key === "scene-dusk";

  return (
    <div className="ema-wallpaper" data-scene={key} aria-hidden="true">
      <div className="ema-wallpaper__breath" />
      <div className="ema-wallpaper__grain" />
      <DotsBg speed={0.6} interactive opacity={0.55} />
      {showParticles ? <ParticlesBg /> : null}
    </div>
  );
}
