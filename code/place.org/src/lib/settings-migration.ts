import type { SettingsState } from '@/src/types/settings';
import { DEFAULT_SETTINGS } from '@/src/lib/settings-defaults';
import { userKey } from '@/src/lib/user-storage';

export const SETTINGS_VERSION = 2;

// ---------------------------------------------------------------------------
// V1 shape detection
// ---------------------------------------------------------------------------

// Old v1 shape had `accentColor` as the primary brand color and a string-enum
// `fontSize` ('small' | 'medium' | 'large'). New v2 renamed `accentColor` to
// `primaryColor` and added a separate `accentColor` for highlights, and
// changed `fontSize` to a number (px).

function isV1Shape(raw: Record<string, unknown>): boolean {
	return (
		'accentColor' in raw &&
		!('primaryColor' in raw) &&
		!('version' in raw)
	);
}

const FONT_SIZE_MAP: Record<string, number> = {
	small: 14,
	medium: 16,
	large: 18,
};

function migrateFontSize(value: unknown): number {
	if (typeof value === 'number') return value;
	if (typeof value === 'string' && value in FONT_SIZE_MAP) {
		return FONT_SIZE_MAP[value] ?? DEFAULT_SETTINGS.fontSize;
	}
	return DEFAULT_SETTINGS.fontSize;
}

function readSoundEnabledFromDesktopStore(): boolean | undefined {
	try {
		if (typeof window === 'undefined') return undefined;
		// Look for any localStorage key containing place-desktop
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key) continue;
			if (!key.includes('place-desktop')) continue;
			const raw = localStorage.getItem(key);
			if (!raw) continue;
			const parsed: unknown = JSON.parse(raw);
			if (typeof parsed !== 'object' || parsed === null) continue;
			const record = parsed as Record<string, unknown>;
			if ('soundEnabled' in record && typeof record.soundEnabled === 'boolean') {
				return record.soundEnabled;
			}
		}
	} catch {
		// ignore
	}
	return undefined;
}

// ---------------------------------------------------------------------------
// Main migration function
// ---------------------------------------------------------------------------

export function migrateSettings(raw: unknown): SettingsState {
	if (typeof raw !== 'object' || raw === null) {
		return { ...DEFAULT_SETTINGS };
	}

	const record = raw as Record<string, unknown>;

	if (isV1Shape(record)) {
		// Rename accentColor → primaryColor, assign new accentColor default
		const { accentColor, fontSize, ...rest } = record;

		const migrated: Partial<SettingsState> = {
			...rest as Partial<SettingsState>,
			primaryColor: typeof accentColor === 'string' ? accentColor : DEFAULT_SETTINGS.primaryColor,
			accentColor: DEFAULT_SETTINGS.accentColor,
			fontSize: migrateFontSize(fontSize),
		};

		const soundFromDesktop = readSoundEnabledFromDesktopStore();
		if (soundFromDesktop !== undefined) {
			migrated.soundEnabled = soundFromDesktop;
		}

		return { ...DEFAULT_SETTINGS, ...migrated };
	}

	// v2 or unknown future shape — just merge with defaults, migrate fontSize if
	// it somehow snuck in as a string
	const partial = record as Partial<SettingsState>;

	return {
		...DEFAULT_SETTINGS,
		...partial,
		fontSize: migrateFontSize(record.fontSize),
	};
}
