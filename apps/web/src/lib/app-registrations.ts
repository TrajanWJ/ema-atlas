import { createElement } from "react";
import { EMA_VAPP_IDS, PLACE_TOOL_APP_IDS } from "./app-ids";
import { registerApp, getApp, getAppsByGroup, getCanonicalAppIds } from "./app-registry";
import type { FileEntry, FileContent, AppStatus, AppGroup, PlaceApp } from "./app-registry";

// Re-export so vApp surfaces (Launchpad, Place Tools folder) can import the
// grouping helpers from the same module they import the registrations from.
export { getAppsByGroup, getCanonicalAppIds };
export type { AppGroup, PlaceApp };
export type AppDef = PlaceApp;
import { DEFAULT_WINDOW_SIZES } from "./constants";
import {
	BrainIcon,
	JournalIcon,
	TargetIcon,
	CheckIcon,
	RepeatIcon,
	TerminalIcon,
	MusicIcon,
	SettingsIcon,
	InfoIcon,
	UserIcon,
	ZapIcon,
	GlobeIcon,
	HomeIcon,
	NotesIcon,
	MonitorIcon,
	FinderIcon,
	PipesIcon,
	PhotosIcon,
	DocumentIcon,
	CanvasIcon,
	RssIcon,
	ChartIcon,
	FolderIcon,
} from "@/src/components/icons";
import { getTimerStatus, getTimerFiles } from "./timer-utils";
import { openFile } from "@/src/lib/file-system";
import { useInboxStore } from "@/src/stores/inbox-store";
import { useTaskStore } from "@/src/stores/task-store";
import { useNotesStore } from "@/src/stores/notes-store";
import { useHabitStore } from "@/src/stores/habit-store";
import { useJournalStore } from "@/src/stores/journal-store";
import { useWindowStore } from "@/src/stores/window-store";

// ----------------------------------------------------------------------------
// Helper — extract width/height from DEFAULT_WINDOW_SIZES
// ----------------------------------------------------------------------------

function sizeOf(appId: keyof typeof DEFAULT_WINDOW_SIZES) {
	const { width, height } = DEFAULT_WINDOW_SIZES[appId];
	return { width, height };
}

function icon(Component: React.ComponentType<{ size?: number }>, size = 20) {
	return createElement(Component, { size });
}

// ----------------------------------------------------------------------------
// Close-window helper (called at runtime, not module load)
// ----------------------------------------------------------------------------

function closeFocusedWindow(): void {
	const { activeWindowId, closeWindow } = useWindowStore.getState();
	if (activeWindowId) closeWindow(activeWindowId);
}

// ----------------------------------------------------------------------------
// Shared menu builders
// ----------------------------------------------------------------------------

function closeMenuItem() {
	return {
		label: "Close Window",
		action: closeFocusedWindow,
		shortcut: "Ctrl+W",
	} as const;
}

function fileMenuOnly() {
	return {
		menus: [{ label: "File", items: [closeMenuItem()] }],
	} as const;
}

function separatorItem() {
	return { label: "separator", action: () => {}, separator: true } as const;
}

// ----------------------------------------------------------------------------
// Brain Dump — helpers
// ----------------------------------------------------------------------------

function getBrainDumpStatus(): AppStatus | null {
	const { items } = useInboxStore.getState();
	if (items.length === 0) return null;
	return {
		label: `${items.length} unprocessed`,
		state: "idle",
		since: Date.now(),
	};
}

function getBrainDumpFiles(): FileEntry[] {
	const { items } = useInboxStore.getState();
	return items.map((item) => ({
		id: item.id,
		name: item.content.slice(0, 50),
		type: "inbox_item",
		preview: item.content.slice(0, 100),
		createdAt: new Date(item.createdAt).getTime(),
		updatedAt: new Date(item.updatedAt).getTime(),
	}));
}

function getBrainDumpFile(id: string): FileContent | undefined {
	const { items } = useInboxStore.getState();
	const item = items.find((i) => i.id === id);
	if (!item) return undefined;
	return {
		entry: {
			id: item.id,
			name: item.content.slice(0, 50),
			type: "inbox_item",
			preview: item.content.slice(0, 100),
			createdAt: new Date(item.createdAt).getTime(),
			updatedAt: new Date(item.updatedAt).getTime(),
		},
		body: item.content,
	};
}

