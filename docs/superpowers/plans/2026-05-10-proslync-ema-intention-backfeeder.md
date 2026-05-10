# Proslync EMA Intention Backfeeder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an EMA-native intake/backfeed loop that mines Chronicle, Codex/Claude sessions, Duct Tape Harness Glue, session-manager references, and Proslync work history for lost intentions, then surfaces them as reviewable project context, queue items, and cockpit signals.

**Architecture:** Treat source artifacts as read-only evidence. The intake pipeline discovers sources, extracts candidate intentions, classifies relevance to Proslync/EMA/agentic-development style, deduplicates, and emits a review projection. Accepted records feed EMA queue/lane objects through existing daemon writers; unaccepted records remain evidence, not canon.

**Tech Stack:** Elixir daemon bounded context, existing Gleam daemon IPC/projection bridge, TypeScript CLI, Next.js cockpit vApp, `rg`/JSONL readers, EMA lane/queue daemon commands, existing `EmaIntentionFarmer` untracked work.

---

## File Structure

- Create: `docs/research/proslync-intention-source-map-2026-05-10.md`
  - Durable source inventory, relevance buckets, and crawl boundaries.
- Create: `docs/research/proslync-agentic-style-map-2026-05-10.md`
  - Extracted user-driven development behaviors EMA should emulate.
- Modify: `docs/superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md`
  - Mark web-alignment and queue-follow-up status as this plan consumes them.
- Modify: `docs/cli/agent-workspace.md`
  - Add both `ema intention ...` and cockpit intention commands to the cold-start doctrine after implementation lands.
- Modify: `apps/daemon/lib/ema_intention_farmer.ex`
- Modify: `apps/daemon/lib/ema_intention_farmer/source_registry.ex`
- Modify: `apps/daemon/lib/ema_intention_farmer/parser.ex`
- Modify: `apps/daemon/lib/ema_intention_farmer/cleaner.ex`
- Modify: `apps/daemon/lib/ema_intention_farmer/projection.ex`
- Modify: `apps/daemon/lib/ema_intention_farmer/server.ex`
- Modify: `apps/daemon/test/ema_intention_farmer_test.exs`
  - Restart the existing untracked intention farmer rather than creating a parallel importer.
- Create: `apps/cli/src/commands/intention.ts`
- Modify: `apps/cli/src/bin.ts`
- Modify: `apps/cli/src/commands/help.ts`
  - Add CLI review surface for harvest, inspect, classify, and backfeed.
- Modify: `apps/cli/src/commands/cockpit.ts`
  - Add `ema cockpit intentions --project proslync-app-ios-final`.
- Create: `apps/web/app/api/cockpit/intentions/route.ts`
- Modify: `apps/web/src/vapps/cockpit/data/types.ts`
- Modify: `apps/web/src/vapps/cockpit/data/projections.ts`
- Modify: `apps/web/src/vapps/cockpit/components/project-bench-view.tsx`
  - Surface the review queue beside Proslync builds, surfaces, lanes, and queue.
- Create: `tooling/intention-source-smoke.mjs`
  - CLI smoke test for source discovery and low-volume harvest.

## Source Boundaries

Read-only evidence roots for the first pass:

```text
/Users/trajanm4air/.codex/sessions/**/*.jsonl
/Users/trajanm4air/.codex/archived_sessions/*.jsonl
/Users/trajanm4air/.codex/history.jsonl
/Users/trajanm4air/.codex/session_index.jsonl
/Users/trajanm4air/.codex/memories/MEMORY.md
/Users/trajanm4air/.codex/memories/rollout_summaries/*.md
/Users/trajanm4air/.claude/projects/**/*.jsonl
/Users/trajanm4air/Desktop/Active builds/chronicle
/Users/trajanm4air/Desktop/Projects/chronicle
/Users/trajanm4air/Desktop/Active builds/duct-tape-onion-harness
/Users/trajanm4air/Desktop/Projects/duct-tape-onion-harness
/Users/trajanm4air/Desktop/Projects/ema-agent-multiplexer-interface
/Users/trajanm4air/Desktop/Projects/EMA/atlas
/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/.ema-dev/harness-glue
/Users/trajanm4air/Desktop/Projects/EMA/.ema-dev/harness-glue
/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final
/Users/trajanm4air/Desktop/Active builds/proslync-backend
/Users/trajanm4air/Desktop/Active builds/proslync-desktop
/Users/trajanm4air/Desktop/Active builds/proslync-presentation-assets-final
```

