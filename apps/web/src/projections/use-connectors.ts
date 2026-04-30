/**
 * use-connectors — subscribe to the daemon's `git_ema.user_connectors`
 * projection.
 *
 * When the daemon writer is offline (e.g. bundled .app shell), this hook
 * returns the staged `gitEmaUserConnectorsProjection` mock with
 * `offline: true` so the git-ema vApp renders coherent content instead
 * of blanking.
 *
 * Shape: `UserConnectorsProjection` in `@ema/surface-core/adapter`.
 */

import { useMemo } from "react";
import type { UserConnectorsProjection } from "@ema/surface-core/adapter";
import { useProjection } from "../lib/ipc";
import { gitEmaUserConnectorsProjection } from "../app/mock-projections";

export type ConnectorsView = {
	data: UserConnectorsProjection | null;
	offline: boolean;
};

const MOCK_CONNECTORS = gitEmaUserConnectorsProjection as unknown as UserConnectorsProjection;

export function useConnectors(): ConnectorsView {
	const data = useProjection<UserConnectorsProjection>("git_ema.user_connectors");
	return useMemo(
		() => (data ? { data, offline: false } : { data: MOCK_CONNECTORS, offline: true }),
		[data],
	);
}
