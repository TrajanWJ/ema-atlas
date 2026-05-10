import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { EMA_ACTIVE_BUILD, DESKTOP_ROOT } from "../workspace-state.js";

export const CANONICAL_DB = process.env.EMA_CANONICAL_DB ?? join(EMA_ACTIVE_BUILD, "apps", "daemon", "canonical.db");

export interface SqliteStatus {
  readonly ok: boolean;
  readonly path: string;
  readonly exists: boolean;
  readonly wal_exists: boolean;
  readonly shm_exists: boolean;
  readonly size_bytes: number | null;
  readonly user_version: number | null;
  readonly tables: readonly string[];
  readonly table_counts: Record<string, number>;
  readonly recent_event_kinds: readonly { kind: string; count: number }[];
  readonly duplicate_artifacts: readonly string[];
  readonly error?: string;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function stableId(prefix: string, value: string): string {
  return `${prefix}:${sha256(value).slice(0, 16)}`;
}

export function safeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._:-]+/g, "_");
}

export function sqlEscape(value: string): string {
  return value.replaceAll("'", "''");
}

export function readText(path: string): string {
  return readFileSync(path, "utf8");
}

export function writeText(path: string, value: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

export function parseLimit(raw: string | undefined, fallback: number, max = 500): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

export function sqliteJson<T = Record<string, unknown>>(db: string, sql: string): T[] {
  const out = execFileSync("sqlite3", ["-json", db, sql], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  }).trim();
  if (!out) return [];
  return JSON.parse(out) as T[];
}

export function sqliteExec(db: string, sql: string): void {
  mkdirSync(dirname(db), { recursive: true });
  execFileSync("sqlite3", [db, sql], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

export function dbStatus(db = CANONICAL_DB): SqliteStatus {
  if (!existsSync(db)) {
    return {
      ok: false,
      path: db,
      exists: false,
      wal_exists: existsSync(`${db}-wal`),
      shm_exists: existsSync(`${db}-shm`),
      size_bytes: null,
      user_version: null,
      tables: [],
      table_counts: {},
      recent_event_kinds: [],
      duplicate_artifacts: findDuplicateDbs(),
      error: "canonical database not found",
    };
  }
  try {
    const tables = sqliteJson<{ name: string }>(
      db,
      "select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name;",
    ).map((row) => row.name);
    const counts: Record<string, number> = {};
    for (const table of tables) {
      const rows = sqliteJson<{ count: number }>(db, `select count(*) as count from '${sqlEscape(table)}';`);
      counts[table] = Number(rows[0]?.count ?? 0);
    }
    const recentKinds = tables.includes("events")
      ? sqliteJson<{ kind: string; count: number }>(
          db,
          "select kind, count(*) as count from events group by kind order by count desc, kind limit 80;",
        )
      : [];
    const userVersion = sqliteJson<{ user_version: number }>(db, "pragma user_version;")[0]?.user_version ?? null;
    return {
      ok: true,
      path: db,
      exists: true,
      wal_exists: existsSync(`${db}-wal`),
      shm_exists: existsSync(`${db}-shm`),
      size_bytes: statSync(db).size,
      user_version: Number(userVersion),
      tables,
      table_counts: counts,
      recent_event_kinds: recentKinds,
      duplicate_artifacts: findDuplicateDbs(),
    };
  } catch (err) {
    return {
      ok: false,
      path: db,
      exists: true,
      wal_exists: existsSync(`${db}-wal`),
      shm_exists: existsSync(`${db}-shm`),
      size_bytes: statSync(db).size,
      user_version: null,
      tables: [],
      table_counts: {},
      recent_event_kinds: [],
      duplicate_artifacts: findDuplicateDbs(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function findDuplicateDbs(): string[] {
  const dir = join(EMA_ACTIVE_BUILD, "apps", "daemon");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /^canonical .*\.db/.test(name) || /^canonical .*\.db-(wal|shm)$/.test(name))
    .map((name) => join(dir, name));
}

export function commandExists(name: string): boolean {
  return spawnSync("which", [name], { encoding: "utf8" }).status === 0;
}

export function projectRegistry(project = "proslync-app-ios-final") {
  const roots = {
    app: join(DESKTOP_ROOT, "Active builds", "proslync-app-ios-final"),
    backend: join(DESKTOP_ROOT, "Active builds", "proslync-backend"),
    desktop: join(DESKTOP_ROOT, "Active builds", "proslync-desktop"),
    assets: join(DESKTOP_ROOT, "Active builds", "proslync-presentation-assets-final"),
  };
  return {
    ok: true,
    command: "project.registry.show",
    source: "local_project_registry",
    authority: "file_backed_registry",
    project,
    client: project === "proslync-app-ios-final" ? "Ms. Wilson / Proslync" : null,
    active_builds: Object.entries(roots).map(([id, path]) => ({
      id,
      path,
      exists: existsSync(path),
    })),
    canonical_docs: [
      join(roots.app, "PLAN.md"),
      join(roots.app, "research-plane", "cross-pollinators", "identity-absorption-product-plan-2026-05-09.md"),
      join(roots.assets, "docs", "plans", "proslync-role-happiness-master-plan-2026-05-09", "README.md"),
    ].map((path) => ({ path, exists: existsSync(path) })),
    acceptance_commands: [
      "ema bootstrap status --project proslync-app-ios-final --json",
      "ema capability assert --required lane,queue,agent,harness,intention,db,artifact,execution --project proslync-app-ios-final --json",
      "ema db status --json",
      "ema execution list --project proslync-app-ios-final --json",
      "ema cockpit workpack --project proslync-app-ios-final --json",
    ],
  };
}
