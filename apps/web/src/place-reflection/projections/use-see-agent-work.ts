/**
 * use-see-agent-work — subscribe to the daemon's
 * `see_agent_work.project_pulse` projection.
 *
 * Writer is not yet shipped; until the Surface→Runtime handoff packet
 * lands swarm/mission/lane/handoff writers, the daemon delivers no
 * snapshot and this hook returns `{ data: null, offline: true }`. The
 * Agent Work surface already falls back to `agentWorkLaneSummary` and
 * marks itself with the `staged projection` badge.
 *
 * Shape: `SeeAgentWorkProjection` in `@ema/surface-core/adapter`.
 * Channel: `project.<id>.all` (no new contract).
 */

import { useMemo } from "react";
import type { SeeAgentWorkProjection } from "@ema/surface-core/adapter";
import { useProjection } from "../../lib/ipc";

export type SeeAgentWorkView = {
  data: SeeAgentWorkProjection | null;
  offline: boolean;
};

export function useSeeAgentWork(): SeeAgentWorkView {
  const data = useProjection<SeeAgentWorkProjection>(
    "see_agent_work.project_pulse",
  );
  return useMemo(() => ({ data, offline: data == null }), [data]);
}
