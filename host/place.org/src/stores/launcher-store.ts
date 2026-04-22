import { create } from "zustand";
import { userKey } from "@/src/lib/user-storage";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

const STORAGE_BASE = "place-launcher-favorites";

const DEFAULT_FAVORITES = [
	"brain-dump",
	"tasks",
	"notes",
	"focus",
] as const;

interface LauncherState {
	readonly isOpen: boolean;
	readonly favorites: readonly string[];
}

interface LauncherActions {
	open(): void;
	close(): void;
	toggle(): void;
	addFavorite(appId: string): void;
	removeFavorite(appId: string): void;
	rehydrate(): void;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function loadFavorites(): readonly string[] {
	if (typeof window === "undefined") return DEFAULT_FAVORITES;
	try {
		const raw = localStorage.getItem(userKey(STORAGE_BASE));
		if (!raw) return DEFAULT_FAVORITES;
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return DEFAULT_FAVORITES;
		return parsed.filter((v): v is string => typeof v === "string");
	} catch {
		return DEFAULT_FAVORITES;
	}
}

function persistFavorites(favorites: readonly string[]): void {
	try {
		localStorage.setItem(userKey(STORAGE_BASE), JSON.stringify(favorites));
	} catch {
		// Storage full or unavailable — silently ignore
	}
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useLauncherStore = create<LauncherState & LauncherActions>(
	(set) => ({
		isOpen: false,
		favorites: loadFavorites(),

		open() {
			set({ isOpen: true });
		},

		close() {
			set({ isOpen: false });
		},

		toggle() {
			set((s) => ({ isOpen: !s.isOpen }));
		},

		addFavorite(appId: string) {
			set((s) => {
				if (s.favorites.includes(appId)) return s;
				const next = [...s.favorites, appId];
				persistFavorites(next);
				return { favorites: next };
			});
		},

		removeFavorite(appId: string) {
			set((s) => {
				const next = s.favorites.filter((id) => id !== appId);
				persistFavorites(next);
				return { favorites: next };
			});
		},

		rehydrate() {
			set({ favorites: loadFavorites() });
		},
	}),
);
