'use client';

import { useEffect, useState } from "react";
import { useHabitStore } from "@/src/stores/habit-store";
import { HabitRow } from "./HabitRow";
import { AddHabitForm } from "./AddHabitForm";
import type { HabitFrequency } from "@/src/types/habit";

const MAX_HABITS = 7;

export function HabitsApp() {
	const { habits, todayLogs, loading, load, addHabit, archiveHabit, toggleToday } = useHabitStore();
	const [showForm, setShowForm] = useState(false);

	useEffect(() => {
		load().catch(() => {});
	}, [load]);

	const handleAdd = (name: string, frequency: HabitFrequency, target: string | null) => {
		addHabit(name, frequency, target).catch(() => {});
		setShowForm(false);
	};

	const handleToggle = (habitId: string) => {
		toggleToday(habitId).catch(() => {});
	};

	const handleArchive = (habitId: string) => {
		archiveHabit(habitId).catch(() => {});
	};

	const atLimit = habits.length >= MAX_HABITS;

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "0.5rem 0.75rem",
					borderBottom: "1px solid var(--border)",
					flexShrink: 0,
				}}
			>
				<span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
					{habits.length}/{MAX_HABITS} habits
				</span>
				{!showForm && (
					<button
						type="button"
						onClick={() => setShowForm(true)}
						disabled={atLimit}
						title={atLimit ? "Archive a habit to add more" : "Add habit"}
						style={{
							fontSize: "0.7rem",
							color: atLimit ? "var(--text-secondary)" : "var(--accent-blue)",
							background: "transparent",
							border: "1px solid currentColor",
							borderRadius: "4px",
							padding: "0.2rem 0.5rem",
							cursor: atLimit ? "not-allowed" : "pointer",
						}}
					>
						+ Add
					</button>
				)}
			</div>

			{/* Limit warning */}
			{atLimit && (
				<div
					style={{
						padding: "0.4rem 0.75rem",
						fontSize: "0.65rem",
						color: "var(--accent-warm, #f97316)",
						background: "rgba(249,115,22,0.1)",
						borderBottom: "1px solid var(--border)",
					}}
				>
					Limit reached (7 max). Archive one to add more.
				</div>
			)}

			{/* Add form */}
			{showForm && !atLimit && (
				<AddHabitForm
					onAdd={handleAdd}
					onCancel={() => setShowForm(false)}
				/>
			)}

			{/* Habits list */}
			{loading ? (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flex: 1,
						color: "var(--text-secondary)",
						fontSize: "0.75rem",
					}}
				>
					Loading…
				</div>
			) : habits.length === 0 ? (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flex: 1,
						color: "var(--text-secondary)",
						fontSize: "0.75rem",
					}}
				>
					No habits yet. Add one to get started.
				</div>
			) : (
				<div style={{ overflowY: "auto", flex: 1 }}>
					{habits.map((habit) => {
						const todayLog = todayLogs.find((l) => l.habitId === habit.id);
						return (
							<HabitRow
								key={habit.id}
								habit={habit}
								todayLog={todayLog}
								onToggle={() => handleToggle(habit.id)}
								onArchive={() => handleArchive(habit.id)}
							/>
						);
					})}
				</div>
			)}
		</div>
	);
}
