import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	addInboxItem,
	getUnprocessedItems,
	getProcessedItems,
	processItem,
	deleteItem,
	getUnprocessedCount,
} from "../../src/db/queries/inbox";
import type { DbClient } from "../../src/db/client";

// ----------------------------------------------------------------------------
// Mock DbClient
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

// Stable fake ISO date for assertions
const FAKE_ISO = "2026-03-20T12:00:00.000Z";

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------
describe("addInboxItem", () => {
	it("inserts a row and returns an InboxItem", async () => {
		const db = makeClient();
		const item = await addInboxItem(db, "hello world");

		expect(item.content).toBe("hello world");
		expect(item.source).toBe("text");
		expect(item.processed).toBe(false);
		expect(item.action).toBeNull();
		expect(item.processedAt).toBeNull();
		expect(typeof item.id).toBe("string");
		expect(item.id.length).toBeGreaterThan(0);
	});

	it("accepts voice source", async () => {
		const db = makeClient();
		const item = await addInboxItem(db, "spoken note", "voice");
		expect(item.source).toBe("voice");
	});

	it("calls exec with correct SQL", async () => {
		const db = makeClient();
		await addInboxItem(db, "test content");

		expect(db.exec).toHaveBeenCalledOnce();
		const [sql, params] = (db.exec as ReturnType<typeof vi.fn>).mock.calls[0] as [
			string,
			unknown[],
		];
		expect(sql).toContain("INSERT INTO inbox");
		expect(params).toContain("test content");
		expect(params).toContain("text");
	});
});

describe("getUnprocessedItems", () => {
	it("returns empty array when no rows", async () => {
		const db = makeClient();
		const items = await getUnprocessedItems(db);
		expect(items).toEqual([]);
	});

	it("maps rows to InboxItem domain objects", async () => {
		const db = makeClient({
			query: async () => [
				{
					id: "abc",
					content: "note",
					source: "text",
					processed: 0,
					action: null,
					created_at: FAKE_ISO,
					processed_at: null,
					updated_at: FAKE_ISO,
				},
			],
		});
		const items = await getUnprocessedItems(db);
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			id: "abc",
			content: "note",
			source: "text",
			processed: false,
			action: null,
			createdAt: FAKE_ISO,
			processedAt: null,
			updatedAt: FAKE_ISO,
		});
	});

	it("queries only unprocessed rows", async () => {
		const db = makeClient();
		await getUnprocessedItems(db);
		const [sql] = (db.query as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
		expect(sql).toContain("processed = 0");
	});
});

describe("getProcessedItems", () => {
	it("queries only processed rows", async () => {
		const db = makeClient();
		await getProcessedItems(db);
		const [sql] = (db.query as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
		expect(sql).toContain("processed = 1");
	});
});

describe("processItem", () => {
	it("calls exec with correct UPDATE sql", async () => {
		const db = makeClient();
		await processItem(db, "item-id", "task");

		expect(db.exec).toHaveBeenCalledOnce();
		const [sql, params] = (db.exec as ReturnType<typeof vi.fn>).mock.calls[0] as [
			string,
			unknown[],
		];
		expect(sql).toContain("UPDATE inbox");
		expect(sql).toContain("processed = 1");
		expect(params).toContain("task");
		expect(params).toContain("item-id");
	});
});

describe("deleteItem", () => {
	it("calls exec with DELETE sql and correct id", async () => {
		const db = makeClient();
		await deleteItem(db, "del-id");

		const [sql, params] = (db.exec as ReturnType<typeof vi.fn>).mock.calls[0] as [
			string,
			unknown[],
		];
		expect(sql).toContain("DELETE FROM inbox");
		expect(params).toContain("del-id");
	});
});

describe("getUnprocessedCount", () => {
	it("returns 0 when no rows", async () => {
		const db = makeClient();
		const count = await getUnprocessedCount(db);
		expect(count).toBe(0);
	});

	it("returns numeric count from query result", async () => {
		const db = makeClient({
			query: async () => [{ count: 7 }],
		});
		const count = await getUnprocessedCount(db);
		expect(count).toBe(7);
	});

	it("queries only unprocessed rows", async () => {
		const db = makeClient({ query: async () => [{ count: 0 }] });
		await getUnprocessedCount(db);
		const [sql] = (db.query as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
		expect(sql).toContain("processed = 0");
	});
});
