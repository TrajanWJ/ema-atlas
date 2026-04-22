from pathlib import Path
home = Path.home()
repo = home / 'Projects/ema'
docs = repo / 'docs'

(docs / 'OPERATING-REALITY.md').write_text('''# EMA Operating Reality

This is the fastest current-state read for humans and agents.

## Active Runtime

EMA is a **TypeScript-first Electron monorepo**.

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
''')

(docs / 'MEMORY-SYNC.md').write_text('''# EMA Memory Sync

This document is the shared memory policy for EMA-related work across EMA itself, OpenClaw, Claude Code, and Codex.

## Goal

Keep one durable source of operator/project memory instead of letting every tool drift into its own private summary.

## Durable vs Transient

### Durable memory
Write here when the information should survive sessions and be reused:

- architecture decisions
- current runtime truths
- operator preferences that affect implementation
- project conventions
- environment topology / important paths
- workflow rules that multiple tools should follow

Preferred durable homes:

1. `~/.local/share/ema/vault/wiki/` for knowledge-base/wiki content
2. `~/.local/share/ema/operator-memory/` for operator memory and short durable notes
3. repo docs when the memory is repo-specific and should travel with the codebase

### Transient memory
Do **not** promote these unless they matter later:

- scratch notes
- one-off debugging output
- temporary plans
- ephemeral session summaries
- stale branch-specific context

## Shared Source For EMA Repo Work

For work inside `~/Projects/ema`, the read-first shared memory sources are:

1. `docs/OPERATING-REALITY.md`
2. `docs/MEMORY-SYNC.md`
3. `CLAUDE.md`
4. `AGENTS.md`
5. `docs/backend/*`
6. `docs/GROUND-TRUTH.md`
7. `ema-genesis/*` canon docs when architectural intent matters

## Tool Rules

### OpenClaw
- Use repo `AGENTS.md` and `docs/MEMORY-SYNC.md` as the default EMA handoff.
- Do not invent a separate EMA-specific memory blob if a repo doc can hold it.
- When a long-lived lesson is learned, promote it into repo docs or EMA durable storage.

### Claude Code
- Read repo `CLAUDE.md` first.
- Then read `docs/MEMORY-SYNC.md` for durable/transient memory policy.
- Capture durable findings into the EMA wiki or repo docs, not only Claude-local session history.

### Codex
- Read repo `AGENTS.md` first when present.
- Use `docs/MEMORY-SYNC.md` as the durable-memory policy for EMA work.
- Do not rely on Codex local history as the only memory source.

## Concrete Paths

- EMA repo: `~/Projects/ema`
- Shared memory policy: `~/Projects/ema/docs/MEMORY-SYNC.md`
- Operating reality: `~/Projects/ema/docs/OPERATING-REALITY.md`
- Claude repo instructions: `~/Projects/ema/CLAUDE.md`
- Codex/OpenClaw repo instructions: `~/Projects/ema/AGENTS.md`
- EMA durable wiki: `~/.local/share/ema/vault/wiki/`
- Optional operator-memory folder: `~/.local/share/ema/operator-memory/`

## Update Policy

When reality changes:

1. update `docs/OPERATING-REALITY.md`
2. update `docs/MEMORY-SYNC.md` if the memory rules changed
3. update repo `CLAUDE.md` / `AGENTS.md` only if the handoff contract changed
4. promote durable knowledge into the EMA wiki when it belongs there

That keeps all tools pointed at the same source instead of drifting.
''')

(repo / 'AGENTS.md').write_text('''# AGENTS.md

If you are working in the EMA repo, read these first:

1. `docs/OPERATING-REALITY.md`
2. `docs/MEMORY-SYNC.md`
3. `CLAUDE.md`
4. `docs/backend/README.md`
5. `docs/GROUND-TRUTH.md`

## Runtime Truth

- EMA is a **TypeScript-first Electron monorepo**.
- The old Elixir/Phoenix/Tauri stack is archived under `IGNORE_OLD_TAURI_BUILD/`.
- Do not treat archived runtime docs or commands as current operating instructions.

## Memory Policy

- Durable repo/operator memory should be written into shared docs or EMA durable storage.
- Do not rely on tool-local chat/session history as the only memory source.
- Use `docs/MEMORY-SYNC.md` as the cross-tool memory contract.

## For Agents

- Prefer additive doc fixes over sprawling rewrites.
- If you find a stale doc, either fix it or clearly mark it as archival.
- Keep humans and other tools pointed at the same read-first files.
''')

