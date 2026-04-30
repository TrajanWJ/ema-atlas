/**
 * Companion Bridge — WebSocket client for the place.org companion app.
 *
 * Connects to the local Tauri companion on port 27182-27189.
 * When connected, popout-launcher routes detach() through here
 * instead of window.open(), enabling transparent native windows.
 *
 * When not connected, everything falls back to the existing
 * window.open() behavior. Zero side effects when companion is absent.
 */

import type { AppId, WindowPosition } from "@/src/types/window";
import { POPOUT_WINDOW_SIZES } from "@/src/lib/constants";

// ── Types ──

type CompanionEvent =
	| "window-opened"
	| "window-closed"
	| "window-moved"
	| "window-resized"
	| "window-reattach"
	| "connected"
	| "disconnected";

type CompanionEventHandler = (data: Record<string, unknown>) => void;

interface ServerMessage {
	readonly type: string;
	readonly [key: string]: unknown;
}

// ── Constants ──

const PORT_RANGE_START = 27182;
const PORT_RANGE_END = 27189;
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const RECONNECT_GIVE_UP_AFTER = 3; // stop scheduling after N total failed cycles
const CACHED_PORT_KEY = "place_companion_port";

// ── State ──

let ws: WebSocket | null = null;
let connected = false;
let version: string | null = null;
let reconnectDelay = RECONNECT_BASE_MS;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let intentionalDisconnect = false;
const listeners = new Map<CompanionEvent, Set<CompanionEventHandler>>();

// ── Runtime detection ──

/**
 * EMA's Tauri build IS its own native app — it should NOT try to connect to
 * `place-companion`'s WebSocket. That bridge was for place.org running in a
 * browser to delegate popouts to a sibling Tauri app. Inside EMA's Tauri,
 * we'd be racing 8 outbound WS attempts to ports 27182–27189 every second
 * which (combined with restricted webview localStorage and the fast
 * close/reopen cycle) was OOM-killing the renderer at t≈3s.
 *
 * In Tauri runtime: noop. In browser: connect normally.
 */
function shouldSkipBridge(): boolean {
	if (typeof window === "undefined") return true;
	if ("__TAURI__" in window || "__TAURI_INTERNALS__" in window) return true;
	return false;
}

function safeLocalStorageGet(key: string): string | null {
	try {
		if (typeof localStorage === "undefined") return null;
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function safeLocalStorageSet(key: string, value: string): void {
	try {
		if (typeof localStorage === "undefined") return;
		localStorage.setItem(key, value);
	} catch {
		/* swallow — storage unavailable */
	}
}

// ── Event dispatch ──

function emit(event: CompanionEvent, data: Record<string, unknown> = {}) {
	listeners.get(event)?.forEach((handler) => {
		try {
			handler(data);
		} catch {
			// swallow handler errors
		}
	});
}

// ── Connection ──

function tryPort(port: number): Promise<WebSocket> {
	return new Promise((resolve, reject) => {
		const socket = new WebSocket(`ws://localhost:${port}`);
		const timeout = setTimeout(() => {
			socket.close();
			reject(new Error(`Port ${port} timeout`));
		}, 500); // 500ms — localhost connections are instant if listening

		socket.addEventListener("open", () => {
			clearTimeout(timeout);
			resolve(socket);
		});
		socket.addEventListener("error", () => {
			clearTimeout(timeout);
			reject(new Error(`Port ${port} failed`));
		});
	});
}

async function discoverPort(): Promise<WebSocket> {
	// Try cached port first
	const cached = safeLocalStorageGet(CACHED_PORT_KEY);
	if (cached) {
		const port = Number.parseInt(cached, 10);
		if (port >= PORT_RANGE_START && port <= PORT_RANGE_END) {
			try {
				return await tryPort(port);
			} catch {
				// Cache stale, try all ports
			}
		}
	}

	// Try all ports in parallel
	const attempts = [];
	for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
		attempts.push(
			tryPort(port).then((socket) => ({ socket, port })),
		);
	}

	const result = await Promise.any(attempts);
	safeLocalStorageSet(CACHED_PORT_KEY, String(result.port));
	return result.socket;
}

function setupSocket(socket: WebSocket) {
	ws = socket;
	console.log("[companion-bridge] socket opened, waiting for hello...");

	socket.addEventListener("message", (event) => {
		try {
			const msg: ServerMessage = JSON.parse(event.data as string);
			handleMessage(msg);
		} catch {
			// ignore malformed messages
		}
	});

	socket.addEventListener("close", () => {
		console.log("[companion-bridge] socket closed");
		const wasConnected = connected;
		ws = null;
		connected = false;
		version = null;
		if (wasConnected) {
			emit("disconnected");
		}
		if (!intentionalDisconnect) {
			scheduleReconnect();
		}
	});

	socket.addEventListener("error", () => {
		// close event will handle cleanup
	});
}

function handleMessage(msg: ServerMessage) {
	switch (msg.type) {
		case "hello":
			connected = true;
			version = (msg.version as string) ?? null;
			reconnectDelay = RECONNECT_BASE_MS; // reset backoff
			console.log("[companion-bridge] connected! version:", version, "windows:", (msg.windows as unknown[])?.length ?? 0);
			emit("connected", { version });
			break;
		case "window-opened":
			emit("window-opened", msg);
			break;
		case "window-closed":
			emit("window-closed", msg);
			break;
		case "window-moved":
			emit("window-moved", msg);
			break;
		case "window-resized":
			emit("window-resized", msg);
			break;
		case "window-reattach":
			emit("window-reattach", msg);
			break;
		case "pong":
			// keepalive response — no action needed
			break;
		default:
			break;
	}
}

function scheduleReconnect() {
	if (reconnectTimer) return;
	if (reconnectAttempts >= RECONNECT_GIVE_UP_AFTER) {
		// Companion is not running. Stop scheduling — don't pile up timers.
		// A future user action that calls .connect() explicitly will reset.
		console.log(
			"[companion-bridge] companion not detected after",
			RECONNECT_GIVE_UP_AFTER,
			"attempts — giving up. Bridge available again on next .connect().",
		);
		return;
	}
	reconnectTimer = setTimeout(() => {
		reconnectTimer = null;
		void connectInternal();
	}, reconnectDelay);
	reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
	reconnectAttempts += 1;
}

async function connectInternal() {
	if (ws && ws.readyState === WebSocket.OPEN) return;
	try {
		const socket = await discoverPort();
		setupSocket(socket);
		// Successful connect — reset attempt counter so future drops can retry.
		reconnectAttempts = 0;
	} catch {
		// All ports failed — schedule reconnect (bounded by RECONNECT_GIVE_UP_AFTER)
		if (!intentionalDisconnect) {
			scheduleReconnect();
		}
	}
}

// ── Keepalive ──

let pingInterval: ReturnType<typeof setInterval> | null = null;

function startPing() {
	stopPing();
	pingInterval = setInterval(() => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: "ping" }));
		}
	}, 15000);
}

