'use client';

import { useEffect, useState } from "react";
import { useHabitStore } from "@/src/stores/habit-store";
import { HabitRow } from "./HabitRow";
import { AddHabitForm } from "./AddHabitForm";
import { HabitTabs } from "./HabitTabs";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { StreaksView } from "./StreaksView";
import type { HabitTab } from "./HabitTabs";
import type { HabitFrequency } from "@/src/types/habit";

const MAX_HABITS = 7;

export function HabitsApp() {
	const { habits, todayLogs, loading, load, addHabit, archiveHabit, toggleToday } = useHabitStore();
	const [showForm, setShowForm] = useState(false);
	const [activeTab, setActiveTab] = useState<HabitTab>('today');

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
			{/* Tab navbar */}
			<HabitTabs activeTab={activeTab} onTabChange={setActiveTab} />

			{/* Header — only on Today tab */}
			{activeTab === 'today' && (
				<TodayHeader
					count={habits.length}
					max={MAX_HABITS}
					atLimit={atLimit}
					showForm={showForm}
					onShowForm={() => setShowForm(true)}
				/>
			)}

			{/* Limit warning */}
			{activeTab === 'today' && atLimit && <LimitWarning />}

			{/* Add form */}
			{activeTab === 'today' && showForm && !atLimit && (
				<AddHabitForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
			)}

			{/* View content */}
			{activeTab === 'today' && (
				<TodayContent
					habits={habits}
					todayLogs={todayLogs}
					loading={loading}
					onToggle={handleToggle}
					onArchive={handleArchive}
				/>
			)}
			{activeTab === 'week' && <WeekView />}
			{activeTab === 'month' && <MonthView />}
			{activeTab === 'streaks' && <StreaksView />}
		</div>
	);
}

// --- Sub-components to keep HabitsApp under 50 lines of logic ---

interface TodayHeaderProps {
	readonly count: number;
	readonly max: number;
	readonly atLimit: boolean;
	readonly showForm: boolean;
	readonly onShowForm: () => void;
}

function TodayHeader({ count, max, atLimit, showForm, onShowForm }: TodayHeaderProps) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "0.5rem 0.75rem",
				borderBottom: "1px solid var(--place-border-default)",
				flexShrink: 0,
			}}
		>
			<span style={{ fontSize: "0.7rem", color: "var(--place-text-secondary)" }}>
				{count}/{max} habits
			</span>
			{!showForm && (
				<button
					type="button"
					onClick={onShowForm}
					disabled={atLimit}
					title={atLimit ? "Archive a habit to add more" : "Add habit"}
					style={{
						fontSize: "0.7rem",
						color: atLimit ? "var(--place-text-secondary)" : "var(--place-secondary-400)",
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
	);
}

function LimitWarning() {
	return (
		<div
			style={{
				padding: "0.4rem 0.75rem",
				fontSize: "0.65rem",
				color: "var(--place-tertiary-400)",
				background: "rgba(249,115,22,0.1)",
				borderBottom: "1px solid var(--place-border-default)",
			}}
		>
			Limit reached (7 max). Archive one to add more.
		</div>
	);
}

interface TodayContentProps {
	readonly habits: readonly import("@/src/types/habit").Habit[];
	readonly todayLogs: readonly import("@/src/types/habit").HabitLog[];
	readonly loading: boolean;
	readonly onToggle: (id: string) => void;
	readonly onArchive: (id: string) => void;
}

function TodayContent({ habits, todayLogs, loading, onToggle, onArchive }: TodayContentProps) {
	if (loading) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flex: 1,
					color: "var(--place-text-secondary)",
					fontSize: "0.75rem",
				}}
			>
				Loading...
			</div>
		);
	}

	if (habits.length === 0) {
		return (
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					flex: 1,
					gap: "0.5rem",
					padding: "2rem",
				}}
			>
				<svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="var(--place-text-ghost, rgba(255,255,255,0.15))" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
					<polyline points="17 1 21 5 17 9" />
					<path d="M3 11V9a4 4 0 0 1 4-4h14" />
					<polyline points="7 23 3 19 7 15" />
					<path d="M21 13v2a4 4 0 0 1-4 4H3" />
				</svg>
				<span style={{ fontSize: "0.8rem", color: "var(--place-text-muted, rgba(255,255,255,0.25))" }}>
					Track your daily habits
				</span>
				<span style={{ fontSize: "0.6rem", color: "var(--place-text-muted, rgba(255,255,255,0.25))" }}>
					Click Add to get started
				</span>
			</div>
		);
	}

	return (
		<div style={{ overflowY: "auto", flex: 1 }}>
			{habits.map((habit) => {
				const todayLog = todayLogs.find((l) => l.habitId === habit.id);
				return (
					<HabitRow
						key={habit.id}
						habit={habit}
						todayLog={todayLog}
						onToggle={() => onToggle(habit.id)}
						onArchive={() => onArchive(habit.id)}
					/>
				);
			})}
		</div>
	);
}
