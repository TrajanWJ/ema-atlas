import { create } from "zustand";
import { addGoal, getGoals, updateGoal, deleteGoal } from "@/src/db/queries/goals";
import { getDbClient } from "@/src/db/client";
import type { Goal, GoalLevel } from "@/src/types/goal";

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface GoalState {
	readonly goals: readonly Goal[];
	readonly loading: boolean;
}

interface GoalActions {
	load(): Promise<void>;
	add(title: string, level: GoalLevel, parentId?: string | null): Promise<void>;
	update(id: string, fields: Partial<Pick<Goal, "title" | "progress" | "status" | "targetDate" | "parentId">>): Promise<void>;
	remove(id: string): Promise<void>;
}

type GoalStore = GoalState & GoalActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useGoalStore = create<GoalStore>((set) => ({
	goals: [],
	loading: false,

	async load() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const goals = await getGoals(db, "active");
			set({ goals });
		} finally {
			set({ loading: false });
		}
	},

	async add(title, level, parentId = null) {
		const db = getDbClient();
		const goal = await addGoal(db, title, level, parentId);
		set((state) => ({ goals: [...state.goals, goal] }));
	},

	async update(id, fields) {
		const db = getDbClient();
		await updateGoal(db, id, fields);
		set((state) => ({
			goals: state.goals.map((g) =>
				g.id === id ? { ...g, ...fields, updatedAt: new Date().toISOString() } : g,
			),
		}));
	},

	async remove(id) {
		const db = getDbClient();
		await deleteGoal(db, id);
		set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
	},
}));

// ----------------------------------------------------------------------------
// Selectors
// ----------------------------------------------------------------------------

export function selectGoalsByLevel(goals: readonly Goal[], level: GoalLevel): readonly Goal[] {
	return goals.filter((g) => g.level === level && g.status === "active");
}

export function selectChildGoals(goals: readonly Goal[], parentId: string): readonly Goal[] {
	return goals.filter((g) => g.parentId === parentId && g.status === "active");
}
