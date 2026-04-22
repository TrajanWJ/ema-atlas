'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getDbClient } from "@/src/db/client";
import {
	getTimeBlocksForDate,
	createTimeBlock,
	updateTimeBlock,
	deleteTimeBlock,
} from "@/src/db/queries/focus";
import { TIME_BLOCK_CATEGORIES } from "@/src/types/focus";
import { useFocusStore } from "@/src/stores/focus-store";
import type { TimeBlock, TimeBlockCategory } from "@/src/types/focus";

// Day planner runs 6am to 11pm (17 hours)
const START_HOUR = 6;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 48;
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
const REFRESH_INTERVAL_MS = 30_000;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function timeToMinutes(timeStr: string): number {
	const [h, m] = timeStr.split(":").map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatHour(hour: number): string {
	if (hour === 0) return "12a";
	if (hour < 12) return `${hour}a`;
	if (hour === 12) return "12p";
	return `${hour - 12}p`;
}

function snapToQuarter(minutes: number): number {
	return Math.round(minutes / 15) * 15;
}

function todayDateStr(): string {
	return new Date().toISOString().slice(0, 10);
}

// ----------------------------------------------------------------------------
// Block creation modal
// ----------------------------------------------------------------------------

interface BlockFormProps {
	readonly startMin: number;
	readonly endMin: number;
	readonly onSave: (label: string, category: TimeBlockCategory) => void;
	readonly onCancel: () => void;
}

function BlockForm({ startMin, endMin, onSave, onCancel }: BlockFormProps) {
	const [label, setLabel] = useState("");
	const [category, setCategory] = useState<TimeBlockCategory>("deep-work");
	const entries = Object.entries(TIME_BLOCK_CATEGORIES) as [
		TimeBlockCategory,
		{ label: string; color: string },
	][];

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			style={{
				position: "absolute",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				zIndex: 100,
				background: "var(--place-surface-1)",
				border: "1px solid var(--place-border-strong)",
				borderRadius: "10px",
				padding: "1rem",
				width: "260px",
				display: "flex",
				flexDirection: "column",
				gap: "0.6rem",
			}}
		>
			<div
				style={{
					fontSize: "0.7rem",
					color: "var(--place-text-secondary)",
					fontWeight: 500,
				}}
			>
				{minutesToTime(startMin)} - {minutesToTime(endMin)}
			</div>
			<input
				type="text"
				placeholder="Block label..."
				value={label}
				onChange={(e) => setLabel(e.target.value)}
				autoFocus
				style={{
					background: "var(--place-surface-1)",
					border: "1px solid var(--place-border-default)",
					borderRadius: "6px",
					color: "var(--place-text-primary)",
					fontSize: "0.75rem",
					padding: "0.4rem 0.6rem",
					outline: "none",
				}}
			/>
			<div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
				{entries.map(([key, val]) => (
					<button
						key={key}
						type="button"
						onClick={() => setCategory(key)}
						style={{
							padding: "0.2rem 0.45rem",
							fontSize: "0.55rem",
							borderRadius: "4px",
							border:
								category === key
									? `1px solid ${val.color}`
									: "1px solid var(--place-border-default)",
							background:
								category === key
									? `color-mix(in srgb, ${val.color} 15%, transparent)`
									: "transparent",
							color:
								category === key ? val.color : "var(--place-text-secondary)",
							cursor: "pointer",
						}}
					>
						{val.label}
					</button>
				))}
			</div>
			<div
				style={{
					display: "flex",
					gap: "0.4rem",
					justifyContent: "flex-end",
				}}
			>
				<button
					type="button"
					onClick={onCancel}
					style={{
						padding: "0.3rem 0.6rem",
						fontSize: "0.65rem",
						background: "transparent",
						border: "1px solid var(--place-border-default)",
						borderRadius: "6px",
						color: "var(--place-text-secondary)",
						cursor: "pointer",
					}}
				>
					Cancel
				</button>
				<button
					type="button"
					onClick={() => {
						if (label.trim()) onSave(label.trim(), category);
					}}
					style={{
						padding: "0.3rem 0.6rem",
						fontSize: "0.65rem",
						background: "var(--place-secondary-400)",
						border: "none",
						borderRadius: "6px",
						color: "#060610",
						fontWeight: 600,
						cursor: "pointer",
					}}
				>
					Save
				</button>
			</div>
		</motion.div>
	);
}

// ----------------------------------------------------------------------------
// Time block card on timeline
// ----------------------------------------------------------------------------

interface TimeBlockCardProps {
	readonly block: TimeBlock;
	readonly onDelete: (id: string) => void;
	readonly onStart: (block: TimeBlock) => void;
	readonly onDragEnd: (
		id: string,
		newStartMin: number,
		newEndMin: number,
	) => void;
	readonly isToday: boolean;
}

