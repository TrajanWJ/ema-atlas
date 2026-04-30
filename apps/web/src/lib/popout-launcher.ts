import type { AppId, WindowPosition } from "@/src/types/window";
import { useToastStore } from "@/src/stores/toast-store";
import {
	readPersistedState,
	writePersistedState,
} from "@/src/stores/window-persistence";
import type { PersistedWindowState } from "@/src/stores/window-persistence";
import { companionBridge } from "@/src/lib/companion-bridge";
import { POPOUT_WINDOW_SIZES } from "@/src/lib/constants";
import { sendCommand } from "@/src/lib/ipc";
import { shouldShowDragNudge, markDragNudgeShown, trackWindowOpen } from "@/src/lib/companion-nudge";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const WINDOW_NAME_PREFIX = "place_tool_";
const SOFT_LIMIT = 3;
const HARD_LIMIT = 5;
const CASCADE_STEP = 30;
const INITIAL_OFFSET = 60;

// ----------------------------------------------------------------------------
// Touch device detection
// ----------------------------------------------------------------------------

export function isTouchDevice(): boolean {
	if (typeof window === "undefined") return false;
	const coarse = window.matchMedia("(pointer: coarse)").matches;
	return coarse && window.innerWidth < 1024;
}

// ----------------------------------------------------------------------------
// Popup reference tracking
// ----------------------------------------------------------------------------

const popupRefs = new Map<string, Window>();

function getPopoutCount(): number {
	// Clean up closed refs before counting
	for (const [id, ref] of popupRefs) {
		if (ref.closed) popupRefs.delete(id);
	}
	return popupRefs.size;
}

function windowName(windowId: string): string {
	return `${WINDOW_NAME_PREFIX}${windowId}`;
}

// ----------------------------------------------------------------------------
// Position calculation
// ----------------------------------------------------------------------------

function computePopoutPosition(
	position: WindowPosition,
	appId?: AppId,
): { left: number; top: number; width: number; height: number } {
	const count = getPopoutCount();
	const cascade = count * CASCADE_STEP;
	// Use popout-specific sizes (larger, better for standalone windows)
	const popoutSize = appId ? POPOUT_WINDOW_SIZES[appId] : undefined;
	const width = popoutSize?.width ?? position.width;
	const height = popoutSize?.height ?? position.height;

	const left = Math.min(
		window.screenX + INITIAL_OFFSET + cascade,
		screen.availWidth - width - 20,
	);
	const top = Math.min(
		window.screenY + INITIAL_OFFSET + cascade,
		screen.availHeight - height - 20,
	);

	return {
		left: Math.max(0, left),
		top: Math.max(0, top),
		width,
		height,
	};
}

function buildFeatureString(
	pos: { left: number; top: number; width: number; height: number },
): string {
	return [
		`left=${pos.left}`,
		`top=${pos.top}`,
		`width=${pos.width}`,
		`height=${pos.height}`,
		"menubar=no",
		"toolbar=no",
		"location=no",
		"status=no",
		"scrollbars=no",
		"resizable=yes",
	].join(",");
}

function sendCompanionBrokerCommand(
	op: "companion.window.open" | "companion.window.close" | "companion.window.focus" | "companion.window.reattach_ack",
	args: Record<string, unknown>,
): void {
	void sendCommand(op, args).then((result) => {
		if (!result.ok) {
			console.debug("[popout-launcher] daemon companion broker unavailable", op, result.error.message);
		}
	});
}

function brokerCompanionWindowOpen(
	windowId: string,
	appId: AppId,
	position: WindowPosition,
): void {
	sendCompanionBrokerCommand("companion.window.open", {
		window_id: windowId,
		app_id: appId,
		url: `/popout/${appId}?windowId=${windowId}`,
		transparent: true,
		bounds: {
			x: position.x,
			y: position.y,
			width: position.width,
			height: position.height,
		},
	});
}

// ----------------------------------------------------------------------------
// Persistence helpers
// ----------------------------------------------------------------------------

function updatePersistedMode(
	windowId: string,
	mode: "inline" | "popout",
	screenX?: number,
	screenY?: number,
): void {
	const states = readPersistedState();
	if (!states) return;

	const updated = states.map((s) => {
		if (s.windowId !== windowId) return s;
		return { ...s, mode, screenX, screenY } satisfies PersistedWindowState;
	});

	writePersistedState(updated);
}

function removePersistedWindow(windowId: string): void {
	const states = readPersistedState();
	if (!states) return;
	writePersistedState(states.filter((s) => s.windowId !== windowId));
}

// ----------------------------------------------------------------------------
// Popout lifecycle monitoring
// ----------------------------------------------------------------------------

