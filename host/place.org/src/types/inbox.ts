export type InboxAction =
	| "task"
	| "journal"
	| "archive"
	| "note"
	| "idea"
	| "processing";

export interface InboxItem {
	readonly id: string;
	readonly content: string;
	readonly source: "text" | "voice";
	readonly processed: boolean;
	readonly action: InboxAction | null;
	readonly projectId: string | null;
	readonly actionTargetId: string | null;
	readonly createdAt: string;
	readonly processedAt: string | null;
	readonly updatedAt: string;
}
