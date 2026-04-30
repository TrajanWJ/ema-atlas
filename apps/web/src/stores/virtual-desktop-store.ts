import { create } from "zustand";
import { createId } from "@/src/lib/id";
import { userKey } from "@/src/lib/user-storage";
import { useWindowStore } from "./window-store";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface VirtualDesktop {
	readonly id: string;
	readonly name: string;
	readonly windowIds: string[];
}

interface VirtualDesktopState {
	readonly desktops: VirtualDesktop[];
	readonly activeDesktopId: string;
	readonly transitioning: boolean;
	readonly transitionDirection: "left" | "right" | null;
}

interface VirtualDesktopActions {
	switchTo(id: string): void;
	switchLeft(): void;
	switchRight(): void;
	addDesktop(): void;
	removeDesktop(id: string): void;
	renameDesktop(id: string, name: string): void;
	moveWindowToDesktop(windowId: string, desktopId: string): void;
	addWindowToActive(windowId: string): void;
	removeWindow(windowId: string): void;
	rehydrate(): void;
}

type VirtualDesktopStore = VirtualDesktopState & VirtualDesktopActions;

// ----------------------------------------------------------------------------
// Persistence
// ----------------------------------------------------------------------------

const STORAGE_BASE = "place-virtual-desktops";

interface PersistedData {
	desktops: VirtualDesktop[];
	activeDesktopId: string;
}

function persist(state: VirtualDesktopState): void {
	try {
		const data: PersistedData = {
			desktops: state.desktops,
			activeDesktopId: state.activeDesktopId,
		};
		localStorage.setItem(userKey(STORAGE_BASE), JSON.stringify(data));
	} catch {
		// localStorage full or unavailable — silently ignore
	}
}

function hydrateInitialState(): VirtualDesktopState {
	const defaultDesktop1: VirtualDesktop = {
		id: "desktop-1",
		name: "Desktop 1",
		windowIds: [],
	};
	const defaultDesktop2: VirtualDesktop = {
		id: "desktop-2",
		name: "Desktop 2",
		windowIds: [],
	};
	const defaults: VirtualDesktopState = {
		desktops: [defaultDesktop1, defaultDesktop2],
		activeDesktopId: "desktop-1",
		transitioning: false,
		transitionDirection: null,
	};

	if (typeof window === "undefined") return defaults;

	try {
		const raw = localStorage.getItem(userKey(STORAGE_BASE));
		if (!raw) return defaults;
		const data = JSON.parse(raw) as PersistedData;
		if (!Array.isArray(data.desktops) || data.desktops.length === 0) {
			return defaults;
		}
		return {
			desktops: data.desktops,
			activeDesktopId: data.activeDesktopId || data.desktops[0]?.id || defaults.activeDesktopId,
			transitioning: false,
			transitionDirection: null,
		};
	} catch {
		return defaults;
	}
}

// ----------------------------------------------------------------------------
// Transition helper
// ----------------------------------------------------------------------------

const TRANSITION_DURATION = 300;

function beginTransition(
	set: (partial: Partial<VirtualDesktopState>) => void,
	direction: "left" | "right",
	targetId: string,
): void {
	set({ transitioning: true, transitionDirection: direction });
	// After a short delay, switch the active desktop and end transition
	setTimeout(() => {
		set({
			activeDesktopId: targetId,
			transitioning: false,
			transitionDirection: null,
		});
	}, TRANSITION_DURATION);
}

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

const initialState = hydrateInitialState();

