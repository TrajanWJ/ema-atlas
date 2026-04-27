# EMA 0.0.5 Orchestrator Index

Use this folder as the handoff point for agents joining EMA 0.0.5 work.
One canonical prompt per role. No silent duplicates.

## Ledger anchor

The single source of truth for lane state is
`runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`.
Every orchestrator reads it on cold start and reports lane closures back
to it. If another file appears to track lane status, reconcile it into
STATUS.md or archive it.

Consolidation rationale: `HANDOFF-2026-04-24.md`.

## Vision Anchors

The product shape is doctrine-backed; orchestrators enforce it, not invent it.

- **Canon web-surface stack as of 2026-04-24:** `@ema/web` is a **Next.js + React + Motion + Zustand** browser vDesktop, not a Vite SPA. The canonical runnable surface is `runtime/EMA-0.0.5--4-24/apps/web/app/`, and `apps/web/src/place-donor/place-org/` is the copied place.org donor payload to reflect from. Future web-vDesktop work should preserve this stack unless an explicit superseding doctrine memo is written.
- Canonical surface-from-donor plan: `doctrine/research/EMA-0.0.5-SURFACE-DONOR-MATRIX.md` — per-surface donor mapping (place.org, place-companion, agent-os-bridge/v8, frontend-layer, mission-control-claude, lineage-original-elixir-ema) with target EMA files.
- Donor doctrine pre-extracted at `sources/snapshots/ema 0.0.3/ema-atlas/graph/nodes/*.qmd`. Each `.qmd` carries YAML frontmatter + Carries-Forward / Leaves-Behind bullets. Skip re-archaeology.
- Canonical product lane split: Surface / Runtime / Desktop Launcher (per memory `ema-lane-orchestration-split.md`).
- Shipping shape: daemon-authoritative operator console, 8-region See Agent Work first screen, boot-before-surface gate, read-only observer discipline, typed IPC framing, bounded chronicle (`CHRONICLE_MAX = 200`).
- Supporting skills: `ema-virtual-desktop` (shell conventions), `ema-design-system` (palette/typography), `ema-honest-mocks` (label discipline + CLI equivalents), `ema-donor-rip` (provenance-tagged lifts).

## Active Prompts

One row per live orchestrator role. Each file is the canonical brief for
that role; a cold session should read exactly one of these plus STATUS.md.

| Role | Canonical file | Scope |
|---|---|---|
| Runtime Vertical Slice | `RUNTIME-VERTICAL-SLICE-ORCHESTRATOR-PROMPT.md` | Real daemon-backed data path: surface IPC, command → event → projection → render. Writes `packages/surface-core/`, `packages/contracts/ipc/`, `apps/web/src/lib/ipc/`, focused daemon IPC/projection files. |
| Product Surface Donor | `PRODUCT-SURFACE-DONOR-ORCHESTRATOR-PROMPT.md` | Visible product progress from donor code: See Agent Work 8-region first screen, HQ/Launchpad, command palette, handoffs. Writes `apps/web/src/app/`, `apps/web/src/vapps/`, donor synthesis docs. |
| Web vDesktop Surface | `WEB-VDESKTOP-SURFACE-ORCHESTRATOR-PROMPT.md` | Browser virtual desktop posture: Next.js + Motion + Zustand place.org shell, Launchpad vApp, dock/window/wallpaper chrome. Writes `apps/web/app/`, `apps/web/src/place-donor/`, `apps/web/src/place-reflection/`, web docs/tests. |
| Desktop Launcher Correction | `DESKTOP-LAUNCHER-CORRECTION-ORCHESTRATOR-PROMPT.md` | Native Tauri bundle: CSP, first-launch daemon-detect affordance, tray icon, launchd autostart. Writes `apps/desktop/`, desktop install scripts and docs. |
| Canon Writers | `CANON-WRITERS-ORCHESTRATOR-PROMPT.md` | Daemon writer actors (identity → org → space → project → blueprint → git-ema). Writes `apps/daemon/src/`, event catalog, replay tests. |
| Provenance & Version Control | `PROVENANCE-AND-VERSION-CONTROL-ORCHESTRATOR-PROMPT.md` | Git history, branch discipline, worktree recipe, CHANGELOG. Writes `.git/`, `docs/operations/git-policy.md`, `CHANGELOG.md`. |
| Workspace Hygiene & Swarm Meta | `WORKSPACE-HYGIENE-AND-SWARM-META-ORCHESTRATOR-PROMPT.md` | Orchestration ecosystem itself: prompt reconciliation, lane files, dev scripts, swarm sweeps, ledger gate. Writes `docs/orchestration/lanes/`, `docs/operations/`, `scripts/stop-ema-dev.sh`, `contract-check.sh`, `swarm-sweep.sh`, `tooling/`. |
| Code Quality & Language Idiom | `CODE-QUALITY-AND-LANGUAGE-IDIOM-ORCHESTRATOR-PROMPT.md` | File-level refinement: sharper names, idiomatic language, honest comments, zero dead weight. Zero behavior change per slice. |
| Codebase Architecture & Extensibility | `CODEBASE-ARCHITECTURE-AND-EXTENSIBILITY-ORCHESTRATOR-PROMPT.md` | One level above per-file idiom: module placement, accidental duplication, god-modules, seam clarity for new event kinds / vApps / donors / connectors. Audit + small reversible moves. |

