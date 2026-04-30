import { create } from "zustand";
import { userKey } from "@/src/lib/user-storage";
import type { AppId } from "@/src/types/window";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const STORAGE_BASE = "place-dock-pinned";

const DEFAULT_PINNED: readonly AppId[] = [
	"brain-dump",
	"focus",
	"journal",
	"tasks",
] as const;

// ----------------------------------------------------------------------------
// Persistence helpers
// ----------------------------------------------------------------------------

function readPinned(): AppId[] {
	if (typeof window === "undefined") return [...DEFAULT_PINNED];
	try {
		const raw = localStorage.getItem(userKey(STORAGE_BASE));
		if (!raw) return [...DEFAULT_PINNED];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [...DEFAULT_PINNED];
		return parsed.filter((v): v is AppId => typeof v === "string");
	} catch {
		return [...DEFAULT_PINNED];
	}
}

function writePinned(ids: readonly AppId[]): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(userKey(STORAGE_BASE), JSON.stringify(ids));
	} catch {
		// quota exceeded — silently ignore
	}
}

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface DockState {
	readonly pinnedAppIds: AppId[];
}

interface DockActions {
	pin(appId: AppId): void;
	unpin(appId: AppId): void;
	reorder(appIds: AppId[]): void;
	rehydrate(): void;
}

type DockStore = DockState & DockActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useDockStore = create<DockStore>((set, get) => ({
	pinnedAppIds: readPinned(),

	pin(appId) {
		const current = get().pinnedAppIds;
		if (current.includes(appId)) return;
		const next = [...current, appId];
		set({ pinnedAppIds: next });
		writePinned(next);
	},

	unpin(appId) {
		const next = get().pinnedAppIds.filter((id) => id !== appId);
		set({ pinnedAppIds: next });
		writePinned(next);
	},

	reorder(appIds) {
		set({ pinnedAppIds: appIds });
		writePinned(appIds);
	},

	rehydrate() {
		set({ pinnedAppIds: readPinned() });
	},
}));
