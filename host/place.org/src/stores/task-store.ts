import { create } from "zustand";
import {
	addTask,
	getTasks,
	updateTask,
	completeTask,
	archiveTask,
	reorderTask,
} from "@/src/db/queries/tasks";
import { getDbClient } from "@/src/db/client";
import { eventBus } from "@/src/lib/event-bus";
import { createId } from "@/src/lib/id";
import type { Task, TaskPriority, TaskStatus, TaskSource, TaskEffort } from "@/src/types/task";

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface TaskState {
	readonly tasks: readonly Task[];
	readonly loading: boolean;
}

interface AddTaskOpts {
	readonly projectId?: string | null;
	readonly responsibilityId?: string | null;
	readonly source?: TaskSource;
	readonly pinnedToday?: boolean;
	readonly effort?: TaskEffort | null;
}

interface TaskActions {
	load(): Promise<void>;
	add(
		title: string,
		priority?: TaskPriority,
		category?: string | null,
		status?: TaskStatus,
		opts?: AddTaskOpts,
	): Promise<void>;
	update(id: string, fields: Partial<Pick<Task, "title" | "description" | "priority" | "category" | "status" | "dueDate" | "goalId" | "projectId" | "responsibilityId" | "effort" | "pinnedToday" | "source" | "sortOrder">>): Promise<void>;
	complete(id: string): Promise<void>;
	archive(id: string): Promise<void>;
	reorder(id: string, newOrder: number): Promise<void>;
	moveTask(id: string, status: TaskStatus): Promise<void>;
	togglePinnedToday(id: string): Promise<void>;
}

type TaskStore = TaskState & TaskActions;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function buildOptimisticTask(
	id: string,
	title: string,
	priority: TaskPriority,
	category: string | null,
	status: TaskStatus,
	opts?: AddTaskOpts,
): Task {
	const now = new Date().toISOString();
	return {
		id,
		title,
		description: null,
		priority,
		category,
		status,
		dueDate: null,
		goalId: null,
		projectId: opts?.projectId ?? null,
		responsibilityId: opts?.responsibilityId ?? null,
		effort: opts?.effort ?? null,
		pinnedToday: opts?.pinnedToday ?? false,
		source: opts?.source ?? "manual",
		sortOrder: 0,
		createdAt: now,
		completedAt: null,
		incompleteReason: null,
		updatedAt: now,
	};
}

function persistInBackground(fn: () => Promise<unknown>): void {
	fn().catch(() => {
		// DB persistence failed — optimistic state stays until reload
	});
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useTaskStore = create<TaskStore>((set, get) => ({
	tasks: [],
	loading: false,

	async load() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const tasks = await getTasks(db);
			set({ tasks });
		} catch {
			// DB unavailable — keep whatever tasks are in state
		} finally {
			set({ loading: false });
		}
	},

	async add(title, priority = "should", category = null, status = "backlog" as TaskStatus, opts) {
		const id = createId();
		const task = buildOptimisticTask(id, title, priority, category, status, opts);

		// Optimistic: update state immediately
		set((state) => ({ tasks: [...state.tasks, task] }));

		eventBus.emit({
			appId: "tasks",
			eventType: "task_created",
			payload: { id, title, priority, status },
		});

		// Persist in background
		persistInBackground(() => {
			const db = getDbClient();
			return addTask(db, title, priority, category, status, id, opts);
		});
	},

	async togglePinnedToday(id) {
		const task = get().tasks.find((t) => t.id === id);
		if (!task) return;
		const newPinned = !task.pinnedToday;
		const now = new Date().toISOString();

		set((state) => ({
			tasks: state.tasks.map((t) =>
				t.id === id ? { ...t, pinnedToday: newPinned, updatedAt: now } : t,
			),
		}));

		persistInBackground(() => {
			const db = getDbClient();
			return updateTask(db, id, { pinnedToday: newPinned });
		});
	},

	async update(id, fields) {
		const now = new Date().toISOString();

		// Optimistic: update state immediately
		set((state) => ({
			tasks: state.tasks.map((t) =>
				t.id === id ? { ...t, ...fields, updatedAt: now } : t,
			),
		}));

		eventBus.emit({
			appId: "tasks",
			eventType: "task_updated",
			payload: { id, fields },
		});

		// Persist in background
		persistInBackground(() => {
			const db = getDbClient();
			return updateTask(db, id, fields);
		});
	},

	async complete(id) {
		const now = new Date().toISOString();
		const task = get().tasks.find((t) => t.id === id);

		// Optimistic: update state immediately
		set((state) => ({
			tasks: state.tasks.map((t) =>
				t.id === id ? { ...t, status: "complete" as const, completedAt: now, updatedAt: now } : t,
			),
		}));

		eventBus.emit({
			appId: "tasks",
			eventType: "task_completed",
			payload: { id, title: task?.title ?? "" },
		});

		// Persist in background
		persistInBackground(() => {
			const db = getDbClient();
			return completeTask(db, id);
		});
	},

	async archive(id) {
		const now = new Date().toISOString();

		// Optimistic: update state immediately
		set((state) => ({
			tasks: state.tasks.map((t) =>
				t.id === id ? { ...t, status: "archived" as const, updatedAt: now } : t,
			),
		}));

		// Persist in background
		persistInBackground(() => {
			const db = getDbClient();
			return archiveTask(db, id);
		});
	},

	async reorder(id, newOrder) {
		// Optimistic: update state immediately
		set((state) => ({
			tasks: state.tasks.map((t) =>
				t.id === id ? { ...t, sortOrder: newOrder } : t,
			),
		}));

		// Persist in background
		persistInBackground(() => {
			const db = getDbClient();
			return reorderTask(db, id, newOrder);
		});
	},

	async moveTask(id, status) {
		const now = new Date().toISOString();
		const task = get().tasks.find((t) => t.id === id);

		// Optimistic: update state immediately
		set((state) => ({
			tasks: state.tasks.map((t) =>
				t.id === id
					? { ...t, status, updatedAt: now, completedAt: status === "complete" ? now : t.completedAt }
					: t,
			),
		}));

		// Emit move event
		eventBus.emit({
			appId: "tasks",
			eventType: "task_moved",
			payload: { id, status, title: task?.title ?? "" },
		});

		// Also emit task_completed when moving to done
		if (status === "complete") {
			eventBus.emit({
				appId: "tasks",
				eventType: "task_completed",
				payload: { id, title: task?.title ?? "" },
			});
		}

		// Persist in background
		persistInBackground(() => {
			const db = getDbClient();
			return updateTask(db, id, { status });
		});
	},
}));

// ----------------------------------------------------------------------------
// Selectors
// ----------------------------------------------------------------------------

/** Non-terminal statuses (everything except complete/archived) */
const ACTIVE_STATUSES = new Set<string>(["pending", "backlog", "today", "in-progress"]);

export function selectTasksByPriority(
	tasks: readonly Task[],
	priority: TaskPriority,
): readonly Task[] {
	return tasks.filter((t) => t.priority === priority && ACTIVE_STATUSES.has(t.status));
}

export function selectPendingTasks(tasks: readonly Task[]): readonly Task[] {
	return tasks.filter((t) => ACTIVE_STATUSES.has(t.status));
}

export function selectCompletedTasks(tasks: readonly Task[]): readonly Task[] {
	return tasks.filter((t) => t.status === "complete");
}

export function selectTasksByStatus(
	tasks: readonly Task[],
	status: TaskStatus,
): readonly Task[] {
	return tasks.filter((t) => t.status === status);
}
