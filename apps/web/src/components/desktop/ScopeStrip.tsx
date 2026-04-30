"use client";

import { useTopbar } from "@/src/projections/use-topbar";
import { useIpcConnection } from "@/src/lib/ipc";

/**
 * ScopeStrip — 28px tall workspace identity strip mounted ABOVE the
 * ambient bar. Shows org · space · project + daemon connection state.
 *
 * Lives at z-40 (under AmbientBar's z-50). Reads scope from useTopbar()
 * which falls back to mockTopbar when the daemon is offline (so we always
 * render real-feeling values instead of blanking).
 *
 * Wave I.5.F: chrome only — clicking the values is a no-op until Wave II
 * wires the org/space/project switcher.
 */
export function ScopeStrip() {
	const { scope, offline } = useTopbar();
	const ipcState = useIpcConnection();

	const orgName = scope.org?.name ?? "—";
	const spaceName = scope.space?.name ?? "—";
	const projectName = scope.project?.name ?? "—";

	const daemonOnline = ipcState === "open";

	return (
		<div
			className="ema-scope-strip glass-elevated"
			role="navigation"
			aria-label="Workspace scope"
			style={{
				position: "absolute",
				top: 40, // sits directly under the 40px ambient bar
				left: 0,
				right: 0,
				height: 28,
				zIndex: 40,
				display: "flex",
				alignItems: "center",
				gap: 12,
				padding: "0 16px",
				fontSize: "0.72rem",
				color: "var(--place-text-secondary)",
				borderTop: "1px solid var(--place-border-subtle)",
				borderBottom: "1px solid var(--place-border-subtle)",
			}}
		>
			<ScopeSegment label="org" value={orgName} />
			<Chevron />
			<ScopeSegment label="space" value={spaceName} />
			<Chevron />
			<ScopeSegment label="project" value={projectName} />
			<div style={{ flex: 1 }} />
			<DaemonBadge online={daemonOnline} offline={offline} />
		</div>
	);
}

function ScopeSegment({ label, value }: { label: string; value: string }) {
	return (
		<button
			type="button"
			title={`${label}: ${value} (switcher coming in Wave II)`}
			style={{
				display: "inline-flex",
				alignItems: "baseline",
				gap: 6,
				padding: "0 4px",
				border: "none",
				background: "transparent",
				color: "inherit",
				cursor: "default",
				font: "inherit",
				lineHeight: 1.4,
			}}
		>
			<span
				style={{
					fontSize: "0.6rem",
					letterSpacing: "0.1em",
					textTransform: "uppercase",
					color: "var(--place-text-tertiary)",
				}}
			>
				{label}
			</span>
			<strong
				style={{
					color: "var(--place-text-primary)",
					fontWeight: 500,
				}}
			>
				{value}
			</strong>
		</button>
	);
}

function Chevron() {
	return (
		<span
			aria-hidden="true"
			style={{
				color: "var(--place-text-muted)",
				fontSize: "0.7rem",
			}}
		>
			›
		</span>
	);
}

function DaemonBadge({ online, offline }: { online: boolean; offline: boolean }) {
	const label = online
		? "daemon connected"
		: offline
		? "daemon offline · local mode"
		: "daemon connecting…";
	const dotColor = online
		? "var(--place-success)"
		: "var(--place-text-muted)";
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 6,
				fontSize: "0.65rem",
				color: "var(--place-text-tertiary)",
			}}
		>
			<span
				style={{
					width: 6,
					height: 6,
					borderRadius: "50%",
					background: dotColor,
				}}
			/>
			{label}
		</span>
	);
}