export const useVirtualDesktopStore = create<VirtualDesktopStore>(
	(set, get) => ({
		...initialState,

		switchTo(id) {
			const { activeDesktopId, desktops, transitioning } = get();
			if (id === activeDesktopId || transitioning) return;
			const currentIdx = desktops.findIndex(
				(d) => d.id === activeDesktopId,
			);
			const targetIdx = desktops.findIndex((d) => d.id === id);
			if (targetIdx === -1) return;
			const direction = targetIdx > currentIdx ? "right" : "left";
			beginTransition(set, direction, id);
		},

		switchLeft() {
			const { desktops, activeDesktopId, transitioning } = get();
			if (transitioning) return;
			const idx = desktops.findIndex((d) => d.id === activeDesktopId);
			if (idx <= 0) return;
			const target = desktops[idx - 1];
			if (!target) return;
			beginTransition(set, "left", target.id);
		},

		switchRight() {
			const { desktops, activeDesktopId, transitioning } = get();
			if (transitioning) return;
			const idx = desktops.findIndex((d) => d.id === activeDesktopId);
			if (idx >= desktops.length - 1) return;
			const target = desktops[idx + 1];
			if (!target) return;
			beginTransition(set, "right", target.id);
		},

		addDesktop() {
			const { desktops } = get();
			if (desktops.length >= 8) return;
			const newDesktop: VirtualDesktop = {
				id: createId(),
				name: `Desktop ${desktops.length + 1}`,
				windowIds: [],
			};
			set({ desktops: [...desktops, newDesktop] });
		},

		removeDesktop(id) {
			const { desktops, activeDesktopId } = get();
			if (desktops.length <= 1) return;
			const removing = desktops.find((d) => d.id === id);
			if (!removing) return;
			// Move orphaned windows to the first remaining desktop
			const remaining = desktops.filter((d) => d.id !== id);
			const first = remaining[0];
			if (!first) return;
			if (removing.windowIds.length > 0) {
				remaining[0] = {
					...first,
					windowIds: [
						...first.windowIds,
						...removing.windowIds,
					],
				};
			}
			const newActive =
				activeDesktopId === id ? first.id : activeDesktopId;
			set({ desktops: remaining, activeDesktopId: newActive });
		},

		renameDesktop(id, name) {
			const { desktops } = get();
			set({
				desktops: desktops.map((d) =>
					d.id === id ? { ...d, name } : d,
				),
			});
		},

		moveWindowToDesktop(windowId, desktopId) {
			const { desktops } = get();
			set({
				desktops: desktops.map((d) => {
					const without = d.windowIds.filter(
						(wid) => wid !== windowId,
					);
					if (d.id === desktopId) {
						return {
							...d,
							windowIds: [...without, windowId],
						};
					}
					return { ...d, windowIds: without };
				}),
			});
		},

		addWindowToActive(windowId) {
			const { desktops, activeDesktopId } = get();
			set({
				desktops: desktops.map((d) =>
					d.id === activeDesktopId
						? { ...d, windowIds: [...d.windowIds, windowId] }
						: d,
				),
			});
		},

		removeWindow(windowId) {
			const { desktops } = get();
			set({
				desktops: desktops.map((d) => ({
					...d,
					windowIds: d.windowIds.filter((wid) => wid !== windowId),
				})),
			});
		},

		rehydrate() {
			const state = hydrateInitialState();
			set({
				desktops: state.desktops,
				activeDesktopId: state.activeDesktopId,
			});
		},
	}),
);

// ----------------------------------------------------------------------------
// Persist on change
// ----------------------------------------------------------------------------

useVirtualDesktopStore.subscribe((state, prev) => {
	if (
		state.desktops !== prev.desktops ||
		state.activeDesktopId !== prev.activeDesktopId
	) {
		persist(state);
	}
});

// ----------------------------------------------------------------------------
// Sync: when a window is opened, add it to the active desktop
// Sync: when a window is closed, remove it from all desktops
// ----------------------------------------------------------------------------

useWindowStore.subscribe((state, prev) => {
	if (state.windows === prev.windows) return;

	const currentIds = new Set(state.windows.keys());
	const prevIds = new Set(prev.windows.keys());
	const vdStore = useVirtualDesktopStore.getState();

	// Detect new windows
	for (const id of currentIds) {
		if (!prevIds.has(id)) {
			vdStore.addWindowToActive(id);
		}
	}

	// Detect removed windows
	for (const id of prevIds) {
		if (!currentIds.has(id)) {
			vdStore.removeWindow(id);
		}
	}
});
