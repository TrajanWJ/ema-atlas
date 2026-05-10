# EMA Functional 0.0.6 Head-Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make EMA 0.0.6 reinstallable, daemon-coherent, Proslync-ready, intention-aware, and visibly usable as the local project cockpit for client work.

**Architecture:** Treat this as a release-candidate orchestration campaign, not a UI polish pass. The head orchestrator owns the acceptance contract; sub-orchestrator tracks own runtime shutdown/reinstall, Proslync cockpit linking, intention recovery, UI refresh, and end-to-end testing. Every track writes through existing daemon/CLI surfaces where possible and records exact evidence before the installed app replaces the current desktop app.

**Tech Stack:** Gleam/BEAM daemon on `ws://127.0.0.1:49555`, TypeScript CLI, Next.js 16 cockpit/web shell on `:5173`, Tauri v2 desktop app, Playwright, Node smoke tooling, EMA daemon lane/queue records, Proslync active builds.

---

## Current Verified State At Plan Creation

Observed from `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6` on 2026-05-10:

| Facet | Observed |
|---|---|
| Branch / HEAD | `bootstrap/m2-m3-shell-port` / `3f92b37` |
| Dirty worktree | Significant existing dirty state; preserve all unrelated changes |
| Daemon listener | `beam.smp` PID `4852` on `127.0.0.1:49555` |
| Web listener | `node` PID `4989` on `*:5173` |
| Stale pidfiles | `.ema-dev/pids/daemon.pid=3882`, `.ema-dev/pids/web.pid=3905` |
| Installed app | `/Users/trajanm4air/Desktop/EMA 0.0.6.app`, `kMDItemVersion=0.0.6` |
| Project symlink | `/Users/trajanm4air/Desktop/Projects/EMA/code -> ../../Active builds/EMA-0.0.6` |
| Stale durable records | `Projects/EMA/project.md`, `PROJECT-MAP.md`, `docs/WORKSPACE-ENTRYPOINT.md`, and some build docs still say `0.0.5` |
| Scope warning | home-current project is `sift`; workspace scope resolves to `EMA` by cwd |
| Proslync intention harvest | `100` sources, `552` candidates, `142` Proslync-relevant, `350` lost follow-ups |

## Head-Orchestrator Tracks

| Track | Owner Shape | Write Scope | Done When |
|---|---|---|---|
| Runtime release | Runtime sub-orchestrator | `scripts/`, `tooling/`, `apps/desktop/src-tauri/`, build docs | Active daemon/web can stop cleanly, current app can be removed/reinstalled, installed app opens against current 0.0.6 |
| Proslync workspace | Proslync cockpit sub-orchestrator | `apps/cli/src/commands/cockpit.ts`, `apps/web/src/vapps/cockpit/**`, project records | EMA shows Proslync as a first-class client project with all active builds, surfaces, lanes, queue, intentions |
| Intention recovery | Backfeed sub-orchestrator | `apps/cli/src/commands/intention.ts`, `apps/daemon/lib/ema_intention_farmer/**`, cockpit intention UI | Recovered intentions are reviewable, accept/rejectable, and can create evidence-linked queue items |
| UI refresh | UI sub-orchestrator | `apps/web/src/components/**`, `apps/web/src/vapps/cockpit/**`, design tokens only as needed | Cockpit is the native client-work home, not a hidden or broken vApp |
| E2E verification | Test sub-orchestrator | `tooling/`, `apps/web/tests/`, release report | One command proves daemon, web, cockpit, Proslync projection, intention projection, Tauri bundle, and installed app smoke |
| Doctrine/save | Docs sub-orchestrator | `README.md`, `docs/WORKSPACE-ENTRYPOINT.md`, `Projects/EMA/**`, `docs/orchestration/STATUS.md` | Durable records agree on 0.0.6 and point future agents at the functional workflow |

## Non-Negotiables

- Preserve dirty work. Do not reset, clean, stash, checkout, or revert unrelated files.
- Do not delete `/Users/trajanm4air/Desktop/EMA 0.0.6.app` until a fresh Tauri bundle exists and runtime smoke passes.
- Deletion means "replace the installed app"; the script must support a dry-run and a timestamped backup path before `rm -rf`.
- The daemon is truth. UI may render file-backed fallbacks, but writes must go through CLI/daemon commands.
- Proslync is a client-work project in EMA, not a separate space and not only a web link.
- End-to-end testing is a real sub-orchestrator track with its own scripts and output report.

