'use client';

import { useEffect, useState } from "react";
import { useTrackersStore } from "@/src/stores/trackers-store";
import { DeskTile } from "../DeskTile";

export function OneWordTile() {
	const { oneWord, setOneWord, loadAll } = useTrackersStore();
	const [draft, setDraft] = useState("");
	const [editing, setEditing] = useState(false);

	useEffect(() => {
		void loadAll();
	}, [loadAll]);

	useEffect(() => {
		setDraft(oneWord?.word ?? "");
	}, [oneWord]);

	async function save() {
		const word = draft.trim();
		if (!word) {
			setEditing(false);
			return;
		}
		await setOneWord(word);
		setEditing(false);
	}

	return (
		<DeskTile title="One word">
			{editing ? (
				<input
					type="text"
					value={draft}
					onChange={(e) => setDraft(e.target.value.replace(/\s+/g, ""))}
					onBlur={() => void save()}
					onKeyDown={(e) => {
						if (e.key === "Enter") void save();
						if (e.key === "Escape") {
							setDraft(oneWord?.word ?? "");
							setEditing(false);
						}
					}}
					autoFocus
					maxLength={32}
					style={{
						width: "100%",
						background: "transparent",
						border: "none",
						color: "inherit",
						fontFamily: "inherit",
						fontSize: "1rem",
						fontWeight: 600,
						textAlign: "center",
						outline: "none",
					}}
				/>
			) : (
				<div
					onClick={() => setEditing(true)}
					style={{
						fontSize: "1rem",
						fontWeight: 600,
						textAlign: "center",
						cursor: "text",
						padding: "0.25rem 0",
						color: oneWord?.word
							? "var(--place-text-primary)"
							: "var(--place-text-secondary, rgba(255,255,255,0.35))",
					}}
				>
					{oneWord?.word ?? "—"}
				</div>
			)}
		</DeskTile>
	);
}
