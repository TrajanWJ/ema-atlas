import { create } from 'zustand';
import { userKey } from '@/src/lib/user-storage';
import { DEFAULT_SETTINGS } from '@/src/lib/settings-defaults';
import { migrateSettings } from '@/src/lib/settings-migration';
import type { AppSettings, SettingsState } from '@/src/types/settings';

// ---------------------------------------------------------------------------
// Re-export types for backward compatibility
// ---------------------------------------------------------------------------

export type { SettingsState, SettingsKey, AppSettings } from '@/src/types/settings';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'place-settings';

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function loadSettings(): SettingsState {
	if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
	try {
		const raw = localStorage.getItem(userKey(STORAGE_KEY));
		if (!raw) return { ...DEFAULT_SETTINGS };
		const parsed: unknown = JSON.parse(raw);
		return migrateSettings(parsed);
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

function serializeSettings(state: SettingsState): string {
	return JSON.stringify(state);
}

function saveSettings(settings: SettingsState): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(userKey(STORAGE_KEY), serializeSettings(settings));
	} catch {
		// Storage quota exceeded or unavailable — fail silently
	}
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

interface SettingsActions {
	setSetting<K extends keyof SettingsState>(key: K, value: SettingsState[K]): void;
	setAppSetting<
		App extends keyof AppSettings,
		K extends keyof AppSettings[App],
	>(appId: App, key: K, value: AppSettings[App][K]): void;
	resetSettings(): void;
	rehydrate(): void;
}

type SettingsStore = SettingsState & SettingsActions;

// ---------------------------------------------------------------------------
// Debounce handle (module-level, not per-instance)
// ---------------------------------------------------------------------------

let saveTimer: ReturnType<typeof setTimeout> | undefined;

function debouncedSave(settings: SettingsState): void {
	if (saveTimer !== undefined) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => {
		saveSettings(settings);
		saveTimer = undefined;
	}, 100);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsStore>((set, get) => ({
	...loadSettings(),

	setSetting(key, value) {
		set({ [key]: value } as Partial<SettingsState>);
		debouncedSave({ ...get(), [key]: value });
	},

	setAppSetting(appId, key, value) {
		const current = get();
		const updatedApp: AppSettings = {
			...current.app,
			[appId]: {
				...current.app[appId],
				[key]: value,
			},
		};
		set({ app: updatedApp });
		debouncedSave({ ...current, app: updatedApp });
	},

	resetSettings() {
		const defaults = { ...DEFAULT_SETTINGS };
		saveSettings(defaults);
		set(defaults);
	},

	rehydrate() {
		set(loadSettings());
	},
}));