(repo / 'README.md').write_text('''# EMA

EMA is now a TypeScript-first Electron monorepo.

## Read First

Before using or extending EMA, read:

- `docs/OPERATING-REALITY.md`
- `docs/MEMORY-SYNC.md`
- `docs/backend/README.md`
- `docs/backend/SOURCE-OF-TRUTH.md`
- `docs/GROUND-TRUTH.md`

## Primary Workspace

- `apps/electron` — Electron desktop host
- `apps/renderer` — React renderer
- `services` — local HTTP + WebSocket compatibility backend
- `workers` — background watchers and job runtime
- `cli` — TypeScript CLI
- `shared` — shared contracts, schemas, and types
- `tools` — contract extraction and parity tooling

## Legacy Archive

The previous Tauri + Elixir build has been moved under:

- `IGNORE_OLD_TAURI_BUILD/app`
- `IGNORE_OLD_TAURI_BUILD/daemon`
- `IGNORE_OLD_TAURI_BUILD/src-tauri`
- `IGNORE_OLD_TAURI_BUILD/src`

The legacy tree is retained for contract extraction and parity work, not as the active build target.

## Development

```bash
pnpm install
pnpm dev
```

That starts:

- Vite renderer on `:1420`
- local services on `:4488`
- workers
- Electron desktop shell

## Build

```bash
pnpm build
pnpm package:desktop
```

## Contract Work

```bash
pnpm extract:contracts
pnpm parity
```

## Current Direction

The current backend truth is documented in:

- `docs/backend/README.md`
- `docs/backend/SOURCE-OF-TRUTH.md`
- `docs/backend/DEDUPLICATION-DECISIONS.md`
- `docs/backend/ENTITY-CONTRACTS.md`
- `docs/backend/FUTURE-AGENT-HANDOFF-2026-04-12.md`

Broader architecture planning remains in:

- `docs/planning/ELECTRON_FOUNDATION_2026-04-10.md`
- `docs/GROUND-TRUTH.md`
- `docs/BLUEPRINT.md`

## Current Verified State

As of `2026-04-12`:

- `pnpm build` is green across the Electron/TypeScript monorepo
- `pnpm test` is green (`@ema/services` reports `132` passing tests)
- the active backend spine is:
  - filesystem canon in `ema-genesis/`
  - pluralized services in `services/core/{intents,blueprint,executions,spaces,user-state}/`
  - SQLite runtime persistence in `~/.local/share/ema/ema.db`
- backend truth is inspectable at:
  - `docs/backend/*`
  - `GET /api/backend/manifest`
''')

(repo / 'CLAUDE.md').write_text('''# EMA — Executive Management Assistant

> **Canon source of truth lives at `ema-genesis/`.** Read `ema-genesis/EMA-GENESIS-PROMPT.md` first, then `ema-genesis/SCHEMATIC-v0.md`, then `ema-genesis/_meta/CANON-STATUS.md` for the current ruling on doc precedence. Everything else flows from there.

## Read This Before Coding

1. `docs/OPERATING-REALITY.md`
2. `docs/MEMORY-SYNC.md`
3. `docs/backend/README.md`
4. `docs/backend/SOURCE-OF-TRUTH.md`
5. `docs/GROUND-TRUTH.md`
6. `ema-genesis/EMA-GENESIS-PROMPT.md`
7. `ema-genesis/_meta/CANON-STATUS.md`

## What EMA Is

A personal AI desktop app: an autonomous thinking companion + life OS. Open-source, self-hosted, P2P collaborative intelligence environment for humans and AI agents. The full description lives in `ema-genesis/EMA-GENESIS-PROMPT.md`.

## Current Stack

**TypeScript / Electron monorepo (in progress, bootstrap v0.1).** Workspaces:

- `apps/` — Electron desktop host + renderer
- `services/` — local HTTP + WebSocket compatibility backend
- `workers/` — background watchers and job runtime
- `cli/` — TypeScript CLI (`ema <noun> <verb>`)
- `shared/` — shared contracts, schemas, types
- `tools/` — contract extraction and parity tooling
- `hq-api/` and `hq-frontend/` — HQ subsystem (separate scope)
- `ema-genesis/` — **canon graph (Obsidian-style markdown wiki). Read first.**
- `IGNORE_OLD_TAURI_BUILD/` — archived Elixir + Tauri build, reference only

## Old Build (Reference Only)

The previous Elixir/Phoenix daemon + Tauri 2 + React frontend has been archived under `IGNORE_OLD_TAURI_BUILD/` with its own README explaining what is there and how to mine it for reimplementation. **Do not run it as the active stack.** Use it as a spec corpus for porting.

## Rules

- **Canon docs are authoritative.** If they conflict with old code, canon wins.
- **Old code is reference.** Extract patterns, do not treat old runtime commands as current.
- **No legacy drift.** If a doc says Elixir/Phoenix/Tauri is the active path, treat it as stale unless it is explicitly archival.
- **Durable memory belongs in shared sources.** Use `docs/MEMORY-SYNC.md`, repo docs, and EMA durable storage instead of tool-local memory alone.
- **Do not modify `ema-genesis/canon/specs/` or `ema-genesis/canon/decisions/`** without an approved GAC card + proposal in `ema-genesis/intents/`.

## Build & Dev Commands

The verified commands are:

- `pnpm install`
- `pnpm build`
- `pnpm test`
- `pnpm dev`

## Verified Entry Points

When you need the current implemented system reality, start here after the read-first docs:

1. `services/core/backend/manifest.ts`
2. `services/core/intents/service.ts`
3. `services/core/executions/executions.service.ts`
4. `apps/electron/runtime.ts`
5. `workers/src/startup.ts`
''')

