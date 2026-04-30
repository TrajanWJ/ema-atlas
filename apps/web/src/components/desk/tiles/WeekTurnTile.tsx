'use client';

import { useEffect, useState } from "react";
import { useTrackersStore } from "@/src/stores/trackers-store";
import { DeskTile } from "../DeskTile";

function dayOfWeek(): number {
	return new Date().getDay(); // 0=Sun, 1=Mon, ...
}

export function WeekTurnTile() {
	const { weekTurn, setWeekTurn, loadAll } = useTrackersStore();
	const [editing, setEditing] = useState(false);
	const [lastThree, setLastThree] = useState<string[]>(["", "", ""]);
	const [nextThree, setNextThree] = useState<string[]>(["", "", ""]);

	useEffect(() => {
		if (!weekTurn) void loadAll();
	}, [weekTurn, loadAll]);

	useEffect(() => {
		if (weekTurn) {
			setLastThree([
				weekTurn.lastThree[0] ?? "",
				weekTurn.lastThree[1] ?? "",
				weekTurn.lastThree[2] ?? "",
			]);
			setNextThree([
				weekTurn.nextThree[0] ?? "",
				weekTurn.nextThree[1] ?? "",
				weekTurn.nextThree[2] ?? "",
			]);
		}
	}, [weekTurn]);

	const dow = dayOfWeek();
	const isWeekTurnDay = dow === 0 || dow === 1; // Sun or Mon

	async function save() {
		const last = lastThree.filter((s) => s.trim());
		const next = nextThree.filter((s) => s.trim());
		await setWeekTurn(last, next);
		setEditing(false);
	}

	return (
		<DeskTile
			title="Week turn"
			action={
				isWeekTurnDay && !editing ? (
					<span
						style={{
							fontSize: "0.6rem",
							color: "rgba(255, 207, 115, 0.7)",
						}}
					>
						due
					</span>
				) : null
			}
		>
			{editing ? (
				<div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
					<Section label="Last week — 3 things" />
					{[0, 1, 2].map((i) => (
						<input
							key={`l${i}`}
							type="text"
							placeholder={`#${i + 1}`}
							value={lastThree[i] ?? ""}
							onChange={(e) => {
								const copy = [...lastThree];
								copy[i] = e.target.value;
								setLastThree(copy);
							}}
							style={inputStyle}
						/>
					))}
					<Section label="This week — 3 things" />
					{[0, 1, 2].map((i) => (
						<input
							key={`n${i}`}
							type="text"
							placeholder={`#${i + 1}`}
							value={nextThree[i] ?? ""}
							onChange={(e) => {
								const copy = [...nextThree];
								copy[i] = e.target.value;
								setNextThree(copy);
							}}
							style={inputStyle}
						/>
					))}
					<div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
						<button type="button" onClick={() => setEditing(false)} style={btn()}>
							cancel
						</button>
						<button type="button" onClick={() => void save()} style={btn("primary")}>
							save
						</button>
					</div>
				</div>
			) : (
				<div
					onClick={() => setEditing(true)}
					style={{ cursor: "text", display: "flex", flexDirection: "column", gap: "0.375rem" }}
				>
					{weekTurn && (weekTurn.lastThree.length > 0 || weekTurn.nextThree.length > 0) ? (
						<>
							{weekTurn.nextThree.length > 0 && (
								<div>
									<Section label="This week" />
									{weekTurn.nextThree.map((t, i) => (
										<Line key={`n${i}`} text={t} />
									))}
								</div>
							)}
							{weekTurn.lastThree.length > 0 && (
								<div style={{ opacity: 0.55, marginTop: "0.25rem" }}>
									<Section label="Last week" />
									{weekTurn.lastThree.map((t, i) => (
										<Line key={`l${i}`} text={t} />
									))}
								</div>
							)}
						</>
					) : (
						<div
							style={{
								fontSize: "0.75rem",
								color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
								textAlign: "center",
								padding: "0.5rem",
							}}
						>
							Click to reflect on last week + plan this one.
						</div>
					)}
				</div>
			)}
		</DeskTile>
	);
}

function Section({ label }: { readonly label: string }) {
	return (
		<div
			style={{
				fontSize: "0.58rem",
				textTransform: "uppercase",
				letterSpacing: "0.08em",
				color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
				marginBottom: "2px",
			}}
		>
			{label}
		</div>
	);
}

function Line({ text }: { readonly text: string }) {
	return (
		<div style={{ fontSize: "0.76rem", padding: "1px 0" }}>
			<span style={{ opacity: 0.5, marginRight: "4px" }}>·</span>
			{text}
		</div>
	);
}

const inputStyle: React.CSSProperties = {
	width: "100%",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.06)",
	borderRadius: "4px",
	padding: "3px 6px",
	color: "inherit",
	fontFamily: "inherit",
	fontSize: "0.76rem",
	outline: "none",
};

function btn(variant?: "primary"): React.CSSProperties {
	return {
		background: variant === "primary" ? "rgba(138,180,255,0.12)" : "transparent",
		border: `1px solid ${variant === "primary" ? "rgba(138,180,255,0.3)" : "rgba(255,255,255,0.08)"}`,
		borderRadius: "4px",
		color: variant === "primary" ? "#8ab4ff" : "var(--place-text-secondary, rgba(255,255,255,0.5))",
		fontSize: "0.68rem",
		padding: "3px 8px",
		cursor: "pointer",
		fontFamily: "inherit",
	};
}
