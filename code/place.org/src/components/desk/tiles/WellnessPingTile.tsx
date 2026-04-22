'use client';

import { useEffect } from "react";
import { useTrackersStore } from "@/src/stores/trackers-store";
import { DeskTile } from "../DeskTile";

const KINDS: { readonly key: "water" | "movement" | "meal"; readonly icon: string; readonly label: string }[] = [
	{ key: "water", icon: "💧", label: "water" },
	{ key: "movement", icon: "🚶", label: "move" },
	{ key: "meal", icon: "🍽", label: "meal" },
];

export function WellnessPingTile() {
	const { wellness, pingWellness, loadAll } = useTrackersStore();

	useEffect(() => {
		void loadAll();
	}, [loadAll]);

	return (
		<DeskTile title="Today">
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr 1fr",
					gap: "6px",
				}}
			>
				{KINDS.map((k) => (
					<button
						key={k.key}
						type="button"
						onClick={() => void pingWellness(k.key)}
						title={`Log ${k.label}`}
						style={{
							background: "rgba(255,255,255,0.03)",
							border: "1px solid rgba(255,255,255,0.06)",
							borderRadius: "6px",
							padding: "6px 2px",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: "2px",
							cursor: "pointer",
							color: "inherit",
							fontFamily: "inherit",
						}}
					>
						<span style={{ fontSize: "1rem" }}>{k.icon}</span>
						<span
							style={{
								fontSize: "0.7rem",
								fontWeight: 600,
								color:
									wellness[k.key] > 0
										? "var(--place-text-primary)"
										: "var(--place-text-secondary, rgba(255,255,255,0.4))",
							}}
						>
							{wellness[k.key]}
						</span>
					</button>
				))}
			</div>
		</DeskTile>
	);
}
