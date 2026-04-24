# Surface Slice A — See Agent Work First Screen

Status: draft, awaiting operator approval
Owner: EMA 0.0.5 Product Surface Donor Orchestrator
Lane scope: apps/web only
Donor matrix: [../../../../doctrine/research/EMA-0.0.5-SURFACE-DONOR-MATRIX.md](../../../../doctrine/research/EMA-0.0.5-SURFACE-DONOR-MATRIX.md)

## Problem

`apps/web/src/app/mock-projections.ts` already exports a rich
`seeAgentWorkProjection` with swarms, campaigns, missions, lanes, handoffs,
vcalendar, actors, blocked_work, controls, cli_suggestions, and
agent_instruction. But `apps/web/src/app/agent-work-page.tsx` renders only
a stub of one placeholder lane + `eventTrail`. The product contract in
`docs/vapps/see-agent-work.md` §"First Screen" names eight regions that are
absent from the UI.

Result: the rich mock projection is dead data; the control room does not
yet look operational; HQ's `Lane status` panel renders the same one-line
placeholder ("see docs/orchestration/STATUS.md").

## Outcome

See Agent Work becomes a honest, dense control room showing:

1. **Top swarm pulse** — active swarms, active lanes, blocked items,
   next checkup (pulled from `seeAgentWorkProjection`).
2. **Mission rail** — campaigns → missions, with current focus highlighted.
3. **Lane board** — columns for `idea | ready | active | review | blocked |
   done`, lanes placed by status (donor: agent-os-bridge state vocabulary).
4. **vCalendar strip** — weekly phase, blocks, checkups_due.
5. **Agent roster** — actor cards (human/agent, role, current lane, kind);
   `role` field labeled "display only — not yet enforced" (donor:
   mission-control-claude).
6. **Command panel** — mocked `Start Swarm / Pause Swarm / Stop Swarm /
   Open Mission / Request Handoff / Schedule Checkup` buttons. Each shows
   its CLI equivalent inline and a `mocked | draft | pending daemon writer`
   tag.
7. **Agent instruction panel** — copyable external-agent prompt block
   (from `docs/cli/see-agent-work.md` §"Agent Prompt Template"), pre-filled
   with the active scope and the selected mission/lane.
8. **Chronicle strip** — recent events, capped at `CHRONICLE_MAX = 200`
   (donor: lineage-original-elixir-ema `@max_events 200`; frontend-layer
   bounded-buffer discipline).

HQ's `Lane status` panel re-binds to a derived summary of
`seeAgentWorkProjection.lanes` so the two surfaces agree.

Every piece of mock data keeps its honest label. No button emits real
side effects. No UI-local state is treated as canon.

## Non-goals

