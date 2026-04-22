import { describe, it, expect, vi } from "vitest";
import { exportAllData } from "../../src/lib/data-export";
import { importData, previewImport } from "../../src/lib/data-import";
import type { DbClient } from "../../src/db/client";

// ----------------------------------------------------------------------------
// Mock DbClient helpers
// ----------------------------------------------------------------------------

function makeClient(overrides?: {
	query?: (sql: string, params?: readonly unknown[]) => Promise<readonly Record<string, unknown>[]>;
	exec?: (sql: string, params?: readonly unknown[]) => Promise<void>;
}): DbClient {
	return {
		exec: vi.fn().mockImplementation(overrides?.exec ?? (() => Promise.resolve())),
		query: vi.fn().mockImplementation(
			overrides?.query ?? (() => Promise.resolve([])),
		),
		init: vi.fn().mockResolvedValue(undefined),
		terminate: vi.fn(),
	} as unknown as DbClient;
}

const FAKE_ISO = "2026-03-20T12:00:00.000Z";

// ----------------------------------------------------------------------------
// exportAllData
// ----------------------------------------------------------------------------

describe("exportAllData", () => {
	it("returns correct shape with version 1", async () => {
		const db = makeClient();
		const result = await exportAllData(db);

		expect(result.version).toBe(1);
		expect(typeof result.exported_at).toBe("string");
		expect(result.tables).toBeDefined();
	});

	it("includes all expected table keys", async () => {
		const db = makeClient();
		const result = await exportAllData(db);

		expect(result.tables).toHaveProperty("inbox");
		expect(result.tables).toHaveProperty("journal_entries");
		expect(result.tables).toHaveProperty("focus_sessions");
		expect(result.tables).toHaveProperty("focus_blocks");
		expect(result.tables).toHaveProperty("settings");
	});

	it("returns empty arrays when tables are empty", async () => {
		const db = makeClient();
		const result = await exportAllData(db);

		expect(result.tables.inbox).toEqual([]);
		expect(result.tables.journal_entries).toEqual([]);
		expect(result.tables.focus_sessions).toEqual([]);
		expect(result.tables.focus_blocks).toEqual([]);
		expect(result.tables.settings).toEqual([]);
	});

	it("maps rows from db.query into the export tables", async () => {
		const fakeRow = { id: "abc", content: "test", created_at: FAKE_ISO, updated_at: FAKE_ISO };
		let callCount = 0;
		const db = makeClient({
			query: async () => {
				callCount++;
				// Only return data on the first call (inbox)
				if (callCount === 1) return [fakeRow];
				return [];
			},
		});
		const result = await exportAllData(db);
		expect(result.tables.inbox).toHaveLength(1);
		expect(result.tables.inbox[0]).toEqual(fakeRow);
	});

	it("exported_at is a valid ISO date string", async () => {
		const db = makeClient();
		const result = await exportAllData(db);
		expect(() => new Date(result.exported_at)).not.toThrow();
		expect(new Date(result.exported_at).toISOString()).toBe(result.exported_at);
	});
});

// ----------------------------------------------------------------------------
// importData — version validation
// ----------------------------------------------------------------------------

describe("importData — version validation", () => {
	it("rejects JSON with wrong version", async () => {
		const db = makeClient();
		const json = JSON.stringify({
			version: 2,
			exported_at: FAKE_ISO,
			tables: {
				inbox: [],
				journal_entries: [],
				focus_sessions: [],
				focus_blocks: [],
				settings: [],
			},
		});
		const result = await importData(db, json);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatch(/version/i);
		expect(result.imported).toBe(0);
	});

	it("rejects malformed JSON", async () => {
		const db = makeClient();
		const result = await importData(db, "{not valid json");
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatch(/parse/i);
	});

	it("rejects missing tables field", async () => {
		const db = makeClient();
		const json = JSON.stringify({
			version: 1,
			exported_at: FAKE_ISO,
		});
		const result = await importData(db, json);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatch(/tables/i);
	});
});

// ----------------------------------------------------------------------------
// importData — empty tables
// ----------------------------------------------------------------------------

describe("importData — empty tables", () => {
	it("returns zero imported for empty export", async () => {
		const db = makeClient();
		const json = JSON.stringify({
			version: 1,
			exported_at: FAKE_ISO,
			tables: {
				inbox: [],
				journal_entries: [],
				focus_sessions: [],
				focus_blocks: [],
				settings: [],
			},
		});
		const result = await importData(db, json);
		expect(result.imported).toBe(0);
		expect(result.skipped).toBe(0);
		expect(result.errors).toHaveLength(0);
	});

	it("does not call db.exec for empty tables", async () => {
		const db = makeClient();
		const json = JSON.stringify({
			version: 1,
			exported_at: FAKE_ISO,
			tables: {
				inbox: [],
				journal_entries: [],
				focus_sessions: [],
				focus_blocks: [],
				settings: [],
			},
		});
		await importData(db, json);
		expect(db.exec).not.toHaveBeenCalled();
	});
});

// ----------------------------------------------------------------------------
// importData — upsert behaviour
// ----------------------------------------------------------------------------

describe("importData — upsert", () => {
	it("calls db.exec once per row across all tables", async () => {
		const db = makeClient();
		const json = JSON.stringify({
			version: 1,
			exported_at: FAKE_ISO,
			tables: {
				inbox: [
					{
						id: "i1",
						content: "hello",
						source: "text",
						processed: 0,
						action: null,
						created_at: FAKE_ISO,
						processed_at: null,
						updated_at: FAKE_ISO,
					},
				],
				journal_entries: [],
				focus_sessions: [],
				focus_blocks: [],
				settings: [{ key: "theme", value: "dark" }],
			},
		});

		const result = await importData(db, json);
		expect(result.imported).toBe(2); // 1 inbox + 1 setting
		expect(db.exec).toHaveBeenCalledTimes(2);
	});

	it("skips rows missing required id and records an error", async () => {
		const db = makeClient();
		const json = JSON.stringify({
			version: 1,
			exported_at: FAKE_ISO,
			tables: {
				inbox: [{ content: "no id here" }],
				journal_entries: [],
				focus_sessions: [],
				focus_blocks: [],
				settings: [],
			},
		});
		const result = await importData(db, json);
		expect(result.skipped).toBe(1);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatch(/id/i);
	});
});

// ----------------------------------------------------------------------------
// previewImport
// ----------------------------------------------------------------------------

describe("previewImport", () => {
	it("returns counts without hitting the db", () => {
		const json = JSON.stringify({
			version: 1,
			exported_at: FAKE_ISO,
			tables: {
				inbox: [{ id: "a" }, { id: "b" }],
				journal_entries: [{ id: "c" }],
				focus_sessions: [],
				focus_blocks: [],
				settings: [{ key: "x", value: "y" }],
			},
		});
		const result = previewImport(json);
		expect("error" in result).toBe(false);
		if (!("error" in result)) {
			expect(result.inbox).toBe(2);
			expect(result.journal_entries).toBe(1);
			expect(result.focus_sessions).toBe(0);
			expect(result.settings).toBe(1);
			expect(result.total).toBe(4);
		}
	});

	it("returns error for invalid JSON", () => {
		const result = previewImport("not json");
		expect("error" in result).toBe(true);
	});

	it("returns error for wrong version", () => {
		const result = previewImport(
			JSON.stringify({
				version: 99,
				exported_at: FAKE_ISO,
				tables: { inbox: [], journal_entries: [], focus_sessions: [], focus_blocks: [], settings: [] },
			}),
		);
		expect("error" in result).toBe(true);
	});
});
