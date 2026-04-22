export type TaskPriority = "must" | "should" | "could";
export type TaskStatus = "pending" | "backlog" | "today" | "in-progress" | "complete" | "archived";

/** Kanban column status values */
export type KanbanStatus = "backlog" | "today" | "in-progress" | "done";

/** Map kanban column status to internal TaskStatus */
export const KANBAN_TO_TASK_STATUS: Record<KanbanStatus, TaskStatus> = {
	backlog: "backlog",
	today: "today",
	"in-progress": "in-progress",
	done: "complete",
} as const;

/** Map internal TaskStatus back to kanban column */
export function taskStatusToKanban(status: TaskStatus): KanbanStatus {
	if (status === "complete") return "done";
	if (status === "backlog" || status === "today" || status === "in-progress") return status;
	// "pending" and "archived" map to backlog by default
	return "backlog";
}

export type TaskSource = "manual" | "brain_dump" | "responsibility" | "idea";
export type TaskEffort = "xs" | "s" | "m" | "l" | "xl";

export interface Task {
	readonly id: string;
	readonly title: string;
	readonly description: string | null;
	readonly priority: TaskPriority;
	readonly category: string | null;
	readonly status: TaskStatus;
	readonly dueDate: string | null;
	readonly goalId: string | null;
	readonly projectId: string | null;
	readonly responsibilityId: string | null;
	readonly effort: TaskEffort | null;
	readonly pinnedToday: boolean;
	readonly source: TaskSource;
	readonly sortOrder: number;
	readonly createdAt: string;
	readonly completedAt: string | null;
	readonly incompleteReason: string | null;
	readonly updatedAt: string;
}