The canonical set is nine specialist orchestrators. Any prompt added beyond
this list requires a named superseding memo (like `HANDOFF-2026-04-24.md`)
and a new entry in this index before workers treat it as authoritative.

## Archived Prompts

Archived under `archive/` or `archive/<date>/`. Redirect stubs remain at the
original paths so old links still resolve. Every archived prompt's ultimate
replacement is the eight-orchestrator set above; `HANDOFF-2026-04-24.md`
is the dissolution memo explaining why the V1/V2/Correction briefs were
folded back into specialist lanes.

| Original path | Archive location | Canonical replacement |
|---|---|---|
| `CODEX-ORCHESTRATOR-PROMPT.md` (V1 worker brief) | `archive/2026-04-24/CODEX-ORCHESTRATOR-PROMPT.md` | specialist set + `HANDOFF-2026-04-24.md` |
| `CLAUDE-ORCHESTRATOR-PROMPT.md` (V1 co-orchestrator) | `archive/2026-04-24/CLAUDE-ORCHESTRATOR-PROMPT.md` | specialist set + `HANDOFF-2026-04-24.md` |
| `CODEX-CORRECTION-PROMPT-2026-04-24.md` (one-shot recovery) | `archive/2026-04-24/CODEX-CORRECTION-PROMPT-2026-04-24.md` | specialist set + `HANDOFF-2026-04-24.md` |
| `CODEX-ORCHESTRATOR-PROMPT-V2.md` (parallel-session revision, superseded in meta-drift recovery) | `archive/2026-04-24/CODEX-ORCHESTRATOR-PROMPT-V2.md` | specialist set + `HANDOFF-2026-04-24.md` |
| `CLAUDE-ORCHESTRATOR-PROMPT-V2.md` (parallel-session revision, superseded in meta-drift recovery) | `archive/2026-04-24/CLAUDE-ORCHESTRATOR-PROMPT-V2.md` | specialist set + `HANDOFF-2026-04-24.md` |

## Collision Rules

- One canonical prompt per role. Parallel sessions do not fork a new V3;
  they either edit the canonical file under coordinator review or
  archive the current canonical and land a replacement.
- Workspace Hygiene reconciles headers and archives old versions. It
  does not edit the body or slice definitions of another orchestrator's
  prompt.
- Runtime Vertical Slice and Product Surface Donor do not run against
  the same files at the same time. Runtime owns the real data path;
  Product Surface owns donor UX translation and honest mock control.
- Web vDesktop Surface is narrower than Product Surface Donor. Use it
  when the task is specifically the browser desktop, Launchpad-as-vApp,
  dock, wallpaper, window chrome, or place.org visual posture. It owns
  the Next/Motion/Zustand browser surface in `apps/web/app/`; do not
  route those tasks to the Tauri Desktop Launcher lane.
- Canon Writers owns daemon writer modules. Runtime Slice meets it at
  the event kind and projection channel name — does not edit writer code.
- Any agent touching topology (`Organization -> Space -> Project`) reads
  `doctrine/planning/EMA-0.0.5-LANGUAGE-LOCK.md` first.
- Any donor import declares a verdict: `copy`, `adapt`, `inspire`, or
  `reject`. `copy` is forbidden on files touching topology, event shape,
  or daemon authority.
- Any mock must be visibly labeled (MOCK badge on the surface).
- Any claimed runtime slice must prove: command → daemon → event →
  projection → surface. No hidden surface-owned truth.
- Provenance owns `.git/` setup. Other orchestrators commit within their
  own lane branches; they do not reshape git history.

## Recommended Current Pair

For the next big progress push, run:

1. `RUNTIME-VERTICAL-SLICE-ORCHESTRATOR-PROMPT.md`
2. `PRODUCT-SURFACE-DONOR-ORCHESTRATOR-PROMPT.md`

They are intentionally different alleys — one makes EMA real, one makes
EMA visibly useful. Pair them only when their write scopes are disjoint
for the session (see Collision Rules).
