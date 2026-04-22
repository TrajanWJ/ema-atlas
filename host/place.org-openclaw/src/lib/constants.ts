import type { AppId, WindowPosition } from "../types/window";

export const DEFAULT_WINDOW_SIZES: Record<AppId, WindowPosition> = {
	"brain-dump": { x: 80, y: 50, width: 340, height: 380 },
	journal: { x: 100, y: 50, width: 400, height: 400 },
	focus: { x: 120, y: 60, width: 320, height: 360 },
	tasks: { x: 90, y: 50, width: 380, height: 380 },
	calendar: { x: 80, y: 50, width: 440, height: 380 },
	habits: { x: 110, y: 50, width: 340, height: 370 },
	notes: { x: 100, y: 50, width: 420, height: 400 },
	terminal: { x: 80, y: 60, width: 380, height: 280 },
	settings: { x: 120, y: 50, width: 380, height: 380 },
	clock: { x: 140, y: 80, width: 240, height: 260 },
	music: { x: 130, y: 100, width: 280, height: 160 },
	calculator: { x: 150, y: 70, width: 240, height: 320 },
	"about-place": { x: 100, y: 50, width: 360, height: 340 },
	"about-trajan": { x: 130, y: 60, width: 360, height: 340 },
	"system-monitor": { x: 90, y: 50, width: 420, height: 360 },
	finder: { x: 80, y: 50, width: 440, height: 380 },
	photos: { x: 60, y: 40, width: 600, height: 480 },
	pipes: { x: 80, y: 50, width: 480, height: 380 },
	documents: { x: 70, y: 50, width: 700, height: 500 },
	canvas: { x: 60, y: 40, width: 600, height: 450 },
	rss: { x: 80, y: 50, width: 420, height: 400 },
} as const satisfies Record<AppId, WindowPosition>;

/**
 * Popout window sizes — used when apps are detached as native companion
 * windows or browser popups. Wider/taller than desktop sizes since they
 * run standalone without a virtual desktop viewport constraint.
 *
 * Width/height only — x/y are set by cascade positioning or cursor position.
 */
export const POPOUT_WINDOW_SIZES: Record<AppId, { width: number; height: number }> = {
	// Widgets — small, widget-like
	clock: { width: 260, height: 280 },
	music: { width: 320, height: 200 },
	calculator: { width: 280, height: 380 },

	// Productivity — medium, comfortable for standalone use
	"brain-dump": { width: 400, height: 480 },
	focus: { width: 380, height: 440 },
	tasks: { width: 440, height: 500 },
	habits: { width: 400, height: 460 },
	journal: { width: 500, height: 540 },
	notes: { width: 520, height: 560 },
	calendar: { width: 500, height: 480 },

	// Utilities — medium
	terminal: { width: 520, height: 360 },
	settings: { width: 440, height: 480 },
	"system-monitor": { width: 480, height: 420 },
	finder: { width: 540, height: 460 },

	// Content — larger
	photos: { width: 680, height: 540 },
	documents: { width: 740, height: 560 },
	canvas: { width: 700, height: 520 },
	pipes: { width: 540, height: 440 },
	rss: { width: 500, height: 500 },

	// Info
	"about-place": { width: 420, height: 400 },
	"about-trajan": { width: 420, height: 400 },
} as const satisfies Record<AppId, { width: number; height: number }>;

export const APP_LABELS: Record<AppId, string> = {
	"brain-dump": "Brain Dump",
	journal: "Journal",
	focus: "Focus",
	tasks: "Tasks",
	calendar: "Calendar",
	habits: "Habits",
	notes: "Notes",
	terminal: "Terminal",
	settings: "Settings",
	clock: "Clock",
	music: "Music",
	calculator: "Calculator",
	"about-place": "About place.org",
	"about-trajan": "About Trajan",
	"system-monitor": "System Monitor",
	finder: "Finder",
	photos: "Photos",
	pipes: "Pipes",
	documents: "Documents",
	canvas: "Canvas",
	rss: "RSS Reader",
} as const satisfies Record<AppId, string>;
