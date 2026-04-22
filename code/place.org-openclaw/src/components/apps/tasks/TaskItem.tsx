'use client';

import { useState } from "react";
import type { Task } from "@/src/types/task";

interface TaskItemProps {
	readonly task: Task;
	readonly onComplete: (id: string) => void;
	readonly onArchive: (id: string) => void;
	readonly onUpdate: (id: string, fields: Partial<Pick<Task, "title" | "description">>) => void;
}

const PRIORITY_COLORS: Record<Task["priority"], string> = {
	must: "var(--accent-red, #ef4444)",
	should: "var(--accent-warm, #f97316)",
	could: "var(--accent-blue)",
};

export function TaskItem({ task, onComplete, onArchive, onUpdate }: TaskItemProps) {
	const [expanded, setExpanded] = useState(false);
	const [editTitle, setEditTitle] = useState(task.title);
	const [editDesc, setEditDesc] = useState(task.description ?? "");

	const isComplete = task.status === "complete";

	const handleSave = () => {
		const trimTitle = editTitle.trim();
		if (trimTitle && (trimTitle !== task.title || editDesc !== (task.description ?? ""))) {
			onUpdate(task.id, {
				title: trimTitle,
				description: editDesc.trim() || null,
			});
		}
		setExpanded(false);
	};

	return (
		<div
			style={{
				borderBottom: "1px solid var(--border)",
				opacity: isComplete ? 0.5 : 1,
			}}
		>
			{/* Main row */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "0.5rem",
					padding: "0.5rem 0.75rem",
				}}
			>
				{/* Checkbox */}
				<button
					type="button"
					onClick={() => !isComplete && onComplete(task.id)}
					disabled={isComplete}
					style={{
						width: "1rem",
						height: "1rem",
						borderRadius: "50%",
						border: `2px solid ${PRIORITY_COLORS[task.priority]}`,
						background: isComplete ? PRIORITY_COLORS[task.priority] : "transparent",
						cursor: isComplete ? "default" : "pointer",
						flexShrink: 0,
						padding: 0,
					}}
					title={isComplete ? "Completed" : "Mark complete"}
				/>

				{/* Title */}
				<span
					onClick={() => setExpanded((v) => !v)}
					style={{
						flex: 1,
						fontSize: "0.8rem",
						color: "var(--text-primary)",
						cursor: "pointer",
						textDecoration: isComplete ? "line-through" : "none",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{task.title}
				</span>

				{/* Priority dot */}
				<span
					style={{
						width: "0.5rem",
						height: "0.5rem",
						borderRadius: "50%",
						background: PRIORITY_COLORS[task.priority],
						flexShrink: 0,
					}}
				/>

				{/* Due date */}
				{task.dueDate && (
					<span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", flexShrink: 0 }}>
						{task.dueDate}
					</span>
				)}

				{/* Category tag */}
				{task.category && (
					<span
						style={{
							fontSize: "0.6rem",
							color: "var(--accent-blue)",
							background: "rgba(59,130,246,0.1)",
							borderRadius: "4px",
							padding: "1px 4px",
							flexShrink: 0,
						}}
					>
						{task.category}
					</span>
				)}

				{/* Archive button */}
				<button
					type="button"
					onClick={() => onArchive(task.id)}
					title="Archive"
					style={{
						background: "transparent",
						border: "none",
						cursor: "pointer",
						color: "var(--text-secondary)",
						fontSize: "0.65rem",
						padding: "0.1rem 0.25rem",
						flexShrink: 0,
					}}
				>
					×
				</button>
			</div>

			{/* Expanded edit area */}
			{expanded && !isComplete && (
				<div style={{ padding: "0 0.75rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
					<input
						type="text"
						value={editTitle}
						onChange={(e) => setEditTitle(e.target.value)}
						style={{
							background: "var(--surface)",
							border: "1px solid var(--border)",
							borderRadius: "4px",
							padding: "0.25rem 0.5rem",
							color: "var(--text-primary)",
							fontSize: "0.8rem",
							outline: "none",
						}}
					/>
					<textarea
						value={editDesc}
						onChange={(e) => setEditDesc(e.target.value)}
						placeholder="Description…"
						rows={2}
						style={{
							background: "var(--surface)",
							border: "1px solid var(--border)",
							borderRadius: "4px",
							padding: "0.25rem 0.5rem",
							color: "var(--text-primary)",
							fontSize: "0.75rem",
							outline: "none",
							resize: "none",
						}}
					/>
					<div style={{ display: "flex", gap: "0.5rem" }}>
						<button
							type="button"
							onClick={handleSave}
							style={{
								fontSize: "0.7rem",
								color: "var(--accent-blue)",
								background: "transparent",
								border: "1px solid var(--accent-blue)",
								borderRadius: "4px",
								padding: "0.2rem 0.5rem",
								cursor: "pointer",
							}}
						>
							Save
						</button>
						<button
							type="button"
							onClick={() => setExpanded(false)}
							style={{
								fontSize: "0.7rem",
								color: "var(--text-secondary)",
								background: "transparent",
								border: "1px solid var(--border)",
								borderRadius: "4px",
								padding: "0.2rem 0.5rem",
								cursor: "pointer",
							}}
						>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
