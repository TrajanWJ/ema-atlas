export interface RightNowState {
	readonly id: string;
	readonly text: string;
	readonly startedAt: string;
	readonly endedAt: string | null;
	readonly createdAt: string;
}
