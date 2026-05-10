# Proslync / EMA Agentic Style Map - 2026-05-10

## Purpose

Identify what Trajan is doing manually that EMA should support natively for
client work and multi-agent development.

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

## Observed Proslync-Specific Manual Loop

1. Resolve the real active builds rather than trusting folder names or stale headers.
2. Verify git branch, HEAD, dirty count, typecheck baseline, and EMA lane state.
3. Reconcile Mrs. Wilson/client-positioning memory with current PLAN.md and asset docs.
4. Split work into Codex/Claude/backend/UI/docs scopes with explicit non-overlap.
5. Keep the buyer story visible: AD cockpit, Brand HQ, NIL Deal Detail, trust/compliance.
6. Convert unresolved decisions into EMA queue items instead of leaving them in chat.
7. Keep evidence refs attached to every product or build-process claim.

## First Emulation Target

EMA should automate the current manual loop:

1. Resolve project/client/builds.
2. Read source hierarchy.
3. Scan sessions/history for unresolved intentions.
4. Deduplicate and classify.
5. Show reviewable cockpit cards.
6. Convert approved cards into queue items or lane updates.
7. Keep evidence links attached.

## Required Product Primitives

| Primitive | Description | First Surface |
|---|---|---|
| `truth_snapshot` | Current git, build, daemon, lane, queue, and validation facts for a project | `ema cockpit projection` |
| `source_hierarchy` | Canonical docs and stale-doc warnings attached to a project | Cockpit project bench |
| `intention_backlog` | Reviewable candidates mined from sessions/docs/history | Cockpit intentions panel |
| `evidence_packet` | Source refs and freshness for every extracted claim | Intention detail card |
| `backfeed_gate` | Approval-required conversion from candidate intention to queue/lane | `ema intention backfeed` |
| `worktree_guard` | Dirty-file and touched-scope warning before broad edits | CLI preflight / cockpit |
| `swarm_plan` | Disjoint worker ownership matrix tied to lane/queue state | Cockpit / Harness Glue |

## Anti-Patterns To Avoid

- Do not auto-promote old chat into canon.
- Do not treat session history as more current than live git/EMA state.
- Do not create a new EMA space for a project-level need.
- Do not make Harness Glue or Chronicle the source of truth for queue/lane state.
- Do not surface generic AI chat as a substitute for project control.
