---
id: GAP-CLI-ROT-DIAGNOSTIC
type: gap
layer: reality-vs-expectation
title: "CLI rot diagnostic — why `ema` barely works and what it must become"
status: diagnosed
created: 2026-04-13
scope: "bin/ema, cli/*"
related:
  - "[[13-CLI-GUI-PARITY/CLI-GUI-MIRRORED-WORKSPACE-VISION]]"
  - "[[13-CLI-GUI-PARITY/CLI-GUI-PARITY-CONTRACT-DRAFT]]"
  - "[[10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE]]"
tags: [gap, cli, parity, daemon, v1.1]
---

# CLI Rot Diagnostic

> User-felt symptom: "the CLI is barely functioning."
> This document names what's actually wrong and what the CLI must become
> after the independent daemon lands.

## The two-CLI problem

There are **two** things called `ema` on disk:

1. **`bin/ema`** — a **Python 3** script (`#!/usr/bin/env python3`,
   "EMA CLI — Terminal client for the EMA daemon at localhost:4488",
   version 2.0.0). Leftover from the archived Elixir/Tauri era. Uses
   `urllib` to hit the daemon HTTP directly. Not part of the TS monorepo
   build. Still on `$PATH` from whatever the user installed first.
2. **`cli/`** — a TypeScript commander-based CLI (`cli/src/index.ts`
   imports `commander`, not `oclif` — so the "Oclif CLI" description in
   older planning docs is stale). Commands live under `cli/src/commands/`:
   `backend`, `briefing.ts`, `dump.ts`, `health`, `intent`, `now.ts`,
   `proposal`, `research`. `cli/bin/` has `dev.js` + `run.js` entry
   scripts.

**Consequence:** depending on `$PATH`, `ema <anything>` runs Python against
old-shape assumptions OR runs the TS CLI against the current daemon. The user
can't tell which one fired. Output shapes differ. Error messages differ.

This alone explains "barely functioning": the CLI is a coin flip between two
clients built for two different daemons.

## What the TS CLI actually covers today

```
cli/src/commands/
├── backend/   # subset of backend inspection
├── briefing.ts
├── dump.ts    # brain dump capture
├── health/    # daemon health probe
├── intent/    # intent CRUD subset
├── now.ts     # "what am I doing" — thin summary
├── proposal/  # proposal subset
└── research/  # research subset
```

So ~8 command families, most single-purpose. Compare with:

- canon vApps in `04-CANON/CATALOG.md`: 35.
- wired renderer routes: 34.
- EMA domains in `services/core/*`: ~25.

**Coverage ratio:** the CLI exposes roughly **1 command family per 3+ renderer
routes**. That's not parity with the GUI by any measure — it's a skeleton.

The CLI-GUI parity contract in `13-CLI-GUI-PARITY/CLI-GUI-PARITY-CONTRACT-DRAFT.md`
states "anything important enough to exist in one should be visible/manageable
from the other." Today the CLI is dramatically below that bar.

## Defect classes

### A. Entry point ambiguity (bin/ema Python)

`bin/ema` should not exist in the TS monorepo. It's archived-era code surviving
on PATH.

**Fix:** delete `bin/ema` (or move to `IGNORE_OLD_TAURI_BUILD/bin/ema`),
install the TS CLI as the canonical `ema` entry point. Add a post-install
check in `bin/` or `scripts/` that refuses to run if a Python `ema` is first
on PATH.

**Blast radius:** every CLI invocation. Session-1 fix.

### B. Command surface is a subset, not a mirror

The TS CLI has ~8 command families. The canon object model has many more
(tasks, projects, goals, habits, journal, focus, notes, brain dumps,
responsibilities, agenda, wiki, settings, spaces, chronicle, review,
executions, proposals, intents, feeds, pipes, decisions, agents, ...).

**Fix direction:** CLI command surface should mirror the canon object model,
not the current renderer routes. One command family per canonical object,
driven by the same RPC/HTTP surface the renderer uses. This is NOT a session-1
patch — it depends on the shared object model decision (`01-PLANS/CURRENT-PRIORITIES.md`
item 2) and on sub-project A's stable daemon API.

### C. Daemon coupling assumed local + ad hoc

Both CLIs hardcode `localhost:4488`. Neither does daemon discovery:

- does the daemon exist?
- is it starting up?
- should the CLI spawn it?
- auth?