## Files To Create Or Modify

### Create

- `tooling/runtime-process-report.mjs` — reports daemon/web/native app/process/pidfile state in JSON.
- `tooling/reinstall-ema-0.0.6.mjs` — gated stop/build/delete/install/smoke runner.
- `tooling/ema-functional-e2e.mjs` — full end-to-end verification orchestrator.
- `apps/web/tests/e2e/cockpit-proslync.spec.ts` — browser-level cockpit Proslync test.
- `apps/web/tests/e2e/launchpad-cockpit.spec.ts` — launchpad/cockpit visibility test.
- `docs/orchestration/functional-0.0.6-release-report.md` — generated release report.
- `docs/orchestration/head-orchestrator/README.md` — human-readable campaign board.

### Modify

- `scripts/stop-ema-dev.sh` — add stale-pid detection and optional listener kill report.
- `scripts/install-macos-tauri-app.sh` — align docs/output with `EMA 0.0.6.app`.
- `package.json` — add `runtime:report`, `release:reinstall`, `e2e:functional` scripts.
- `README.md` — fix `0.0.5` launcher references.
- `docs/WORKSPACE-ENTRYPOINT.md` — update to 0.0.6 and make cockpit/intention cold-start canonical.
- `/Users/trajanm4air/Desktop/Projects/EMA/project.md` — set current build to `0.0.6`.
- `/Users/trajanm4air/Desktop/Projects/EMA/PROJECT-MAP.md` — set active build references to `0.0.6`.
- `/Users/trajanm4air/Desktop/Projects/EMA/builds/0.0.6/BUILD.md` — update head, dirty-state policy, release evidence.
- `apps/cli/src/commands/cockpit.ts` — align CLI surfaces with web cockpit surfaces.
- `apps/cli/src/commands/intention.ts` — persist review state and expose accept/reject/list filters.
- `apps/web/src/vapps/cockpit/**` — UI refresh and action wiring.
- `apps/web/src/components/apps/launchpad/index.tsx` and desktop shortcuts if cockpit is not discoverable enough.

---

## Task 1: Establish The Head-Orchestrator Release Board

**Files:**
- Create: `docs/orchestration/head-orchestrator/README.md`
- Create: `docs/orchestration/functional-0.0.6-release-report.md`
- Modify: `docs/superpowers/plans/2026-05-10-ema-functional-0.0.6-head-orchestrator.md`

- [x] **Step 1: Create the campaign board**

Create `docs/orchestration/head-orchestrator/README.md`:

```markdown
# EMA 0.0.6 Head Orchestrator

Status: active.
Goal: ship a functional local 0.0.6 install that can run Proslync work.

## Tracks

| Track | Owner | Status | Evidence |
|---|---|---|---|
| Runtime release | runtime sub-orchestrator | open | `tooling/runtime-process-report.mjs` |
| Proslync workspace | cockpit sub-orchestrator | open | `ema cockpit projection --project proslync-app-ios-final --json` |
| Intention recovery | backfeed sub-orchestrator | open | `ema cockpit intentions --project proslync-app-ios-final --json` |
| UI refresh | UI sub-orchestrator | open | Playwright screenshots |
| E2E verification | test sub-orchestrator | open | `pnpm e2e:functional` |
| Doctrine/save | docs sub-orchestrator | open | build/project record diffs |

## Stop Line

Do not replace `/Users/trajanm4air/Desktop/EMA 0.0.6.app` until:

- CLI typecheck passes.
- Daemon tests pass.
- Web build passes.
- Runtime process report can identify live daemon/web listeners.
- Reinstall dry-run passes.
- Cockpit shows Proslync active builds, surfaces, queue, lanes, and intentions.
```

- [x] **Step 2: Create the release report shell**

Create `docs/orchestration/functional-0.0.6-release-report.md`:

```markdown
# EMA Functional 0.0.6 Release Report

Generated by the head-orchestrator campaign.

## Runtime

| Check | Result | Evidence |
|---|---|---|

## Proslync Cockpit

| Check | Result | Evidence |
|---|---|---|

## Intention Recovery

| Check | Result | Evidence |
|---|---|---|

## Installed App

| Check | Result | Evidence |
|---|---|---|

## Open Risks

| Risk | Owner | Next Command |
|---|---|---|
```

- [x] **Step 3: Validate the board files**

