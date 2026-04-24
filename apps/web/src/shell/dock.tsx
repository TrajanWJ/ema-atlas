import { surfaceLinks, type SurfaceId } from "../app/mock-projections";
import type { WindowStore } from "./window-store";

/**
 * Dock — first-class launcher with Launchpad semantics, scoped to the
 * Desktop frame per `virtual-desktop-deep.md`.
 *
 * Clicking a tile opens or focuses that vApp's window. The dock lists
 * the same surfaces as `surfaceLinks` — that list is static UI
 * configuration (vApp registry), not canonical data.
 */
export function Dock({
  store,
  onOpen,
}: {
  store: WindowStore;
  onOpen: (surfaceId: SurfaceId, route: string, label: string) => void;
}) {
  return (
    <nav className="ema-dock" aria-label="EMA dock">
      {surfaceLinks.map((surface) => {
        const winId = `window:${surface.id}`;
        const isOpen = store.windows.some((w) => w.id === winId);
        return (
          <button
            key={surface.id}
            type="button"
            className={isOpen ? "ema-dock__tile is-open" : "ema-dock__tile"}
            onClick={() => onOpen(surface.id, surface.path, surface.label)}
            aria-pressed={isOpen}
            title={`${surface.eyebrow} — ${surface.label}`}
          >
            <span className="ema-dock__tile-eyebrow">{surface.eyebrow}</span>
            <strong className="ema-dock__tile-label">{surface.label}</strong>
            <span className="ema-dock__tile-status" data-status={surface.status} />
          </button>
        );
      })}
    </nav>
  );
}
