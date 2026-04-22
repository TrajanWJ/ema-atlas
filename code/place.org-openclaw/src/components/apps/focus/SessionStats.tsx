'use client';

import { useFocusStore } from "@/src/stores/focus-store";

function formatMs(ms: number): string {
	const totalMinutes = Math.floor(ms / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

export function SessionStats() {
	const stats = useFocusStore((s) => s.todayStats);

	return (
		<div
			style={{
				display: "flex",
				gap: "1.5rem",
				justifyContent: "center",
				padding: "0.75rem 0",
				borderTop: "1px solid var(--border)",
			}}
		>
			<Stat label="Today" value={formatMs(stats.totalFocusMs)} />
			<Stat label="Sessions" value={String(stats.sessionCount)} />
			<Stat label="Avg Block" value={formatMs(stats.avgBlockMs)} />
		</div>
	);
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
	return (
		<div style={{ textAlign: "center" }}>
			<div
				style={{
					color: "var(--text-primary)",
					fontSize: "1rem",
					fontVariantNumeric: "tabular-nums",
					fontWeight: 600,
				}}
			>
				{value}
			</div>
			<div
				style={{
					color: "var(--text-secondary)",
					fontSize: "0.65rem",
					textTransform: "uppercase",
					letterSpacing: "0.06em",
					marginTop: "0.1rem",
				}}
			>
				{label}
			</div>
		</div>
	);
}
