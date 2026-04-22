export type TaskPriority = "must" | "should" | "could";
export type TaskStatus = "pending" | "complete" | "archived";

export interface Task {
	readonly id: string;
	readonly title: string;
	readonly description: string | null;
	readonly priority: TaskPriority;
	readonly category: string | null;
	readonly status: TaskStatus;
	readonly dueDate: string | null;
	readonly goalId: string | null;
	readonly sortOrder: number;
	readonly createdAt: string;
	readonly completedAt: string | null;
	readonly incompleteReason: string | null;
	readonly updatedAt: string;
}