Today, `localhost:4488` is reachable only when Electron is running (because
Electron spawns `services/` as a child process per
`apps/electron/runtime.ts:100`). So **running the CLI without opening the
Electron app first produces silent connection-refused errors.**

This is the other half of "CLI barely functioning": half the time the
daemon literally isn't there because it's co-tenant to the UI.

**Fix depends on sub-project A.** The independent daemon decision (D2 in the
meta-bootstrap) makes the CLI's connection assumption valid. Until A lands,
any CLI fix is a bandage.

Session-1 bandage: teach the CLI to detect "daemon not running" and print
actionable instructions ("start Electron or run `ema daemon start` (post-A)").
No more silent failures.

### D. Output shapes inconsistent

The TS CLI has no shared output shape. Each command formats its own way.
There's no `--json`, no `--quiet`, no standard error envelope. Agent
consumers can't rely on parseable output.

**Fix:** pick one output contract (commander-compatible helpers emitting
either pretty or JSON) and enforce it in a `cli/src/lib/io.ts` helper.
Session-1-friendly if we pick a minimal envelope now and backfill.

### E. No session/workstream awareness

Per the vision in `13-CLI-GUI-PARITY/CLI-GUI-MIRRORED-WORKSPACE-VISION.md`,
the CLI is supposed to represent "agents in CLI" alongside "humans in GUI"
in a shared workspace. Currently the CLI has no notion of:

- which space/workstream the user is in
- which session they're resuming
- what the last brain dump was
- who else (agent or human) is in the workspace

This isn't fixable in session 1 — it depends on workstream identity
(`14-WORKSTREAMS/WORKSTREAM-IDENTITY-DRAFT.md`) landing as a real object
in the shared spine. But it's the thing that makes the CLI feel like a
peer of the GUI rather than a debug tool.

## What the CLI must become

Per the CLI-GUI parity contract + meta-bootstrap:

1. **One CLI, one entry point.** TypeScript only. `bin/ema` Python retired.
2. **RPC client of the independent daemon.** Post-A, the CLI connects to
   the same Effect-RPC WebSocket the renderer uses, with the same auth
   (bootstrap token → session token). This is not two clients against two
   protocols — it's one client against the same backbone.
3. **Mirror of the canon object model.** `ema tasks`, `ema goals`, `ema
   journal`, `ema focus`, `ema intents`, `ema proposals`, `ema executions`,
   `ema spaces`, `ema dump`, etc. Each family has CRUD + watch/tail where
   relevant.
4. **Workstream-aware.** `ema space use <slug>`, `ema session resume <id>`,
   `ema now` reports from the current workstream.
5. **Agent-friendly.** `--json`, `--quiet`, structured errors, tailable
   streams. Agents should be able to script against it without scraping.
6. **Daemon lifecycle commands.** `ema daemon start|stop|status|logs` —
   introduced in sub-project A.

## Session ordering for CLI work

| Order | Change | Depends on |
|---|---|---|
| 1 | Delete Python `bin/ema`, make TS CLI canonical on PATH | nothing |
| 2 | Standardize output envelope (`--json`, error shape) | nothing |
| 3 | Detect "daemon missing" and print actionable error | nothing |
| 4 | Mirror `capture-error` helper from renderer for parity | GUI session-1 fix |
| 5 | Expose daemon lifecycle commands | sub-project A ships |
| 6 | Replace HTTP client with Effect-RPC client against daemon | sub-project A ships |
| 7 | Expand command surface to mirror canon objects | shared object model decided |
| 8 | Workstream/session awareness | workstream identity lands |

Items 1–3 are session-1 bandages. 4 rides with the GUI fix. 5–6 ride with
sub-project A. 7 rides with the object-model decision. 8 rides with the
workstream-identity decision.

## What this diagnostic does NOT cover

- The CLI README / docs — whatever they promise is mostly aspirational.
  Rewrite them after session 1 to reflect real surface.
- Remote/P2P CLI use — out of scope until auth + daemon identity are
  settled (post-A).
- Replacing `commander` with `oclif` — not needed. Commander works.
  Older planning docs calling this "Oclif CLI" are stale.

## Pointers

- `cli/src/index.ts` — current entry.
- `bin/ema` — Python ghost to retire.
- `13-CLI-GUI-PARITY/CLI-GUI-PARITY-CONTRACT-DRAFT.md` — target end-state.
- `10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md` — D2
  independent daemon + D3 Effect RPC.
- `01-PLANS/v1.1-EXECUTION-ROADMAP-2026-04-13.md` — where CLI items sit
  in the build order.
