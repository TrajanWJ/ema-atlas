# EMA Proslync-First Active Development Sprints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare EMA 0.0.6 to run Proslync as the first real client-work project, with dedicated orchestrator sprints for stale cleanup, system/environment readiness, daemon-backed coordination, cockpit writes, and vApp polish.

**Architecture:** Proslync is the pilot project and acceptance harness. EMA must stop depending on stale 0.0.5 identity, staged-only cockpit writes, file-only intention review, hardcoded cockpit projection, and no-op agent controls before Proslync implementation swarms depend on it. Each sprint has a lead orchestrator, disjoint write scope, validation commands, and a done boundary.

**Tech Stack:** Gleam/BEAM daemon, TypeScript CLI, Next.js 16 web shell, Tauri v2 desktop, Playwright, EMA lane/queue records, Proslync active builds under `/Users/trajanm4air/Desktop/Active builds`.

---

## Verified Pressure Points

These are confirmed by live grep and explorer agents:

| Rank | Problem | Evidence | Required Sprint |
|---|---|---|---|
| 1 | Proslync cockpit can read but not write | `apps/web/src/vapps/cockpit/data/projections.ts` `publishQueueCapture` / `publishAgentMessage` synthesize results | Sprint 2 |
| 2 | Cockpit projection is hardcoded to Proslync | `apps/web/app/api/cockpit/projection/route.ts` fixed Ms. Wilson/Proslync constants | Sprint 2 |
| 3 | Intention review is file-backed | `apps/cli/src/commands/intention.ts` authority `file_backed_review_projection` | Sprint 3 |
| 4 | Agent Work controls are partly no-op | `apps/web/src/components/apps/agent-work/panels/command-panel.tsx` copy/no GUI mutation | Sprint 3 |
| 5 | Harness provider dispatch is pending | `apps/cli/src/commands/harness.ts` returns `pending_provider_adapter` | Sprint 5 |
| 6 | Dispatch events exist without registry projections | `ema_shell_ipc.gleam` emits events; Hermes marks registries pending | Sprint 5 |
| 7 | Native companion truth is split | daemon `ema_companion.gleam` says unavailable; Tauri companion can listen | Sprint 1 |
| 8 | First boot and staged projections still say 0.0.5 | `apps/daemon/src/ema_swarm_coordination/first_boot.gleam`, `apps/web/app/mock-projections.ts`, `apps/web/src/components/boot/EmaIdentityPanel.tsx` | Sprint 0 |
| 9 | Reinstall dry-run is print-only | `tooling/reinstall-ema-0.0.6.mjs` dry-run skips actual checks | Sprint 1 |
| 10 | Doctor is hardcoded partial/missing | `apps/cli/src/commands/doctor.ts` static subsystem report | Sprint 1 |
| 11 | Priority vApps are mountable but not all operational | Terminal, git-ema, Threads, Finder, Settings, HQ, Blueprint have staged/no-op sections | Sprint 4 |
| 12 | Installed static app can diverge from dev server | `scripts/build-web-static-out.sh` does not prove `/popout/[appId]` or API-backed cockpit parity in `apps/web/out` | Sprint 1 |
| 13 | Native popout success is overclaimed | `apps/web/src/lib/popout-launcher.ts` persists popout mode before Tauri `companion_open_window` resolves | Sprint 1 |
| 14 | IPC client surfaces are duplicated | `apps/web/src/lib/ipc.ts`, `apps/web/src/lib/ipc/provider.tsx`, and `apps/web/src/lib/ipc/ipc/*` use competing env names and providers | Sprint 1 |
| 15 | Root agent guidance is stale | `AGENTS.md` still says EMA 0.0.5 and points wrappers at 0.0.5-era defaults | Sprint 0 |

## Dedicated Orchestrators

| Orchestrator | Owns | Does Not Own |
|---|---|---|
| Head Orchestrator | Sprint sequencing, stop lines, acceptance evidence, cross-sprint handoff | Feature code except small docs/status edits |
| Stale Hygiene Orchestrator | 0.0.5/Founding-Fathers/current-build drift, archive banners, stale seed cleanup | Runtime writer behavior |
| Runtime Environment Orchestrator | daemon/web/companion/reinstall/doctor/static parity | vApp product design |
| Coordination Writer Orchestrator | lane/queue/checkup/agent CLI and daemon writers | Proslync product objects |
| Proslync Cockpit Orchestrator | Proslync project projection, cockpit write bridge, workpack, active-build linking | Generic personal productivity tools |
| Intention Backfeed Orchestrator | intention review, accept/defer/reject, evidence-linked queue creation | UI theming beyond necessary controls |
| VApp Polish Orchestrator | priority 15 vApps, settings runtime center, Terminal/Finder real workspace affordances | Daemon storage schemas |
| E2E/Reinstall Orchestrator | Playwright suites, CLI gates, reinstall smoke, release report | Product scope decisions |

