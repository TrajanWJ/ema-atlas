---
id: HANDOFF-SESSION-0-2026-04-13
type: handoff
layer: meta
title: "Session 0 handoff — v1.1 planning freeze deliverables"
status: ready-for-review
created: 2026-04-13
author: session-0-agent
intended_reader: "Trajan + next coding/planning agent"
tags: [handoff, session-0, v1.1, index]
---

# Session 0 Handoff — v1.1 Planning Freeze

> This is the entry point. If you just opened this folder and want to
> know what was produced on 2026-04-13 and what to do next, start here.

## What triggered this session

User sentiment: "many apps simply do not work, just say 'error unknown'
throughout. I hate the current state of the GUI. The CLI is barely
functioning. The daemon needs to be outside of Electron. Many more
issues we need to work on. Extensive high-budget pass through every
app, cleaning up view, bringing more into alignment and making
everything function. I want right now deliverables to be made to
/home/trajan/Desktop/EMA-v1.1-Next-Steps."

Also: "Migrate everything from old Elixir and Tauri into new TS and
Electron" — flagged as multi-week scope, not a single session. This
session produced a **plan for that work**, not the work itself.

## What was produced

Six new deliverables, ordered by how you should read them.

### 1. Diagnostic — `11-GAPS/GUI-ROT-DIAGNOSTIC-2026-04-13.md`

Names the actual mechanisms that produce "error unknown" across the
renderer: `api.ts:37` collapses every failure to `"unknown"`; 147
`.catch(() => {})` swallows across stores; real route drift (example:
`ExecutionsApp` calls a missing endpoint); fragile Phoenix-wire glue
that's not broken but must be replaced later; no workspace typecheck;
dead-click silent failures. Ranks defects by blast radius. Proposes a
session-1 fix list that's pure legibility — no architecture changes.

### 2. Diagnostic — `13-CLI-GUI-PARITY/CLI-ROT-DIAGNOSTIC-2026-04-13.md`

Explains what's actually wrong with the CLI. **There are two `ema`
binaries on disk**: a Python shim in `bin/ema` (archived-era leftover)
and a real TS CLI in `cli/`. Coverage ratio is skeletal (~8 command
families vs 34 wired renderer routes). CLI hardcodes `localhost:4488`
and fails silently when Electron isn't running (because the daemon is a
child of Electron today). Ordered fix list with bandage / A-dependent
work called out.

### 3. Ledger — `13-CLI-GUI-PARITY/RENDERER-APP-TRIAGE-LEDGER-2026-04-13.md`

Per-route disposition for all 34 routes in
`apps/renderer/src/App.tsx`. Uses six dispositions: KEEP-AND-WIRE,
KEEP-BUT-QUARANTINE, REBUILD-ON-A, MERGE-INTO-X, UNWIRE-SYSTEM-CONCEPT,
DEFER. Grounds decisions in the canon reconciliation table at
`04-CANON/VAPP-RECONCILIATION-TABLE.md`. Also calls out that the 95
components in `apps/renderer/src/components/` are mostly unrouted
scaffolding — they should be attic'd, not triaged per-component.

### 4. Spec draft — `01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT.md`

The blocking deliverable per
`01-PLANS/META-BOOTSTRAP-POINTER.md`. Turns the locked decisions in
`10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md` into a
phase plan (A1–A6), acceptance criteria, data migration plan, risk
register, and a §8 list of **ten open questions** that must be
resolved in a brainstorm pass before the spec can be considered frozen.
Cannot skip §8. Implementation should not start until the spec is
frozen.

### 5. Roadmap — `01-PLANS/v1.1-EXECUTION-ROADMAP-2026-04-13.md`

Session-sized build order that weaves the hygiene work (sessions 1–2)
and the architecture work (sessions 4–9, sub-project A phases) into a
single plan, with a dependency graph and a "done" definition for v1.1.
Explicit out-of-scope list to resist scope creep.

### 6. This handoff — `00-INBOX/2026-04-13-SESSION-0-HANDOFF.md`

What you're reading.

## What to read first (cold start)

If you just dropped in and have 20 minutes:

1. `10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md` —
   the locked architectural direction (already existed before this session).
2. This handoff.
3. `01-PLANS/v1.1-EXECUTION-ROADMAP-2026-04-13.md` — where we are in the
   build order.
4. The three diagnostics in any order.

If you have 1 hour:

5. `01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT.md` §8
   open questions and §2 non-goals.
6. `04-CANON/VAPP-RECONCILIATION-TABLE.md` (already existed) to understand
   the canon↔renderer drift.

## What to do next (user actions required)

### Gate 1: Review all six deliverables

Read through the new files. Mark anything you disagree with in the margins
or flag it inline. The triage ledger is the most opinionated; flag any
route where you'd pick a different disposition.

### Gate 2: Resolve sub-project A open questions

The spec draft's §8 has 10 open questions. Each has a default answer.
The fastest path is: confirm defaults, or flag the ones you want to
discuss. Examples:

- Contracts at `shared/contracts/` or new `packages/contracts/`?
- JSON or MsgPack event serialization?
- Single daemon per user or per workspace?
- Should `cli/` absorb daemon lifecycle commands, or ship a separate
  `ema-daemon` binary?
