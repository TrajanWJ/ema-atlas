'use client';

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { getDbClient } from "@/src/db/client";
import {
	getTimeBlocksForDate,
	getFocusBlocksForDateRange,
} from "@/src/db/queries/focus";
import { TIME_BLOCK_CATEGORIES } from "@/src/types/focus";
import type { TimeBlock, FocusBlock, TimeBlockCategory } from "@/src/types/focus";

// Day planner runs 6am to 11pm
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 40;
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function timeToMinutes(timeStr: string): number {
	const [h, m] = timeStr.split(":").map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
}

function isoToMinutes(iso: string): number {
	const d = new Date(iso);
	return d.getHours() * 60 + d.getMinutes();
}

function formatHour(hour: number): string {
	if (hour === 0) return "12a";
	if (hour < 12) return `${hour}a`;
	if (hour === 12) return "12p";
	return `${hour - 12}p`;
}

function formatMs(ms: number): string {
	const totalMinutes = Math.floor(ms / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

interface OverlapResult {
	readonly completed: number;
	readonly total: number;
	readonly plannedMs: number;
	readonly actualMs: number;
}

function computeOverlap(
	planned: readonly TimeBlock[],
	actual: readonly FocusBlock[],
): OverlapResult {
	let completed = 0;
	const plannedMs = planned.reduce((sum, b) => {
		const s = timeToMinutes(b.startTime);
		const e = timeToMinutes(b.endTime);
		return sum + (e - s) * 60000;
	}, 0);
	const actualMs = actual
		.filter((b) => b.type === "work")
		.reduce((sum, b) => sum + (b.actualMs ?? 0), 0);

	for (const block of planned) {
		const pStart = timeToMinutes(block.startTime);
		const pEnd = timeToMinutes(block.endTime);
		const hasOverlap = actual.some((a) => {
			const aStart = isoToMinutes(a.startedAt);
			const aDur = (a.actualMs ?? 0) / 60000;
			const aEnd = aStart + aDur;
			return aStart < pEnd && aEnd > pStart;
		});
		if (hasOverlap) completed++;
	}

	return { completed, total: planned.length, plannedMs, actualMs };
}

// ----------------------------------------------------------------------------
// Planned block outline
// ----------------------------------------------------------------------------

function PlannedBlockBar({ block }: { readonly block: TimeBlock }) {
	const cat = TIME_BLOCK_CATEGORIES[block.category];
	const startMin = timeToMinutes(block.startTime);
	const endMin = timeToMinutes(block.endTime);
	const top = (startMin - START_HOUR * 60) * MINUTE_HEIGHT;
	const height = Math.max((endMin - startMin) * MINUTE_HEIGHT, 8);

	return (
		<div
			style={{
				position: "absolute",
				top,
				left: "44px",
				right: "4px",
				height,
				border: `1.5px dashed ${cat.color}`,
				borderRadius: "4px",
				opacity: 0.5,
				zIndex: 1,
			}}
		/>
	);
}

// ----------------------------------------------------------------------------
// Actual focus block bar
// ----------------------------------------------------------------------------

function ActualBlockBar({
	block,
	planned,
}: {
	readonly block: FocusBlock;
	readonly planned: readonly TimeBlock[];
}) {
	const startMin = isoToMinutes(block.startedAt);
	const durMin = (block.actualMs ?? 0) / 60000;
	const endMin = startMin + durMin;
	const top = (startMin - START_HOUR * 60) * MINUTE_HEIGHT;
	const height = Math.max(durMin * MINUTE_HEIGHT, 4);

	// Determine tint based on overlap with planned blocks
	const hasPlannedOverlap = planned.some((p) => {
		const pStart = timeToMinutes(p.startTime);
		const pEnd = timeToMinutes(p.endTime);
		return startMin < pEnd && endMin > pStart;
	});

	const bg = hasPlannedOverlap
		? "var(--place-success)"
		: "var(--place-tertiary-400)";

	return (
		<motion.div
			initial={{ scaleY: 0 }}
			animate={{ scaleY: 1 }}
			style={{
				position: "absolute",
				top,
				left: "44px",
				right: "4px",
				height,
				background: `color-mix(in srgb, ${bg} 35%, transparent)`,
				borderLeft: `3px solid ${bg}`,
				borderRadius: "4px",
				zIndex: 2,
				transformOrigin: "top",
			}}
		/>
	);
}

// ----------------------------------------------------------------------------
// Summary stats bar
// ----------------------------------------------------------------------------

function SummaryStats({ overlap }: { readonly overlap: OverlapResult }) {
	return (
		<div
			style={{
				display: "flex",
				gap: "1rem",
				padding: "0.5rem 0.75rem",
				borderTop: "1px solid var(--place-border-default)",
				fontSize: "0.6rem",
				color: "var(--place-text-secondary)",
				flexWrap: "wrap",
			}}
		>
			<span>
				<strong style={{ color: "var(--place-text-primary)" }}>
					{overlap.completed}/{overlap.total}
				</strong>{" "}
				blocks completed
			</span>
			<span>
				<strong style={{ color: "var(--place-text-primary)" }}>
					{formatMs(overlap.plannedMs)}
				</strong>{" "}
				planned
			</span>
			<span>
				<strong style={{ color: "var(--place-text-primary)" }}>
					{formatMs(overlap.actualMs)}
				</strong>{" "}
				actual
			</span>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Legend
// ----------------------------------------------------------------------------

function ComparisonLegend() {
	const items = [
		{ color: "var(--place-success)", label: "On track", dashed: false },
		{ color: "var(--place-tertiary-400)", label: "Unplanned", dashed: false },
		{ color: "var(--place-border-strong)", label: "Planned", dashed: true },
	];

	return (
		<div
			style={{
				display: "flex",
				gap: "0.75rem",
				padding: "0.35rem 0.75rem",
				flexWrap: "wrap",
			}}
		>
			{items.map((item) => (
				<div
					key={item.label}
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.25rem",
					}}
				>
					<div
						style={{
							width: "12px",
							height: "6px",
							borderRadius: "2px",
							background: item.dashed ? "transparent" : `color-mix(in srgb, ${item.color} 35%, transparent)`,
							border: item.dashed ? `1.5px dashed ${item.color}` : "none",
						}}
					/>
					<span style={{ fontSize: "0.5rem", color: "var(--place-text-secondary)" }}>
						{item.label}
					</span>
				</div>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export function ActualVsPlanned({ date }: { readonly date: string }) {
	const [planned, setPlanned] = useState<readonly TimeBlock[]>([]);
	const [actual, setActual] = useState<readonly FocusBlock[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		try {
			const db = getDbClient();
			const [p, a] = await Promise.all([
				getTimeBlocksForDate(db, date),
				getFocusBlocksForDateRange(db, date, date),
			]);
			setPlanned(p);
			setActual(a.filter((b) => b.type === "work"));
		} catch {
			// offline
		} finally {
			setLoading(false);
		}
	}, [date]);

	useEffect(() => {
		setLoading(true);
		load().catch(() => {});
	}, [load]);

	if (loading) {
		return (
			<div
				style={{
					padding: "1rem",
					textAlign: "center",
					color: "var(--place-text-secondary)",
					fontSize: "0.7rem",
				}}
			>
				Loading...
			</div>
		);
	}

	if (planned.length === 0 && actual.length === 0) {
		return (
			<div
				style={{
					padding: "1rem",
					textAlign: "center",
					color: "var(--place-text-secondary)",
					fontSize: "0.65rem",
				}}
			>
				No planned blocks or focus sessions for this day
			</div>
		);
	}

	const overlap = computeOverlap(planned, actual);
	const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<ComparisonLegend />
			<div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
				<div
					style={{
						position: "relative",
						height: TOTAL_HOURS * HOUR_HEIGHT,
					}}
				>
					{hours.map((hour) => (
						<div
							key={hour}
							style={{
								position: "absolute",
								top: (hour - START_HOUR) * HOUR_HEIGHT,
								left: 0,
								right: 0,
								height: HOUR_HEIGHT,
								borderBottom: "1px solid var(--place-border-default)",
							}}
						>
							<span
								style={{
									position: "absolute",
									top: "-0.3rem",
									left: "4px",
									fontSize: "0.45rem",
									color: "var(--place-text-secondary)",
									opacity: 0.6,
									userSelect: "none",
								}}
							>
								{formatHour(hour)}
							</span>
						</div>
					))}

					{planned.map((block) => (
						<PlannedBlockBar key={block.id} block={block} />
					))}

					{actual.map((block) => (
						<ActualBlockBar
							key={block.id}
							block={block}
							planned={planned}
						/>
					))}
				</div>
			</div>
			<SummaryStats overlap={overlap} />
		</div>
	);
}
