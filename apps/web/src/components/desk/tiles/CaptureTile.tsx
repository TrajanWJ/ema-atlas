'use client';

import { useEffect, useRef, useState } from "react";
import { useInboxStore } from "@/src/stores/inbox-store";
import { DeskTile } from "../DeskTile";

export function CaptureTile() {
	const { items, load, add } = useInboxStore();
	const [text, setText] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		void load();
	}, [load]);

	useEffect(() => {
		function handler(e: KeyboardEvent) {
			if (e.key === "/" && document.activeElement !== inputRef.current) {
				const tag = (document.activeElement?.tagName ?? "").toLowerCase();
				if (tag === "input" || tag === "textarea") return;
				e.preventDefault();
				inputRef.current?.focus();
			}
		}
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, []);

	async function handleSubmit() {
		const trimmed = text.trim();
		if (!trimmed) return;
		await add(trimmed);
		setText("");
	}

	return (
		<DeskTile title={`Capture — ${items.length} in inbox`}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					void handleSubmit();
				}}
				style={{
					display: "flex",
					gap: "0.5rem",
					alignItems: "center",
				}}
			>
				<input
					ref={inputRef}
					type="text"
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							setText("");
							(e.target as HTMLInputElement).blur();
						}
					}}
					placeholder="Quick capture — / to focus"
					style={{
						flex: 1,
						background: "rgba(255, 255, 255, 0.03)",
						border: "1px solid rgba(255, 255, 255, 0.08)",
						borderRadius: "6px",
						padding: "0.5rem 0.75rem",
						color: "var(--place-text-primary, rgba(255, 255, 255, 0.9))",
						fontFamily: "inherit",
						fontSize: "0.88rem",
						outline: "none",
					}}
				/>
				<button
					type="submit"
					disabled={!text.trim()}
					style={{
						background: text.trim() ? "rgba(138, 180, 255, 0.12)" : "transparent",
						border: "1px solid rgba(138, 180, 255, 0.3)",
						borderRadius: "6px",
						color: "#8ab4ff",
						fontSize: "0.75rem",
						padding: "0.5rem 0.875rem",
						cursor: text.trim() ? "pointer" : "default",
						opacity: text.trim() ? 1 : 0.4,
						fontFamily: "inherit",
					}}
				>
					Save
				</button>
			</form>
		</DeskTile>
	);
}
