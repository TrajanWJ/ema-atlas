"use client";

/**
 * VAppFrame — the shared outer container for every vApp surface.
 *
 * Sprint 7 contract: Holodeck (`/<appId>`), vDesktop window content
 * (`/?vapp=<appId>`), and the native Popout (`/popout/<appId>`) all
 * mount through this component so they stop drifting apart.
 *
 * Responsibilities:
 *   - Set `data-app="<id>"` and `data-vapp-ready="<state>"` on the
 *     outer element (Sprint 9's deterministic-readiness contract).
 *   - Wrap mode-appropriate chrome (`VAppChrome`) and the inner
 *     content surface (`VAppSurface`).
 *   - Apply the holodeck-specific full-page background — vDesktop
 *     windows and popouts paint their own backgrounds.
 */

import { useContext, useEffect, useState, type ReactNode } from "react";

import { IpcContext } from "@/src/lib/ipc/provider";
import { holodeckInsetStyle } from "@/src/lib/holodeck-layout";
import type { AppId } from "@/src/types/window";

import { VAppChrome } from "./VAppChrome";
import { VAppSurface } from "./VAppSurface";

export type VAppMode = "holodeck" | "vdesktop" | "popout";
export type VAppReadyState = "live" | "staged" | "offline";

interface VAppFrameProps {
	readonly appId: AppId;
	readonly mode: VAppMode;
	/** Optional close handler exposed to the chrome (popout mode). */
	readonly onClose?: () => void;
	/** If provided, replaces the default `<AppContent>` body. */
	readonly children?: ReactNode;
	/** Suppress the chrome strip even in modes where it'd normally render. */
	readonly hideChrome?: boolean;
}

/**
 * Track when the surface has mounted and whether the daemon IPC is
 * reachable. Sprint 7 keeps the heuristic simple — Sprint 8/9 will
 * tighten this with workpack/projection arrival signals.
 */
function useVappReady(): VAppReadyState {
	const ipc = useContext(IpcContext);
	const [mounted, setMounted] = useState(false);
	const [connectionState, setConnectionState] = useState<string>(() =>
		ipc ? ipc.getConnectionState() : "idle",
	);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!ipc) return;
		const unsub = ipc.subscribeConnection((s) => setConnectionState(s));
		return unsub;
	}, [ipc]);

	if (!mounted) return "staged";
	if (connectionState === "offline") return "offline";
	return "live";
}

export function VAppFrame({
	appId,
	mode,
	onClose,
	children,
	hideChrome,
}: VAppFrameProps) {
	const readyState = useVappReady();

	const containerStyle =
		mode === "holodeck"
			? {
					background:
						"radial-gradient(circle at 24% 18%, rgba(45, 212, 168, 0.08), transparent 30%), radial-gradient(circle at 76% 10%, rgba(91, 141, 239, 0.10), transparent 32%), var(--place-void)",
					color: "var(--place-text-primary)",
					fontFamily: "var(--place-font-sans)",
					minHeight: "100dvh",
					...holodeckInsetStyle(),
				}
			: {
					display: "flex",
					flexDirection: "column" as const,
					height: "100%",
					minHeight: 0,
				};

	const innerStyle =
		mode === "holodeck"
			? {
					display: "flex",
					flexDirection: "column" as const,
					gap: "0.75rem",
					padding: "0.75rem",
					minHeight: "100dvh",
				}
			: {
					display: "flex",
					flexDirection: "column" as const,
					flex: 1,
					minHeight: 0,
				};

	const showChrome = !hideChrome && mode === "holodeck";

	return (
		<main
			data-app={appId}
			data-vapp-ready={readyState}
			data-vapp-mode={mode}
			style={containerStyle}
		>
			<div style={innerStyle}>
				{showChrome ? <VAppChrome appId={appId} mode={mode} onClose={onClose} /> : null}
				<section
					className={mode === "holodeck" ? "glass" : undefined}
					data-panel-app={appId}
					style={
						mode === "holodeck"
							? {
									flex: 1,
									minHeight: 0,
									overflow: "auto",
									borderRadius: "1rem",
									border: "1px solid var(--place-border-subtle)",
									background: "rgba(8, 9, 14, 0.72)",
									boxShadow: "0 18px 60px rgba(0, 0, 0, 0.24)",
									display: "flex",
									flexDirection: "column",
								}
							: {
									flex: 1,
									minHeight: 0,
									display: "flex",
									flexDirection: "column",
								}
					}
				>
					<VAppSurface appId={appId} mode={mode} readyState={readyState}>
						{children}
					</VAppSurface>
				</section>
			</div>
		</main>
	);
}
