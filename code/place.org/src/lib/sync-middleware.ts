import type { StateCreator, StoreMutatorIdentifier } from "zustand";
import { getSyncChannel } from "./sync-channel";
import type { SyncMessage } from "./sync-channel";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface StoreUpdatePayload {
	readonly channelKey: string;
	readonly partial: Record<string, unknown>;
}

// ----------------------------------------------------------------------------
// Internal flag — tracks whether a set() call originated from a remote sync
// message so we can avoid re-broadcasting it.
// ----------------------------------------------------------------------------

let _isRemoteUpdate = false;

// ----------------------------------------------------------------------------
// withSync — Zustand middleware that broadcasts store changes and applies
// incoming changes from other windows via SyncAPI.
// ----------------------------------------------------------------------------

/**
 * Wraps a Zustand store creator so that every local `set()` is broadcast to
 * other windows, and incoming updates for the same `channelKey` are applied
 * locally without re-broadcasting.
 *
 * Usage:
 * ```ts
 * const useMyStore = create(withSync('myStore', (set) => ({ ... })));
 * ```
 */
export function withSync<
	T extends Record<string, unknown>,
	Mps extends Array<[StoreMutatorIdentifier, unknown]> = [],
	Mcs extends Array<[StoreMutatorIdentifier, unknown]> = [],
>(
	channelKey: string,
	creator: StateCreator<T, Mps, Mcs>,
): StateCreator<T, Mps, Mcs> {
	return (set, get, api) => {
		const sync = getSyncChannel();

		// Wrapped set that broadcasts local updates
		const originalSet = set;
		// Zustand's set() has strict overloads for the `replace` param.
		// We forward args as-is, which is safe but requires a cast.
		const syncSet = ((partial: T | Partial<T>, replace?: boolean) => {
			// Apply the update locally first
			// biome-ignore lint: forwarding overloaded set() requires cast
			(originalSet as (p: T | Partial<T>, r?: boolean) => void)(
				partial,
				replace,
			);

			// If this was triggered by a remote update, don't re-broadcast
			if (_isRemoteUpdate) return;

			const state = get();
			const serializable = extractSerializableState(state);

			const msg: SyncMessage = {
				type: "store_update",
				source: sync.getSourceId(),
				timestamp: Date.now(),
				payload: {
					channelKey,
					partial: serializable,
				} satisfies StoreUpdatePayload,
			};

			sync.broadcast(msg);
		}) as typeof set;

		// Listen for incoming store updates from other windows
		sync.subscribe((msg) => {
			if (msg.type !== "store_update") return;

			const payload = msg.payload as StoreUpdatePayload;
			if (payload.channelKey !== channelKey) return;

			// Apply remote state without re-broadcasting
			_isRemoteUpdate = true;
			try {
				set(payload.partial as Partial<T> & T);
			} finally {
				_isRemoteUpdate = false;
			}
		});

		return creator(syncSet, get, api);
	};
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/** Strip functions from state — only serialize data fields. */
function extractSerializableState<T extends Record<string, unknown>>(
	state: T,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const key of Object.keys(state)) {
		if (typeof state[key] !== "function") {
			result[key] = state[key];
		}
	}
	return result;
}