(docs / 'DEV_SETUP.md').write_text('''# EMA — Dev Setup Guide

This guide reflects the **current** EMA runtime: the TypeScript-first Electron monorepo.

If you are looking for the old Elixir/Phoenix/Tauri setup, that is archived under `IGNORE_OLD_TAURI_BUILD/` and is not the active development path.

## Read First

- `docs/OPERATING-REALITY.md`
- `docs/MEMORY-SYNC.md`
- `README.md`
- `docs/backend/README.md`
- `docs/GROUND-TRUTH.md`

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | >= 20 | `asdf install nodejs 22.x` or `nvm use 22` |
| pnpm | >= 9 | `npm i -g pnpm` |

## 1. Clone & Enter

```bash
git clone <repo> ema
cd ema
```

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Run the Current Dev Stack

```bash
pnpm dev
```

That starts:

- Vite renderer on `:1420`
- local services on `:4488`
- workers
- Electron desktop shell

## 4. Build

```bash
pnpm build
pnpm package:desktop
```

## 5. Test

```bash
pnpm test
```

## Common Dev Tasks

| Task | Command |
|---|---|
| Start full dev stack | `pnpm dev` |
| Build all packages | `pnpm build` |
| Run tests | `pnpm test` |
| Run lint | `pnpm lint` |
| Package desktop app | `pnpm package:desktop` |
| Extract contracts | `pnpm extract:contracts` |
| Run parity check | `pnpm parity` |

## Runtime Notes

- Current local service port: `4488`
- Current desktop shell: Electron
- Current backend/services stack: TypeScript/Node
- Archived old stack: `IGNORE_OLD_TAURI_BUILD/`

## Troubleshooting

### Port 4488 already in use
```bash
lsof -i :4488 | grep LISTEN
kill -9 <PID>
```

### Fresh install issues
```bash
rm -rf node_modules
pnpm install
```

### Build drift / stale docs
If a doc tells you to run `mix`, `phx.server`, or Tauri as the main path, treat it as stale unless it is clearly marked archival.
''')

for d in [home / '.openclaw/memory', home / '.claude', home / '.codex', home / '.local/share/ema/operator-memory']:
    d.mkdir(parents=True, exist_ok=True)

memory = docs / 'MEMORY-SYNC.md'
for target in [
    home / '.openclaw/memory/EMA-MEMORY-SYNC.md',
    home / '.claude/EMA-MEMORY-SYNC.md',
    home / '.codex/EMA-MEMORY-SYNC.md',
    home / '.local/share/ema/operator-memory/EMA-MEMORY-SYNC.md',
]:
    if target.exists() or target.is_symlink():
        target.unlink()
    target.symlink_to(memory)

claude_home = home / '.claude/CLAUDE.md'
if claude_home.exists():
    text = claude_home.read_text()
    marker = '## EMA Read-First'
    if marker not in text:
        prefix = '''## EMA Read-First

For EMA work, align to these shared sources before relying on local session memory:

- `~/Projects/ema/docs/OPERATING-REALITY.md`
- `~/Projects/ema/docs/MEMORY-SYNC.md`
- `~/Projects/ema/CLAUDE.md`
- `~/Projects/ema/AGENTS.md`

EMA is now a TypeScript/Electron monorepo. The Elixir/Phoenix/Tauri stack is archived/reference-only.

---

'''
        if text.startswith('#'):
            first_nl = text.find('\n')
            text = text[:first_nl+1] + '\n' + prefix + text[first_nl+1:]
        else:
            text = prefix + text
        claude_home.write_text(text)
