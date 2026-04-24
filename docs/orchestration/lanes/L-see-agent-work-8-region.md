# Lane L-see-agent-work-8-region — See Agent Work 8-Region First Screen

Owning orchestrator: **Product Surface Donor**
Status: queued (next product move)
Opened: 2026-04-24
Ledger entry: see `docs/orchestration/STATUS.md` lanes table

## Goal

Make `apps/web/src/app/agent-work-page.tsx` inhabited. Replace the current stub with the 8-region operator first screen defined in `doctrine/research/EMA-0.0.5-SURFACE-DONOR-MATRIX.md` and `docs/vapps/see-agent-work.md`. The vdesktop shell and IPC client already exist — what's missing is this surface rendered to the vision bar.

## Read First

1. `docs/orchestration/STATUS.md`
2. `doctrine/planning/orchestrator-prompts/PRODUCT-SURFACE-DONOR-ORCHESTRATOR-PROMPT.md`
3. `doctrine/research/EMA-0.0.5-SURFACE-DONOR-MATRIX.md` — per-region donor mapping
4. `runtime/EMA-0.0.5--4-24/docs/vapps/see-agent-work.md` — product spec
5. `runtime/EMA-0.0.5--4-24/docs/architecture/09-see-agent-work.md`
6. `sources/snapshots/ema 0.0.3/ema-atlas/graph/nodes/codebase-mission-control-claude.qmd` — operator density (32-panel aspirational)
7. `sources/snapshots/ema 0.0.3/ema-atlas/graph/nodes/codebase-agent-os-bridge.qmd` — lane board columns (idea/ready/active/review/blocked/done)
8. `sources/snapshots/ema 0.0.3/ema-atlas/graph/nodes/codebase-agent-os-v8.qmd` — typed envelope rendering
9. `sources/snapshots/ema 0.0.3/ema-atlas/graph/nodes/codebase-place-org.qmd` — boot-before-surface gate
10. `sources/snapshots/ema 0.0.3/ema-atlas/graph/nodes/codebase-frontend-layer.qmd` — read-only observer + bounded buffers
11. `sources/snapshots/ema 0.0.3/ema-atlas/graph/nodes/lineage-original-elixir-ema.qmd` — CHRONICLE_MAX = 200

## Scope (files you may edit)

- `runtime/EMA-0.0.5--4-24/apps/web/src/app/agent-work-page.tsx` — replace stub
- `runtime/EMA-0.0.5--4-24/apps/web/src/vapps/see-agent-work/` — may create region components here
- `runtime/EMA-0.0.5--4-24/apps/web/src/app/styles.css` — region layout + palette use via `ema-design-system`
- `runtime/EMA-0.0.5--4-24/apps/web/src/app/mock-projections.ts` — read `seeAgentWorkProjection`; do NOT add self-report entries

## Out of scope (handoff, don't cross-edit)

- Daemon-side projection actors (Runtime Slice + Canon Writers own these)
- `packages/surface-core/` — the IPC client is already real at 217 LoC
- Virtual desktop shell chrome (`apps/web/src/shell/`) — owned by Runtime Slice
- Tauri-side work — owned by Desktop Launcher Correction
- Any writer module under `apps/daemon/src/ema_*/`

## The 8 regions

Each region renders with a visible honest-mock label until its backing projection lands. Invoke the `ema-honest-mocks` skill to stamp the label shape.

1. **Swarm pulse** — active swarms, status dot, pause/stop controls (mocked). Donor: mission-control-claude system-status density. Data: `seeAgentWorkProjection.swarms`.
2. **Mission rail** — vertical list of campaigns + missions. Donor: agent-os-bridge route inventory. Data: `seeAgentWorkProjection.campaigns` + `.missions`.
3. **Lane board** — columns `idea | ready | active | review | blocked | done`. Donor: agent-os-bridge lane-state vocabulary. Data: `seeAgentWorkProjection.lanes`.
4. **vCalendar strip** — weekly phases, checkups, focus blocks. Donor: shared-agent-swarm-workspace §12. Data: `seeAgentWorkProjection.vcalendar` (stub if absent).
5. **Agent roster** — actor display cards (role/kind/capabilities). Donor: mission-control-claude hierarchical roles. Data: `seeAgentWorkProjection.actors` with "not yet enforced" label on each role badge.
6. **Command panel** — list of dispatchable commands with their shape visually distinct from events. Donor: agent-os-v8 typed envelope rendering. Dispatch path: `useCommand` only; never raw frame construction.
7. **Instruction panel** — copyable agent prompt blocks for external Codex/Claude CLI sessions. Donor: `docs/agents/see-agent-work-agent-usage.md` runbook.
8. **Chronicle strip** — recent events (bounded at `CHRONICLE_MAX = 200`). Donor: lineage-original-elixir-ema @max_events. Data: event stream via `ipc-client.subscribeProjection("events.chronicle")` or mock fallback.

