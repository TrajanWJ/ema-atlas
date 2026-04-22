import type { AppId } from "@/src/types/window";

export interface FocusSettings {
	defaultDuration: number;
	defaultBreak: number;
	longBreak: number;
	sessionsBeforeLongBreak: number;
	autoStartBreaks: boolean;
	autoStartFocus: boolean;
	keepAwake: boolean;
	dimOtherWindows: boolean;
	dimOpacity: number;
	completeSound: string;
	tickSound: boolean;
	tickVolume: number;
	linkTask: boolean;
	autoJournal: boolean;
}

export interface TasksSettings {
	defaultView: "list" | "kanban";
	completedBehavior: "show" | "fade" | "hide";
	sortOrder:
		| "manual"
		| "priority"
		| "due-date"
		| "created"
		| "alphabetical";
	showSubtaskProgress: boolean;
	confirmDelete: boolean;
	autoArchive: boolean;
	autoArchiveDays: number;
	quickAddPosition: "top" | "bottom";
}

export interface JournalSettings {
	defaultMode: "write" | "split" | "preview";
	font: "system" | "serif" | "mono";
	spellCheck: boolean;
	template: string;
	showMoodPicker: boolean;
	showOneThing: boolean;
	reminder: boolean;
	reminderTime: string;
}

export interface HabitsSettings {
	defaultView: "daily" | "week" | "month" | "streaks";
	weekStart: "monday" | "sunday";
	streakAnimations: boolean;
	dayResetTime: string;
	allowBackfill: boolean;
	reminder: boolean;
	reminderTime: string;
}

export interface BrainDumpSettings {
	defaultView: "queue" | "kanban";
	quickCaptureShortcut: string;
	autoCategorize: boolean;
	captureSound: boolean;
	sendToDefault: string;
}

export interface NotesSettings {
	autoSave: boolean;
	autoSaveInterval: number;
	defaultFormat: "markdown" | "plaintext";
	font: string;
	wordWrap: boolean;
	lineNumbers: boolean;
}

export interface MusicSettings {
	defaultStation: string;
	autoPlayOnFocus: boolean;
	pauseOnBreak: boolean;
	crossfade: boolean;
	crossfadeDuration: number;
	visualizer: "bars" | "wave" | "circular" | "none";
}

export interface TerminalSettings {
	font: string;
	fontSize: number;
	colorScheme: string;
	cursorStyle: "block" | "underline" | "bar";
	cursorBlink: boolean;
	scrollback: number;
}

export interface FinderSettings {
	defaultView: "grid" | "list" | "columns";
	showHidden: boolean;
	thumbnailSize: "small" | "medium" | "large" | "xlarge";
	sortBy: "name" | "date" | "size" | "type";
	previewPanel: boolean;
}

export interface CalculatorSettings {
	defaultMode: "basic" | "scientific" | "programmer";
	thousandsSeparator: boolean;
	decimalPlaces: number;
	showHistory: boolean;
}

export interface ClockSettings {
	format: "12h" | "24h";
	showSeconds: boolean;
	worldClocks: Array<{ zone: string; label: string }>;
	style: "digital" | "analog" | "minimal";
}

export interface SystemMonitorSettings {
	refreshInterval: number;
	chartStyle: "line" | "bar" | "gauge";
	showInMenuBar: boolean;
}

export interface PipesSettings {
	autoRun: boolean;
	debugMode: boolean;
	maxExecutionTime: number;
	notifyOnComplete: boolean;
}

export interface AppSettings {
	focus: FocusSettings;
	tasks: TasksSettings;
	journal: JournalSettings;
	habits: HabitsSettings;
	brainDump: BrainDumpSettings;
	notes: NotesSettings;
	music: MusicSettings;
	terminal: TerminalSettings;
	finder: FinderSettings;
	calculator: CalculatorSettings;
	clock: ClockSettings;
	systemMonitor: SystemMonitorSettings;
	pipes: PipesSettings;
}

export interface SettingsState {
	// Colors
	primaryColor: string;
	accentColor: string;
	autoPrimaryFromWallpaper: boolean;
	colorMode: "dark" | "light" | "auto";
	contrast: "standard" | "increased" | "high";

	// Wallpaper
	wallpaper: string;
	customWallpaperUrl: string | null;
	wallpaperOpacity: number;
	wallpaperFit: "cover" | "contain" | "fill" | "tile";
	wallpaperTint: boolean;
	wallpaperTintOpacity: number;

	// Glass & Blur
	glassIntensity: number;
	blurAmount: number | null;
	glassTint: number;
	glassSaturation: number;

	// Typography
	fontSize: number;
	fontFamily: string;
	fontWeight: 300 | 400 | 500;
	lineSpacing: "compact" | "comfortable" | "spacious";

	// Animations
	bgAnimation: string;
	bgAnimationSpeed: number;
	bgAnimationInteractive: boolean;
	windowTransitionStyle: "scale" | "fade" | "slide" | "flip";
	reducedMotion: boolean | "system";
	bootAnimation: boolean;
	bootSpeed: "normal" | "fast" | "instant";

	// Dock
	dockPosition: "bottom" | "left" | "right";
	dockSize: "small" | "medium" | "large";
	dockMagnification: boolean;
	dockMagnificationScale: number;
	dockAutoHide: boolean;
	dockSpacing: number;
	dockShowLabels: boolean;
	dockRunningIndicators: boolean;

	// Windows
	windowCornerRadius: number;
	windowShadows: boolean;
	windowAnimations: boolean;
	inactiveWindowOpacity: number;
	snapZones: boolean;
	titleBarStyle: "default" | "compact" | "hidden";
	doubleClickTitleBar: "maximize" | "minimize" | "shade";

	// Desktop
	showDesktopIcons: boolean;
	desktopIconSize: number;
	desktopGridSpacing: number;
	desktopSortOrder: "manual" | "alphabetical" | "type" | "recent";
	virtualDesktopsEnabled: boolean;

	// Launcher
	launcherStyle: "spotlight" | "fullscreen";
	launcherRecentCount: number;
	launcherGridColumns: number;
	launcherShowCategories: boolean;

	// Sound
	soundEnabled: boolean;
	masterVolume: number;
	volumeUI: number;
	volumeNotifications: number;
	volumeMusic: number;
	soundPack: string;

	// Notifications
	notificationBadges: boolean;
	notificationPosition:
		| "top-right"
		| "top-left"
		| "bottom-right"
		| "bottom-left";
	notificationApps: Partial<Record<AppId, boolean>>;

	// App Settings (nested)
	app: AppSettings;
}

export type SettingsKey = keyof SettingsState;
