'use client';

import { useEffect, useMemo, useState } from "react";
import { useResponsibilitiesStore, isDrifting } from "@/src/stores/responsibilities-store";
import { useTaskStore } from "@/src/stores/task-store";
import type { Responsibility, ResponsibilityCadence } from "@/src/types/responsibility";

const CADENCES: readonly ResponsibilityCadence[] = [
	"daily",
	"weekly",
	"biweekly",
	"monthly",
	"quarterly",
	"ongoing",
];

function relativeTime(iso: string | null): string {
	if (!iso) return "never";
	const then = new Date(iso).getTime();
	const now = Date.now();
	const secs = Math.floor((now - then) / 1000);
	if (secs < 60) return "just now";
	const mins = Math.floor(secs / 60);
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	const weeks = Math.floor(days / 7);
	if (weeks < 5) return `${weeks}w ago`;
	const months = Math.floor(days / 30);
	return `${months}mo ago`;
}

export function ResponsibilitiesApp() {
	const { responsibilities, loading, load, create, update, remove } = useResponsibilitiesStore();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [newTitle, setNewTitle] = useState("");

	useEffect(() => {
		void load();
	}, [load]);

	const active = useMemo(() => responsibilities.filter((r) => r.active), [responsibilities]);
	const inactive = useMemo(() => responsibilities.filter((r) => !r.active), [responsibilities]);

	const selected = responsibilities.find((r) => r.id === selectedId) ?? null;

	async function handleCreate() {
		if (!newTitle.trim()) return;
		const r = await create(newTitle.trim());
		setNewTitle("");
		setCreating(false);
		setSelectedId(r.id);
	}

	if (loading && responsibilities.length === 0) {
		return (
			<div
				className="flex h-full items-center justify-center text-sm"
				style={{ color: "var(--place-text-secondary)" }}
			>
				Loading responsibilities…
			</div>
		);
	}

	return (
		<div
			className="flex h-full"
			style={{
				color: "var(--place-text-primary, rgba(255,255,255,0.87))",
				fontSize: "0.85rem",
			}}
		>
			{/* Sidebar */}
			<div
				style={{
					width: "42%",
					minWidth: "180px",
					borderRight: "1px solid rgba(255,255,255,0.06)",
					overflowY: "auto",
					padding: "8px",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: "8px",
					}}
				>
					<span
						style={{
							fontSize: "0.7rem",
							textTransform: "uppercase",
							letterSpacing: "0.08em",
							color: "var(--place-text-secondary, rgba(255,255,255,0.5))",
						}}
					>
						Responsibilities
					</span>
					<button
						type="button"
						onClick={() => setCreating((c) => !c)}
						style={{
							background: "transparent",
							border: "none",
							color: "var(--place-accent, #f6a5c0)",
							cursor: "pointer",
							fontSize: "1.1rem",
							lineHeight: 1,
						}}
						aria-label="New responsibility"
					>
						+
					</button>
				</div>
				{creating && (
					<div style={{ marginBottom: "8px" }}>
						<input
							type="text"
							placeholder="Responsibility title…"
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") void handleCreate();
								if (e.key === "Escape") {
									setCreating(false);
									setNewTitle("");
								}
							}}
							autoFocus
							style={{
								width: "100%",
								padding: "5px 8px",
								background: "rgba(255,255,255,0.04)",
								border: "1px solid rgba(255,255,255,0.08)",
								borderRadius: "6px",
								color: "inherit",
								fontFamily: "inherit",
								fontSize: "0.85rem",
								outline: "none",
							}}
						/>
					</div>
				)}
				{active.length > 0 && (
					<div style={{ marginBottom: "12px" }}>
						<div
							style={{
								fontSize: "0.65rem",
								textTransform: "uppercase",
								letterSpacing: "0.1em",
								color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
								padding: "2px 4px",
							}}
						>
							Active
						</div>
						{active.map((r) => (
							<ResponsibilityRow
								key={r.id}
								r={r}
								selected={selectedId === r.id}
								onClick={() => setSelectedId(r.id)}
							/>
						))}
					</div>
				)}
				{inactive.length > 0 && (
					<div style={{ marginBottom: "12px" }}>
						<div
							style={{
								fontSize: "0.65rem",
								textTransform: "uppercase",
								letterSpacing: "0.1em",
								color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
								padding: "2px 4px",
							}}
						>
							Inactive
						</div>
						{inactive.map((r) => (
							<ResponsibilityRow
								key={r.id}
								r={r}
								selected={selectedId === r.id}
								onClick={() => setSelectedId(r.id)}
							/>
						))}
					</div>
				)}
				{responsibilities.length === 0 && !creating && (
					<div
						style={{
							padding: "16px 8px",
							color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
							fontSize: "0.8rem",
							textAlign: "center",
						}}
					>
						No responsibilities yet. Tap + to create one.
					</div>
				)}
			</div>

			{/* Detail pane */}
			<div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
				{selected ? (
					<ResponsibilityDetail
						responsibility={selected}
						onUpdate={(changes) => void update(selected.id, changes)}
						onDelete={() => {
							void remove(selected.id);
							setSelectedId(null);
						}}
					/>
				) : (
					<div
						style={{
							color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
							fontSize: "0.85rem",
							textAlign: "center",
							marginTop: "30%",
						}}
					>
						Select a responsibility
					</div>
				)}
			</div>
		</div>
	);
}

