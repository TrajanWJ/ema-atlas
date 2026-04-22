import { create } from "zustand";
import { createId } from "@/src/lib/id";
import { DEFAULT_WINDOW_SIZES } from "@/src/lib/constants";
import type { AppId, ProcessWindow, WindowPosition } from "@/src/types/window";
import {
	debouncedPersist,
	deserializeWindows,
	readPersistedState,
} from "./window-persistence";

// ----------------------------------------------------------------------------
// Smart placement — find a clear spot for the new window
// ----------------------------------------------------------------------------

const CASCADE_OFFSET = 40;
const VIEWPORT_PADDING = 12;
const TOP_BAR_HEIGHT = 40;
const DOCK_HEIGHT = 56;

/** Check whether a candidate position overlaps any existing window substantially */
function hasNearbyWindow(
	x: number,
	y: number,
	existing: readonly ProcessWindow[],
	threshold: number,
): boolean {
	return existing.some(
		(w) => Math.abs(w.position.x - x) < threshold && Math.abs(w.position.y - y) < threshold,
	);
}

function getViewportBounds() {
	const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
	const vh = typeof window !== 'undefined' ? window.innerHeight : 720;
	return { vw, vh };
}

function findSmartPosition(
	defaults: WindowPosition,
	existing: readonly ProcessWindow[],
): WindowPosition {
	const { vw, vh } = getViewportBounds();
	const maxX = vw - defaults.width - VIEWPORT_PADDING;
	const maxY = vh - defaults.height - DOCK_HEIGHT;

	// Include ALL existing windows (not just visible) to avoid stacking on
	// minimized/maximized windows that will be restored later.
	const allWindows = existing.filter((w) => !w.minimized);
	if (allWindows.length === 0) {
		// Center the first window instead of using the static default offset
		return {
			...defaults,
			x: Math.max(VIEWPORT_PADDING, Math.min(maxX, Math.floor((vw - defaults.width) / 2))),
			y: Math.max(TOP_BAR_HEIGHT + VIEWPORT_PADDING, Math.min(maxY, Math.floor((vh - defaults.height) / 2))),
		};
	}

	// Strategy 1: Cascade from last opened window
	const sorted = [...allWindows].sort((a, b) => b.zIndex - a.zIndex);
	const top = sorted[0];
	if (top) {
		let cx = top.position.x + CASCADE_OFFSET;
		let cy = top.position.y + CASCADE_OFFSET;

		// Keep cascading if we land on top of another window
		let attempts = 0;
		while (hasNearbyWindow(cx, cy, allWindows, 15) && attempts < 10) {
			cx += CASCADE_OFFSET;
			cy += CASCADE_OFFSET;
			attempts++;
		}

		// Wrap around if we've cascaded off-screen
		if (cx > maxX || cy > maxY) {
			cx = VIEWPORT_PADDING + ((allWindows.length * CASCADE_OFFSET) % Math.max(1, maxX - VIEWPORT_PADDING));
			cy = TOP_BAR_HEIGHT + VIEWPORT_PADDING + ((allWindows.length * CASCADE_OFFSET) % Math.max(1, maxY - TOP_BAR_HEIGHT - VIEWPORT_PADDING));
		}

		if (cx >= VIEWPORT_PADDING && cx <= maxX && cy >= TOP_BAR_HEIGHT && cy <= maxY) {
			return { ...defaults, x: cx, y: cy };
		}
	}

	// Strategy 2: Find a gap — try grid positions and pick the one with least overlap
	const candidates: Array<{ x: number; y: number; overlap: number }> = [];
	const stepX = Math.max(80, Math.floor(defaults.width / 2));
	const stepY = Math.max(60, Math.floor(defaults.height / 2));

	for (let x = VIEWPORT_PADDING; x <= maxX; x += stepX) {
		for (let y = TOP_BAR_HEIGHT + VIEWPORT_PADDING; y <= maxY; y += stepY) {
			let overlap = 0;
			for (const w of allWindows) {
				const ox = Math.max(0, Math.min(x + defaults.width, w.position.x + w.position.width) - Math.max(x, w.position.x));
				const oy = Math.max(0, Math.min(y + defaults.height, w.position.y + w.position.height) - Math.max(y, w.position.y));
				overlap += ox * oy;
			}
			candidates.push({ x, y, overlap });
		}
	}

	candidates.sort((a, b) => a.overlap - b.overlap);
	const best = candidates[0];
	if (best && best.overlap < defaults.width * defaults.height * 0.3) {
		return { ...defaults, x: best.x, y: best.y };
	}

	// Strategy 3: Fallback — center with small random offset
	const offsetX = Math.floor(Math.random() * 60) - 30;
	const offsetY = Math.floor(Math.random() * 40) - 20;
	return {
		...defaults,
		x: Math.max(VIEWPORT_PADDING, Math.min(maxX, Math.floor((vw - defaults.width) / 2) + offsetX)),
		y: Math.max(TOP_BAR_HEIGHT + VIEWPORT_PADDING, Math.min(maxY, Math.floor((vh - defaults.height) / 2) + offsetY)),
	};
}

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
	rehydrate(): void;
}

type WindowStore = WindowState & WindowActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Hydrate from localStorage (runs once at module load, client-only)
// ----------------------------------------------------------------------------

function hydrateInitialState(): WindowState {
	const persisted = readPersistedState();
	if (!persisted || persisted.length === 0) {
		return { windows: new Map(), zCounter: 10, activeWindowId: null };
	}
	const { windows, maxZIndex } = deserializeWindows(persisted);
	return { windows, zCounter: Math.max(maxZIndex, 10), activeWindowId: null };
}

const initialState = hydrateInitialState();

export const useWindowStore = create<WindowStore>((set, get) => ({
	windows: initialState.windows,
	zCounter: initialState.zCounter,
	activeWindowId: initialState.activeWindowId,

	openWindow(appId, position) {
		const id = createId();
		const defaults = DEFAULT_WINDOW_SIZES[appId];
		const existing = [...get().windows.values()];
		const smart = position
			? {
					x: position.x ?? defaults.x,
					y: position.y ?? defaults.y,
					width: position.width ?? defaults.width,
					height: position.height ?? defaults.height,
				}
			: findSmartPosition(defaults, existing);
		const resolvedPosition: WindowPosition = smart;
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
		// Skip update only when window is already focused, not minimized, AND
		// truly the top-most window. This avoids re-render storms from repeated
		// mousedowns while still fixing z-order when another window overlaps.
		if (get().activeWindowId === id && !existing.minimized) {
			const maxZ = Math.max(...[...get().windows.values()].map((w) => w.zIndex));
			if (existing.zIndex >= maxZ) return;
		}
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

	rehydrate() {
		const state = hydrateInitialState();
		set({
			windows: state.windows,
			zCounter: state.zCounter,
			activeWindowId: null,
		});
	},
}));

// ----------------------------------------------------------------------------
// Subscribe to state changes → debounced localStorage write
// ----------------------------------------------------------------------------

useWindowStore.subscribe((state, prev) => {
	if (state.windows !== prev.windows) {
		debouncedPersist(state.windows);
	}
});
