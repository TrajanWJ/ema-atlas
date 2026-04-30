export type HabitFrequency = "daily" | "weekly";

export interface Habit {
	readonly id: string;
	readonly name: string;
	readonly frequency: HabitFrequency;
	readonly target: string | null;
	readonly active: boolean;
	readonly sortOrder: number;
	readonly color: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export const HABIT_COLORS = [
	'#5b9cf5',
	'#38c97a',
	'#e8a84c',
	'#ef6b6b',
	'#a78bfa',
	'#f472b6',
	'#34d399',
] as const;

export interface HabitLog {
	readonly id: string;
	readonly habitId: string;
	readonly date: string;
	readonly completed: boolean;
	readonly notes: string | null;
	readonly updatedAt: string;
}
