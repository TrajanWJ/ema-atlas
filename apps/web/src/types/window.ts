export type AppId =
	| "brain-dump"
	| "journal"
	| "focus"
	| "tasks"
	| "calendar"
	| "habits"
	| "notes"
	| "terminal"
	| "settings"
	| "clock"
	| "music"
	| "calculator"
	| "about-place"
	| "about-trajan"
	| "system-monitor"
	| "finder"
	| "photos"
	| "pipes"
	| "documents"
	| "canvas"
	| "rss"
	| "projects"
	| "responsibilities"
	| "ideas"
	| "loops"
	| "stuck"
	| "avoiding"
	| "decisions"
	| "learning"
	| "questions"
	| "contacts"
	| "plate"
	| "rewind"
	| "blueprint"
	| "hq"
	| "git-ema"
	| "agent-work"
	| "chronicle"
	| "launchpad"
	| "wiki"
	| "threads"
	| "place-tools";

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