Run:

```bash
test -f docs/orchestration/head-orchestrator/README.md
test -f docs/orchestration/functional-0.0.6-release-report.md
rg -n "Runtime release|Proslync workspace|Intention recovery|E2E verification" docs/orchestration/head-orchestrator/README.md
```

Expected: all commands exit 0.

## Task 2: Add Runtime Process Reporting

**Files:**
- Create: `tooling/runtime-process-report.mjs`
- Modify: `package.json`

- [x] **Step 1: Add the process reporter**

Create `tooling/runtime-process-report.mjs`:

```js
#!/usr/bin/env node
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const ROOT = resolve(new URL("..", import.meta.url).pathname);
const PID_DIR = join(ROOT, ".ema-dev", "pids");
const TARGET_APP = process.env.EMA_TAURI_DESKTOP_APP_PATH ?? `${process.env.HOME}/Desktop/EMA 0.0.6.app`;

async function sh(command, args) {
  try {
    const { stdout } = await execFileP(command, args, { maxBuffer: 8 * 1024 * 1024 });
    return stdout.trim();
  } catch {
    return "";
  }
}

function readPid(name) {
  const path = join(PID_DIR, `${name}.pid`);
  if (!existsSync(path)) return null;
  const value = readFileSync(path, "utf8").trim();
  return value.length ? Number(value) : null;
}

async function listener(port) {
  const out = await sh("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"]);
  const lines = out.split("\n").filter(Boolean);
  return lines.slice(1).map((line) => {
    const parts = line.trim().split(/\s+/);
    return { command: parts[0] ?? "", pid: Number(parts[1] ?? 0), raw: line };
  });
}

async function main() {
  const [daemon, web, companion] = await Promise.all([
    listener(49555),
    listener(5173),
    listener(27182),
  ]);
  const daemonPid = readPid("daemon");
  const webPid = readPid("web");
  const report = {
    ok: true,
    root: ROOT,
    app: {
      path: TARGET_APP,
      exists: existsSync(TARGET_APP),
    },
    pidfiles: {
      daemon: daemonPid,
      web: webPid,
    },
    listeners: {
      daemon,
      web,
      companion,
    },
    stale_pidfiles: {
      daemon: daemonPid != null && !daemon.some((item) => item.pid === daemonPid),
      web: webPid != null && !web.some((item) => item.pid === webPid),
    },
  };
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
```

- [x] **Step 2: Register the script**

Patch `package.json` scripts:

```json
"runtime:report": "node tooling/runtime-process-report.mjs"
```

- [x] **Step 3: Validate reporting**

Run:

```bash
pnpm runtime:report
```

Expected: JSON includes `listeners.daemon`, `listeners.web`, `pidfiles`, and `stale_pidfiles`.

## Task 3: Make Stop/Reinstall Safe And Repeatable

**Files:**
- Modify: `scripts/stop-ema-dev.sh`
- Create: `tooling/reinstall-ema-0.0.6.mjs`
- Modify: `scripts/install-macos-tauri-app.sh`
- Modify: `package.json`

- [x] **Step 1: Extend stop script with explicit status output**

Patch `scripts/stop-ema-dev.sh` so the final lines always print:

```bash
echo "stop summary:"
lsof -nP -iTCP:"$DAEMON_PORT" -sTCP:LISTEN || true
lsof -nP -iTCP:"$WEB_PORT" -sTCP:LISTEN || true
```

Expected behavior:
- Without `--force-port-kill`, stale pidfiles are removed but unrelated listeners are not killed.
- With `--force-port-kill`, listeners on 49555/5173 are terminated after pidfile shutdown.

- [x] **Step 2: Add the reinstall runner**

Create `tooling/reinstall-ema-0.0.6.mjs`:

