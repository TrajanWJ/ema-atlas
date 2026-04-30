/**
 * use-hq-pulse — subscribe to the daemon's `hq.pulse` projection.
 *
 * Wave 4 status: **daemon writer not yet shipped.** Until the
 * Surface→Runtime handoff lands
 * (`docs/orchestration/handoffs/surface-to-runtime-2026-04-24.md`), this
 * hook returns the staged `hqProjection` mock with `offline: true` so the
 * HQ vApp renders coherent content in daemon-offline builds (e.g. the
 * bundled .app shell). The visible `staged projection` badge per the
 * honest-mocks doctrine remains the operator's signal.
 *
 * Shape defined in `@ema/surface-core/adapter` (see `HqPulseProjection`).
 * Channel: `project.<id>.all` (reuses existing topic; no new contract).
 */

import { useMemo } from "react";
import type { HqPulseProjection } from "@ema/surface-core/adapter";
import { useProjection } from "../lib/ipc";
import { hqProjection } from "../app/mock-projections";

export type HqPulseView = {
	data: HqPulseProjection | null;
	offline: boolean;
};

const MOCK_HQ_PULSE = hqProjection as unknown as HqPulseProjection;

export function useHqPulse(): HqPulseView {
	const data = useProjection<HqPulseProjection>("hq.pulse");
	return useMemo(
		() => (data ? { data, offline: false } : { data: MOCK_HQ_PULSE, offline: true }),
		[data],
	);
}
