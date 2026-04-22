'use client';

import { useEffect, useMemo } from "react";
import { useTrackersStore } from "@/src/stores/trackers-store";
import { DeskTile } from "../DeskTile";

const EMOJI_ROW = ["😄", "🙂", "😐", "😟", "😩", "⚡️", "🧠", "💤"];

export function FeelCheckTile() {
	const { feels, logFeel, loadAll } = useTrackersStore();

	useEffect(() => {
		if (feels.length === 0) void loadAll();
	}, [feels.length, loadAll]);

	const latest = feels[0] ?? null;

	const strip = useMemo(() => {
		const today = feels.slice(0, 8).reverse();
		return today;
	}, [feels]);

	return (
		<DeskTile title="Feel">
			<div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(8, 1fr)",
						gap: "2px",
					}}
				>
					{EMOJI_ROW.map((emoji) => (
						<button
							key={emoji}
							type="button"
							onClick={() => void logFeel(emoji)}
							title={`Log ${emoji}`}
							style={{
								background: "rgba(255,255,255,0.03)",
								border: "1px solid rgba(255,255,255,0.06)",
								borderRadius: "4px",
								padding: "4px 0",
								cursor: "pointer",
								fontSize: "0.95rem",
								lineHeight: 1,
							}}
						>
							{emoji}
						</button>
					))}
				</div>
				{strip.length > 0 && (
					<div
						style={{
							display: "flex",
							gap: "2px",
							justifyContent: "flex-start",
							fontSize: "0.8rem",
							opacity: 0.7,
						}}
					>
						{strip.map((f) => (
							<span key={f.id} title={new Date(f.at).toLocaleTimeString()}>
								{f.emoji}
							</span>
						))}
					</div>
				)}
				{latest && (
					<div
						style={{
							fontSize: "0.62rem",
							color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
						}}
					>
						last: {new Date(latest.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
					</div>
				)}
			</div>
		</DeskTile>
	);
}