```js
#!/usr/bin/env node
import { execFile } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const ROOT = resolve(new URL("..", import.meta.url).pathname);
const TARGET_APP = process.env.EMA_TAURI_DESKTOP_APP_PATH ?? `${process.env.HOME}/Desktop/EMA 0.0.6.app`;
const DRY_RUN = process.argv.includes("--dry-run");
const DELETE_TARGET = process.argv.includes("--delete-target");

async function run(command, args, options = {}) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  if (DRY_RUN) return { stdout: "", stderr: "" };
  return execFileP(command, args, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, ...options });
}

async function main() {
  await run("bash", ["scripts/stop-ema-dev.sh", "--force-port-kill"]);
  await run("pnpm", ["--filter", "@ema/cli", "typecheck"]);
  await run("pnpm", ["build:cli"]);
  await run("pnpm", ["--dir", "apps/web", "build"]);
  await run("pnpm", ["--filter", "@ema/desktop", "tauri", "build"]);

  if (existsSync(TARGET_APP)) {
    if (!DELETE_TARGET) {
      throw new Error(`target exists; rerun with --delete-target after dry-run passes: ${TARGET_APP}`);
    }
    console.log(`rm -rf ${TARGET_APP}`);
    if (!DRY_RUN) rmSync(TARGET_APP, { recursive: true, force: true });
  }

  await run("bash", ["scripts/install-macos-tauri-app.sh"]);
  await run("open", [TARGET_APP]);
  console.log(JSON.stringify({ ok: true, target_app: TARGET_APP, dry_run: DRY_RUN }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
```

- [x] **Step 3: Register release scripts**

Patch `package.json` scripts:

```json
"release:reinstall:dry": "node tooling/reinstall-ema-0.0.6.mjs --dry-run",
"release:reinstall": "node tooling/reinstall-ema-0.0.6.mjs --delete-target"
```

- [x] **Step 4: Validate dry-run first**

Run:

```bash
pnpm release:reinstall:dry
```

Expected:
- Prints stop/build/install commands.
- Does not kill processes.
- Does not delete `/Users/trajanm4air/Desktop/EMA 0.0.6.app`.

## Task 4: Fix 0.0.5/0.0.6 Doctrine Drift

**Files:**
- Modify: `README.md`
- Modify: `docs/WORKSPACE-ENTRYPOINT.md`
- Modify: `/Users/trajanm4air/Desktop/Projects/EMA/project.md`
- Modify: `/Users/trajanm4air/Desktop/Projects/EMA/PROJECT-MAP.md`
- Modify: `/Users/trajanm4air/Desktop/Projects/EMA/builds/0.0.6/BUILD.md`

- [x] **Step 1: Patch active build docs**

Replace stale `0.0.5` current-build text with `0.0.6` in:

```bash
README.md
docs/WORKSPACE-ENTRYPOINT.md
```

Specific replacements:
- `~/Desktop/EMA 0.0.5.app` -> `~/Desktop/EMA 0.0.6.app`
- `# 0.0.5 Workspace Entrypoint` -> `# 0.0.6 Workspace Entrypoint`
- `Use this repo as the implementation root for EMA 0.0.5` -> `Use this repo as the implementation root for EMA 0.0.6`
- stale atlas canon path `ema-0-0-5-current-canon.md` -> current 0.0.6 build record if no canon file exists.

- [x] **Step 2: Patch durable project records**

Update `/Users/trajanm4air/Desktop/Projects/EMA/project.md`:

```yaml
current_build: 0.0.6
```

Update body bullets:

```markdown
- Current active build: `0.0.6`
- Active scratchpad: `../../Active builds/EMA-0.0.6/`
- Saved build record: `./builds/0.0.6/`
```

Update `/Users/trajanm4air/Desktop/Projects/EMA/PROJECT-MAP.md`:

```markdown
- `builds/0.0.6/` - current Gleam/BEAM + Tauri v2 runtime build.
- `Active builds/EMA-0.0.6/` is code in motion.
- `Projects/EMA/builds/0.0.6/` is the durable build record.
```

- [x] **Step 3: Validate no stale current-build claims remain**

Run:

```bash
rg -n "current.*0\\.0\\.5|EMA 0\\.0\\.5\\.app|Active builds/EMA-0\\.0\\.5|implementation root for EMA `0\\.0\\.5`" README.md docs/WORKSPACE-ENTRYPOINT.md /Users/trajanm4air/Desktop/Projects/EMA/project.md /Users/trajanm4air/Desktop/Projects/EMA/PROJECT-MAP.md
```

Expected: no matches.

## Task 5: Make Proslync Native In Cockpit CLI And UI

**Files:**
- Modify: `apps/cli/src/commands/cockpit.ts`
- Modify: `apps/web/app/api/cockpit/projection/route.ts`
- Modify: `apps/web/src/vapps/cockpit/data/types.ts`
- Modify: `apps/web/src/vapps/cockpit/data/projections.ts`
- Modify: `apps/web/src/vapps/cockpit/components/project-bench-view.tsx`

