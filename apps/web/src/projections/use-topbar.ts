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
import { useProjection } from "../lib/ipc";
import { mockTopbar } from "../app/mock-projections";

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

// Mock fallback — the daemon-offline scope still surfaces a coherent
// EMA / EMA Studio / EMA 0.0.5 trio so the scope strip + chrome render
// real values until Wave II wires real identity.
const MOCK_SCOPE: TopbarScope = {
  org: mockTopbar.current_org as TopbarOrg,
  space: mockTopbar.current_space as TopbarSpace,
  project: mockTopbar.current_project as TopbarProject,
};

export function useTopbar(): TopbarView {
  const raw = useProjection<TopbarProjection>("topbar");

  return useMemo(() => {
    if (!raw) {
      // Daemon offline — fall back to mock scope so chrome doesn't blank out.
      return {
        raw: null,
        scope: MOCK_SCOPE,
        node_state: null,
        offline: true,
      };
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
