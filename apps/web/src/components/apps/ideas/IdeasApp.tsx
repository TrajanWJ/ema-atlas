'use client';

import { useEffect, useState, useMemo } from "react";
import { getDbClient } from "@/src/db/client";
import { getIdeaItems } from "@/src/db/queries/inbox";
import { useInboxStore } from "@/src/stores/inbox-store";
import { useProjectsStore } from "@/src/stores/projects-store";
import { ProjectPicker } from "@/src/components/shared/ProjectPicker";
import type { InboxItem } from "@/src/types/inbox";

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

export function IdeasApp() {
	const [ideas, setIdeas] = useState<readonly InboxItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [projectFilter, setProjectFilter] = useState<string | null>(null);
	const { promoteToTask, remove } = useInboxStore();
	const { projects, load: loadProjects } = useProjectsStore();

	const reload = async () => {
		setLoading(true);
		try {
			const db = getDbClient();
			const rows = await getIdeaItems(db);
			setIdeas(rows);
		} catch (err) {
			console.error("[ideas] load failed:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void reload();
		if (projects.length === 0) void loadProjects();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const filtered = useMemo(() => {
		if (projectFilter === null) return ideas;
		return ideas.filter((i) => i.projectId === projectFilter);
	}, [ideas, projectFilter]);

	const projectMap = useMemo(() => {
		const m = new Map<string, { title: string; color: string | null }>();
		for (const p of projects) m.set(p.id, { title: p.title, color: p.color });
		return m;
	}, [projects]);

	async function handleGraduate(id: string) {
		await promoteToTask(id);
		await reload();
	}

	async function handleDelete(id: string) {
		await remove(id);
		await reload();
	}

	if (loading) {
		return (
			<div
				className="flex h-full items-center justify-center text-sm"
				style={{ color: "var(--place-text-secondary)" }}
			>
				Loading ideas…
			</div>
		);
	}

	return (
		<div
			className="flex h-full flex-col"
			style={{
				color: "var(--place-text-primary, rgba(255,255,255,0.87))",
				fontSize: "0.85rem",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "0.5rem 0.75rem",
					borderBottom: "1px solid var(--place-border-default)",
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
					Ideas — {filtered.length}
				</span>
				<ProjectPicker
					value={projectFilter}
					onChange={setProjectFilter}
					placeholder="All projects"
					compact
				/>
			</div>

			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "0.75rem",
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
					gap: "0.625rem",
					alignContent: "start",
				}}
			>
				{filtered.length === 0 ? (
					<div
						style={{
							gridColumn: "1 / -1",
							textAlign: "center",
							padding: "2rem",
							color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
							fontSize: "0.85rem",
						}}
					>
						No ideas yet. Tag a brain dump as "Idea" to send it here.
					</div>
				) : (
					filtered.map((idea) => {
						const project = idea.projectId ? projectMap.get(idea.projectId) : null;
						return (
							<div
								key={idea.id}
								style={{
									background: "rgba(255, 207, 115, 0.04)",
									border: "1px solid rgba(255, 207, 115, 0.15)",
									borderRadius: "8px",
									padding: "0.75rem",
									display: "flex",
									flexDirection: "column",
									gap: "0.5rem",
								}}
							>
								<p
									style={{
										fontSize: "0.82rem",
										lineHeight: 1.4,
										margin: 0,
										color: "var(--place-text-primary, rgba(255,255,255,0.9))",
									}}
								>
									{idea.content}
								</p>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										fontSize: "0.68rem",
										color: "var(--place-text-secondary, rgba(255,255,255,0.5))",
									}}
								>
									<span>{relativeTime(idea.createdAt)}</span>
									{project && (
										<span
											style={{
												display: "inline-flex",
												alignItems: "center",
												gap: "4px",
											}}
										>
											<span
												aria-hidden
												style={{
													width: "6px",
													height: "6px",
													borderRadius: "50%",
													background: project.color ?? "rgba(255,255,255,0.2)",
												}}
											/>
											{project.title}
										</span>
									)}
								</div>
								<div style={{ display: "flex", gap: "6px" }}>
									<button
										type="button"
										onClick={() => void handleGraduate(idea.id)}
										style={{
											flex: 1,
											background: "transparent",
											border: "1px solid rgba(138, 180, 255, 0.35)",
											borderRadius: "4px",
											color: "#8ab4ff",
											fontSize: "0.7rem",
											padding: "4px 8px",
											cursor: "pointer",
										}}
									>
										→ Task
									</button>
									<button
										type="button"
										onClick={() => void handleDelete(idea.id)}
										style={{
											background: "transparent",
											border: "1px solid rgba(255,100,100,0.25)",
											borderRadius: "4px",
											color: "rgba(255,100,100,0.7)",
											fontSize: "0.7rem",
											padding: "4px 8px",
											cursor: "pointer",
										}}
									>
										✕
									</button>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
