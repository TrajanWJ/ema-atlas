# EMA System Environment And Stub Buildout Head-Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn EMA 0.0.6 from a partially wired desktop shell into a durable agent-work operating environment: system tracks visible in Settings, 15 priority vApps coherent, stubs inventoried, and the highest-value stubs converted into real CLI/daemon/web flows.

**Architecture:** Treat this as a head-orchestrator campaign with disjoint lanes. System/environment lanes own runtime health, static/Tauri parity, Settings control surfaces, artifact hygiene, and projection/API health. Stub-buildout lanes own conversion of `pending_daemon_writer`, staged projection, and placeholder vApp flows into daemon-backed or explicitly local workflows.

**Tech Stack:** Gleam/BEAM daemon, TypeScript CLI, Next.js 16 web shell, Tauri v2 desktop, Playwright, Node release tooling, EMA lane/queue records, local Proslync active builds.

---

## Current Scope

### Priority 15 vApps

First 10 agent-work spine:

1. `launchpad`
2. `cockpit`
3. `agent-work`
4. `hq`
5. `atlas`
6. `blueprint`
7. `chronicle`
8. `git-ema`
9. `clients`
10. `threads`

Additional 5 system/operator vApps:

11. `wiki`
12. `settings`
13. `place-tools`
14. `terminal`
15. `finder`

### New System/Environment Tracks

| Track | Purpose | Primary Files | Done When |
|---|---|---|---|
| S1 Runtime Control Plane | Make daemon/web/companion/install state visible and actionable | `tooling/runtime-process-report.mjs`, `scripts/dev-*.sh`, `scripts/stop-ema-dev.sh`, `apps/web/src/components/apps/settings/pages/DaemonPage.tsx` | Settings shows current process state, stale pidfiles, listener ports, installed app path, and next command |
| S2 Static/Tauri Parity | Stop dev-only success from hiding installed-app failures | `tooling/ema-functional-e2e.mjs`, `tooling/reinstall-ema-0.0.6.mjs`, `apps/web/playwright.config.ts`, `apps/web/app/[vapp]/page.tsx`, `apps/web/app/canvas/page.tsx` | One command validates dev, static export, Tauri bundle, and installed app smoke |
| S3 Settings System Center | Make environment tracks visible as first-class operator UI | `apps/web/src/components/apps/settings/SettingsApp.tsx`, `SettingsSidebar.tsx`, `pages/{DaemonPage,WorkspacePage,DataPage,IdentityPage}.tsx` | Settings has a Runtime tab with tracks S1-S5, command snippets, and evidence statuses |
| S4 Projection/API Health | Make staged/live projection status explicit across cockpit and vApps | `apps/web/src/projections/*`, `apps/web/src/vapps/cockpit/data/*`, `apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam` | Every priority vApp renders live/staged/offline state; no hidden mock dependency |
| S5 Artifact Hygiene | Remove generated screenshots, stale duplicates, and archive-copy clutter from active diffs | `.gitignore`, `tooling/artifact-hygiene-report.mjs`, `docs/orchestration/functional-0.0.6-release-report.md` | `pnpm hygiene:report` identifies tracked/untracked artifacts and recommended move/delete actions without destructive default |

### Stub Buildout Tracks