function watchPopoutClose(windowId: string, popup: Window): void {
	const interval = setInterval(() => {
		if (!popup.closed) return;
		clearInterval(interval);
		popupRefs.delete(windowId);
		removePersistedWindow(windowId);
	}, 500);
}

// ----------------------------------------------------------------------------
// PopoutAPI
// ----------------------------------------------------------------------------

export interface PopoutAPI {
	detach(
		windowId: string,
		appId: AppId,
		position: WindowPosition,
	): Window | null;
	reattach(windowId: string): boolean;
	isPopout(windowId: string): boolean;
	focusPopout(windowId: string): void;
	closePopout(windowId: string): void;
}

function createPopoutAPI(): PopoutAPI {
	return {
		detach(windowId, appId, position) {
			if (isTouchDevice()) return null;

			// Daemon broker first: record desired native companion state and emit
			// companion.status/windows projections before falling back to the donor bridge
			// or browser popout path.
			brokerCompanionWindowOpen(windowId, appId, position);

			const companionAvailable = companionBridge.isAvailable();
			console.log("[popout-launcher] detach:", windowId, "companion:", companionAvailable);
			if (companionAvailable) {
				companionBridge.openWindow(windowId, appId, position);
				return "companion" as unknown as Window;
			}

			// Hard block
			if (getPopoutCount() >= HARD_LIMIT) {
				useToastStore
					.getState()
					.addToast(
						`Maximum ${HARD_LIMIT} popout windows allowed`,
						"error",
					);
				return null;
			}

			// Soft warning
			if (getPopoutCount() >= SOFT_LIMIT) {
				useToastStore
					.getState()
					.addToast(
						`${getPopoutCount()} popout windows open — consider closing some`,
						"warning",
					);
			}

			const name = windowName(windowId);

			// Dedup: check if already open
			const existing = popupRefs.get(windowId);
			if (existing && !existing.closed) {
				existing.focus();
				return existing;
			}

			const pos = computePopoutPosition(position, appId);
			const features = buildFeatureString(pos);
			const url = `/popout/${appId}?windowId=${windowId}`;
			const popup = window.open(url, name, features);

			if (!popup) {
				useToastStore
					.getState()
					.addToast(
						"Popup blocked — please allow popups for this site",
						"error",
					);
				return null;
			}

			popupRefs.set(windowId, popup);
			updatePersistedMode(windowId, "popout", pos.left, pos.top);
			watchPopoutClose(windowId, popup);

			// Nudge: "want that as a native window?" (once per session)
			if (shouldShowDragNudge()) {
				markDragNudgeShown();
				useToastStore
					.getState()
					.addToast(
						"Want that as a transparent native window? Get the companion app at /companion",
						"info",
						8000,
					);
			}

			return popup;
		},

		reattach(windowId) {
			const name = windowName(windowId);
			try {
				const ref = window.open("", name);
				if (
					ref &&
					!ref.closed &&
					ref.location.href !== "about:blank"
				) {
					popupRefs.set(windowId, ref);
					watchPopoutClose(windowId, ref);
					sendCompanionBrokerCommand("companion.window.reattach_ack", {
						window_id: windowId,
					});
					return true;
				}
			} catch {
				// Cross-origin or blocked — can't reattach
			}
			return false;
		},

		isPopout(windowId) {
			const ref = popupRefs.get(windowId);
			return ref !== undefined && !ref.closed;
		},

		focusPopout(windowId) {
			sendCompanionBrokerCommand("companion.window.focus", {
				window_id: windowId,
			});
			const ref = popupRefs.get(windowId);
			if (ref && !ref.closed) ref.focus();
		},

		closePopout(windowId) {
			sendCompanionBrokerCommand("companion.window.close", {
				window_id: windowId,
			});
			const ref = popupRefs.get(windowId);
			if (ref && !ref.closed) ref.close();
			popupRefs.delete(windowId);
		},
	};
}

// ----------------------------------------------------------------------------
// Singleton
// ----------------------------------------------------------------------------

let instance: PopoutAPI | null = null;

export function getPopoutLauncher(): PopoutAPI {
	if (!instance) {
		instance = createPopoutAPI();
	}
	return instance;
}

// ----------------------------------------------------------------------------
// Reattach all persisted popouts (call on desktop load)
// ----------------------------------------------------------------------------

export function reattachPersistedPopouts(): void {
	const states = readPersistedState();
	if (!states) return;

	const launcher = getPopoutLauncher();
	for (const s of states) {
		if (s.mode !== "popout") continue;
		const ok = launcher.reattach(s.windowId);
		if (!ok) {
			// Popout is gone — revert to inline so it shows up in desktop
			updatePersistedMode(s.windowId, "inline");
		}
	}
}
