export interface JournalEntry {
	readonly id: string;
	readonly date: string;
	readonly content: string;
	readonly oneThing: string | null;
	readonly mood: number | null;
	readonly energyP: number | null;
	readonly energyM: number | null;
	readonly energyE: number | null;
	readonly gratitude: string | null;
	readonly tags: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}
