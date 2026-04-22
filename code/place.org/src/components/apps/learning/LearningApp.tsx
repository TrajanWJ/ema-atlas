'use client';

import { useEffect, useState } from "react";
import { useTrackersStore } from "@/src/stores/trackers-store";

function relative(iso: string): string {
	const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
	if (hours < 1) return "just now";
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d`;
	return `${Math.floor(days / 30)}mo`;
}

export function LearningApp() {
	const { learning, logLearning, deleteLearning, loadAll, loading } = useTrackersStore();
	const [text, setText] = useState("");
	const [topic, setTopic] = useState("");

	useEffect(() => {
		if (learning.length === 0 && !loading) void loadAll();
	}, [learning.length, loading, loadAll]);

	async function handleAdd() {
		if (!text.trim()) return;
		await logLearning(text, topic || null);
		setText("");
		setTopic("");
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
				<textarea
					placeholder="What did you learn?"
					value={text}
					onChange={(e) => setText(e.target.value)}
					rows={2}
					onKeyDown={(e) => {
						if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handleAdd();
					}}
					style={{
						width: "100%",
						background: "rgba(255,255,255,0.04)",
						border: "1px solid rgba(255,255,255,0.08)",
						borderRadius: "6px",
						color: "inherit",
						fontFamily: "inherit",
						fontSize: "0.85rem",
						padding: "0.4rem 0.625rem",
						outline: "none",
						resize: "none",
					}}
				/>
				<div style={{ display: "flex", gap: "0.5rem" }}>
					<input
						type="text"
						placeholder="Topic (optional)"
						value={topic}
						onChange={(e) => setTopic(e.target.value)}
						style={{
							flex: 1,
							background: "rgba(255,255,255,0.04)",
							border: "1px solid rgba(255,255,255,0.08)",
							borderRadius: "6px",
							color: "inherit",
							fontFamily: "inherit",
							fontSize: "0.75rem",
							padding: "0.3rem 0.5rem",
							outline: "none",
						}}
					/>
					<button
						type="button"
						onClick={() => void handleAdd()}
						disabled={!text.trim()}
						style={{
							background: text.trim() ? "rgba(138,180,255,0.12)" : "transparent",
							border: "1px solid rgba(138,180,255,0.3)",
							borderRadius: "4px",
							color: "#8ab4ff",
							fontSize: "0.72rem",
							padding: "4px 10px",
							cursor: text.trim() ? "pointer" : "default",
						}}
					>
						Log
					</button>
				</div>
			</div>
			<div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.75rem" }}>
				{learning.length === 0 ? (
					<div
						style={{
							textAlign: "center",
							padding: "1rem",
							fontSize: "0.8rem",
							color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
						}}
					>
						No learnings yet.
					</div>
				) : (
					learning.map((l) => (
						<div
							key={l.id}
							style={{
								padding: "0.5rem 0",
								borderBottom: "1px solid rgba(255,255,255,0.04)",
							}}
						>
							<div
								style={{
									fontSize: "0.82rem",
									lineHeight: 1.3,
								}}
							>
								{l.text}
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									marginTop: "4px",
									fontSize: "0.65rem",
									color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
								}}
							>
								{l.topic && (
									<span
										style={{
											background: "rgba(138,180,255,0.08)",
											color: "#8ab4ff",
											padding: "1px 6px",
											borderRadius: "3px",
										}}
									>
										{l.topic}
									</span>
								)}
								<span>{relative(l.at)}</span>
								<button
									type="button"
									onClick={() => void deleteLearning(l.id)}
									style={{
										marginLeft: "auto",
										background: "transparent",
										border: "none",
										color: "var(--place-text-tertiary, rgba(255,255,255,0.3))",
										cursor: "pointer",
										fontSize: "0.75rem",
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