- [x] **Step 1: Align CLI and web surface counts**

Ensure both CLI and web return the same Proslync surfaces:

```text
ad-cockpit
brand-hq
nil-deal-detail
nil-manager
backend-api
master-plan
```

Run:

```bash
node apps/cli/dist/bin.js cockpit projection --project proslync-app-ios-final --json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(j.surfaces.map((x)=>x.id).join("\\n"));})'
curl -sS http://localhost:5173/api/cockpit/projection | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(j.surfaces.map((x)=>x.id).join("\\n"));})'
```

Expected: both commands print the six ids above.

- [x] **Step 2: Add project-health rollup**

Add a `health` object to the cockpit projection:

```ts
readonly health: {
  readonly daemon: "up" | "down";
  readonly web: "up" | "down";
  readonly dirty_builds: number;
  readonly no_git_builds: number;
  readonly stale_records: readonly string[];
  readonly proslync_ready: boolean;
};
```

`proslync_ready` is true only when:
- daemon is up,
- web is up,
- Proslync app/backend/assets git facts load,
- desktop no-git status is explicit rather than hidden,
- intentions projection is available.

- [x] **Step 3: Render health first in the project bench**

In `ProjectBenchView`, put a compact health band above tabs:

```tsx
{workspace ? (
  <section className="cockpit-health-band" aria-label="Project health">
    <span className="cockpit-pill">daemon {workspace.daemon_authority}</span>
    <span className="cockpit-pill">builds {active_builds.length}</span>
    <span className="cockpit-pill">surfaces {surfaces.length}</span>
    <span className="cockpit-pill">intentions {intentions?.recommended_queue.length ?? 0}</span>
  </section>
) : null}
```

- [x] **Step 4: Validate Proslync cockpit**

Run:

```bash
pnpm --dir apps/web exec tsc --noEmit
node apps/cli/dist/bin.js cockpit projection --project proslync-app-ios-final --json
curl -sS http://localhost:5173/api/cockpit/projection
```

Expected:
- typecheck passes,
- CLI and web projection agree on builds and surfaces,
- project bench renders without runtime console errors.

## Task 6: Promote Intention Backfeed From Read-Only To Review Workflow

**Files:**
- Modify: `apps/cli/src/commands/intention.ts`
- Modify: `apps/web/src/vapps/cockpit/components/project-bench-view.tsx`
- Modify: `apps/web/app/api/cockpit/intentions/route.ts`
- Modify: `apps/daemon/lib/ema_intention_farmer/**`

- [x] **Step 1: Persist review state**

Extend the intention store JSON records with:

```ts
type IntentionReviewState = "new" | "accepted" | "rejected" | "deferred";

type IntentionReview = {
  intent_id: string;
  state: IntentionReviewState;
  reviewer: string;
  reason: string;
  reviewed_at: string;
};
```

Store reviews in:

```text
.ema-dev/intention-backfeed/reviews.json
```

- [x] **Step 2: Add CLI verbs**

Add:

```bash
ema intention accept --intent <id> --reason <text> --reviewer actor:trajan --json
ema intention reject --intent <id> --reason <text> --reviewer actor:trajan --json
ema intention defer --intent <id> --reason <text> --reviewer actor:trajan --json
ema intention list --project proslync-app-ios-final --state accepted --json
```

Expected behavior:
- accepted cards may run `backfeed --approve reviewed`;
- rejected cards never appear in `recommended_queue`;
- deferred cards remain inspectable but do not count as queue recommendations.

- [x] **Step 3: Add cockpit review buttons**

In the cockpit Intentions tab, add buttons:

```tsx
<button className="cockpit-button" type="button">Accept</button>
<button className="cockpit-button" type="button">Defer</button>
<button className="cockpit-button" type="button">Reject</button>
```

Buttons call `/api/cockpit/intentions` with `POST`:

```json
{ "intent_id": "intent:...", "state": "accepted", "reason": "reviewed in cockpit" }
```

- [x] **Step 4: Validate review workflow**

Run:

```bash
node apps/cli/dist/bin.js intention accept --project proslync-app-ios-final --intent intent:9d3f284ce2bfac56 --reason "review workflow smoke" --reviewer actor:trajan --json
node apps/cli/dist/bin.js intention list --project proslync-app-ios-final --state accepted --json
node apps/cli/dist/bin.js intention backfeed --intent intent:9d3f284ce2bfac56 --destination queue --dry-run --json
```

