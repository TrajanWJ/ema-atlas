export type GoalLevel = "3year" | "yearly" | "monthly" | "weekly";
export type GoalStatus = "active" | "complete" | "archived";

export interface Goal {
	readonly id: string;
	readonly title: string;
	readonly level: GoalLevel;
	readonly parentId: string | null;
	readonly progress: number;
	readonly status: GoalStatus;
	readonly targetDate: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}