## Discipline (non-negotiable)

- **Boot-before-surface gate.** Before any region mounts, the page checks daemon presence via `useProjection("topbar.projection")` resolution. If absent > 2 s, show a labeled "connecting to daemon" state. The 8 regions render only after the gate resolves.
- **Read-only observer.** No region mutates canon. All control buttons (pause/stop/start) are labeled `mocked` and flow through `useCommand` when they become real.
- **Typed IPC framing.** Command panel renders commands as one envelope type; chronicle renders events as another; visually distinct (different border treatment, different pill).
- **CHRONICLE_MAX = 200.** Extracted as a named constant. Any buffer that grows past 200 is trimmed FIFO.
- **`ema-honest-mocks` skill** for every mocked control or panel label: `mocked | draft | local only | pending daemon writer` + CLI equivalent.
- **`ema-design-system` skill** for palette (dark base + teal/slate-blue/amber accents), typography (Apple system fonts), liquid-glass tier on panels.
- **`ema-virtual-desktop` skill** when touching the shell layer (but that should not be needed — this lane renders *inside* the shell, not as new chrome).
- **`ema-donor-rip` skill** if lifting any specific donor CSS or component — `SOURCE:` header required with donor branch + commit sha.

## Exit criteria

- `apps/web/src/app/agent-work-page.tsx` renders the 8 regions inside the virtual-desktop-shell.
- Each region reads from `seeAgentWorkProjection` (current mock shape) or shows a labeled stub if that slice of the projection isn't populated.
- Chronicle buffer bounded at 200; tested by injecting 300 events and asserting only 200 render.
- Agent roster displays `actors[].role` with a "not yet enforced" label on each role badge.
- Boot-before-surface gate active (no pre-daemon region render).
- Command envelope vs event envelope are visually distinct (different pill shape or border treatment, documented in a short CSS comment).
- `MOCK_PROJECTION_LABEL` rendered on every panel whose backing projection is not yet daemon-emitted.
- `gleam build` green (not touched by this lane). `pnpm -r typecheck` green.
- Manual screenshot shows the 8 regions with dense operator feel, not generic card layout.

## Verification

```bash
cd runtime/EMA-0.0.5--4-24
pnpm -r typecheck
pnpm --filter @ema/web build
node tooling/m1-round-trip.mjs    # unchanged; still OK
bash scripts/lint.sh              # if Code Quality has wired it
```

Open `http://localhost:5173/orgs/org:.../spaces/.../projects/.../see-agent-work` (exact path per router) and:

- Kill the daemon. The shell should show "connecting to daemon" within ~2 s, not the 8 regions.
- Restart the daemon. The 8 regions should mount after hello_ack.
- Inspect the DOM for at least 8 distinct panel roots.
- Grep the rendered page for `mocked | pending daemon writer | draft` — every mock-backed panel should carry one.

## Dependencies on other lanes

- None blocking. This lane can proceed today.
- Benefits from `L-projections-topbar` (Runtime Slice Slice B) closing first, because then the boot-before-surface gate can read a real projection instead of a mock one. But not a hard prerequisite.
- Benefits from `L-see-agent-work-docs` (CLI + agent runbook finalization) — the instruction panel copies blocks from `docs/agents/see-agent-work-agent-usage.md`. If that doc is still an outline, the instruction panel links to it rather than inlining.

## Reporting (close template)

```text
Slice: L-see-agent-work-8-region
Regions rendered: (list all 8 with file:component)
Mock labels present on: (list regions with backing projection not live)
Boot-before-surface gate tested: yes/no
Chronicle bound verified: yes/no (with test)
Typed envelope distinction: yes/no (with screenshot path)
Skills invoked: ema-honest-mocks, ema-design-system, ema-virtual-desktop?, ema-donor-rip?
Donor lifts (with SOURCE: headers): (list, or none)
Risks / follow-ups:
```
