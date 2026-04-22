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

	it("has exactly 3 migrations", () => {
		expect(migrations.length).toBe(3);
		expect(migrations[2]?.version).toBe(3);
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

	it("applies v3 when current version is 2", async () => {
		const { exec, query } = makeMocks(2);
		await runMigrations(exec, query);

		// Should execute v3 DDL + version update = 2 extra calls (+ 1 _meta bootstrap)
		expect(exec).toHaveBeenCalledTimes(3); // 1 bootstrap + 2 for v3
	});

	it("skips v3 when already at version 3", async () => {
		const { exec, query } = makeMocks(3);
		await runMigrations(exec, query);

		// Only the _meta bootstrap
		expect(exec).toHaveBeenCalledTimes(1);
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
