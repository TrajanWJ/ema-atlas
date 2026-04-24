import { useProjection } from "../lib/ipc";

export type PresenceProjection = {
  project_id: string;
  actors: Array<{
    actor_id: string;
    display_name: string;
    cursor?: { x: number; y: number };
    window_id?: string;
    color?: string;
  }>;
};

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
  const presence = useProjection<PresenceProjection>("desktop.presence");

  if (!presence || !presence.actors.length) return null;

  return (
    <div className="ema-presence" aria-hidden="true">
      {presence.actors.map((actor) => {
        if (!actor.cursor) return null;
        return (
          <span
            key={actor.actor_id}
            className="ema-presence__cursor"
            style={{
              transform: `translate(${actor.cursor.x}px, ${actor.cursor.y}px)`,
              ["--ema-presence-color" as string]: actor.color ?? "var(--ema-blue)",
            }}
          >
            <span className="ema-presence__cursor-dot" />
            <span className="ema-presence__cursor-label">{actor.display_name}</span>
          </span>
        );
      })}
    </div>
  );
}
