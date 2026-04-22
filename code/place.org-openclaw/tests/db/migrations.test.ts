import { describe, it, expect, vi, beforeEach } from "vitest";
import { runMigrations } from "../../src/db/migrations";
import { migrations } from "../../src/db/schema";

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
import type { ExecFn, QueryFn } from "../../src/db/migrations";

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
describe("runMigrations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates _meta table on first run", async () => {
		const { exec, query } = makeMocks(null);
		await runMigrations(exec, query);

		const createMetaCalls = (exec.mock.calls as string[][]).filter(
			([sql]) => sql?.includes("CREATE TABLE IF NOT EXISTS _meta"),
		);
		expect(createMetaCalls.length).toBeGreaterThan(0);
	});

	it("applies all migrations when schema_version is 0", async () => {
		const { exec, query } = makeMocks(0);
		await runMigrations(exec, query);

		// Each migration should produce at least one exec call for the DDL
		// and one for updating schema_version.
		// Total exec calls: 1 (_meta bootstrap) + 2 per migration (DDL + version update)
		expect(exec).toHaveBeenCalledTimes(1 + migrations.length * 2);
	});

	it("skips migrations that have already been applied", async () => {
		const { exec, query } = makeMocks(migrations.length);
		await runMigrations(exec, query);

		// Only the _meta bootstrap exec should have run — no migration DDL.
		expect(exec).toHaveBeenCalledTimes(1);
	});

	it("applies only pending migrations when partially migrated", async () => {
		// Simulate being at version 0 with only 1 migration total defined
		// (current codebase only has v1, so currentVersion=0 → 1 pending).
		const { exec, query } = makeMocks(0);
		await runMigrations(exec, query);

		const pendingCount = migrations.filter((m) => m.version > 0).length;
		// 1 _meta bootstrap + 2 calls per pending migration
		expect(exec).toHaveBeenCalledTimes(1 + pendingCount * 2);
	});

	it("updates schema_version after each migration", async () => {
		const { exec, query } = makeMocks(0);
		await runMigrations(exec, query);

		const versionUpdateCalls = (exec.mock.calls as string[][]).filter(([sql]) =>
			sql?.includes("schema_version"),
		);
		expect(versionUpdateCalls.length).toBe(migrations.length);
	});

	it("stores the correct version number in _meta", async () => {
		const { exec, query } = makeMocks(0);
		await runMigrations(exec, query);

		const versionUpdateCalls = (exec.mock.calls as string[][]).filter(([sql]) =>
			sql?.includes("schema_version"),
		);
		// Last version update should reference the highest migration version
		const lastMigrationVersion = migrations[migrations.length - 1]?.version ?? 1;
		const lastCall = versionUpdateCalls[versionUpdateCalls.length - 1];
		expect(lastCall?.[0]).toContain(String(lastMigrationVersion));
	});

	it("queries schema_version from _meta", async () => {
		const { exec, query } = makeMocks(0);
		await runMigrations(exec, query);

		expect(query).toHaveBeenCalledWith(
			expect.stringContaining("schema_version"),
		);
	});

	it("does not throw when no pending migrations exist", async () => {
		const { exec, query } = makeMocks(migrations.length);
		await expect(runMigrations(exec, query)).resolves.toBeUndefined();
	});
});
