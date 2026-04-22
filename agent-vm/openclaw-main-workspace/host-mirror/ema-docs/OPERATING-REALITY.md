# EMA Operating Reality

This is the fastest current-state read for humans and agents.

## Active Runtime

EMA is a **TypeScript-first Electron monorepo**.
Architecturally, EMA should still be reasoned about as a local daemon-like control/runtime system, but the active implementation of that role is the TypeScript `services` + `workers` stack rather than the archived Elixir daemon tree.

Active surfaces:

- `apps/electron` — Electron desktop host
- `apps/renderer` — React renderer
- `services` — local HTTP + WebSocket compatibility backend
- `workers` — background watchers and job runtime
- `cli` — TypeScript CLI
- `shared` — contracts, schemas, types

## Not The Active Runtime

The old Elixir/Phoenix/Tauri stack is **archived** under `IGNORE_OLD_TAURI_BUILD/`.

Use that tree for:
- contract extraction
- parity/reference work
- architectural archaeology

Do **not** treat it as the current runtime.
Do **not** tell operators to run `mix`, `phx.server`, or Tauri commands unless you are explicitly working inside the archive for salvage/reference purposes.

## Read First

When you need current truth, read in this order:

1. `README.md`
2. `docs/OPERATING-REALITY.md`
3. `docs/MEMORY-SYNC.md`
4. `docs/backend/README.md`
5. `docs/backend/SOURCE-OF-TRUTH.md`
6. `docs/GROUND-TRUTH.md`
7. `ema-genesis/EMA-GENESIS-PROMPT.md`
8. `ema-genesis/_meta/CANON-STATUS.md`

## Current Working Rules

- Prefer TypeScript/Electron paths over legacy daemon/app paths.
- Treat `ema-genesis/` as canon/spec territory.
- Treat `docs/backend/*` and `docs/GROUND-TRUTH.md` as the best description of the current implemented system.
- If a doc says Elixir/Phoenix/Tauri is the active path, it is stale unless it is explicitly marked archival.

## Memory & Cross-Tool Handoff

Shared operating memory for EMA-related work lives in:

- `docs/MEMORY-SYNC.md` — policy + pointers
- `~/.local/share/ema/operator-memory/` — durable operator notes, if/when created
- `~/.local/share/ema/vault/wiki/` — durable knowledge base / wiki material

Tool-specific surfaces should **reference** the shared memory doc rather than inventing their own incompatible summary.

- OpenClaw → point agent instructions / notes at `docs/MEMORY-SYNC.md`
- Claude Code → read `CLAUDE.md` plus `docs/MEMORY-SYNC.md`
- Codex → read repo `AGENTS.md` plus `docs/MEMORY-SYNC.md`

## Verification Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

Default local service port remains `:4488` in the current TS runtime.

## Runtime Recovery Note — 2026-04-13

- If `./bin/ema status` reports the daemon unreachable, verify the actual service startup path before trusting the CLI hint text. The Python wrapper still carries old Elixir-era recovery suggestions, but the active runtime is the TypeScript services stack.
- On the host verified in this pass, `services/dist/startup.js` required `~/.nvm/versions/node/v22.22.1/bin/node`; running it under the host default `node` (`v20.20.1`) failed because `better-sqlite3` had been built for Node ABI `127` / Node 22.
- The live SQLite file at `~/.local/share/ema/ema.db` also required a compatibility repair: `calendar_entries` was missing `task_id`, so startup failed until `ALTER TABLE calendar_entries ADD COLUMN task_id TEXT;` was applied.
- For durable host-side recovery from remote operator sessions, prefer `systemd-run --user` units over plain detached shell jobs for `services/dist/startup.js` and `workers/dist/startup.js`.


## Durable recovery now lives in-repo

- EMA now carries checked-in Linux user-systemd units in `runtime/systemd/`.
- `./scripts/install-runtime.sh` is the supported host repair/install path. It resolves a Node 22 binary, rebuilds the monorepo, installs `ema-services` and `ema-workers`, reloads user systemd, restarts both units, and waits for `/api/health`.
- `services/core/calendar/schema.ts` now performs additive column repair before creating indexes, so boot no longer depends on manually adding `calendar_entries.task_id`.
