import { create } from "zustand";
import { createId } from "@/src/lib/id";
import { DEFAULT_WINDOW_SIZES } from "@/src/lib/constants";
import type { AppId, ProcessWindow, WindowPosition } from "@/src/types/window";

// ----------------------------------------------------------------------------
// State shape
// ----------------------------------------------------------------------------

interface WindowState {
	readonly windows: ReadonlyMap<string, ProcessWindow>;
	readonly zCounter: number;
	readonly activeWindowId: string | null;
}

interface WindowActions {
	openWindow(appId: AppId, position?: Partial<WindowPosition>): string;
	closeWindow(id: string): void;
	focusWindow(id: string): void;
	minimizeWindow(id: string): void;
	maximizeWindow(id: string): void;
	restoreWindow(id: string): void;
	moveWindow(id: string, x: number, y: number): void;
	resizeWindow(id: string, width: number, height: number): void;
	getWindowsByApp(appId: AppId): readonly ProcessWindow[];
}

type WindowStore = WindowState & WindowActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

export const useWindowStore = create<WindowStore>((set, get) => ({
	windows: new Map(),
	zCounter: 0,
	activeWindowId: null,

	openWindow(appId, position) {
		const id = createId();
		const defaults = DEFAULT_WINDOW_SIZES[appId];
		const resolvedPosition: WindowPosition = {
			x: position?.x ?? defaults.x,
			y: position?.y ?? defaults.y,
			width: position?.width ?? defaults.width,
			height: position?.height ?? defaults.height,
		};
		const zCounter = get().zCounter + 1;
		const window: ProcessWindow = {
			id,
			appId,
			position: resolvedPosition,
			zIndex: zCounter,
			minimized: false,
			maximized: false,
		};
		const windows = new Map(get().windows);
		windows.set(id, window);
		set({ windows, zCounter, activeWindowId: id });
		return id;
	},

	closeWindow(id) {
		const windows = new Map(get().windows);
		windows.delete(id);
		const activeWindowId = get().activeWindowId === id ? null : get().activeWindowId;
		set({ windows, activeWindowId });
	},

	focusWindow(id) {
		const existing = get().windows.get(id);
		if (!existing) return;
		const zCounter = get().zCounter + 1;
		const windows = new Map(get().windows);
		windows.set(id, {
			...existing,
			zIndex: zCounter,
			minimized: false,
		});
		set({ windows, zCounter, activeWindowId: id });
	},

	minimizeWindow(id) {
		const existing = get().windows.get(id);
		if (!existing) return;
		const windows = new Map(get().windows);
		windows.set(id, { ...existing, minimized: true });
		const activeWindowId = get().activeWindowId === id ? null : get().activeWindowId;
		set({ windows, activeWindowId });
	},

	maximizeWindow(id) {
		const existing = get().windows.get(id);
		if (!existing) return;
		const windows = new Map(get().windows);
		windows.set(id, { ...existing, maximized: !existing.maximized });
		set({ windows });
	},

	restoreWindow(id) {
		const existing = get().windows.get(id);
		if (!existing) return;
		const zCounter = get().zCounter + 1;
		const windows = new Map(get().windows);
		windows.set(id, {
			...existing,
			minimized: false,
			maximized: false,
			zIndex: zCounter,
		});
		set({ windows, zCounter, activeWindowId: id });
	},

	moveWindow(id, x, y) {
		const existing = get().windows.get(id);
		if (!existing) return;
		const windows = new Map(get().windows);
		windows.set(id, {
			...existing,
			position: { ...existing.position, x, y },
		});
		set({ windows });
	},

	resizeWindow(id, width, height) {
		const existing = get().windows.get(id);
		if (!existing) return;
		const windows = new Map(get().windows);
		windows.set(id, {
			...existing,
			position: { ...existing.position, width, height },
		});
		set({ windows });
	},

	getWindowsByApp(appId) {
		return [...get().windows.values()].filter((w) => w.appId === appId);
	},
}));