---

## Sprint 0: Stale State Quarantine

**Goal:** Stop stale 0.0.5/Founding-Fathers/demo strings from leaking into fresh EMA 0.0.6 and Proslync work.

**Lead:** Stale Hygiene Orchestrator.

**Files:**
- Modify: `apps/daemon/src/ema_swarm_coordination/first_boot.gleam`
- Modify: `apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam`
- Modify: `apps/web/app/mock-projections.ts`
- Modify: `apps/web/src/components/boot/EmaIdentityPanel.tsx`
- Modify: `apps/web/src/components/apps/blueprint/index.tsx`
- Modify: `apps/web/src/components/apps/agent-work/index.tsx`
- Modify: `apps/web/src/components/apps/agent-work/panels/agent-instruction-panel.tsx`
- Modify: `apps/web/src/components/apps/terminal/TerminalApp.tsx`
- Modify: `AGENTS.md`
- Modify: `docs/orchestration/functional-0.0.6-release-report.md`
- Create: `docs/orchestration/head-orchestrator/stale-0.0.5-inventory.md`

- [ ] **Step 1: Generate stale inventory**

Run:

```bash
rg -n "0\\.0\\.5|EMA-0\\.0\\.5|EMA 0\\.0\\.5|Founding-Fathers-EMA|Acme Holdings|Baker Labs|Demo Room|place\\.org >|Fake picker|pending_daemon_writer" \
  apps/cli/src apps/daemon/src apps/daemon/lib apps/web/src apps/web/app docs scripts tooling \
  > docs/orchestration/head-orchestrator/stale-0.0.5-inventory.md
```

Expected: inventory captures active-code hits separately from historical archive/docs hits.

- [ ] **Step 2: Patch active-code identity**

Replace active-code defaults:

| Current | Replace With |
|---|---|
| `EMA 0.0.5` | `EMA 0.0.6` |
| `EMA-0.0.5` active build paths | `EMA-0.0.6` |
| `Founding-Fathers-EMA` default current work | `Trajan's Organization / Personal Workspace / EMA` unless an archive/provenance doc |
| `place.org >` terminal prompt | `ema >` |
| `Acme Holdings` / `Baker Labs` fallback clients | Remove from active cockpit fallback; use Proslync only for pilot or empty client registry |
| `Demo Room` thread | `EMA coordination` |
| Root `AGENTS.md` 0.0.5 active-build defaults | 0.0.6 active-build defaults and current Proslync-first development posture |

- [ ] **Step 3: Preserve historical docs without lying**

For docs under `docs/plans/_archive`, `docs/orchestration/STATUS-archive-pre-2026-05-01.md`, and recovery ledgers, do not rewrite provenance. Add a banner only if the file is not already clearly archive/provenance:

```markdown
> Historical 0.0.5 provenance. Do not use as current 0.0.6 implementation truth.
```

- [ ] **Step 4: Validate**

Run:

```bash
rg -n "0\\.0\\.5|EMA-0\\.0\\.5|EMA 0\\.0\\.5|Founding-Fathers-EMA|Acme Holdings|Baker Labs|Demo Room|place\\.org >" \
  apps/cli/src apps/daemon/src apps/daemon/lib apps/web/src apps/web/app
pnpm --dir apps/web exec tsc --noEmit
cd apps/daemon && gleam check
```

Expected: no active-code stale identity hits except comments explicitly marked historical; typecheck and Gleam check pass.

## Sprint 1: System Environment Readiness

**Goal:** Settings and CLI tell the same truth about daemon/web/companion/install/static/build readiness.

**Lead:** Runtime Environment Orchestrator.

