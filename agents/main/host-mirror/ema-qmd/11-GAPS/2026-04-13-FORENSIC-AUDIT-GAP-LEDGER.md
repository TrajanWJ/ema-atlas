---
id: GAP-FORENSIC-AUDIT-LEDGER
type: gap-ledger
layer: reality
title: "Forensic audit gap ledger — full monorepo survey (2026-04-13 pm)"
status: captured
created: 2026-04-13
scope: "~/Projects/ema (all top-level dirs + workspace packages)"
source:
  - "4-agent parallel forensic audit run 2026-04-13 pm (control plane, surfaces, knowledge/tools, cross-cutting wiring)"
source_of_truth:
  - "~/Projects/ema/pnpm-workspace.yaml"
  - "~/Projects/ema/package.json"
  - "~/Projects/ema/services/startup.ts"
  - "~/Projects/ema/workers/src/startup.ts"
  - "~/Projects/ema/apps/renderer/src/App.tsx"
  - "~/Projects/ema/cli/src/index.ts"
related:
  - "[[11-GAPS/GUI-ROT-DIAGNOSTIC-2026-04-13]]"
  - "[[11-GAPS/CONVERGENCE-DEBT-SUMMARY]]"
  - "[[13-CLI-GUI-PARITY/RENDERER-APP-TRIAGE-LEDGER-2026-04-13]]"
  - "[[13-CLI-GUI-PARITY/CLI-ROT-DIAGNOSTIC-2026-04-13]]"
  - "[[01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT]]"
  - "[[01-PLANS/v1.1-EXECUTION-ROADMAP-2026-04-13]]"
tags: [gap, audit, forensic, monorepo, v1.1, reality, ground-truth]
---

# Forensic Audit Gap Ledger

> Ground-truth capture of the 2026-04-13 pm 4-agent forensic audit. This is
> a compressed reference; canonical detail lives in the conversation log.
> Every row cites a file:line so a follow-up agent can verify.
>
> **Purpose:** freeze reality so hygiene and architecture axes can be
> sequenced against a shared map. Complements GUI-ROT and CLI-ROT diagnostics
> with control-plane, workspace, and cross-cutting coverage.

## 1. Workspace topology — live vs orphan

### Live (in `pnpm-workspace.yaml`)

| Package | Status | Tests | Notes |
|---|---|---|---|
| `@ema/services` | functional | 181/181 pass | Fastify :4488, SQLite, WS pub/sub |
| `@ema/workers` | partial | 4/4 smoke only | Manager works; 3 of 4 workers emit into empty listener sets |
| `@ema/renderer` | partial | **0** | ~13 real routes, 10 `ConnectedDraftApp` shells, ~20 orphan stores |
| `@ema/electron` | functional | 0 | Binary exists; **no `dev` script** despite root `pnpm dev` expecting one |
| `@ema/cli` | partial | 0 | 2159-LOC god module `cli/src/index.ts` |
| `@ema/platform` | **ghost** | 0 | Built; zero importers anywhere |
| `@ema/tools` | broken | 0 | `pnpm parity` hard-exits — `tools/contracts/routes.json` missing |
| `@ema/shared` | drift-ridden | 0 | Three intents schemas, two executions schemas, two proposals schemas coexist |
| `@ema/tokens` / `@ema/glass` | partial | 0 | Design assets |

### Orphans (exist on disk, NOT in workspace)

| Path | Disposition |
|---|---|
| `agent-runtime/` (top-level `hq-agent-runtime`) | **dead-island** — only Anthropic SDK loop in repo, nothing calls it, in-memory `Map` state |
| `hq-api/` | **dead-island** — Express :3002, own SQLite, zero `@ema/*` imports |
| `hq-frontend/` | **dead-island** — parallel Vite+React app; `Execution` type with `any`-typed blobs (`store/executionStore.ts:12-30`) |
| `blueprint/` | **vestigial sidecar** — standalone :7777 server with hardcoded `/home/trajan/Projects/ema/ema-genesis` path (`server.js:18`) |
| `ema-genesis/` | **live-island by filesystem** — canonical data store read by CLI and workers; includes 106 vendored repos under `research/_clones/` (23+ MB) |
| `runtime/systemd/` | **functional config** — correct TS-stack units |

### Workspace contamination

