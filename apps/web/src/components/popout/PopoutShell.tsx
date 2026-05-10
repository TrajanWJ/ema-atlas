'use client';

import { useEffect, useState } from "react";
import { VAppFrame } from "@/src/components/vapp/VAppFrame";
import { PopoutTitleBar } from "./PopoutTitleBar";
import { APP_LABELS } from "@/src/lib/constants";
import { resolveVappRoute } from "@/src/lib/vapp-route-contract";
import type { AppId } from "@/src/types/window";

// ----------------------------------------------------------------------------
// Validation — delegated to the shared route contract.
// ----------------------------------------------------------------------------

function resolvePopoutAppId(value: string): AppId | null {
	const resolved = resolveVappRoute(value);
	return resolved ? (resolved.id as AppId) : null;
}

// ----------------------------------------------------------------------------
// Shell detection
// ----------------------------------------------------------------------------

function isCompanionMode(): boolean {
	if (typeof window === "undefined") return false;
	const params = new URLSearchParams(window.location.search);
	return params.get("companion") === "true";
}

function isPopupWindow(): boolean {
	if (typeof window === "undefined") return false;
	return window.name.startsWith("place_tool_");
}

function isInTab(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return window.menubar?.visible === true;
	} catch {
		return false;
	}
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

interface PopoutShellProps {
	readonly appIdParam: string;
}

export function PopoutShell({ appIdParam }: PopoutShellProps) {
	const [mounted, setMounted] = useState(false);
	const [companion, setCompanion] = useState(false);

	useEffect(() => {
		const isCompanion = isCompanionMode();
		setCompanion(isCompanion);
		setMounted(true);

		if (isCompanion) {
			// Force transparent background with !important to override
			// globals.css `body { background-color: var(--place-void) }`.
			// Inline styles can't use !important, so inject a <style> tag.
			const style = document.createElement('style');
			style.textContent = `
				html, body, body > div {
					background: transparent !important;
					background-color: transparent !important;
				}
			`;
			document.head.appendChild(style);
			document.documentElement.style.background = 'transparent';
			document.body.style.background = 'transparent';
		} else {
			document.body.style.backgroundColor = '#060610';
		}
		document.body.style.margin = '0';
		document.body.style.overflow = 'hidden';
	}, []);

	const appId = resolvePopoutAppId(appIdParam);
	if (!appId) {
		return (
			<div
				className="flex h-dvh items-center justify-center"
				style={{
					color: "var(--place-text-secondary, rgba(255,255,255,0.6))",
					backgroundColor: companion ? "transparent" : "#060610",
				}}
			>
				Unknown app: {appIdParam}
			</div>
		);
	}

	const appName = APP_LABELS[appId];

	if (!mounted) {
		return (
			<div
				style={{
					height: "100dvh",
					backgroundColor: "#060610",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					style={{
						height: "38px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						borderBottom: "1px solid rgba(255,255,255,0.04)",
					}}
				>
					<span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
						{appName}
					</span>
				</div>
			</div>
		);
	}

	const isPopup = isPopupWindow();
	const inTab = !isPopup && isInTab();
	// Show titlebar in companion mode OR in browser popup (not in tab)
	const showTitleBar = companion || (isPopup && !inTab);

	return (
		<div
			style={{
				height: "100dvh",
				display: "flex",
				flexDirection: "column",
				backgroundColor: companion ? "transparent" : "var(--place-void, #060610)",
				color: "var(--place-text-primary, rgba(255,255,255,0.87))",
				fontFamily: "var(--place-font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif)",
				// Companion mode: rounded corners + glass clipping
				...(companion ? {
					borderRadius: '12px',
					overflow: 'hidden',
					border: '1px solid rgba(255,255,255,0.08)',
				} : {}),
			}}
		>
			{showTitleBar && (
				<PopoutTitleBar
					appName={appName}
					appId={appId}
					isCompanion={companion}
					onClose={() => window.close()}
				/>
			)}
			<div
				className={companion ? "glass" : undefined}
				style={{
					flex: 1,
					minHeight: 0,
					overflow: "auto",
					display: "flex",
					flexDirection: "column",
					backgroundColor: companion
						? "rgba(8, 9, 14, 0.75)"
						: "var(--place-base, #08090E)",
					backdropFilter: companion ? "blur(24px)" : undefined,
					WebkitBackdropFilter: companion ? "blur(24px)" : undefined,
				}}
			>
				<VAppFrame appId={appId} mode="popout" hideChrome />
			</div>
		</div>
	);
}
