'use client';

import { useEffect, useState } from "react";
import { getDbClient } from "@/src/db/client";
import { DeskTile } from "../DeskTile";

interface TimeBlockRow {
	readonly id: string;
	readonly label: string;
	readonly category: string;
	readonly startTime: string;
	readonly endTime: string;
}

function todayLocal(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const CATEGORY_COLORS: Record<string, string> = {
	"deep-work": "#8ab4ff",
	break: "#9de0b5",
	admin: "#c6a5f6",
	meeting: "#f6a5c0",
};

export function ScheduleTile() {
	const [blocks, setBlocks] = useState<readonly TimeBlockRow[]>([]);

	useEffect(() => {
		void (async () => {
			try {
				const db = getDbClient();
				const rows = await db.query(
					"SELECT id, label, category, start_time, end_time FROM time_blocks WHERE date = ? ORDER BY start_time ASC",
					[todayLocal()],
				);
				setBlocks(
					rows.map((r) => ({
						id: String(r["id"]),
						label: String(r["label"]),
						category: String(r["category"] ?? "deep-work"),
						startTime: String(r["start_time"]),
						endTime: String(r["end_time"]),
					})),
				);
			} catch (err) {
				console.error("[desk:schedule] load failed:", err);
			}
		})();
	}, []);

	return (
		<DeskTile title={`Today's schedule — ${blocks.length}`}>
			{blocks.length === 0 ? (
				<div
					style={{
						color: "var(--place-text-secondary, rgba(255, 255, 255, 0.35))",
						fontSize: "0.78rem",
						textAlign: "center",
						padding: "1.5rem 1rem",
					}}
				>
					No time blocks yet today.
					<br />
					<span style={{ fontSize: "0.68rem", opacity: 0.6 }}>
						Plan the day in Time Blocker.
					</span>
				</div>
			) : (
				<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
					{blocks.map((b) => (
						<li
							key={b.id}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.625rem",
								padding: "0.45rem 0.25rem",
								borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
							}}
						>
							<span
								aria-hidden
								style={{
									width: "4px",
									alignSelf: "stretch",
									borderRadius: "2px",
									background: CATEGORY_COLORS[b.category] ?? "#8ab4ff",
									flexShrink: 0,
								}}
							/>
							<div style={{ flex: 1, minWidth: 0 }}>
								<div
									style={{
										fontSize: "0.82rem",
										color: "var(--place-text-primary, rgba(255, 255, 255, 0.9))",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{b.label}
								</div>
								<div
									style={{
										fontSize: "0.68rem",
										color: "var(--place-text-secondary, rgba(255, 255, 255, 0.4))",
									}}
								>
									{b.startTime} – {b.endTime}
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</DeskTile>
	);
}
