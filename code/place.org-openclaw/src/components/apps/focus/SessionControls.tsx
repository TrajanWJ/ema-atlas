'use client';

import { useState } from "react";
import { useFocusStore } from "@/src/stores/focus-store";

export function SessionControls() {
	const isRunning = useFocusStore((s) => s.isRunning);
	const activeBlock = useFocusStore((s) => s.activeBlock);
	const start = useFocusStore((s) => s.start);
	const transition = useFocusStore((s) => s.transition);
	const end = useFocusStore((s) => s.end);
	const [label, setLabel] = useState("");

	if (!isRunning) {
		return (
			<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
				<button
					type="button"
					onClick={() => start().catch(() => {})}
					style={{
						background: "var(--accent-blue)",
						border: "none",
						color: "#060610",
						fontWeight: 700,
						fontSize: "0.9rem",
						letterSpacing: "0.08em",
						padding: "0.75rem 2.5rem",
						borderRadius: "8px",
						cursor: "pointer",
						textTransform: "uppercase",
					}}
				>
					Start Focus
				</button>
			</div>
		);
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", width: "100%" }}>
			<input
				type="text"
				placeholder={`Label this ${activeBlock?.type.replace("_", " ") ?? "block"}…`}
				value={label}
				onChange={(e) => setLabel(e.target.value)}
				style={{
					background: "transparent",
					border: "1px solid var(--border)",
					borderRadius: "6px",
					color: "var(--text-primary)",
					fontSize: "0.8rem",
					padding: "0.4rem 0.75rem",
					width: "100%",
					maxWidth: "280px",
					outline: "none",
				}}
			/>

			<div style={{ display: "flex", gap: "0.75rem" }}>
				<button
					type="button"
					onClick={() => {
						transition().catch(() => {});
						setLabel("");
					}}
					style={{
						background: "var(--accent-blue)",
						border: "none",
						color: "#060610",
						fontWeight: 700,
						fontSize: "0.85rem",
						letterSpacing: "0.08em",
						padding: "0.6rem 1.5rem",
						borderRadius: "8px",
						cursor: "pointer",
						textTransform: "uppercase",
					}}
				>
					Transition
				</button>

				<button
					type="button"
					onClick={() => end().catch(() => {})}
					style={{
						background: "transparent",
						border: "1px solid var(--border)",
						color: "var(--text-secondary)",
						fontSize: "0.8rem",
						padding: "0.6rem 1rem",
						borderRadius: "8px",
						cursor: "pointer",
					}}
				>
					End
				</button>
			</div>
		</div>
	);
}
