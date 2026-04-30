/**
 * use-see-agent-work — subscribe to the daemon's
 * `see_agent_work.project_pulse` projection.
 *
 * Writer is not yet shipped; until the Surface→Runtime handoff packet
 * lands swarm/mission/lane/handoff writers, the daemon delivers no
 * snapshot and this hook returns the staged `seeAgentWorkProjection`
 * mock with `offline: true`. The Agent Work surface marks itself with
 * the `staged projection` badge per the honest-mocks doctrine.
 *
 * Shape: `SeeAgentWorkProjection` in `@ema/surface-core/adapter`.
 * Channel: `project.<id>.all` (no new contract).
 */

import { useMemo } from "react";
import type { SeeAgentWorkProjection } from "@ema/surface-core/adapter";
import { useProjection } from "../lib/ipc";
import { seeAgentWorkProjection } from "../app/mock-projections";

export type SeeAgentWorkView = {
	data: SeeAgentWorkProjection | null;
	offline: boolean;
};

const MOCK_SEE_AGENT_WORK = seeAgentWorkProjection as unknown as SeeAgentWorkProjection;

export function useSeeAgentWork(): SeeAgentWorkView {
	const data = useProjection<SeeAgentWorkProjection>(
		"see_agent_work.project_pulse",
	);
	return useMemo(
		() =>
			data ? { data, offline: false } : { data: MOCK_SEE_AGENT_WORK, offline: true },
		[data],
	);
}
