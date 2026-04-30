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
  readonly cursors: PresenceProjection["cursors"];
  readonly windowOutlines: PresenceProjection["window_outlines"];
  readonly offline: boolean;
};

const EMPTY_CURSORS: PresenceProjection["cursors"] = [];
const EMPTY_OUTLINES: PresenceProjection["window_outlines"] = [];

export function usePresence(): PresenceView {
  const raw = useProjection<PresenceProjection>("desktop.presence");
  return useMemo(() => {
    if (!raw) {
      return {
        raw: null,
        cursors: EMPTY_CURSORS,
        windowOutlines: EMPTY_OUTLINES,
        offline: true,
      };
    }
    return {
      raw,
      cursors: raw.cursors,
      windowOutlines: raw.window_outlines,
      offline: false,
    };
  }, [raw]);
}
