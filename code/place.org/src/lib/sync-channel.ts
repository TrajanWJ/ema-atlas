import { createId } from "./id";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type SyncMessageType =
	| "store_update"
	| "window_event"
	| "drag_payload"
	| "db_request"
	| "db_response"
	| "app_event";

export interface SyncMessage {
	readonly type: SyncMessageType;
	readonly source: string;
	readonly timestamp: number;
	readonly payload: unknown;
}

export interface SyncAPI {
	broadcast(msg: SyncMessage): void;
	subscribe(handler: (msg: SyncMessage) => void): () => void;
	getSourceId(): string;
	destroy(): void;
}

// ----------------------------------------------------------------------------
// Source ID — unique per browsing context
// ----------------------------------------------------------------------------

function resolveSourceId(): string {
	if (typeof window === "undefined") return "server";
	if (window.name.startsWith("place_tool_")) return window.name;
	return "desktop";
}

// ----------------------------------------------------------------------------
// BroadcastChannel implementation
// ----------------------------------------------------------------------------

const CHANNEL_NAME = "place_sync";

function createBroadcastSync(): SyncAPI {
	const sourceId = resolveSourceId();
	const channel = new BroadcastChannel(CHANNEL_NAME);
	const listeners = new Set<(msg: SyncMessage) => void>();

	channel.onmessage = (event: MessageEvent<SyncMessage>) => {
		const msg = event.data;
		// Ignore messages from self — prevents echo loops
		if (msg.source === sourceId) return;
		for (const handler of listeners) {
			handler(msg);
		}
	};

	return {
		broadcast(msg) {
			channel.postMessage(msg);
		},

		subscribe(handler) {
			listeners.add(handler);
			return () => {
				listeners.delete(handler);
			};
		},

		getSourceId() {
			return sourceId;
		},

		destroy() {
			listeners.clear();
			channel.close();
		},
	};
}

// ----------------------------------------------------------------------------
// No-op fallback (SSR or browsers without BroadcastChannel)
// ----------------------------------------------------------------------------

function createNoopSync(): SyncAPI {
	const sourceId = resolveSourceId();

	return {
		broadcast() {
			/* no-op */
		},
		subscribe() {
			return () => {
				/* no-op */
			};
		},
		getSourceId() {
			return sourceId;
		},
		destroy() {
			/* no-op */
		},
	};
}

// ----------------------------------------------------------------------------
// Feature detection & singleton
// ----------------------------------------------------------------------------

function isBroadcastChannelAvailable(): boolean {
	return (
		typeof globalThis !== "undefined" &&
		typeof globalThis.BroadcastChannel === "function"
	);
}

let instance: SyncAPI | null = null;

export function getSyncChannel(): SyncAPI {
	if (!instance) {
		instance = isBroadcastChannelAvailable()
			? createBroadcastSync()
			: createNoopSync();
	}
	return instance;
}

/** Create a standalone SyncAPI (useful for testing without touching the singleton). */
export function createSyncChannel(): SyncAPI {
	return isBroadcastChannelAvailable()
		? createBroadcastSync()
		: createNoopSync();
}