function stopPing() {
	if (pingInterval) {
		clearInterval(pingInterval);
		pingInterval = null;
	}
}

// ── Public API ──

export const companionBridge = {
	connect() {
		if (typeof window === "undefined") return;
		// EMA's Tauri build IS its own native app; the companion bridge is
		// for browser → place-companion sibling Tauri delegation. Skipping
		// avoids the WS-attempt storm that OOM-killed the renderer at t≈3s.
		if (shouldSkipBridge()) return;
		intentionalDisconnect = false;
		// Reset the give-up counter so explicit user-initiated .connect()
		// retries even after a previous abandonment.
		reconnectAttempts = 0;
		reconnectDelay = RECONNECT_BASE_MS;
		startPing();
		void connectInternal();
	},

	disconnect() {
		intentionalDisconnect = true;
		stopPing();
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
		if (ws) {
			ws.close();
			ws = null;
		}
		connected = false;
		version = null;
	},

	isAvailable(): boolean {
		const available = connected && ws !== null && ws.readyState === WebSocket.OPEN;
		return available;
	},

	getVersion(): string | null {
		return version;
	},

	// ── Commands ──

	openWindow(
		windowId: string,
		appId: AppId,
		position: WindowPosition,
	) {
		if (!this.isAvailable()) return;
		const url = `${window.location.origin}/popout/${appId}?windowId=${windowId}&companion=true`;
		// Use popout-specific sizes (larger than virtual desktop sizes)
		const popoutSize = POPOUT_WINDOW_SIZES[appId];
		ws!.send(
			JSON.stringify({
				type: "open-window",
				windowId,
				appId,
				url,
				bounds: {
					x: Math.max(50, position.x),
					y: Math.max(50, position.y),
					width: popoutSize?.width ?? position.width,
					height: popoutSize?.height ?? position.height,
				},
				transparent: true,
			}),
		);
	},

	closeWindow(windowId: string) {
		if (!this.isAvailable()) return;
		ws!.send(JSON.stringify({ type: "close-window", windowId }));
	},

	focusWindow(windowId: string) {
		if (!this.isAvailable()) return;
		ws!.send(JSON.stringify({ type: "focus-window", windowId }));
	},

	sendReattachAck(windowId: string) {
		if (!this.isAvailable()) return;
		ws!.send(JSON.stringify({ type: "reattach-ack", windowId }));
	},

	// ── Events ──

	on(event: CompanionEvent, handler: CompanionEventHandler): () => void {
		if (!listeners.has(event)) {
			listeners.set(event, new Set());
		}
		listeners.get(event)!.add(handler);
		return () => {
			listeners.get(event)?.delete(handler);
		};
	},
};