Source classes to tag:

```text
proslync_product_intent
proslync_build_process_intent
ema_build_process_intent
agentic_style_to_emulate
human_workaround_ema_lacks
harness_glue_pattern
chronicle_pattern
session_manager_pattern
lost_followup
duplicate_or_stale
```

## Task 1: Build The Source Map

**Files:**
- Create: `docs/research/proslync-intention-source-map-2026-05-10.md`
- Create: `docs/research/proslync-agentic-style-map-2026-05-10.md`

- [x] **Step 1: Run source discovery commands**

Run:

```bash
find /Users/trajanm4air/Desktop -maxdepth 5 \( -iname '*chronicle*' -o -iname '*duct*tape*' -o -iname '*harness*glue*' -o -iname '*session*manager*' -o -iname '*intention*' \) 2>/dev/null | sort
rg -n "Chronicle|chronicle|Duct Tape|duct tape|Harness Glue|session manager|session history|intention|backfeed|backfeeder|recoverIntent|dispatchSubagent|cmux|multiplexer" /Users/trajanm4air/Desktop/Active\ builds/EMA-0.0.6 /Users/trajanm4air/Desktop/Projects/EMA /Users/trajanm4air/Desktop/Projects/ema-agent-multiplexer-interface /Users/trajanm4air/.codex/memories/MEMORY.md -S
```

Expected: output includes `apps/cli/src/commands/harness.ts`, `docs/architecture/18-harness-glue.md`, `docs/architecture/24-harness-vapp-launch.md`, `docs/vapps/duct-tape-onion-harness.md`, `apps/daemon/lib/ema_intention_farmer*`, `.codex/sessions`, `.codex/archived_sessions`, and `ema-agent-multiplexer-interface`.

- [x] **Step 2: Write the source map**

Create `docs/research/proslync-intention-source-map-2026-05-10.md` with:

```markdown
# Proslync Intention Source Map - 2026-05-10

## Purpose

Map every read-only evidence source that can reveal lost Proslync intentions, EMA build-process gaps, Harness Glue patterns, Chronicle/session-manager patterns, and Trajan-driven agentic-development habits EMA should emulate.

## Canonical Read Order

1. Current EMA build docs and CLI:
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/18-harness-glue.md`
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/architecture/24-harness-vapp-launch.md`
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/vapps/duct-tape-onion-harness.md`
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/harness.ts`
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/apps/cli/src/commands/cockpit.ts`
   - `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6/docs/superpowers/specs/2026-05-09-intention-backlog-farmer.md`
2. Session evidence:
   - `/Users/trajanm4air/.codex/sessions/**/*.jsonl`
   - `/Users/trajanm4air/.codex/archived_sessions/*.jsonl`
   - `/Users/trajanm4air/.codex/history.jsonl`
   - `/Users/trajanm4air/.codex/session_index.jsonl`
   - `/Users/trajanm4air/.claude/projects/**/*.jsonl`
3. Memory summaries:
   - `/Users/trajanm4air/.codex/memories/MEMORY.md`
   - `/Users/trajanm4air/.codex/memories/rollout_summaries/*.md`
4. Donor/source projects:
   - `/Users/trajanm4air/Desktop/Active builds/chronicle`
   - `/Users/trajanm4air/Desktop/Projects/chronicle`
   - `/Users/trajanm4air/Desktop/Active builds/duct-tape-onion-harness`
   - `/Users/trajanm4air/Desktop/Projects/duct-tape-onion-harness`
   - `/Users/trajanm4air/Desktop/Projects/ema-agent-multiplexer-interface`
