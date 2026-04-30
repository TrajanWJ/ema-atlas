'use client';

import { useState } from "react";
import type { TaskPriority } from "@/src/types/task";

interface TaskInputProps {
	readonly onAdd: (title: string, priority: TaskPriority) => void;
	readonly disabled?: boolean;
}

const PRIORITY_DOTS: { readonly priority: TaskPriority; readonly color: string; readonly label: string }[] = [
	{ priority: "must", color: "var(--place-error)", label: "Must" },
	{ priority: "should", color: "var(--place-tertiary-400)", label: "Should" },
	{ priority: "could", color: "var(--place-secondary-400)", label: "Could" },
];

export function TaskInput({ onAdd, disabled = false }: TaskInputProps) {
	const [title, setTitle] = useState("");
	const [priority, setPriority] = useState<TaskPriority>("should");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = title.trim();
		if (!trimmed) return;
		onAdd(trimmed, priority);
		setTitle("");
	};

	return (
		<form
			onSubmit={handleSubmit}
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				padding: "0.75rem",
				borderBottom: "1px solid var(--place-border-default)",
			}}
		>
			{/* Priority selector */}
			<div style={{ display: "flex", gap: "0.25rem" }}>
				{PRIORITY_DOTS.map(({ priority: p, color, label }) => (
					<button
						key={p}
						type="button"
						title={label}
						onClick={() => setPriority(p)}
						style={{
							width: "0.75rem",
							height: "0.75rem",
							borderRadius: "50%",
							background: color,
							border: priority === p ? "2px solid var(--place-text-primary)" : "2px solid transparent",
							cursor: "pointer",
							padding: 0,
							opacity: priority === p ? 1 : 0.4,
							flexShrink: 0,
						}}
					/>
				))}
			</div>

			{/* Text input */}
			<input
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder="Add task…"
				disabled={disabled}
				style={{
					flex: 1,
					background: "transparent",
					border: "none",
					outline: "none",
					color: "var(--place-text-primary)",
					fontSize: "0.8rem",
				}}
			/>

			<button
				type="submit"
				disabled={disabled || !title.trim()}
				style={{
					background: "transparent",
					border: "none",
					cursor: "pointer",
					color: "var(--place-secondary-400)",
					fontSize: "0.75rem",
					padding: "0.25rem 0.5rem",
					opacity: !title.trim() ? 0.3 : 1,
				}}
			>
				Add
			</button>
		</form>
	);
}
