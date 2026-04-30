'use client';

import { motion } from "motion/react";
import { useFocusStore } from "@/src/stores/focus-store";

function formatMs(ms: number): string {
	const totalMinutes = Math.floor(ms / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

function Stat({ label, value, delay }: {
	readonly label: string;
	readonly value: string;
	readonly delay: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay, duration: 0.3 }}
			style={{ textAlign: "center" }}
		>
			<div
				style={{
					color: "var(--place-text-primary)",
					fontSize: "0.95rem",
					fontVariantNumeric: "tabular-nums",
					fontWeight: 600,
				}}
			>
				{value}
			</div>
			<div
				style={{
					color: "var(--place-text-secondary)",
					fontSize: "0.6rem",
					textTransform: "uppercase",
					letterSpacing: "0.06em",
					marginTop: "0.1rem",
				}}
			>
				{label}
			</div>
		</motion.div>
	);
}

export function SessionStats() {
	const stats = useFocusStore((s) => s.todayStats);

	return (
		<div
			style={{
				display: "flex",
				gap: "1.5rem",
				justifyContent: "center",
				padding: "0.6rem 0",
				borderTop: "1px solid var(--place-border-default)",
			}}
		>
			<Stat label="Today" value={formatMs(stats.totalFocusMs)} delay={0} />
			<Stat label="Sessions" value={String(stats.sessionCount)} delay={0.05} />
			<Stat label="Avg Block" value={formatMs(stats.avgBlockMs)} delay={0.1} />
		</div>
	);
}