- Does `services/core/*` (non-loop) survive untouched through A?

Answering these freezes the spec. Without that, implementation can't
start without risking rework.

### Gate 3: Pick the session 1 start point

Session 1 and session 2 (GUI hygiene and CLI hygiene) are independent
and can run in parallel. You can start either one immediately without
blocking on the spec freeze — they don't touch architecture. Session 3
(spec freeze) is conversation-heavy, not code-heavy.

Recommended order if doing sequentially:

1. Session 1 (GUI hygiene) — biggest user-felt win first.
2. Session 3 (spec freeze) — while you're still in the headspace.
3. Session 2 (CLI hygiene) — bandage the CLI while the spec bakes.
4. Session 4 (A1 contracts + Effect) — architecture work begins.

Recommended order if parallelizing with a second agent:

- Agent A: session 1 GUI hygiene.
- Agent B: session 2 CLI hygiene.
- You + session 0 agent: session 3 spec freeze.
- Merge at session 4.

## What this session deliberately did NOT do

- No code changes to `~/Projects/ema/`.
- No attempt at the "extensive pass through every app" — correctly
  reframed as multi-session work because "every app" is 34 routes and
  half of them need backends that do not exist.
- No brainstorm completion for sub-project A — the draft spec surfaces
  the decisions required, it does not pretend to have made them.
- No touching of sub-project C (vApp contract + chat port) — it waits
  on A's spec freeze.
- No renderer cleanup of the 95-component scaffold mess — attic'ing is
  on the session 1 list.

## Known dangers for the next agent

1. **Don't start coding sub-project A before §8 is resolved.**
   The decisions locked on 2026-04-13 were about direction; A's
   implementation plan is not yet frozen. Coding now will produce
   rework.
2. **Don't treat hygiene as a substitute for architecture.**
   Fixing `api.ts` legitimately helps, but it does not fix the daemon
   lifecycle, the coexistence with old loop tables, or the Effect RPC
   cutover. Hygiene is scaffolding for the real work, not a replacement.
3. **Don't try to wire all KEEP-AND-WIRE apps in one session.**
   They are listed priority-ordered in the roadmap. One per session is
   realistic.
4. **Don't bring `IGNORE_OLD_TAURI_BUILD/` back to life.**
   Mine it for patterns and tests; do not run it, do not treat its
   runtime commands as current. Parallel confirmation in the
   decisions doc.
5. **Don't expand the triage ledger into the 95 components.**
   The 34 routed ones are the surface that exists. Everything else is
   attic.

## Pointers to pre-existing context (not produced this session)

- `10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md`
- `10-DECISIONS/DISCORD-HISTORY-DIGEST-2026-04-13.md`
- `10-DECISIONS/RELATED-CODEBASES-TO-MINE.md`
- `04-CANON/VAPP-RECONCILIATION-TABLE.md`
- `04-CANON/CATALOG.md`
- `04-CANON/GROUND-TRUTH.md`
- `04-CANON/OPERATING-REALITY.md`
- `04-CANON/MEMORY-SYNC.md`
- `12-RUNTIME/TS-RUNTIME-REALITY-SUMMARY.md`
- `11-GAPS/CONVERGENCE-DEBT-SUMMARY.md`
- `11-GAPS/RENDERER-RECONCILIATION-QUESTIONS.md`
- `13-CLI-GUI-PARITY/CLI-GUI-MIRRORED-WORKSPACE-VISION.md`
- `13-CLI-GUI-PARITY/CLI-GUI-PARITY-CONTRACT-DRAFT.md`
- `08-IMPORTS/legacy-and-related-code/T3CODE-FORK-BORROW-ANALYSIS.md`
- `01-PLANS/META-BOOTSTRAP-POINTER.md`
- `01-PLANS/CURRENT-PRIORITIES.md`
- `09-HANDOFFS/NEXT-CODING-AGENT-HANDOFF.md` — prior handoff, mostly
  superseded by this one.

## Pointers into the actual repo

- `~/Projects/ema/apps/renderer/src/App.tsx` — the 34-route switch.
- `~/Projects/ema/apps/renderer/src/lib/api.ts:37` — the `"unknown"` sink.
- `~/Projects/ema/apps/renderer/src/lib/ws.ts` — Phoenix client glue.
- `~/Projects/ema/services/realtime/server.ts` — homegrown Phoenix wire.
- `~/Projects/ema/services/startup.ts` — current 7-phase boot.
- `~/Projects/ema/services/http/middleware/auth.ts` — optional token.
- `~/Projects/ema/apps/electron/runtime.ts` — spawns daemon as child.
- `~/Projects/ema/cli/src/commands/` — current CLI surface.
- `~/Projects/ema/bin/ema` — Python ghost.
- `~/Projects/t3code-fork/apps/server/` — borrow source.

## Summary in one paragraph

The user hates the current state. The diagnostics name why. The triage
ledger names what to do per app. The spec draft names the architecture
move that unblocks the daemon-independence goal. The roadmap names the
order of operations. Nothing here is implemented yet, but the decisions
to be made are narrow enough that one review pass and one brainstorm
pass should clear the runway for implementation to start.

**Next concrete action:** user review of all six deliverables, then §8
brainstorm on the A spec. After that, session 1 or session 4 can begin.