**Files:**
- Modify: `tooling/runtime-process-report.mjs`
- Modify: `tooling/reinstall-ema-0.0.6.mjs`
- Modify: `tooling/ema-functional-e2e.mjs`
- Modify: `apps/cli/src/commands/doctor.ts`
- Modify: `apps/daemon/src/ema_companion/ema_companion.gleam`
- Modify: `apps/desktop/src-tauri/src/companion_bridge.rs`
- Modify: `apps/desktop/src-tauri/src/companion_commands.rs`
- Modify: `apps/web/src/lib/popout-launcher.ts`
- Modify: `apps/web/src/lib/ipc.ts`
- Modify: `apps/web/src/lib/ipc/provider.tsx`
- Delete or consolidate: `apps/web/src/lib/ipc/ipc/*` if confirmed duplicate and unused
- Modify: `apps/web/src/components/apps/settings/pages/DaemonPage.tsx`
- Modify: `scripts/build-web-static-out.sh`
- Create: `apps/web/app/api/runtime/report/route.ts`
- Create: `apps/web/tests/e2e/settings-runtime.spec.ts`
- Create: `apps/web/tests/e2e/static-install-parity.spec.ts`

- [ ] **Step 1: Add real runtime report API and Settings cards**

Expose S1-S5 tracks in Settings:

```text
S1 Runtime Control Plane
S2 Static/Tauri Parity
S3 Settings System Center
S4 Projection/API Health
S5 Artifact Hygiene
```

Each card shows status, last evidence command, next command, and owner.

- [ ] **Step 2: Align companion truth**

Make daemon companion discovery agree with the installed Tauri companion. `ema desktop companion discover --json` must report:

```json
{
  "ok": true,
  "companion": {
    "daemon_claim": "available",
    "tauri_listener": "127.0.0.1:27182",
    "installed_app": "/Users/trajanm4air/Desktop/EMA 0.0.6.app"
  }
}
```

- [ ] **Step 3: Make native popout honest**

`openTauriCompanionWindow()` must not persist popout mode or return success until `invoke("companion_open_window")` resolves. If Tauri invoke fails, the UI must show the error and either stay inline or fall back to browser popout explicitly.

Validation:

```bash
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/popout-titlebar.spec.ts tests/e2e/tauri-frame-drag.spec.ts
```

Expected: popout mode changes only after confirmed success or visible fallback.

- [ ] **Step 4: Consolidate web IPC client**

Pick one browser IPC provider and one env var. Preferred:

```text
NEXT_PUBLIC_EMA_DAEMON_URL=ws://127.0.0.1:49555
```

Remove or quarantine the nested duplicate `apps/web/src/lib/ipc/ipc/*` after confirming no imports remain.

Validation:

```bash
find apps/web/src/lib/ipc -maxdepth 3 -type f | sort
rg -n 'NEXT_PUBLIC_EMA_(IPC|DAEMON)_URL|from "@/src/lib/ipc' apps/web/src apps/web/app
pnpm --dir apps/web exec tsc --noEmit
```

Expected: one daemon URL env var and one provider path.

- [ ] **Step 5: Make release dry-run useful**

Add `--preflight-only` to `tooling/reinstall-ema-0.0.6.mjs` that executes build/typecheck/smoke without deleting/replacing the app. Keep `--dry-run` as print-only.

- [ ] **Step 6: Add static install parity gate**

The installed app must be tested against static output, not only the dev server. Build static output, serve it on a temporary port, and verify:

- `/popout/<appId>` resolves for priority popout-capable vApps.
- Cockpit renders with honest static fallback when API routes are unavailable.
- No UI claims daemon/API writes succeeded unless the daemon path actually succeeded.

Validation:

```bash
bash scripts/build-web-static-out.sh
find apps/web/out -maxdepth 3 -path '*popout*' -print
EMA_E2E_BASE_URL=http://127.0.0.1:4174 pnpm --dir apps/web exec playwright test tests/e2e/static-install-parity.spec.ts
```

Expected: static bundle proves the same user-visible Proslync cockpit/popout paths that the installed app depends on.

- [ ] **Step 7: Validate**

Run:

```bash
pnpm runtime:report
pnpm release:reinstall:dry
node tooling/reinstall-ema-0.0.6.mjs --preflight-only
pnpm cli doctor --json
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/settings-runtime.spec.ts
EMA_E2E_BASE_URL=http://127.0.0.1:4174 pnpm --dir apps/web exec playwright test tests/e2e/static-install-parity.spec.ts
```

Expected: all pass; Settings exposes runtime tracks; static-install parity is proven before reinstall.

