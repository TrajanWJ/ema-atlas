'use client';

import type { HabitLog } from "@/src/types/habit";

interface StreakGridProps {
	readonly logs: readonly HabitLog[];
	readonly days?: number;
	readonly color?: string;
}

function getDatesForRange(days: number): string[] {
	const dates: string[] = [];
	const today = new Date();
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(today);
		d.setDate(d.getDate() - i);
		dates.push(d.toISOString().slice(0, 10));
	}
	return dates;
}

export function StreakGrid({ logs, days = 30, color = 'var(--place-success)' }: StreakGridProps) {
	const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));
	const dates = getDatesForRange(days);

	return (
		<div
			style={{
				display: "flex",
				gap: "2px",
				flexWrap: "wrap",
				padding: "0.25rem 0",
			}}
			title="Last 30 days"
		>
			{dates.map((date) => {
				const done = completedDates.has(date);
				return (
					<div
						key={date}
						title={date}
						style={{
							width: "8px",
							height: "8px",
							borderRadius: "2px",
							background: done ? color : "var(--place-border-default)",
							flexShrink: 0,
							boxShadow: done ? `0 0 3px ${color}` : 'none',
						}}
					/>
				);
			})}
		</div>
	);
}
