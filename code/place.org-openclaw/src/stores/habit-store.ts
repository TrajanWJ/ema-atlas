import { create } from "zustand";
import {
	addHabit,
	getActiveHabits,
	archiveHabit,
	getLogsForDate,
	upsertHabitLog,
	getLogsForDateRange,
} from "@/src/db/queries/habits";
import { getDbClient } from "@/src/db/client";
import type { Habit, HabitFrequency, HabitLog } from "@/src/types/habit";

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface HabitState {
	readonly habits: readonly Habit[];
	readonly todayLogs: readonly HabitLog[];
	readonly loading: boolean;
}

interface HabitActions {
	load(): Promise<void>;
	addHabit(name: string, frequency?: HabitFrequency, target?: string | null): Promise<void>;
	archiveHabit(habitId: string): Promise<void>;
	toggleToday(habitId: string): Promise<void>;
	getStreak(habitId: string): Promise<number>;
}

type HabitStore = HabitState & HabitActions;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function todayStr(): string {
	return new Date().toISOString().slice(0, 10);
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useHabitStore = create<HabitStore>((set, get) => ({
	habits: [],
	todayLogs: [],
	loading: false,

	async load() {
		set({ loading: true });
		try {
			const db = getDbClient();
			const today = todayStr();
			const [habits, todayLogs] = await Promise.all([
				getActiveHabits(db),
				getLogsForDate(db, today),
			]);
			set({ habits, todayLogs });
		} finally {
			set({ loading: false });
		}
	},

	async addHabit(name, frequency = "daily", target = null) {
		const db = getDbClient();
		const habit = await addHabit(db, name, frequency, target);
		set((state) => ({ habits: [...state.habits, habit] }));
	},

	async archiveHabit(habitId) {
		const db = getDbClient();
		await archiveHabit(db, habitId);
		set((state) => ({
			habits: state.habits.filter((h) => h.id !== habitId),
			todayLogs: state.todayLogs.filter((l) => l.habitId !== habitId),
		}));
	},

	async toggleToday(habitId) {
		const db = getDbClient();
		const today = todayStr();
		const { todayLogs } = get();
		const existing = todayLogs.find((l) => l.habitId === habitId);
		const newCompleted = !(existing?.completed ?? false);
		const updated = await upsertHabitLog(db, habitId, today, newCompleted);
		set((state) => {
			const filtered = state.todayLogs.filter((l) => l.habitId !== habitId);
			return { todayLogs: [...filtered, updated] };
		});
	},

	async getStreak(habitId) {
		const db = getDbClient();
		const today = new Date();
		const startDate = new Date(today);
		startDate.setDate(startDate.getDate() - 60);
		const logs = await getLogsForDateRange(
			db,
			habitId,
			startDate.toISOString().slice(0, 10),
			today.toISOString().slice(0, 10),
		);
		return calculateStreak(logs, today.toISOString().slice(0, 10));
	},
}));

// ----------------------------------------------------------------------------
// Pure helpers
// ----------------------------------------------------------------------------

export function calculateStreak(logs: readonly HabitLog[], today: string): number {
	const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));
	let streak = 0;
	const cursor = new Date(today);
	while (true) {
		const dateStr = cursor.toISOString().slice(0, 10);
		if (!completedDates.has(dateStr)) break;
		streak++;
		cursor.setDate(cursor.getDate() - 1);
	}
	return streak;
}