5. Proslync active builds:
   - `/Users/trajanm4air/Desktop/Active builds/proslync-app-ios-final`
   - `/Users/trajanm4air/Desktop/Active builds/proslync-backend`
   - `/Users/trajanm4air/Desktop/Active builds/proslync-desktop`
   - `/Users/trajanm4air/Desktop/Active builds/proslync-presentation-assets-final`

## Classification Tags

| Tag | Meaning | Canonical Destination |
|---|---|---|
| `proslync_product_intent` | Product idea or client-facing feature for Proslync | Proslync PLAN.md / queue |
| `proslync_build_process_intent` | Build/test/repo/process improvement for Proslync | Proslync queue/lane |
| `ema_build_process_intent` | EMA capability needed to make this work less manual | EMA queue/lane |
| `agentic_style_to_emulate` | Trajan behavior EMA should learn as a workflow primitive | agentic style map |
| `human_workaround_ema_lacks` | Work Trajan/Codex did manually because EMA lacks the feature | EMA capability queue |
| `harness_glue_pattern` | Dispatch/session/tool-event pattern | Harness Glue docs/queue |
| `chronicle_pattern` | Activity/session/replay/search pattern | Chronicle projection/docs |
| `session_manager_pattern` | cmux/t3code/session-manager control-plane pattern | multiplexer/EMA queue |
| `lost_followup` | A concrete unresolved ask or plan item | EMA queue item |
| `duplicate_or_stale` | Superseded by newer state | evidence only |

## Non-Negotiables

- Source artifacts are read-only.
- No harvested record becomes canon without a review state.
- Proslync records must include the active project id if known: `project:01KR0FKC3Q028AX7DK658J8D99`.
- Human wording is preserved as evidence; the cleaned title can be normalized separately.
```

- [x] **Step 3: Write the agentic style map**

Create `docs/research/proslync-agentic-style-map-2026-05-10.md` with:

```markdown
# Proslync / EMA Agentic Style Map - 2026-05-10

## Purpose

Identify what Trajan is doing manually that EMA should support natively for client work and multi-agent development.

## Style Primitives To Extract

| Primitive | What Trajan/Codex does today | EMA capability to build |
|---|---|---|
| Source hierarchy enforcement | Names canonical docs, stale docs, and live-state checks before implementation | `source_hierarchy` object on cockpit/project |
| Dirty-worktree preservation | Reads status before editing and avoids reset/stash/revert | `worktree_guard` projection and preflight gate |
| Parallel role scopes | Splits Codex/Claude/backend/UI/docs workers by write scope | `swarm_plan` with disjoint ownership table |
| Live-state over plan headers | Verifies git/EMA/build state instead of trusting stale markdown | `truth_snapshot` command and cockpit panel |
| Client-impress sequencing | Chooses the demo arc that will sell the buyer story | `demo_arc` object with persona, proof, and risk |
| Lost-intention recovery | Reconstructs useful work from chat/session history | `intention_backlog` projection |
| Human approval gates | Keeps sensitive actions reviewable instead of auto-mutating | `approval_gate` primitive shared by EMA and Proslync |
| Evidence packets | Requires provenance for product claims and build decisions | `evidence_packet` attached to queue/lane/product decisions |

## First Emulation Target

EMA should automate the current manual loop:

