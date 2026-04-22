'use client';

import { useState, useCallback, useMemo, useRef } from "react";
import { KanbanColumn, KANBAN_COLUMNS } from "./KanbanColumn";
import { taskStatusToKanban } from "@/src/types/task";
import type { Task, KanbanStatus, TaskPriority } from "@/src/types/task";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KanbanBoardProps {
	readonly tasks: readonly Task[];
	readonly onAddTask: (title: string, priority: TaskPriority, status: string) => void;
	readonly onMoveTask: (id: string, status: string) => void;
	readonly onUpdateTask: (
		id: string,
		fields: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate">>,
	) => void;
	readonly onArchiveTask: (id: string) => void;
	readonly onTogglePin?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByKanbanStatus(tasks: readonly Task[]): Record<KanbanStatus, Task[]> {
	const groups: Record<KanbanStatus, Task[]> = {
		backlog: [],
		today: [],
		"in-progress": [],
		done: [],
	};
	for (const task of tasks) {
		if (task.status === "archived") continue;
		const col = taskStatusToKanban(task.status);
		groups[col].push(task);
	}
	return groups;
}

/** Map kanban column status to the TaskStatus stored in DB */
function kanbanToDbStatus(status: KanbanStatus): string {
	const map: Record<KanbanStatus, string> = {
		backlog: "backlog",
		today: "today",
		"in-progress": "in-progress",
		done: "complete",
	};
	return map[status];
}

// ---------------------------------------------------------------------------
// KanbanBoard
// ---------------------------------------------------------------------------

export function KanbanBoard({
	tasks,
	onAddTask,
	onMoveTask,
	onUpdateTask,
	onArchiveTask,
	onTogglePin,
}: KanbanBoardProps) {
	const [dragTargetCol, setDragTargetCol] = useState<KanbanStatus | null>(null);
	const draggedElRef = useRef<HTMLElement | null>(null);
	const grouped = useMemo(() => groupByKanbanStatus(tasks), [tasks]);

	const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
		e.dataTransfer.setData("text/plain", taskId);
		e.dataTransfer.effectAllowed = "move";
		// Track the dragged element so we can restore opacity on drag end
		const el = e.currentTarget as HTMLElement;
		draggedElRef.current = el;
		requestAnimationFrame(() => {
			el.style.opacity = "0.4";
		});
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	}, []);

	const handleDragEnter = useCallback((status: KanbanStatus) => {
		setDragTargetCol(status);
	}, []);

	const handleDragLeave = useCallback(() => {
		setDragTargetCol(null);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent, status: KanbanStatus) => {
			e.preventDefault();
			setDragTargetCol(null);
			const taskId = e.dataTransfer.getData("text/plain");
			if (!taskId) return;
			onMoveTask(taskId, kanbanToDbStatus(status));
		},
		[onMoveTask],
	);

	const handleAddTask = useCallback(
		(title: string, status: KanbanStatus) => {
			onAddTask(title, "should", kanbanToDbStatus(status));
		},
		[onAddTask],
	);

	const handleDragEnd = useCallback(() => {
		setDragTargetCol(null);
		// Restore opacity on the element that started the drag
		if (draggedElRef.current) {
			draggedElRef.current.style.opacity = "1";
			draggedElRef.current = null;
		}
	}, []);

	return (
		<div
			style={{
				display: "flex",
				flex: 1,
				overflow: "hidden",
			}}
			onDragEnd={handleDragEnd}
		>
			{KANBAN_COLUMNS.map((col) => (
				<div
					key={col.status}
					onDragEnter={() => handleDragEnter(col.status)}
					onDragLeave={handleDragLeave}
					style={{ flex: 1, display: "flex", minWidth: 0 }}
				>
					<KanbanColumn
						column={col}
						tasks={grouped[col.status]}
						onAddTask={handleAddTask}
						onUpdateTask={onUpdateTask}
						onArchiveTask={onArchiveTask}
						onTogglePin={onTogglePin}
						onDragStart={handleDragStart}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						isDragTarget={dragTargetCol === col.status}
					/>
				</div>
			))}
		</div>
	);
}