| Track | Purpose | Primary Files | Done When |
|---|---|---|---|
| B1 CLI Writer Unstub | Convert `runStubContract` commands to real daemon-backed flows | `apps/cli/src/commands/{queue,swarm,checkup,lane,agent}.ts`, `apps/cli/src/commands/stub-contract.ts` | Selected commands return real IDs and never return `pending_daemon_writer` for supported subcommands |
| B2 Lane/Queue Daemon Writers | Persist lane/queue lifecycle through daemon state | `apps/daemon/src/ema_swarm_coordination/agent_workspace.gleam`, `apps/daemon/src/ema_daemon/bus.gleam`, `packages/contracts/events/{lane,queue}.md` | `ema lane open/list/claim` and `ema queue add/list/close` replay across daemon restart |
| B3 Projection Writer Pack | Replace staged projections for topbar, HQ, Blueprint, git-ema, Agent Work, Threads | `apps/daemon/src/ema_blueprint/*`, `ema_attachments/*`, `ema_swarm_coordination/*`, `apps/web/src/projections/*` | Priority vApps show live projection badges when daemon is up |
| B4 Intention-To-Queue Backfeed | Turn accepted intentions into evidence-linked queue items | `apps/cli/src/commands/intention.ts`, `apps/daemon/lib/ema_intention_farmer/**`, `.ema-dev/intention-backfeed/reviews.json` | Accepted intent creates a queue dry-run and real queue item with source evidence |
| B5 VApp Backend Bindings | Give priority vApps real operator actions instead of copy-only displays | `apps/web/src/components/apps/{wiki,threads,git-ema,clients,agent-work,settings}/**`, `apps/web/app/api/**` | Each priority vApp has at least one read path and one safe action path with E2E |

---

## Task 1: Establish Stub Inventory And Ownership

**Files:**
- Create: `docs/orchestration/head-orchestrator/stub-buildout-inventory.md`
- Create: `tooling/stub-inventory-report.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create the inventory report script**

Create `tooling/stub-inventory-report.mjs`:

```js
#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const roots = [
  "apps/cli/src",
  "apps/daemon/src",
  "apps/daemon/lib",
  "apps/web/src",
  "apps/web/app",
  "tooling",
  "scripts",
];

const pattern = "TODO|stub|Stub|coming soon|Coming soon|not implemented|Not implemented|placeholder|pending_daemon_writer|pending daemon writer|wire in|wires in|mock fallback|staged projection";

const rg = execFileSync("rg", ["-n", pattern, ...roots], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

const rows = rg
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [file, lineNo, ...rest] = line.split(":");
    const text = rest.join(":").trim();
    let lane = "review";
    if (file.includes("apps/cli/src/commands")) lane = "B1 CLI Writer Unstub";
    if (file.includes("apps/daemon")) lane = "B2/B3 Daemon Writers";
    if (file.includes("apps/web/src/projections")) lane = "B3 Projection Writer Pack";
    if (file.includes("apps/web/src/components/apps")) lane = "B5 VApp Backend Bindings";
    if (file.includes("settings")) lane = "S3 Settings System Center";
    if (file.includes("tooling") || file.includes("scripts")) lane = "S1/S2 Runtime";
    return { file, line: Number(lineNo), lane, text };
  });

console.log(JSON.stringify({ ok: true, count: rows.length, rows }, null, 2));
```

- [ ] **Step 2: Register the script**

Patch `package.json`:

```json
"stub:inventory": "node tooling/stub-inventory-report.mjs"
```

- [ ] **Step 3: Generate the durable inventory**

Run:

```bash
pnpm stub:inventory > docs/orchestration/head-orchestrator/stub-buildout-inventory.md.json
node tooling/stub-inventory-report.mjs | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(`# Stub Buildout Inventory\\n\\nCount: ${j.count}\\n`); for (const r of j.rows.slice(0,80)) console.log(`- ${r.lane}: ${r.file}:${r.line} — ${r.text}`);})' > docs/orchestration/head-orchestrator/stub-buildout-inventory.md
```

Expected: inventory file exists and top rows classify stubs by lane.

## Task 2: Build The System Environment Tracks In Settings

**Files:**
- Modify: `apps/web/src/components/apps/settings/pages/DaemonPage.tsx`
- Modify: `apps/web/src/components/apps/settings/pages/DataPage.tsx`
- Modify: `apps/web/src/components/apps/settings/pages/WorkspacePage.tsx`
- Modify: `apps/web/src/components/apps/settings/SettingsSidebar.tsx`
- Create: `apps/web/app/api/runtime/report/route.ts`
- Test: `apps/web/tests/e2e/settings-runtime.spec.ts`

- [ ] **Step 1: Add runtime report API**

Create `apps/web/app/api/runtime/report/route.ts`:

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

export async function GET() {
  try {
    const { stdout } = await execFileP("node", ["tooling/runtime-process-report.mjs"], {
      cwd: process.cwd().replace(/\/apps\/web$/, ""),
      maxBuffer: 8 * 1024 * 1024,
    });
    return Response.json(JSON.parse(stdout));
  } catch (error) {
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
```

