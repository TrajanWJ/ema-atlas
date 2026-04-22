import type { AppId, ProcessWindow } from "@/src/types/window";
import { DEFAULT_WINDOW_SIZES } from "@/src/lib/constants";
import { userKey } from "@/src/lib/user-storage";

// ----------------------------------------------------------------------------
// Persisted state shape
// ----------------------------------------------------------------------------

export interface PersistedWindowState {
	readonly windowId: string;
	readonly appId: AppId;
	readonly mode: "inline" | "popout";
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
	readonly zIndex: number;
	readonly minimized: boolean;
	readonly maximized: boolean;
	readonly screenX?: number;
	readonly screenY?: number;
}

const STORAGE_BASE = "place_window_state";
const DEBOUNCE_MS = 300;

// ----------------------------------------------------------------------------
// Valid AppId set — used to reject stale/phantom window data
// ----------------------------------------------------------------------------

const VALID_APP_IDS = new Set<string>(Object.keys(DEFAULT_WINDOW_SIZES));

function isValidAppId(value: string): value is AppId {
	return VALID_APP_IDS.has(value);
}

// ----------------------------------------------------------------------------
// Serialize: Map<string, ProcessWindow> → PersistedWindowState[]
// ----------------------------------------------------------------------------

export function serializeWindows(
	windows: ReadonlyMap<string, ProcessWindow>,
): readonly PersistedWindowState[] {
	// Preserve existing popout entries that are no longer in the Zustand store
	const existing = readPersistedState() ?? [];
	const popouts = existing.filter(
		(s) => s.mode === "popout" && !windows.has(s.windowId),
	);

	const result: PersistedWindowState[] = [...popouts];
	for (const w of windows.values()) {
		result.push({
			windowId: w.id,
			appId: w.appId,
			mode: "inline",
			x: w.position.x,
			y: w.position.y,
			width: w.position.width,
			height: w.position.height,
			zIndex: w.zIndex,
			minimized: w.minimized,
			maximized: w.maximized,
		});
	}
	return result;
}

// ----------------------------------------------------------------------------
// Deserialize: PersistedWindowState[] → Map<string, ProcessWindow>
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Viewport clamping — ensure restored windows are within current screen bounds
// ----------------------------------------------------------------------------

const CLAMP_PADDING = 12;
const CLAMP_TOP_BAR = 40;
const CLAMP_DOCK = 56;
const MIN_VISIBLE_PX = 100; // at least this many px of the window must be on-screen

function clampToViewport(
	x: number,
	y: number,
	width: number,
	height: number,
): { x: number; y: number; width: number; height: number } {
	if (typeof window === "undefined") return { x, y, width, height };

	const vw = window.innerWidth;
	const vh = window.innerHeight;

	// Clamp dimensions to viewport (shrink if window is larger than screen)
	const clampedW = Math.min(width, vw - CLAMP_PADDING * 2);
	const clampedH = Math.min(height, vh - CLAMP_TOP_BAR - CLAMP_DOCK);

	// Clamp position so the window is at least partially visible
	const maxX = vw - Math.min(MIN_VISIBLE_PX, clampedW);
	const maxY = vh - CLAMP_DOCK - Math.min(MIN_VISIBLE_PX, clampedH);
	const clampedX = Math.max(CLAMP_PADDING - clampedW + MIN_VISIBLE_PX, Math.min(maxX, x));
	const clampedY = Math.max(CLAMP_TOP_BAR, Math.min(maxY, y));

	return { x: clampedX, y: clampedY, width: clampedW, height: clampedH };
}

export function deserializeWindows(
	persisted: readonly PersistedWindowState[],
): { windows: Map<string, ProcessWindow>; maxZIndex: number } {
	const windows = new Map<string, ProcessWindow>();
	let maxZIndex = 0;

	for (const p of persisted) {
		if (!isValidAppId(p.appId)) continue;
		// Skip popout windows — they render in their own browser window
		if (p.mode === "popout") continue;

		const clamped = clampToViewport(p.x, p.y, p.width, p.height);

		const pw: ProcessWindow = {
			id: p.windowId,
			appId: p.appId,
			position: {
				x: clamped.x,
				y: clamped.y,
				width: clamped.width,
				height: clamped.height,
			},
			zIndex: p.zIndex,
			minimized: p.minimized,
			maximized: p.maximized,
		};
		windows.set(p.windowId, pw);
		if (p.zIndex > maxZIndex) maxZIndex = p.zIndex;
	}

	return { windows, maxZIndex };
}

// ----------------------------------------------------------------------------
// localStorage read / write (silent degradation)
// ----------------------------------------------------------------------------

export function readPersistedState(): readonly PersistedWindowState[] | null {
	try {
		if (typeof window === "undefined") return null;
		const raw = localStorage.getItem(userKey(STORAGE_BASE));
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return null;
		return parsed as readonly PersistedWindowState[];
	} catch {
		return null;
	}
}

export function writePersistedState(
	states: readonly PersistedWindowState[],
): void {
	try {
		if (typeof window === "undefined") return;
		localStorage.setItem(userKey(STORAGE_BASE), JSON.stringify(states));
	} catch {
		// localStorage full or unavailable — degrade silently
	}
}

// ----------------------------------------------------------------------------
// Debounced writer — call on every state change
// ----------------------------------------------------------------------------

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedPersist(
	windows: ReadonlyMap<string, ProcessWindow>,
): void {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		writePersistedState(serializeWindows(windows));
	}, DEBOUNCE_MS);
}
