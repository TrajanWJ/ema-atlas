export interface DailyHighlight {
	readonly date: string;
	readonly text: string | null;
	readonly taskId: string | null;
	readonly completed: boolean;
	readonly updatedAt: string;
}