- [ ] **Step 2: Render the five tracks**

Patch `DaemonPage.tsx` so it renders cards for S1-S5:

```tsx
const TRACKS = [
  ["S1", "Runtime Control Plane", "daemon/web/companion/install state"],
  ["S2", "Static/Tauri Parity", "dev, static export, bundle, installed smoke"],
  ["S3", "Settings System Center", "operator-visible environment controls"],
  ["S4", "Projection/API Health", "live/staged/offline projection state"],
  ["S5", "Artifact Hygiene", "generated outputs and stale duplicate cleanup"],
] as const;
```

Each card must show:
- track id,
- current status,
- next command,
- owning files.

- [ ] **Step 3: Add E2E**

Create `apps/web/tests/e2e/settings-runtime.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("settings exposes system environment tracks", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("place-welcome-dismissed", "true"));
  await page.goto("/settings?test=1");
  await page.waitForLoadState("networkidle");
  await expect(page.locator('[data-panel-app="settings"]')).toBeVisible();
  await expect(page.getByText("Runtime Control Plane")).toBeVisible();
  await expect(page.getByText("Static/Tauri Parity")).toBeVisible();
  await expect(page.getByText("Projection/API Health")).toBeVisible();
  await expect(page.getByText("Artifact Hygiene")).toBeVisible();
});
```

- [ ] **Step 4: Validate**

Run:

```bash
pnpm --dir apps/web exec tsc --noEmit
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/settings-runtime.spec.ts
```

Expected: both pass.

## Task 3: Convert CLI Stubs Into Supported Writer Commands

**Files:**
- Modify: `apps/cli/src/commands/queue.ts`
- Modify: `apps/cli/src/commands/lane.ts`
- Modify: `apps/cli/src/commands/agent.ts`
- Modify: `apps/cli/src/commands/checkup.ts`
- Modify: `apps/cli/src/commands/stub-contract.ts`
- Test: `tooling/agent-workspace-round-trip.mjs`

- [ ] **Step 1: Choose supported commands**

Support these first:

```text
ema lane list --json
ema lane open --project <id> --title <title> --json
ema lane claim --lane <id> --actor <actor> --scope <scope> --goal <goal> --next <next> --json
ema queue list --project <id> --json
ema queue add --project <id> --title <title> --why <text> --json
ema queue close --queue-item <id> --result <text> --json
ema agent orient --project <id> --json
ema checkup runtime --json
```

- [ ] **Step 2: Keep unsupported commands honest**

Patch `stub-contract.ts` so unsupported commands return:

```json
{
  "ok": false,
  "code": "unsupported_command",
  "supported": ["lane list", "lane open", "lane claim", "queue list", "queue add", "queue close", "agent orient", "checkup runtime"]
}
```

Expected: no supported command returns `pending_daemon_writer`.

- [ ] **Step 3: Validate**

Run:

```bash
pnpm --filter @ema/cli typecheck
pnpm build:cli
node apps/cli/dist/bin.js lane list --json
node apps/cli/dist/bin.js queue list --project proslync-app-ios-final --json
node apps/cli/dist/bin.js checkup runtime --json
```

Expected: supported commands return `ok: true`; unsupported commands return `unsupported_command`, not `pending_daemon_writer`.

## Task 4: Build Daemon Lane/Queue Writers

**Files:**
- Modify: `apps/daemon/src/ema_swarm_coordination/agent_workspace.gleam`
- Modify: `apps/daemon/src/ema_daemon/bus.gleam`
- Modify: `apps/daemon/src/ema_shell_ipc/ema_shell_ipc.gleam`
- Create: `apps/daemon/test/ema_agent_workspace_writer_test.gleam`
- Modify: `packages/contracts/events/lane.md`
- Modify: `packages/contracts/events/queue.md`