interface ResponsibilityRowProps {
	readonly r: Responsibility;
	readonly selected: boolean;
	readonly onClick: () => void;
}

function ResponsibilityRow({ r, selected, onClick }: ResponsibilityRowProps) {
	const drift = isDrifting(r);
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
				gap: "2px",
				width: "100%",
				textAlign: "left",
				padding: "6px 8px",
				marginTop: "2px",
				background: selected ? "rgba(255,255,255,0.06)" : "transparent",
				border: "none",
				borderRadius: "6px",
				color: "inherit",
				cursor: "pointer",
				fontFamily: "inherit",
				fontSize: "0.85rem",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "6px",
					width: "100%",
				}}
			>
				{drift && (
					<span
						aria-hidden
						title="Drifting — not touched in a while"
						style={{
							width: "6px",
							height: "6px",
							borderRadius: "50%",
							background: "rgba(255, 100, 100, 0.6)",
							flexShrink: 0,
						}}
					/>
				)}
				<span
					style={{
						flex: 1,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					{r.title}
				</span>
			</div>
			<div
				style={{
					display: "flex",
					gap: "6px",
					fontSize: "0.68rem",
					color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
				}}
			>
				{r.role && <span>{r.role}</span>}
				{r.cadence && <span>· {r.cadence}</span>}
				<span>· {relativeTime(r.lastTouchedAt)}</span>
			</div>
		</button>
	);
}

interface ResponsibilityDetailProps {
	readonly responsibility: Responsibility;
	readonly onUpdate: (
		changes: Partial<Pick<Responsibility, "title" | "description" | "role" | "cadence" | "active">>,
	) => void;
	readonly onDelete: () => void;
}

