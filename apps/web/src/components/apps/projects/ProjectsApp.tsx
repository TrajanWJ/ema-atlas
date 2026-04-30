'use client';

import { useEffect, useMemo, useState } from "react";
import { useProjectsStore } from "@/src/stores/projects-store";
import { useTaskStore } from "@/src/stores/task-store";
import type { Project, ProjectStatus } from "@/src/types/project";

const STATUS_ORDER: readonly ProjectStatus[] = ["active", "paused", "done", "archived"];

const DEFAULT_COLORS = [
	"#8ab4ff",
	"#f6a5c0",
	"#9de0b5",
	"#ffcf73",
	"#c6a5f6",
	"#73cfff",
	"#ff9f73",
	"#a3e4a1",
];

export function ProjectsApp() {
	const { projects, loading, load, create, update, remove } = useProjectsStore();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
	const [newTitle, setNewTitle] = useState("");

	useEffect(() => {
		void load();
	}, [load]);

	const grouped = useMemo(() => {
		const groups = new Map<ProjectStatus, Project[]>();
		for (const status of STATUS_ORDER) groups.set(status, []);
		for (const p of projects) {
			const list = groups.get(p.status);
			if (list) list.push(p);
		}
		return groups;
	}, [projects]);

	const selected = projects.find((p) => p.id === selectedId) ?? null;

	async function handleCreate() {
		if (!newTitle.trim()) return;
		const color = DEFAULT_COLORS[projects.length % DEFAULT_COLORS.length] ?? undefined;
		const project = await create(newTitle.trim(), undefined, color);
		setNewTitle("");
		setCreating(false);
		setSelectedId(project.id);
	}

	if (loading && projects.length === 0) {
		return (
			<div
				className="flex h-full items-center justify-center text-sm"
				style={{ color: "var(--place-text-secondary)" }}
			>
				Loading projects…
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
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
					<span
						style={{
							fontSize: "0.7rem",
							textTransform: "uppercase",
							letterSpacing: "0.08em",
							color: "var(--place-text-secondary, rgba(255,255,255,0.5))",
						}}
					>
						Projects
					</span>
					<button
						type="button"
						onClick={() => setCreating((c) => !c)}
						style={{
							background: "transparent",
							border: "none",
							color: "var(--place-accent, #8ab4ff)",
							cursor: "pointer",
							fontSize: "1.1rem",
							lineHeight: 1,
						}}
						aria-label="New project"
					>
						+
					</button>
				</div>
				{creating && (
					<div style={{ marginBottom: "8px" }}>
						<input
							type="text"
							placeholder="Project name…"
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
				{STATUS_ORDER.map((status) => {
					const list = grouped.get(status) ?? [];
					if (list.length === 0) return null;
					return (
						<div key={status} style={{ marginBottom: "12px" }}>
							<div
								style={{
									fontSize: "0.65rem",
									textTransform: "uppercase",
									letterSpacing: "0.1em",
									color: "var(--place-text-secondary, rgba(255,255,255,0.35))",
									padding: "2px 4px",
								}}
							>
								{status}
							</div>
							{list.map((p) => (
								<button
									key={p.id}
									type="button"
									onClick={() => setSelectedId(p.id)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "8px",
										width: "100%",
										textAlign: "left",
										padding: "6px 8px",
										marginTop: "2px",
										background: selectedId === p.id ? "rgba(255,255,255,0.06)" : "transparent",
										border: "none",
										borderRadius: "6px",
										color: "inherit",
										cursor: "pointer",
										fontFamily: "inherit",
										fontSize: "0.85rem",
									}}
								>
									<span
										aria-hidden
										style={{
											width: "10px",
											height: "10px",
											borderRadius: "50%",
											background: p.color ?? "rgba(255,255,255,0.2)",
											flexShrink: 0,
										}}
									/>
									<span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
										{p.title}
									</span>
								</button>
							))}
						</div>
					);
				})}
				{projects.length === 0 && !creating && (
					<div
						style={{
							padding: "16px 8px",
							color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
							fontSize: "0.8rem",
							textAlign: "center",
						}}
					>
						No projects yet. Tap + to create one.
					</div>
				)}
			</div>

			{/* Detail pane */}
			<div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
				{selected ? (
					<ProjectDetail
						project={selected}
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
						Select a project
					</div>
				)}
			</div>
		</div>
	);
}

interface ProjectDetailProps {
	readonly project: Project;
	readonly onUpdate: (changes: Partial<Pick<Project, "title" | "description" | "color" | "status">>) => void;
	readonly onDelete: () => void;
}

function ProjectDetail({ project, onUpdate, onDelete }: ProjectDetailProps) {
	const { tasks, load: loadTasks } = useTaskStore();
	const [tab, setTab] = useState<"tasks" | "notes" | "captures">("tasks");

	useEffect(() => {
		void loadTasks();
	}, [loadTasks]);

	const projectTasks = tasks.filter((t) => t.projectId === project.id);

	return (
		<div>
			<div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
				<span
					style={{
						width: "12px",
						height: "12px",
						borderRadius: "50%",
						background: project.color ?? "rgba(255,255,255,0.2)",
					}}
				/>
				<input
					type="text"
					value={project.title}
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
				<select
					value={project.status}
					onChange={(e) => onUpdate({ status: e.target.value as ProjectStatus })}
					style={{
						background: "rgba(255,255,255,0.04)",
						border: "1px solid rgba(255,255,255,0.06)",
						borderRadius: "4px",
						color: "inherit",
						fontSize: "0.75rem",
						padding: "2px 6px",
					}}
				>
					{STATUS_ORDER.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
			</div>
			<textarea
				placeholder="One-sentence goal…"
				value={project.description ?? ""}
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

			<div
				style={{
					display: "flex",
					gap: "4px",
					borderBottom: "1px solid rgba(255,255,255,0.06)",
					marginBottom: "10px",
				}}
			>
				{(["tasks", "notes", "captures"] as const).map((t) => (
					<button
						key={t}
						type="button"
						onClick={() => setTab(t)}
						style={{
							background: "transparent",
							border: "none",
							color: tab === t ? "var(--place-text-primary)" : "var(--place-text-secondary, rgba(255,255,255,0.4))",
							fontFamily: "inherit",
							fontSize: "0.78rem",
							textTransform: "capitalize",
							padding: "6px 10px",
							cursor: "pointer",
							borderBottom: tab === t ? "2px solid var(--place-accent, #8ab4ff)" : "2px solid transparent",
						}}
					>
						{t}
					</button>
				))}
			</div>

			{tab === "tasks" && (
				<div>
					{projectTasks.length === 0 ? (
						<div
							style={{
								color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
								fontSize: "0.8rem",
								padding: "16px",
								textAlign: "center",
							}}
						>
							No tasks yet. Create a task and assign this project from the Tasks app.
						</div>
					) : (
						<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
							{projectTasks.map((t) => (
								<li
									key={t.id}
									style={{
										padding: "6px 8px",
										borderBottom: "1px solid rgba(255,255,255,0.04)",
										fontSize: "0.82rem",
									}}
								>
									{t.title}
								</li>
							))}
						</ul>
					)}
				</div>
			)}

			{tab === "notes" && (
				<div
					style={{
						color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
						fontSize: "0.8rem",
						padding: "16px",
						textAlign: "center",
					}}
				>
					Notes filtered by project — coming with Notes integration.
				</div>
			)}

			{tab === "captures" && (
				<div
					style={{
						color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
						fontSize: "0.8rem",
						padding: "16px",
						textAlign: "center",
					}}
				>
					Brain-dump captures filtered by project — coming with Brain Dump integration.
				</div>
			)}

			<div style={{ marginTop: "24px", textAlign: "right" }}>
				<button
					type="button"
					onClick={() => {
						if (confirm(`Delete project "${project.title}"? Tasks will be unassigned.`)) {
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
					Delete project
				</button>
			</div>
		</div>
	);
}
