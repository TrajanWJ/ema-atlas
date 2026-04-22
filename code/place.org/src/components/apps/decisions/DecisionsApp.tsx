'use client';

import { useEffect, useState } from "react";
import { useTrackersStore } from "@/src/stores/trackers-store";

function relative(iso: string): string {
	const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
	if (days === 0) return "today";
	if (days === 1) return "yesterday";
	if (days < 30) return `${days}d ago`;
	return `${Math.floor(days / 30)}mo ago`;
}

export function DecisionsApp() {
	const { decisions, logDecision, setDecisionOutcome, deleteDecision, loadAll, loading } = useTrackersStore();
	const [title, setTitle] = useState("");
	const [choice, setChoice] = useState("");
	const [why, setWhy] = useState("");
	const [reversible, setReversible] = useState(true);
	const [expanded, setExpanded] = useState(false);

	useEffect(() => {
		if (decisions.length === 0 && !loading) void loadAll();
	}, [decisions.length, loading, loadAll]);

	async function handleAdd() {
		if (!title.trim()) return;
		await logDecision({ title, choice: choice || null, why: why || null, reversible });
		setTitle("");
		setChoice("");
		setWhy("");
		setReversible(true);
		setExpanded(false);
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				color: "var(--place-text-primary, rgba(255,255,255,0.87))",
				fontSize: "0.85rem",
			}}
		>
			<div
				style={{
					padding: "0.625rem 0.75rem",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
					display: "flex",
					flexDirection: "column",
					gap: "0.375rem",
				}}
			>
				<input
					type="text"
					placeholder="What did you decide?"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					onFocus={() => setExpanded(true)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !expanded) void handleAdd();
					}}
					style={inputStyle}
				/>
				{expanded && (
					<>
						<input
							type="text"
							placeholder="Chose…"
							value={choice}
							onChange={(e) => setChoice(e.target.value)}
							style={{ ...inputStyle, fontSize: "0.78rem" }}
						/>
						<textarea
							placeholder="Why?"
							value={why}
							onChange={(e) => setWhy(e.target.value)}
							rows={2}
							style={{ ...inputStyle, fontSize: "0.78rem", resize: "none" }}
						/>
						<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
							<label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem" }}>
								<input
									type="checkbox"
									checked={reversible}
									onChange={(e) => setReversible(e.target.checked)}
								/>
								Reversible
							</label>
							<button
								type="button"
								onClick={() => void handleAdd()}
								disabled={!title.trim()}
								style={{
									marginLeft: "auto",
									background: title.trim() ? "rgba(138,180,255,0.12)" : "transparent",
									border: "1px solid rgba(138,180,255,0.3)",
									borderRadius: "4px",
									color: "#8ab4ff",
									fontSize: "0.72rem",
									padding: "4px 10px",
									cursor: title.trim() ? "pointer" : "default",
								}}
							>
								Log
							</button>
						</div>
					</>
				)}
			</div>
			<div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.75rem" }}>
				{decisions.length === 0 ? (
					<div
						style={{
							textAlign: "center",
							padding: "1rem",
							fontSize: "0.8rem",
							color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
						}}
					>
						No decisions logged yet.
					</div>
				) : (
					decisions.map((d) => (
						<div
							key={d.id}
							style={{
								padding: "0.5rem 0",
								borderBottom: "1px solid rgba(255,255,255,0.04)",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "baseline",
									gap: "0.5rem",
								}}
							>
								<span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{d.title}</span>
								<span
									style={{
										fontSize: "0.65rem",
										color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
									}}
								>
									{relative(d.decidedAt)}
									{!d.reversible && " · one-way"}
								</span>
							</div>
							{d.choice && (
								<div
									style={{
										fontSize: "0.78rem",
										color: "var(--place-text-secondary, rgba(255,255,255,0.6))",
										marginTop: "2px",
									}}
								>
									→ {d.choice}
								</div>
							)}
							{d.why && (
								<div
									style={{
										fontSize: "0.74rem",
										color: "var(--place-text-secondary, rgba(255,255,255,0.45))",
										marginTop: "2px",
										fontStyle: "italic",
									}}
								>
									{d.why}
								</div>
							)}
							<div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
								{(["good", "bad", "mixed"] as const).map((o) => (
									<button
										key={o}
										type="button"
										onClick={() => void setDecisionOutcome(d.id, o)}
										style={{
											background:
												d.outcome === o
													? o === "good"
														? "rgba(157, 224, 181, 0.15)"
														: o === "bad"
															? "rgba(239, 68, 68, 0.15)"
															: "rgba(245, 158, 11, 0.15)"
													: "transparent",
											border: "1px solid rgba(255,255,255,0.1)",
											borderRadius: "3px",
											color:
												d.outcome === o
													? o === "good"
														? "#9de0b5"
														: o === "bad"
															? "#ef4444"
															: "#f59e0b"
													: "var(--place-text-secondary, rgba(255,255,255,0.45))",
											fontSize: "0.65rem",
											padding: "2px 6px",
											cursor: "pointer",
										}}
									>
										{o}
									</button>
								))}
								<button
									type="button"
									onClick={() => void deleteDecision(d.id)}
									style={{
										marginLeft: "auto",
										background: "transparent",
										border: "none",
										color: "var(--place-text-tertiary, rgba(255,255,255,0.3))",
										fontSize: "0.75rem",
										cursor: "pointer",
									}}
								>
									×
								</button>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

const inputStyle: React.CSSProperties = {
	width: "100%",
	background: "rgba(255,255,255,0.04)",
	border: "1px solid rgba(255,255,255,0.08)",
	borderRadius: "6px",
	color: "inherit",
	fontFamily: "inherit",
	fontSize: "0.85rem",
	padding: "0.4rem 0.625rem",
	outline: "none",
};