1. Resolve project/client/builds.
2. Read source hierarchy.
3. Scan sessions/history for unresolved intentions.
4. Deduplicate and classify.
5. Show reviewable cockpit cards.
6. Convert approved cards into queue items or lane updates.
7. Keep evidence links attached.
```

## Task 2: Restart And Harden The Intention Farmer

**Files:**
- Modify: `apps/daemon/lib/ema_intention_farmer.ex`
- Modify: `apps/daemon/lib/ema_intention_farmer/source_registry.ex`
- Modify: `apps/daemon/lib/ema_intention_farmer/parser.ex`
- Modify: `apps/daemon/lib/ema_intention_farmer/cleaner.ex`
- Modify: `apps/daemon/lib/ema_intention_farmer/projection.ex`
- Modify: `apps/daemon/lib/ema_intention_farmer/server.ex`
- Modify: `apps/daemon/test/ema_intention_farmer_test.exs`
- Create: `tooling/intention-source-smoke.mjs`

- [x] **Step 1: Capture baseline tests**

Run:

```bash
mix test apps/daemon/test/ema_intention_farmer_test.exs
```

Expected: If the current untracked farmer is not wired into the Mix app, record the exact error in the plan execution notes before editing. Do not delete the untracked farmer files.

- [x] **Step 2: Extend source discovery**

Update `apps/daemon/lib/ema_intention_farmer/source_registry.ex` so discovery returns source records with this shape:

```elixir
%{
  path: "/absolute/path",
  source_type: :codex_session | :codex_history | :codex_memory | :claude_project | :ema_doc | :donor_project | :proslync_repo,
  project_hint: "proslync-app-ios-final" | "EMA" | "duct-tape-onion-harness" | nil,
  source_family: :proslync | :ema | :chronicle | :duct_tape | :session_manager | :general
}
```

Discovery must include the source roots listed in this plan and accept options:

```elixir
[
  roots: ["/absolute/path"],
  project_hint: "proslync-app-ios-final",
  include_large_sessions: false,
  max_sources: 100
]
```

- [x] **Step 3: Extend parser records**

Update `apps/daemon/lib/ema_intention_farmer/parser.ex` so every parsed record has:

```elixir
%{
  id: "intent_source_hash_or_record_id",
  source_path: "/absolute/path",
  source_type: :codex_session,
  source_family: :proslync,
  project_hint: "proslync-app-ios-final",
  occurred_at: "2026-05-09T00:57:35Z" | nil,
  role: "user" | "assistant" | "tool" | "system" | nil,
  text: "raw extracted text",
  evidence_ref: "jsonl:/Users/trajanm4air/.codex/sessions/2026/05/09/example.jsonl#42"
}
```

Parser rules:

```text
Codex JSONL: read message/output text fields when present.
Claude JSONL: read user/assistant text content when present.
Markdown docs: split by headings and bullet blocks; keep heading path.
Ignore binary files, node_modules, .next, dist, build, Pods, DerivedData.
```

- [x] **Step 4: Add relevance classification**

Update `apps/daemon/lib/ema_intention_farmer/cleaner.ex` with deterministic tag rules:

```text
If text contains Proslync, Mrs. Wilson, NIL, AD, Brand HQ, revenue-share, athlete, compliance -> `proslync_product_intent`.
If text contains tsc, typecheck, build, simulator, backend, desktop, active build, branch, dirty -> `proslync_build_process_intent`.
If text contains EMA, cockpit, lane, queue, vApp, daemon, projection, active builds -> `ema_build_process_intent`.
If text contains "I want", "we need", "should", "keep", "don't", "please", "follow up", "lost", "stale" -> candidate `lost_followup`.
If text contains Chronicle, activity, replay, event stream, session -> `chronicle_pattern`.
If text contains Duct Tape, Harness Glue, dispatch, execution, tool.timeline -> `harness_glue_pattern`.
If text contains cmux, multiplexer, session manager, TUI, Codex/Claude sessions -> `session_manager_pattern`.
```

Every candidate gets:

```elixir
%{
  title: "short normalized imperative",
  raw_text: "source excerpt",
  tags: ["proslync_product_intent", "lost_followup"],
  confidence: 0.0..1.0,
  review_state: :new,
  recommended_destination: :proslync_queue | :ema_queue | :doc_only | :duplicate
}
```

- [x] **Step 5: Add projection fields**

Update `apps/daemon/lib/ema_intention_farmer/projection.ex` and `server.ex` so projection returns:

```elixir
%{
  source: "ema_intention_farmer",
  authority: "daemon_elixir_projection",
  stats: %{
    sources_seen: 0,
    records_parsed: 0,
    candidate_intents: 0,
    proslync_relevant: 0,
    ema_relevant: 0,
    lost_followups: 0,
    duplicates_skipped: 0
  },
  intents: [%{}],
  top_tags: [%{tag: "proslync_product_intent", count: 0}],
  recommended_queue: [%{}]
}
```

- [x] **Step 6: Add smoke script**

Create `tooling/intention-source-smoke.mjs`:

```js
#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const cmd = process.argv[2] ?? "projection";
const args = cmd === "projection"
  ? ["apps/cli/dist/bin.js", "intention", "projection", "--project", "proslync-app-ios-final", "--json"]
  : ["apps/cli/dist/bin.js", "intention", "harvest", "--project", "proslync-app-ios-final", "--max-sources", "25", "--json"];

