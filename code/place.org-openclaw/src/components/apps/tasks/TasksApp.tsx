'use client';

import { useEffect, useState } from "react";
import { useTaskStore, selectTasksByPriority, selectCompletedTasks } from "@/src/stores/task-store";
import { TaskInput } from "./TaskInput";
import { TaskList } from "./TaskList";
import type { Task, TaskPriority } from "@/src/types/task";

type FilterTab = "all" | TaskPriority | "done";

const TABS: { readonly id: FilterTab; readonly label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "must", label: "Must" },
	{ id: "should", label: "Should" },
	{ id: "could", label: "Could" },
	{ id: "done", label: "Done" },
];

function filterTasks(tasks: readonly Task[], tab: FilterTab): readonly Task[] {
	if (tab === "all") return tasks.filter((t) => t.status !== "archived" && t.status !== "complete");
	if (tab === "done") return selectCompletedTasks(tasks);
	return selectTasksByPriority(tasks, tab as TaskPriority);
}

export function TasksApp() {
	const { tasks, loading, load, add, update, complete, archive } = useTaskStore();
	const [activeTab, setActiveTab] = useState<FilterTab>("all");

	useEffect(() => {
		load().catch(() => {});
	}, [load]);

	const handleAdd = (title: string, priority: TaskPriority) => {
		add(title, priority).catch(() => {});
	};

	const handleComplete = (id: string) => {
		complete(id).catch(() => {});
	};

	const handleArchive = (id: string) => {
		archive(id).catch(() => {});
	};

	const handleUpdate = (id: string, fields: Partial<Pick<Task, "title" | "description">>) => {
		update(id, fields).catch(() => {});
	};

	const filteredTasks = filterTasks(tasks, activeTab);

	return (
		<div className="flex h-full flex-col">
			{/* Filter tabs */}
			<div
				style={{
					display: "flex",
					borderBottom: "1px solid var(--border)",
					flexShrink: 0,
				}}
			>
				{TABS.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id)}
						style={{
							flex: 1,
							padding: "0.5rem 0.25rem",
							fontSize: "0.7rem",
							background: "transparent",
							border: "none",
							borderBottom: activeTab === tab.id ? "2px solid var(--accent-blue)" : "2px solid transparent",
							cursor: "pointer",
							color: activeTab === tab.id ? "var(--accent-blue)" : "var(--text-secondary)",
							fontWeight: activeTab === tab.id ? 600 : 400,
						}}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Quick add (only when not viewing done) */}
			{activeTab !== "done" && (
				<TaskInput
					onAdd={handleAdd}
					disabled={loading}
				/>
			)}

			{/* Task list */}
			{loading ? (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flex: 1,
						color: "var(--text-secondary)",
						fontSize: "0.75rem",
					}}
				>
					Loading…
				</div>
			) : (
				<TaskList
					tasks={filteredTasks}
					onComplete={handleComplete}
					onArchive={handleArchive}
					onUpdate={handleUpdate}
				/>
			)}
		</div>
	);
}
