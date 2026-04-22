'use client';

import { useState } from "react";

interface CaptureInputProps {
	readonly onCapture: (text: string) => void;
	readonly disabled?: boolean;
}

export function CaptureInput({ onCapture, disabled = false }: CaptureInputProps) {
	const [value, setValue] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = value.trim();
		if (!trimmed) return;
		onCapture(trimmed);
		setValue("");
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2 p-3">
			<input
				type="text"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder="capture a thought..."
				disabled={disabled}
				className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
				style={{
					background: "rgba(255,255,255,0.04)",
					border: "1px solid var(--border)",
					color: "var(--text-primary)",
					fontSize: "0.875rem",
				}}
				onFocus={(e) => {
					e.currentTarget.style.borderColor = "var(--border-hover)";
				}}
				onBlur={(e) => {
					e.currentTarget.style.borderColor = "var(--border)";
				}}
			/>
			<button
				type="submit"
				disabled={disabled || !value.trim()}
				className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
				style={{
					background: "var(--accent-blue)",
					color: "#fff",
					fontSize: "0.875rem",
				}}
			>
				Add
			</button>
		</form>
	);
}
