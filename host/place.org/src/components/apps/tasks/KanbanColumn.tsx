'use client';

import { useState, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { TaskCard } from "./TaskCard";
import type { Task, TaskPriority } from "@/src/types/task";
import type { KanbanStatus } from "@/src/types/task";

// ---------------------------------------------------------------------------
// Column config
// ---------------------------------------------------------------------------

export interface ColumnDef {
	readonly status: KanbanStatus;
	readonly label: string;
	readonly color: string;
}

export const KANBAN_COLUMNS: readonly ColumnDef[] = [
	{ status: "backlog", label: "Backlog", color: "var(--place-text-muted)" },
	{ status: "today", label: "Today", color: "var(--place-secondary-400)" },
	{ status: "in-progress", label: "In Progress", color: "var(--place-tertiary-400)" },
	{ status: "done", label: "Done", color: "var(--place-primary-400)" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KanbanColumnProps {
	readonly column: ColumnDef;
	readonly tasks: readonly Task[];
	readonly onAddTask: (title: string, status: KanbanStatus) => void;
	readonly onUpdateTask: (
		id: string,
		fields: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate">>,
	) => void;
	readonly onArchiveTask: (id: string) => void;
	readonly onTogglePin?: (id: string) => void;
	readonly onDragStart: (e: React.DragEvent, taskId: string) => void;
	readonly onDragOver: (e: React.DragEvent) => void;
	readonly onDrop: (e: React.DragEvent, status: KanbanStatus) => void;
	readonly isDragTarget: boolean;
}

// ---------------------------------------------------------------------------
// Inline add input
// ---------------------------------------------------------------------------

interface AddInputProps {
	readonly onAdd: (title: string) => void;
}

function ColumnAddInput({ onAdd }: AddInputProps) {
	const [value, setValue] = useState("");
	const [focused, setFocused] = useState(false);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				const trimmed = value.trim();
				if (trimmed) {
					onAdd(trimmed);
					setValue("");
				}
			}
			if (e.key === "Escape") {
				setValue("");
				(e.target as HTMLInputElement).blur();
			}
		},
		[value, onAdd],
	);

	return (
		<input
			type="text"
			value={value}
			onChange={(e) => setValue(e.target.value)}
			onKeyDown={handleKeyDown}
			onFocus={() => setFocused(true)}
			onBlur={() => setFocused(false)}
			placeholder="Add task..."
			style={{
				background: "transparent",
				border: "none",
				outline: "none",
				color: "var(--place-text-primary)",
				fontSize: "0.7rem",
				padding: "0.375rem 0.5rem",
				width: "100%",
				boxSizing: "border-box",
				opacity: focused ? 1 : 0.4,
				transition: "opacity 0.15s",
			}}
		/>
	);
}

// ---------------------------------------------------------------------------
// KanbanColumn
// ---------------------------------------------------------------------------

export function KanbanColumn({
	column,
	tasks,
	onAddTask,
	onUpdateTask,
	onArchiveTask,
	onTogglePin,
	onDragStart,
	onDragOver,
	onDrop,
	isDragTarget,
}: KanbanColumnProps) {
	return (
		<div
			onDragOver={onDragOver}
			onDrop={(e) => onDrop(e, column.status)}
			style={{
				flex: 1,
				minWidth: 0,
				display: "flex",
				flexDirection: "column",
				borderRight: "1px solid var(--place-border-subtle)",
				background: isDragTarget
					? "rgba(45, 212, 168, 0.03)"
					: "transparent",
				transition: "background 0.15s, box-shadow 0.15s",
				boxShadow: isDragTarget
					? "inset 0 0 0 1.5px var(--place-primary-border)"
					: "none",
				borderRadius: isDragTarget ? "0.375rem" : 0,
			}}
		>
			{/* Header */}
			<div
				style={{
					padding: "0.5rem 0.625rem",
					display: "flex",
					alignItems: "center",
					gap: "0.375rem",
					flexShrink: 0,
					borderBottom: "1px solid var(--place-border-subtle)",
				}}
			>
				<span
					style={{
						width: "0.5rem",
						height: "0.5rem",
						borderRadius: "50%",
						background: column.color,
						flexShrink: 0,
					}}
				/>
				<span
					style={{
						fontSize: "0.65rem",
						fontWeight: 600,
						letterSpacing: "0.05em",
						textTransform: "uppercase",
						color: "var(--place-text-secondary)",
					}}
				>
					{column.label}
				</span>
				<span
					style={{
						fontSize: "0.6rem",
						color: "var(--place-text-tertiary)",
						background: "var(--place-surface-3)",
						borderRadius: "0.25rem",
						padding: "0 0.3rem",
						lineHeight: "1.4",
					}}
				>
					{tasks.length}
				</span>
			</div>

			{/* Scrollable card list */}
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "0.375rem",
					display: "flex",
					flexDirection: "column",
					gap: "0.375rem",
				}}
			>
				<AnimatePresence mode="popLayout">
					{tasks.map((task) => (
						<TaskCard
							key={task.id}
							task={task}
							onUpdate={onUpdateTask}
							onArchive={onArchiveTask}
							onTogglePin={onTogglePin}
							onDragStart={onDragStart}
						/>
					))}
				</AnimatePresence>
			</div>

			{/* Add task input */}
			<div style={{ flexShrink: 0, borderTop: "1px solid var(--place-border-subtle)" }}>
				<ColumnAddInput onAdd={(title) => onAddTask(title, column.status)} />
			</div>
		</div>
	);
}