Expected:
- accept returns `ok: true`;
- list includes the accepted id;
- backfeed dry-run includes `target_project: "proslync-app-ios-final"`.

## Task 7: Refresh The EMA UI Around Client Work

**Files:**
- Modify: `apps/web/src/components/apps/launchpad/index.tsx`
- Modify: `apps/web/src/components/desktop/DesktopShortcuts.tsx`
- Modify: `apps/web/src/vapps/cockpit/cockpit.css`
- Modify: `apps/web/src/vapps/cockpit/index.tsx`
- Modify: `apps/web/src/vapps/cockpit/components/sidebar.tsx`
- Modify: `apps/web/src/vapps/cockpit/components/project-bench-view.tsx`

- [x] **Step 1: Make cockpit discoverable from launchpad**

Add a launchpad tile titled `Client Cockpit` that opens:

```text
/cockpit#/clients/client:ms-wilson/proslync-app-ios-final
```

Tile copy:

```text
Proslync builds, lanes, queue, intentions, and surfaces.
```

- [x] **Step 2: Add a Proslync quick action in cockpit sidebar**

Sidebar section:

```text
Client Work
- Ms. Wilson / Proslync
- Intentions Backfeed
- Runtime Health
```

Each route must use hash navigation and not reload the shell.

- [x] **Step 3: Replace brittle tab overflow with responsive wrapping**

In `cockpit.css`, ensure `.cockpit-bench__tabs` wraps and remains usable at 1280x800:

```css
[data-app="cockpit"] .cockpit-bench__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

[data-app="cockpit"] .cockpit-bench__tab {
  min-height: 34px;
  white-space: nowrap;
}
```

- [x] **Step 4: Validate UI by screenshot**

Run:

```bash
pnpm --dir apps/web exec playwright test tests/e2e/cockpit-proslync.spec.ts --headed=false
```

Expected:
- test opens the Proslync cockpit route,
- sees `proslync-app-ios-final`,
- sees `Intentions`,
- sees at least one active build,
- screenshot attached to test artifacts.

## Task 8: Build The E2E Sub-Orchestrator Track

**Files:**
- Create: `tooling/ema-functional-e2e.mjs`
- Create: `apps/web/tests/e2e/cockpit-proslync.spec.ts`
- Create: `apps/web/tests/e2e/launchpad-cockpit.spec.ts`
- Modify: `package.json`

- [x] **Step 1: Add functional E2E runner**

Create `tooling/ema-functional-e2e.mjs`:

```js
#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

async function run(command, args, options = {}) {
  const started = Date.now();
  const { stdout, stderr } = await execFileP(command, args, {
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  });
  return { command: [command, ...args].join(" "), ms: Date.now() - started, stdout, stderr };
}

async function main() {
  const checks = [];
  checks.push(await run("pnpm", ["runtime:report"]));
  checks.push(await run("pnpm", ["--filter", "@ema/cli", "typecheck"]));
  checks.push(await run("pnpm", ["build:cli"]));
  checks.push(await run("pnpm", ["--dir", "apps/web", "exec", "tsc", "--noEmit"]));
  checks.push(await run("node", ["apps/cli/dist/bin.js", "cockpit", "projection", "--project", "proslync-app-ios-final", "--json"]));
  checks.push(await run("node", ["apps/cli/dist/bin.js", "cockpit", "intentions", "--project", "proslync-app-ios-final", "--json"]));
  checks.push(await run("pnpm", ["--dir", "apps/web", "exec", "playwright", "test", "tests/e2e/cockpit-proslync.spec.ts"]));
  console.log(JSON.stringify({ ok: true, checks: checks.map((c) => ({ command: c.command, ms: c.ms })) }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
```

- [x] **Step 2: Add Playwright cockpit test**

Create `apps/web/tests/e2e/cockpit-proslync.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("Proslync cockpit shows workspace, builds, and intentions", async ({ page }) => {
  await page.goto("/cockpit#/clients/client:ms-wilson/proslync-app-ios-final");
  await expect(page.getByText("proslync-app-ios-final")).toBeVisible();
  await expect(page.getByRole("button", { name: /Intentions/i })).toBeVisible();
  await page.getByRole("button", { name: /Intentions/i }).click();
  await expect(page.getByText("LOST FOLLOW-UPS")).toBeVisible();
  await expect(page.getByText(/ema intention backfeed/)).toBeVisible();
  await page.getByRole("button", { name: /Builds/i }).click();
  await expect(page.getByText("Proslync iOS app")).toBeVisible();
  await expect(page.getByText("Proslync backend")).toBeVisible();
});
```

