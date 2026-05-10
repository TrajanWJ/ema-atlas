# EMA Proslync-First Head-Orchestrator Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for implementation, with one worker per disjoint track and a head orchestrator reviewing integration after each sprint. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make EMA 0.0.6 the fast, canonical, Proslync-first agent development cockpit before launching Proslync implementation swarms.

**Architecture:** EMA must become a control plane, not a slow dashboard over shell-outs. The daemon owns truth; CLI and web consume compact projections; vApps share one route/frame contract; Chronicle/session history and intention backfeed become evidence; Duct Tape/Harness becomes the execution registry for Codex/Claude/cmux-style work. Proslync is the pilot client project and acceptance harness.

**Tech Stack:** Gleam/BEAM daemon, Erlang SQLite helpers, TypeScript CLI, Next.js 16 web shell, Tauri v2 desktop, Playwright, local project records under `/Users/trajanm4air/Desktop/Projects`, active builds under `/Users/trajanm4air/Desktop/Active builds`.

---

## Executive Correction

The current failure mode is architectural:

- Cockpit tests are slow because UI render calls Next API routes that shell out through CLI/git/intention harvest paths.
- Some tests were being stretched with long timeouts instead of adding deterministic readiness states.
- The Agent Work surface is still mostly a lane/queue viewer, while EMA doctrine describes a project-scoped agent workspace with claims, handoffs, virtual calendar, dispatches, executions, transcripts, and evidence.
- Holodeck/direct routes, virtual desktop windows, and popouts render through different frame contracts and can drift.
- Proslync readiness must be proven by `ema cockpit workpack --project proslync-app-ios-final --json`, not by a single page test that happens to wait long enough.

This plan supersedes the narrower implementation order in:

`/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/superpowers/plans/2026-05-10-ema-proslync-first-active-development-sprints.md`

Do not discard useful work from that plan. Reclassify it into the tracks below.

## Verified Inputs

Read these before implementation:

- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/AGENTS.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/README.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/WORKSPACE-ENTRYPOINT.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/cli/agent-workspace.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/vapps/duct-tape-onion-harness.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/08-vanilla-workspace.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/09-see-agent-work.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/18-harness-glue.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/19-project-scoped-agent-workspaces.md`
- `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/24-harness-vapp-launch.md`
- `/Users/trajanm4air/Desktop/Projects/EMA/project.md`
- `/Users/trajanm4air/Desktop/Projects/EMA/builds/0.0.6/BUILD.md`
- `/Users/trajanm4air/Desktop/Projects/EMA/atlas/PROJECT-ATLAS.md`
- `/Users/trajanm4air/Desktop/Projects/EMA/atlas/incubating/blueprint-v0-mining-spec.md`
- `/Users/trajanm4air/Desktop/Projects/EMA/atlas/workspace/cmux-native-orchestrator-proposal.md`

Proslync acceptance sources:

- `/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final/PLAN.md`
- `/Users/trajanm4air/Desktop/Projects/proslync-app-ios-final/atlas/sprint-plans/v1-real-app.md`
- `/Users/trajanm4air/Desktop/Active builds/proslync-presentation-assets-final/docs/research/prep-capture-2026-05-09/mrs-wilson-asks-extracted.md`
- `/Users/trajanm4air/Desktop/Active builds/proslync-presentation-assets-final/docs/plans/proslync-role-happiness-master-plan-2026-05-09/README.md`

## Stop Lines

- Do not launch Proslync implementation swarms until Sprints 1-4 pass.
- Do not fix slow tests by raising timeout budgets. Add compact projections, readiness markers, and bounded data loading.
- Do not use `networkidle` for cockpit/vApp readiness.
- Do not let supported command paths return `pending_daemon_writer`.
- Do not call the cockpit `ready` unless runtime report, daemon projection, active builds, and project registry agree.
- Do not treat `.ema-dev/intention-backfeed/reviews.json` as canonical after the intention daemon events land.
- Do not replace the installed app until static/Tauri parity and runtime preflight pass.
- Preserve dirty worktrees. No reset, clean, stash, checkout, or revert unrelated work.

## Head-Orchestrator Tracks

| Track | Sub-orchestrator | Write Scope | Primary Outcome |
|---|---|---|---|
| T0 Dirty State Intake | Head | docs/status only | Current partial edits and test hacks are classified before more code changes |
| T1 Doctrine Canon | Doctrine | `AGENTS.md`, `docs/**`, `Projects/EMA/**` | EMA vocabulary and current build records stop contradicting each other |
| T2 Fast Projection Core | Daemon/CLI | `apps/daemon/**`, `apps/cli/src/commands/{cockpit,lane,queue,workspace-daemon}.ts` | Cockpit/workpack reads compact daemon projections without repeated shell-outs |
| T3 Proslync Project Registry | Cockpit | `apps/cli/src/commands/cockpit.ts`, `apps/web/app/api/cockpit/**`, `apps/web/src/vapps/cockpit/data/**` | Proslync is pilot data in a registry, not hardcoded architecture |
| T4 Agent Workspace V2 | Agent Workspace | `apps/cli/src/commands/{agent,lane,queue,checkup,handoff}.ts`, `apps/web/src/components/apps/agent-work/**` | Agents can orient, claim, execute, hand off, and report from one workspace |
| T5 Intention + Chronicle Backfeed | Recovery | `apps/daemon/lib/ema_intention_farmer/**`, `apps/cli/src/commands/intention.ts`, `apps/web/src/vapps/cockpit/**`, `apps/web/src/components/apps/chronicle/**` | Lost intentions/session history become reviewable evidence and queue items |
| T6 Harness + Duct Tape Registry | Harness | `apps/cli/src/commands/harness.ts`, `apps/daemon/src/ema_dispatch/**`, `apps/daemon/src/ema_exec/**`, `docs/vapps/duct-tape-onion-harness.md` | Dispatch/execution/tool timelines are daemon projections |
| T7 vApp Route/Frame System | UI | `apps/web/src/lib/*app*`, `apps/web/src/components/vapp/**`, `apps/web/app/[vapp]/**`, `apps/web/app/popout/**` | Holodeck, vDesktop, and popout modes share one route/frame contract |
| T8 Priority vApps | UI workers | 15 priority vApp folders | Each priority vApp is useful for Proslync work, not just mountable |
| T9 Test + Release Harness | E2E | `apps/web/tests/**`, `tooling/**`, `scripts/**` | Fast deterministic tests, static parity, reinstall readiness |

## Sprint 0: Freeze Current State And Remove Test Hacks

**Goal:** Stop accidental patch-chasing and preserve what is useful from the current dirty state.

**Files:**

- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/orchestration/head-orchestrator/current-dirty-state-2026-05-10.md`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/orchestration/STATUS.md`
- Audit only: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/tests/e2e/cockpit-proslync.spec.ts`
- Audit only: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/tests/e2e/proslync-first-vapps.spec.ts`
- Audit only: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/tests/e2e/launchpad-cockpit.spec.ts`

- [ ] **Step 1: Snapshot dirty state**

Run:

```bash
git status --short > docs/orchestration/head-orchestrator/current-dirty-state-2026-05-10.md
git diff --stat >> docs/orchestration/head-orchestrator/current-dirty-state-2026-05-10.md
```

Expected: the snapshot captures pre-existing dirty files, untracked test artifacts, generated dist files, and current plan/docs.

- [ ] **Step 2: Classify existing edits**

Append headings to `current-dirty-state-2026-05-10.md`:

```markdown
## Keep
## Replace
## Rework
## Generated / Artifact
## Unknown Owner
```

Classify the current timeout edits as `Rework`, not `Keep`.

- [ ] **Step 3: Add a status note**

Append to `docs/orchestration/STATUS.md`:

```markdown
## Session update 2026-05-10 - Proslync-first head-orchestrator reset

- Timeout inflation is not accepted as a fix for cockpit readiness.
- Cockpit must gain compact projections and deterministic readiness markers.
- Proslync swarms remain blocked until workpack, agent workspace, intention backfeed, and vApp route/frame parity pass.
```

Validation:

```bash
rg -n "Timeout inflation|head-orchestrator reset|current-dirty-state" docs/orchestration
```

## Sprint 1: Doctrine Canon And Source Hierarchy

**Goal:** Resolve stale EMA doctrine so every future agent inherits the same operating model.

**Files:**

- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/AGENTS.md`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/WORKSPACE-ENTRYPOINT.md`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/cli/agent-workspace.md`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/cli/see-agent-work.md`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/vapps/duct-tape-onion-harness.md`
- Modify: `/Users/trajanm4air/Desktop/Projects/EMA/project.md`
- Modify: `/Users/trajanm4air/Desktop/Projects/EMA/builds/0.0.6/BUILD.md`

- [ ] **Step 1: Lock vocabulary**

Patch docs so these terms have one meaning:

| Term | Meaning |
|---|---|
| EMA Project | `/Users/trajanm4air/Desktop/Projects/EMA` durable record |
| EMA 0.0.6 active build | `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6` code in motion |
| Holodeck | direct full-page vApp route, `/<appId>` |
| vDesktop | windowed desktop shell route, `/` with windows |
| Native popout | Tauri/companion-backed popout window |
| Agent Workspace | project-scoped operating surface for lanes, queue, handoffs, dispatches, executions, evidence |
| Cockpit | client/project workbench, not the whole agent workspace |
| Duct Tape/Harness | AI dispatch seam and execution registry |

- [ ] **Step 2: Resolve CWT contradiction**

Docs must state:

```text
`ema` is the canonical CLI. `cwt` is legacy/alias context and must route through `ema cockpit` for current client/project views.
```

- [ ] **Step 3: Preserve provenance**

Historical `0.0.5` docs stay historical. Active guidance must not instruct new agents to use `EMA-0.0.5`, `Founding-Fathers-EMA`, Acme/Baker clients, or old harness paths.

Validation:

```bash
rg -n "EMA-0\\.0\\.5|EMA 0\\.0\\.5|Founding-Fathers|Acme|Baker|Demo Room" AGENTS.md docs/WORKSPACE-ENTRYPOINT.md docs/cli docs/vapps /Users/trajanm4air/Desktop/Projects/EMA/project.md /Users/trajanm4air/Desktop/Projects/EMA/builds/0.0.6/BUILD.md
```

Expected: only explicitly historical references remain.

## Sprint 2: Fast Projection Core

**Goal:** Make cockpit/workpack fast and truthful by moving expensive project state into compact daemon/CLI projections.

**Files:**

- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/cockpit.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/workspace-daemon.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/src/ema_sqlite_helpers.erl`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam`
- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/tooling/cockpit-performance-smoke.mjs`

- [ ] **Step 1: Define projection budget**

`ema cockpit workpack --project proslync-app-ios-final --json` must complete:

- warm path: under 750 ms
- cold path: under 2.5 s
- no repeated `git status` shell-outs during one request
- no intention harvest during initial cockpit workspace render

- [ ] **Step 2: Split projection shape**

Create or normalize these projection groups:

```text
cockpit.project.registry
cockpit.project.runtime
cockpit.project.workpack
cockpit.project.intentions.summary
```

The initial cockpit render uses `workpack` and `runtime`. The Intentions tab loads full intentions only after the tab is selected.

- [ ] **Step 3: Fix optimistic readiness**

`healthFor` must read from `runtime-process-report` or daemon runtime state. It must not hardcode `web: "up"` or `stale_records: []`.

- [ ] **Step 4: Add performance smoke**

Create `tooling/cockpit-performance-smoke.mjs` to run:

```bash
node apps/cli/dist/bin.js cockpit workpack --project proslync-app-ios-final --json
node apps/cli/dist/bin.js cockpit projection --project proslync-app-ios-final --json
```

It fails if either command exceeds the budget.

Validation:

```bash
pnpm build:cli
node tooling/cockpit-performance-smoke.mjs
```

Expected: workpack is fast enough to use as the swarm bootstrap packet.

## Sprint 3: Proslync Project Registry And Workpack

**Goal:** Proslync is the pilot client project, but not hardcoded into EMA architecture.

**Files:**

- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/project-registry/proslync.ts`
- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/project-registry/index.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/cockpit.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/app/api/cockpit/projection/route.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/vapps/cockpit/data/projections.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/vapps/cockpit/data/types.ts`

- [ ] **Step 1: Move Proslync constants into a registry**

Registry fields:

```ts
projectSlug
projectId
clientId
clientName
projectRecordPath
activeBuilds[]
surfaces[]
canonicalPlans[]
verificationCommands[]
requiredQueueGates[]
recommendedLanes[]
```

- [ ] **Step 2: Add missing hero website surface**

Add queued surface:

```text
id: hero-website
repo: TrajanWJ/proslync-website
url: proslync-hero.vercel.app
status: queued
```

- [ ] **Step 3: Fix misleading workpack commands**

`ema cockpit workpack` must not emit `ema lane open --goal --next` if `lane open` does not accept those flags. Either emit a valid `lane open` command or a valid `lane claim` command.

Validation:

```bash
node apps/cli/dist/bin.js cockpit workpack --project proslync-app-ios-final --json | jq '.kickoff_commands'
node apps/cli/dist/bin.js cockpit projection --project proslync-app-ios-final --json | jq '.surfaces[].id'
```

Expected: commands are valid and surfaces include all Proslync program surfaces.

## Sprint 4: Agent Workspace V2

**Goal:** Agent Work becomes the operating surface for real multi-agent project work, not just a lane/queue board.

**Files:**

- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/agent.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/lane.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/queue.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/checkup.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/components/apps/agent-work/**`
- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/tests/e2e/agent-work-command-ipc.spec.ts`

- [ ] **Step 1: Define Agent Workspace object model**

The UI must render:

```text
project
actors
claimed lanes
ready queue
blocked queue
handoffs
vCalendar phase
dispatches
executions
tool timeline
evidence links
verification commands
```

- [ ] **Step 2: Replace copy-only primary actions**

Agent Work primary buttons execute daemon-backed commands for:

```text
lane list
lane claim
queue list
queue add
queue close
checkup runtime
agent orient
```

Copy remains secondary.

- [ ] **Step 3: Add project-scoped Proslync bootstrap**

Agent Work must expose:

```bash
ema cockpit workpack --project proslync-app-ios-final --json
ema lane claim --lane <id> --actor actor:codex --scope <scope> --goal <goal> --next <next> --json
```

Validation:

```bash
node tooling/agent-workspace-round-trip.mjs
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/agent-work-command-ipc.spec.ts --reporter=list
```

Expected: supported commands execute and no supported command returns `pending_daemon_writer`.

## Sprint 5: Intention, Chronicle, And Blueprint Mining

**Goal:** Past sessions, lost follow-ups, and planning transcripts become structured EMA evidence for Proslync.

**Files:**

- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/intention.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/lib/ema_intention_farmer/**`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/src/ema_sqlite_helpers.erl`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/vapps/cockpit/components/project-bench-view.tsx`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/components/apps/chronicle/**`
- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/blueprint-mine.ts` or extend `blueprint.ts`

- [ ] **Step 1: Make review state daemon canonical**

Replace `.ema-dev/intention-backfeed/reviews.json` as canonical truth with daemon events:

```text
intention.reviewed
intention.backfeed.requested
intention.backfeed.completed
intention.backfeed.failed
```

Keep the JSON file as migration/import evidence only.

- [ ] **Step 2: Add guarded backfeed**

Accepted intentions can create queue items only with an explicit reviewed approval:

```bash
ema intention backfeed --intent <id> --destination queue --approve reviewed --json
```

No auto-promotion.

- [ ] **Step 3: Add Blueprint mining command**

Implement:

```bash
ema blueprint mine --transcript <path> --dry-run --json
ema blueprint mine --transcript <path> --json
```

Use section-heading parsing from `Projects/EMA/atlas/incubating/blueprint-v0-mining-spec.md`.

- [ ] **Step 4: Chronicle evidence links**

Chronicle must link session/turn/item evidence to:

```text
queue_item
lane
dispatch
execution
blueprint node
source file
```

Validation:

```bash
node apps/cli/dist/bin.js intention projection --project proslync-app-ios-final --json
node apps/cli/dist/bin.js intention backfeed --intent <reviewed-intent-id> --destination queue --approve reviewed --json
node apps/cli/dist/bin.js blueprint mine --transcript <fixture> --dry-run --json
```

## Sprint 6: Harness, Duct Tape, And Execution Registry

**Goal:** EMA tracks actual agent execution lifecycles for Proslync swarms.

**Files:**

- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/harness.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/src/ema_dispatch/ema_dispatch.gleam`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/src/ema_exec/ema_exec.gleam`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/daemon/src/ema_sqlite_helpers.erl`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/lib/app-registrations.ts`
- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/components/apps/duct-tape/**`
- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/tests/e2e/harness-registry.spec.ts`

- [ ] **Step 1: Add daemon projections**

Required projections:

```text
dispatch.registry
execution.registry
tool.timeline
chronicle.activity
```

- [ ] **Step 2: Register Duct Tape as a first-class vApp**

Add `duct-tape` or `harness` as a sibling vApp surface. It must show provider connectors, active dispatches, executions, and timeline links.

- [ ] **Step 3: Keep provider adapters honest**

Until real Codex/Claude/cmux adapters work:

```json
{ "ok": false, "status": "unsupported_provider_adapter", "remediation": "Use --provider simulated or configure adapter." }
```

No `pending_provider_adapter` for paths presented as available.

- [ ] **Step 4: Simulated dispatch remains the contract test**

Validation:

```bash
node apps/cli/dist/bin.js harness dispatch --provider simulated --prompt smoke --json
node apps/cli/dist/bin.js harness stream --execution <id> --json
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/harness-registry.spec.ts --reporter=list
```

Expected: Agent Work, Chronicle, and Duct Tape render the same execution timeline.

## Sprint 7: vApp Route, Frame, And Mode Unification

**Goal:** Holodeck, vDesktop, and native popout stop behaving like different products.

**Files:**

- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/lib/vapp-route-contract.ts`
- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/components/vapp/VAppFrame.tsx`
- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/components/vapp/VAppChrome.tsx`
- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/components/vapp/VAppSurface.tsx`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/components/apps/PanelAppFrame.tsx`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/app/[vapp]/page.tsx`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/app/(desktop)/page.tsx`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/app/popout/[appId]/page.tsx`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/lib/url-nav.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/lib/url-state-router.tsx`

- [ ] **Step 1: Define one route contract**

`vapp-route-contract.ts` exports:

```ts
PRIORITY_VAPPS
ROUTABLE_VAPPS
STATIC_POPOUT_VAPPS
VAPP_ALIASES
resolveVappRoute()
isPriorityVapp()
```

- [ ] **Step 2: Make frame/chrome shared**

All modes use the same vApp frame primitives and differ only by shell wrapper:

```text
Holodeck: VAppFrame full page
vDesktop: Window -> VAppFrame
Popout: PopoutShell -> VAppFrame
```

- [ ] **Step 3: Fix panel route contradiction**

Either implement `?mode=panel&panel=<id>` or remove it from docs/tests. The canonical direct route remains:

```text
/<appId>
```

- [ ] **Step 4: Add deterministic readiness**

Every priority vApp exposes:

```html
data-app="<id>"
data-vapp-ready="live|staged|offline"
```

Cockpit additionally exposes:

```html
data-cockpit-ready="live|staged|offline"
```

Validation:

```bash
pnpm --dir apps/web exec tsc --noEmit
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/proslync-first-vapps.spec.ts --reporter=list
```

Expected: no `networkidle`; no long timeouts; cockpit readiness under 3 seconds.

## Sprint 8: Priority vApp Productization

**Goal:** The 15 priority vApps become a coherent Proslync development environment.

**Priority vApps:**

```text
launchpad, cockpit, agent-work, hq, atlas, blueprint, chronicle,
git-ema, clients, threads, wiki, settings, place-tools, terminal, finder
```

**Files:**

- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/components/apps/launchpad/**`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/vapps/cockpit/**`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/components/apps/agent-work/**`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/src/components/apps/{hq,atlas,blueprint,chronicle,git-ema,clients,threads,wiki,settings,place-tools,terminal,finder}/**`

Product minimums:

| vApp | Required Proslync Utility |
|---|---|
| launchpad | resume Proslync, Agent Work, Duct Tape, Runtime Health |
| cockpit | workpack, builds, surfaces, lanes, queue, intentions, captures |
| agent-work | orient, claim, dispatch, handoff, verify, report |
| hq | runtime/project pulse and blocked tracks |
| atlas | source map, project graph, active builds, docs |
| blueprint | canon, decisions, mining, plan graph |
| chronicle | session/evidence replay tied to lanes/dispatches |
| git-ema | repo/file attachments and source evidence |
| clients | Ms. Wilson/Proslync client boundary |
| threads | coordination notes tied to daemon channels |
| wiki | doctrine and working memory |
| settings | S1-S5 runtime/system center |
| place-tools | donor utility drawer, not current identity |
| terminal | safe EMA command recipes and CLI bridge |
| finder | Projects/Active builds/shared-files navigator |

Validation:

```bash
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/proslync-first-vapps.spec.ts --reporter=list
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/all-usable-vapps.spec.ts --reporter=list
```

Expected: priority 15 are operationally useful; all usable vApps remain routable.

## Sprint 9: Test Architecture And Speed

**Goal:** Tests become fast evidence, not timeout-based hope.

**Files:**

- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/tests/e2e/cockpit-proslync.spec.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/tests/e2e/launchpad-cockpit.spec.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/tests/e2e/proslync-first-vapps.spec.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/tests/e2e/all-usable-vapps.spec.ts`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/tooling/ema-functional-e2e.mjs`
- Create: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/web/tests/lib/vapp-route-contract.test.ts`

- [ ] **Step 1: Ban `networkidle` in vApp tests**

Replace with:

```ts
await page.waitForLoadState("domcontentloaded");
await expect(page.locator('[data-vapp-ready]').first()).toHaveAttribute("data-vapp-ready", /live|staged|offline/);
```

- [ ] **Step 2: Add timing assertions**

Cockpit Proslync render target:

```text
first frame under 1.5 s
workpack visible under 3 s
intentions tab may lazy-load separately
```

- [ ] **Step 3: Split functional E2E into lanes**

`pnpm e2e:functional` runs:

```text
core: cli typecheck, build:cli, web tsc, gleam check, runtime report
projection: cockpit workpack/projection performance
ui: priority vApps and critical cockpit
static: build-web-static-out + static parity
release: reinstall dry/preflight only
```

Validation:

```bash
pnpm e2e:functional
```

Expected: JSON report includes per-lane timings and failures. One lane failure does not hide earlier pass evidence.

## Sprint 10: Runtime, Static, Tauri, And Install Readiness

**Goal:** EMA can stop the active daemon/web, build, reinstall, and reopen with functional 0.0.6 behavior.

**Files:**

- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/tooling/runtime-process-report.mjs`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/tooling/reinstall-ema-0.0.6.mjs`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/scripts/stop-ema-dev.sh`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/scripts/build-web-static-out.sh`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/scripts/install-macos-tauri-app.sh`
- Modify: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/orchestration/functional-0.0.6-release-report.md`

- [ ] **Step 1: Runtime report truth**

Report:

```text
daemon listener
web listener
companion listener
installed app path
static bundle path
pidfiles
stale pidfiles
active build git state
Proslync workpack health
```

- [ ] **Step 2: Static/Tauri parity**

Static output must generate every `STATIC_POPOUT_VAPP`, not a hand-maintained subset.

- [ ] **Step 3: Reinstall gate**

Run only after Sprints 1-9 pass:

```bash
pnpm release:reinstall:dry
node tooling/reinstall-ema-0.0.6.mjs --preflight-only
pnpm release:reinstall
open "/Users/trajanm4air/Desktop/EMA 0.0.6.app"
pnpm runtime:report
```

Expected: installed app opens, daemon/web/companion/runtime truth is visible, and Proslync cockpit workpack is available.

## Proslync Swarm Launch Gate

Proslync swarms may begin only when:

- `node apps/cli/dist/bin.js cockpit workpack --project proslync-app-ios-final --json` returns fast and truthful.
- Agent Work can claim a lane and execute a queue/checkup command.
- Cockpit can create a real queue item from capture/chat.
- Intentions can be accepted/deferred/rejected and backfed with explicit approval.
- Chronicle shows evidence linked to at least lane, queue, dispatch, and execution.
- Duct Tape/Harness simulated execution appears in `dispatch.registry`, `execution.registry`, and `tool.timeline`.
- Holodeck/vDesktop/popout route/frame contract is unified.
- Priority 15 vApps pass deterministic readiness tests without `networkidle`.
- Static/Tauri parity passes.
- Runtime report shows daemon and web up and installed app present.

## Parallel Implementation Order

After Sprint 0, run these in parallel:

1. Doctrine Canon + Proslync Project Registry
2. Fast Projection Core + Test Architecture
3. vApp Route/Frame System + Runtime/Tauri Parity
4. Agent Workspace V2 + Harness/Execution Registry
5. Intention/Chronicle/Blueprint Mining

Integration order:

1. Fast projection core lands before cockpit UI timing assertions.
2. Route/frame contract lands before broad vApp polish.
3. Harness projections land before Duct Tape UI claims real execution.
4. Intention daemon review lands before queue backfeed is treated as canonical.
5. Runtime/static parity lands before installed app replacement.

## Final Validation Pack

Run:

```bash
pnpm --filter @ema/cli typecheck
pnpm build:cli
pnpm --dir apps/web exec tsc --noEmit
cd apps/daemon && gleam check
node tooling/cockpit-performance-smoke.mjs
node apps/cli/dist/bin.js cockpit workpack --project proslync-app-ios-final --json
node apps/cli/dist/bin.js harness dispatch --provider simulated --prompt smoke --json
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/proslync-first-vapps.spec.ts --reporter=list
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/agent-work-command-ipc.spec.ts tests/e2e/harness-registry.spec.ts --reporter=list
bash scripts/build-web-static-out.sh
EMA_E2E_BASE_URL=http://127.0.0.1:4174 pnpm --dir apps/web exec playwright test tests/e2e/static-install-parity.spec.ts --reporter=list
pnpm e2e:functional
pnpm runtime:report
```

Expected: all pass with per-lane timings, and no cockpit route depends on a 15+ second wait.

