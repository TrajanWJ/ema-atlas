// ----------------------------------------------------------------------------
// DbClient — talks to the server-side SQLite via /api/db
//
// Replaces the previous web worker approach which suffered from:
// - Turbopack rewriting import.meta.url (breaking WASM resolution)
// - OPFS stale lock issues from crashed workers
// - IDBBatchAtomicVFS incompatibility with wa-sqlite 1.0.0
//
// The server-side approach uses better-sqlite3 which persists to a real
// file on disk (data/place.db). No browser storage quirks.
// ----------------------------------------------------------------------------

interface DbResponse {
	readonly type: string;
	readonly rows?: readonly Record<string, unknown>[];
	readonly message?: string;
}

export class DbClient {
	#ready = false;
	#initPromise: Promise<void> | null = null;

	async #fetch(body: Record<string, unknown>): Promise<DbResponse> {
		const res = await fetch('/api/db', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({ message: res.statusText }));
			throw new Error((data as DbResponse).message ?? `HTTP ${res.status}`);
		}
		return res.json() as Promise<DbResponse>;
	}

	async init(): Promise<void> {
		if (this.#ready) return;
		if (this.#initPromise) return this.#initPromise;
		this.#initPromise = (async () => {
			// Server runs migrations on first request automatically.
			// Just verify the API is reachable.
			await this.#fetch({ type: 'query', sql: 'SELECT 1', params: [] });
			this.#ready = true;
		})();
		return this.#initPromise;
	}

	async exec(sql: string, params?: readonly unknown[]): Promise<void> {
		await this.init();
		const response = await this.#fetch({ type: 'exec', sql, params: params ?? [] });
		if (response.type === 'error') {
			throw new Error(response.message ?? 'exec failed');
		}
	}

	async query(
		sql: string,
		params?: readonly unknown[],
	): Promise<readonly Record<string, unknown>[]> {
		await this.init();
		const response = await this.#fetch({ type: 'query', sql, params: params ?? [] });
		if (response.type === 'error') {
			throw new Error(response.message ?? 'query failed');
		}
		return response.rows ?? [];
	}

	terminate(): void {
		// No-op for fetch-based client
	}
}

// ----------------------------------------------------------------------------
// Singleton
// ----------------------------------------------------------------------------
let instance: DbClient | null = null;

export function getDbClient(): DbClient {
	if (!instance) {
		instance = new DbClient();
	}
	return instance;
}
