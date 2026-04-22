'use client';

import { useEffect, useState, useCallback } from "react";
import { useHabitStore, getHabitColor } from "@/src/stores/habit-store";
import type { HabitLog } from "@/src/types/habit";
import {
	getCalendarDays,
	getMonthName,
	toDateStr,
	todayStr,
} from "./date-helpers";

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function MonthView() {
	const habits = useHabitStore((s) => s.habits);
	const getLogsForRange = useHabitStore((s) => s.getLogsForRange);
	const [monthOffset, setMonthOffset] = useState(0);
	const [logs, setLogs] = useState<readonly HabitLog[]>([]);

	const now = new Date();
	const viewYear = now.getFullYear();
	const viewMonth = now.getMonth() + monthOffset;
	const normDate = new Date(viewYear, viewMonth, 1);
	const year = normDate.getFullYear();
	const month = normDate.getMonth();

	const calendarDays = getCalendarDays(year, month);
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const startStr = toDateStr(firstDay);
	const endStr = toDateStr(lastDay);
	const today = todayStr();

	const loadLogs = useCallback(async () => {
		const result = await getLogsForRange(startStr, endStr);
		setLogs(result);
	}, [getLogsForRange, startStr, endStr]);

	useEffect(() => {
		loadLogs().catch(() => {});
	}, [loadLogs]);

	// Build lookup: date -> set of completed habit IDs
	const dateCompletions = buildDateCompletions(logs);

	// Color map by habit index
	const colorMap = new Map(
		habits.map((h, i) => [h.id, getHabitColor(h, i)]),
	);

	return (
		<div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
			<MonthNav
				label={`${getMonthName(month)} ${year}`}
				onPrev={() => setMonthOffset((o) => o - 1)}
				onNext={() => setMonthOffset((o) => o + 1)}
				canNext={monthOffset < 0}
			/>

			{/* Day headers */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '2px' }}>
				{DAY_HEADERS.map((d) => (
					<div
						key={d}
						style={{
							textAlign: 'center',
							fontSize: '0.6rem',
							color: 'var(--place-text-secondary)',
							fontWeight: 500,
							padding: '0.15rem 0',
						}}
					>
						{d}
					</div>
				))}
			</div>

			{/* Calendar grid */}
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
				{calendarDays.map((day, i) => (
					<CalendarCell
						key={day ? toDateStr(day) : `empty-${i}`}
						day={day}
						today={today}
						completedHabitIds={day ? (dateCompletions.get(toDateStr(day)) ?? []) : []}
						colorMap={colorMap}
					/>
				))}
			</div>
		</div>
	);
}

function buildDateCompletions(logs: readonly HabitLog[]): Map<string, string[]> {
	const map = new Map<string, string[]>();
	for (const log of logs) {
		if (!log.completed) continue;
		const existing = map.get(log.date);
		if (existing) {
			existing.push(log.habitId);
		} else {
			map.set(log.date, [log.habitId]);
		}
	}
	return map;
}

interface CalendarCellProps {
	readonly day: Date | null;
	readonly today: string;
	readonly completedHabitIds: readonly string[];
	readonly colorMap: Map<string, string>;
}

function CalendarCell({ day, today, completedHabitIds, colorMap }: CalendarCellProps) {
	if (!day) {
		return (
			<div style={{ minHeight: '2.2rem', background: 'transparent' }} />
		);
	}

	const dateStr = toDateStr(day);
	const isToday = dateStr === today;

	return (
		<div
			style={{
				minHeight: '2.2rem',
				padding: '0.1rem',
				borderRadius: '3px',
				background: isToday ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
				border: isToday ? '1px solid var(--place-secondary-400)' : '1px solid transparent',
			}}
		>
			<div
				style={{
					fontSize: '0.55rem',
					color: isToday ? 'var(--place-secondary-400)' : 'var(--place-text-secondary)',
					fontWeight: isToday ? 700 : 400,
					marginBottom: '1px',
					textAlign: 'center',
				}}
			>
				{day.getDate()}
			</div>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px', justifyContent: 'center' }}>
				{completedHabitIds.map((hId) => (
					<div
						key={hId}
						style={{
							width: '8px',
							height: '8px',
							borderRadius: '2px',
							background: colorMap.get(hId) ?? 'var(--place-primary-400)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '5px',
							color: '#fff',
							fontWeight: 700,
							lineHeight: 1,
						}}
					>
						✓
					</div>
				))}
			</div>
		</div>
	);
}

interface MonthNavProps {
	readonly label: string;
	readonly onPrev: () => void;
	readonly onNext: () => void;
	readonly canNext: boolean;
}

function MonthNav({ label, onPrev, onNext, canNext }: MonthNavProps) {
	const btnStyle: React.CSSProperties = {
		background: 'transparent',
		border: '1px solid var(--place-border-default)',
		borderRadius: '3px',
		padding: '0.1rem 0.4rem',
		cursor: 'pointer',
		color: 'var(--place-text-secondary)',
		fontSize: '0.7rem',
	};

	return (
		<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
			<button type="button" onClick={onPrev} style={btnStyle}>‹</button>
			<span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--place-text-primary)' }}>{label}</span>
			<button
				type="button"
				onClick={onNext}
				disabled={!canNext}
				style={{ ...btnStyle, opacity: canNext ? 1 : 0.3, cursor: canNext ? 'pointer' : 'default' }}
			>
				›
			</button>
		</div>
	);
}
