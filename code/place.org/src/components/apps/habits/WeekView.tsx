'use client';

import { useEffect, useState, useCallback } from "react";
import { useHabitStore, getHabitColor } from "@/src/stores/habit-store";
import type { HabitLog } from "@/src/types/habit";
import {
	getWeekStart,
	getWeekDays,
	toDateStr,
	todayStr,
	getDayAbbrev,
} from "./date-helpers";

export function WeekView() {
	const habits = useHabitStore((s) => s.habits);
	const getLogsForRange = useHabitStore((s) => s.getLogsForRange);
	const [weekOffset, setWeekOffset] = useState(0);
	const [logs, setLogs] = useState<readonly HabitLog[]>([]);

	const monday = getWeekStart(new Date());
	monday.setDate(monday.getDate() + weekOffset * 7);
	const days = getWeekDays(monday);
	const firstDay = days[0] ?? monday;
	const lastDay = days[6] ?? monday;
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

	const completedSet = new Set(
		logs.filter((l) => l.completed).map((l) => `${l.habitId}:${l.date}`),
	);

	return (
		<div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
			{/* Navigation */}
			<NavRow
				label={formatWeekLabel(firstDay, lastDay)}
				onPrev={() => setWeekOffset((o) => o - 1)}
				onNext={() => setWeekOffset((o) => o + 1)}
				canNext={weekOffset < 0}
			/>

			{/* Grid */}
			<div style={{ overflowX: 'auto' }}>
				<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
					<thead>
						<tr>
							<th style={{ textAlign: 'left', padding: '0.25rem', color: 'var(--place-text-secondary)', fontWeight: 500 }}>
								Habit
							</th>
							{days.map((day) => {
								const dateStr = toDateStr(day);
								const isToday = dateStr === today;
								return (
									<th
										key={dateStr}
										style={{
											textAlign: 'center',
											padding: '0.25rem 0.15rem',
											color: isToday ? 'var(--place-secondary-400)' : 'var(--place-text-secondary)',
											fontWeight: isToday ? 700 : 500,
											minWidth: '2rem',
										}}
									>
										<div>{getDayAbbrev(day)}</div>
										<div style={{ fontSize: '0.6rem' }}>{day.getDate()}</div>
									</th>
								);
							})}
						</tr>
					</thead>
					<tbody>
						{habits.map((habit, idx) => {
							const color = getHabitColor(habit, idx);
							return (
								<tr key={habit.id}>
									<td style={{ padding: '0.25rem', whiteSpace: 'nowrap' }}>
										<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
											<span
												style={{
													width: '6px',
													height: '6px',
													borderRadius: '50%',
													background: color,
													flexShrink: 0,
												}}
											/>
											<span style={{ color: 'var(--place-text-primary)', fontSize: '0.7rem' }}>
												{habit.name}
											</span>
										</span>
									</td>
									{days.map((day) => {
										const dateStr = toDateStr(day);
										const done = completedSet.has(`${habit.id}:${dateStr}`);
										const isToday = dateStr === today;
										return (
											<td key={dateStr} style={{ textAlign: 'center', padding: '0.15rem' }}>
												<div
													style={{
														width: '1.2rem',
														height: '1.2rem',
														borderRadius: '3px',
														margin: '0 auto',
														background: done ? color : 'transparent',
														border: isToday
															? `2px solid ${color}`
															: `1px solid ${done ? color : 'var(--place-border-default)'}`,
														opacity: done ? 1 : 0.3,
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '0.55rem',
														color: '#fff',
														fontWeight: 700,
													}}
												>
													{done ? '✓' : ''}
												</div>
											</td>
										);
									})}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function formatWeekLabel(start: Date, end: Date): string {
	const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
	return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

interface NavRowProps {
	readonly label: string;
	readonly onPrev: () => void;
	readonly onNext: () => void;
	readonly canNext: boolean;
}

function NavRow({ label, onPrev, onNext, canNext }: NavRowProps) {
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
		<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
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