function ResponsibilityDetail({ responsibility, onUpdate, onDelete }: ResponsibilityDetailProps) {
	const { tasks, load: loadTasks } = useTaskStore();

	useEffect(() => {
		void loadTasks();
	}, [loadTasks]);

	const linked = useMemo(
		() => tasks.filter((t) => t.responsibilityId === responsibility.id),
		[tasks, responsibility.id],
	);
	const recent = useMemo(() => {
		const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
		return linked.filter(
			(t) => t.completedAt && new Date(t.completedAt).getTime() >= cutoff,
		);
	}, [linked]);

	return (
		<div>
			<div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
				<input
					type="text"
					value={responsibility.title}
					onChange={(e) => onUpdate({ title: e.target.value })}
					style={{
						flex: 1,
						background: "transparent",
						border: "none",
						color: "inherit",
						fontFamily: "inherit",
						fontSize: "1.05rem",
						fontWeight: 600,
						outline: "none",
					}}
				/>
				<button
					type="button"
					onClick={() => onUpdate({ active: !responsibility.active })}
					style={{
						background: responsibility.active
							? "rgba(150, 255, 150, 0.08)"
							: "rgba(255, 255, 255, 0.04)",
						border: "1px solid rgba(255,255,255,0.08)",
						borderRadius: "4px",
						color: responsibility.active
							? "rgba(150, 255, 150, 0.85)"
							: "var(--place-text-secondary, rgba(255,255,255,0.5))",
						fontSize: "0.72rem",
						padding: "2px 8px",
						cursor: "pointer",
					}}
				>
					{responsibility.active ? "Active" : "Inactive"}
				</button>
			</div>
			<textarea
				placeholder="Description…"
				value={responsibility.description ?? ""}
				onChange={(e) => onUpdate({ description: e.target.value })}
				rows={2}
				style={{
					width: "100%",
					background: "transparent",
					border: "none",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
					color: "var(--place-text-secondary, rgba(255,255,255,0.65))",
					fontFamily: "inherit",
					fontSize: "0.82rem",
					outline: "none",
					resize: "none",
					padding: "4px 0",
					marginBottom: "12px",
				}}
			/>

			<div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
				<label style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "120px" }}>
					<span style={{ fontSize: "0.68rem", color: "var(--place-text-secondary)" }}>Role</span>
					<input
						type="text"
						value={responsibility.role ?? ""}
						onChange={(e) => onUpdate({ role: e.target.value })}
						placeholder="developer, partner, self, …"
						style={{
							padding: "4px 8px",
							background: "rgba(255,255,255,0.04)",
							border: "1px solid rgba(255,255,255,0.06)",
							borderRadius: "4px",
							color: "inherit",
							fontFamily: "inherit",
							fontSize: "0.8rem",
							outline: "none",
						}}
					/>
				</label>
				<label style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "120px" }}>
					<span style={{ fontSize: "0.68rem", color: "var(--place-text-secondary)" }}>Cadence</span>
					<select
						value={responsibility.cadence ?? ""}
						onChange={(e) =>
							onUpdate({
								cadence: e.target.value === "" ? null : (e.target.value as ResponsibilityCadence),
							})
						}
						style={{
							padding: "4px 8px",
							background: "rgba(255,255,255,0.04)",
							border: "1px solid rgba(255,255,255,0.06)",
							borderRadius: "4px",
							color: "inherit",
							fontFamily: "inherit",
							fontSize: "0.8rem",
							outline: "none",
						}}
					>
						<option value="">—</option>
						{CADENCES.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
				</label>
			</div>

			<div style={{ marginBottom: "8px" }}>
				<div
					style={{
						fontSize: "0.65rem",
						textTransform: "uppercase",
						letterSpacing: "0.1em",
						color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
						marginBottom: "4px",
					}}
				>
					Recent activity (14d) — {recent.length} completed
				</div>
				{recent.length === 0 ? (
					<div
						style={{
							color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
							fontSize: "0.78rem",
							padding: "8px 4px",
						}}
					>
						No completed tasks in the last two weeks.
					</div>
				) : (
					<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
						{recent.slice(0, 8).map((t) => (
							<li
								key={t.id}
								style={{
									padding: "4px 0",
									fontSize: "0.8rem",
									color: "var(--place-text-secondary, rgba(255,255,255,0.65))",
								}}
							>
								✓ {t.title}
							</li>
						))}
					</ul>
				)}
			</div>

			<div style={{ marginTop: "24px", textAlign: "right" }}>
				<button
					type="button"
					onClick={() => {
						if (confirm(`Delete responsibility "${responsibility.title}"?`)) {
							onDelete();
						}
					}}
					style={{
						background: "transparent",
						border: "1px solid rgba(255,100,100,0.2)",
						borderRadius: "4px",
						color: "rgba(255,100,100,0.8)",
						fontSize: "0.72rem",
						padding: "4px 10px",
						cursor: "pointer",
					}}
				>
					Delete
				</button>
			</div>
		</div>
	);
}
