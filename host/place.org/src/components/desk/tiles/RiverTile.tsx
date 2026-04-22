'use client';

import { useEffect, useState, useMemo } from "react";
import { getDbClient } from "@/src/db/client";
import { getRecentStates } from "@/src/db/queries/right-now";
import { DeskTile } from "../DeskTile";

interface RiverEvent {
	readonly at: string;
	readonly kind: "right_now" | "flux" | "task" | "focus" | "capture";
	readonly text: string;
	readonly icon: string;
}

function todayLocal(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(iso: string): string {
	try {
		return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	} catch {
		return "";
	}
}

const ICONS: Record<RiverEvent["kind"], string> = {
	right_now: "◉",
	flux: "•",
	task: "✓",
	focus: "◈",
	capture: "↳",
};

export function RiverTile() {
	const [events, setEvents] = useState<readonly RiverEvent[]>([]);

	useEffect(() => {
		let alive = true;
		const load = async () => {
			try {
				const db = getDbClient();
				const date = todayLocal();
				const dayStart = `${date}T00:00:00.000Z`;
				const dayEnd = `${date}T23:59:59.999Z`;

				const [rnStates, flux, taskRows, captureRows] = await Promise.all([
					getRecentStates(db, 30).then((all) =>
						all.filter((s) => s.startedAt >= dayStart && s.startedAt <= dayEnd),
					),
					db.query(
						"SELECT * FROM flux_entries WHERE date = ? ORDER BY timestamp ASC",
						[date],
					),
					db.query(
						"SELECT * FROM tasks WHERE completed_at IS NOT NULL AND completed_at >= ? AND completed_at <= ? ORDER BY completed_at ASC",
						[dayStart, dayEnd],
					),
					db.query(
						"SELECT id, content, created_at FROM inbox WHERE created_at >= ? AND created_at <= ? ORDER BY created_at ASC",
						[dayStart, dayEnd],
					),
				]).catch(() => [[] as never[], [] as never[], [] as never[], [] as never[]]);

				const list: RiverEvent[] = [];

				for (const s of rnStates) {
					list.push({
						at: s.startedAt,
						kind: "right_now",
						text: s.text,
						icon: ICONS.right_now,
					});
				}

				for (const r of flux) {
					list.push({
						at: String(r["created_at"] ?? ""),
						kind: "flux",
						text: String(r["content"] ?? ""),
						icon: ICONS.flux,
					});
				}

				for (const r of taskRows) {
					list.push({
						at: String(r["completed_at"] ?? ""),
						kind: "task",
						text: `done: ${String(r["title"] ?? "")}`,
						icon: ICONS.task,
					});
				}

				for (const r of captureRows) {
					list.push({
						at: String(r["created_at"] ?? ""),
						kind: "capture",
						text: String(r["content"] ?? "").slice(0, 80),
						icon: ICONS.capture,
					});
				}

				list.sort((a, b) => b.at.localeCompare(a.at));

				if (alive) setEvents(list.slice(0, 50));
			} catch (err) {
				console.error("[river] load failed:", err);
			}
		};
		void load();
		const interval = setInterval(load, 60_000);
		return () => {
			alive = false;
			clearInterval(interval);
		};
	}, []);

	return (
		<DeskTile title={`River — today · ${events.length}`}>
			{events.length === 0 ? (
				<div
					style={{
						textAlign: "center",
						padding: "1.5rem 1rem",
						fontSize: "0.75rem",
						color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
					}}
				>
					Nothing logged yet today.
				</div>
			) : (
				<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
					{events.map((e, idx) => (
						<li
							key={`${e.at}-${idx}`}
							style={{
								display: "flex",
								alignItems: "baseline",
								gap: "0.5rem",
								padding: "0.2rem 0",
								fontSize: "0.76rem",
							}}
						>
							<span
								style={{
									fontSize: "0.6rem",
									color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
									width: "44px",
									flexShrink: 0,
								}}
							>
								{fmtTime(e.at)}
							</span>
							<span
								aria-hidden
								style={{
									flexShrink: 0,
									width: "10px",
									color:
										e.kind === "right_now"
											? "#8ab4ff"
											: e.kind === "task"
												? "#9de0b5"
												: e.kind === "capture"
													? "#ffcf73"
													: "rgba(255,255,255,0.3)",
								}}
							>
								{e.icon}
							</span>
							<span
								style={{
									flex: 1,
									color:
										e.kind === "right_now"
											? "var(--place-text-primary, rgba(255,255,255,0.92))"
											: "var(--place-text-secondary, rgba(255,255,255,0.6))",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{e.text}
							</span>
						</li>
					))}
				</ul>
			)}
		</DeskTile>
	);
}