const result = spawnSync("node", args, { cwd: process.cwd(), encoding: "utf8" });
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
```

- [x] **Step 7: Validate**

Run:

```bash
mix test apps/daemon/test/ema_intention_farmer_test.exs
pnpm --filter @ema/cli typecheck
pnpm build:cli
```

Expected:
- Farmer tests pass.
- CLI still typechecks/builds.
- Existing unrelated dirty work remains untouched.

## Task 3: Add CLI Review And Backfeed Commands

**Files:**
- Create: `apps/cli/src/commands/intention.ts`
- Modify: `apps/cli/src/bin.ts`
- Modify: `apps/cli/src/commands/help.ts`
- Modify: `apps/cli/src/commands/cockpit.ts`
- Modify: `docs/cli/agent-workspace.md`

- [x] **Step 1: Implement `ema intention` command group**

Create `apps/cli/src/commands/intention.ts` with subcommands:

```text
ema intention harvest --project proslync-app-ios-final --max-sources 50 --json
ema intention projection --project proslync-app-ios-final --json
ema intention list --project proslync-app-ios-final --tag lost_followup
ema intention show --intent "$INTENT_ID" --json
ema intention backfeed --intent "$INTENT_ID" --destination queue --dry-run --json
```

Minimum behavior:

```text
harvest: calls EmaIntentionFarmer.harvest through an available local bridge or returns a clear `pending_daemon_bridge` payload if the Elixir context is not mounted.
projection/list/show: read current farmer projection.
backfeed --dry-run: prints the exact `ema queue add ...` command that would be run.
backfeed without --dry-run: calls existing queue writer only after an explicit `--approve reviewed` flag is present.
```

- [x] **Step 2: Register the command**

Patch `apps/cli/src/bin.ts`:

```ts
import { runIntention } from "./commands/intention.js";
```

Add dispatch:

```ts
case "intention":
  return runIntention(args);
