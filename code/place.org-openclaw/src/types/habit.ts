export type HabitFrequency = "daily" | "weekly";

export interface Habit {
	readonly id: string;
	readonly name: string;
	readonly frequency: HabitFrequency;
	readonly target: string | null;
	readonly active: boolean;
	readonly sortOrder: number;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface HabitLog {
	readonly id: string;
	readonly habitId: string;
	readonly date: string;
	readonly completed: boolean;
	readonly notes: string | null;
	readonly updatedAt: string;
}
