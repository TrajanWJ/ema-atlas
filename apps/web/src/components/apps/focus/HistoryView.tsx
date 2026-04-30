'use client';

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { getDbClient } from "@/src/db/client";
import { getSessionHistory, getWeeklySummary } from "@/src/db/queries/focus";
import type {
	DailyHistory,
	HistorySession,
	WeeklySummary,
} from "@/src/types/focus";

// ----------------------------------------------------------------------------
// Formatters
// ----------------------------------------------------------------------------

function formatMs(ms: number): string {
	const totalMinutes = Math.floor(ms / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

function formatTime(isoStr: string): string {
	const d = new Date(isoStr);
	return d.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
}

function formatDate(dateStr: string): string {
	const d = new Date(dateStr + "T12:00:00");
	const today = new Date().toISOString().slice(0, 10);
	const yesterday = new Date(Date.now() - 86400000)
		.toISOString()
		.slice(0, 10);
	if (dateStr === today) return "Today";
	if (dateStr === yesterday) return "Yesterday";
	return d.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

function dayLabel(dateStr: string): string {
	const d = new Date(dateStr + "T12:00:00");
	return d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
}

function sessionDurationMs(session: HistorySession): number {
	if (!session.endedAt) return 0;
	return (
		new Date(session.endedAt).getTime() -
		new Date(session.startedAt).getTime()
	);
}

// ----------------------------------------------------------------------------
// Weekly chart
// ----------------------------------------------------------------------------

function WeeklyChart({ data }: { readonly data: readonly WeeklySummary[] }) {
	const maxMs = Math.max(...data.map((d) => d.focusMs), 1);

	return (
		<div
			style={{
				background: "var(--place-surface-1)",
				border: "1px solid var(--place-border-default)",
				borderRadius: "10px",
				padding: "0.75rem",
			}}
		>
			<div
				style={{
					fontSize: "0.6rem",
					color: "var(--place-text-secondary)",
					fontWeight: 500,
					textTransform: "uppercase",
					letterSpacing: "0.08em",
					marginBottom: "0.5rem",
				}}
			>
				Last 7 Days
			</div>
			<div
				style={{
					display: "flex",
					gap: "4px",
					alignItems: "flex-end",
					height: "60px",
				}}
			>
				{data.map((day, i) => {
					const height =
						day.focusMs > 0
							? Math.max((day.focusMs / maxMs) * 100, 8)
							: 4;
					const isToday = i === data.length - 1;
					return (
						<motion.div
							key={day.date}
							initial={{ scaleY: 0 }}
							animate={{ scaleY: 1 }}
							transition={{ delay: i * 0.06, duration: 0.35 }}
							style={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: "3px",
								transformOrigin: "bottom",
							}}
						>
							{day.focusMs > 0 && (
								<span
									style={{
										fontSize: "0.45rem",
										color: "var(--place-text-secondary)",
										opacity: 0.7,
									}}
								>
									{formatMs(day.focusMs)}
								</span>
							)}
							<div
								style={{
									width: "100%",
									maxWidth: "24px",
									height: `${height}%`,
									background: isToday
										? "var(--place-secondary-400)"
										: "color-mix(in srgb, var(--place-secondary-400) 50%, transparent)",
									borderRadius: "3px 3px 0 0",
									minHeight: "2px",
								}}
							/>
							<span
								style={{
									fontSize: "0.5rem",
									color: isToday
										? "var(--place-text-primary)"
										: "var(--place-text-secondary)",
									fontWeight: isToday ? 600 : 400,
								}}
							>
								{dayLabel(day.date)}
							</span>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}

// ----------------------------------------------------------------------------
// Session card
// ----------------------------------------------------------------------------

function SessionCard({
	session,
	index,
}: {
	readonly session: HistorySession;
	readonly index: number;
}) {
	const focusBlocks = session.blocks.filter((b) => b.type === "work");
	const totalFocusMs = focusBlocks.reduce(
		(s, b) => s + (b.actualMs ?? 0),
		0,
	);
	const duration = sessionDurationMs(session);

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.04, duration: 0.25 }}
			style={{
				background: "var(--place-surface-1)",
				border: "1px solid var(--place-border-default)",
				borderRadius: "8px",
				padding: "0.5rem 0.6rem",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<span
					style={{
						fontSize: "0.7rem",
						color: "var(--place-text-primary)",
						fontWeight: 500,
					}}
				>
					{formatTime(session.startedAt)}
				</span>
				<span
					style={{
						fontSize: "0.6rem",
						color: "var(--place-text-secondary)",
					}}
				>
					{formatMs(duration)}
				</span>
			</div>

			{/* Block indicators */}
			{session.blocks.length > 0 && (
				<div
					style={{
						display: "flex",
						gap: "3px",
						marginTop: "0.35rem",
					}}
				>
					{session.blocks.map((block) => (
						<div
							key={block.id}
							title={`${block.type}: ${formatMs(block.actualMs ?? 0)}${block.label ? ` -- ${block.label}` : ""}`}
							style={{
								height: "4px",
								flex: Math.max(block.actualMs ?? 1, 1),
								borderRadius: "2px",
								background:
									block.type === "work"
										? "var(--place-secondary-400)"
										: block.type === "short_break"
											? "var(--place-success)"
											: "var(--place-tertiary-400)",
								opacity: 0.7,
							}}
						/>
					))}
				</div>
			)}

			{/* Tags */}
			{focusBlocks.some((b) => b.label) && (
				<div
					style={{
						display: "flex",
						gap: "0.3rem",
						marginTop: "0.3rem",
						flexWrap: "wrap",
					}}
				>
					{focusBlocks
						.filter((b) => b.label)
						.slice(0, 3)
						.map((b) => (
							<span
								key={b.id}
								style={{
									fontSize: "0.5rem",
									padding: "0.1rem 0.3rem",
									background:
										"color-mix(in srgb, var(--place-secondary-400) 10%, transparent)",
									border: "1px solid var(--place-border-default)",
									borderRadius: "4px",
									color: "var(--place-text-secondary)",
								}}
							>
								{b.label}
							</span>
						))}
				</div>
			)}

			<div
				style={{
					fontSize: "0.55rem",
					color: "var(--place-text-secondary)",
					marginTop: "0.25rem",
					opacity: 0.7,
				}}
			>
				{focusBlocks.length} focus block
				{focusBlocks.length !== 1 ? "s" : ""} --{" "}
				{formatMs(totalFocusMs)} focused
			</div>
		</motion.div>
	);
}

// ----------------------------------------------------------------------------
// Day group
// ----------------------------------------------------------------------------

function DayGroup({
	day,
	index,
}: {
	readonly day: DailyHistory;
	readonly index: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ delay: index * 0.08 }}
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "0.35rem",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "baseline",
					padding: "0 0.15rem",
				}}
			>
				<span
					style={{
						fontSize: "0.7rem",
						color: "var(--place-text-primary)",
						fontWeight: 600,
					}}
				>
					{formatDate(day.date)}
				</span>
				<span
					style={{
						fontSize: "0.55rem",
						color: "var(--place-text-secondary)",
					}}
				>
					{day.sessionCount} session
					{day.sessionCount !== 1 ? "s" : ""} --{" "}
					{formatMs(day.totalFocusMs)}
				</span>
			</div>
			{day.sessions.map((session, si) => (
				<SessionCard key={session.id} session={session} index={si} />
			))}
		</motion.div>
	);
}

// ----------------------------------------------------------------------------
// Main view
// ----------------------------------------------------------------------------

export function HistoryView() {
	const [history, setHistory] = useState<readonly DailyHistory[]>([]);
	const [weekly, setWeekly] = useState<readonly WeeklySummary[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		try {
			const db = getDbClient();
			const [h, w] = await Promise.all([
				getSessionHistory(db),
				getWeeklySummary(db),
			]);
			setHistory(h);
			setWeekly(w);
		} catch {
			// offline
		} finally {
			setLoading(false);
		}
	}, []);

	// Load on mount and re-load whenever the component re-mounts (tab switch)
	useEffect(() => {
		load().catch(() => {});
	}, [load]);

	// Also refresh when window regains focus (user may switch tabs)
	useEffect(() => {
		function handleFocus() {
			load().catch(() => {});
		}
		window.addEventListener("focus", handleFocus);
		return () => window.removeEventListener("focus", handleFocus);
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
				overflowY: "auto",
				padding: "0.75rem",
				display: "flex",
				flexDirection: "column",
				gap: "0.75rem",
			}}
		>
			{weekly.length > 0 && <WeeklyChart data={weekly} />}

			{history.length === 0 ? (
				<div
					style={{
						textAlign: "center",
						padding: "2rem 0",
						color: "var(--place-text-secondary)",
						fontSize: "0.75rem",
					}}
				>
					No sessions yet. Start your first focus session!
				</div>
			) : (
				history.map((day, i) => (
					<DayGroup key={day.date} day={day} index={i} />
				))
			)}
		</div>
	);
}
