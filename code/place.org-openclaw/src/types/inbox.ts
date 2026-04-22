export interface InboxItem {
	readonly id: string;
	readonly content: string;
	readonly source: "text" | "voice";
	readonly processed: boolean;
	readonly action: "task" | "journal" | "archive" | null;
	readonly createdAt: string;
	readonly processedAt: string | null;
	readonly updatedAt: string;
}
