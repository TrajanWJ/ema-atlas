export type LoopState = "open" | "closed";

export interface Loop {
	readonly id: string;
	readonly title: string;
	readonly waitingOn: string | null;
	readonly weight: number; // 1..5
	readonly state: LoopState;
	readonly projectId: string | null;
	readonly tags: readonly string[];
	readonly openedAt: string;
	readonly closedAt: string | null;
	readonly updatedAt: string;
}
