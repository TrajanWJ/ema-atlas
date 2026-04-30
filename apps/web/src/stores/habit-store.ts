import { create } from "zustand";
import {
	addHabit,
	getActiveHabits,
	archiveHabit,
	getLogsForDate,
	upsertHabitLog,
	getLogsForDateRange,
	getAllLogsForDateRange,
	getAllLogsForHabit,
} from "@/src/db/queries/habits";
import { getDbClient } from "@/src/db/client";
import { eventBus } from "@/src/lib/event-bus";
import { fireConfetti } from "@/src/lib/confetti";
import { useToastStore } from "@/src/stores/toast-store";
import type { Habit, HabitFrequency, HabitLog } from "@/src/types/habit";
import { HABIT_COLORS } from "@/src/types/habit";

// ----------------------------------------------------------------------------
// Streak milestone detection
// ----------------------------------------------------------------------------

const STREAK_MILESTONES = [7, 30, 100] as const;

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
	getLogsForRange(startDate: string, endDate: string): Promise<readonly HabitLog[]>;
	getAllLogsForHabit(habitId: string): Promise<readonly HabitLog[]>;
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
		} catch {
			// DB unavailable — keep whatever habits/logs are in state
		} finally {
			set({ loading: false });
		}
	},

	async addHabit(name, frequency = "daily", target = null) {
		const { habits } = get();
		const usedColors = new Set(habits.map((h) => h.color));
		const nextColor = HABIT_COLORS.find((c) => !usedColors.has(c)) ?? HABIT_COLORS[habits.length % HABIT_COLORS.length] ?? '#5b9cf5';
		const now = new Date().toISOString();
		const optimisticId = `temp-${Date.now()}`;
		const optimistic: Habit = {
			id: optimisticId, name, frequency, target,
			active: true, sortOrder: 0, color: nextColor,
			createdAt: now, updatedAt: now,
		};
		set((state) => ({ habits: [...state.habits, optimistic] }));
		eventBus.emit({
			appId: "habits",
			eventType: "habit_created",
			payload: { id: optimisticId, name, frequency },
		});
		try {
			const db = getDbClient();
			const real = await addHabit(db, name, frequency, target, nextColor);
			set((s) => ({
				habits: s.habits.map((h) => h.id === optimisticId ? real : h),
			}));
		} catch { /* keep optimistic in UI */ }
	},

	async archiveHabit(habitId) {
		set((state) => ({
			habits: state.habits.filter((h) => h.id !== habitId),
			todayLogs: state.todayLogs.filter((l) => l.habitId !== habitId),
		}));
		try {
			const db = getDbClient();
			await archiveHabit(db, habitId);
		} catch { /* UI already updated */ }
	},

	async toggleToday(habitId) {
		const today = todayStr();
		const { todayLogs, habits } = get();
		const existing = todayLogs.find((l) => l.habitId === habitId);
		const newCompleted = !(existing?.completed ?? false);
		const now = new Date().toISOString();
		const optimisticLog: HabitLog = {
			id: existing?.id ?? `temp-${Date.now()}`,
			habitId, date: today, completed: newCompleted,
			notes: existing?.notes ?? null, updatedAt: now,
		};
		set((state) => {
			const filtered = state.todayLogs.filter((l) => l.habitId !== habitId);
			return { todayLogs: [...filtered, optimisticLog] };
		});
		const habit = habits.find((h) => h.id === habitId);
		eventBus.emit({
			appId: "habits",
			eventType: "habit_toggled",
			payload: { habitId, name: habit?.name ?? "", completed: newCompleted },
		});
		try {
			const db = getDbClient();
			const real = await upsertHabitLog(db, habitId, today, newCompleted);
			set((s) => ({
				todayLogs: s.todayLogs.map((l) =>
					l.habitId === habitId && l.date === today ? real : l,
				),
			}));
		} catch { /* keep optimistic in UI */ }

		// Check for streak milestones when marking complete
		if (newCompleted) {
			try {
				const streak = await get().getStreak(habitId);
				const milestone = STREAK_MILESTONES.find((m) => m === streak);
				if (milestone !== undefined) {
					fireConfetti();
					const habitName = habit?.name ?? "this habit";
					useToastStore
						.getState()
						.addToast(
							`${milestone}-day streak on ${habitName}! \u{1F525}`,
							"success",
							5000,
						);
				}
			} catch { /* streak check failed, non-critical */ }
		}
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

	async getLogsForRange(startDate, endDate) {
		const db = getDbClient();
		return getAllLogsForDateRange(db, startDate, endDate);
	},

	async getAllLogsForHabit(habitId) {
		const db = getDbClient();
		return getAllLogsForHabit(db, habitId);
	},
}));

// ----------------------------------------------------------------------------
// Pure helpers
// ----------------------------------------------------------------------------

export function getHabitColor(habit: Habit, index: number): string {
	return habit.color ?? HABIT_COLORS[index % HABIT_COLORS.length] ?? '#5b9cf5';
}

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