function TimeBlockCard({
	block,
	onDelete,
	onStart,
	onDragEnd,
	isToday,
}: TimeBlockCardProps) {
	const cat = TIME_BLOCK_CATEGORIES[block.category];
	const startMin = timeToMinutes(block.startTime);
	const endMin = timeToMinutes(block.endTime);
	const top = (startMin - START_HOUR * 60) * MINUTE_HEIGHT;
	const height = Math.max((endMin - startMin) * MINUTE_HEIGHT, 16);
	const dragStartY = useRef(0);
	const originalStart = useRef(startMin);
	const originalEnd = useRef(endMin);

	return (
		<motion.div
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -10 }}
			drag="y"
			dragMomentum={false}
			dragElastic={0}
			onDragStart={(_, info) => {
				dragStartY.current = info.point.y;
				originalStart.current = startMin;
				originalEnd.current = endMin;
			}}
			onDragEnd={(_, info) => {
				const dy = info.point.y - dragStartY.current;
				const dMin = snapToQuarter(Math.round(dy / MINUTE_HEIGHT));
				const newStart = Math.max(
					START_HOUR * 60,
					originalStart.current + dMin,
				);
				const dur = originalEnd.current - originalStart.current;
				const newEnd = Math.min(END_HOUR * 60, newStart + dur);
				onDragEnd(block.id, newStart, newEnd);
			}}
			style={{
				position: "absolute",
				top,
				left: "52px",
				right: "4px",
				height,
				background: `color-mix(in srgb, ${cat.color} 15%, transparent)`,
				borderLeft: `3px solid ${cat.color}`,
				borderRadius: "4px",
				padding: "0.2rem 0.35rem",
				cursor: "grab",
				overflow: "hidden",
				zIndex: 2,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
				}}
			>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div
						style={{
							fontSize: "0.6rem",
							fontWeight: 600,
							color: "var(--place-text-primary)",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{block.label}
					</div>
					{height > 28 && (
						<div
							style={{
								fontSize: "0.5rem",
								color: "var(--place-text-secondary)",
							}}
						>
							{block.startTime.slice(0, 5)} -{" "}
							{block.endTime.slice(0, 5)}
						</div>
					)}
				</div>
				<div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
					{isToday && block.category !== "break" && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onStart(block);
							}}
							title="Start timer for this block"
							style={{
								background: "color-mix(in srgb, var(--place-secondary-400) 20%, transparent)",
								border: "none",
								color: "var(--place-secondary-400)",
								fontSize: "0.5rem",
								cursor: "pointer",
								padding: "1px 4px",
								borderRadius: "3px",
								fontWeight: 600,
								lineHeight: 1.4,
							}}
						>
							Start
						</button>
					)}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDelete(block.id);
						}}
						style={{
							background: "transparent",
							border: "none",
							color: "var(--place-text-secondary)",
							fontSize: "0.6rem",
							cursor: "pointer",
							padding: "0 2px",
							lineHeight: 1,
						}}
					>
						x
					</button>
				</div>
			</div>
		</motion.div>
	);
}

// ----------------------------------------------------------------------------
// Current time indicator
// ----------------------------------------------------------------------------

function CurrentTimeIndicator() {
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 30_000);
		return () => clearInterval(id);
	}, []);

	const minutes = now.getHours() * 60 + now.getMinutes();
	const top = (minutes - START_HOUR * 60) * MINUTE_HEIGHT;

	if (minutes < START_HOUR * 60 || minutes > END_HOUR * 60) return null;

	return (
		<div
			style={{
				position: "absolute",
				top,
				left: "40px",
				right: 0,
				height: "2px",
				background: "var(--place-error)",
				zIndex: 5,
				pointerEvents: "none",
			}}
		>
			<div
				style={{
					position: "absolute",
					left: "-4px",
					top: "-3px",
					width: "8px",
					height: "8px",
					borderRadius: "50%",
					background: "var(--place-error)",
				}}
			/>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Category legend
// ----------------------------------------------------------------------------

function CategoryLegend() {
	const entries = Object.entries(TIME_BLOCK_CATEGORIES) as [
		TimeBlockCategory,
		{ label: string; color: string },
	][];

	return (
		<div
			style={{
				display: "flex",
				gap: "0.5rem",
				padding: "0.35rem 0.75rem",
				flexWrap: "wrap",
			}}
		>
			{entries.map(([key, val]) => (
				<div
					key={key}
					style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}
				>
					<div
						style={{
							width: "6px",
							height: "6px",
							borderRadius: "2px",
							background: val.color,
						}}
					/>
					<span style={{ fontSize: "0.5rem", color: "var(--place-text-secondary)" }}>
						{val.label}
					</span>
				</div>
			))}
		</div>
	);
}

