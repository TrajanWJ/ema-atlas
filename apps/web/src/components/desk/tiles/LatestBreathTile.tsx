'use client';

import { useEffect, useState } from "react";
import { getDbClient } from "@/src/db/client";
import { dayBundle, composeBreath } from "@/src/context/bundle";
import { DeskTile } from "../DeskTile";
import { SuggestionSlot } from "@/src/components/shared/SuggestionSlot";

export function LatestBreathTile() {
	const [sentence, setSentence] = useState<string>("");

	useEffect(() => {
		let alive = true;
		const load = async () => {
			try {
				const db = getDbClient();
				const b = await dayBundle(db);
				if (alive) setSentence(composeBreath(b));
			} catch {
				/* silent */
			}
		};
		void load();
		const interval = setInterval(load, 60_000);
		return () => {
			alive = false;
			clearInterval(interval);
		};
	}, []);

	return (
		<DeskTile title="Breath">
			<div
				style={{
					fontSize: "0.85rem",
					lineHeight: 1.3,
					color: "var(--place-text-primary, rgba(255,255,255,0.85))",
					fontStyle: "italic",
					padding: "0.25rem 0",
				}}
			>
				{sentence || "…"}
			</div>
			<SuggestionSlot for="breath" />
		</DeskTile>
	);
}