```

- [x] **Step 3: Add help rows**

Patch `apps/cli/src/commands/help.ts`:

```ts
{ name: "intention harvest/projection/list/show", summary: "Mine sessions/docs for reviewable lost intentions." },
{ name: "intention backfeed", summary: "Convert an approved harvested intention into queue/lane work." },
```

- [x] **Step 4: Add cockpit shortcut**

Patch `apps/cli/src/commands/cockpit.ts` to support:

```text
ema cockpit intentions --project proslync-app-ios-final --json
```

Output should be a focused subset:

```json
{
  "ok": true,
  "command": "cockpit.intentions",
  "project": "proslync-app-ios-final",
  "stats": {
    "candidate_intents": 0,
    "proslync_relevant": 0,
    "lost_followups": 0
  },
  "recommended_queue": []
}
```

- [x] **Step 5: Update doctrine**

Patch `docs/cli/agent-workspace.md` cold-start commands:

```bash
ema intention projection --project proslync-app-ios-final --json
ema cockpit intentions --project proslync-app-ios-final --json
```

- [x] **Step 6: Validate**

Run:

```bash
pnpm --filter @ema/cli typecheck
pnpm build:cli
node apps/cli/dist/bin.js intention projection --project proslync-app-ios-final --json
INTENT_ID=$(node apps/cli/dist/bin.js intention list --project proslync-app-ios-final --tag lost_followup --json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const o=JSON.parse(s); const first=(o.intents||[])[0]; process.stdout.write(first?.id || "intent:dry-run-example");})')
node apps/cli/dist/bin.js intention backfeed --intent "$INTENT_ID" --destination queue --dry-run --json
node apps/cli/dist/bin.js cockpit intentions --project proslync-app-ios-final --json
```

Expected:
- Commands exist.
- Dry-run never mutates daemon state.
- Non-dry-run rejects without `--approve reviewed`.

## Task 4: Surface Intentions In The Cockpit vApp

**Files:**
- Create: `apps/web/app/api/cockpit/intentions/route.ts`
- Modify: `apps/web/src/vapps/cockpit/data/types.ts`
- Modify: `apps/web/src/vapps/cockpit/data/projections.ts`
- Modify: `apps/web/src/vapps/cockpit/components/project-bench-view.tsx`
- Modify: `docs/superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md`

- [x] **Step 1: Align with prior cockpit plan Task 2**

Patch `docs/superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md`:

```markdown
### Follow-up consumed by intention backfeeder plan

- Cockpit CLI projection remains the command-line source for project/build/surface/lane/queue context.
- Cockpit web API should add intention review data through `/api/cockpit/intentions`, not by bloating `/api/cockpit/projection`.
- Queue follow-ups for cockpit writes and home-current switching move to Task 6 of `2026-05-10-proslync-ema-intention-backfeeder.md`.
```

- [x] **Step 2: Add API route**

Create `apps/web/app/api/cockpit/intentions/route.ts` that shells to:

```bash
node apps/cli/dist/bin.js cockpit intentions --project proslync-app-ios-final --json
```

Return JSON. On failure, return:

```json
{
  "ok": false,
  "status": "intention_projection_unavailable",
  "next": "Run `ema intention harvest --project proslync-app-ios-final --max-sources 50 --json`."
}
```

- [x] **Step 3: Add cockpit types**

Add types in `apps/web/src/vapps/cockpit/data/types.ts`:

```ts
export type CockpitIntentionCard = {
  id: string;
  title: string;
  tags: string[];
  confidence: number;
  reviewState: "new" | "accepted" | "rejected" | "deferred";
  recommendedDestination: "proslync_queue" | "ema_queue" | "doc_only" | "duplicate";
  evidenceRef: string;
};

export type CockpitIntentionsProjection = {
  ok: boolean;
  command: "cockpit.intentions";
  project: string | null;
  stats: {
    candidate_intents: number;
    proslync_relevant: number;
    ema_relevant: number;
    lost_followups: number;
  };
  recommended_queue: CockpitIntentionCard[];
};
```

- [x] **Step 4: Render review panel**

Patch `apps/web/src/vapps/cockpit/components/project-bench-view.tsx` with a new panel titled `Intentions Backfeed`. It must show:

```text
candidate count
proslync relevant count
lost followups count
top 5 recommended_queue cards
dry-run CLI command for each card
```

The panel must not auto-create queue items.

- [x] **Step 5: Validate**

Run:

```bash
pnpm --dir apps/web exec tsc --noEmit
pnpm --dir apps/web build
curl -sS http://localhost:5173/api/cockpit/intentions | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const o=JSON.parse(s); console.log(o.ok, o.status ?? o.command);})'
```

Expected:
- Web typecheck passes.
- Build passes or only reports the known pre-existing Turbopack import-tracing warning.
- API route returns either `cockpit.intentions` or the explicit unavailable payload.

## Task 5: Run The Proslync/EMA Relevance Harvest

**Files:**
- Create: `docs/research/proslync-intention-harvest-2026-05-10.md`
- Modify: no source files unless defects are found.

- [x] **Step 1: Run a bounded harvest**

Run:

```bash
node apps/cli/dist/bin.js intention harvest --project proslync-app-ios-final --max-sources 100 --json > /tmp/proslync-intention-harvest.json
node apps/cli/dist/bin.js intention projection --project proslync-app-ios-final --json > /tmp/proslync-intention-projection.json
```

Expected:
- The command exits 0.
- Projection includes nonzero source count.
- If no candidates are found, inspect parser filters before accepting zero.

- [x] **Step 2: Write harvest report**

Create `docs/research/proslync-intention-harvest-2026-05-10.md`:

```markdown
# Proslync Intention Harvest - 2026-05-10

