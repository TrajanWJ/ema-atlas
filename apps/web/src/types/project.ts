export type ProjectStatus = "active" | "paused" | "done" | "archived";

export interface Project {
	readonly id: string;
	readonly title: string;
	readonly description: string | null;
	readonly color: string | null;
	readonly status: ProjectStatus;
	readonly priority: number;
	readonly sortOrder: number;
	readonly createdAt: string;
	readonly updatedAt: string;
}
