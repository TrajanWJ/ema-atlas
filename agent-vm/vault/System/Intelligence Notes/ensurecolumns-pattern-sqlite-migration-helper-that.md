---
title: "_ensure_columns() Pattern: SQLite Idempotent Schema Migration"
type: technique
created: 2026-03-24
updated: 2026-04-16
confidence: high
source: "ClaudeForge intelligence tracker (tracker.py)"
tags: [sqlite, migration, schema-evolution, idempotent, python, technique]
summary: "Idempotent column-addition guard for SQLite tables that may have been created by different tools with varying schemas"
---

# _ensure_columns() Pattern: SQLite Idempotent Schema Migration

A defensive programming pattern for SQLite databases where multiple writers (bash scripts, Python modules, different agent versions) may create or modify the same tables with different column sets. Instead of running destructive `DROP TABLE` / `CREATE TABLE` migrations, `_ensure_columns()` inspects the live schema via `PRAGMA table_info()` and adds only the columns that are missing.

## The Problem

In multi-tool systems like [[Agent-Queue-System|dispatch/ClaudeForge]], a single SQLite database (`dispatch.db`, `ClaudeForge.db`) may be written to by:

1. **Bash scripts** that created the original table with a minimal column set
2. **Python modules** that expect additional columns added in later versions
3. **Different agent versions** running concurrently with different schema expectations

Traditional migration frameworks (Alembic, Django migrations, golang-migrate) assume a single migration authority. When multiple tools independently create tables, version-tracked migrations break — migration 003 tries to `ALTER TABLE` a column that bash already added, or Python crashes on `INSERT` because bash never created the `domain` column.

## The Pattern

```python
def _ensure_columns(
    self,
    conn: sqlite3.Connection,
    table: str,
    required_columns: dict[str, str],
) -> None:
    """Add any missing columns to an existing table (idempotent)."""
    existing = {
        row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()
    }
    for col_name, col_def in required_columns.items():
        if col_name not in existing:
            try:
                conn.execute(
                    f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"
                )
            except Exception:
                pass  # may fail if default constraints can't be applied
```

### How It Works

1. **Introspect**: `PRAGMA table_info(table_name)` returns one row per column. Field index 1 is the column name. Collect existing column names into a set.
2. **Diff**: Compare required columns against existing columns. Only missing columns need action.
3. **Add**: `ALTER TABLE ... ADD COLUMN` for each missing column. SQLite requires a default value for columns added to non-empty tables, so column definitions should include `DEFAULT` clauses.
4. **Swallow failures gracefully**: If a column can't be added (e.g., `NOT NULL` without `DEFAULT` on a non-empty table), catch and continue. This keeps the system running even if one column addition fails.

### Usage in ClaudeForge

The pattern is called at database open time, after version-tracked migrations but before any queries:

```python
# Always ensure required columns exist, even on pre-existing DBs
# (handles tables created by older bash script versions)
self._ensure_columns(conn, "pipeline_runs", {
    "complexity_score": "INTEGER NOT NULL DEFAULT 0",
    "domain": "TEXT NOT NULL DEFAULT ''",
    "pipeline_path": "TEXT NOT NULL DEFAULT ''",
    "agent": "TEXT NOT NULL DEFAULT ''",
    "source_channel": "TEXT",
    "raw_input_hash": "TEXT",
    "prompt_template_version": "TEXT",
    "vault_ref_hash": "TEXT",
    "started_at": "TEXT NOT NULL DEFAULT ''",
    "completed_at": "TEXT",
    "status": "TEXT NOT NULL DEFAULT 'running'",
})
```

## Key Design Decisions

**Why not just use a migration framework?** Migration frameworks track a linear version history. When bash script v1 creates a table and Python v3 expects extra columns, there's no shared version counter. `_ensure_columns()` is convergent — it reaches the correct state regardless of starting point.

**Why swallow exceptions?** SQLite's `ALTER TABLE ADD COLUMN` has restrictions: you can't add a `NOT NULL` column without a `DEFAULT` to a table that already has rows (in older SQLite versions). Swallowing the error means partial progress is preserved — 9 of 10 columns added is better than crashing on column 3 and getting none.

**Why not `CREATE TABLE IF NOT EXISTS` with all columns?** That only works for table creation, not column addition. If the table already exists with 5 columns and you need 11, `CREATE TABLE IF NOT EXISTS` is a no-op.

## Limitations

- **SQLite only**: PostgreSQL, MySQL have different `ALTER TABLE` semantics and better migration tooling. This pattern is specifically valuable for SQLite's constraints (no `DROP COLUMN` before 3.35, limited `ALTER TABLE`).
- **No column type changes**: Can only add columns, not modify existing ones. If a column type needs to change, you need a table rebuild.
- **No column removal**: Additive only. Dead columns accumulate over time.
- **Silent failures**: The broad `except Exception: pass` can hide real problems. In production, this should at minimum log the failure.

## When to Use This Pattern

- Multi-tool systems where bash/Python/different versions write to the same SQLite database
- Embedded databases where you can't run a migration server
- Systems where [[database-migrations|formal migration frameworks]] are overkill or can't track cross-language schema changes
- Any scenario where the table's creator is not the same tool that reads from it

## Related Patterns

- **Idempotent migrations**: The broader principle — migrations that can run multiple times safely. `_ensure_columns()` is one implementation.
- **Schema-on-read**: Instead of enforcing schema at write time, handle missing columns at read time with `COALESCE` or column existence checks. More flexible but pushes complexity to every query.
- **[[config-add-modelhint--complexity-fields-to-dispatch-task-|Dispatch task schema evolution]]**: Another instance of schema changes in the dispatch system.

## References

- SQLite documentation on [ALTER TABLE](https://www.sqlite.org/lang_altertable.html) — covers the restrictions that make this pattern necessary
- SQLite [PRAGMA table_info](https://www.sqlite.org/pragma.html#pragma_table_info) — the introspection mechanism
- Original implementation: `intelligence/tracker.py` in ClaudeForge coder workspace (2026-03-24)