## Summary

| Metric | Count |
|---|---:|
| Sources seen | 0 |
| Records parsed | 0 |
| Candidate intents | 0 |
| Proslync relevant | 0 |
| EMA relevant | 0 |
| Lost followups | 0 |
| Duplicates skipped | 0 |

## Highest Priority Lost Intentions

| Rank | Title | Tags | Destination | Evidence |
|---:|---|---|---|---|

## Proslync Product Intentions

| Title | Why It Matters | Evidence | Recommendation |
|---|---|---|---|

## EMA Capabilities Trajan Is Manually Simulating

| Manual Behavior | EMA Gap | Proposed Primitive | Evidence |
|---|---|---|---|

## Harness/Chronicle/Session-Manager Patterns To Absorb

| Pattern | Source Family | EMA Use |
|---|---|---|

## Rejected Or Stale Records

| Record | Reason |
|---|---|
```

Fill all counts and rows from `/tmp/proslync-intention-projection.json`.

- [x] **Step 3: Convert only approved items**

For each accepted item, run dry-run first:

```bash
INTENT_ID=$(node apps/cli/dist/bin.js intention list --project proslync-app-ios-final --tag lost_followup --json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const o=JSON.parse(s); const first=(o.intents||[]).find((i)=>i.review_state==="accepted"||i.reviewState==="accepted") || (o.intents||[])[0]; process.stdout.write(first?.id || "");})')
test -n "$INTENT_ID"
node apps/cli/dist/bin.js intention backfeed --intent "$INTENT_ID" --destination queue --dry-run --json
```

Then, only for records with clear evidence and no duplicate queue item:

```bash
node apps/cli/dist/bin.js intention backfeed --intent "$INTENT_ID" --destination queue --approve reviewed --json
```

Expected:
- Dry-run prints the exact queue command.
- Approved run returns a queue item id.
- Each queue item includes an evidence ref.

## Task 6: Follow Up On The Previous Cockpit Plan

**Files:**
- Modify: `docs/superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md`
- Mutate daemon state through `ema queue add` only after dry-run review.

- [x] **Step 1: Add cockpit-write follow-up queue item**

Run:

```bash
node apps/cli/dist/bin.js queue add \
  --project EMA \
  --title "Wire cockpit capture/chat to daemon command IPC" \
  --why "The cockpit vApp reads live Proslync state but capture/chat writes are still staged." \
  --done-when "Cockpit capture calls queue.add and agent chat can run vetted command IPC operations." \
  --source "docs/superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md" \
  --json
```

Expected: returns a `queue_item:*` id.

- [x] **Step 2: Add project home-current switcher queue item**

Run:

```bash
node apps/cli/dist/bin.js queue add \
  --project EMA \
  --title "Add project home-current switcher to CLI and GUI" \
  --why "Proslync resolves by workspace scope while topbar home_current remains sift; operators need an explicit switcher." \
  --done-when "CLI and vApp can set and verify home_current project without relying on cwd inference." \
  --source "docs/superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md" \
  --json