- No real IPC command writers (Runtime lane's job).
- No command palette (Slice C, not this slice).
- No new vApps.
- No desktop (`apps/desktop`) changes.
- No new projection names beyond `see_agent_work.project_pulse` (already
  shape-defined in `docs/architecture/09-see-agent-work.md`).
- No styling overhaul — extend existing `ema-*` classes in `styles.css`.

## Files touched

All under the surface-lane ownership boundary:

- [apps/web/src/app/agent-work-page.tsx](../../apps/web/src/app/agent-work-page.tsx)
  — replace the stub body with eight region components.
- [apps/web/src/app/mock-projections.ts](../../apps/web/src/app/mock-projections.ts)
  — add `recent_events: Array<{ ts, actor, kind, summary }>` to
  `seeAgentWorkProjection`; export `CHRONICLE_MAX = 200`; derive
  `agentWorkLaneSummary` for HQ reuse and retire the orphaned
  `agentWork` placeholder (or keep it as an alias pointing at the
  derived summary — decide at edit time).
- [apps/web/src/app/hq-page.tsx](../../apps/web/src/app/hq-page.tsx)
  — `Lane status` panel reads from `agentWorkLaneSummary` instead of
  the old `agentWork` stub; add read-only-observer comment at file top
  (donor: frontend-layer).
- [apps/web/src/app/styles.css](../../apps/web/src/app/styles.css)
  — new classes: `ema-saw-root`, `ema-saw-pulse`, `ema-saw-mission-rail`,
  `ema-saw-lane-board`, `ema-saw-lane-column`, `ema-saw-lane-card`,
  `ema-saw-vcal-strip`, `ema-saw-roster`, `ema-saw-actor-card`,
  `ema-saw-command-panel`, `ema-saw-cmd-btn`, `ema-saw-prompt`,
  `ema-saw-chronicle`. Reuse existing tokens (--ema-ink, --ema-ash,
  --ema-amber, --ema-green, etc.) and existing `ema-panel` /
  `ema-pill` / `ema-kicker` conventions.
- New: [apps/web/src/app/see-agent-work/](../../apps/web/src/app/see-agent-work/)
  — region components split for readability:
  - `top-swarm-pulse.tsx`
  - `mission-rail.tsx`
  - `lane-board.tsx`
  - `vcalendar-strip.tsx`
  - `agent-roster.tsx`
  - `command-panel.tsx`
  - `agent-instruction-panel.tsx`
  - `chronicle-strip.tsx`
  - `index.ts` (barrel)

## Files NOT touched (out of scope for this slice)

- `apps/daemon/**` — Runtime Vertical Slice Orchestrator.
- `packages/surface-core/**` — Runtime lane owns the IPC client; this
  slice consumes `useProjection`/`useCommand` as already exported.
- `packages/contracts/**` — contracts are authoritative; this slice
  reads `docs/architecture/09-see-agent-work.md` for the projection
  shape and does not invent new fields.
- `apps/desktop/**` — Desktop Launcher Correction Orchestrator.
- `scripts/*`, `tooling/*` — out of lane.
- `docs/vapps/see-agent-work.md`, `docs/cli/see-agent-work.md`,
  `docs/agents/see-agent-work-agent-usage.md` — those are already aligned;
  no edits required for Slice A. Vocabulary additions are Slice E.

## Region contracts

Each region component follows the same rules:

- **Read-only.** Reads `seeAgentWorkProjection` via `useProjection` when
  real data is available; falls back to the hard-coded
  `seeAgentWorkProjection` export when it isn't. Never writes.
- **Honest labels.** If the data is mock, render `MOCK_PROJECTION_LABEL`
  as a pill on the region header. If only some fields are mock (e.g.,
  `actors` real but `blocks` mock), label per field.
- **CLI parity.** Every interactive control renders its CLI string
  (from `seeAgentWorkProjection.controls[].command` and
  `cli_suggestions[]`) in monospace beneath or beside the button.
- **No surface writes.** Buttons can display a "copied to clipboard"
  toast for the CLI string or the agent prompt, but do nothing else.

### Region 1 — Top swarm pulse

Grid of four cards, modelled on `hqProjection.pulse`:

- `active swarms`: count from `seeAgentWorkProjection.swarms`.
- `active lanes`: count of lanes where `status === "active"`.
- `blocked items`: length of `seeAgentWorkProjection.blocked_work`.
- `next checkup`: first entry in `vcalendar.checkups_due` (label +
  cadence).

### Region 2 — Mission rail

Horizontal rail grouped by campaign. Each mission card shows:
title, status, campaign signal. Click is a no-op in wave 1; hover
reveals the CLI equivalent (`ema mission show --mission <id>`).

### Region 3 — Lane board

Six columns: `idea | ready | active | review | blocked | done`.
Lanes placed by `lane.status`. Lane card shows title, owner (resolved
via `actors[]`), CLI string, and a "pending daemon writer" footer.
Statuses missing from the mock (`idea`, `ready`, `done`) render empty
column headers honestly ("no lanes in this column").

### Region 4 — vCalendar strip

Single row: weekly phase label, then a compact list of blocks with
actor, label, kind (focus/review/blocked). Below: checkups_due as a
small chip row.

### Region 5 — Agent roster

Actor cards: display_name, kind pill (human/agent), role (with
"display only — not yet enforced" tag), current_lane. No start/stop
affordances on individual actors yet — those come when
`ema_swarm_coordination` writers land.

### Region 6 — Command panel

Six mocked buttons from `seeAgentWorkProjection.controls`. Each:
button label, state pill (`mocked | draft`), CLI string in monospace,
and a "copy CLI" affordance. Clicking the button itself is a no-op
with a flash tooltip `pending daemon writer`.

### Region 7 — Agent instruction panel

A single card: scope summary + mission/lane placeholders + the
Required Context Block from
`docs/agents/see-agent-work-agent-usage.md`. Copy-to-clipboard button
that serializes the template with the current
`seeAgentWorkProjection.agent_instruction` baked in.

### Region 8 — Chronicle strip

Bounded at `CHRONICLE_MAX = 200`. Initial data: the existing
`eventTrail` entries promoted into a new
`seeAgentWorkProjection.recent_events` array with fields
`{ ts, actor, kind, summary }`. Renders newest first. Visually
distinguishes `command` / `event` / `subscription_dropped` frames
(donor: agent-os-v8 framed envelopes).

## Verification

1. `pnpm -w install` (if needed) then
   `cd runtime/EMA-0.0.5--4-24 && pnpm -r typecheck` — must pass.
2. `pnpm dev` (web); navigate to `/agent-work`. All eight regions
   render. Every control has a visible CLI string. Every mocked
   element carries its label. No panel is empty with no explanation.
3. Navigate to `/`. The HQ `Lane status` panel now lists lanes from
   `seeAgentWorkProjection` (not the one-line ledger placeholder).
4. Grep diff: no `localStorage`, no `OPFS`, no `window.fetch` to
   non-IPC endpoints, no `fs.*` imports, no `child_process`, no
   new `*.sqlite` references, no `Tailwind`, no `shadcn`, no
   `zustand` imports.
5. Every new control has a `data-state` attribute matching its label
   (`mocked | draft | pending daemon writer`) so tests can assert
   honest labeling later.
6. `pnpm -r typecheck` still passes.

## Rollout

Single PR. Title: `surface: See Agent Work first screen (Slice A)`.
Commits ordered: (1) region scaffolding + types, (2) HQ rewire,
(3) styles, (4) tests/verification, (5) doc cross-link update.

## Follow-ups (not in Slice A)

- **Slice B** (separate PR): HQ `Lane status` deepening — sparkline
  per lane, hover CLI preview.
- **Slice C** (separate PR, place.org donor): Global command palette.
- **Slice D** (separate PR, agent-os-v8 + lineage-original-elixir-ema
  donors): Chronicle frame-type visual language + bounded buffer
  instrumentation.
- **Slice E** (separate PR): Vocabulary appendices in
  `docs/cli/see-agent-work.md` and `docs/vapps/see-agent-work.md`;
  read-only-observer reinforcement in
  `docs/agents/see-agent-work-agent-usage.md`.

## Handoff trigger

If Slice A encounters a missing projection field that is not mockable
(e.g., `recent_events` needs a daemon event stream), the surface lane
stops and issues:

```text
Handoff Requested:
- From lane: surface/see-agent-work-slice-a
- To actor: Runtime Vertical Slice Orchestrator
- Needed: confirm `see_agent_work.project_pulse` projection includes
  `recent_events` tail or equivalent, and publish the field shape in
  packages/contracts or docs/architecture/09-see-agent-work.md
- Context: Slice A needs a bounded live event stream for the
  chronicle strip; mock data is sufficient for wave 1 if the live
  field won't ship in the same wave.
- Source refs: docs/architecture/09-see-agent-work.md,
  apps/web/src/app/mock-projections.ts
- Stop condition: field shape documented OR Surface lane confirms
  mock-only is acceptable for Slice A.
```

## Language fidelity

Every string rendered in Slice A uses the 0.0.5 language lock: `org`,
`space`, `project`, `lane`, `handoff`, `mission`, `campaign`, `swarm`,
`actor`, `agent`, `canon`, `intent`, `proposal`, `vcalendar`,
`checkup`, `weekly phase`, `focus block`. No `task`-as-synonym-for-lane,
no `workflow`, no `pipeline`, no `board`-as-canonical (it is a view
over lanes).