- Root has **both** `package-lock.json` AND `pnpm-lock.yaml`.
- Rogue `package-lock.json` at: `shared/`, `cli/`, `agent-runtime/`, `hq-api/`.
- Nested `node_modules/` at 9 workspace-member paths — someone ran `npm install` inside a pnpm workspace.

## 2. Control plane — what actually runs

### Execution path breaks at the executor step

Confirmed end-to-end path through services:

1. `POST /api/proposals` → `services/core/proposal/router.ts:97` → `proposalService.generate()` → `services/core/proposal/service.ts:235`
2. Intent resolved via `getRuntimeIntent` OR `bootstrapIntentService.get()`, then `ensureLoopIntentMirror()` (`proposal/service.ts:185-215`) copies between the two intent stores with lossy mapping (`abandoned→archived`, `paused→active`, drops `kind`/`exit_condition`/`space_id`)
3. `CoreProposal` row → `loop_proposals` (durable SQLite)
4. `POST /api/proposals/:id/approve` → status update
5. `POST /api/proposals/:id/executions` → `createExecutionFromProposal()` (`executions/executions.service.ts:459`) → row in `executions` with status `'created'`

**Break point:** Nothing runs the agent. No trigger, no queue, no callback takes an approved execution and invokes a Claude API call. The only Anthropic SDK loop in the repo is `agent-runtime/` (orphan, :3001, not wired). `workers/proposal-engine/index.ts:schedule()` returns `[]` always and is not registered. `services/core/actors/runtime-poller.ts` singleton is created but `.start()` is never called.

### Babysitter / tick loops

No module named "babysitter." Three loops exist:

- `workers/src/agent-runtime-heartbeat.ts:141-159` — `setInterval(tick, 1000ms)`. Zero real targets; only synthetic `system:bootstrap` target polls `/api/intents?status=active`.
- `workers/src/session-watcher.ts:105` — `setInterval(poll, 30_000)`. Listener set empty; events fire into void.
- `services/core/actors/runtime-poller.ts:83` — never started.

### Silent failure at boot

`services/startup.ts:124` — `await bootstrapPromise.catch(() => {})`. **Critical.** Bootstrap can fail invisibly; server comes up; queries return empty; every renderer store swallows empty with `.catch(() => null)`. Result: running system, blank UI, no errors anywhere.

### Incident authority

`grep -r "incident" services/ workers/ shared/` → **zero results.** Not implemented, not typed.

## 3. Surface reality

### CLI commander tree

**Real (hit canon or daemon):** `status`, `intent {list|view|create|update|tree|runtime|link}`, `backend manifest`, `backend flow {...9 subs}`, `backend execution {...4}`, `backend proposal {...5}`, `backend task {...3}`, `goal {...10}`, `calendar {...6}`, `proposal {...6}`, `exec {...5}`, `canon {...4}`, `graph {...6}`, `queue {...3}`, `blueprint gac {...3}`, `blueprint {blockers|aspirations}`, `dump [...3]`, `vault status/seed`, `pipe list/history`, `agent {...3}`, `runtime tool {...2}`, `runtime session {...7}`, `runtime dispatch`, `chronicle {...5}`, `review {...6}`, `ingest {...8}`, `services {start|status}`.

**Explicit stubs (`status: 'deferred'`):** `vault watch`, `pipe fire`, `ingest link {claude.ai|chatgpt|discord|imessage}`.

**Dead oclif subtree:** `cli/src/commands/` — `briefing.ts`, `dump.ts`, `now.ts`, `intent/`, `proposal/`, `research/`, `health/`. `cli/package.json:28-37` has oclif config pointing at `./dist/commands` but `bin/run.js` uses commander exclusively. **10 ghost files.**

**CLAUDE.md references `ema project view` — no `project` group exists.**

### Renderer routes

**Real (~13):** desk, agenda, brain-dump, tasks, projects, executions (+WS), proposals (+WS), blueprint-planner, intent-schematic, pipes, goals, settings, terminal, hq (862 LOC aggregator).

**Ghost (10 `ConnectedDraftApp` shells):** wiki, canvas, evolution, decision-log, campaigns, habits, journal, focus, responsibilities, temporal.