## Sprint 2: Proslync Cockpit Real Write Bridge

**Goal:** Proslync cockpit becomes the first real client-work cockpit: captures and agent prompts create daemon/queue records instead of synthetic responses.

**Lead:** Proslync Cockpit Orchestrator.

**Files:**
- Modify: `apps/web/src/vapps/cockpit/data/projections.ts`
- Modify: `apps/web/app/api/cockpit/projection/route.ts`
- Modify: `apps/web/app/api/cockpit/intentions/route.ts`
- Modify: `apps/cli/src/commands/cockpit.ts`
- Modify: `apps/cli/src/commands/queue.ts`
- Modify: `apps/web/tests/e2e/cockpit-proslync.spec.ts`
- Create: `apps/web/tests/e2e/cockpit-write-bridge.spec.ts`

- [ ] **Step 1: Replace synthetic queue capture**

`publishQueueCapture` must call a real queue writer:

```text
ema queue add --project proslync-app-ios-final --title <title> --why <body> --json
```

If daemon is unavailable, return a visible error state, not a fake queue ID.

- [ ] **Step 2: Replace synthetic agent chat**

`publishAgentMessage` must create an intention or queue item tagged `source=cockpit-agent-chat`. It may be dry-run until Sprint 3, but it must render the dry-run state honestly.

- [ ] **Step 3: Keep Proslync as pilot without hardcoding the architecture**

Projection accepts `?project=proslync-app-ios-final` and the CLI accepts `--project proslync-app-ios-final`. The Proslync constants move into a project registry object, not scattered top-level constants.

- [ ] **Step 4: Validate**

Run:

```bash
node apps/cli/dist/bin.js cockpit workpack --project proslync-app-ios-final --json
node apps/cli/dist/bin.js queue list --project proslync-app-ios-final --json
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/cockpit-write-bridge.spec.ts
```

Expected: new queue item appears after cockpit capture.

## Sprint 3: Coordination Writers And Intention Backfeed

**Goal:** Agents can open/claim lanes, add/close queue items, and promote accepted intentions into queue items with evidence.

**Lead:** Coordination Writer Orchestrator plus Intention Backfeed Orchestrator.

**Files:**
- Modify: `apps/cli/src/commands/{lane,queue,agent,checkup,intention}.ts`
- Modify: `apps/daemon/src/ema_swarm_coordination/agent_workspace.gleam`
- Modify: `apps/daemon/src/ema_daemon/bus.gleam`
- Modify: `apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam`
- Modify: `apps/daemon/lib/ema_intention_farmer/**`
- Create: `tooling/agent-workspace-round-trip.mjs`
- Create: `apps/web/tests/e2e/agent-work-command-ipc.spec.ts`

- [ ] **Step 1: Supported commands**

These commands must be daemon-backed:

```text
ema lane list --json
ema lane open --project <id> --title <title> --json
ema lane claim --lane <id> --actor <actor> --scope <scope> --goal <goal> --next <next> --json
ema queue list --project <id> --json
ema queue add --project <id> --title <title> --why <text> --json
ema queue close --queue-item <id> --result <text> --json
ema agent orient --project <id> --json
ema checkup runtime --json
ema intention backfeed --intent <id> --destination queue --approve reviewed --json
```

- [ ] **Step 2: Agent Work controls mutate daemon state**

The Agent Work command panel must execute or dispatch these supported commands. Copy-only is allowed as a secondary action, not the primary path.

- [ ] **Step 3: Validate**

Run:

```bash
pnpm --filter @ema/cli typecheck
pnpm build:cli
node tooling/agent-workspace-round-trip.mjs
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/agent-work-command-ipc.spec.ts
```

Expected: no supported command returns `pending_daemon_writer`.

## Sprint 4: Priority vApp Buildout For Proslync Work

**Goal:** The 15 priority vApps are not just mountable; they are useful for Proslync work.

**Lead:** VApp Polish Orchestrator.

**Priority vApps:**

