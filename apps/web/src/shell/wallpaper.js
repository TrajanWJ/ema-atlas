import { jsx as _jsx } from "react/jsx-runtime";
import { useProjection } from "../lib/ipc";
/**
 * Wallpaper layer — per-project scene.
 *
 * In wave 1 the scene is chosen from a small fixed palette keyed by
 * `wallpaper_key`. The projection name `desktop.wallpaper` is reserved
 * for the daemon to deliver the real key when the workspace-plane
 * artifact is wired.
 */
export function Wallpaper({ projectId }) {
    const wallpaper = useProjection("desktop.wallpaper");
    const key = wallpaper?.wallpaper_key ?? defaultSceneKey(projectId);
    return _jsx("div", { className: "ema-wallpaper", "data-scene": key, "aria-hidden": "true" });
}
function defaultSceneKey(projectId) {
    // Stable per-project default until the daemon delivers a real wallpaper.
    const hash = Array.from(projectId).reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const scenes = ["scene-forest", "scene-ember", "scene-dusk", "scene-slate"];
    return scenes[hash % scenes.length];
}
