"use client";

/**
 * VAppSurface — the inner content surface for a vApp, in any mode.
 *
 * Renders the vApp via the registry-backed `AppContent` dispatcher and
 * publishes the cockpit-specific readiness marker
 * (`data-cockpit-ready`) so Sprint 9 tests can assert on it directly.
 *
 * Holodeck/vDesktop/popout all share this surface; mode-specific chrome
 * lives in `VAppChrome`, mode-specific layout lives in `VAppFrame`.
 */

import type { ReactNode } from "react";

import { AppContent } from "@/src/components/window-manager/AppContent";
import type { AppId } from "@/src/types/window";
import type { VAppMode, VAppReadyState } from "./VAppFrame";

interface VAppSurfaceProps {
	readonly appId: AppId;
	readonly mode: VAppMode;
	readonly readyState: VAppReadyState;
	readonly children?: ReactNode;
}

export function VAppSurface({ appId, mode, readyState, children }: VAppSurfaceProps) {
	const isCockpit = appId === "cockpit";

	return (
		<div
			className="vapp-surface"
			data-vapp-surface={appId}
			data-vapp-mode={mode}
			{...(isCockpit ? { "data-cockpit-ready": readyState } : {})}
			style={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				minHeight: 0,
				overflow: "auto",
			}}
		>
			{children ?? <AppContent appId={appId} />}
		</div>
	);
}