**Orphan stores (no route in `App.tsx`):** ~20 including `actors-store`, `agent-fleet-store`, `calendar-store`, `contacts-store`, `dashboard-store`, `finance-store`, `jarvis-store`, `life-dashboard-store`, `meeting-store`, `metamind-store`, `prompt-workshop-store`, `runtime-fabric-store`, `team-pulse-store`.

**Duplicate store pairs:** `audit-store` + `audit-trail-store`; `gap-store` + `gaps-store`; `project-store` + `projects-store`; `decision-store` + `decision-log-store`; `token-store` + `token-monitor-store`.

### Electron → daemon coupling (the extraction target)

- `apps/electron/main.ts:440-452` — on `app.whenReady()` calls `startManagedRuntime()` (`runtime.ts:95-109`).
- `runtime.ts:32-43` — `spawnNodeProcess('services/dist/startup.js')` + `spawnNodeProcess('workers/dist/startup.js')`.
- `runtime.ts:73-93` — `waitForHealth` polls `GET http://127.0.0.1:4488/api/health` every 300ms up to 15s.
- `EMA_MANAGED_RUNTIME=external` env bypasses spawn (dev mode).
- **`apps/electron/main.ts:444` — `await startManagedRuntime()` is NOT try-caught.** Missing `services/dist/startup.js` = Electron fatal before any window opens.

Coupling is modest: one env-gated spawn + one health poll. Extraction to systemd + "start/attach" UX is feasible without touching Electron internals beyond `main.ts` + `runtime.ts`.

## 4. Data contracts — polyjuice register

### Intent (CRITICAL)

| Shape | Status enum | Table | Path |
|---|---|---|---|
| `intentSchema` | 5 values | `intents` | `shared/schemas/intents.ts` (plural, re-exported as canonical by `shared/types/index.ts`) |
| `coreIntentSchema` | 8 values | `loop_intents` | `shared/schemas/intent.ts` (singular, new) |
| CLI `IntentNode.phase: string` | workflow state | — | `cli/src/lib/genesis-store.ts:30` |
| Renderer `IntentNode.phase: number` | 0-5 hierarchy depth | — | `apps/renderer/src/types/intents.ts:1-15` |

`ensureLoopIntentMirror()` does lossy mapping between `intents`/`loop_intents`. Same field name (`phase`) means different things on CLI vs renderer.

### Execution (CRITICAL)

| Schema | Table | Status |
|---|---|---|
| `shared/schemas/executions.ts` → `Execution` | `executions` | **Active** |
| `shared/schemas/execution.ts` → `CoreExecution` | `loop_executions` | **Never written in prod** — only test orchestrator (`services/core/loop/orchestrator.ts`) writes it |
| `services/core/executions/executions.schema.ts` | `executions` (additive) | Third local schema |
| `hq-frontend/src/store/executionStore.ts:12-30` | — | Bespoke flat struct with `any` `toolCall` fields |

`services/core/backend/manifest.ts:763-775` explicitly says "active: executions.ts; ignore: loop_executions and singular CoreExecution" — codebase knows, hasn't deleted.

### Proposal (HIGH)

- `shared/schemas/proposals.ts` — header: "Legacy renderer-era. Keep only for compatibility." 9-value status.
- `shared/schemas/proposal.ts` — active. 6-value status.
- Renderer `Proposal` type carries `steelman`, `red_team`, `score_breakdown`, `confidence` — `mapDurableProposalRecord()` (`types/proposals.ts:119-160`) hardcodes `confidence: 0.5`, `risks: []`, `benefits: []`, nulls the rest. **UI fields from non-existent scoring pipeline.**

### Actor phase enum

`shared/schemas/actor-phase.ts` is commented source of truth. **Manually duplicated** in `workers/src/agent-runtime-heartbeat.ts:1-21` with "must stay in sync" comment. `@ema/workers` does not declare `@ema/shared` as a dependency in its `package.json`.

## 5. Smell register (ranked)

