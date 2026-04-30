import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemeConfig {
	readonly id: string;
	readonly name: string;
	readonly tokens: Record<string, string>;
	readonly updatedAt: number;
}

interface ThemeState {
	adminTheme: ThemeConfig | null;
	sessionOverrides: Record<string, string>;
}

interface ThemeActions {
	getComputedTheme(): Record<string, string>;
	setSessionOverride(key: string, value: string): void;
	clearSessionOverrides(): void;
	applyTheme(): void;
	loadAdminTheme(): Promise<void>;
}

type ThemeStore = ThemeState & ThemeActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mergeTokens(
	admin: Record<string, string> | undefined,
	overrides: Record<string, string>,
): Record<string, string> {
	return { ...admin, ...overrides };
}

function applyToRoot(tokens: Record<string, string>): void {
	const root = document.documentElement;
	for (const [key, value] of Object.entries(tokens)) {
		root.style.setProperty(key, value);
	}
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useThemeStore = create<ThemeStore>((set, get) => ({
	adminTheme: null,
	sessionOverrides: {},

	getComputedTheme() {
		const { adminTheme, sessionOverrides } = get();
		return mergeTokens(adminTheme?.tokens, sessionOverrides);
	},

	setSessionOverride(key, value) {
		set((state) => ({
			sessionOverrides: { ...state.sessionOverrides, [key]: value },
		}));
	},

	clearSessionOverrides() {
		set({ sessionOverrides: {} });
	},

	applyTheme() {
		const tokens = get().getComputedTheme();
		applyToRoot(tokens);
	},

	async loadAdminTheme() {
		try {
			const res = await fetch('/api/theme');
			const data: unknown = await res.json();
			if (
				data !== null &&
				typeof data === 'object' &&
				'status' in data &&
				(data as Record<string, unknown>).status === 'not_implemented'
			) {
				// API not ready yet — leave adminTheme as null
				return;
			}
			set({ adminTheme: data as ThemeConfig });
		} catch {
			// Network error or bad response — silently ignore
		}
	},
}));
