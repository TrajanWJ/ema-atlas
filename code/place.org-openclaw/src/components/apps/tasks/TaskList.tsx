'use client';

import type { Task } from "@/src/types/task";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
	readonly tasks: readonly Task[];
	readonly onComplete: (id: string) => void;
	readonly onArchive: (id: string) => void;
	readonly onUpdate: (id: string, fields: Partial<Pick<Task, "title" | "description">>) => void;
}

const PRIORITY_ORDER: readonly Task["priority"][] = ["must", "should", "could"];
const PRIORITY_LABELS: Record<Task["priority"], string> = {
	must: "Must Do",
	should: "Should Do",
	could: "Could Do",
};

export function TaskList({ tasks, onComplete, onArchive, onUpdate }: TaskListProps) {
	if (tasks.length === 0) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "6rem",
					color: "var(--text-secondary)",
					fontSize: "0.75rem",
				}}
			>
				No tasks
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
							color: "var(--text-secondary)",
							fontWeight: 600,
							letterSpacing: "0.05em",
							textTransform: "uppercase",
							background: "var(--surface)",
							borderBottom: "1px solid var(--border)",
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
						/>
					))}
				</div>
			))}
		</div>
	);
}
