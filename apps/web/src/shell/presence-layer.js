import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useProjection } from "../lib/ipc";
/**
 * Presence layer — cursors and window outlines for other actors in the
 * same Space.
 *
 * Subscribes to the `desktop.presence` projection. In wave 1 this is a
 * UI stub — the daemon's `ws_hub` collab-plane subscription lands in a
 * later wave, at which point this component becomes live without a
 * refactor.
 *
 * Lives on the Collab plane per
 * `data-model/EMA-DATA-TREATMENT-AND-SOURCE-OF-TRUTH.md`. Ephemeral —
 * not persisted to workspace artifacts.
 */
export function PresenceLayer() {
    const presence = useProjection("desktop.presence");
    if (!presence || !presence.actors.length)
        return null;
    return (_jsx("div", { className: "ema-presence", "aria-hidden": "true", children: presence.actors.map((actor) => {
            if (!actor.cursor)
                return null;
            return (_jsxs("span", { className: "ema-presence__cursor", style: {
                    transform: `translate(${actor.cursor.x}px, ${actor.cursor.y}px)`,
                    ["--ema-presence-color"]: actor.color ?? "var(--ema-blue)",
                }, children: [_jsx("span", { className: "ema-presence__cursor-dot" }), _jsx("span", { className: "ema-presence__cursor-label", children: actor.display_name })] }, actor.actor_id));
        }) }));
}