```

Expected: returns a `queue_item:*` id.

- [x] **Step 3: Add intention-backfeeder follow-up queue item**

Run:

```bash
node apps/cli/dist/bin.js queue add \
  --project EMA \
  --title "Promote reviewed intention cards into lane/queue workflow" \
  --why "Harvested sessions can reveal lost Proslync and EMA intentions, but conversion must stay reviewable and evidence-linked." \
  --done-when "Cockpit shows intention cards and approved cards can create queue items with evidence refs." \
  --source "docs/superpowers/plans/2026-05-10-proslync-ema-intention-backfeeder.md" \
  --json
```

Expected: returns a `queue_item:*` id.

- [x] **Step 4: Mark previous plan follow-up status**

Patch `docs/superpowers/plans/2026-05-10-ema-proslync-cockpit-cli.md`:

````markdown
### Follow-up queue items opened

- `queue_item:01KR7R396G01D8EADK5H4ZP1XS` - Wire cockpit capture/chat to daemon command IPC.
- `queue_item:01KR7R39BZ01EZQ8E4K8KVXDKH` - Add project home-current switcher to CLI and GUI.
- `queue_item:01KR7R39H001GE9SJ7DBGE0640` - Promote reviewed intention cards into lane/queue workflow.
````

## Task 7: Final Validation And Handoff

**Files:**
- Modify: `docs/research/proslync-intention-harvest-2026-05-10.md`
- Modify: `docs/cli/agent-workspace.md`

- [x] **Step 1: Run validation commands**

Run:

```bash
pnpm --filter @ema/cli typecheck
pnpm build:cli
mix test apps/daemon/test/ema_intention_farmer_test.exs
pnpm --dir apps/web exec tsc --noEmit
node apps/cli/dist/bin.js cockpit projection --project proslync-app-ios-final --json
node apps/cli/dist/bin.js cockpit intentions --project proslync-app-ios-final --json
node apps/cli/dist/bin.js intention projection --project proslync-app-ios-final --json
```

Expected:
- CLI typecheck passes.
- CLI build passes.
- Intention farmer tests pass.
- Web typecheck passes or records pre-existing baseline noise separately.
- Proslync cockpit still reports 4 builds and 4 surfaces.

- [x] **Step 2: Write final handoff block**

Append to `docs/research/proslync-intention-harvest-2026-05-10.md`:

````markdown
## Handoff

### Verified Commands

```bash
ema cockpit projection --project proslync-app-ios-final --json
ema intention projection --project proslync-app-ios-final --json
ema cockpit intentions --project proslync-app-ios-final --json
```

### Open Decisions

| Decision | Owner | Why It Matters |
|---|---|---|
| Which harvested Proslync product intentions should become Sprint 2 queue items? | Trajan | Prevents overfeeding stale chat into current plan |
| Should intention backfeed write directly to EMA queue after review, or require copied approval text? | Trajan | Defines safety posture |
| Should Chronicle/session history become a continuous daemon watcher or an on-demand harvest? | Trajan | Controls background scope and privacy |

### Residual Risks

| Risk | Mitigation |
|---|---|
| Session history includes stale or contradictory requests | Keep review_state and evidence_ref mandatory |
| Proslync plan already changed after older sessions | Compare against `ema cockpit projection` and current PLAN.md before queue creation |
| Farmer overclassifies generic text as intention | Require confidence threshold and manual approval |
````

## Done Criteria

- `docs/research/proslync-intention-source-map-2026-05-10.md` exists and lists actual Chronicle, Duct Tape, Harness Glue, session, cmux/session-manager, EMA, and Proslync evidence roots.
- Existing `EmaIntentionFarmer` is restarted, tested, and extended rather than duplicated.
- `ema intention projection --project proslync-app-ios-final --json` returns reviewable candidate intentions or a precise pending bridge error.
- `ema cockpit intentions --project proslync-app-ios-final --json` exists.
- Cockpit web can render an intentions backfeed panel without mutating queue state.
- At least three follow-up queue items from the previous cockpit plan are opened or explicitly documented as already covered.
- Harvest report separates confirmed current truth, inference, stale/duplicate records, and open decisions.
- No source session/history files are modified.
