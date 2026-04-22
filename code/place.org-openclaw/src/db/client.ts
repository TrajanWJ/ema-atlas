import { createId } from "../lib/id";
import type { DbRequest, DbResponse } from "../types/db";

// ----------------------------------------------------------------------------
// DbClient — main-thread facade over the SQLite Web Worker
// ----------------------------------------------------------------------------

type PendingResolver = {
	resolve: (value: DbResponse) => void;
	reject: (reason: unknown) => void;
};

export class DbClient {
	readonly #worker: Worker;
	readonly #pending = new Map<string, PendingResolver>();
	#ready = false;

	constructor(workerUrl: string | URL) {
		this.#worker = new Worker(workerUrl, { type: "module" });
		this.#worker.onmessage = (event: MessageEvent<DbResponse>) => {
			this.#handleMessage(event.data);
		};
		this.#worker.onerror = (event) => {
			// Reject all pending if the worker crashes
			for (const [, resolver] of this.#pending) {
				resolver.reject(new Error(event.message ?? "Worker error"));
			}
			this.#pending.clear();
		};
	}

	#handleMessage(msg: DbResponse): void {
		const resolver = this.#pending.get(msg.id);
		if (!resolver) return;
		this.#pending.delete(msg.id);

		if (msg.type === "error") {
			resolver.reject(new Error(msg.message));
		} else {
			resolver.resolve(msg);
		}
	}

	#send(req: DbRequest): Promise<DbResponse> {
		return new Promise((resolve, reject) => {
			this.#pending.set(req.id, { resolve, reject });
			this.#worker.postMessage(req);
		});
	}

	async init(): Promise<void> {
		if (this.#ready) return;
		const id = createId();
		await this.#send({ id, type: "init" });
		this.#ready = true;
	}

	async exec(sql: string, params?: readonly unknown[]): Promise<void> {
		const id = createId();
		const req: DbRequest = { id, type: "exec", sql, params };
		await this.#send(req);
	}

	async query(
		sql: string,
		params?: readonly unknown[],
	): Promise<readonly Record<string, unknown>[]> {
		const id = createId();
		const req: DbRequest = { id, type: "query", sql, params };
		const response = await this.#send(req);
		if (response.type !== "result") {
			throw new Error(`Unexpected response type: ${response.type}`);
		}
		return response.rows;
	}

	terminate(): void {
		this.#worker.terminate();
		this.#pending.clear();
	}
}

// ----------------------------------------------------------------------------
// Singleton — created once, lazily, on the main thread
// ----------------------------------------------------------------------------
let instance: DbClient | null = null;

export function getDbClient(): DbClient {
	if (!instance) {
		// The worker path is resolved relative to the Next.js public directory at
		// runtime.  We use new URL with import.meta.url so bundlers can track it.
		instance = new DbClient(new URL("../db/worker.ts", import.meta.url));
	}
	return instance;
}
