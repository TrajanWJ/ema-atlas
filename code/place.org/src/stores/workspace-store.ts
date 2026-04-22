import { create } from "zustand";
import { createId } from "@/src/lib/id";
import { userKey } from "@/src/lib/user-storage";
import { useWindowStore } from "./window-store";
import type { AppId } from "@/src/types/window";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface WorkspaceWindowSnapshot {
	readonly appId: AppId;
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
	readonly minimized: boolean;
	readonly maximized: boolean;
}

export interface WorkspaceLayout {
	readonly id: string;
	readonly name: string;
	readonly createdAt: number;
	readonly windows: readonly WorkspaceWindowSnapshot[];
}

interface WorkspaceState {
	readonly layouts: readonly WorkspaceLayout[];
}

interface WorkspaceActions {
	save(name: string): { ok: true } | { ok: false; reason: string };
	load(id: string): void;
	remove(id: string): void;
	rename(id: string, name: string): void;
	rehydrate(): void;
}

type WorkspaceStore = WorkspaceState & WorkspaceActions;

// ----------------------------------------------------------------------------
// localStorage persistence
// ----------------------------------------------------------------------------

const STORAGE_BASE = "place_workspaces";
const MAX_LAYOUTS = 20;

function readLayouts(): readonly WorkspaceLayout[] {
	try {
		if (typeof window === "undefined") return [];
		const raw = localStorage.getItem(userKey(STORAGE_BASE));
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed as readonly WorkspaceLayout[];
	} catch {
		return [];
	}
}

function writeLayouts(layouts: readonly WorkspaceLayout[]): void {
	try {
		if (typeof window === "undefined") return;
		localStorage.setItem(userKey(STORAGE_BASE), JSON.stringify(layouts));
	} catch {
		// localStorage full or unavailable — degrade silently
	}
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
	layouts: readLayouts(),

	save(name) {
		const { layouts } = get();
		if (layouts.length >= MAX_LAYOUTS) {
			return {
				ok: false,
				reason: `Maximum of ${MAX_LAYOUTS} workspaces reached. Delete one first.`,
			};
		}

		const windowMap = useWindowStore.getState().windows;
		const snapshots: WorkspaceWindowSnapshot[] = [];
		for (const w of windowMap.values()) {
			snapshots.push({
				appId: w.appId,
				x: w.position.x,
				y: w.position.y,
				width: w.position.width,
				height: w.position.height,
				minimized: w.minimized,
				maximized: w.maximized,
			});
		}

		const layout: WorkspaceLayout = {
			id: createId(),
			name: name.trim() || "Untitled",
			createdAt: Date.now(),
			windows: snapshots,
		};

		const next = [...layouts, layout];
		set({ layouts: next });
		writeLayouts(next);
		return { ok: true };
	},

	load(id) {
		const layout = get().layouts.find((l) => l.id === id);
		if (!layout) return;

		const ws = useWindowStore.getState();
		// Close all current windows
		for (const wId of ws.windows.keys()) {
			ws.closeWindow(wId);
		}
		// Open each from the layout snapshot
		for (const snap of layout.windows) {
			const windowId = ws.openWindow(snap.appId, {
				x: snap.x,
				y: snap.y,
				width: snap.width,
				height: snap.height,
			});
			// Apply minimized/maximized state after opening
			if (snap.minimized) ws.minimizeWindow(windowId);
			if (snap.maximized) ws.maximizeWindow(windowId);
		}
	},

	remove(id) {
		const next = get().layouts.filter((l) => l.id !== id);
		set({ layouts: next });
		writeLayouts(next);
	},

	rename(id, name) {
		const next = get().layouts.map((l) =>
			l.id === id ? { ...l, name: name.trim() || l.name } : l,
		);
		set({ layouts: next });
		writeLayouts(next);
	},

	rehydrate() {
		set({ layouts: readLayouts() });
	},
}));
