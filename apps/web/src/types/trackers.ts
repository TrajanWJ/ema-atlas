/**
 * Minimal entity types for the tracker family (Feel, Stuck, Avoiding, OneWord,
 * Decisions, Learning Log, Open Questions, Contacts, Morning Intent,
 * Evening Close, Wellness Pings).
 *
 * Kept in one file because these are small + related.
 */

export interface FeelCheck {
	readonly id: string;
	readonly emoji: string;
	readonly note: string | null;
	readonly at: string;
}

export type StuckState = "open" | "resolved";
export interface Stuck {
	readonly id: string;
	readonly text: string;
	readonly state: StuckState;
	readonly resolvedAt: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export type AvoidingState = "active" | "resolved";
export interface AvoidingItem {
	readonly id: string;
	readonly text: string;
	readonly state: AvoidingState;
	readonly resolvedAt: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface OneWord {
	readonly date: string;
	readonly word: string;
	readonly updatedAt: string;
}

export interface Decision {
	readonly id: string;
	readonly title: string;
	readonly choice: string | null;
	readonly why: string | null;
	readonly reversible: boolean;
	readonly projectId: string | null;
	readonly decidedAt: string;
	readonly outcome: string | null;
	readonly outcomeAt: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface LearningEntry {
	readonly id: string;
	readonly text: string;
	readonly topic: string | null;
	readonly source: string | null;
	readonly at: string;
}

export type OpenQuestionState = "open" | "answered";
export interface OpenQuestion {
	readonly id: string;
	readonly text: string;
	readonly state: OpenQuestionState;
	readonly answer: string | null;
	readonly answeredAt: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface ContactTouch {
	readonly id: string;
	readonly name: string;
	readonly oneWord: string | null;
	readonly channel: string | null;
	readonly at: string;
}

export interface MorningIntent {
	readonly date: string;
	readonly text: string;
	readonly satisfied: boolean | null;
	readonly updatedAt: string;
}

export interface EveningClose {
	readonly date: string;
	readonly text: string;
	readonly autoDraft: boolean;
	readonly updatedAt: string;
}

export type WellnessKind = "water" | "movement" | "meal";
export interface WellnessPing {
	readonly id: string;
	readonly kind: WellnessKind;
	readonly at: string;
}

export interface WeekTurn {
	readonly weekStart: string;
	readonly lastThree: readonly string[];
	readonly nextThree: readonly string[];
	readonly updatedAt: string;
}
