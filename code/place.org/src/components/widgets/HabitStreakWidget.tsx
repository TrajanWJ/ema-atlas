'use client';

import { useEffect, useState, useCallback } from 'react';
import { useHabitStore } from '@/src/stores/habit-store';
import { useWindowStore } from '@/src/stores/window-store';

// ---------------------------------------------------------------------------
// Streak cache
// ---------------------------------------------------------------------------

function useCachedStreaks(habitIds: readonly string[]) {
	const getStreak = useHabitStore((s) => s.getStreak);
	const [streaks, setStreaks] = useState<Record<string, number>>({});

	useEffect(() => {
		let cancelled = false;
		async function loadStreaks() {
			const result: Record<string, number> = {};
			for (const id of habitIds) {
				result[id] = await getStreak(id);
			}
			if (!cancelled) setStreaks(result);
		}
		if (habitIds.length > 0) loadStreaks();
		return () => { cancelled = true; };
	}, [habitIds.join(','), getStreak]);

	return streaks;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HabitStreakWidget() {
	const habits = useHabitStore((s) => s.habits);
	const todayLogs = useHabitStore((s) => s.todayLogs);
	const loading = useHabitStore((s) => s.loading);
	const load = useHabitStore((s) => s.load);
	const toggleToday = useHabitStore((s) => s.toggleToday);

	useEffect(() => {
		if (habits.length === 0 && !loading) {
			load();
		}
	}, [habits.length, loading, load]);

	const activeHabits = habits.filter((h) => h.active);
	const streaks = useCachedStreaks(activeHabits.map((h) => h.id));

	const isCompletedToday = useCallback(
		(habitId: string) =>
			todayLogs.some((l) => l.habitId === habitId && l.completed),
		[todayLogs],
	);

	function openHabitsApp() {
		useWindowStore.getState().openWindow('habits');
	}

	return (
		<div
			style={{
				width: 180,
				padding: '6px 10px 8px',
				display: 'flex',
				flexDirection: 'column',
				gap: 4,
			}}
		>
			{loading && (
				<span style={{ fontSize: '0.65rem', color: 'var(--place-text-tertiary)' }}>
					Loading...
				</span>
			)}

			{!loading && activeHabits.length === 0 && (
				<span style={{ fontSize: '0.65rem', color: 'var(--place-text-tertiary)' }}>
					No active habits
				</span>
			)}

			{activeHabits.slice(0, 5).map((habit) => (
				<div
					key={habit.id}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 6,
					}}
				>
					{/* Color dot */}
					<span
						style={{
							width: 7,
							height: 7,
							borderRadius: '50%',
							background: habit.color ?? 'var(--place-primary-400)',
							flexShrink: 0,
						}}
					/>

					{/* Name */}
					<span
						style={{
							fontSize: '0.63rem',
							color: 'var(--place-text-primary)',
							flex: 1,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{habit.name}
					</span>

					{/* Streak */}
					<span
						style={{
							fontSize: '0.55rem',
							color: 'var(--place-text-tertiary)',
							flexShrink: 0,
						}}
					>
						{streaks[habit.id] ?? 0}d
					</span>

					{/* Checkbox */}
					<input
						type="checkbox"
						checked={isCompletedToday(habit.id)}
						onChange={() => toggleToday(habit.id)}
						style={{
							accentColor: habit.color ?? 'var(--place-primary-400)',
							width: 12,
							height: 12,
							flexShrink: 0,
						}}
					/>
				</div>
			))}

			<button
				type="button"
				onClick={openHabitsApp}
				style={{
					background: 'none',
					border: 'none',
					color: 'var(--place-primary-400)',
					fontSize: '0.6rem',
					cursor: 'default',
					textAlign: 'left',
					padding: '2px 0 0',
				}}
			>
				Open Habits →
			</button>
		</div>
	);
}
