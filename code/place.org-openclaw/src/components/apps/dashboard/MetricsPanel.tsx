'use client';

import { useDashboardStore } from "@/src/stores/dashboard-store";

function formatMs(ms: number): string {
	const totalMinutes = Math.floor(ms / 60000);
	if (totalMinutes === 0) return "0m";
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	return `${minutes}m`;
}

interface MetricCardProps {
	readonly label: string;
	readonly value: string;
	readonly color?: string;
}

function MetricCard({ label, value, color = "var(--text-primary)" }: MetricCardProps) {
	return (
		<div
			style={{
				padding: "1rem",
				background: "var(--bg-glass)",
				border: "1px solid var(--border)",
				borderRadius: "8px",
				flex: 1,
			}}
		>
			<div
				style={{
					color: "var(--text-secondary)",
					fontSize: "0.65rem",
					textTransform: "uppercase",
					letterSpacing: "0.08em",
					marginBottom: "0.4rem",
				}}
			>
				{label}
			</div>
			<div
				style={{
					color,
					fontSize: "1.4rem",
					fontWeight: 700,
					fontVariantNumeric: "tabular-nums",
				}}
			>
				{value}
			</div>
		</div>
	);
}

export function MetricsPanel() {
	const todayFocusMs = useDashboardStore((s) => s.todayFocusMs);
	const todayDumpsProcessed = useDashboardStore((s) => s.todayDumpsProcessed);
	const journalWritten = useDashboardStore((s) => s.journalWritten);

	return (
		<div
			style={{
				padding: "1.5rem",
				display: "flex",
				gap: "1rem",
			}}
		>
			<MetricCard
				label="Focus Time"
				value={formatMs(todayFocusMs)}
				color="var(--accent-blue)"
			/>
			<MetricCard
				label="Dumps Processed"
				value={String(todayDumpsProcessed)}
				color="var(--accent-success)"
			/>
			<MetricCard
				label="Journal"
				value={journalWritten ? "✓ written" : "not yet"}
				color={journalWritten ? "var(--accent-success)" : "var(--text-secondary)"}
			/>
		</div>
	);
}
