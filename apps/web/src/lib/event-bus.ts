import { createId } from "./id";
import { getSyncChannel } from "./sync-channel";
import type { SyncMessage } from "./sync-channel";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface AppEvent {
	readonly id: string;
	readonly appId: string;
	readonly eventType: string;
	readonly timestamp: number;
	readonly payload: Record<string, unknown>;
}

interface EventBus {
	emit(event: Omit<AppEvent, "id" | "timestamp">): void;
	on(pattern: string, handler: (event: AppEvent) => void): () => void;
	history(limit?: number): readonly AppEvent[];
	debug: boolean;
}

// ----------------------------------------------------------------------------
// Pattern matching
// ----------------------------------------------------------------------------

/** Match event key (`appId:eventType`) against pattern.
 *  Patterns: `'timer:session_completed'` (exact), `'timer:*'` (app), `'*'` (all) */
function matchesPattern(pattern: string, appId: string, eventType: string): boolean {
	if (pattern === "*") return true;
	if (pattern.endsWith(":*")) return pattern.slice(0, -2) === appId;
	return pattern === `${appId}:${eventType}`;
}

// ----------------------------------------------------------------------------
// Circular buffer
// ----------------------------------------------------------------------------

const BUFFER_SIZE = 500;

function createCircularBuffer() {
	const buffer: (AppEvent | undefined)[] = new Array<AppEvent | undefined>(BUFFER_SIZE).fill(undefined);
	let writeIndex = 0;
	let count = 0;

	return {
		push(event: AppEvent): void {
			buffer[writeIndex] = event;
			writeIndex = (writeIndex + 1) % BUFFER_SIZE;
			if (count < BUFFER_SIZE) count++;
		},

		toArray(limit?: number): readonly AppEvent[] {
			const total = limit !== undefined ? Math.min(limit, count) : count;
			const result: AppEvent[] = [];
			const start = (writeIndex - count + BUFFER_SIZE) % BUFFER_SIZE;
			const offset = count - total;
			for (let i = 0; i < total; i++) {
				const idx = (start + offset + i) % BUFFER_SIZE;
				const event = buffer[idx];
				if (event) result.push(event);
			}
			return result;
		},
	};
}

// ----------------------------------------------------------------------------
// Event Bus implementation
// ----------------------------------------------------------------------------

function createEventBus(): EventBus {
	const listeners = new Map<string, Set<(event: AppEvent) => void>>();
	const buffer = createCircularBuffer();
	let debugMode = false;

	// Listen for events from other tabs via BroadcastChannel
	const sync = getSyncChannel();
	sync.subscribe((msg: SyncMessage) => {
		if (msg.type !== "app_event") return;
		const event = msg.payload as AppEvent;
		dispatch(event, true);
	});

	function dispatch(event: AppEvent, fromRemote = false): void {
		if (!fromRemote) {
			buffer.push(event);
		}

		if (debugMode) {
			// biome-ignore lint/suspicious/noConsole: debug output
			console.log("[EventBus]", `${event.appId}:${event.eventType}`, event.payload);
		}

		for (const [pattern, handlers] of listeners) {
			if (matchesPattern(pattern, event.appId, event.eventType)) {
				for (const handler of handlers) {
					handler(event);
				}
			}
		}
	}

	const bus: EventBus = {
		emit(partial) {
			const event: AppEvent = {
				id: createId(),
				timestamp: Date.now(),
				appId: partial.appId,
				eventType: partial.eventType,
				payload: partial.payload,
			};

			buffer.push(event);

			// Broadcast to other tabs
			sync.broadcast({
				type: "app_event",
				source: sync.getSourceId(),
				timestamp: event.timestamp,
				payload: event,
			});

			dispatch(event, true);
		},

		on(pattern, handler) {
			let handlers = listeners.get(pattern);
			if (!handlers) {
				handlers = new Set();
				listeners.set(pattern, handlers);
			}
			handlers.add(handler);

			return () => {
				handlers.delete(handler);
				if (handlers.size === 0) {
					listeners.delete(pattern);
				}
			};
		},

		history(limit) {
			return buffer.toArray(limit);
		},

		get debug() {
			return debugMode;
		},
		set debug(value: boolean) {
			debugMode = value;
		},
	};

	return bus;
}

// ----------------------------------------------------------------------------
// Singleton
// ----------------------------------------------------------------------------

export const eventBus: EventBus = createEventBus();
