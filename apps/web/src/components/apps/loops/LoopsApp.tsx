'use client';

import { useEffect, useMemo, useState } from "react";
import { useLoopsStore } from "@/src/stores/loops-store";
import { SuggestionSlot } from "@/src/components/shared/SuggestionSlot";
import type { Loop } from "@/src/types/loop";

function relativeTime(iso: string): string {
	const then = new Date(iso).getTime();
	const now = Date.now();
	const mins = Math.floor((now - then) / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d`;
	return `${Math.floor(days / 7)}w`;
}

export function LoopsApp() {
	const { loops, loading, load, open, close, reopen, remove, update } = useLoopsStore();
	const [title, setTitle] = useState("");
	const [waitingOn, setWaitingOn] = useState("");
	const [weight, setWeight] = useState(2);
	const [showClosed, setShowClosed] = useState(false);

	useEffect(() => {
		void load();
	}, [load]);

	const openLoops = useMemo(() => loops.filter((l) => l.state === "open"), [loops]);
	const closedLoops = useMemo(() => loops.filter((l) => l.state === "closed"), [loops]);

	async function handleAdd() {
		if (!title.trim()) return;
		await open(title, waitingOn || null, weight, null);
		setTitle("");
		setWaitingOn("");
		setWeight(2);
	}

	if (loading && loops.length === 0) {
		return (
			<div
				className="flex h-full items-center justify-center text-sm"
				style={{ color: "var(--place-text-secondary)" }}
			>
				Loading loops…
			</div>
		);
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
			{/* Add bar */}
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
					placeholder="What's the open loop?"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") void handleAdd();
					}}
					style={{
						width: "100%",
						background: "rgba(255,255,255,0.04)",
						border: "1px solid rgba(255,255,255,0.08)",
						borderRadius: "6px",
						color: "inherit",
						fontFamily: "inherit",
						fontSize: "0.85rem",
						padding: "0.375rem 0.625rem",
						outline: "none",
					}}
				/>
				<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
					<input
						type="text"
						placeholder="waiting on…"
						value={waitingOn}
						onChange={(e) => setWaitingOn(e.target.value)}
						style={{
							flex: 1,
							background: "rgba(255,255,255,0.04)",
							border: "1px solid rgba(255,255,255,0.08)",
							borderRadius: "6px",
							color: "inherit",
							fontFamily: "inherit",
							fontSize: "0.78rem",
							padding: "0.3rem 0.5rem",
							outline: "none",
						}}
					/>
					<WeightPicker value={weight} onChange={setWeight} />
					<button
						type="button"
						onClick={() => void handleAdd()}
						disabled={!title.trim()}
						style={{
							background: title.trim() ? "rgba(138,180,255,0.12)" : "transparent",
							border: "1px solid rgba(138,180,255,0.3)",
							borderRadius: "6px",
							color: "#8ab4ff",
							fontSize: "0.72rem",
							padding: "0.3rem 0.7rem",
							cursor: title.trim() ? "pointer" : "default",
							opacity: title.trim() ? 1 : 0.4,
							fontFamily: "inherit",
						}}
					>
						Open
					</button>
				</div>
			</div>

			<div style={{ padding: "0 0.75rem", paddingTop: "0.5rem" }}>
				<SuggestionSlot for="loops-stale" />
			</div>

			{/* Open loops */}
			<div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0.75rem" }}>
				{openLoops.length === 0 ? (
					<div
						style={{
							textAlign: "center",
							padding: "1.5rem",
							color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
							fontSize: "0.8rem",
						}}
					>
						No open loops. Mental space clear.
					</div>
				) : (
					<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
						{openLoops.map((l) => (
							<LoopRow
								key={l.id}
								loop={l}
								onClose={() => void close(l.id)}
								onDelete={() => void remove(l.id)}
								onEditWeight={(w) => void update(l.id, { weight: w })}
							/>
						))}
					</ul>
				)}

				{closedLoops.length > 0 && (
					<div style={{ marginTop: "1rem" }}>
						<button
							type="button"
							onClick={() => setShowClosed((v) => !v)}
							style={{
								background: "transparent",
								border: "none",
								color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
								fontSize: "0.7rem",
								cursor: "pointer",
								padding: "0.25rem 0",
							}}
						>
							{showClosed ? "▴" : "▾"} Closed ({closedLoops.length})
						</button>
						{showClosed && (
							<ul style={{ listStyle: "none", padding: 0, margin: 0, opacity: 0.55 }}>
								{closedLoops.slice(0, 20).map((l) => (
									<LoopRow
										key={l.id}
										loop={l}
										onClose={() => void reopen(l.id)}
										onDelete={() => void remove(l.id)}
										onEditWeight={(w) => void update(l.id, { weight: w })}
									/>
								))}
							</ul>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

interface LoopRowProps {
	readonly loop: Loop;
	readonly onClose: () => void;
	readonly onDelete: () => void;
	readonly onEditWeight: (w: number) => void;
}

function LoopRow({ loop, onClose, onDelete, onEditWeight }: LoopRowProps) {
	const closed = loop.state === "closed";
	return (
		<li
			style={{
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
				padding: "0.5rem 0.25rem",
				borderBottom: "1px solid rgba(255,255,255,0.04)",
			}}
		>
			<button
				type="button"
				onClick={onClose}
				title={closed ? "Reopen" : "Close loop"}
				style={{
					width: "14px",
					height: "14px",
					borderRadius: "3px",
					border: `2px solid ${closed ? "#9de0b5" : "#8ab4ff"}`,
					background: closed ? "#9de0b5" : "transparent",
					cursor: "pointer",
					flexShrink: 0,
					padding: 0,
				}}
			/>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						fontSize: "0.85rem",
						color: "var(--place-text-primary)",
						textDecoration: closed ? "line-through" : "none",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{loop.title}
				</div>
				<div
					style={{
						fontSize: "0.68rem",
						color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
						display: "flex",
						gap: "6px",
					}}
				>
					{loop.waitingOn && <span>waiting on: {loop.waitingOn}</span>}
					<span>· opened {relativeTime(loop.openedAt)}</span>
				</div>
			</div>
			<WeightPicker value={loop.weight} onChange={onEditWeight} />
			<button
				type="button"
				onClick={onDelete}
				title="Delete"
				style={{
					background: "transparent",
					border: "none",
					color: "var(--place-text-tertiary, rgba(255,255,255,0.3))",
					fontSize: "0.75rem",
					cursor: "pointer",
					padding: "0 0.25rem",
					flexShrink: 0,
				}}
			>
				×
			</button>
		</li>
	);
}

function WeightPicker({
	value,
	onChange,
}: {
	readonly value: number;
	readonly onChange: (v: number) => void;
}) {
	return (
		<div style={{ display: "flex", gap: "2px" }}>
			{[1, 2, 3, 4, 5].map((n) => (
				<button
					key={n}
					type="button"
					onClick={() => onChange(n)}
					title={`Weight ${n}`}
					style={{
						width: "8px",
						height: "8px",
						borderRadius: "50%",
						border: "none",
						background:
							n <= value
								? n >= 4
									? "#ef4444"
									: n === 3
										? "#f59e0b"
										: "#8ab4ff"
								: "rgba(255,255,255,0.1)",
						cursor: "pointer",
						padding: 0,
					}}
				/>
			))}
		</div>
	);
}
