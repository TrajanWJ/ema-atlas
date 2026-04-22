'use client';

import { useEffect, useState, useCallback } from "react";
import { useHabitStore, getHabitColor, calculateStreak } from "@/src/stores/habit-store";
import type { Habit, HabitLog } from "@/src/types/habit";
import { todayStr, toDateStr } from "./date-helpers";

interface HabitStats {
	readonly habitId: string;
	readonly currentStreak: number;
	readonly longestStreak: number;
	readonly completionRate: number;
	readonly totalCompletions: number;
	readonly daysSinceCreation: number;
}

export function StreaksView() {
	const habits = useHabitStore((s) => s.habits);
	const getAllLogsForHabit = useHabitStore((s) => s.getAllLogsForHabit);
	const [statsMap, setStatsMap] = useState<Map<string, HabitStats>>(new Map());

	const loadStats = useCallback(async () => {
		const today = todayStr();
		const entries = await Promise.all(
			habits.map(async (habit) => {
				const logs = await getAllLogsForHabit(habit.id);
				const stats = computeStats(habit, logs, today);
				return [habit.id, stats] as const;
			}),
		);
		setStatsMap(new Map(entries));
	}, [habits, getAllLogsForHabit]);

	useEffect(() => {
		loadStats().catch(() => {});
	}, [loadStats]);

	// Sort by longest current streak
	const sorted = [...habits].sort((a, b) => {
		const sa = statsMap.get(a.id)?.currentStreak ?? 0;
		const sb = statsMap.get(b.id)?.currentStreak ?? 0;
		return sb - sa;
	});

	return (
		<div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
			{sorted.length === 0 && (
				<div style={{ color: 'var(--place-text-secondary)', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>
					No habits yet.
				</div>
			)}
			{sorted.map((habit, idx) => {
				const origIdx = habits.indexOf(habit);
				const color = getHabitColor(habit, origIdx);
				const stats = statsMap.get(habit.id);
				return (
					<HabitStatsCard
						key={habit.id}
						habit={habit}
						color={color}
						stats={stats}
						isLast={idx === sorted.length - 1}
					/>
				);
			})}
		</div>
	);
}

interface HabitStatsCardProps {
	readonly habit: Habit;
	readonly color: string;
	readonly stats: HabitStats | undefined;
	readonly isLast: boolean;
}

function HabitStatsCard({ habit, color, stats, isLast }: HabitStatsCardProps) {
	return (
		<div
			style={{
				padding: '0.5rem 0.25rem',
				borderBottom: isLast ? 'none' : '1px solid var(--place-border-default)',
			}}
		>
			{/* Header */}
			<div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
				<span
					style={{
						width: '8px',
						height: '8px',
						borderRadius: '50%',
						background: color,
						flexShrink: 0,
					}}
				/>
				<span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--place-text-primary)' }}>
					{habit.name}
				</span>
			</div>

			{/* Stats row */}
			{stats ? (
				<>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.25rem', marginBottom: '0.35rem' }}>
						<StatCell label="Current" value={`${stats.currentStreak}d`} color={color} highlight />
						<StatCell label="Longest" value={`${stats.longestStreak}d`} color={color} />
						<StatCell label="Rate" value={`${stats.completionRate}%`} color={color} />
						<StatCell label="Total" value={String(stats.totalCompletions)} color={color} />
					</div>
					<StreakBar
						current={stats.currentStreak}
						longest={stats.longestStreak}
						color={color}
					/>
				</>
			) : (
				<div style={{ fontSize: '0.65rem', color: 'var(--place-text-secondary)' }}>Loading...</div>
			)}
		</div>
	);
}

interface StatCellProps {
	readonly label: string;
	readonly value: string;
	readonly color: string;
	readonly highlight?: boolean;
}

function StatCell({ label, value, color, highlight }: StatCellProps) {
	return (
		<div style={{ textAlign: 'center' }}>
			<div
				style={{
					fontSize: '0.85rem',
					fontWeight: 700,
					color: highlight ? color : 'var(--place-text-primary)',
				}}
			>
				{value}
			</div>
			<div style={{ fontSize: '0.55rem', color: 'var(--place-text-secondary)' }}>{label}</div>
		</div>
	);
}

interface StreakBarProps {
	readonly current: number;
	readonly longest: number;
	readonly color: string;
}

function StreakBar({ current, longest, color }: StreakBarProps) {
	const maxDisplay = Math.max(longest, 1);
	const currentPct = Math.min((current / maxDisplay) * 100, 100);
	const longestPct = 100;

	return (
		<div style={{ position: 'relative', height: '6px', borderRadius: '3px', background: 'var(--place-border-default)', overflow: 'hidden' }}>
			{/* Longest streak (full width at reduced opacity) */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					height: '100%',
					width: `${longestPct}%`,
					background: color,
					opacity: 0.2,
					borderRadius: '3px',
				}}
			/>
			{/* Current streak */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					height: '100%',
					width: `${currentPct}%`,
					background: color,
					borderRadius: '3px',
					transition: 'width 0.3s ease',
				}}
			/>
		</div>
	);
}

// Pure computation helpers

function computeStats(
	habit: Habit,
	logs: readonly HabitLog[],
	today: string,
): HabitStats {
	const completedDates = new Set(
		logs.filter((l) => l.completed).map((l) => l.date),
	);

	const currentStreak = calculateStreak(logs, today);
	const longestStreak = calcLongestStreak(completedDates);
	const totalCompletions = completedDates.size;
	const daysSinceCreation = calcDaysBetween(habit.createdAt.slice(0, 10), today);
	const completionRate = daysSinceCreation > 0
		? Math.round((totalCompletions / daysSinceCreation) * 100)
		: 0;

	return {
		habitId: habit.id,
		currentStreak,
		longestStreak,
		completionRate: Math.min(completionRate, 100),
		totalCompletions,
		daysSinceCreation,
	};
}

function calcLongestStreak(completedDates: Set<string>): number {
	if (completedDates.size === 0) return 0;

	const sorted = [...completedDates].sort();
	let longest = 1;
	let current = 1;

	for (let i = 1; i < sorted.length; i++) {
		const prevStr = sorted[i - 1];
		const currStr = sorted[i];
		if (!prevStr || !currStr) continue;
		const prev = new Date(prevStr);
		const curr = new Date(currStr);
		const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
		if (Math.round(diff) === 1) {
			current++;
			longest = Math.max(longest, current);
		} else {
			current = 1;
		}
	}
	return longest;
}

function calcDaysBetween(startDate: string, endDate: string): number {
	const start = new Date(startDate);
	const end = new Date(endDate);
	const diff = end.getTime() - start.getTime();
	return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
}
