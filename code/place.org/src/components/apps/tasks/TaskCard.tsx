'use client';

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import type { Task, TaskPriority } from "@/src/types/task";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_COLORS: Record<TaskPriority, string> = {
	must: "#ef4444",
	should: "#f59e0b",
	could: "var(--place-secondary-400)",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
	must: "Must",
	should: "Should",
	could: "Could",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TaskCardProps {
	readonly task: Task;
	readonly onUpdate: (
		id: string,
		fields: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate">>,
	) => void;
	readonly onArchive: (id: string) => void;
	readonly onTogglePin?: (id: string) => void;
	readonly onDragStart: (e: React.DragEvent, taskId: string) => void;
}

// ---------------------------------------------------------------------------
// Inline edit form (extracted for line-count)
// ---------------------------------------------------------------------------

interface EditFormProps {
	readonly task: Task;
	readonly onSave: (fields: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate">>) => void;
	readonly onCancel: () => void;
}

function EditForm({ task, onSave, onCancel }: EditFormProps) {
	const [title, setTitle] = useState(task.title);
	const [desc, setDesc] = useState(task.description ?? "");
	const [priority, setPriority] = useState<TaskPriority>(task.priority);
	const [dueDate, setDueDate] = useState(task.dueDate ?? "");

	const handleSubmit = () => {
		const trimmed = title.trim();
		if (!trimmed) return;
		onSave({
			title: trimmed,
			description: desc.trim() || null,
			priority,
			dueDate: dueDate || null,
		});
	};

	return (
		<div
			style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}
			onClick={(e) => e.stopPropagation()}
		>
			<input
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				style={inputStyle}
				autoFocus
			/>
			<textarea
				value={desc}
				onChange={(e) => setDesc(e.target.value)}
				placeholder="Description..."
				rows={2}
				style={{ ...inputStyle, resize: "none" }}
			/>
			<div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
				{(["must", "should", "could"] as const).map((p) => (
					<button
						key={p}
						type="button"
						title={PRIORITY_LABELS[p]}
						onClick={() => setPriority(p)}
						style={{
							width: "0.75rem",
							height: "0.75rem",
							borderRadius: "50%",
							background: PRIORITY_COLORS[p],
							border: priority === p ? "2px solid var(--place-text-primary)" : "2px solid transparent",
							cursor: "pointer",
							padding: 0,
							opacity: priority === p ? 1 : 0.4,
						}}
					/>
				))}
				<input
					type="date"
					value={dueDate}
					onChange={(e) => setDueDate(e.target.value)}
					style={{ ...inputStyle, fontSize: "0.65rem", flex: 1, marginLeft: "0.25rem" }}
				/>
			</div>
			<div style={{ display: "flex", gap: "0.375rem" }}>
				<button type="button" onClick={handleSubmit} style={saveBtnStyle}>
					Save
				</button>
				<button type="button" onClick={onCancel} style={cancelBtnStyle}>
					Cancel
				</button>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// TaskCard
// ---------------------------------------------------------------------------

export function TaskCard({ task, onUpdate, onArchive, onTogglePin, onDragStart }: TaskCardProps) {
	const [expanded, setExpanded] = useState(false);
	const isDone = task.status === "complete";

	const handleSave = useCallback(
		(fields: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate">>) => {
			onUpdate(task.id, fields);
			setExpanded(false);
		},
		[onUpdate, task.id],
	);

	const handleNativeDragStart = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			onDragStart(e, task.id);
		},
		[onDragStart, task.id],
	);

	return (
		<motion.div
			layout
			layoutId={`task-card-${task.id}`}
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.15 }}
			style={{
				background: "var(--place-surface-2)",
				borderRadius: "0.5rem",
				border: "1px solid var(--place-border-default)",
				cursor: expanded ? "default" : "grab",
				opacity: isDone ? 0.6 : 1,
				overflow: "hidden",
			}}
		>
			{/* Wrapper div for native HTML5 drag */}
			<div
				draggable={!expanded}
				onDragStart={handleNativeDragStart}
				onClick={() => !expanded && setExpanded(true)}
			>
				{expanded ? (
					<EditForm task={task} onSave={handleSave} onCancel={() => setExpanded(false)} />
				) : (
					<CardSummary task={task} onArchive={onArchive} onTogglePin={onTogglePin} />
				)}
			</div>
		</motion.div>
	);
}

