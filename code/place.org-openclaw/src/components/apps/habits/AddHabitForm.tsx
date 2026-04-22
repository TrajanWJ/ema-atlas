'use client';

import { useState } from "react";
import type { HabitFrequency } from "@/src/types/habit";

interface AddHabitFormProps {
	readonly onAdd: (name: string, frequency: HabitFrequency, target: string | null) => void;
	readonly onCancel: () => void;
}

export function AddHabitForm({ onAdd, onCancel }: AddHabitFormProps) {
	const [name, setName] = useState("");
	const [frequency, setFrequency] = useState<HabitFrequency>("daily");
	const [target, setTarget] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) return;
		onAdd(trimmed, frequency, target.trim() || null);
	};

	return (
		<form
			onSubmit={handleSubmit}
			style={{
				padding: "0.75rem",
				borderBottom: "1px solid var(--border)",
				display: "flex",
				flexDirection: "column",
				gap: "0.5rem",
			}}
		>
			<input
				type="text"
				value={name}
				onChange={(e) => setName(e.target.value)}
				placeholder="Habit name…"
				autoFocus
				style={{
					background: "var(--surface)",
					border: "1px solid var(--border)",
					borderRadius: "4px",
					padding: "0.3rem 0.5rem",
					color: "var(--text-primary)",
					fontSize: "0.8rem",
					outline: "none",
				}}
			/>

			<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
				<select
					value={frequency}
					onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
					style={{
						background: "var(--surface)",
						border: "1px solid var(--border)",
						borderRadius: "4px",
						padding: "0.2rem 0.4rem",
						color: "var(--text-primary)",
						fontSize: "0.75rem",
						outline: "none",
					}}
				>
					<option value="daily">Daily</option>
					<option value="weekly">Weekly</option>
				</select>

				<input
					type="text"
					value={target}
					onChange={(e) => setTarget(e.target.value)}
					placeholder="Target (e.g. 30 min)"
					style={{
						flex: 1,
						background: "var(--surface)",
						border: "1px solid var(--border)",
						borderRadius: "4px",
						padding: "0.2rem 0.5rem",
						color: "var(--text-primary)",
						fontSize: "0.75rem",
						outline: "none",
					}}
				/>
			</div>

			<div style={{ display: "flex", gap: "0.5rem" }}>
				<button
					type="submit"
					disabled={!name.trim()}
					style={{
						fontSize: "0.7rem",
						color: "var(--accent-blue)",
						background: "transparent",
						border: "1px solid var(--accent-blue)",
						borderRadius: "4px",
						padding: "0.2rem 0.75rem",
						cursor: "pointer",
						opacity: !name.trim() ? 0.4 : 1,
					}}
				>
					Add
				</button>
				<button
					type="button"
					onClick={onCancel}
					style={{
						fontSize: "0.7rem",
						color: "var(--text-secondary)",
						background: "transparent",
						border: "1px solid var(--border)",
						borderRadius: "4px",
						padding: "0.2rem 0.75rem",
						cursor: "pointer",
					}}
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