| Smell | Location | Severity |
|---|---|---|
| Silent bootstrap swallow | `services/startup.ts:124` | CRITICAL |
| Polyjuice on Intent | `shared/schemas/intent.ts` + `intents.ts` + CLI/renderer phase meaning | CRITICAL |
| Polyjuice on Execution | `executions.ts` + `execution.ts` + `loop_executions` | CRITICAL |
| Dead agent executor | `workers/proposal-engine/`, `workers/agent-runtime/agent-worker.ts`, `agent-runtime/` top-level | HIGH |
| Ghost route sink | 10 `ConnectedDraftApp` routes in `apps/renderer/src/App.tsx:88-141` | HIGH |
| Silent WS swallow | `apps/renderer/src/stores/channels-store.ts:592,596,615,619` | HIGH |
| Dead workspace hygiene | npm lockfiles + nested `node_modules/` | HIGH |
| Orphan `@ema/platform` | Built, zero importers | HIGH |
| Orphan `@ema/shared/sdk` | 637 LOC, zero importers | HIGH |
| Dead oclif subtree | `cli/src/commands/` | HIGH |
| Tools parity broken | `tools/contracts/routes.json` missing | HIGH |
| Electron pre-window throw | `apps/electron/main.ts:444` untry-caught `startManagedRuntime()` | HIGH |
| Config theater | `cli/package.json:28-37` oclif config; `scripts/install.sh` Elixir installer; `scripts/ema.service` mix phx.server | HIGH |
| God module | `cli/src/index.ts` 2159 LOC; `apps/renderer/src/components/hq/HQApp.tsx` 862 LOC; `governance/GovernanceApp.tsx` 902 LOC | MEDIUM |
| Dead stack scripts | `scripts/install.sh`, `node-setup.sh`, `import-claude-sessions.exs`, `ema.service` | MEDIUM |
| Optimistic wiring | workers vault-watcher + session-watcher emit into empty listener sets | MEDIUM |
| Premature abstraction | `services/core/pipes/` (35+ files, 17 tests, no production pipe registered) | MEDIUM |
| Duplicate stores | audit/gap/project/decision/token pairs in renderer | LOW |

## 6. Git state at audit time

- Branch `main`, up to date with `origin/main`
- **47 unstaged modified files** — electron main.ts, 11 renderer components, services/startup.ts, 12 service files, 5 shared schemas
- **53 untracked files**, including new dirs `services/core/orchestrator/`, `services/core/organizations/`, `runtime/`, and 8 untracked shared schemas (`machine.ts`, `notification.ts`, `organizations.ts`, `peer.ts`, `planning-node.ts`, `research-item.ts`, `trace.ts`, `workstream.ts`)
- Stash empty

**Implication:** this WIP must be committed to a checkpoint branch before any destructive cleanup. Untracked schemas especially — if someone `rm`s them as "phantom," permanent loss.

## 7. Architectural decisions baked in

| Decision | Cost | Benefit | Leveraged? | Keep? |
|---|---|---|---|---|
| pnpm+turbo monorepo | Dep graph complexity; contamination already present | Parallel builds 23.5s; shared TS base | Partial — cross-imports barely used | Yes, after cleanup |
| Electron for desktop | ~200MB Chromium; no hot-reload for main; platform apis unused | Zero port for React SPA | Barely | Conditional — don't expand |
| Services as HTTP daemon :4488 | Fat HTTP for CLI ops that could be in-process | Clean boundary, 181 hermetic tests | Yes | **Yes, lock in** |
| SQLite + `ema-genesis/` dual SoT | Two stores must sync; silent drift risk | Human-readable canon + query speed | Partial | Yes with sync verification |
| No auth layer | CLI auth-blind if ever enforced | Move fast locally | Yes — single-user | Yes for now |

## 8. Single most dangerous assumption

That `ema-genesis/` (filesystem canon) and SQLite (`~/.local/share/ema/ema.db`) stay in sync through a silent one-way ingestion. No startup integrity check, no dirty marker, no verification. Combined with `startup.ts:124 .catch(() => {})`, a bootstrap failure is invisible and self-consistent: empty tables, empty stores, empty UI, no errors, system "running." CLI pulls from canon for some reads, services for others — so CLI sees intents that GUI doesn't, with no error.

## 9. Next actions

See:
- [[11-GAPS/2026-04-13-MISSING-FEATURES-LEDGER]] for prioritized capture of missing features
- [[01-PLANS/2026-04-13-FRONTEND-BUILDOUT-PLAN]] for the surface buildout sequence
- [[01-PLANS/2026-04-13-DAEMON-EXTRACTION-IMPL-NOTES]] for Electron→daemon decoupling tactics
- [[01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT]] for the architectural target
