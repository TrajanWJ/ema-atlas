'use client';

import { useEffect, useState } from "react";
import { useHabitStore } from "@/src/stores/habit-store";
import { StreakGrid } from "./StreakGrid";
import type { Habit, HabitLog } from "@/src/types/habit";
import { getDbClient } from "@/src/db/client";
import { getLogsForDateRange } from "@/src/db/queries/habits";

interface HabitRowProps {
	readonly habit: Habit;
	readonly todayLog: HabitLog | undefined;
	readonly onToggle: () => void;
	readonly onArchive: () => void;
}

export function HabitRow({ habit, todayLog, onToggle, onArchive }: HabitRowProps) {
	const getStreak = useHabitStore((s) => s.getStreak);
	const [streak, setStreak] = useState(0);
	const [logs, setLogs] = useState<readonly HabitLog[]>([]);

	useEffect(() => {
		getStreak(habit.id).then(setStreak).catch(() => {});

		// Load last 30 days for grid
		const today = new Date();
		const start = new Date(today);
		start.setDate(start.getDate() - 29);
		const db = getDbClient();
		getLogsForDateRange(
			db,
			habit.id,
			start.toISOString().slice(0, 10),
			today.toISOString().slice(0, 10),
		).then(setLogs).catch(() => {});
	}, [habit.id, getStreak, todayLog]);

	const isCompleted = todayLog?.completed ?? false;

	return (
		<div
			style={{
				borderBottom: "1px solid var(--border)",
				padding: "0.5rem 0.75rem",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
				{/* Today checkbox */}
				<button
					type="button"
					onClick={onToggle}
					style={{
						width: "1.1rem",
						height: "1.1rem",
						borderRadius: "4px",
						border: `2px solid var(--accent-green, #22c55e)`,
						background: isCompleted ? "var(--accent-green, #22c55e)" : "transparent",
						cursor: "pointer",
						flexShrink: 0,
						padding: 0,
						fontSize: "0.6rem",
						color: "white",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
					title={isCompleted ? "Mark incomplete" : "Mark complete"}
				>
					{isCompleted ? "✓" : ""}
				</button>

				{/* Name + target */}
				<div style={{ flex: 1, overflow: "hidden" }}>
					<div
						style={{
							fontSize: "0.8rem",
							color: "var(--text-primary)",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{habit.name}
					</div>
					{habit.target && (
						<div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
							{habit.target} · {habit.frequency}
						</div>
					)}
				</div>

				{/* Streak */}
				<span
					style={{
						fontSize: "0.7rem",
						color: streak > 0 ? "var(--accent-warm, #f97316)" : "var(--text-secondary)",
						fontWeight: streak > 0 ? 600 : 400,
						flexShrink: 0,
					}}
					title={`${streak} day streak`}
				>
					{streak > 0 ? `🔥 ${streak}` : "—"}
				</span>

				{/* Archive */}
				<button
					type="button"
					onClick={onArchive}
					title="Archive habit"
					style={{
						background: "transparent",
						border: "none",
						cursor: "pointer",
						color: "var(--text-secondary)",
						fontSize: "0.65rem",
						padding: "0.1rem 0.25rem",
						flexShrink: 0,
					}}
				>
					×
				</button>
			</div>

			{/* Streak grid */}
			<StreakGrid logs={logs} days={30} />
		</div>
	);
}
