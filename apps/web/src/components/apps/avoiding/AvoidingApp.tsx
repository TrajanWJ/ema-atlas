'use client';

import { useEffect, useState, useMemo } from "react";
import { useTrackersStore } from "@/src/stores/trackers-store";

function relative(iso: string): string {
	const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
	if (mins < 60) return `${mins}m`;
	const h = Math.floor(mins / 60);
	if (h < 24) return `${h}h`;
	return `${Math.floor(h / 24)}d`;
}

export function AvoidingApp() {
	const { avoiding, logAvoiding, resolveAvoiding, deleteAvoiding, loadAll, loading } = useTrackersStore();
	const [text, setText] = useState("");

	useEffect(() => {
		if (avoiding.length === 0 && !loading) void loadAll();
	}, [avoiding.length, loading, loadAll]);

	const active = useMemo(() => avoiding.filter((a) => a.state === "active"), [avoiding]);
	const resolved = useMemo(() => avoiding.filter((a) => a.state === "resolved").slice(0, 10), [avoiding]);

	async function handleAdd() {
		if (!text.trim()) return;
		await logAvoiding(text);
		setText("");
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
				}}
			>
				<input
					type="text"
					placeholder="What are you avoiding? (honesty-first)"
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
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
					}}
				/>
			</div>
			<div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.75rem" }}>
				<Section label={`Active — ${active.length}`} />
				{active.length === 0 ? (
					<Empty text="Nothing avoided right now." />
				) : (
					active.map((a) => (
						<Row
							key={a.id}
							text={a.text}
							meta={relative(a.createdAt)}
							onResolve={() => void resolveAvoiding(a.id)}
							onDelete={() => void deleteAvoiding(a.id)}
						/>
					))
				)}
				{resolved.length > 0 && (
					<>
						<Section label={`Handled — ${resolved.length}`} />
						<div style={{ opacity: 0.55 }}>
							{resolved.map((a) => (
								<Row
									key={a.id}
									text={a.text}
									meta={a.resolvedAt ? relative(a.resolvedAt) : ""}
									resolved
									onResolve={() => void resolveAvoiding(a.id)}
									onDelete={() => void deleteAvoiding(a.id)}
								/>
							))}
						</div>
					</>
				)}
			</div>
		</div>
	);
}

function Section({ label }: { readonly label: string }) {
	return (
		<div
			style={{
				fontSize: "0.65rem",
				textTransform: "uppercase",
				letterSpacing: "0.1em",
				color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
				padding: "0.5rem 0 0.25rem",
			}}
		>
			{label}
		</div>
	);
}

function Empty({ text }: { readonly text: string }) {
	return (
		<div
			style={{
				textAlign: "center",
				padding: "1rem",
				color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
				fontSize: "0.8rem",
			}}
		>
			{text}
		</div>
	);
}

interface RowProps {
	readonly text: string;
	readonly meta: string;
	readonly resolved?: boolean;
	readonly onResolve: () => void;
	readonly onDelete: () => void;
}

function Row({ text, meta, resolved, onResolve, onDelete }: RowProps) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				padding: "0.4rem 0.25rem",
				borderBottom: "1px solid rgba(255,255,255,0.04)",
			}}
		>
			<button
				type="button"
				onClick={onResolve}
				style={{
					width: "12px",
					height: "12px",
					borderRadius: "3px",
					border: `2px solid ${resolved ? "#9de0b5" : "#ef4444"}`,
					background: resolved ? "#9de0b5" : "transparent",
					cursor: "pointer",
					flexShrink: 0,
					padding: 0,
				}}
			/>
			<span
				style={{
					flex: 1,
					fontSize: "0.82rem",
					textDecoration: resolved ? "line-through" : "none",
				}}
			>
				{text}
			</span>
			<span style={{ fontSize: "0.65rem", color: "var(--place-text-secondary, rgba(255,255,255,0.4))" }}>
				{meta}
			</span>
			<button
				type="button"
				onClick={onDelete}
				style={{
					background: "transparent",
					border: "none",
					color: "var(--place-text-tertiary, rgba(255,255,255,0.3))",
					fontSize: "0.75rem",
					cursor: "pointer",
					padding: "0 0.2rem",
				}}
			>
				×
			</button>
		</div>
	);
}
