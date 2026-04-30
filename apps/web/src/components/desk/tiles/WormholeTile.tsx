'use client';

import { useEffect, useState } from "react";
import { getDbClient } from "@/src/db/client";
import { getRecentStates } from "@/src/db/queries/right-now";
import type { RightNowState } from "@/src/types/right-now";
import { DeskTile } from "../DeskTile";

function relativeFrom(iso: string): string {
	const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
}

export function WormholeTile() {
	const [earlier, setEarlier] = useState<RightNowState | null>(null);

	useEffect(() => {
		let alive = true;
		void (async () => {
			try {
				const db = getDbClient();
				const recent = await getRecentStates(db, 10);
				// First state that started > 90 min ago — "context I was in earlier"
				const ninetyAgo = Date.now() - 90 * 60 * 1000;
				const hit =
					recent.find((s) => new Date(s.startedAt).getTime() < ninetyAgo) ?? null;
				if (alive) setEarlier(hit);
			} catch {
				/* silent */
			}
		})();
		return () => {
			alive = false;
		};
	}, []);

	return (
		<DeskTile title="Wormhole">
			{earlier ? (
				<div style={{ fontSize: "0.78rem", lineHeight: 1.3 }}>
					<div
						style={{
							color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
							fontSize: "0.68rem",
							marginBottom: "0.2rem",
						}}
					>
						earlier — {relativeFrom(earlier.startedAt)}
					</div>
					<div style={{ color: "var(--place-text-primary, rgba(255,255,255,0.85))" }}>
						{earlier.text}
					</div>
				</div>
			) : (
				<div
					style={{
						fontSize: "0.72rem",
						color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
					}}
				>
					Nothing further back yet.
				</div>
			)}
		</DeskTile>
	);
}