// ---------------------------------------------------------------------------
// Compact card summary (not expanded)
// ---------------------------------------------------------------------------

interface CardSummaryProps {
	readonly task: Task;
	readonly onArchive: (id: string) => void;
	readonly onTogglePin?: (id: string) => void;
}

function CardSummary({ task, onArchive, onTogglePin }: CardSummaryProps) {
	return (
		<div style={{ padding: "0.5rem 0.625rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
			{/* Title row */}
			<div style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem" }}>
				<span
					style={{
						width: "0.5rem",
						height: "0.5rem",
						borderRadius: "50%",
						background: PRIORITY_COLORS[task.priority],
						flexShrink: 0,
						marginTop: "0.25rem",
					}}
				/>
				<span
					style={{
						flex: 1,
						fontSize: "0.75rem",
						color: "var(--place-text-primary)",
						lineHeight: "1.3",
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
						textDecoration: task.status === "complete" ? "line-through" : "none",
					}}
				>
					{task.title}
				</span>
				{onTogglePin && (
					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); onTogglePin(task.id); }}
						title={task.pinnedToday ? "Unpin from today" : "Pin to today"}
						style={{
							background: "transparent",
							border: "none",
							cursor: "pointer",
							color: task.pinnedToday ? "#ffcf73" : "var(--place-text-tertiary)",
							fontSize: "0.75rem",
							padding: "0 0.125rem",
							flexShrink: 0,
							opacity: task.pinnedToday ? 1 : 0.4,
							lineHeight: 1,
						}}
					>
						📍
					</button>
				)}
				<button
					type="button"
					onClick={(e) => { e.stopPropagation(); onArchive(task.id); }}
					title="Archive"
					style={{
						background: "transparent",
						border: "none",
						cursor: "pointer",
						color: "var(--place-text-tertiary)",
						fontSize: "0.7rem",
						padding: "0 0.125rem",
						flexShrink: 0,
						opacity: 0.5,
					}}
				>
					&times;
				</button>
			</div>

			{/* Metadata row */}
			{(task.dueDate ?? task.category) && (
				<div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", paddingLeft: "0.875rem" }}>
					{task.dueDate && (
						<span style={badgeStyle}>{task.dueDate}</span>
					)}
					{task.category && (
						<span style={{ ...badgeStyle, color: "var(--place-secondary-400)", background: "var(--place-secondary-subtle)" }}>
							{task.category}
						</span>
					)}
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
	background: "var(--place-surface-3)",
	border: "1px solid var(--place-border-default)",
	borderRadius: "0.25rem",
	padding: "0.25rem 0.375rem",
	color: "var(--place-text-primary)",
	fontSize: "0.75rem",
	outline: "none",
	width: "100%",
	boxSizing: "border-box",
};

const badgeStyle: React.CSSProperties = {
	fontSize: "0.6rem",
	color: "var(--place-text-secondary)",
	background: "var(--place-surface-3)",
	borderRadius: "0.25rem",
	padding: "1px 4px",
};

const saveBtnStyle: React.CSSProperties = {
	fontSize: "0.65rem",
	color: "var(--place-primary-400)",
	background: "transparent",
	border: "1px solid var(--place-primary-400)",
	borderRadius: "0.25rem",
	padding: "0.15rem 0.5rem",
	cursor: "pointer",
};

const cancelBtnStyle: React.CSSProperties = {
	fontSize: "0.65rem",
	color: "var(--place-text-secondary)",
	background: "transparent",
	border: "1px solid var(--place-border-default)",
	borderRadius: "0.25rem",
	padding: "0.15rem 0.5rem",
	cursor: "pointer",
};
