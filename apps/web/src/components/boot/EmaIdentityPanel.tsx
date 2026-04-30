"use client";

import { useEffect, useState, useContext } from "react";
import { motion } from "motion/react";
import { useAuthStore } from "@/src/stores/auth-store";
import { useTopbar } from "@/src/projections/use-topbar";
import { useIpcConnection } from "@/src/lib/ipc";

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
 *     Workspace / EMA Studio / EMA 0.0.5 trio)
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
				__TAURI_INTERNALS__?: { metadata?: { currentWebview?: { label?: string } } };
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
	const projectName = scope.project?.name ?? "EMA 0.0.5";

	function handleEnter() {
		quickLogin("dev-trajan");
		onContinue();
	}

	const daemonOnline = ipcState === "open";
	const daemonLine = daemonOnline
		? "Daemon: connected."
		: "Daemon: not detected. Local mode.";

	return (
		<motion.div
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.65, 0.05, 0, 1] }}
			className="ema-identity-panel"
			style={{
				background: "var(--place-surface-1)",
				border: "1px solid var(--place-border-default)",
				borderRadius: 12,
				padding: "28px 30px",
				width: 340,
				color: "var(--place-text-primary)",
				boxShadow: "0 12px 50px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset",
				display: "flex",
				flexDirection: "column",
				gap: 18,
			}}
		>
			<header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
				<span
					style={{
						fontSize: "0.7rem",
						letterSpacing: "0.12em",
						textTransform: "uppercase",
						color: "var(--place-secondary-400)",
					}}
				>
					EMA · workspace
				</span>
				<h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 600 }}>
					Welcome to EMA
				</h1>
			</header>

			<section
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 6,
					padding: "12px 14px",
					background: "var(--place-surface-2)",
					borderRadius: 8,
					border: "1px solid var(--place-border-subtle)",
				}}
			>
				<div
					style={{
						fontSize: "0.65rem",
						letterSpacing: "0.1em",
						textTransform: "uppercase",
						color: "var(--place-text-tertiary)",
					}}
				>
					identity
				</div>
				<div style={{ fontSize: "0.95rem", fontWeight: 500 }}>
					Trajan{" "}
					<span style={{ color: "var(--place-text-secondary)", fontWeight: 400 }}>
						@ {hostname}
					</span>
				</div>
			</section>

			<section
				style={{
					display: "grid",
					gridTemplateColumns: "60px 1fr",
					gap: "4px 12px",
					padding: "12px 14px",
					background: "var(--place-surface-2)",
					borderRadius: 8,
					border: "1px solid var(--place-border-subtle)",
					fontSize: "0.85rem",
				}}
			>
				<span style={{ color: "var(--place-text-tertiary)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>org</span>
				<span style={{ color: "var(--place-text-primary)" }}>{orgName}</span>
				<span style={{ color: "var(--place-text-tertiary)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>space</span>
				<span style={{ color: "var(--place-text-primary)" }}>{spaceName}</span>
				<span style={{ color: "var(--place-text-tertiary)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>project</span>
				<span style={{ color: "var(--place-text-primary)" }}>{projectName}</span>
			</section>

			<button
				type="button"
				onClick={handleEnter}
				style={{
					padding: "0.7rem 1rem",
					fontSize: "0.9rem",
					fontWeight: 600,
					letterSpacing: "0.02em",
					borderRadius: 8,
					cursor: "pointer",
					border: "1px solid var(--place-primary-400)",
					background: "var(--place-primary-subtle)",
					color: "var(--place-primary-400)",
					transition: "background 0.15s, transform 0.1s",
				}}
				onMouseEnter={(e) => {
					(e.currentTarget as HTMLButtonElement).style.background =
						"var(--place-primary-glow)";
				}}
				onMouseLeave={(e) => {
					(e.currentTarget as HTMLButtonElement).style.background =
						"var(--place-primary-subtle)";
				}}
			>
				→ Enter workspace
			</button>

			<footer
				style={{
					fontSize: "0.7rem",
					color: "var(--place-text-muted)",
					display: "flex",
					alignItems: "center",
					gap: 6,
					justifyContent: "space-between",
				}}
			>
				<span>{daemonLine}</span>
				<span
					style={{
						width: 6,
						height: 6,
						borderRadius: "50%",
						background: daemonOnline ? "var(--place-success)" : "var(--place-text-muted)",
					}}
				/>
			</footer>
		</motion.div>
	);
}
