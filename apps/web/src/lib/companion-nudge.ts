/**
 * Companion nudge logic — tracks when to show "go native" prompts.
 *
 * Three nudge types:
 * 1. Post-boot: shown once after welcome card is dismissed, if companion not connected
 * 2. Drag-out: shown once per session when a browser popup opens (not companion)
 * 3. Sustained use: shown once after 5+ total window opens across sessions
 *
 * All nudges are suppressed when the companion IS connected.
 * All dismissals persist in localStorage.
 */

import { companionBridge } from "@/src/lib/companion-bridge";

const KEYS = {
	bootDismissed: "place_companion_nudge_boot",
	dragShownThisSession: "place_companion_nudge_drag_session",
	sustainedDismissed: "place_companion_nudge_sustained",
	windowOpenCount: "place_companion_window_count",
} as const;

const SUSTAINED_THRESHOLD = 5;

function isServer(): boolean {
	return typeof window === "undefined";
}

/** Increment the lifetime window-open counter. Call on every openWindow(). */
export function trackWindowOpen(): void {
	if (isServer()) return;
	const count = Number.parseInt(localStorage.getItem(KEYS.windowOpenCount) ?? "0", 10);
	localStorage.setItem(KEYS.windowOpenCount, String(count + 1));
}

/** Get the lifetime window-open count. */
export function getWindowOpenCount(): number {
	if (isServer()) return 0;
	return Number.parseInt(localStorage.getItem(KEYS.windowOpenCount) ?? "0", 10);
}

// ── Post-boot nudge ──

export function shouldShowBootNudge(): boolean {
	if (isServer()) return false;
	if (companionBridge.isAvailable()) return false;
	return localStorage.getItem(KEYS.bootDismissed) !== "true";
}

export function dismissBootNudge(): void {
	if (isServer()) return;
	localStorage.setItem(KEYS.bootDismissed, "true");
}

// ── Drag-out nudge ──

let dragShownThisSession = false;

export function shouldShowDragNudge(): boolean {
	if (isServer()) return false;
	if (companionBridge.isAvailable()) return false;
	if (dragShownThisSession) return false;
	return true;
}

export function markDragNudgeShown(): void {
	dragShownThisSession = true;
}

// ── Sustained use nudge ──

export function shouldShowSustainedNudge(): boolean {
	if (isServer()) return false;
	if (companionBridge.isAvailable()) return false;
	if (localStorage.getItem(KEYS.sustainedDismissed) === "true") return false;
	return getWindowOpenCount() >= SUSTAINED_THRESHOLD;
}

export function dismissSustainedNudge(): void {
	if (isServer()) return;
	localStorage.setItem(KEYS.sustainedDismissed, "true");
}
