export type ReviewType = "daily" | "weekly" | "monthly";
export type ReviewPhase = "collect" | "reflect" | "plan";

export interface Review {
	readonly id: string;
	readonly type: ReviewType;
	readonly date: string;
	readonly wins: string | null;
	readonly challenges: string | null;
	readonly lessons: string | null;
	readonly nextOneThing: string | null;
	readonly content: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}
