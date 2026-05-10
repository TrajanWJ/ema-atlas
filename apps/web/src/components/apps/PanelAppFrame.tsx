"use client";

/**
 * PanelAppFrame — thin compatibility wrapper around the new shared
 * `VAppFrame` (Sprint 7). Existing imports continue to work; the
 * surface now produces the same `data-app` / `data-vapp-ready`
 * markers as Holodeck and Popout modes.
 */

import { VAppFrame } from "@/src/components/vapp/VAppFrame";
import { registerAllApps } from "@/src/lib/app-registrations";
import { useUrlNav } from "@/src/lib/use-url-nav";
import type { AppId } from "@/src/types/window";

registerAllApps();

export function PanelAppFrame({ appId }: { readonly appId: AppId }) {
	useUrlNav();
	return <VAppFrame appId={appId} mode="holodeck" />;
}
