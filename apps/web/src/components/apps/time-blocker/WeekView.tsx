'use client';

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { getDbClient } from "@/src/db/client";
import { getTimeBlocksForDateRange } from "@/src/db/queries/focus";
import { TIME_BLOCK_CATEGORIES } from "@/src/types/focus";
import type { TimeBlock } from "@/src/types/focus";

// Timeline runs 6am to 11pm
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

// ----------------------------------------------------------------------------
// Date helpers
// ----------------------------------------------------------------------------

function getMonday(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function dateStr(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
	const result = new Date(d);
	result.setDate(result.getDate() + n);
	return result;
}

function timeToMinutes(timeStr: string): number {
	const [h, m] = timeStr.split(":").map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ----------------------------------------------------------------------------
// Day column
// ----------------------------------------------------------------------------

interface DayColumnProps {
	readonly date: Date;
	readonly blocks: readonly TimeBlock[];
	readonly isToday: boolean;
	readonly onSelect: (date: string) => void;
	readonly index: number;
}

function DayColumn({ date, blocks, isToday, onSelect, index }: DayColumnProps) {
	const dayNum = date.getDate();
	const dayName = DAY_NAMES[index] ?? "";

	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.04, duration: 0.25 }}
			onClick={() => onSelect(dateStr(date))}
			style={{
				flex: 1,
				display: "flex",
				flexDirection: "column",
				background: isToday
					? "var(--place-surface-2)"
					: "var(--place-surface-1)",
				border: isToday
					? "1px solid var(--place-secondary-400)"
					: "1px solid var(--place-border-default)",
				borderRadius: "6px",
				padding: 0,
				cursor: "pointer",
				overflow: "hidden",
				minWidth: 0,
			}}
		>
			{/* Day header */}
			<div
				style={{
					padding: "0.3rem 0.25rem",
					borderBottom: "1px solid var(--place-border-default)",
					textAlign: "center",
				}}
			>
				<div
					style={{
						fontSize: "0.5rem",
						color: isToday
							? "var(--place-secondary-400)"
							: "var(--place-text-secondary)",
						fontWeight: isToday ? 600 : 400,
						textTransform: "uppercase",
						letterSpacing: "0.06em",
					}}
				>
					{dayName}
				</div>
				<div
					style={{
						fontSize: "0.7rem",
						color: isToday
							? "var(--place-text-primary)"
							: "var(--place-text-secondary)",
						fontWeight: isToday ? 600 : 400,
					}}
				>
					{dayNum}
				</div>
			</div>

			{/* Block bars */}
			<div
				style={{
					flex: 1,
					position: "relative",
					minHeight: "120px",
				}}
			>
				{blocks.map((block) => {
					const cat = TIME_BLOCK_CATEGORIES[block.category];
					const sMin = timeToMinutes(block.startTime) - START_HOUR * 60;
					const eMin = timeToMinutes(block.endTime) - START_HOUR * 60;
					const topPct = (sMin / TOTAL_MINUTES) * 100;
					const heightPct = ((eMin - sMin) / TOTAL_MINUTES) * 100;

					return (
						<div
							key={block.id}
							title={`${block.label} (${block.startTime}-${block.endTime})`}
							style={{
								position: "absolute",
								top: `${topPct}%`,
								left: "2px",
								right: "2px",
								height: `${Math.max(heightPct, 2)}%`,
								background: `color-mix(in srgb, ${cat.color} 40%, transparent)`,
								borderRadius: "2px",
								borderLeft: `2px solid ${cat.color}`,
							}}
						/>
					);
				})}
			</div>
		</motion.button>
	);
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

interface WeekViewProps {
	readonly weekStart: Date;
	readonly onSelectDate: (date: string) => void;
}

export function WeekView({ weekStart, onSelectDate }: WeekViewProps) {
	const [blocksByDate, setBlocksByDate] = useState<Map<string, TimeBlock[]>>(
		new Map(),
	);
	const [loading, setLoading] = useState(true);

	const monday = getMonday(weekStart);
	const sunday = addDays(monday, 6);
	const todayStr = dateStr(new Date());
	const mondayStr = dateStr(monday);
	const sundayStr = dateStr(sunday);

	const load = useCallback(async () => {
		try {
			const db = getDbClient();
			const blocks = await getTimeBlocksForDateRange(
				db,
				mondayStr,
				sundayStr,
			);
			const map = new Map<string, TimeBlock[]>();
			for (const block of blocks) {
				const existing = map.get(block.date);
				if (existing) {
					existing.push(block);
				} else {
					map.set(block.date, [block]);
				}
			}
			setBlocksByDate(map);
		} catch {
			// offline
		} finally {
			setLoading(false);
		}
	}, [mondayStr, sundayStr]);

	useEffect(() => {
		setLoading(true);
		load().catch(() => {});
	}, [load]);

	if (loading) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
					color: "var(--place-text-secondary)",
					fontSize: "0.7rem",
				}}
			>
				Loading...
			</div>
		);
	}

	const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

	return (
		<div
			style={{
				display: "flex",
				gap: "4px",
				padding: "0.5rem",
				height: "100%",
				overflow: "hidden",
			}}
		>
			{days.map((day, i) => {
				const ds = dateStr(day);
				return (
					<DayColumn
						key={ds}
						date={day}
						blocks={blocksByDate.get(ds) ?? []}
						isToday={ds === todayStr}
						onSelect={onSelectDate}
						index={i}
					/>
				);
			})}
		</div>
	);
}
