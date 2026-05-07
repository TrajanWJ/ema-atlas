'use client';

import { useEffect, useState, useMemo, useRef } from "react";
import { useTrackersStore } from "@/src/stores/trackers-store";

function relative(iso: string): string {
	const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
	if (hours < 1) return "just now";
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return `${Math.floor(days / 30)}mo ago`;
}

export function ContactsApp() {
	const { contacts, logContactTouch, deleteContactTouch, loadAll } = useTrackersStore();
	const [name, setName] = useState("");
	const [oneWord, setOneWord] = useState("");
	const [channel, setChannel] = useState("");
	const didLoad = useRef(false);

	useEffect(() => {
		if (didLoad.current) return;
		didLoad.current = true;
		void loadAll();
	}, [loadAll]);

	// Last touch per person
	const latestByName = useMemo(() => {
		const map = new Map<string, { name: string; at: string; count: number }>();
		for (const c of contacts) {
			const existing = map.get(c.name.toLowerCase());
			if (!existing || existing.at < c.at) {
				map.set(c.name.toLowerCase(), {
					name: c.name,
					at: existing?.at && existing.at > c.at ? existing.at : c.at,
					count: (existing?.count ?? 0) + 1,
				});
			}
		}
		return Array.from(map.values()).sort((a, b) => b.at.localeCompare(a.at));
	}, [contacts]);

	async function handleAdd() {
		if (!name.trim()) return;
		await logContactTouch(name, oneWord || null, channel || null);
		setName("");
		setOneWord("");
		setChannel("");
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
					placeholder="Who did you talk to?"
					value={name}
					onChange={(e) => setName(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
					style={inputStyle}
				/>
				<div style={{ display: "flex", gap: "0.5rem" }}>
					<input
						type="text"
						placeholder="one word…"
						value={oneWord}
						onChange={(e) => setOneWord(e.target.value)}
						style={{ ...inputStyle, flex: 1, fontSize: "0.76rem" }}
					/>
					<input
						type="text"
						placeholder="channel"
						value={channel}
						onChange={(e) => setChannel(e.target.value)}
						style={{ ...inputStyle, flex: 1, fontSize: "0.76rem" }}
					/>
					<button
						type="button"
						onClick={() => void handleAdd()}
						disabled={!name.trim()}
						style={{
							background: name.trim() ? "rgba(138,180,255,0.12)" : "transparent",
							border: "1px solid rgba(138,180,255,0.3)",
							borderRadius: "4px",
							color: "#8ab4ff",
							fontSize: "0.72rem",
							padding: "4px 10px",
							cursor: name.trim() ? "pointer" : "default",
						}}
					>
						Log
					</button>
				</div>
			</div>
			<div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.75rem" }}>
				{latestByName.length === 0 ? (
					<div
						style={{
							textAlign: "center",
							padding: "1rem",
							fontSize: "0.8rem",
							color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
						}}
					>
						No contact touches yet.
					</div>
				) : (
					<div>
						<div
							style={{
								fontSize: "0.65rem",
								textTransform: "uppercase",
								letterSpacing: "0.1em",
								color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
								padding: "0.25rem 0",
							}}
						>
							People
						</div>
						{latestByName.map((p) => (
							<div
								key={p.name}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									padding: "0.35rem 0",
									borderBottom: "1px solid rgba(255,255,255,0.04)",
								}}
							>
								<span style={{ fontSize: "0.84rem", flex: 1 }}>{p.name}</span>
								<span
									style={{
										fontSize: "0.65rem",
										color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
									}}
								>
									{p.count}× · last {relative(p.at)}
								</span>
							</div>
						))}
						<div
							style={{
								fontSize: "0.65rem",
								textTransform: "uppercase",
								letterSpacing: "0.1em",
								color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
								padding: "0.75rem 0 0.25rem",
							}}
						>
							Recent touches
						</div>
						{contacts.slice(0, 30).map((c) => (
							<div
								key={c.id}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									padding: "0.3rem 0",
									fontSize: "0.78rem",
									borderBottom: "1px solid rgba(255,255,255,0.03)",
								}}
							>
								<span style={{ flex: 1 }}>
									<strong>{c.name}</strong>
									{c.oneWord && (
										<span style={{ opacity: 0.6 }}> · {c.oneWord}</span>
									)}
									{c.channel && (
										<span style={{ opacity: 0.5, fontSize: "0.7rem" }}>
											{" "}
											({c.channel})
										</span>
									)}
								</span>
								<span
									style={{
										fontSize: "0.62rem",
										color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
									}}
								>
									{relative(c.at)}
								</span>
								<button
									type="button"
									onClick={() => void deleteContactTouch(c.id)}
									style={{
										background: "transparent",
										border: "none",
										color: "var(--place-text-tertiary, rgba(255,255,255,0.3))",
										fontSize: "0.72rem",
										cursor: "pointer",
									}}
								>
									×
								</button>
							</div>
						))}
					</div>
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
