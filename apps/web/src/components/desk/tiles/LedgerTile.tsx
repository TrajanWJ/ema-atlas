'use client';

import { useEffect, useState } from "react";
import { getDbClient } from "@/src/db/client";
import { dayBundle, composeLedger } from "@/src/context/bundle";
import { DeskTile } from "../DeskTile";

export function LedgerTile() {
	const [sentence, setSentence] = useState<string>("");

	useEffect(() => {
		let alive = true;
		const load = async () => {
			try {
				const db = getDbClient();
				const b = await dayBundle(db);
				if (alive) setSentence(composeLedger(b));
			} catch {
				/* silent */
			}
		};
		void load();
		const interval = setInterval(load, 30_000);
		return () => {
			alive = false;
			clearInterval(interval);
		};
	}, []);

	return (
		<DeskTile title="Ledger">
			<div
				style={{
					fontSize: "0.78rem",
					lineHeight: 1.35,
					color: "var(--place-text-primary, rgba(255,255,255,0.8))",
					padding: "0.25rem 0",
				}}
			>
				{sentence || "Today is quiet — nothing logged yet."}
			</div>
		</DeskTile>
	);
}
