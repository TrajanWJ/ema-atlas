import { describe, it, expect, vi, beforeEach } from "vitest";
import { runMigrations } from "../../src/db/migrations";
import type { ExecFn, QueryFn } from "../../src/db/migrations";
import { migrations } from "../../src/db/schema";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function makeMocks(schemaVersion: number | null = null): {
	exec: ExecFn & ReturnType<typeof vi.fn>;
	query: QueryFn & ReturnType<typeof vi.fn>;
} {
	const query = vi.fn().mockImplementation(async (sql: string) => {
		if (sql.includes("schema_version")) {
			if (schemaVersion === null) return [];
			return [{ value: String(schemaVersion) }];
		}
		return [];
	}) as unknown as QueryFn & ReturnType<typeof vi.fn>;
	const exec = vi.fn().mockResolvedValue(undefined) as unknown as ExecFn & ReturnType<typeof vi.fn>;
	return { exec, query };
}

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------
describe("v3 migration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("has at least 3 migrations including v4", () => {
		expect(migrations.length).toBeGreaterThanOrEqual(4);
		expect(migrations[2]?.version).toBe(3);
		expect(migrations[3]?.version).toBe(4);
	});

	it("v3 migration SQL creates tasks table", () => {
		const v3 = migrations.find((m) => m.version === 3);
		expect(v3?.sql).toContain("CREATE TABLE IF NOT EXISTS tasks");
	});

	it("v3 migration SQL creates goals table", () => {
		const v3 = migrations.find((m) => m.version === 3);
		expect(v3?.sql).toContain("CREATE TABLE IF NOT EXISTS goals");
	});

	it("v3 migration SQL creates habits table", () => {
		const v3 = migrations.find((m) => m.version === 3);
		expect(v3?.sql).toContain("CREATE TABLE IF NOT EXISTS habits");
	});

	it("v3 migration SQL creates habit_logs table", () => {
		const v3 = migrations.find((m) => m.version === 3);
		expect(v3?.sql).toContain("CREATE TABLE IF NOT EXISTS habit_logs");
	});

	it("v3 migration SQL creates reviews table", () => {
		const v3 = migrations.find((m) => m.version === 3);
		expect(v3?.sql).toContain("CREATE TABLE IF NOT EXISTS reviews");
	});

	it("applies v3+ when current version is 2", async () => {
		const { exec, query } = makeMocks(2);
		await runMigrations(exec, query);

		const pending = migrations.filter((m) => m.version > 2).length;
		// 1 bootstrap + 2 per pending migration (sql + version update)
		expect(exec).toHaveBeenCalledTimes(1 + pending * 2);
	});

	it("skips v3 and v4 when already at version 4", async () => {
		const { exec, query } = makeMocks(4);
		await runMigrations(exec, query);

		const pending = migrations.filter((m) => m.version > 4).length;
		// 1 bootstrap + 2 per pending migration
		expect(exec).toHaveBeenCalledTimes(1 + pending * 2);
	});

	it("applies all 3 migrations from scratch", async () => {
		const { exec, query } = makeMocks(0);
		await runMigrations(exec, query);

		// 1 bootstrap + 2 per migration * 3 migrations
		expect(exec).toHaveBeenCalledTimes(1 + migrations.length * 2);
	});

	it("tasks table has priority column with correct schema", () => {
		const v3 = migrations.find((m) => m.version === 3);
		expect(v3?.sql).toContain("priority");
		expect(v3?.sql).toContain("DEFAULT 'should'");
	});
});
