export interface Note {
	readonly id: string;
	readonly title: string;
	readonly content: string;
	readonly pinned: boolean;
	readonly archived: boolean;
	readonly sourceId: string | null;
	readonly sourceType: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}