- [x] **Step 3: Add package script**

Patch `package.json`:

```json
"e2e:functional": "node tooling/ema-functional-e2e.mjs"
```

- [x] **Step 4: Validate**

Run:

```bash
pnpm e2e:functional
```

Expected: JSON ends with `{ "ok": true }`.

## Task 9: Execute The Controlled Reinstall

**Files:**
- Modify: `docs/orchestration/functional-0.0.6-release-report.md`
- Uses: `tooling/reinstall-ema-0.0.6.mjs`

- [x] **Step 1: Run full preflight**

Run:

```bash
pnpm e2e:functional
pnpm release:reinstall:dry
```

Expected:
- functional e2e passes,
- reinstall dry-run prints every destructive command without executing it.

- [x] **Step 2: Stop active daemon/web and verify empty ports**

Run:

```bash
bash scripts/stop-ema-dev.sh --force-port-kill
pnpm runtime:report
```

Expected:
- `listeners.daemon` is `[]`,
- `listeners.web` is `[]`,
- stale pidfiles are removed or marked false.

- [x] **Step 3: Delete and reinstall current desktop app**

Run only after Steps 1 and 2 pass:

```bash
pnpm release:reinstall
```

Expected:
- removes `/Users/trajanm4air/Desktop/EMA 0.0.6.app`,
- installs fresh app from `apps/desktop/src-tauri/target/release/bundle/macos/EMA.app`,
- opens the fresh app.

- [x] **Step 4: Smoke installed app**

Run:

```bash
pnpm runtime:report
open "/Users/trajanm4air/Desktop/EMA 0.0.6.app"
sleep 5
pnpm runtime:report
```

Expected:
- installed app exists,
- companion listener appears on `27182` or adjacent allowed port if the app is open,
- desktop UI can reach the web shell and daemon after services restart.

## Task 10: Final Save, Commit, And Handoff

**Files:**
- Modify: `docs/orchestration/STATUS.md`
- Modify: `/Users/trajanm4air/Desktop/Projects/EMA/builds/0.0.6/BUILD.md`
- Modify: `docs/orchestration/functional-0.0.6-release-report.md`

- [ ] **Step 1: Update status docs with verified release evidence**

Append to `docs/orchestration/STATUS.md`:

```markdown
## Session update 2026-05-10 - Functional 0.0.6 reinstall readiness

- Runtime reporter identifies daemon/web listeners, pidfiles, installed app, and stale pidfile drift.
- Proslync cockpit is the local client-work surface.
- Intention backfeed is visible in cockpit and CLI.
- Functional e2e command verifies CLI, daemon, web, cockpit, and Proslync projections.
- Installed app replacement is gated by dry-run and preflight success.
```

- [ ] **Step 2: Update build record**

Update `/Users/trajanm4air/Desktop/Projects/EMA/builds/0.0.6/BUILD.md`:

```markdown
## Functional Release Evidence - 2026-05-10

| Check | Result |
|---|---|
| CLI typecheck | pass |
| CLI build | pass |
| Daemon tests | pass |
| Web typecheck | pass |
| Web build | pass |
| Proslync cockpit projection | pass |
| Proslync intention projection | pass |
| Installed app reinstall | pass |
```

- [ ] **Step 3: Commit only after diff review**

Run:

```bash
git diff --stat
git status --short
```

If unrelated pre-existing archive/delete/generated changes remain mixed in, either:
- commit only the head-orchestrator slice with an explicit pathspec, or
- leave uncommitted and write a handoff block naming every touched file.

Preferred commit command after path review:

```bash
git add \
  package.json \
  scripts/stop-ema-dev.sh \
  scripts/install-macos-tauri-app.sh \
  tooling/runtime-process-report.mjs \
  tooling/reinstall-ema-0.0.6.mjs \
  tooling/ema-functional-e2e.mjs \
  apps/web/tests/e2e/cockpit-proslync.spec.ts \
  apps/web/tests/e2e/launchpad-cockpit.spec.ts \
  apps/cli/src/commands/cockpit.ts \
  apps/cli/src/commands/intention.ts \
  apps/web/app/api/cockpit \
  apps/web/src/vapps/cockpit \
  docs/orchestration/head-orchestrator/README.md \
  docs/orchestration/functional-0.0.6-release-report.md \
  docs/orchestration/STATUS.md \
  docs/WORKSPACE-ENTRYPOINT.md \
  README.md
git commit -m "ema: functional 0.0.6 Proslync cockpit release rails"
```

