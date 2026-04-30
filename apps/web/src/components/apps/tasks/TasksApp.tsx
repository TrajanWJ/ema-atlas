'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTaskStore, selectTasksByPriority, selectCompletedTasks } from "@/src/stores/task-store";
import { useToast } from "@/src/hooks/use-toast";
import { useSendToReceiver } from "@/src/hooks/use-send-to-receiver";
import { TaskInput } from "./TaskInput";
import { TaskList } from "./TaskList";
import { KanbanBoard } from "./KanbanBoard";
import { QuickAddForm } from "./QuickAddForm";
import { withViewTransition } from "@/src/lib/view-transition";
import { ProjectPicker } from "@/src/components/shared/ProjectPicker";
import { ResponsibilityPicker } from "@/src/components/shared/ResponsibilityPicker";
import type { Task, TaskPriority, TaskStatus, KanbanStatus } from "@/src/types/task";
import type { SendPayload } from "@/src/types/send-to";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type ViewMode = "kanban" | "list";
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

// ---------------------------------------------------------------------------
// View toggle
// ---------------------------------------------------------------------------

interface ViewToggleProps {
	readonly mode: ViewMode;
	readonly onChange: (mode: ViewMode) => void;
}

function ViewToggle({ mode, onChange }: ViewToggleProps) {
	return (
		<div
			style={{
				display: "flex",
				gap: "2px",
				background: "var(--place-surface-3)",
				borderRadius: "0.375rem",
				padding: "2px",
			}}
		>
			{(["kanban", "list"] as const).map((m) => (
				<button
					key={m}
					type="button"
					onClick={() => onChange(m)}
					style={{
						fontSize: "0.6rem",
						padding: "0.2rem 0.5rem",
						border: "none",
						borderRadius: "0.25rem",
						cursor: "pointer",
						background: mode === m ? "var(--place-secondary-subtle, rgba(75,123,229,0.10))" : "transparent",
						color: mode === m ? "var(--place-secondary-400, #6B95F0)" : "var(--place-text-tertiary, rgba(255,255,255,0.4))",
						fontWeight: mode === m ? 600 : 400,
						textTransform: "capitalize",
						transition: "background 0.15s, color 0.15s",
					}}
				>
					{m}
				</button>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// TasksApp
// ---------------------------------------------------------------------------

export function TasksApp() {
	const { tasks, loading, load, add, update, complete, archive, moveTask, togglePinnedToday } = useTaskStore();
	const [viewMode, setViewMode] = useState<ViewMode>("kanban");
	const [activeTab, setActiveTab] = useState<FilterTab>("all");
	const [showQuickAdd, setShowQuickAdd] = useState(false);
	const [projectFilter, setProjectFilter] = useState<string | null>(null);
	const [responsibilityFilter, setResponsibilityFilter] = useState<string | null>(null);
	const [pinnedOnly, setPinnedOnly] = useState(false);
	const { success } = useToast();

	const scopedTasks = useMemo(() => {
		let list = tasks;
		if (projectFilter !== null) list = list.filter((t) => t.projectId === projectFilter);
		if (responsibilityFilter !== null) list = list.filter((t) => t.responsibilityId === responsibilityFilter);
		if (pinnedOnly) list = list.filter((t) => t.pinnedToday);
		return list;
	}, [tasks, projectFilter, responsibilityFilter, pinnedOnly]);

	// Receive braindump_item and text payloads -> create task in backlog
	const handleReceive = useCallback(
		(payload: SendPayload) => {
			const title =
				typeof payload.data.content === "string"
					? payload.data.content
					: typeof payload.data.title === "string"
						? payload.data.title
						: String(payload.data.content ?? "");
			if (!title) return;
			void add(title, "should", null, "backlog" as TaskStatus).then(() => {
				success("Task created");
			});
		},
		[add, success],
	);

	useSendToReceiver("tasks", handleReceive);

	useEffect(() => {
		load().catch(() => {});
	}, [load]);

	// List view handlers
	const handleAdd = (title: string, priority: TaskPriority) => {
		add(title, priority).catch(() => {});
	};

	const handleComplete = (id: string) => {
		complete(id).catch(() => {});
	};

	const handleArchive = (id: string) => {
		archive(id).catch(() => {});
	};

	const handleUpdate = (
		id: string,
		fields: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate">>,
	) => {
		update(id, fields).catch(() => {});
	};

	// Quick-add handler (kanban top bar)
	const handleQuickAdd = useCallback(
		(title: string, priority: TaskPriority, column: KanbanStatus) => {
			const statusMap: Record<KanbanStatus, TaskStatus> = {
				backlog: "backlog",
				today: "today",
				"in-progress": "in-progress",
				done: "complete",
			};
			add(title, priority, null, statusMap[column]).then(() => {
				success("Task created");
			}).catch(() => {});
			setShowQuickAdd(false);
		},
		[add, success],
	);

	// Kanban handlers
	const handleKanbanAdd = useCallback(
		(title: string, priority: TaskPriority, status: string) => {
			add(title, priority, null, status as TaskStatus).catch(() => {});
		},
		[add],
	);

	const handleMoveTask = useCallback(
		(id: string, status: string) => {
			moveTask(id, status as TaskStatus).catch(() => {});
		},
		[moveTask],
	);

	if (loading) {
		return (
			<div style={loadingStyle}>
				Loading...
			</div>
		);
	}

	const filtersActive = projectFilter !== null || responsibilityFilter !== null || pinnedOnly;

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			{/* Filter bar */}
			<div style={filterBarStyle}>
				<button
					type="button"
					onClick={() => setPinnedOnly((v) => !v)}
					style={{
						...pinChipStyle,
						background: pinnedOnly ? "rgba(255, 207, 115, 0.15)" : "transparent",
						borderColor: pinnedOnly ? "rgba(255, 207, 115, 0.4)" : "rgba(255,255,255,0.08)",
						color: pinnedOnly ? "#ffcf73" : "var(--place-text-secondary, rgba(255,255,255,0.55))",
					}}
					title="Show only pinned-today"
				>
					📍 Today
				</button>
				<ProjectPicker
					value={projectFilter}
					onChange={setProjectFilter}
					placeholder="All projects"
					compact
				/>
				<ResponsibilityPicker
					value={responsibilityFilter}
					onChange={setResponsibilityFilter}
					placeholder="All responsibilities"
					compact
				/>
				{filtersActive && (
					<button
						type="button"
						onClick={() => {
							setProjectFilter(null);
							setResponsibilityFilter(null);
							setPinnedOnly(false);
						}}
						style={{
							background: "transparent",
							border: "none",
							color: "var(--place-text-secondary, rgba(255,255,255,0.4))",
							fontSize: "0.7rem",
							cursor: "pointer",
							textDecoration: "underline",
						}}
					>
						clear
					</button>
				)}
			</div>

			{/* Top bar with view toggle */}
			<div style={topBarStyle}>
				{viewMode === "list" ? (
					<ListTabs activeTab={activeTab} onTabChange={setActiveTab} />
				) : (
					<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
						<span style={{ fontSize: "0.7rem", color: "var(--place-text-secondary)", fontWeight: 600 }}>
							Tasks
						</span>
						<button
							type="button"
							onClick={() => setShowQuickAdd((v) => !v)}
							style={{
								background: "var(--place-primary-subtle)",
								border: "1px solid var(--place-primary-border)",
								color: "var(--place-primary-400)",
								fontWeight: 600,
								fontSize: "0.65rem",
								padding: "0.25rem 0.5rem",
								borderRadius: "6px",
								cursor: "pointer",
							}}
						>
							+ New Task
						</button>
					</div>
				)}
				<ViewToggle mode={viewMode} onChange={(mode) => withViewTransition(() => setViewMode(mode))} />
			</div>

			{/* Quick-add form for kanban view */}
			{viewMode === "kanban" && showQuickAdd && (
				<QuickAddForm
					onAdd={handleQuickAdd}
					onClose={() => setShowQuickAdd(false)}
				/>
			)}

			{/* Content */}
			{viewMode === "kanban" ? (
				<KanbanBoard
					tasks={scopedTasks}
					onAddTask={handleKanbanAdd}
					onMoveTask={handleMoveTask}
					onUpdateTask={handleUpdate}
					onArchiveTask={handleArchive}
					onTogglePin={(id) => void togglePinnedToday(id)}
				/>
			) : (
				<>
					{activeTab !== "done" && (
						<TaskInput onAdd={handleAdd} disabled={loading} />
					)}
					<TaskList
						tasks={filterTasks(scopedTasks, activeTab)}
						onComplete={handleComplete}
						onArchive={handleArchive}
						onUpdate={handleUpdate}
						onTogglePin={(id) => void togglePinnedToday(id)}
					/>
				</>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// List filter tabs (extracted)
// ---------------------------------------------------------------------------

interface ListTabsProps {
	readonly activeTab: FilterTab;
	readonly onTabChange: (tab: FilterTab) => void;
}

function ListTabs({ activeTab, onTabChange }: ListTabsProps) {
	return (
		<div
			style={{
				display: "flex",
				gap: "2px",
				background: "var(--place-surface-3)",
				borderRadius: "6px",
				padding: "2px",
				flex: 1,
			}}
		>
			{TABS.map((tab) => {
				const isActive = activeTab === tab.id;
				return (
					<button
						key={tab.id}
						type="button"
						onClick={() => onTabChange(tab.id)}
						style={{
							fontSize: "0.65rem",
							padding: "0.2rem 0.5rem",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
							background: isActive
								? "var(--place-secondary-subtle)"
								: "transparent",
							color: isActive
								? "var(--place-secondary-400)"
								: "var(--place-text-tertiary)",
							fontWeight: isActive ? 600 : 400,
							transition: "background 0.15s, color 0.15s",
						}}
					>
						{tab.label}
					</button>
				);
			})}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const loadingStyle: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	height: "100%",
	color: "var(--place-text-secondary)",
	fontSize: "0.75rem",
};

const topBarStyle: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	padding: "0.375rem 0.625rem",
	borderBottom: "1px solid var(--place-border-default)",
	flexShrink: 0,
};

const filterBarStyle: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: "6px",
	padding: "0.375rem 0.625rem",
	borderBottom: "1px solid var(--place-border-default)",
	flexShrink: 0,
	flexWrap: "wrap",
};

const pinChipStyle: React.CSSProperties = {
	padding: "2px 8px",
	borderRadius: "6px",
	border: "1px solid",
	fontSize: "0.7rem",
	cursor: "pointer",
	fontFamily: "inherit",
};
