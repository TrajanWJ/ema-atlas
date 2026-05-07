"use client";

import { getCurrentUserId } from "./current-user";
import { sendCommand } from "./ipc";

const SESSION_KEY = "ema-presence-session-id";
const COLORS = ["#5eead4", "#60a5fa", "#f472b6", "#facc15", "#a78bfa", "#fb7185"];

export type PresenceScope = {
	readonly org_id?: string | null;
	readonly space_id?: string | null;
	readonly room_id?: string | null;
};

type CursorTarget = {
	readonly surface?: string;
	readonly window_id?: string | null;
	readonly app_id?: string | null;
};

export function getPresenceSessionId(): string {
	if (typeof window === "undefined") return "presence:ssr";
	const existing = window.sessionStorage.getItem(SESSION_KEY);
	if (existing) return existing;
	const id = `presence:${crypto.randomUUID()}`;
	window.sessionStorage.setItem(SESSION_KEY, id);
	return id;
}

export function actorColor(actorId = getCurrentUserId()): string {
	let hash = 0;
	for (let i = 0; i < actorId.length; i += 1) hash = (hash * 31 + actorId.charCodeAt(i)) >>> 0;
	return COLORS[hash % COLORS.length] ?? "#5eead4";
}

export function actorDisplayName(fallback = "Trajan"): string {
	const userId = getCurrentUserId();
	if (!userId || userId === "guest") return fallback;
	return userId;
}

export function basePresencePayload(scope: PresenceScope, displayName?: string) {
	const actorId = getCurrentUserId() === "guest" ? "actor:web-local" : getCurrentUserId();
	return {
		org_id: scope.org_id ?? "org:local",
		space_id: scope.space_id ?? "space:local",
		room_id: scope.room_id ?? "desktop_room:default",
		session_id: getPresenceSessionId(),
		actor_id: actorId,
		display_name: displayName ?? actorDisplayName(),
		color: actorColor(actorId),
	};
}

export function publishPresenceJoin(scope: PresenceScope, displayName?: string): void {
	void sendCommand("desktop.presence.join", basePresencePayload(scope, displayName)).catch(() => undefined);
}

export function publishPresenceCursor(
	scope: PresenceScope,
	x: number,
	y: number,
	displayName?: string,
	target: CursorTarget = {},
): void {
	void sendCommand("desktop.presence.cursor", {
		...basePresencePayload(scope, displayName),
		x: Math.round(x),
		y: Math.round(y),
		surface: target.surface ?? "desktop",
		window_id: target.window_id ?? null,
		app_id: target.app_id ?? null,
	}).catch(() => undefined);
}

export function publishPresenceLocation(
	scope: PresenceScope,
	windowId: string,
	appId: string,
	label: string,
	displayName?: string,
): void {
	void sendCommand("desktop.presence.location", {
		...basePresencePayload(scope, displayName),
		window_id: windowId,
		app_id: appId,
		label,
	}).catch(() => undefined);
}
