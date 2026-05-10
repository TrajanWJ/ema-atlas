"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useIpcConnection } from "@/src/lib/ipc";
import { useTopbar } from "@/src/projections/use-topbar";
import { useAuthStore } from "@/src/stores/auth-store";
import { EntryChooser, type EntryTarget } from "./EntryChooser";

interface EmaIdentityPanelProps {
	readonly onContinue: () => void;
}

/**
 * EMA Identity Panel — replaces place.org's AuthPanel inside Tauri builds.
 *
 * The voice: declarative, sober, no auth ceremony. The user is on their
 * own machine; the daemon owns identity; the app surfaces what it knows.
 *
 * Until Wave II wires real daemon-bound identity:
 *   - hostname: from os hostname (Tauri) or "this machine" fallback
 *   - scope: from useTopbar() projection (mock fallback returns the EMA
 *     Workspace / EMA Studio / EMA 0.0.6 trio)
 *   - daemon status: live from useIpcConnection()
 */
export function EmaIdentityPanel({ onContinue }: EmaIdentityPanelProps) {
	const quickLogin = useAuthStore((s) => s.quickLogin);
	const { scope } = useTopbar();
	const ipcState = useIpcConnection();
	const [hostname, setHostname] = useState("this machine");

	// Hostname via Tauri internals when available. Tauri v2 moved the os
	// module to a separate plugin (@tauri-apps/plugin-os); we don't ship
	// that plugin yet, so we read what's exposed on the global Tauri
	// metadata or fall back to "this machine". Real hostname binding wires
	// in Wave II identity overhaul.
	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const w = window as unknown as {
				__TAURI_INTERNALS__?: {
					metadata?: { currentWebview?: { label?: string } };
				};
				navigator?: Navigator;
			};
			// Best-effort: prefer macOS default form. We don't have an OS
			// hostname API without the plugin; this is a Wave II thread.
			const platformHint = w.navigator?.platform ?? "";
			if (platformHint.includes("Mac")) setHostname("local mac");
			else if (platformHint.includes("Win")) setHostname("local pc");
			else if (platformHint.includes("Linux")) setHostname("local box");
		} catch {
			// keep fallback
		}
	}, []);

	const orgName = scope.org?.name ?? "EMA Workspace";
	const spaceName = scope.space?.name ?? "EMA Studio";
	const projectName = scope.project?.name ?? "EMA 0.0.6";

	function handleEntry(target: EntryTarget) {
		// In Tauri the user's already on their machine; quickLogin keeps the
		// pre-existing UX (auto-bind to dev-trajan) until Wave II identity.
		quickLogin("dev-trajan");
		if (target === "vdesktop") {
			onContinue();
			return;
		}
		if (typeof window === "undefined") {
			onContinue();
			return;
		}
		// Holodeck inside Tauri is the launchpad surface. Portfolio is hidden
		// inside Tauri (the immersive routes block themselves there), but if
		// it's ever surfaced we route through the same boot event.
		if (target === "holodeck") {
			window.dispatchEvent(new CustomEvent("boot-holodeck"));
			return;
		}
		window.dispatchEvent(new CustomEvent("boot-portfolio"));
	}

	const daemonOnline = ipcState === "open";
	const daemonLine = daemonOnline
		? "Daemon: connected."
		: "Daemon: not detected. Local mode.";

	return (
		<motion.div
			initial={{ opacity: 0, y: 4 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.22, ease: [0.65, 0.05, 0, 1] }}
			className="ema-identity-panel"
			style={{
				background: "var(--place-surface-1)",
				border: "1px solid var(--place-border-default)",
				borderRadius: 12,
				padding: "24px 26px",
				width: 360,
				color: "var(--place-text-primary)",
				boxShadow:
					"0 12px 50px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset",
				display: "flex",
				flexDirection: "column",
				gap: 16,
			}}
		>
			<header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
				<span
					style={{
						fontSize: "0.62rem",
						letterSpacing: "0.14em",
						textTransform: "uppercase",
						color: "var(--place-secondary-400)",
					}}
				>
					Step 02 · choose entry
				</span>
				<h1 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 600 }}>
					Where do you want to land?
				</h1>
				<p
					style={{
						margin: 0,
						fontSize: "0.72rem",
						color: "var(--place-text-secondary)",
						lineHeight: 1.4,
					}}
				>
					Trajan @ {hostname} · {orgName} / {spaceName} / {projectName}
				</p>
			</header>

			{/* Headline action — entry chooser. Portfolio hidden inside Tauri:
			    immersive routes self-block there anyway, so it'd be a dead end. */}
			<EntryChooser onSelect={handleEntry} showPortfolio={false} />

			<footer
				style={{
					fontSize: "0.7rem",
					color: "var(--place-text-muted)",
					display: "flex",
					alignItems: "center",
					gap: 6,
					justifyContent: "space-between",
					marginTop: 4,
				}}
			>
				<span>{daemonLine}</span>
				<span
					style={{
						width: 6,
						height: 6,
						borderRadius: "50%",
						background: daemonOnline
							? "var(--place-success)"
							: "var(--place-text-muted)",
					}}
				/>
			</footer>
		</motion.div>
	);
}
