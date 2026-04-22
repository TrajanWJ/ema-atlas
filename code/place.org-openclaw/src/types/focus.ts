export type FocusSessionStatus = "active" | "ended";

export type FocusBlockType =
	| "work"
	| "short_break"
	| "long_break";

export interface FocusSession {
	readonly id: string;
	readonly startedAt: string;
	readonly endedAt: string | null;
	readonly status: FocusSessionStatus;
	readonly updatedAt: string;
}

export interface FocusBlock {
	readonly id: string;
	readonly sessionId: string;
	readonly type: FocusBlockType;
	readonly targetMs: number;
	readonly actualMs: number | null;
	readonly label: string | null;
	readonly tags: string | null;
	readonly startedAt: string;
	readonly endedAt: string | null;
	readonly updatedAt: string;
}

export interface TodayFocusStats {
	readonly totalFocusMs: number;
	readonly sessionCount: number;
	readonly blockCount: number;
	readonly avgBlockMs: number;
}
