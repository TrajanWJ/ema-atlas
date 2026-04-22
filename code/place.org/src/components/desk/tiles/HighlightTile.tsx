'use client';

import { useEffect, useState, useCallback } from "react";
import { getDbClient } from "@/src/db/client";
import {
	getHighlight,
	setHighlight,
	setHighlightCompleted,
} from "@/src/db/queries/daily-highlights";
import type { DailyHighlight } from "@/src/types/daily-highlight";

function todayLocal(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function HighlightTile() {
	const [highlight, setHighlightState] = useState<DailyHighlight | null>(null);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState("");
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		void (async () => {
			try {
				const db = getDbClient();
				const h = await getHighlight(db);
				setHighlightState(h);
				setDraft(h?.text ?? "");
			} catch (err) {
				console.error("[desk:highlight] load failed:", err);
			} finally {
				setLoaded(true);
			}
		})();
	}, []);

	const save = useCallback(async () => {
		const text = draft.trim();
		if (!text) {
			setEditing(false);
			return;
		}
		try {
			const db = getDbClient();
			const saved = await setHighlight(db, text, null, todayLocal());
			setHighlightState(saved);
		} catch (err) {
			console.error("[desk:highlight] save failed:", err);
		}
		setEditing(false);
	}, [draft]);

	const toggleCompleted = useCallback(async () => {
		if (!highlight) return;
		const next = !highlight.completed;
		setHighlightState({ ...highlight, completed: next });
		try {
			const db = getDbClient();
			await setHighlightCompleted(db, next, todayLocal());
		} catch (err) {
			console.error("[desk:highlight] toggle failed:", err);
		}
	}, [highlight]);

	const hasText = highlight && highlight.text && highlight.text.trim().length > 0;

	return (
		<div
			style={{
				background: "linear-gradient(180deg, rgba(255,207,115,0.06), rgba(255,207,115,0.02))",
				border: "1px solid rgba(255, 207, 115, 0.18)",
				borderRadius: "12px",
				padding: "1rem 1.25rem",
				display: "flex",
				alignItems: "center",
				gap: "0.875rem",
				minHeight: "60px",
			}}
		>
			<button
				type="button"
				onClick={() => void toggleCompleted()}
				disabled={!hasText}
				title={highlight?.completed ? "Completed" : "Mark complete"}
				style={{
					width: "22px",
					height: "22px",
					borderRadius: "50%",
					border: "2px solid #ffcf73",
					background: highlight?.completed ? "#ffcf73" : "transparent",
					cursor: hasText ? "pointer" : "default",
					flexShrink: 0,
					padding: 0,
				}}
			/>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						fontSize: "0.6rem",
						textTransform: "uppercase",
						letterSpacing: "0.12em",
						color: "rgba(255, 207, 115, 0.6)",
						fontWeight: 600,
						marginBottom: "0.125rem",
					}}
				>
					Today's Highlight
				</div>
				{editing ? (
					<input
						type="text"
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onBlur={() => void save()}
						onKeyDown={(e) => {
							if (e.key === "Enter") void save();
							if (e.key === "Escape") {
								setDraft(highlight?.text ?? "");
								setEditing(false);
							}
						}}
						placeholder="The one thing that matters today…"
						autoFocus
						style={{
							width: "100%",
							background: "transparent",
							border: "none",
							color: "inherit",
							fontFamily: "inherit",
							fontSize: "1.125rem",
							fontWeight: 500,
							outline: "none",
						}}
					/>
				) : (
					<div
						onClick={() => {
							setDraft(highlight?.text ?? "");
							setEditing(true);
						}}
						style={{
							fontSize: "1.125rem",
							fontWeight: 500,
							cursor: "text",
							textDecoration: highlight?.completed ? "line-through" : "none",
							opacity: highlight?.completed ? 0.55 : 1,
							color: hasText
								? "var(--place-text-primary, rgba(255, 255, 255, 0.92))"
								: "var(--place-text-secondary, rgba(255, 255, 255, 0.35))",
						}}
					>
						{loaded
							? (highlight?.text ?? "The one thing that matters today…")
							: "…"}
					</div>
				)}
			</div>
		</div>
	);
}
