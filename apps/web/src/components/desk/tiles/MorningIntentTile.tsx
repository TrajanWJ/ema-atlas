'use client';

import { useEffect, useState } from "react";
import { useTrackersStore } from "@/src/stores/trackers-store";
import { DeskTile } from "../DeskTile";

export function MorningIntentTile() {
	const { morningIntent, setMorningIntent, loadAll } = useTrackersStore();
	const [draft, setDraft] = useState("");
	const [editing, setEditing] = useState(false);

	useEffect(() => {
		if (!morningIntent) void loadAll();
	}, [morningIntent, loadAll]);

	useEffect(() => {
		setDraft(morningIntent?.text ?? "");
	}, [morningIntent]);

	async function save() {
		const text = draft.trim();
		if (!text) {
			setEditing(false);
			return;
		}
		await setMorningIntent(text);
		setEditing(false);
	}

	return (
		<DeskTile title="Morning intent">
			{editing ? (
				<textarea
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={() => void save()}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							setDraft(morningIntent?.text ?? "");
							setEditing(false);
						}
					}}
					autoFocus
					rows={3}
					style={{
						width: "100%",
						background: "transparent",
						border: "none",
						color: "inherit",
						fontFamily: "inherit",
						fontSize: "0.82rem",
						outline: "none",
						resize: "none",
					}}
				/>
			) : (
				<div
					onClick={() => setEditing(true)}
					style={{
						fontSize: "0.82rem",
						cursor: "text",
						color: morningIntent?.text
							? "var(--place-text-primary)"
							: "var(--place-text-secondary, rgba(255,255,255,0.35))",
						lineHeight: 1.3,
					}}
				>
					{morningIntent?.text ?? "What do you want to walk away from today with?"}
				</div>
			)}
		</DeskTile>
	);
}