// ----------------------------------------------------------------------------
// Tasks — helpers
// ----------------------------------------------------------------------------

function getTasksStatus(): AppStatus | null {
	const { tasks } = useTaskStore.getState();
	const inProgress = tasks.filter((t) => t.status === "in-progress");
	if (inProgress.length === 0) return null;
	return {
		label: `${inProgress.length} in progress`,
		state: "active",
		since: Date.now(),
	};
}

function getTaskFiles(): FileEntry[] {
	const { tasks } = useTaskStore.getState();
	return tasks
		.filter((t) => t.status !== "archived")
		.map((t) => ({
			id: t.id,
			name: t.title,
			type: "task",
			preview: t.description ?? t.status,
			createdAt: new Date(t.createdAt).getTime(),
			updatedAt: new Date(t.updatedAt).getTime(),
		}));
}

function getTaskFile(id: string): FileContent | undefined {
	const { tasks } = useTaskStore.getState();
	const task = tasks.find((t) => t.id === id);
	if (!task) return undefined;
	return {
		entry: {
			id: task.id,
			name: task.title,
			type: "task",
			preview: task.description ?? task.status,
			createdAt: new Date(task.createdAt).getTime(),
			updatedAt: new Date(task.updatedAt).getTime(),
		},
		body: task.description ?? "",
	};
}

// ----------------------------------------------------------------------------
// Habits — helpers
// ----------------------------------------------------------------------------

function getHabitsStatus(): AppStatus | null {
	const { habits, todayLogs } = useHabitStore.getState();
	if (habits.length === 0) return null;
	const completed = todayLogs.filter((l) => l.completed).length;
	return {
		label: `${completed}/${habits.length} today`,
		state: completed === habits.length ? "idle" : "active",
		since: Date.now(),
	};
}

function getHabitFiles(): FileEntry[] {
	const { habits } = useHabitStore.getState();
	return habits.map((h) => ({
		id: h.id,
		name: h.name,
		type: "habit",
		preview: h.frequency,
		createdAt: new Date(h.createdAt).getTime(),
		updatedAt: new Date(h.updatedAt).getTime(),
	}));
}

function getHabitFile(id: string): FileContent | undefined {
	const { habits } = useHabitStore.getState();
	const habit = habits.find((h) => h.id === id);
	if (!habit) return undefined;
	const target = habit.target ? ` — ${habit.target}` : "";
	return {
		entry: {
			id: habit.id,
			name: habit.name,
			type: "habit",
			preview: habit.frequency,
			createdAt: new Date(habit.createdAt).getTime(),
			updatedAt: new Date(habit.updatedAt).getTime(),
		},
		body: `${habit.name} (${habit.frequency})${target}`,
	};
}

// ----------------------------------------------------------------------------
// Notes — helpers
// ----------------------------------------------------------------------------

function getNotesFiles(): FileEntry[] {
	return useNotesStore.getState().listFiles();
}

function getNotesFile(id: string): FileContent | undefined {
	const { notes } = useNotesStore.getState();
	const note = notes.find((n) => n.id === id);
	if (!note) return undefined;
	return {
		entry: {
			id: note.id,
			name: note.title,
			type: "note",
			preview: note.content.slice(0, 100),
			createdAt: new Date(note.createdAt).getTime(),
			updatedAt: new Date(note.updatedAt).getTime(),
		},
		body: note.content,
	};
}

// ----------------------------------------------------------------------------
// Journal — helpers
// ----------------------------------------------------------------------------

function getJournalFiles(): FileEntry[] {
	const { currentEntry } = useJournalStore.getState();
	if (!currentEntry) return [];
	return [{
		id: currentEntry.id,
		name: `Journal — ${currentEntry.date}`,
		type: "journal_entry",
		preview: currentEntry.content.slice(0, 100),
		createdAt: new Date(currentEntry.createdAt).getTime(),
		updatedAt: new Date(currentEntry.updatedAt).getTime(),
	}];
}

function getJournalFile(): FileContent | undefined {
	const { currentEntry } = useJournalStore.getState();
	if (!currentEntry) return undefined;
	return {
		entry: {
			id: currentEntry.id,
			name: `Journal — ${currentEntry.date}`,
			type: "journal_entry",
			preview: currentEntry.content.slice(0, 100),
			createdAt: new Date(currentEntry.createdAt).getTime(),
			updatedAt: new Date(currentEntry.updatedAt).getTime(),
		},
		body: currentEntry.content,
	};
}

