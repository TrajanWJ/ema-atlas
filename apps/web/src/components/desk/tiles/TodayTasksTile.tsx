'use client';

import { useEffect, useMemo } from "react";
import { useTaskStore } from "@/src/stores/task-store";
import { DeskTile } from "../DeskTile";
import type { Task, TaskPriority } from "@/src/types/task";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
	must: "#ef4444",
	should: "#f59e0b",
	could: "#8ab4ff",
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
	must: 0,
	should: 1,
	could: 2,
};

function isActiveStatus(status: Task["status"]): boolean {
	return status !== "complete" && status !== "archived";
}

export function TodayTasksTile() {
	const { tasks, load, complete, togglePinnedToday } = useTaskStore();

	useEffect(() => {
		void load();
	}, [load]);

	const pinned = useMemo(() => {
		return tasks
			.filter((t) => t.pinnedToday && isActiveStatus(t.status))
			.sort((a, b) => {
				const pa = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
				if (pa !== 0) return pa;
				return a.createdAt.localeCompare(b.createdAt);
			});
	}, [tasks]);

	return (
		<DeskTile title={`Today — ${pinned.length}`}>
			{pinned.length === 0 ? (
				<div
					style={{
						color: "var(--place-text-secondary, rgba(255, 255, 255, 0.35))",
						fontSize: "0.82rem",
						textAlign: "center",
						padding: "2rem 1rem",
					}}
				>
					Nothing pinned for today yet.
					<br />
					<span style={{ fontSize: "0.72rem", opacity: 0.6 }}>
						Open Tasks and hit 📍 to pin one here.
					</span>
				</div>
			) : (
				<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
					{pinned.map((t) => (
						<li
							key={t.id}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.625rem",
								padding: "0.5rem 0.25rem",
								borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
							}}
						>
							<button
								type="button"
								onClick={() => void complete(t.id)}
								title="Mark complete"
								style={{
									width: "14px",
									height: "14px",
									borderRadius: "50%",
									border: `2px solid ${PRIORITY_COLORS[t.priority]}`,
									background: "transparent",
									cursor: "pointer",
									flexShrink: 0,
									padding: 0,
								}}
							/>
							<span
								style={{
									flex: 1,
									fontSize: "0.88rem",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
									color: "var(--place-text-primary, rgba(255, 255, 255, 0.9))",
								}}
							>
								{t.title}
							</span>
							<button
								type="button"
								onClick={() => void togglePinnedToday(t.id)}
								title="Remove from today"
								style={{
									background: "transparent",
									border: "none",
									color: "var(--place-text-secondary, rgba(255, 255, 255, 0.3))",
									fontSize: "0.72rem",
									cursor: "pointer",
									padding: "0 0.25rem",
									lineHeight: 1,
								}}
							>
								×
							</button>
						</li>
					))}
				</ul>
			)}
		</DeskTile>
	);
}
