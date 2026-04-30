'use client';

import { useEffect, useState } from "react";
import { getDbClient } from "@/src/db/client";
import { dayBundle, pressureScore, pressureTone } from "@/src/context/bundle";
import type { DayBundle } from "@/src/context/bundle";
import { DeskTile } from "../DeskTile";

const TONE_COLORS: Record<"calm" | "steady" | "loaded" | "heavy", string> = {
	calm: "#9de0b5",
	steady: "#8ab4ff",
	loaded: "#f59e0b",
	heavy: "#ef4444",
};

export function PressureGaugeTile() {
	const [bundle, setBundle] = useState<DayBundle | null>(null);

	useEffect(() => {
		let alive = true;
		const load = async () => {
			try {
				const db = getDbClient();
				const b = await dayBundle(db);
				if (alive) setBundle(b);
			} catch (err) {
				console.error("[pressure] load failed:", err);
			}
		};
		void load();
		const interval = setInterval(load, 60_000);
		return () => {
			alive = false;
			clearInterval(interval);
		};
	}, []);

	if (!bundle) {
		return (
			<DeskTile title="Pressure">
				<div style={{ fontSize: "0.72rem", color: "var(--place-text-secondary, rgba(255,255,255,0.35))" }}>…</div>
			</DeskTile>
		);
	}

	const score = pressureScore(bundle);
	const tone = pressureTone(score);
	const color = TONE_COLORS[tone];
	const fillPct = score;

	return (
		<DeskTile title="Pressure">
			<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "stretch" }}>
				<div
					style={{
						height: "8px",
						borderRadius: "4px",
						background: "rgba(255,255,255,0.05)",
						overflow: "hidden",
					}}
				>
					<div
						style={{
							height: "100%",
							width: `${fillPct}%`,
							background: color,
							transition: "width 0.4s ease, background 0.4s ease",
						}}
					/>
				</div>
				<div
					style={{
						fontSize: "0.72rem",
						color,
						textTransform: "capitalize",
						fontWeight: 600,
						textAlign: "center",
					}}
				>
					{tone}
				</div>
				<div
					style={{
						fontSize: "0.62rem",
						color: "var(--place-text-secondary, rgba(255,255,255,0.45))",
						textAlign: "center",
					}}
				>
					{bundle.openLoopsCount}L · {bundle.overdueTasksCount}O · {bundle.unprocessedInboxCount}I
				</div>
			</div>
		</DeskTile>
	);
}
