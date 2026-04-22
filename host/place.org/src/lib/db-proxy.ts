import { createId } from "./id";
import { getDbClient } from "@/src/db/client";
import { getSyncChannel } from "./sync-channel";
import type { SyncMessage } from "./sync-channel";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface DbProxyAPI {
	isProxyMode(): boolean;
	exec(sql: string, params?: readonly unknown[]): Promise<void>;
	query(
		sql: string,
		params?: readonly unknown[],
	): Promise<readonly Record<string, unknown>[]>;
	/** Start listening for db_request messages (desktop only). */
	listen(): () => void;
}

interface DbRequestPayload {
	readonly requestId: string;
	readonly method: "exec" | "query";
	readonly sql: string;
	readonly params?: readonly unknown[];
}

interface DbResponsePayload {
	readonly requestId: string;
	readonly ok: boolean;
	readonly rows?: readonly Record<string, unknown>[];
	readonly error?: string;
}

// ----------------------------------------------------------------------------
// Detection
// ----------------------------------------------------------------------------

const DB_REQUEST_TIMEOUT_MS = 5_000;

function isPopoutContext(): boolean {
	return (
		typeof window !== "undefined" &&
		window.name.startsWith("place_tool_")
	);
}

// ----------------------------------------------------------------------------
// Pending request tracking for proxy mode
// ----------------------------------------------------------------------------

type PendingRequest = {
	resolve: (rows: readonly Record<string, unknown>[]) => void;
	reject: (err: Error) => void;
	timer: ReturnType<typeof setTimeout>;
};

const pending = new Map<string, PendingRequest>();

let _proxyListenerActive = false;

/** Install the listener for db_response messages (popout side). */
function ensureProxyListener(): void {
	if (_proxyListenerActive) return;
	_proxyListenerActive = true;

	const sync = getSyncChannel();
	sync.subscribe((msg) => {
		if (msg.type !== "db_response") return;
		const payload = msg.payload as DbResponsePayload;
		const entry = pending.get(payload.requestId);
		if (!entry) return;

		pending.delete(payload.requestId);
		clearTimeout(entry.timer);

		if (payload.ok) {
			entry.resolve(payload.rows ?? []);
		} else {
			entry.reject(new Error(payload.error ?? "DB proxy error"));
		}
	});
}

// ----------------------------------------------------------------------------
// Proxy send — popout window sends a db_request and awaits db_response
// ----------------------------------------------------------------------------

function sendProxyRequest(
	method: "exec" | "query",
	sql: string,
	params?: readonly unknown[],
): Promise<readonly Record<string, unknown>[]> {
	ensureProxyListener();

	const sync = getSyncChannel();
	const requestId = createId();

	return new Promise<readonly Record<string, unknown>[]>(
		(resolve, reject) => {
			const timer = setTimeout(() => {
				pending.delete(requestId);
				reject(new Error("DB proxy timeout — desktop may be closed"));
			}, DB_REQUEST_TIMEOUT_MS);

			pending.set(requestId, { resolve, reject, timer });

			const msg: SyncMessage = {
				type: "db_request",
				source: sync.getSourceId(),
				timestamp: Date.now(),
				payload: {
					requestId,
					method,
					sql,
					params,
				} satisfies DbRequestPayload,
			};

			sync.broadcast(msg);
		},
	);
}

// ----------------------------------------------------------------------------
// Desktop listener — receives db_request, executes, sends db_response
// ----------------------------------------------------------------------------

function createDesktopListener(): () => void {
	const sync = getSyncChannel();

	return sync.subscribe((msg) => {
		if (msg.type !== "db_request") return;
		const payload = msg.payload as DbRequestPayload;
		void handleDbRequest(payload, sync);
	});
}

async function handleDbRequest(
	payload: DbRequestPayload,
	sync: ReturnType<typeof getSyncChannel>,
): Promise<void> {
	const db = getDbClient();

	try {
		if (payload.method === "exec") {
			await db.exec(payload.sql, payload.params);
			broadcastResponse(sync, payload.requestId, true, []);
		} else {
			const rows = await db.query(payload.sql, payload.params);
			broadcastResponse(sync, payload.requestId, true, rows);
		}
	} catch (err: unknown) {
		const message =
			err instanceof Error ? err.message : "Unknown DB error";
		broadcastResponse(sync, payload.requestId, false, [], message);
	}
}

function broadcastResponse(
	sync: ReturnType<typeof getSyncChannel>,
	requestId: string,
	ok: boolean,
	rows: readonly Record<string, unknown>[],
	error?: string,
): void {
	const msg: SyncMessage = {
		type: "db_response",
		source: sync.getSourceId(),
		timestamp: Date.now(),
		payload: {
			requestId,
			ok,
			rows: ok ? rows : undefined,
			error,
		} satisfies DbResponsePayload,
	};
	sync.broadcast(msg);
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

function createDirectProxy(): DbProxyAPI {
	return {
		isProxyMode: () => false,

		async exec(sql, params) {
			const db = getDbClient();
			await db.exec(sql, params);
		},

		async query(sql, params) {
			const db = getDbClient();
			return db.query(sql, params);
		},

		listen() {
			return createDesktopListener();
		},
	};
}

function createRemoteProxy(): DbProxyAPI {
	return {
		isProxyMode: () => true,

		async exec(sql, params) {
			await sendProxyRequest("exec", sql, params);
		},

		async query(sql, params) {
			return sendProxyRequest("query", sql, params);
		},

		listen() {
			// Popout windows don't need to listen for db_request
			return () => {
				/* no-op */
			};
		},
	};
}

let instance: DbProxyAPI | null = null;

export function getDbProxy(): DbProxyAPI {
	if (!instance) {
		instance = isPopoutContext()
			? createRemoteProxy()
			: createDirectProxy();
	}
	return instance;
}

/** Create a standalone DbProxyAPI (useful for testing). */
export function createDbProxy(
	forceProxy: boolean,
): DbProxyAPI {
	return forceProxy ? createRemoteProxy() : createDirectProxy();
}
