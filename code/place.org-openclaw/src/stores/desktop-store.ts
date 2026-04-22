import { create } from "zustand";
import { userKey } from "@/src/lib/user-storage";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type BootPhase = "loading" | "booting" | "ready";

type TimeOfDay =
	| "night"
	| "dawn"
	| "morning"
	| "midday"
	| "afternoon"
	| "sunset"
	| "evening";

// ----------------------------------------------------------------------------
// Helper
// ----------------------------------------------------------------------------

export function getTimeOfDay(hour: number): TimeOfDay {
	if (hour < 5) return "night";
	if (hour < 7) return "dawn";
	if (hour < 12) return "morning";
	if (hour < 14) return "midday";
	if (hour < 17) return "afternoon";
	if (hour < 19) return "sunset";
	return "evening";
}

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface DesktopState {
	readonly bootPhase: BootPhase;
	readonly dbReady: boolean;
	readonly timeOfDay: TimeOfDay;
	readonly inboxCount: number;
	readonly focusTimeToday: number;
	readonly oneThing: string;
	readonly commandPaletteOpen: boolean;
	readonly shortcutHelpOpen: boolean;
	readonly quickCaptureOpen: boolean;
	readonly telescopeOpen: boolean;
	readonly dockAutohideEnabled: boolean;
}

interface DesktopActions {
	setBootPhase(phase: BootPhase): void;
	setDbReady(ready: boolean): void;
	setTimeOfDay(timeOfDay: TimeOfDay): void;
	setInboxCount(count: number): void;
	setFocusTimeToday(ms: number): void;
	setOneThing(text: string): void;
	toggleCommandPalette(): void;
	openCommandPalette(): void;
	closeCommandPalette(): void;
	toggleShortcutHelp(): void;
	openShortcutHelp(): void;
	closeShortcutHelp(): void;
	toggleQuickCapture(): void;
	openQuickCapture(): void;
	closeQuickCapture(): void;
	toggleTelescope(): void;
	openTelescope(): void;
	closeTelescope(): void;
	setDockAutohideEnabled(enabled: boolean): void;
}

type DesktopStore = DesktopState & DesktopActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useDesktopStore = create<DesktopStore>((set) => ({
	bootPhase: "loading",
	dbReady: false,
	timeOfDay: getTimeOfDay(new Date().getHours()),
	inboxCount: 0,
	focusTimeToday: 0,
	oneThing: "",
	commandPaletteOpen: false,
	shortcutHelpOpen: false,
	quickCaptureOpen: false,
	telescopeOpen: false,
	dockAutohideEnabled: typeof window !== 'undefined'
		? (() => {
			try {
				const raw = localStorage.getItem(userKey('place-settings'));
				if (raw) {
					const parsed: unknown = JSON.parse(raw);
					if (typeof parsed === 'object' && parsed !== null && 'dockAutoHide' in parsed) {
						return Boolean((parsed as Record<string, unknown>).dockAutoHide);
					}
				}
			} catch { /* ignore */ }
			return localStorage.getItem(userKey('place-dock-autohide')) !== 'false';
		})()
		: false,

	setBootPhase(phase) {
		set({ bootPhase: phase });
	},

	setDbReady(ready) {
		set({ dbReady: ready });
	},

	setTimeOfDay(timeOfDay) {
		set({ timeOfDay });
	},

	setInboxCount(count) {
		set({ inboxCount: count });
	},

	setFocusTimeToday(ms) {
		set({ focusTimeToday: ms });
	},

	setOneThing(text) {
		set({ oneThing: text });
	},

	toggleCommandPalette() {
		set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen }));
	},

	openCommandPalette() {
		set({ commandPaletteOpen: true });
	},

	closeCommandPalette() {
		set({ commandPaletteOpen: false });
	},

	toggleShortcutHelp() {
		set((s) => ({ shortcutHelpOpen: !s.shortcutHelpOpen }));
	},

	openShortcutHelp() {
		set({ shortcutHelpOpen: true });
	},

	closeShortcutHelp() {
		set({ shortcutHelpOpen: false });
	},

	toggleQuickCapture() {
		set((s) => ({ quickCaptureOpen: !s.quickCaptureOpen }));
	},

	openQuickCapture() {
		set({ quickCaptureOpen: true });
	},

	closeQuickCapture() {
		set({ quickCaptureOpen: false });
	},

	toggleTelescope() {
		set((s) => ({ telescopeOpen: !s.telescopeOpen }));
	},

	openTelescope() {
		set({ telescopeOpen: true });
	},

	closeTelescope() {
		set({ telescopeOpen: false });
	},

	setDockAutohideEnabled(enabled) {
		localStorage.setItem(userKey('place-dock-autohide'), String(enabled));
		set({ dockAutohideEnabled: enabled });
	},
}));
