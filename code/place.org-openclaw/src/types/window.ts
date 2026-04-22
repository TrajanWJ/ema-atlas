export type AppId =
	| "brain-dump"
	| "journal"
	| "focus"
	| "tasks"
	| "dashboard"
	| "review"
	| "calendar"
	| "habits"
	| "terminal"
	| "settings"
	| "clock"
	| "music"
	| "calculator";

export interface WindowPosition {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

export interface ProcessWindow {
	readonly id: string;
	readonly appId: AppId;
	readonly position: WindowPosition;
	readonly zIndex: number;
	readonly minimized: boolean;
	readonly maximized: boolean;
}
