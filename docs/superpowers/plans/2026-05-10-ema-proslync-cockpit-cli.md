# EMA Proslync Cockpit CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ema cockpit` a real CLI counterpart to the cockpit vApp so Proslync client work can be inspected from CLI and GUI with the same project/workspace model.

**Architecture:** Add a focused CLI command group that resolves the current workspace, reads daemon lane/queue projections, inspects active builds, and prints project cockpit summaries. Keep write operations out of this slice; existing lane/queue writers remain the canonical mutation path.

**Tech Stack:** TypeScript CLI, EMA daemon WebSocket projections, Node `fs`/`child_process`, existing `workspace-scope` resolver.

---

### Task 1: Add `ema cockpit` Read Model

**Files:**
- Create: `apps/cli/src/commands/cockpit.ts`
- Modify: `apps/cli/src/bin.ts`
- Modify: `apps/cli/src/commands/help.ts`

- [x] **Step 1: Implement command**

Create `apps/cli/src/commands/cockpit.ts` with subcommands:
- `summary`: print project, active build, lane count, queue count, and next command.
- `projection`: emit the complete cockpit projection JSON.
- `builds`: print active build git status.
- `surfaces`: print product/vApp surfaces attached to the project.
- `lanes`: print project-scoped daemon lanes.
- `queue`: print project-scoped daemon queue items.
- `open`: print the local cockpit URL for the resolved project.

- [x] **Step 2: Register command**

Import `runCockpit` in `apps/cli/src/bin.ts` and route `case "cockpit":`.

- [x] **Step 3: Add help row**

Add `cockpit summary/projection` and
`cockpit builds/surfaces/lanes/queue/open` to `COMMANDS` in
`apps/cli/src/commands/help.ts`.

- [x] **Step 4: Validate**

Run:

```bash
pnpm --filter @ema/cli typecheck
pnpm build:cli
node apps/cli/dist/bin.js cockpit projection --project proslync-app-ios-final --json
node apps/cli/dist/bin.js cockpit summary --project proslync-app-ios-final
node apps/cli/dist/bin.js cockpit lanes --project proslync-app-ios-final
node apps/cli/dist/bin.js cockpit queue --project proslync-app-ios-final
```

Expected:
- Typecheck and CLI build pass.
- Projection JSON includes `project.name = "proslync-app-ios-final"`, nonzero `lanes`, nonzero `queue`, and active builds for app/backend/desktop/assets.

### Task 2: Align Cockpit vApp With CLI Projection

**Files:**
- Modify: `apps/web/app/api/cockpit/projection/route.ts`
- Modify: `apps/web/src/vapps/cockpit/data/projections.ts`

- [ ] **Step 1: Remove duplicated shape drift**

Keep web response field names aligned with the CLI projection: `client`, `project`, `workspace`, `lanes`, `queue`, `active_builds`, `surfaces`.

- [ ] **Step 2: Validate**

Run:

```bash
curl -sS http://localhost:5173/api/cockpit/projection
pnpm --dir apps/web exec tsc --noEmit
pnpm --dir apps/web build
```

Expected:
- API and CLI agree on top-level keys.
- Web typecheck/build pass.

### Follow-up consumed by intention backfeeder plan

- Cockpit CLI projection remains the command-line source for project/build/surface/lane/queue context.
- Cockpit web API should add intention review data through `/api/cockpit/intentions`, not by bloating `/api/cockpit/projection`.
- Queue follow-ups for cockpit writes and home-current switching move to Task 6 of `2026-05-10-proslync-ema-intention-backfeeder.md`.

### Follow-up queue items opened

- `queue_item:01KR7R396G01D8EADK5H4ZP1XS` - Wire cockpit capture/chat to daemon command IPC.
- `queue_item:01KR7R39BZ01EZQ8E4K8KVXDKH` - Add project home-current switcher to CLI and GUI.
- `queue_item:01KR7R39H001GE9SJ7DBGE0640` - Promote reviewed intention cards into lane/queue workflow.

### Task 3: File Follow-Up Queue Items For Remaining EMA Doctrine Gaps

**Files:**
- No code files; use daemon CLI.

- [ ] **Step 1: Add queue item for cockpit writes**

Run:

```bash
ema queue add --project EMA-0.0.6 --title "Wire cockpit capture/chat to daemon command IPC" --why "The cockpit vApp reads live Proslync state but capture/chat writes are still staged." --done-when "Cockpit capture calls queue.add and agent chat can run vetted command IPC operations." --source "docs/superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md" --json
```

- [ ] **Step 2: Add queue item for project home-current switching**

Run:

```bash
ema queue add --project EMA-0.0.6 --title "Add project home-current switcher to CLI and GUI" --why "Proslync resolves by workspace scope while topbar home_current remains sift; operators need an explicit switcher." --done-when "CLI and vApp can set and verify home_current project without relying on cwd inference." --source "docs/superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md" --json
```