Do not push until the user approves the resulting commit/diff.

## Task 11: Widen Agent-Work Substrate And Repair Native Shell

**Files:**
- Modify: `apps/cli/src/commands/cockpit.ts`
- Modify: `tooling/ema-functional-e2e.mjs`
- Modify: `apps/web/src/components/desktop/AmbientBar.tsx`
- Modify: `apps/web/app/tauri-frame.css`
- Modify: `apps/web/src/components/popout/PopoutTitleBar.tsx`
- Create: `apps/web/tests/e2e/tauri-frame-drag.spec.ts`
- Create: `apps/web/tests/e2e/popout-titlebar.spec.ts`

- [x] **Step 1: Add an agent-work handoff command**

Add `ema cockpit workpack --project proslync-app-ios-final --json` so agents get one daemon/CLI-backed packet with active builds, surfaces, health, lanes, ready queue, hazards, kickoff commands, verification commands, and handoff contract.

Validated:

```bash
node apps/cli/dist/bin.js cockpit workpack --project proslync-app-ios-final --json
```

Result: `ok: true`, `health.proslync_ready: true`, mode `multi-repo-agent-work`, 4 builds, 6 surfaces, 4 explicit hazards.

- [x] **Step 2: Fix installed Tauri drag regions**

Make the native app chrome draggable by marking the ambient bar as a Tauri drag region and making interactive controls no-drag.

Validated:

```bash
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/tauri-frame-drag.spec.ts
```

Result: pass.

- [x] **Step 3: Replace brittle popout window internals**

Move popout minimize/maximize/drag behavior from private `window.__TAURI_INTERNALS__.invoke(...)` calls to the Tauri v2 window API where available, with browser fallbacks.

Validated:

```bash
EMA_E2E_BASE_URL=http://127.0.0.1:5173 pnpm --dir apps/web exec playwright test tests/e2e/popout-titlebar.spec.ts
```

Result: pass.

- [x] **Step 4: Add the wider shell checks to functional E2E**

Extend `pnpm e2e:functional` to include `cockpit workpack`, Tauri frame drag, and popout titlebar regression checks.

Validated:

```bash
pnpm e2e:functional
```

Result: pass, 11 checks.

- [x] **Step 5: Reinstall the app after native shell changes**

Run the gated dry-run and real reinstall so `/Users/trajanm4air/Desktop/EMA 0.0.6.app` contains the drag and popout fixes.

Validated:

```bash
pnpm release:reinstall:dry
pnpm release:reinstall
pnpm runtime:report
```

Result: fresh app installed at `/Users/trajanm4air/Desktop/EMA 0.0.6.app`, previous app moved to `/Users/trajanm4air/Desktop/EMA 0.0.6.app.backup-2026-05-10T02-01-55-784Z`, companion listener on `127.0.0.1:27182`, daemon on `49555`, web on `5173`.

## Done Criteria

- `pnpm runtime:report` reports live daemon/web/app state and stale pidfile state.
- `bash scripts/stop-ema-dev.sh --force-port-kill` can stop current daemon/web listeners.
- `pnpm release:reinstall:dry` passes before destructive app replacement.
- `pnpm release:reinstall` can delete/replace `/Users/trajanm4air/Desktop/EMA 0.0.6.app`.
- Installed EMA 0.0.6 opens and can reach the current web shell/daemon.
- `ema cockpit projection --project proslync-app-ios-final --json` shows Proslync client context, 4 active builds, and 6 surfaces.
- `ema cockpit intentions --project proslync-app-ios-final --json` shows nonzero harvested intentions.
- Cockpit UI exposes Proslync, Builds, Surfaces, Lanes, Queue, Intentions, and runtime health without hidden routes.
- `ema cockpit workpack --project proslync-app-ios-final --json` returns the shared agent-work packet for Proslync.
- Installed Tauri app top chrome is draggable and vApp popout titlebars use the Tauri v2 window API.
- `pnpm e2e:functional` passes.
- Durable records point at 0.0.6, not 0.0.5.
- Release report records exact commands and evidence.
