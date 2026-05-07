/**
 * use-presence — subscribe to the daemon's `desktop.presence`
 * projection. Collab-plane, ephemeral. Pending daemon writer.
 *
 * Shape defined in `@ema/surface-core/adapter` (PresenceProjection).
 * See `docs/orchestration/handoffs/surface-to-runtime-2026-04-24.md`
 * for the Runtime handoff.
 */

import { useMemo } from "react";
import type { PresenceProjection } from "@ema/surface-core/adapter";
import { useProjection } from "../lib/ipc";

export type PresenceView = {
  readonly raw: PresenceProjection | null;
  readonly sessions: PresenceProjection["sessions"];
  readonly cursors: PresenceProjection["cursors"];
  readonly appLocations: PresenceProjection["app_locations"];
  readonly windowOutlines: PresenceProjection["window_outlines"];
  readonly offline: boolean;
};

const EMPTY_SESSIONS: PresenceProjection["sessions"] = [];
const EMPTY_CURSORS: PresenceProjection["cursors"] = [];
const EMPTY_LOCATIONS: PresenceProjection["app_locations"] = [];
const EMPTY_OUTLINES: PresenceProjection["window_outlines"] = [];

export function usePresence(): PresenceView {
  const raw = useProjection<PresenceProjection>("desktop.presence");
  return useMemo(() => {
    if (!raw) {
      return {
        raw: null,
        sessions: EMPTY_SESSIONS,
        cursors: EMPTY_CURSORS,
        appLocations: EMPTY_LOCATIONS,
        windowOutlines: EMPTY_OUTLINES,
        offline: true,
      };
    }
    return {
      raw,
      sessions: raw.sessions ?? EMPTY_SESSIONS,
      cursors: raw.cursors ?? EMPTY_CURSORS,
      appLocations: raw.app_locations ?? EMPTY_LOCATIONS,
      windowOutlines: raw.window_outlines ?? EMPTY_OUTLINES,
      offline: false,
    };
  }, [raw]);
}
