---
id: GAP-MISSING-FEATURES-LEDGER
type: gap-ledger
layer: canon-vs-reality
title: "Missing features ledger — everything that EMA needs but doesn't have"
status: draft
created: 2026-04-13
scope: "entire system — services, workers, renderer, CLI, host-ops"
related:
  - "[[11-GAPS/2026-04-13-FORENSIC-AUDIT-GAP-LEDGER]]"
  - "[[11-GAPS/GUI-ROT-DIAGNOSTIC-2026-04-13]]"
  - "[[11-GAPS/CONVERGENCE-DEBT-SUMMARY]]"
  - "[[13-CLI-GUI-PARITY/RENDERER-APP-TRIAGE-LEDGER-2026-04-13]]"
  - "[[04-CANON/CATALOG.md]]"
  - "[[01-PLANS/v1.1-EXECUTION-ROADMAP-2026-04-13]]"
tags: [gap, missing, features, roadmap, v1.1, capture]
---

# Missing Features Ledger

> "Every single thing that is missing" — flattened into a single table so
> nothing falls through between canon (target shape), planning (intent to
> build), and reality (what ships).
>
> Each row is a concrete deliverable, not a theme. Priority is blunt:
> **P0** = blocks daily use, **P1** = blocks v1.1 dogfooding, **P2** = v1.2+.
> Status is: `missing`, `partial`, `ghost` (shell exists, no backend),
> `drift` (exists but wrong shape).

## Domain: Execution & Control Plane