- [ ] **Step 1: Add writer event contracts**

Document event names:

```text
lane.opened
lane.claimed
lane.status_changed
queue.item_added
queue.item_closed
```

- [ ] **Step 2: Add daemon tests**

Create a daemon test that:
- opens a lane,
- claims it,
- adds a queue item,
- closes it,
- replays the projection.

- [ ] **Step 3: Validate**

Run:

```bash
cd apps/daemon && gleam test
cd apps/daemon && gleam check
```

Expected: tests pass and writer projection is deterministic.

## Task 5: Projection Writer Pack

**Files:**
- Modify: `apps/daemon/src/ema_blueprint/ema_blueprint.gleam`
- Modify: `apps/daemon/src/ema_attachments/attachments.gleam`
- Modify: `apps/daemon/src/ema_swarm_coordination/agent_workspace.gleam`
- Modify: `apps/web/src/projections/use-blueprint-sections.ts`
- Modify: `apps/web/src/projections/use-connectors.ts`
- Modify: `apps/web/src/projections/use-see-agent-work.ts`
- Modify: `apps/web/src/projections/use-hq-pulse.ts`
- Test: `apps/web/tests/e2e/projection-health.spec.ts`

- [ ] **Step 1: Add projection health metadata**

Every projection hook returns:

```ts
{
  data,
  offline: boolean,
  source: "daemon" | "staged" | "local",
  projectionName: string
}
```

- [ ] **Step 2: Render badges in priority vApps**

Priority vApps render one visible badge:

```text
daemon projection
staged projection
local only
```

- [ ] **Step 3: Validate**

Run:

```bash
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/projection-health.spec.ts
```

Expected: `cockpit`, `agent-work`, `hq`, `blueprint`, `git-ema`, `chronicle`, `wiki`, and `threads` each render a projection/state badge.

