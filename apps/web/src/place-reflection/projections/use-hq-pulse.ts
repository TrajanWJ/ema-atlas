/**
 * use-hq-pulse — subscribe to the daemon's `hq.pulse` projection.
 *
 * Wave 4 status: **daemon writer not yet shipped.** Until the
 * Surface→Runtime handoff lands
 * (`docs/orchestration/handoffs/surface-to-runtime-2026-04-24.md`), this
 * hook returns `{ data: null, offline: true }` and callers render the
 * staged `hqProjection` fallback with a visible `staged projection`
 * badge per the honest-mocks doctrine.
 *
 * Shape defined in `@ema/surface-core/adapter` (see `HqPulseProjection`).
 * Channel: `project.<id>.all` (reuses existing topic; no new contract).
 */

import { useMemo } from "react";
import type { HqPulseProjection } from "@ema/surface-core/adapter";
import { useProjection } from "../../lib/ipc";

export type HqPulseView = {
  data: HqPulseProjection | null;
  offline: boolean;
};

export function useHqPulse(): HqPulseView {
  const data = useProjection<HqPulseProjection>("hq.pulse");
  return useMemo(() => ({ data, offline: data == null }), [data]);
}