// ----------------------------------------------------------------------------
// Focus (Timer) — getFile helper
// ----------------------------------------------------------------------------

function getTimerFile(id: string): FileContent | undefined {
	const files = getTimerFiles();
	const entry = files.find((f) => f.id === id);
	if (!entry) return undefined;
	return { entry, body: entry.preview };
}

// ----------------------------------------------------------------------------
// Register all apps
// ----------------------------------------------------------------------------

export function registerAllApps(): void {
	registerApp({
		id: "brain-dump",
		name: "Brain Dump",
		icon: icon(BrainIcon),
		defaultSize: sizeOf("brain-dump"),
		titlebarDotColor: "#F59E0B",
		getCurrentStatus: getBrainDumpStatus,
		listFiles: getBrainDumpFiles,
		getFile: getBrainDumpFile,
		menuBar: {
			menus: [{
				label: "File",
				items: [
					{
						label: "New Item",
						action: () => useWindowStore.getState().openWindow("brain-dump"),
						shortcut: "Ctrl+N",
					},
					separatorItem(),
					closeMenuItem(),
				],
			}],
		},
		quickActions: [{
			label: "New Capture",
			icon: "+",
			action: () => useWindowStore.getState().openWindow("brain-dump"),
		}],
		triggers: [
			{
				eventType: "item_created",
				label: "Item Created",
				schema: { id: "string", content: "string", source: "string" },
			},
			{
				eventType: "item_processed",
				label: "Item Processed",
				schema: { id: "string", action: "string" },
			},
		],
		actions: [
			{
				actionId: "create_item",
				label: "Create Item",
				schema: { content: "string" },
				execute(input) {
					const label = input.label ?? input.blockType ?? "";
					const content = input.content
						? String(input.content)
						: `Completed focus session: ${String(label)}`;
					useInboxStore.getState().add(content);
				},
			},
		],
	});

	registerApp({
		id: "focus",
		name: "Focus",
		icon: icon(TargetIcon),
		defaultSize: sizeOf("focus"),
		titlebarDotColor: "#2DD4A8",
		getCurrentStatus: getTimerStatus,
		listFiles: getTimerFiles,
		getFile: getTimerFile,
		menuBar: fileMenuOnly(),
		triggers: [
			{
				eventType: "session_started",
				label: "Session Started",
				busAppId: "timer",
				schema: { sessionId: "string", blockType: "string", targetMs: "number" },
			},
			{
				eventType: "session_completed",
				label: "Session Completed",
				busAppId: "timer",
				schema: { blockId: "string", blockType: "string", elapsedMs: "number" },
			},
		],
	});

	registerApp({
		id: "tasks",
		name: "Tasks",
		icon: icon(CheckIcon),
		defaultSize: sizeOf("tasks"),
		titlebarDotColor: "#6B95F0",
		getCurrentStatus: getTasksStatus,
		listFiles: getTaskFiles,
		getFile: getTaskFile,
		menuBar: {
			menus: [
				{
					label: "File",
					items: [
						{
							label: "New Task",
							action: () => { useTaskStore.getState().add("Untitled task"); },
							shortcut: "Ctrl+N",
						},
						separatorItem(),
						closeMenuItem(),
					],
				},
				{
					label: "Edit",
					items: [{
						label: "Select All",
						action: () => {},
						shortcut: "Ctrl+A",
					}],
				},
			],
		},
		quickActions: [{
			label: "New Task",
			icon: "+",
			action: () => { useTaskStore.getState().add("Untitled task"); },
		}],
		triggers: [
			{
				eventType: "task_created",
				label: "Task Created",
				schema: { id: "string", title: "string" },
			},
			{
				eventType: "task_completed",
				label: "Task Completed",
				schema: { id: "string", title: "string" },
			},
		],
		actions: [
			{
				actionId: "create_task",
				label: "Create Task",
				schema: { title: "string" },
				execute(input) {
					const title = String(input.title ?? input.content ?? "Pipe task");
					useTaskStore.getState().add(title);
				},
			},
		],
	});

	registerApp({
		id: "habits",
		name: "Habits",
		icon: icon(RepeatIcon),
		defaultSize: sizeOf("habits"),
		titlebarDotColor: "#5EEAD4",
		getCurrentStatus: getHabitsStatus,
		listFiles: getHabitFiles,
		getFile: getHabitFile,
		menuBar: {
			menus: [{
				label: "File",
				items: [
					{
						label: "New Habit",
						action: () => useWindowStore.getState().openWindow("habits"),
						shortcut: "Ctrl+N",
					},
					separatorItem(),
					closeMenuItem(),
				],
			}],
		},
		quickActions: [{
			label: "New Habit",
			icon: "+",
			action: () => useWindowStore.getState().openWindow("habits"),
		}],
	});

	registerApp({
		id: "notes",
		name: "Notes",
		icon: icon(NotesIcon),
		defaultSize: sizeOf("notes"),
		titlebarDotColor: "#93B4F6",
		getCurrentStatus: () => null,
		listFiles: getNotesFiles,
		getFile: getNotesFile,
		menuBar: {
			menus: [
				{
					label: "File",
					items: [
						{
							label: "New Note",
							action: () => { useNotesStore.getState().create(); },
							shortcut: "Ctrl+N",
						},
						separatorItem(),
						{
							label: "Open File",
							action: async () => {
								const result = await openFile();
								if (!result) return;
								const name = result.name.replace(/\.(md|txt)$/, "");
								await useNotesStore.getState().create({ title: name, content: result.content });
							},
							shortcut: "Ctrl+O",
						},
						{
							label: "Save As",
							action: async () => {
								const { saveToFile } = await import("@/src/lib/file-system");
								const store = useNotesStore.getState();
								const note = store.notes.find((n) => n.id === store.activeNoteId);
								if (!note) return;
								await saveToFile(note.content, `${note.title || "Untitled"}.md`);
							},
							shortcut: "Ctrl+Shift+S",
						},
						separatorItem(),
						closeMenuItem(),
					],
				},
				{
					label: "Edit",
					items: [{
						label: "Select All",
						action: () => {},
						shortcut: "Ctrl+A",
					}],
				},
			],
		},
		quickActions: [{
			label: "New Note",
			icon: "+",
			action: () => { useNotesStore.getState().create(); },
		}],
	});

	registerApp({
		id: "journal",
		name: "Journal",
		icon: icon(JournalIcon),
		defaultSize: sizeOf("journal"),
		titlebarDotColor: "#F59E0B",
		getCurrentStatus: () => null,
		listFiles: getJournalFiles,
		getFile: () => getJournalFile(),
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "terminal",
		name: "Terminal",
		icon: icon(TerminalIcon),
		defaultSize: sizeOf("terminal"),
		titlebarDotColor: "rgba(255,255,255,0.4)",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "music",
		name: "Music",
		icon: icon(MusicIcon),
		defaultSize: sizeOf("music"),
		titlebarDotColor: "#2DD4A8",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "settings",
		name: "Settings",
		icon: icon(SettingsIcon),
		defaultSize: sizeOf("settings"),
		titlebarDotColor: "rgba(255,255,255,0.4)",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "calculator",
		name: "Calculator",
		icon: icon(ZapIcon),
		defaultSize: sizeOf("calculator"),
		titlebarDotColor: "rgba(255,255,255,0.4)",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "clock",
		name: "Clock",
		icon: icon(GlobeIcon),
		defaultSize: sizeOf("clock"),
		titlebarDotColor: "rgba(255,255,255,0.4)",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "about-place",
		name: "About place.org",
		icon: icon(InfoIcon),
		defaultSize: sizeOf("about-place"),
		titlebarDotColor: "rgba(255,255,255,0.4)",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "about-trajan",
		name: "About Trajan",
		icon: icon(UserIcon),
		defaultSize: sizeOf("about-trajan"),
		titlebarDotColor: "rgba(255,255,255,0.4)",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "calendar",
		name: "Calendar",
		icon: icon(HomeIcon),
		defaultSize: sizeOf("calendar"),
		titlebarDotColor: "rgba(255,255,255,0.4)",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "system-monitor",
		name: "System Monitor",
		icon: icon(MonitorIcon),
		defaultSize: sizeOf("system-monitor"),
		titlebarDotColor: "#A78BFA",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "finder",
		name: "Finder",
		icon: icon(FinderIcon),
		defaultSize: sizeOf("finder"),
		titlebarDotColor: "#6B95F0",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "photos",
		name: "Photos",
		icon: icon(PhotosIcon),
		defaultSize: sizeOf("photos"),
		titlebarDotColor: "#E879F9",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "pipes",
		name: "Pipes",
		icon: icon(PipesIcon),
		defaultSize: sizeOf("pipes"),
		titlebarDotColor: "#A78BFA",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "documents",
		name: "Documents",
		icon: icon(DocumentIcon),
		defaultSize: sizeOf("documents"),
		titlebarDotColor: "#60A5FA",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "canvas",
		name: "Canvas",
		icon: icon(CanvasIcon),
		defaultSize: sizeOf("canvas"),
		titlebarDotColor: "#4A90D9",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: {
			menus: [
				{
					label: "File",
					items: [
						{
							label: "Export PNG",
							action: async () => {
								const { renderToPNG } = await import(
									"@/src/components/apps/canvas/CanvasRenderer"
								);
								const { useCanvasStore } = await import(
									"@/src/stores/canvas-store"
								);
								const blob = await renderToPNG(
									useCanvasStore.getState().elements,
								);
								if (!blob) return;
								const url = URL.createObjectURL(blob);
								const a = document.createElement("a");
								a.href = url;
								a.download = "canvas-export.png";
								a.click();
								URL.revokeObjectURL(url);
							},
							shortcut: "Ctrl+Shift+E",
						},
						separatorItem(),
						closeMenuItem(),
					],
				},
				{
					label: "Edit",
					items: [
						{
							label: "Undo",
							action: async () => {
								const { useCanvasStore } = await import(
									"@/src/stores/canvas-store"
								);
								useCanvasStore.getState().undo();
							},
							shortcut: "Ctrl+Z",
						},
						{
							label: "Redo",
							action: async () => {
								const { useCanvasStore } = await import(
									"@/src/stores/canvas-store"
								);
								useCanvasStore.getState().redo();
							},
							shortcut: "Ctrl+Shift+Z",
						},
					],
				},
			],
		},
	});

	registerApp({
		id: "rss",
		name: "RSS Reader",
		icon: icon(RssIcon),
		defaultSize: sizeOf("rss"),
		titlebarDotColor: "#F97316",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "projects",
		name: "Projects",
		icon: icon(CheckIcon),
		defaultSize: sizeOf("projects"),
		titlebarDotColor: "#8ab4ff",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "responsibilities",
		name: "Responsibilities",
		icon: icon(TargetIcon),
		defaultSize: sizeOf("responsibilities"),
		titlebarDotColor: "#f6a5c0",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "ideas",
		name: "Ideas",
		icon: icon(ZapIcon),
		defaultSize: sizeOf("ideas"),
		titlebarDotColor: "#ffcf73",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "loops",
		name: "Loops",
		icon: icon(RepeatIcon),
		defaultSize: sizeOf("loops"),
		titlebarDotColor: "#8ab4ff",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "stuck",
		name: "Stuck",
		icon: icon(BrainIcon),
		defaultSize: sizeOf("stuck"),
		titlebarDotColor: "#f59e0b",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "avoiding",
		name: "Avoiding",
		icon: icon(BrainIcon),
		defaultSize: sizeOf("avoiding"),
		titlebarDotColor: "#ef4444",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "decisions",
		name: "Decisions",
		icon: icon(CheckIcon),
		defaultSize: sizeOf("decisions"),
		titlebarDotColor: "#c6a5f6",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "learning",
		name: "Learning",
		icon: icon(InfoIcon),
		defaultSize: sizeOf("learning"),
		titlebarDotColor: "#9de0b5",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "questions",
		name: "Questions",
		icon: icon(InfoIcon),
		defaultSize: sizeOf("questions"),
		titlebarDotColor: "#73cfff",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "contacts",
		name: "Contacts",
		icon: icon(UserIcon),
		defaultSize: sizeOf("contacts"),
		titlebarDotColor: "#f6a5c0",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "plate",
		name: "The Plate",
		icon: icon(TargetIcon),
		defaultSize: sizeOf("plate"),
		titlebarDotColor: "#8ab4ff",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "rewind",
		name: "Rewind",
		icon: icon(RepeatIcon),
		defaultSize: sizeOf("rewind"),
		titlebarDotColor: "#9de0b5",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "atlas",
		name: "Atlas",
		icon: icon(GlobeIcon),
		defaultSize: sizeOf("atlas"),
		titlebarDotColor: "#7cc4ff",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "blueprint",
		name: "Blueprint",
		icon: icon(DocumentIcon),
		defaultSize: sizeOf("blueprint"),
		titlebarDotColor: "#7cc4ff",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	// ----------------------------------------------------------------------------
	// EMA additions — daemon-bound surfaces layered onto the place.org base.
	// Stub components live under `src/components/apps/{hq,git-ema,agent-work,
	// launchpad,wiki}/`; full surfaces wire in Wave II (decentralized identity).
	// ----------------------------------------------------------------------------

	registerApp({
		id: "hq",
		name: "HQ",
		icon: icon(ChartIcon),
		defaultSize: sizeOf("hq"),
		titlebarDotColor: "#8b5cf6",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "cockpit",
		name: "Cockpit",
		icon: icon(CheckIcon),
		defaultSize: sizeOf("cockpit"),
		titlebarDotColor: "#5b8def",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	// `cwt` is retained as a backward-compatibility alias so that
	// `?vapp=cwt` deep-links keep resolving. It renders the same
	// `CockpitApp` component as `cockpit`. See `AppContent.tsx` for the
	// dispatch mapping and `url-nav.ts` for the URL alias.
	registerApp({
		id: "cwt",
		name: "Current Work",
		icon: icon(CheckIcon),
		defaultSize: sizeOf("cwt"),
		titlebarDotColor: "#5b8def",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "clients",
		name: "Clients",
		icon: icon(UserIcon),
		defaultSize: sizeOf("clients"),
		titlebarDotColor: "#9de0b5",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "git-ema",
		name: "git-ema",
		icon: icon(FolderIcon),
		defaultSize: sizeOf("git-ema"),
		titlebarDotColor: "#ec4899",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "agent-work",
		name: "Agent Work",
		icon: icon(TargetIcon),
		defaultSize: sizeOf("agent-work"),
		titlebarDotColor: "#10b981",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "chronicle",
		name: "Chronicle",
		icon: icon(ZapIcon),
		defaultSize: sizeOf("chronicle"),
		titlebarDotColor: "#38bdf8",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "launchpad",
		name: "Launchpad",
		icon: icon(HomeIcon),
		defaultSize: sizeOf("launchpad"),
		titlebarDotColor: "#f59e0b",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "wiki",
		name: "Wiki",
		icon: icon(NotesIcon),
		defaultSize: sizeOf("wiki"),
		titlebarDotColor: "#6b95f0",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "threads",
		name: "Threads",
		icon: icon(BrainIcon),
		defaultSize: sizeOf("threads"),
		titlebarDotColor: "#a78bfa",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	registerApp({
		id: "place-tools",
		name: "Place Tools",
		icon: icon(FolderIcon),
		defaultSize: sizeOf("place-tools"),
		titlebarDotColor: "#7cc4ff",
		getCurrentStatus: () => null,
		listFiles: () => [],
		menuBar: fileMenuOnly(),
	});

	// ----------------------------------------------------------------------------
	// Group + dock-order assignment (post-pass).
	//
	// EMA's canonical vApps render primary in dock + Launchpad. The Place Tools
	// folder icon sits at the dock end and opens a window with the 32 grouped
	// place.org personal-productivity apps. Run after all registerApp() calls so
	// we can mutate via re-register (Map.set overwrites by id).
	// ----------------------------------------------------------------------------

	const EMA_DOCK_ORDER = Object.fromEntries(
		EMA_VAPP_IDS.map((id, index) => [id, index + 1]),
	) as Record<(typeof EMA_VAPP_IDS)[number], number>;

	for (const [id, dockOrder] of Object.entries(EMA_DOCK_ORDER)) {
		const existing = getApp(id);
		if (!existing) continue;
		registerApp({ ...existing, group: "ema", dockOrder });
	}

	const placeToolGroup: AppGroup = "place-tools";
	for (const id of PLACE_TOOL_APP_IDS) {
		const existing = getApp(id);
		if (!existing) continue;
		registerApp({ ...existing, group: placeToolGroup });
	}
}
