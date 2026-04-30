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

export const TIME_BLOCK_CATEGORIES = {
	"deep-work": { label: "Deep Work", color: "var(--accent-blue)" },
	meetings: { label: "Meetings", color: "#a78bfa" },
	admin: { label: "Admin", color: "var(--text-secondary)" },
	break: { label: "Break", color: "var(--accent-success)" },
	personal: { label: "Personal", color: "var(--accent-warm)" },
} as const;

export type TimeBlockCategory = keyof typeof TIME_BLOCK_CATEGORIES;

export interface TimeBlock {
	readonly id: string;
	readonly label: string;
	readonly category: TimeBlockCategory;
	readonly startTime: string;
	readonly endTime: string;
	readonly date: string;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface HistorySession {
	readonly id: string;
	readonly startedAt: string;
	readonly endedAt: string | null;
	readonly status: FocusSessionStatus;
	readonly blocks: readonly HistoryBlock[];
}

export interface HistoryBlock {
	readonly id: string;
	readonly type: FocusBlockType;
	readonly actualMs: number | null;
	readonly label: string | null;
	readonly tags: string | null;
	readonly startedAt: string;
}

export interface DailyHistory {
	readonly date: string;
	readonly sessions: readonly HistorySession[];
	readonly totalFocusMs: number;
	readonly sessionCount: number;
}

export interface WeeklySummary {
	readonly date: string;
	readonly focusMs: number;
}