| # | Feature | Priority | Status | Evidence | Target |
|---|---|---|---|---|---|
| 1 | Actual agent executor on approved execution | P0 | missing | `executions/executions.service.ts:459` creates row and stops | Fold `agent-runtime/` SDK loop into services or registered worker |
| 2 | Bootstrap loud-fail at startup | P0 | drift | `services/startup.ts:124 .catch(() => {})` | Remove catch, surface error on `/api/health` |
| 3 | SQLite ↔ `ema-genesis/` sync integrity check at boot | P0 | missing | No verification step exists | Ingestion diff + fail-closed on divergence |
| 4 | `runtimePoller.start()` actually called | P1 | ghost | `services/core/actors/runtime-poller.ts:83` — singleton created, never started | Call in `services/startup.ts` or delete |
| 5 | Cron installation for `system:daily` / `system:weekly` triggers | P1 | ghost | `services/core/pipes/triggers/system.ts:24-40` defined, no scheduler | `node-cron` registration at boot |
| 6 | Incident authority (concept + API + persistence) | P2 | missing | `grep -r "incident"` = 0 hits | Design post-A, depends on event spine |
| 7 | Execution cancellation / pause / resume | P2 | missing | `backend execution` CLI has cancel but no backend handler | API + persistence |
| 8 | Proposal pipeline stages (generate/refine/debate/tag/schedule) | P2 | ghost | `workers/proposal-engine/index.ts` all stubs | Specify or delete — currently misleads |
| 9 | Agent session pool / registry | P2 | missing | No manager; `agent-runtime/` uses in-memory `Map` | Depends on executor (#1) |
| 10 | Dead-letter for failed intent↔execution linkage | P2 | partial | `executions.service.ts:408-414` `catch {}` with TODO | Real retry/queue |

## Domain: Surfaces — Renderer shell

| # | Feature | Priority | Status | Evidence | Target |
|---|---|---|---|---|---|
| 11 | Top-bar spaces switcher (real) | P0 | drift | See [[05-WIKI/TOP-BAR-SPACES-ORGS-SPEC]] | New spec |
| 12 | Top-bar organizations switcher | P0 | missing | Untracked `services/core/organizations/` dir exists, no UI | See [[05-WIKI/TOP-BAR-SPACES-ORGS-SPEC]] |
| 13 | Daemon status indicator (connected/degraded/offline) | P0 | missing | No visual for WS connection state | Shell status pill |
| 14 | Workstream/session identity badge | P0 | partial | `14-WORKSTREAMS/` drafts exist; no UI | Thread-of-work indicator in top bar |
| 15 | Global command palette (cmd+k) | P1 | partial | `ema:navigate` IPC exists, no palette UI | Full fuzzy-search command surface |
| 16 | Error surface replacing "error unknown" | P0 | drift | `apps/renderer/src/lib/api.ts:37` collapses all failures to `"unknown"` | Typed error boundary + per-store error state |
| 17 | Settings redesign (scoped + organized) | P0 | drift | See [[05-WIKI/SETTINGS-OBJECT-SPEC]] | New spec |
| 18 | Real launchpad with working-routes-only filter | P1 | drift | Launchpad lists 10 ghost routes | Hide routes with `status: 'quarantine'` |
| 19 | Window manager state persistence across daemon restart | P2 | partial | `window-manager.ts:28,32 .catch(() => {})` swallows load errors | |
| 20 | Multi-window vApp isolation (BrowserWindow-per-vApp) | P2 | missing | Deferred to sub-project C | See SUBPROJECT-A spec non-goals |

## Domain: Surfaces — Renderer vApps (see triage ledger for per-route)

| # | Feature | Priority | Status | Evidence | Target |
|---|---|---|---|---|---|
| 21 | Tasks — contract-drift fixes | P0 | partial | per [[13-CLI-GUI-PARITY/RENDERER-APP-TRIAGE-LEDGER-2026-04-13]] #4 | KEEP-AND-WIRE |
| 22 | Brain Dump — contract drift | P0 | partial | triage #3 | KEEP-AND-WIRE |
| 23 | Wiki — write/navigation drift | P1 | partial | triage #10 | KEEP-AND-WIRE |
| 24 | Blueprint/Schematic Planner merge + event-spine rebuild | P1 | partial | triage #8, #9 | REBUILD-ON-A |
| 25 | Goals vApp (proper surface, not just routes) | P1 | partial | `goals-store.ts` exists | Wire end-to-end |
| 26 | Pipes vApp | P1 | partial | `pipeBus` exists | KEEP-AND-WIRE |
| 27 | Quarantine placeholder component (replaces 10 ghost `ConnectedDraftApp` routes) | P0 | missing | 10 shells in `App.tsx:88-141` | `<NotWiredYet />` per triage spec |
| 28 | Governance vApp real implementation | P2 | drift | `GovernanceApp.tsx` 902 LOC mocked "heuristic trust" | Rebuild or delete |

## Domain: CLI

| # | Feature | Priority | Status | Evidence | Target |
|---|---|---|---|---|---|
| 29 | Decomposition — 2159 LOC → per-domain command files | P0 | drift | `cli/src/index.ts` | See [[01-PLANS/2026-04-13-FRONTEND-BUILDOUT-PLAN]] §CLI |
| 30 | `ema daemon {start,stop,status,restart,install,logs}` | P0 | missing | Required for daemon extraction UX | New command |
| 31 | `ema project view` (referenced in CLAUDE.md) | P1 | missing | No `project` command group | Add |
| 32 | Zod response validation on `ServiceConnection` | P1 | missing | `cli/src/lib/service-connection.ts` — TS interfaces only | Parse against shared schemas |
| 33 | `ema ingest link {claude.ai,chatgpt,discord,imessage}` | P2 | ghost | explicit stubs at `cli/src/index.ts:1948-1987` | Build or remove |
| 34 | `ema vault watch` | P2 | ghost | stub at `cli/src/index.ts:1402-1409` | Build or remove |
| 35 | `ema pipe fire` | P2 | ghost | stub at `cli/src/index.ts:1426-1437` | Build or remove |
| 36 | CLI ↔ daemon auth (bearer token parity with renderer) | P1 | missing | CLI sends no Authorization header | Shared auth layer |
| 37 | CLI WebSocket consumer for live execution output | P1 | missing | CLI is HTTP-only | Phoenix client in CLI |

## Domain: Workers

| # | Feature | Priority | Status | Evidence | Target |
|---|---|---|---|---|---|
| 38 | Vault watcher actually forwards events somewhere | P1 | ghost | `workers/src/vault-watcher.ts` — empty listener set | Register service ingestion subscriber |
| 39 | Session watcher actually forwards events | P1 | ghost | `workers/src/session-watcher.ts:105` | Register chronicle subscriber |
| 40 | `@ema/workers` declares `@ema/shared` dependency + imports actor phase enum | P1 | drift | Enum manually duplicated at `workers/src/agent-runtime-heartbeat.ts:1-21` | Fix `workers/package.json` |
| 41 | Real agent targets registered with heartbeat worker | P1 | ghost | Only synthetic `system:bootstrap` target | Post-executor (#1) |

## Domain: Shared / Schemas

| # | Feature | Priority | Status | Evidence | Target |
|---|---|---|---|---|---|
| 42 | Intent schema dedup → single canonical file | P0 | drift | Three parallel Intent shapes | Delete `intent.ts` OR `intents.ts`; migrate consumers |
| 43 | Execution schema dedup → single canonical file | P0 | drift | Two schemas + `loop_executions` ghost table | Delete `execution.ts` + `loop_executions` + `loop/orchestrator.ts` |
| 44 | Proposal schema dedup | P1 | drift | Legacy + active coexist | Delete `proposals.ts` legacy file + renderer scoring fields |
| 45 | `actor-phase` imported from `@ema/shared` in workers | P1 | drift | Manual duplicate | Fix workers deps |
| 46 | Untracked schemas decision (machine, notification, organizations, peer, planning-node, research-item, trace, workstream) | P0 | WIP | 8 files untracked on disk | Commit or delete — DO NOT let WIP linger |
| 47 | `shared/sdk` consumed OR deleted | P1 | ghost | 637 LOC, zero importers | Pick renderer or CLI to consume; delete if neither |
| 48 | `shared/contracts/ServiceContract<T>` deleted | P2 | ghost | Zero implementors | Delete premature abstraction |

## Domain: Daemon extraction (sub-project A dependencies)

See [[01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT]] for the spec.
See [[01-PLANS/2026-04-13-DAEMON-EXTRACTION-IMPL-NOTES]] for tactics from the forensic audit.

| # | Feature | Priority | Status | Target |
|---|---|---|---|---|
| 49 | Effect-native RPC server replacing Fastify | P1 | missing | Sub-project A phase A1-A2 |
| 50 | Bootstrap token auth (non-optional) | P1 | missing | Sub-project A phase A3 |
| 51 | Event log + projection tables replacing `loop_*` | P1 | missing | Sub-project A phase A4 |
| 52 | `ema daemon install` wiring systemd units | P0 | partial | `scripts/install-runtime.sh` exists; no CLI surface |
| 53 | Electron attaches to daemon, does not spawn it | P0 | drift | `apps/electron/main.ts:444` untry-caught spawn |
| 54 | Try-caught `startManagedRuntime()` with visible fallback UI | P0 | missing | Currently throws before any window |
| 55 | `EMA_MANAGED_RUNTIME=attach` mode: connect-only, fail with user-visible help | P0 | missing | Only `external` (skip) or default (spawn) exist |

## Domain: Workspace / build hygiene

| # | Feature | Priority | Status | Target |
|---|---|---|---|---|
| 56 | Root `package-lock.json` removed + `.gitignore` rule | P0 | drift | `rm package-lock.json shared/package-lock.json cli/package-lock.json agent-runtime/package-lock.json hq-api/package-lock.json` |
| 57 | Nested `node_modules/` cleaned | P0 | drift | `find . -type d -name node_modules -not -path "./node_modules/*" -prune -print` |
| 58 | `@ema/electron` has `dev` script | P0 | drift | Root `pnpm dev` assumes it; currently breaks |
| 59 | `pnpm parity` either works or is deleted | P1 | drift | `tools/contracts/routes.json` missing |
| 60 | Dead-stack scripts deleted | P1 | drift | `scripts/{install.sh,node-setup.sh,import-claude-sessions.exs,ema.service}` |
| 61 | `@ema/platform` consumed by Electron OR deleted | P1 | ghost | Zero importers |
| 62 | Renderer chunk splitting (2 MB single chunk warning) | P2 | partial | Vite `rollupOptions.manualChunks` |
| 63 | `onnxruntime-web` removed from renderer bundle or justified | P2 | drift | `eval()` warning in build output |
| 64 | Renderer + CLI + Electron get test scripts (even if smoke-only) | P1 | missing | Currently 0 tests in 8 packages |

## Domain: Host ops / productivity surfaces (from user's CLAUDE.md)

| # | Feature | Priority | Status | Target |
|---|---|---|---|---|
| 65 | MCP `ema_*` tool set wired to services daemon | P1 | partial | `mcp__ema__*` tools exist in env; unclear if all hit live daemon |
| 66 | EMA wiki at `~/.local/share/ema/vault/wiki/` writable from services + CLI + renderer | P1 | partial | MCP writes; services SDK `vault.*` deferred |
| 67 | Session log auto-capture on conversation end | P2 | missing | Per CLAUDE.md protocol — currently manual |
| 68 | Gotchas auto-dump on 5-min debug loss | P2 | missing | Per CLAUDE.md protocol |

## Capture priorities

**Must-land before v1.1 declares done:** 1, 2, 3, 11, 12, 13, 16, 17, 27, 29, 30, 42, 43, 46, 53, 54, 55, 56, 57, 58.

**Nice-to-have in v1.1:** 14, 15, 18, 21, 22, 23, 25, 26, 32, 36, 44, 47, 52, 60, 61, 64.

**Post-A / v1.2:** everything else.
