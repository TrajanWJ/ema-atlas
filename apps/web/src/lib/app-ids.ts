import type { AppId } from "@/src/types/window";

export const PLACE_TOOL_APP_IDS = [
	"brain-dump",
	"focus",
	"tasks",
	"habits",
	"notes",
	"journal",
	"terminal",
	"music",
	"calculator",
	"clock",
	"about-place",
	"about-trajan",
	"calendar",
	"system-monitor",
	"finder",
	"photos",
	"pipes",
	"documents",
	"canvas",
	"rss",
	"projects",
	"responsibilities",
	"ideas",
	"loops",
	"stuck",
	"avoiding",
	"decisions",
	"learning",
	"questions",
	"contacts",
	"plate",
	"rewind",
] as const satisfies readonly AppId[];

export const EMA_VAPP_IDS = [
	"blueprint",
	"hq",
	"agent-work",
	"chronicle",
	"git-ema",
	"wiki",
	"threads",
	"launchpad",
	"settings",
	"place-tools",
] as const satisfies readonly AppId[];

export const APP_IDS = [
	...PLACE_TOOL_APP_IDS,
	...EMA_VAPP_IDS,
] as const satisfies readonly AppId[];

export const APP_ID_SET: ReadonlySet<string> = new Set(APP_IDS);

export function isAppId(value: unknown): value is AppId {
	return typeof value === "string" && APP_ID_SET.has(value);
}
