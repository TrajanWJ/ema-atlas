export type ResponsibilityCadence =
	| "daily"
	| "weekly"
	| "biweekly"
	| "monthly"
	| "quarterly"
	| "ongoing";

export interface Responsibility {
	readonly id: string;
	readonly title: string;
	readonly description: string | null;
	readonly role: string | null;
	readonly cadence: ResponsibilityCadence | null;
	readonly active: boolean;
	readonly lastTouchedAt: string | null;
	readonly sortOrder: number;
	readonly createdAt: string;
	readonly updatedAt: string;
}
