/**
 * use-topbar — subscribe to the daemon's `topbar` projection and
 * expose a narrow, component-friendly view:
 *
 *   { scope: { org, space, project }, node_state, offline }
 *
 * `offline = true` when the daemon hasn't delivered a snapshot yet.
 * Callers that need the full protocol shape (orgs[]/spaces[]/projects[])
 * can use `raw` on the returned object.
 *
 * The raw shape is defined in `@ema/surface-core/adapter` (see
 * `packages/contracts/ipc/shell-protocol.md` §TopbarProjection).
 */

import { useMemo } from "react";
import type {
  TopbarProjection,
  TopbarOrg,
  TopbarSpace,
  TopbarProject,
  NodeState,
} from "@ema/surface-core/adapter";
import { useProjection } from "../../lib/ipc";

export type TopbarScope = {
  org: TopbarOrg | null;
  space: TopbarSpace | null;
  project: TopbarProject | null;
};

export type TopbarView = {
  raw: TopbarProjection | null;
  scope: TopbarScope;
  node_state: NodeState | null;
  offline: boolean;
};

const EMPTY_SCOPE: TopbarScope = { org: null, space: null, project: null };

export function useTopbar(): TopbarView {
  const raw = useProjection<TopbarProjection>("topbar");

  return useMemo(() => {
    if (!raw) {
      return { raw: null, scope: EMPTY_SCOPE, node_state: null, offline: true };
    }
    return {
      raw,
      scope: {
        org: raw.current_org ?? null,
        space: raw.current_space ?? null,
        project: raw.current_project ?? null,
      },
      node_state: raw.node_state,
      offline: false,
    };
  }, [raw]);
}
