import { migrations } from "./schema";

export type ExecFn = (sql: string) => Promise<void>;
export type QueryFn = (
	sql: string,
	params?: readonly unknown[],
) => Promise<readonly Record<string, unknown>[]>;

export async function runMigrations(exec: ExecFn, query: QueryFn): Promise<void> {
	// Ensure _meta table exists before we query it
	await exec(`
		CREATE TABLE IF NOT EXISTS _meta (
			key   TEXT PRIMARY KEY,
			value TEXT NOT NULL
		)
	`);

	const rows = await query("SELECT value FROM _meta WHERE key = 'schema_version'");
	const currentVersion =
		rows.length > 0 && rows[0] !== undefined
			? parseInt(String(rows[0]["value"]), 10)
			: 0;

	const pending = migrations.filter((m) => m.version > currentVersion);

	for (const migration of pending) {
		await exec(migration.sql);
		await exec(
			`INSERT INTO _meta (key, value) VALUES ('schema_version', '${migration.version}')
			ON CONFLICT(key) DO UPDATE SET value = '${migration.version}'`,
		);
	}
}
