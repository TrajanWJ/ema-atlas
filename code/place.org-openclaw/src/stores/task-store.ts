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
import type { Task, TaskPriority } from "@/src/types/task";

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface TaskState {
	readonly tasks: readonly Task[];
	readonly loading: boolean;
}

interface TaskActions {
	load(): Promise<void>;
	add(title: string, priority?: TaskPriority, category?: string | null): Promise<void>;
	update(id: string, fields: Partial<Pick<Task, "title" | "description" | "priority" | "category" | "status" | "dueDate" | "goalId" | "sortOrder">>): Promise<void>;
	complete(id: string): Promise<void>;
	archive(id: string): Promise<void>;
	reorder(id: string, newOrder: number): Promise<void>;
}

type TaskStore = TaskState & TaskActions;

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
		} finally {
			set({ loading: false });
		}
	},

	async add(title, priority = "should", category = null) {
		const db = getDbClient();
		const task = await addTask(db, title, priority, category);
		set((state) => ({ tasks: [...state.tasks, task] }));
	},

	async update(id, fields) {
		const db = getDbClient();
		await updateTask(db, id, fields);
		set((state) => ({
			tasks: state.tasks.map((t) =>
				t.id === id ? { ...t, ...fields, updatedAt: new Date().toISOString() } : t,
			),
		}));
	},

	async complete(id) {
		const db = getDbClient();
		await completeTask(db, id);
		const now = new Date().toISOString();
		set((state) => ({
			tasks: state.tasks.map((t) =>
				t.id === id ? { ...t, status: "complete" as const, completedAt: now, updatedAt: now } : t,
			),
		}));
	},

	async archive(id) {
		const db = getDbClient();
		await archiveTask(db, id);
		const now = new Date().toISOString();
		set((state) => ({
			tasks: state.tasks.map((t) =>
				t.id === id ? { ...t, status: "archived" as const, updatedAt: now } : t,
			),
		}));
	},

	async reorder(id, newOrder) {
		const db = getDbClient();
		await reorderTask(db, id, newOrder);
		set((state) => ({
			tasks: state.tasks.map((t) =>
				t.id === id ? { ...t, sortOrder: newOrder } : t,
			),
		}));
	},

	// Helper: get tasks by priority (excludes archived)
}));

// ----------------------------------------------------------------------------
// Selectors
// ----------------------------------------------------------------------------

export function selectTasksByPriority(
	tasks: readonly Task[],
	priority: TaskPriority,
): readonly Task[] {
	return tasks.filter((t) => t.priority === priority && t.status === "pending");
}

export function selectPendingTasks(tasks: readonly Task[]): readonly Task[] {
	return tasks.filter((t) => t.status === "pending");
}

export function selectCompletedTasks(tasks: readonly Task[]): readonly Task[] {
	return tasks.filter((t) => t.status === "complete");
}
