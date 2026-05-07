# Master Orchestration Plan — 2026-05-07

**Origin:** Operator (Trajan) on 2026-05-07: *"ema cli and source of truth is not connected up to the EMA frontend setup, vDesktop / launchpad / tauri app"* → escalating into a head-orchestrator session covering 14 lanes across 4 waves, with explicit conceptual development of Blueprint, atlas, and the agent harness glue.

**Verbatim transcript (mandatory read):** [`Projects/EMA/atlas/intent/transcripts/2026-05-07-EMA-frontend-daemon-disconnect-orchestration.md`](../../../Projects/EMA/atlas/intent/transcripts/2026-05-07-EMA-frontend-daemon-disconnect-orchestration.md). Decisions, aspirations, lost-thread catalog, and operator instructions are captured there. This file is the executable view; that file is the durable narrative.

**Posture:** Claude (Opus 4.7) acts as head orchestrator. Subagents are dispatched per lane with non-overlapping scope. Generous token budget approved. Each lane has a daemon record (`ema lane show --lane <id>`) and a scope statement; agents must claim before editing.

---

## Lane registry

| Lane | Daemon ID | Title | Wave | Owner |
|------|-----------|-------|------|-------|
| L0 | `lane:01KR0RPQVC03G042QR5VN0FX6Y` | Reconcile in-flight 44-file diff | 0 (BLOCKING) | head orchestrator |
| L1 | `lane:01KR0RQ2D403HST4RKEZCNSRCM` | Workspace backend repair (E) | 1 | subagent A1 |
| L2 | `lane:01KR0RQ6JK03KAQ6XAAS7ZTWR4` | ema_dispatch + ema_exec writers (A) | 1 | subagent A2 |
| L3 | `lane:01KR0RQB3D03MY7XK0YKAG67GM` | Place-companion native + broker (G+H) | 1 | subagent A3 |
| L4 | `lane:01KR0RQFV003P5XC3P1TE2XKPR` | Design system + UX manifesto (I+O) | 1 | subagent A4 |
| L5 | `lane:01KR0RQXHZ03QH1QEH035WQPTK` | Phase 1 launchpad-live + ScopeStrip switcher (F) | 1 | head orchestrator |
| L6 | `lane:01KR0RR2T103S5HYKKN3NT49D9` | Slice B daemon writers (P) | 2 | subagent A6 |
| L7 | `lane:01KR0RR79303TRZVJX7S8PW3A6` | Workspace hygiene (J+M+K) | 2 | subagent A7 |
| L8 | `lane:01KR0RRAA903W48GWGXWTXB058` | Phase 2 — kill mock-projections.ts | 2 | head orchestrator |
| L9 | `lane:01KR0RRHKD03XTPCJD2A905RY4` | Phase 3 — UI command writers | 3 | subagent A9 |
| L10 | `lane:01KR0RRPNS03ZCW1WQFBMNHRMH` | Phase 4 — hq.pulse + see_agent_work daemon writers | 3 | subagent A10 |
| L11 | `lane:01KR0RS0NP040WFCM37H9J3WWA` | Blueprint v0 (C) | 4 | subagent A11 |
| L12 | `lane:01KR0RS4VA0427C6C8KF1E6AKA` | Combined harness vApp + self-orchestration (N) | 1+ | subagent A5 (separate project) |
| L13 | `lane:01KR0RS9RK043X5HGVK6EB7RSP` | Intent farming pipeline | continuous | head orchestrator |

---

## Wave dispatch schedule

### Wave 0 — L0 only (head orchestrator, blocking)
Reconcile the 44-file in-flight diff. Land EntryChooser + boot rework + Sidebar/launchpad/app-registrations changes as coherent commits. **Gate before Wave 1:** clean working tree (or one well-named WIP branch); `pnpm --filter @ema/web exec tsc --noEmit` green; `node tooling/m1-round-trip.mjs` green.

### Wave 1 — 5 parallel subagents + L5 by head orchestrator
- **A1 → L1** workspace backend repair
- **A2 → L2** ema_dispatch + ema_exec
- **A3 → L3** place-companion native + broker
- **A4 → L4** design system + UX manifesto
- **A5 → L12** combined harness vApp (separate project)
- **head → L5** launchpad-live + ScopeStrip switcher

Subagent scopes are non-overlapping (see Lane registry scope statements). Head orchestrator integrates results, runs gates (`gleam test`, `pnpm check:contracts`, `pnpm exec tsc --noEmit`, `node tooling/m1-round-trip.mjs`, dispatch round-trip if A2 lands). **Gate before Wave 2:** all gates green; lanes L1–L5 + L12 closed or moved to review.

### Wave 2 — 2 parallel subagents + L8 by head orchestrator
- **A6 → L6** Slice B daemon writers (depends on L1 closing)
- **A7 → L7** workspace hygiene (coordinates with A6 on agent_workspace.gleam — additive only)
- **head → L8** kill mock-projections.ts (depends on L5 closing)

### Wave 3 — 2 parallel subagents
- **A9 → L9** UI command writers (depends on L6 closing)
- **A10 → L10** hq.pulse + see_agent_work daemon projections

### Wave 4 — Blueprint v0
- **A11 → L11** Blueprint v0 (depends on L8 + L6 + L10 closing)

---

## Conceptual development (operator directive)

Per the 2026-05-07 conversation, three sides need parallel conceptual development beyond shipping code:

