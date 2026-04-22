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
const CACHED_PORT_KEY = "place_companion_port";

// ── State ──

let ws: WebSocket | null = null;
let connected = false;
let version: string | null = null;
let reconnectDelay = RECONNECT_BASE_MS;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let intentionalDisconnect = false;
const listeners = new Map<CompanionEvent, Set<CompanionEventHandler>>();

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
	const cached = localStorage.getItem(CACHED_PORT_KEY);
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
	localStorage.setItem(CACHED_PORT_KEY, String(result.port));
	return result.socket;
}

function setupSocket(socket: WebSocket) {
	ws = socket;

	socket.addEventListener("message", (event) => {
		try {
			const msg: ServerMessage = JSON.parse(event.data as string);
			handleMessage(msg);
		} catch {
			// ignore malformed messages
		}
	});

	socket.addEventListener("close", () => {
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
	reconnectTimer = setTimeout(() => {
		reconnectTimer = null;
		void connectInternal();
	}, reconnectDelay);
	reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
}

async function connectInternal() {
	if (ws && ws.readyState === WebSocket.OPEN) return;
	try {
		const socket = await discoverPort();
		setupSocket(socket);
	} catch {
		// All ports failed — schedule reconnect
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
		intentionalDisconnect = false;
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
		return connected && ws !== null && ws.readyState === WebSocket.OPEN;
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