// ----------------------------------------------------------------------------
// Main view
// ----------------------------------------------------------------------------

interface DayViewProps {
	readonly date: string;
}

export function DayView({ date }: DayViewProps) {
	const [blocks, setBlocks] = useState<readonly TimeBlock[]>([]);
	const [creating, setCreating] = useState<{
		startMin: number;
		endMin: number;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const timelineRef = useRef<HTMLDivElement>(null);
	const dragStart = useRef<number | null>(null);
	const [dragPreview, setDragPreview] = useState<{
		startMin: number;
		endMin: number;
	} | null>(null);
	const isToday = date === todayDateStr();

	const setCurrentLabel = useFocusStore((s) => s.setCurrentLabel);
	const setSelectedPreset = useFocusStore((s) => s.setSelectedPreset);
	const setCustomMinutes = useFocusStore((s) => s.setCustomMinutes);
	const startTimer = useFocusStore((s) => s.start);

	const loadBlocks = useCallback(async () => {
		try {
			const db = getDbClient();
			const result = await getTimeBlocksForDate(db, date);
			setBlocks(result);
		} catch {
			// offline
		} finally {
			setLoading(false);
		}
	}, [date]);

	useEffect(() => {
		setLoading(true);
		loadBlocks().catch(() => {});
	}, [loadBlocks]);

	useEffect(() => {
		const id = setInterval(() => {
			loadBlocks().catch(() => {});
		}, REFRESH_INTERVAL_MS);
		return () => clearInterval(id);
	}, [loadBlocks]);

	// Scroll to current time on mount
	useEffect(() => {
		if (timelineRef.current && isToday) {
			const now = new Date();
			const minutes = now.getHours() * 60 + now.getMinutes();
			const top = (minutes - START_HOUR * 60) * MINUTE_HEIGHT - 100;
			timelineRef.current.scrollTop = Math.max(0, top);
		}
	}, [loading, isToday]);

	const hours = useMemo(() => {
		return Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
	}, []);

	function handleStartBlock(block: TimeBlock) {
		const startMin = timeToMinutes(block.startTime);
		const endMin = timeToMinutes(block.endTime);
		const durationMin = endMin - startMin;

		setCurrentLabel(block.label);
		setSelectedPreset("custom");
		setCustomMinutes(durationMin);
		startTimer(durationMin * 60 * 1000).catch(() => {});
	}

	function handleTimelineMouseDown(e: React.MouseEvent<HTMLDivElement>) {
		const target = e.target;
		if (
			target !== e.currentTarget &&
			!(target instanceof HTMLElement && target.classList.contains("hour-slot"))
		) {
			return;
		}
		const rect = timelineRef.current?.getBoundingClientRect();
		if (!rect) return;
		const scrollTop = timelineRef.current?.scrollTop ?? 0;
		const y = e.clientY - rect.top + scrollTop;
		const minutes = snapToQuarter(
			Math.round(y / MINUTE_HEIGHT) + START_HOUR * 60,
		);
		dragStart.current = minutes;
	}

	function handleTimelineMouseMove(e: React.MouseEvent) {
		if (dragStart.current === null) return;
		const rect = timelineRef.current?.getBoundingClientRect();
		if (!rect) return;
		const scrollTop = timelineRef.current?.scrollTop ?? 0;
		const y = e.clientY - rect.top + scrollTop;
		const endMinutes = snapToQuarter(
			Math.round(y / MINUTE_HEIGHT) + START_HOUR * 60,
		);
		const startMin = Math.min(dragStart.current, endMinutes);
		const endMin = Math.max(dragStart.current, endMinutes);
		if (endMin - startMin >= 15) {
			setDragPreview({ startMin, endMin });
		} else {
			setDragPreview(null);
		}
	}

	function handleTimelineMouseUp(e: React.MouseEvent) {
		if (dragStart.current === null) return;
		const rect = timelineRef.current?.getBoundingClientRect();
		if (!rect) return;
		const scrollTop = timelineRef.current?.scrollTop ?? 0;
		const y = e.clientY - rect.top + scrollTop;
		const endMinutes = snapToQuarter(
			Math.round(y / MINUTE_HEIGHT) + START_HOUR * 60,
		);
		const startMin = Math.min(dragStart.current, endMinutes);
		const endMin = Math.max(dragStart.current, endMinutes);
		dragStart.current = null;
		setDragPreview(null);

		if (endMin - startMin >= 15) {
			setCreating({ startMin, endMin });
		}
	}

	async function handleSaveBlock(
		label: string,
		category: TimeBlockCategory,
	) {
		if (!creating) return;
		// Optimistic: add block to state immediately
		const now = new Date().toISOString();
		const optimisticBlock: TimeBlock = {
			id: crypto.randomUUID(),
			label,
			category,
			startTime: minutesToTime(creating.startMin),
			endTime: minutesToTime(creating.endMin),
			date,
			createdAt: now,
			updatedAt: now,
		};
		setBlocks((prev) => [...prev, optimisticBlock]);
		setCreating(null);

		try {
			const db = getDbClient();
			await createTimeBlock(db, {
				label,
				category,
				startTime: optimisticBlock.startTime,
				endTime: optimisticBlock.endTime,
				date,
			});
			await loadBlocks();
		} catch {
			// Keep optimistic block in state
		}
	}

	async function handleDeleteBlock(id: string) {
		// Optimistic: remove from state first
		const prev = blocks;
		setBlocks((current) => current.filter((b) => b.id !== id));

		try {
			const db = getDbClient();
			await deleteTimeBlock(db, id);
		} catch {
			// Rollback on failure
			setBlocks(prev);
		}
	}

	async function handleDragEnd(
		id: string,
		newStartMin: number,
		newEndMin: number,
	) {
		// Optimistic: update in state first
		const prev = blocks;
		setBlocks((current) =>
			current.map((b) =>
				b.id === id
					? {
							...b,
							startTime: minutesToTime(newStartMin),
							endTime: minutesToTime(newEndMin),
						}
					: b,
			),
		);

		try {
			const db = getDbClient();
			await updateTimeBlock(db, id, {
				startTime: minutesToTime(newStartMin),
				endTime: minutesToTime(newEndMin),
			});
		} catch {
			// Rollback on failure
			setBlocks(prev);
		}
	}

	if (loading) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
					color: "var(--place-text-secondary)",
					fontSize: "0.75rem",
				}}
			>
				Loading...
			</div>
		);
	}

	return (
		<div
			style={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<CategoryLegend />

			{/* Timeline */}
			<div
				ref={timelineRef}
				onMouseDown={handleTimelineMouseDown}
				onMouseMove={handleTimelineMouseMove}
				onMouseUp={handleTimelineMouseUp}
				onMouseLeave={() => {
					if (dragStart.current !== null) {
						dragStart.current = null;
						setDragPreview(null);
					}
				}}
				style={{
					flex: 1,
					overflowY: "auto",
					position: "relative",
					cursor: "crosshair",
				}}
			>
				<div
					style={{
						position: "relative",
						height: TOTAL_HOURS * HOUR_HEIGHT,
					}}
				>
					{hours.map((hour) => (
						<div
							key={hour}
							className="hour-slot"
							style={{
								position: "absolute",
								top: (hour - START_HOUR) * HOUR_HEIGHT,
								left: 0,
								right: 0,
								height: HOUR_HEIGHT,
								borderBottom: "1px solid var(--place-border-subtle)",
							}}
						>
							<span
								style={{
									position: "absolute",
									top: "-0.35rem",
									left: "4px",
									fontSize: "0.5rem",
									color: "var(--place-text-secondary)",
									opacity: 0.6,
									userSelect: "none",
									pointerEvents: "none",
								}}
							>
								{formatHour(hour)}
							</span>
						</div>
					))}

					<AnimatePresence>
						{blocks.map((block) => (
							<TimeBlockCard
								key={block.id}
								block={block}
								onDelete={handleDeleteBlock}
								onStart={handleStartBlock}
								onDragEnd={handleDragEnd}
								isToday={isToday}
							/>
						))}
					</AnimatePresence>

					{isToday && <CurrentTimeIndicator />}

					{/* Drag preview rectangle */}
					{dragPreview && (
						<div
							style={{
								position: "absolute",
								top: (dragPreview.startMin - START_HOUR * 60) * MINUTE_HEIGHT,
								left: "52px",
								right: "4px",
								height: Math.max(
									(dragPreview.endMin - dragPreview.startMin) * MINUTE_HEIGHT,
									8,
								),
								background:
									"color-mix(in srgb, var(--place-secondary-400) 12%, transparent)",
								border: "1.5px dashed var(--place-secondary-400)",
								borderRadius: "4px",
								zIndex: 3,
								pointerEvents: "none",
							}}
						/>
					)}
				</div>
			</div>

			{/* Block creation form overlay */}
			<AnimatePresence>
				{creating && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setCreating(null)}
							style={{
								position: "absolute",
								inset: 0,
								background: "rgba(6, 6, 16, 0.5)",
								zIndex: 50,
							}}
						/>
						<BlockForm
							startMin={creating.startMin}
							endMin={creating.endMin}
							onSave={handleSaveBlock}
							onCancel={() => setCreating(null)}
						/>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
