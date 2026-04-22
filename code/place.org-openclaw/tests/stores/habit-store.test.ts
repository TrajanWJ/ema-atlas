import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Habit, HabitLog } from "../../src/types/habit";
import { calculateStreak } from "../../src/stores/habit-store";

// ----------------------------------------------------------------------------
// Mock DB queries and client
// ----------------------------------------------------------------------------

const mockAddHabit = vi.fn();
const mockGetActiveHabits = vi.fn();
const mockArchiveHabit = vi.fn();
const mockGetLogsForDate = vi.fn();
const mockUpsertHabitLog = vi.fn();
const mockGetLogsForDateRange = vi.fn();

vi.mock("../../src/db/queries/habits", () => ({
	addHabit: (...args: unknown[]) => mockAddHabit(...args),
	getActiveHabits: (...args: unknown[]) => mockGetActiveHabits(...args),
	archiveHabit: (...args: unknown[]) => mockArchiveHabit(...args),
	getLogsForDate: (...args: unknown[]) => mockGetLogsForDate(...args),
	upsertHabitLog: (...args: unknown[]) => mockUpsertHabitLog(...args),
	getLogsForDateRange: (...args: unknown[]) => mockGetLogsForDateRange(...args),
}));

vi.mock("../../src/db/client", () => ({
	getDbClient: () => ({}),
}));

const { useHabitStore } = await import("../../src/stores/habit-store");

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function makeHabit(overrides?: Partial<Habit>): Habit {
	return {
		id: "habit-1",
		name: "Exercise",
		frequency: "daily",
		target: null,
		active: true,
		sortOrder: 0,
		createdAt: "2026-03-20T12:00:00.000Z",
		updatedAt: "2026-03-20T12:00:00.000Z",
		...overrides,
	};
}

function makeLog(overrides?: Partial<HabitLog>): HabitLog {
	return {
		id: "log-1",
		habitId: "habit-1",
		date: "2026-03-20",
		completed: true,
		notes: null,
		updatedAt: "2026-03-20T12:00:00.000Z",
		...overrides,
	};
}

beforeEach(() => {
	useHabitStore.setState({ habits: [], todayLogs: [], loading: false });
	vi.clearAllMocks();
});

// ----------------------------------------------------------------------------
// Tests — store operations
// ----------------------------------------------------------------------------

describe("load", () => {
	it("loads habits and today logs", async () => {
		const habits = [makeHabit({ id: "h1" })];
		const logs = [makeLog({ habitId: "h1" })];
		mockGetActiveHabits.mockResolvedValueOnce(habits);
		mockGetLogsForDate.mockResolvedValueOnce(logs);

		await useHabitStore.getState().load();

		expect(useHabitStore.getState().habits).toEqual(habits);
		expect(useHabitStore.getState().todayLogs).toEqual(logs);
	});
});

describe("addHabit", () => {
	it("appends the new habit to the list", async () => {
		const habit = makeHabit({ id: "new" });
		mockAddHabit.mockResolvedValueOnce(habit);

		await useHabitStore.getState().addHabit("Exercise");

		expect(useHabitStore.getState().habits).toContainEqual(habit);
	});
});

describe("archiveHabit", () => {
	it("removes habit from the list", async () => {
		useHabitStore.setState({
			habits: [makeHabit({ id: "h1" }), makeHabit({ id: "h2" })],
			todayLogs: [makeLog({ habitId: "h1" })],
		});
		mockArchiveHabit.mockResolvedValueOnce(undefined);

		await useHabitStore.getState().archiveHabit("h1");

		const ids = useHabitStore.getState().habits.map((h) => h.id);
		expect(ids).not.toContain("h1");
		expect(ids).toContain("h2");
	});

	it("removes today logs for archived habit", async () => {
		useHabitStore.setState({
			habits: [makeHabit({ id: "h1" })],
			todayLogs: [makeLog({ habitId: "h1" })],
		});
		mockArchiveHabit.mockResolvedValueOnce(undefined);

		await useHabitStore.getState().archiveHabit("h1");

		expect(useHabitStore.getState().todayLogs).toHaveLength(0);
	});
});

describe("toggleToday", () => {
	it("marks habit as completed if not yet done", async () => {
		useHabitStore.setState({
			habits: [makeHabit({ id: "h1" })],
			todayLogs: [],
		});
		const updatedLog = makeLog({ habitId: "h1", completed: true });
		mockUpsertHabitLog.mockResolvedValueOnce(updatedLog);

		await useHabitStore.getState().toggleToday("h1");

		const log = useHabitStore.getState().todayLogs.find((l) => l.habitId === "h1");
		expect(log?.completed).toBe(true);
	});

	it("toggles completed to false if already done", async () => {
		useHabitStore.setState({
			habits: [makeHabit({ id: "h1" })],
			todayLogs: [makeLog({ habitId: "h1", completed: true })],
		});
		const updatedLog = makeLog({ habitId: "h1", completed: false });
		mockUpsertHabitLog.mockResolvedValueOnce(updatedLog);

		await useHabitStore.getState().toggleToday("h1");

		const log = useHabitStore.getState().todayLogs.find((l) => l.habitId === "h1");
		expect(log?.completed).toBe(false);
	});
});

// ----------------------------------------------------------------------------
// Tests — calculateStreak (pure function)
// ----------------------------------------------------------------------------

describe("calculateStreak", () => {
	it("returns 0 when no logs", () => {
		expect(calculateStreak([], "2026-03-20")).toBe(0);
	});

	it("returns 1 for a single completed today", () => {
		const logs = [makeLog({ date: "2026-03-20", completed: true })];
		expect(calculateStreak(logs, "2026-03-20")).toBe(1);
	});

	it("returns 0 when today is not completed", () => {
		const logs = [
			makeLog({ date: "2026-03-19", completed: true }),
			makeLog({ date: "2026-03-20", completed: false }),
		];
		expect(calculateStreak(logs, "2026-03-20")).toBe(0);
	});

	it("returns consecutive streak counting from today", () => {
		const logs = [
			makeLog({ date: "2026-03-18", completed: true }),
			makeLog({ date: "2026-03-19", completed: true }),
			makeLog({ date: "2026-03-20", completed: true }),
		];
		expect(calculateStreak(logs, "2026-03-20")).toBe(3);
	});

	it("stops at the first gap", () => {
		const logs = [
			makeLog({ date: "2026-03-16", completed: true }),
			// gap at 17
			makeLog({ date: "2026-03-18", completed: true }),
			makeLog({ date: "2026-03-19", completed: true }),
			makeLog({ date: "2026-03-20", completed: true }),
		];
		expect(calculateStreak(logs, "2026-03-20")).toBe(3);
	});

	it("ignores incomplete log entries for streak count", () => {
		const logs = [
			makeLog({ date: "2026-03-18", completed: false }),
			makeLog({ date: "2026-03-19", completed: true }),
			makeLog({ date: "2026-03-20", completed: true }),
		];
		expect(calculateStreak(logs, "2026-03-20")).toBe(2);
	});
});
