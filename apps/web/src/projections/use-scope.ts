"use client";

/**
 * use-scope — convenience hook composing `useTopbar()` + `useIpcConnection()`.
 *
 * Surfaces should prefer this over reaching into `mock-projections.EMA_SCOPE`
 * directly. The hook returns the live daemon scope when available, the mock
 * fallback when offline, and an `isLive` flag so callers can render honest
 * "daemon connecting…" / "daemon offline" pills when the scope is not real.
 *
 * `useTopbar()` already does the projection subscription + mock fallback;
 * `useIpcConnection()` reports the WebSocket lifecycle. This hook combines
 * the two so the launchpad / sidebar / scope strip don't each have to.
 */

import { useMemo } from "react";

import { useIpcConnection } from "@/src/lib/ipc";
import { useTopbar, type TopbarScope } from "@/src/projections/use-topbar";

export type ScopeView = {
	readonly scope: TopbarScope;
	readonly orgName: string;
	readonly spaceName: string;
	readonly projectName: string;
	readonly isLive: boolean;
	readonly offline: boolean;
	readonly daemonState: ReturnType<typeof useIpcConnection>;
};

const DASH = "—";

export function useScope(): ScopeView {
	const topbar = useTopbar();
	const ipcState = useIpcConnection();

	return useMemo(() => {
		const isLive = !topbar.offline && ipcState === "open";
		return {
			scope: topbar.scope,
			orgName: topbar.scope.org?.name ?? DASH,
			spaceName: topbar.scope.space?.name ?? DASH,
			projectName: topbar.scope.project?.name ?? DASH,
			isLive,
			offline: topbar.offline,
			daemonState: ipcState,
		};
	}, [topbar, ipcState]);
}
