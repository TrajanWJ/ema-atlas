'use client';

import { useState, useRef, useEffect } from "react";
import type { TaskPriority, KanbanStatus } from "@/src/types/task";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_OPTIONS: readonly {
	readonly value: TaskPriority;
	readonly label: string;
	readonly color: string;
}[] = [
	{ value: "must", label: "Must", color: "var(--place-error)" },
	{ value: "should", label: "Should", color: "var(--place-tertiary-400)" },
	{ value: "could", label: "Could", color: "var(--place-secondary-400)" },
];

const COLUMN_OPTIONS: readonly {
	readonly value: KanbanStatus;
	readonly label: string;
}[] = [
	{ value: "backlog", label: "Backlog" },
	{ value: "today", label: "Today" },
	{ value: "in-progress", label: "In Progress" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QuickAddFormProps {
	readonly onAdd: (title: string, priority: TaskPriority, column: KanbanStatus) => void;
	readonly onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickAddForm({ onAdd, onClose }: QuickAddFormProps) {
	const [title, setTitle] = useState("");
	const [priority, setPriority] = useState<TaskPriority>("should");
	const [column, setColumn] = useState<KanbanStatus>("backlog");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = title.trim();
		if (!trimmed) return;
		onAdd(trimmed, priority, column);
	};

	return (
		<form
			onSubmit={handleSubmit}
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				padding: "0.5rem 0.625rem",
				borderBottom: "1px solid var(--place-border-default)",
				background: "var(--place-surface-2)",
				flexShrink: 0,
				flexWrap: "wrap",
			}}
		>
			{/* Title input */}
			<input
				ref={inputRef}
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Escape") onClose();
				}}
				placeholder="Task title..."
				style={{
					flex: 1,
					minWidth: "120px",
					background: "var(--place-surface-1)",
					border: "1px solid var(--place-border-default)",
					borderRadius: "0.25rem",
					color: "var(--place-text-primary)",
					fontSize: "0.7rem",
					padding: "0.3rem 0.5rem",
					outline: "none",
				}}
			/>

			{/* Priority dots */}
			<div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
				{PRIORITY_OPTIONS.map((opt) => (
					<button
						key={opt.value}
						type="button"
						title={opt.label}
						onClick={() => setPriority(opt.value)}
						style={{
							width: "0.7rem",
							height: "0.7rem",
							borderRadius: "50%",
							background: opt.color,
							border:
								priority === opt.value
									? "2px solid var(--place-text-primary)"
									: "2px solid transparent",
							cursor: "pointer",
							padding: 0,
							opacity: priority === opt.value ? 1 : 0.4,
							flexShrink: 0,
						}}
					/>
				))}
			</div>

			{/* Column selector */}
			<select
				value={column}
				onChange={(e) => setColumn(e.target.value as KanbanStatus)}
				style={{
					background: "var(--place-surface-1)",
					border: "1px solid var(--place-border-default)",
					borderRadius: "0.25rem",
					color: "var(--place-text-primary)",
					fontSize: "0.6rem",
					padding: "0.25rem 0.35rem",
					outline: "none",
					cursor: "pointer",
				}}
			>
				{COLUMN_OPTIONS.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>

			{/* Add button */}
			<button
				type="submit"
				disabled={!title.trim()}
				style={{
					background: "var(--place-primary-400)",
					border: "none",
					color: "#060610",
					fontWeight: 600,
					fontSize: "0.6rem",
					padding: "0.25rem 0.5rem",
					borderRadius: "0.25rem",
					cursor: title.trim() ? "pointer" : "default",
					opacity: title.trim() ? 1 : 0.4,
				}}
			>
				Add
			</button>

			{/* Close button */}
			<button
				type="button"
				onClick={onClose}
				style={{
					background: "transparent",
					border: "none",
					color: "var(--place-text-tertiary)",
					fontSize: "0.7rem",
					cursor: "pointer",
					padding: "0.15rem 0.3rem",
				}}
			>
				&times;
			</button>
		</form>
	);
}
