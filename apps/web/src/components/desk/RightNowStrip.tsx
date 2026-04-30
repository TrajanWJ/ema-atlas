'use client';

import { useEffect, useRef, useState } from "react";
import { useRightNowStore } from "@/src/stores/right-now-store";
import { SuggestionSlot } from "@/src/components/shared/SuggestionSlot";

function relativeFrom(iso: string): string {
	const then = new Date(iso).getTime();
	const now = Date.now();
	const secs = Math.floor((now - then) / 1000);
	if (secs < 60) return "just now";
	const mins = Math.floor(secs / 60);
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export function RightNowStrip() {
	const { current, recent, load, set: setState } = useRightNowStore();
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState("");
	const [expanded, setExpanded] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		void load();
	}, [load]);

	// Press N to focus (unless already in an input)
	useEffect(() => {
		function handler(e: KeyboardEvent) {
			if (e.key !== "n" && e.key !== "N") return;
			const tag = (document.activeElement?.tagName ?? "").toLowerCase();
			if (tag === "input" || tag === "textarea") return;
			e.preventDefault();
			setEditing(true);
			setDraft(current?.text ?? "");
			setTimeout(() => inputRef.current?.focus(), 10);
		}
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [current]);

	async function save() {
		const text = draft.trim();
		if (!text) {
			setEditing(false);
			return;
		}
		await setState(text);
		setEditing(false);
	}

	const hasCurrent = current && current.text.trim().length > 0;

	return (
		<div
			style={{
				background:
					"linear-gradient(180deg, rgba(138, 180, 255, 0.06), rgba(138, 180, 255, 0.02))",
				border: "1px solid rgba(138, 180, 255, 0.18)",
				borderRadius: "12px",
				padding: "0.875rem 1.125rem",
				display: "flex",
				flexDirection: "column",
				gap: "0.375rem",
				minHeight: "60px",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div
						style={{
							fontSize: "0.6rem",
							textTransform: "uppercase",
							letterSpacing: "0.12em",
							color: "rgba(138, 180, 255, 0.65)",
							fontWeight: 600,
							marginBottom: "0.125rem",
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
						}}
					>
						<span>Right now</span>
						{hasCurrent && current && (
							<span style={{ opacity: 0.6, fontWeight: 400 }}>
								— started {relativeFrom(current.startedAt)}
							</span>
						)}
					</div>
					{editing ? (
						<input
							ref={inputRef}
							type="text"
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							onBlur={() => void save()}
							onKeyDown={(e) => {
								if (e.key === "Enter") void save();
								if (e.key === "Escape") {
									setDraft(current?.text ?? "");
									setEditing(false);
								}
							}}
							placeholder="Right now I am…"
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
								setDraft(current?.text ?? "");
								setEditing(true);
							}}
							style={{
								fontSize: "1.125rem",
								fontWeight: 500,
								cursor: "text",
								color: hasCurrent
									? "var(--place-text-primary, rgba(255, 255, 255, 0.92))"
									: "var(--place-text-secondary, rgba(255, 255, 255, 0.35))",
							}}
						>
							{hasCurrent ? current!.text : "Right now I am… (press N)"}
						</div>
					)}
				</div>
				<button
					type="button"
					onClick={() => setExpanded((v) => !v)}
					title="Recent states"
					style={{
						background: "transparent",
						border: "1px solid rgba(255, 255, 255, 0.1)",
						borderRadius: "6px",
						color: "var(--place-text-secondary, rgba(255, 255, 255, 0.4))",
						fontSize: "0.75rem",
						padding: "4px 8px",
						cursor: "pointer",
						flexShrink: 0,
					}}
				>
					{expanded ? "▴" : "▾"} recent
				</button>
			</div>

			<SuggestionSlot for="right-now" />

			{expanded && (
				<div
					style={{
						marginTop: "0.5rem",
						borderTop: "1px solid rgba(255, 255, 255, 0.06)",
						paddingTop: "0.5rem",
					}}
				>
					{recent.length === 0 ? (
						<div
							style={{
								fontSize: "0.72rem",
								color: "var(--place-text-secondary, rgba(255, 255, 255, 0.35))",
								textAlign: "center",
								padding: "0.5rem",
							}}
						>
							No history yet.
						</div>
					) : (
						<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
							{recent.map((s) => (
								<li
									key={s.id}
									style={{
										display: "flex",
										alignItems: "baseline",
										gap: "0.5rem",
										padding: "0.25rem 0",
										fontSize: "0.78rem",
										color: "var(--place-text-secondary, rgba(255, 255, 255, 0.6))",
									}}
								>
									<span
										style={{
											fontSize: "0.65rem",
											color: "rgba(255, 255, 255, 0.35)",
											width: "80px",
											flexShrink: 0,
										}}
									>
										{relativeFrom(s.startedAt)}
									</span>
									<span style={{ flex: 1 }}>{s.text}</span>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
