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
// v2 migration tests
// ----------------------------------------------------------------------------
describe("v2 migration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("schema includes version 2", () => {
		expect(migrations.some((m) => m.version === 2)).toBe(true);
	});

	it("v2 sql creates journal_entries table", () => {
		const v2 = migrations.find((m) => m.version === 2);
		expect(v2?.sql).toContain("journal_entries");
	});

	it("v2 sql creates focus_sessions table", () => {
		const v2 = migrations.find((m) => m.version === 2);
		expect(v2?.sql).toContain("focus_sessions");
	});

	it("v2 sql creates focus_blocks table", () => {
		const v2 = migrations.find((m) => m.version === 2);
		expect(v2?.sql).toContain("focus_blocks");
	});

	it("applies v2 when at version 1", async () => {
		const { exec, query } = makeMocks(1);
		await runMigrations(exec, query);

		// Applies v2 and v3: 1 bootstrap + 2 calls per migration = 1 + 2*2 = 5
		const pendingFromV1 = migrations.filter((m) => m.version > 1).length;
		expect(exec).toHaveBeenCalledTimes(1 + pendingFromV1 * 2);
	});

	it("skips v2 when already at version 2", async () => {
		const { exec, query } = makeMocks(2);
		await runMigrations(exec, query);

		// Applies only migrations after v2: 1 bootstrap + 2 per pending migration
		const pendingFromV2 = migrations.filter((m) => m.version > 2).length;
		expect(exec).toHaveBeenCalledTimes(1 + pendingFromV2 * 2);
	});

	it("applies all migrations from fresh db", async () => {
		const { exec, query } = makeMocks(0);
		await runMigrations(exec, query);

		// 1 bootstrap + 2 per migration
		expect(exec).toHaveBeenCalledTimes(1 + migrations.length * 2);
	});

	it("v2 migration SQL includes one_thing column in journal_entries", () => {
		const v2 = migrations.find((m) => m.version === 2);
		expect(v2?.sql).toContain("one_thing");
	});

	it("v2 migration SQL includes energy columns in journal_entries", () => {
		const v2 = migrations.find((m) => m.version === 2);
		expect(v2?.sql).toContain("energy_p");
		expect(v2?.sql).toContain("energy_m");
		expect(v2?.sql).toContain("energy_e");
	});

	it("v2 migration SQL includes session_id FK in focus_blocks", () => {
		const v2 = migrations.find((m) => m.version === 2);
		expect(v2?.sql).toContain("session_id");
	});
});
