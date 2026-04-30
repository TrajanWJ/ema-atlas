'use client';

import type { Task } from "@/src/types/task";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
	readonly tasks: readonly Task[];
	readonly onComplete: (id: string) => void;
	readonly onArchive: (id: string) => void;
	readonly onUpdate: (id: string, fields: Partial<Pick<Task, "title" | "description">>) => void;
	readonly onTogglePin?: (id: string) => void;
}

const PRIORITY_ORDER: readonly Task["priority"][] = ["must", "should", "could"];
const PRIORITY_LABELS: Record<Task["priority"], string> = {
	must: "Must Do",
	should: "Should Do",
	could: "Could Do",
};

export function TaskList({ tasks, onComplete, onArchive, onUpdate, onTogglePin }: TaskListProps) {
	if (tasks.length === 0) {
		return (
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					height: "8rem",
					gap: "0.5rem",
					padding: "1rem",
				}}
			>
				<svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="var(--place-text-ghost, rgba(255,255,255,0.15))" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
					<polyline points="9 11 12 14 22 4" />
					<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
				</svg>
				<span style={{ fontSize: "0.75rem", color: "var(--place-text-muted, rgba(255,255,255,0.25))" }}>
					No tasks here
				</span>
				<span style={{ fontSize: "0.6rem", color: "var(--place-text-muted, rgba(255,255,255,0.25))" }}>
					Drag tasks or use + to add
				</span>
			</div>
		);
	}

	const grouped = PRIORITY_ORDER.map((priority) => ({
		priority,
		items: tasks.filter((t) => t.priority === priority),
	})).filter(({ items }) => items.length > 0);

	return (
		<div style={{ overflowY: "auto", flex: 1 }}>
			{grouped.map(({ priority, items }) => (
				<div key={priority}>
					<div
						style={{
							padding: "0.3rem 0.75rem",
							fontSize: "0.65rem",
							color: "var(--place-text-secondary)",
							fontWeight: 600,
							letterSpacing: "0.05em",
							textTransform: "uppercase",
							background: "var(--place-surface-1)",
							borderBottom: "1px solid var(--place-border-default)",
						}}
					>
						{PRIORITY_LABELS[priority]} ({items.length})
					</div>
					{items.map((task) => (
						<TaskItem
							key={task.id}
							task={task}
							onComplete={onComplete}
							onArchive={onArchive}
							onUpdate={onUpdate}
							onTogglePin={onTogglePin}
						/>
					))}
				</div>
			))}
		</div>
	);
}
