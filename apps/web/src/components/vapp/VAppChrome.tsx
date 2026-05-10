"use client";

/**
 * VAppChrome — title-bar / mode-switcher chrome shared by Holodeck,
 * vDesktop, and Popout modes.
 *
 * vDesktop windows already carry their own titlebar (the OS-style
 * window chrome rendered by `Window.tsx`), so this component is a
 * no-op there. Holodeck and Popout use it to surface the app label,
 * an icon, and a mode-appropriate action (return to desktop, close
 * popout, etc.).
 */

import Link from "next/link";

import { APP_LABELS } from "@/src/lib/constants";
import { getApp } from "@/src/lib/app-registrations";
import type { AppId } from "@/src/types/window";
import type { VAppMode } from "./VAppFrame";

interface VAppChromeProps {
	readonly appId: AppId;
	readonly mode: VAppMode;
	/** Optional override action (e.g. popout close handler). */
	readonly onClose?: () => void;
}

export function VAppChrome({ appId, mode, onClose }: VAppChromeProps) {
	if (mode === "vdesktop") {
		// The window manager renders its own titlebar/controls.
		return null;
	}

	const label = APP_LABELS[appId] ?? appId;
	const app = getApp(appId);

	return (
		<header
			className="vapp-chrome glass-elevated"
			data-vapp-chrome={appId}
			data-vapp-mode={mode}
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.75rem",
				padding: "0.5rem 0.75rem",
				borderRadius: "1rem",
				border: "1px solid var(--place-border-default)",
				boxShadow: "0 18px 50px rgba(0, 0, 0, 0.28)",
			}}
		>
			<span
				aria-hidden="true"
				style={{
					display: "grid",
					placeItems: "center",
					height: "2.25rem",
					width: "2.25rem",
					flexShrink: 0,
					borderRadius: "0.75rem",
					background: "rgba(255,255,255,0.06)",
					border: "1px solid var(--place-border-subtle)",
					color: "var(--place-text-primary)",
				}}
			>
				{app?.icon ?? label.slice(0, 1)}
			</span>
			<div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
				<span
					style={{
						fontSize: "10px",
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						color: "var(--place-text-tertiary)",
					}}
				>
					{mode === "popout" ? "Popout" : "Workspace surface"}
				</span>
				<h1
					style={{
						fontSize: "0.875rem",
						fontWeight: 600,
						margin: 0,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{label}
				</h1>
			</div>
			{mode === "holodeck" ? (
				<Link
					href={`/?vapp=${appId}`}
					style={{
						display: "inline-flex",
						alignItems: "center",
						height: "2rem",
						padding: "0 0.75rem",
						borderRadius: "0.5rem",
						fontSize: "12px",
						fontWeight: 600,
						color: "var(--place-text-secondary)",
						border: "1px solid var(--place-border-default)",
						background: "rgba(255,255,255,0.035)",
						textDecoration: "none",
					}}
				>
					Open on desktop
				</Link>
			) : null}
			{mode === "popout" && onClose ? (
				<button
					type="button"
					onClick={onClose}
					style={{
						height: "2rem",
						padding: "0 0.75rem",
						borderRadius: "0.5rem",
						fontSize: "12px",
						fontWeight: 600,
						color: "var(--place-text-secondary)",
						border: "1px solid var(--place-border-default)",
						background: "rgba(255,255,255,0.035)",
						cursor: "pointer",
					}}
				>
					Close
				</button>
			) : null}
		</header>
	);
}
