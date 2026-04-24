import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { surfaceLinks } from "../app/mock-projections";
/**
 * Dock — first-class launcher with Launchpad semantics, scoped to the
 * Desktop frame per `virtual-desktop-deep.md`.
 *
 * Clicking a tile opens or focuses that vApp's window. The dock lists
 * the same surfaces as `surfaceLinks` — that list is static UI
 * configuration (vApp registry), not canonical data.
 */
export function Dock({ store, onOpen, }) {
    return (_jsx("nav", { className: "ema-dock", "aria-label": "EMA dock", children: surfaceLinks.map((surface) => {
            const winId = `window:${surface.id}`;
            const isOpen = store.windows.some((w) => w.id === winId);
            return (_jsxs("button", { type: "button", className: isOpen ? "ema-dock__tile is-open" : "ema-dock__tile", onClick: () => onOpen(surface.id, surface.path, surface.label), "aria-pressed": isOpen, title: `${surface.eyebrow} — ${surface.label}`, children: [_jsx("span", { className: "ema-dock__tile-eyebrow", children: surface.eyebrow }), _jsx("strong", { className: "ema-dock__tile-label", children: surface.label }), _jsx("span", { className: "ema-dock__tile-status", "data-status": surface.status })] }, surface.id));
        }) }));
}