## Task 6: Build Out The 15 Priority vApps

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/src/components/apps/launchpad/index.tsx`
- Modify: `apps/web/src/vapps/cockpit/**`
- Modify: `apps/web/src/components/apps/agent-work/**`
- Modify: `apps/web/src/components/apps/hq/index.tsx`
- Modify: `apps/web/src/components/apps/atlas/AtlasApp.tsx`
- Modify: `apps/web/src/components/apps/blueprint/**`
- Modify: `apps/web/src/components/apps/chronicle/index.tsx`
- Modify: `apps/web/src/components/apps/git-ema/**`
- Modify: `apps/web/src/components/apps/clients/ClientsApp.tsx`
- Modify: `apps/web/src/components/apps/threads/index.tsx`
- Modify: `apps/web/src/components/apps/wiki/index.tsx`
- Modify: `apps/web/src/components/apps/settings/**`
- Modify: `apps/web/src/components/apps/place-tools/index.tsx`
- Modify: `apps/web/src/components/apps/terminal/TerminalApp.tsx`
- Modify: `apps/web/src/components/apps/finder/FinderApp.tsx`
- Test: `apps/web/tests/e2e/all-usable-vapps.spec.ts`

- [ ] **Step 1: Establish shared visual contract**

All 15 vApps must have:
- `data-app="<id>"`,
- visible title,
- state/projection badge,
- at least one meaningful action,
- no “section 1/section 2” copy,
- no “coming soon” as the main content,
- responsive layout at `1280x800`.

- [ ] **Step 2: Build each vApp to its role**

Use this role map:

| vApp | Must Show |
|---|---|
| `launchpad` | client cockpit, next work, recent surfaces, grouped vApps |
| `cockpit` | Proslync builds, lanes, queue, intentions, health |
| `agent-work` | lanes, queue, agents, command recipes, vCalendar |
| `hq` | system pulse, surface switchboard, controls, event trail |
| `atlas` | project map, routes, source docs, CWT boundary |
| `blueprint` | section tree, intent, attachments, decisions, canon |
| `chronicle` | events, sessions, source filter, detail pane |
| `git-ema` | connectors, attachments, import/source actions |
| `clients` | client/project boundary, launch targets, ownership |
| `threads` | coordination thread list and readable detail |
| `wiki` | doctrine search and readable article pane |
| `settings` | S1-S5 system tracks and runtime evidence |
| `place-tools` | grouped desktop tools with search and clear purpose |
| `terminal` | safe command recipes and environment commands |
| `finder` | project roots, active builds, artifacts, release outputs |

- [ ] **Step 3: Validate**

Run:

```bash
pnpm --dir apps/web exec tsc --noEmit
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/all-usable-vapps.spec.ts
```

Expected: all 46 route checks pass; priority 15 have visible title and action.

## Task 7: Artifact Hygiene And Release Evidence

**Files:**
- Create: `tooling/artifact-hygiene-report.mjs`
- Modify: `.gitignore`
- Modify: `docs/orchestration/functional-0.0.6-release-report.md`
- Modify: `docs/orchestration/STATUS.md`
- Modify: `/Users/trajanm4air/Desktop/Projects/EMA/builds/0.0.6/BUILD.md`

- [ ] **Step 1: Add hygiene reporter**

Create `tooling/artifact-hygiene-report.mjs`:

```js
#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const status = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
const rows = status.trim().split("\n").filter(Boolean);
const artifacts = rows.filter((row) =>
  row.includes("tests/screenshots/_runs/") ||
  row.includes("playwright-report") ||
  row.includes(".tsbuildinfo") ||
  row.includes(".next/") ||
  row.includes(" 2.md")
);
console.log(JSON.stringify({ ok: true, artifact_count: artifacts.length, artifacts }, null, 2));
```

- [ ] **Step 2: Register hygiene script**

Patch `package.json`:

```json
"hygiene:report": "node tooling/artifact-hygiene-report.mjs"
```

- [ ] **Step 3: Validate**

Run:

```bash
pnpm hygiene:report
git status --short
```

Expected: artifact report identifies generated noise; no destructive cleanup runs by default.

## Task 8: End-To-End Release Gate

**Files:**
- Modify: `tooling/ema-functional-e2e.mjs`
- Modify: `docs/orchestration/functional-0.0.6-release-report.md`

- [ ] **Step 1: Add all new gates**

Functional E2E must include:

```text
pnpm runtime:report
pnpm stub:inventory
pnpm hygiene:report
pnpm --filter @ema/cli typecheck
pnpm build:cli
pnpm --dir apps/web exec tsc --noEmit
node apps/cli/dist/bin.js cockpit workpack --project proslync-app-ios-final --json
node apps/cli/dist/bin.js checkup runtime --json
Playwright all-usable-vapps
Playwright settings-runtime
Playwright tauri-frame-drag
Playwright popout-titlebar
```

- [ ] **Step 2: Validate**

Run:

```bash
pnpm e2e:functional
pnpm release:reinstall:dry
pnpm release:reinstall
pnpm runtime:report
```

Expected:
- functional E2E passes,
- reinstall dry-run passes before replacement,
- reinstall backs up existing app,
- installed app exists,
- daemon/web/companion are visible after restart.

---

## Done Criteria

- Settings exposes S1-S5 system/environment tracks.
- `pnpm stub:inventory` exists and produces lane-classified stub inventory.
- `pending_daemon_writer` remains only for unsupported commands; supported CLI commands return real data.
- Lane/queue writer commands persist through daemon state and replay after restart.
- Priority 15 vApps are visually coherent with the desktop shell and each has a visible purpose/action.
- All 46 usable vApps mount in holodeck mode.
- Functional E2E includes all-vApp, runtime, workpack, settings, drag, popout, stub, and hygiene checks.
- Release report records the exact command evidence.
- Existing dirty work is preserved; generated artifacts are reported, not destructively deleted.
