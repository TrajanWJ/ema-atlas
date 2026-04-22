import type {
	AppSettings,
	BrainDumpSettings,
	CalculatorSettings,
	ClockSettings,
	FinderSettings,
	FocusSettings,
	HabitsSettings,
	JournalSettings,
	MusicSettings,
	NotesSettings,
	PipesSettings,
	SettingsState,
	SystemMonitorSettings,
	TasksSettings,
	TerminalSettings,
} from "@/src/types/settings";

export const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
	defaultDuration: 25,
	defaultBreak: 5,
	longBreak: 15,
	sessionsBeforeLongBreak: 4,
	autoStartBreaks: true,
	autoStartFocus: false,
	keepAwake: true,
	dimOtherWindows: false,
	dimOpacity: 0.5,
	completeSound: "bell",
	tickSound: false,
	tickVolume: 0.3,
	linkTask: true,
	autoJournal: false,
};

export const DEFAULT_TASKS_SETTINGS: TasksSettings = {
	defaultView: "list",
	completedBehavior: "fade",
	sortOrder: "manual",
	showSubtaskProgress: true,
	confirmDelete: true,
	autoArchive: false,
	autoArchiveDays: 7,
	quickAddPosition: "top",
};

export const DEFAULT_JOURNAL_SETTINGS: JournalSettings = {
	defaultMode: "write",
	font: "system",
	spellCheck: true,
	template:
		"## {{date}}\n\n### How am I feeling?\n\n### What happened today?\n\n### Grateful for\n",
	showMoodPicker: true,
	showOneThing: true,
	reminder: false,
	reminderTime: "20:00",
};

export const DEFAULT_HABITS_SETTINGS: HabitsSettings = {
	defaultView: "daily",
	weekStart: "monday",
	streakAnimations: true,
	dayResetTime: "00:00",
	allowBackfill: false,
	reminder: false,
	reminderTime: "21:00",
};

export const DEFAULT_BRAIN_DUMP_SETTINGS: BrainDumpSettings = {
	defaultView: "queue",
	quickCaptureShortcut: "Ctrl+Space",
	autoCategorize: false,
	captureSound: true,
	sendToDefault: "tasks",
};

export const DEFAULT_NOTES_SETTINGS: NotesSettings = {
	autoSave: true,
	autoSaveInterval: 2000,
	defaultFormat: "markdown",
	font: "system-ui",
	wordWrap: true,
	lineNumbers: false,
};

export const DEFAULT_MUSIC_SETTINGS: MusicSettings = {
	defaultStation: "lofi",
	autoPlayOnFocus: false,
	pauseOnBreak: false,
	crossfade: true,
	crossfadeDuration: 2,
	visualizer: "bars",
};

export const DEFAULT_TERMINAL_SETTINGS: TerminalSettings = {
	font: "monospace",
	fontSize: 14,
	colorScheme: "default",
	cursorStyle: "block",
	cursorBlink: true,
	scrollback: 1000,
};

export const DEFAULT_FINDER_SETTINGS: FinderSettings = {
	defaultView: "grid",
	showHidden: false,
	thumbnailSize: "medium",
	sortBy: "name",
	previewPanel: true,
};

export const DEFAULT_CALCULATOR_SETTINGS: CalculatorSettings = {
	defaultMode: "basic",
	thousandsSeparator: true,
	decimalPlaces: 10,
	showHistory: true,
};

export const DEFAULT_CLOCK_SETTINGS: ClockSettings = {
	format: "12h",
	showSeconds: false,
	worldClocks: [],
	style: "digital",
};

export const DEFAULT_SYSTEM_MONITOR_SETTINGS: SystemMonitorSettings = {
	refreshInterval: 2000,
	chartStyle: "line",
	showInMenuBar: false,
};

export const DEFAULT_PIPES_SETTINGS: PipesSettings = {
	autoRun: false,
	debugMode: false,
	maxExecutionTime: 30000,
	notifyOnComplete: true,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
	focus: DEFAULT_FOCUS_SETTINGS,
	tasks: DEFAULT_TASKS_SETTINGS,
	journal: DEFAULT_JOURNAL_SETTINGS,
	habits: DEFAULT_HABITS_SETTINGS,
	brainDump: DEFAULT_BRAIN_DUMP_SETTINGS,
	notes: DEFAULT_NOTES_SETTINGS,
	music: DEFAULT_MUSIC_SETTINGS,
	terminal: DEFAULT_TERMINAL_SETTINGS,
	finder: DEFAULT_FINDER_SETTINGS,
	calculator: DEFAULT_CALCULATOR_SETTINGS,
	clock: DEFAULT_CLOCK_SETTINGS,
	systemMonitor: DEFAULT_SYSTEM_MONITOR_SETTINGS,
	pipes: DEFAULT_PIPES_SETTINGS,
};

export const DEFAULT_SETTINGS: SettingsState = {
	// Colors
	primaryColor: "#2DD4A8",
	accentColor: "#6B95F0",
	autoPrimaryFromWallpaper: false,
	colorMode: "dark",
	contrast: "standard",

	// Wallpaper
	wallpaper: "default",
	customWallpaperUrl: null,
	wallpaperOpacity: 0.85,
	wallpaperFit: "cover",
	wallpaperTint: false,
	wallpaperTintOpacity: 0.3,

	// Glass & Blur
	glassIntensity: 1.3,
	blurAmount: null,
	glassTint: 0.05,
	glassSaturation: 1.0,

	// Typography
	fontSize: 16,
	fontFamily: "system-ui",
	fontWeight: 400,
	lineSpacing: "comfortable",

	// Animations
	bgAnimation: "dots-connect",
	bgAnimationSpeed: 0.8,
	bgAnimationInteractive: true,
	windowTransitionStyle: "scale",
	reducedMotion: "system",
	bootAnimation: true,
	bootSpeed: "normal",

	// Dock
	dockPosition: "bottom",
	dockSize: "medium",
	dockMagnification: true,
	dockMagnificationScale: 1.5,
	dockAutoHide: false,
	dockSpacing: 4,
	dockShowLabels: false,
	dockRunningIndicators: true,

	// Windows
	windowCornerRadius: 14,
	windowShadows: true,
	windowAnimations: true,
	inactiveWindowOpacity: 1.0,
	snapZones: true,
	titleBarStyle: "default",
	doubleClickTitleBar: "maximize",

	// Desktop
	showDesktopIcons: true,
	desktopIconSize: 48,
	desktopGridSpacing: 90,
	desktopSortOrder: "manual",
	virtualDesktopsEnabled: false,

	// Launcher
	launcherStyle: "spotlight",
	launcherRecentCount: 4,
	launcherGridColumns: 5,
	launcherShowCategories: true,

	// Sound
	soundEnabled: true,
	masterVolume: 0.5,
	volumeUI: 0.7,
	volumeNotifications: 0.7,
	volumeMusic: 0.7,
	soundPack: "default",

	// Notifications
	notificationBadges: true,
	notificationPosition: "top-right",
	notificationApps: {},

	// App Settings
	app: DEFAULT_APP_SETTINGS,
};