```text
launchpad, cockpit, agent-work, hq, atlas, blueprint, chronicle,
git-ema, clients, threads, wiki, settings, place-tools, terminal, finder
```

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/src/components/apps/{launchpad,agent-work,hq,atlas,blueprint,chronicle,git-ema,clients,threads,wiki,settings,place-tools,terminal,finder}/**`
- Modify: `apps/web/tests/e2e/all-usable-vapps.spec.ts`
- Create: `apps/web/tests/e2e/proslync-first-vapps.spec.ts`

- [ ] **Step 1: Role requirements**

Each priority vApp must have:

| vApp | Proslync-first value |
|---|---|
| `launchpad` | current project resume and Proslync entry |
| `cockpit` | active builds, lanes, queue, intentions, surfaces |
| `agent-work` | command execution for lane/queue/checkup |
| `hq` | runtime/project pulse |
| `atlas` | project/source map and deep links |
| `blueprint` | active plan/decision/canon surface |
| `chronicle` | event/session replay |
| `git-ema` | source attachments and repo/file import |
| `clients` | Ms. Wilson/Proslync boundary and projects |
| `threads` | coordination notes tied to daemon channel |
| `wiki` | doctrine and working memory |
| `settings` | runtime tracks and environment health |
| `place-tools` | demoted but coherent utility drawer |
| `terminal` | safe EMA command recipes and real CLI bridge |
| `finder` | Desktop Projects/Active builds roots |

- [ ] **Step 2: E2E**

Run:

```bash
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/proslync-first-vapps.spec.ts
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/all-usable-vapps.spec.ts
```

Expected: priority 15 pass stronger assertions; all 46 remain mountable.

## Sprint 5: Harness And Execution Registry

**Goal:** EMA can track actual provider/harness executions for Proslync implementation work.

**Lead:** Runtime Environment Orchestrator plus Head Orchestrator.

**Files:**
- Modify: `apps/cli/src/commands/harness.ts`
- Modify: `apps/cli/src/commands/hermes.ts`
- Modify: `apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam`
- Modify: `apps/web/src/components/apps/agent-work/**`
- Create: `apps/web/tests/e2e/harness-registry.spec.ts`

- [ ] **Step 1: Simulated provider first**

`ema harness dispatch --provider simulated --prompt smoke --json` creates a real dispatch/execution/tool timeline projection.

- [ ] **Step 2: Provider adapters next**

Codex/Claude provider adapters may remain guarded, but they must return `unsupported_provider_adapter` with remediation, not `pending_provider_adapter`.

- [ ] **Step 3: Validate**

Run:

```bash
node apps/cli/dist/bin.js harness dispatch --provider simulated --prompt smoke --json
node apps/cli/dist/bin.js hermes orient --json
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/harness-registry.spec.ts
```

Expected: Agent Work and Chronicle can see the dispatch/execution events.

---

## Sprint Acceptance Gates

Every sprint must end with:

```bash
pnpm --filter @ema/cli typecheck
pnpm build:cli
pnpm --dir apps/web exec tsc --noEmit
cd apps/daemon && gleam check
pnpm e2e:functional
pnpm runtime:report
```

Install gate after Sprint 1 or later:

```bash
pnpm release:reinstall:dry
node tooling/reinstall-ema-0.0.6.mjs --preflight-only
bash scripts/build-web-static-out.sh
EMA_E2E_BASE_URL=http://127.0.0.1:4174 pnpm --dir apps/web exec playwright test tests/e2e/static-install-parity.spec.ts
pnpm release:reinstall
open "/Users/trajanm4air/Desktop/EMA 0.0.6.app"
pnpm runtime:report
```

## Stop Lines

- Do not run Proslync implementation swarms until Sprint 2 and Sprint 3 pass.
- Do not delete historical 0.0.5 docs; archive/banner them unless active code imports them.
- Do not let supported commands return `pending_daemon_writer`.
- Do not let cockpit writes create fake queue IDs.
- Do not mark the installed app ready unless daemon/web/companion truth is visible in Settings and `pnpm runtime:report`.
- Do not accept dev-server-only Playwright as installed-app proof; static export and popout parity must pass.

## Done Criteria

- Proslync is visible as the pilot client project in EMA without being hardcoded into every cockpit layer.
- Active code has no stale 0.0.5 runtime identity leaks.
- Settings exposes S1-S5 environment tracks.
- Static export proves cockpit and popout parity for installed EMA.
- Cockpit capture/chat backfeeds real queue/intention records.
- Lane/queue/agent/checkup/intention supported commands are daemon-backed.
- Priority 15 vApps pass Proslync-first assertions.
- Agent Work can execute or dispatch at least one real coordination command.
- Functional E2E and reinstall gates pass.