### Blueprint
Blueprint v0 (L11) is not just a 6-tab vApp. It is the home for:
- 4-doc / 20-section "Question Based Construction" tree (Master Design Doc, Project Overview, Technical & Backend, Styling/Frontend/UX/Mentality)
- GAC cards, blocker cards, aspiration entries (per `BLUEPRINT-PLANNER.md` 332-line spec in `Projects/EMA/atlas/archive/builds/all-ts-electron-ema/ema-genesis/`)
- Decisions log derived from canon-tier nodes
- **Intent mining from `atlas/intent/transcripts/`** — when transcripts exist, Blueprint should mine them into Doc Tree nodes + GAC cards + Decisions

The CLI extension `ema blueprint *` is the LLM-promptable surface (no MCP, per locked decision in `lovely-blum.md`). Skills + Wiki catalog co-design lands in v0.1.

### Atlas
`Projects/EMA/atlas/` is the durable second brain. New subdir `intent/transcripts/` is a first-class intent source equal to `intent/decisions/` and `intent/handoffs/`. Conversations like the 2026-05-07 orchestration session are logged there continuously (intent farming pipeline, L13).

The atlas's existing structure:
- `intent/{decisions,handoffs,objectives,transcripts}/` — control plane records
- `canon/{current,next,past-builds}/` — canonical state
- `knowledge/NODE-STANDARD.md` — frontmatter shape
- `SYSTEM_MANIFEST.json` + `graph.json` — 36 nodes, 91 triples, 11 topics

Lane L13 surfaces transcripts continuously as the conversation evolves; cross-links from `STATUS.md`, lane records, and (when L11 lands) Blueprint nodes.

### Agent harness glue (the executor)
L12's combined harness vApp is **EMA's executor**. Per `EMA-GENESIS-PROMPT.md §8` — "the Blueprint Planner is the meta-app — the tool that designs all other tools, including itself."

The harness must one day be capable of running this very orchestration process autonomously:
1. Read across plans (`~/.claude/plans/`, `docs/plans/`, queue items, lane briefs, atlas, blueprint, STATUS.md)
2. Recover lost intent from prior sessions
3. Synthesize into actionable plans + open daemon lanes
4. Dispatch Codex/Claude/PTY subagents in waves with non-overlapping scope
5. Integrate results, run gates, hand off to next wave
6. Write captured intent back into Blueprint nodes + atlas graph

L12 builds toward this. `deep-swimming-widget.md`'s 6-wave duct-tape upgrade is necessary but not sufficient — the harness needs an "orchestrator-mode" capability the duct-tape spec doesn't yet describe. A11's Blueprint v0 surfaces the intent storage; A5's harness becomes the executor that mines it.

---

## Standing rules for subagents

Each subagent gets a brief that includes:
1. The lane ID and `done_when` from the daemon record
2. The exact scope (files to write, files NOT to write)
3. Read-first list (the relevant atlas / docs / plans)
4. Verification commands
5. Reporting template (close commit + lane release commands)

Common rules:
- **Claim before editing** — `ema lane claim --lane <id> --actor <agent> --json`
- **No edits outside scope** — if work creeps, log a queue item and stop
- **Run gates before close** — `gleam test`, `tsc --noEmit`, `pnpm check:contracts`, `m1-round-trip.mjs`
- **Commit cleanly** — squash-clean per slice; commit message references lane id
- **Close with reporting template** — produce a close packet (files changed, gates green, risks, follow-ups) and run `ema lane close --lane <id> --result "..."`
- **Surface conflicts immediately** — if scope overlaps another lane (especially `agent_workspace.gleam`, `ema_shell_ipc.gleam`, `mock-projections.ts`), report back to head orchestrator before editing
- **Append to transcript** — significant findings or pivots get appended to `Projects/EMA/atlas/intent/transcripts/2026-05-07-EMA-frontend-daemon-disconnect-orchestration.md`

---

## Verification baseline (to keep gates honest)

```bash
cd "Active builds/EMA-0.0.5"
bash scripts/contract-check.sh
cd apps/daemon && gleam build && gleam test && cd ../..
pnpm --filter @ema/cli build
pnpm --filter @ema/cli typecheck
pnpm --filter @ema/web exec tsc --noEmit
node tooling/m1-round-trip.mjs
node tooling/agent-workspace-round-trip.mjs    # requires Slice A landed
# When L2 lands:
node tooling/m2-dispatch-round-trip.mjs
# Real CLI smoke:
ema status --json
ema agent orient --json
ema next --json
ema lane list --json
ema queue list --json
ema vcalendar tick --json
```

---

## Out of scope for this plan

- `ema-agent-multiplexer-interface` (`cozy-forging-jellyfish.md`) — separate project under `Active builds/ema-agent-multiplexer-interface/`. Different stack (BEAM + Tauri + Phoenix Channels) than EMA-0.0.5 (Gleam + Tauri + Next.js). Not in this session's scope.
- `letmescale` red hue swap (`make-it-way-brighter-polished-gem.md`) — unrelated landing page work.
- Any Discord/Slack delivery layer.
- HTTP gateway / WebAuthn / Google OIDC.
- P2P / mesh transport (Q9 deferred per atlas).

---

## Living document

This plan and the transcript are paired. The transcript captures the conversation that produced the plan; the plan captures the executable view. Both should evolve together as the work proceeds.

When a lane closes, append a result block to this doc and to STATUS.md. When new lost threads surface, log them as queue items linked to the appropriate lane and append to the transcript's "Lost threads catalogued" table.
