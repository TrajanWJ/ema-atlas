"use client";

/**
 * use-vcalendar-phase — surface the current vCalendar weekly phase.
 *
 * Reads from `see_agent_work.project_pulse.vcalendar.weekly_phase` (the
 * canonical source per shell-protocol). When the projection isn't shipped
 * yet (daemon offline, or the projection writer hasn't landed), returns
 * null — surfaces should render "—" or hide the row.
 *
 * Note: mirrors what `ema vcalendar tick --json` reports. There is no
 * dedicated `vcalendar.tick` projection in v0 — phase travels with
 * `see_agent_work.project_pulse`.
 */

import { useMemo } from "react";

import type { SeeAgentWorkProjection } from "@ema/surface-core/projections";

import { useProjection } from "@/src/lib/ipc";

export type VcalendarPhaseView = {
	readonly phase: string | null;
	readonly hasProjection: boolean;
};

export function useVcalendarPhase(): VcalendarPhaseView {
	const projection = useProjection<SeeAgentWorkProjection>(
		"see_agent_work.project_pulse",
	);

	return useMemo(() => {
		if (!projection) {
			return { phase: null, hasProjection: false };
		}
		const phase = projection.vcalendar?.weekly_phase ?? null;
		return { phase, hasProjection: true };
	}, [projection]);
}
