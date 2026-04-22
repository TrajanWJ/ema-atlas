---
id: TRIAGE-RENDERER-APPS-2026-04-13
type: ledger
layer: reality
title: "Renderer app triage ledger — per-route disposition for v1.1"
status: draft
created: 2026-04-13
scope: "apps/renderer/src/App.tsx APP_REGISTRY (34 wired routes)"
source_of_truth:
  - "apps/renderer/src/App.tsx:88-141 (switch statement)"
  - "04-CANON/VAPP-RECONCILIATION-TABLE.md"
  - "04-CANON/CATALOG.md"
  - "services/core/backend/manifest.ts"
related:
  - "[[11-GAPS/GUI-ROT-DIAGNOSTIC-2026-04-13]]"
  - "[[10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE]]"
tags: [triage, renderer, vapp, ledger, v1.1]
---

# Renderer App Triage Ledger

> Per-route decision for every wired renderer route as of 2026-04-13.
> Scope: the 34 routes in `apps/renderer/src/App.tsx` switch statement.
> Purpose: drive v1.1 cleanup — each route must resolve to exactly one disposition.

## Dispositions

- **KEEP-AND-WIRE** — real user value, backend exists or is easy to write. Fix contract drift, land in v1.1.
- **KEEP-BUT-QUARANTINE** — real intent, no backend yet. Swap to `<NotWiredYet />` placeholder card that explains status and points at a tracking intent.
- **REBUILD-ON-A** — should exist post-sub-project-A on the event-sourced spine. Quarantine now, rebuild later. Do NOT re-wire against current services.
- **MERGE-INTO-X** — duplicate of another wired app; remove route, redirect to X.
- **UNWIRE-SYSTEM-CONCEPT** — not a vApp per canon (Projects, Executions, Proposals, Governance, Babysitter, HQ). Either fold into a shell surface or retire as a route.
- **DEFER** — not v1.1. Quarantine and leave.

Each row's decision is the author's call based on canon + route drift + user's
stated pain. They are reversible. Mark any you disagree with and we'll re-visit.

## Ledger

| # | Route | Component | Canon match | Backend status | Disposition | Reason |
|---|---|---|---|---|---|---|
| 1 | `desk` | DeskApp | — (shell concept) | uses multiple services | **KEEP-AND-WIRE** | Default home per user mental model; fix per-component route drift. |
| 2 | `agenda` | AgendaApp | canon #3 Schedule | no calendar backend yet | **KEEP-BUT-QUARANTINE** | Schedule vApp has no wired service; quarantine until calendar is real. |
| 3 | `brain-dump` | BrainDumpApp | canon #5 Brain Dumps | `brain-dump.channel` + service | **KEEP-AND-WIRE** | Highest-value capture surface. Fix contract drift first. |
| 4 | `tasks` | TasksApp | canon #2 Tasks | `tasks.channel` + service | **KEEP-AND-WIRE** | Core. Real backend. Fix shapes. |
| 5 | `projects` | ProjectsApp | NOT vApp (system concept) | `projects.channel` | **UNWIRE-SYSTEM-CONCEPT** | Per canon, Projects is a hierarchy level, not a vApp. Move to shell / space manager. |
| 6 | `executions` | ExecutionsApp | NOT vApp (system concept) | `executions.router` + channel | **UNWIRE-SYSTEM-CONCEPT** | Executions are operational records. Fold into Review/Chronicle shell surface. Known route drift: `/executions/:id/events` missing. |
| 7 | `proposals` | ProposalsApp | NOT vApp (system concept) | proposal pipeline service | **UNWIRE-SYSTEM-CONCEPT** | Proposals are pipeline output. Fold into Review surface. |
| 8 | `blueprint-planner` | BlueprintPlannerApp | canon #18 | partial | **REBUILD-ON-A** | Tightly coupled to intent/proposal event stream; belongs on event-sourced spine. |
| 9 | `intent-schematic` | IntentSchematicApp | canon #18 (alias) | `intents/service.ts` exists | **MERGE-INTO blueprint-planner** | Same canon slot as blueprint-planner. Pick one name. Canon says "Blueprint / Schematic Planner" — keep Blueprint Planner, redirect `intent-schematic` route. |
| 10 | `wiki` | WikiApp | canon #14 | vault file reads | **KEEP-AND-WIRE** | Already works read-side; fix write/navigation drift. |
| 11 | `agents` | AgentsApp | canon #19 Agent Hub | no unified agent backend | **KEEP-BUT-QUARANTINE** | No current agent orchestration backend in TS. Placeholder until post-A. |
| 12 | `feeds` | FeedsApp | canon #16 | no feed backend | **KEEP-BUT-QUARANTINE** | Canon-only, no implementation. |
| 13 | `canvas` | CanvasApp | canon #9 Whiteboard/Canvas | none | **KEEP-BUT-QUARANTINE** | Canon item, no backend. |
| 14 | `pipes` | PipesApp | renderer-only (adding to canon) | `pipes/bus.ts` exists | **KEEP-AND-WIRE** | Real backing service (`pipeBus`). Wire cleanly. |
| 15 | `evolution` | EvolutionDashboard | unclear per canon | none | **DEFER** | Per reconciliation table: "probably tied to Phase 3 Autonomous Reasoning, unclear." Quarantine, ask user for intent before rebuilding. |
| 16 | `whiteboard` | WhiteboardApp | canon #9 (dup of canvas) | none | **MERGE-INTO canvas** | Per reconciliation table: same canon slot. Pick canvas, redirect whiteboard route. |
| 17 | `storyboard` | StoryboardApp | unclear per canon | none | **DEFER** | Per reconciliation table: "unclear purpose." |
| 18 | `decision-log` | DecisionLogApp | renderer-only (add to canon) | none | **KEEP-BUT-QUARANTINE** | Real product idea, no backend. Tracks decisions — aligns with `10-DECISIONS/` staging already used. |
| 19 | `campaigns` | CampaignsApp | NOT vApp (system concept) | none | **UNWIRE-SYSTEM-CONCEPT** | Per canon: related to proposal pipeline. |
| 20 | `governance` | GovernanceApp | NOT vApp (system concept) | none | **UNWIRE-SYSTEM-CONCEPT** | Per canon: absorb into permissions/approval flows. |
| 21 | `babysitter` | BabysitterApp | NOT vApp (system concept) | no babysitter service yet | **UNWIRE-SYSTEM-CONCEPT** | Per canon + `canon/specs/BABYSITTER-SYSTEM`: lives in services layer, visible through chronicle/review surfaces, not its own vApp. |
| 22 | `habits` | HabitsApp | renderer-only (add to canon) | none | **KEEP-BUT-QUARANTINE** | Real product idea, needs backend. |
| 23 | `journal` | JournalApp | canon #12 | none wired | **KEEP-AND-WIRE** | Core life surface. Small backend required (append-only log + search). Worth landing in v1.1. |
| 24 | `focus` | FocusApp | canon #6 Pomodoro | none wired | **KEEP-AND-WIRE** | Self-contained (timer + log). Easy to ship end-to-end. |
| 25 | `responsibilities` | ResponsibilitiesApp | canon #4 | none wired | **KEEP-BUT-QUARANTINE** | Conceptually important, not urgent. |
| 26 | `temporal` | TemporalApp | unclear per canon | none | **DEFER** | Per reconciliation table: "unclear purpose." |
| 27 | `goals` | GoalsApp | renderer-only (add to canon) | `goals/service.ts` exists | **KEEP-AND-WIRE** | Real service. Fix drift. |
| 28 | `settings` | SettingsApp | canon #29 | `settings.channel` | **KEEP-AND-WIRE** | Core. Fix. |
| 29 | `terminal` | TerminalApp | canon #25 | no pty backend | **REBUILD-ON-A** | Terminal comes from t3code's node-pty adapter per meta-bootstrap notes. Quarantine until spine lands. |
| 30 | `voice` | VoiceApp | NOT vApp (modality per canon) | `voice.channel` exists | **KEEP-BUT-QUARANTINE** | Canon says voice is input modality for brain dump, not standalone app. Overlay already removed due to mic permission issues (App.tsx:2). Quarantine. |
| 31 | `hq` | HQApp | NOT vApp (shell per canon) | none | **UNWIRE-SYSTEM-CONCEPT** | HQ is the dual-surface shell, not a route. Should be the launchpad or a shell mode, not a vApp tile. |
| 32 | `pattern-lab` | PatternLabApp | — | none | **DEFER** | Unclear scope, not in canon. Quarantine. |
| 33 | `operator-chat` | OperatorChatApp | canon #34 Comms | none | **MERGE-INTO agent-chat** (or vice versa) | Canon has one Comms slot + one Agent Comms slot. Two chat apps is duplication until scope is clarified. Keep one, redirect the other. Pick at wire time. |
| 34 | `agent-chat` | AgentChatApp | canon #24 Agent Comms | none | **KEEP-BUT-QUARANTINE** | Real backend comes post-A via t3code chat port (sub-project C). |

## Disposition counts

| Disposition | Count | Routes |
|---|---|---|
| KEEP-AND-WIRE | 10 | desk, brain-dump, tasks, wiki, pipes, journal, focus, goals, settings, one of {operator-chat, agent-chat} |
| KEEP-BUT-QUARANTINE | 9 | agenda, agents, feeds, canvas, decision-log, habits, responsibilities, voice, agent-chat |
| REBUILD-ON-A | 3 | blueprint-planner, terminal, (effectively many quarantines rebuild on A) |
| MERGE-INTO-X | 3 | intent-schematic → blueprint-planner, whiteboard → canvas, one chat → the other |
| UNWIRE-SYSTEM-CONCEPT | 7 | projects, executions, proposals, campaigns, governance, babysitter, hq |
| DEFER | 4 | evolution, storyboard, temporal, pattern-lab |

(Total 36 because a few routes have two tags in my head; the table is authoritative
per-route and sums to 34.)

## Out-of-registry components

The 95-component count from the initial survey includes subcomponents, layout helpers,
stubs, and scaffolds that are NOT in `App.tsx`. Examples: `agent-bridge`, `claude-bridge`,
`soul-editor`, `metamind`, `superman`, `jarvis`, `life-dashboard`, many others.

**Disposition:** if a component is not referenced by `App.tsx` APP_REGISTRY, it does
not exist for the user. They are scaffolding. Do not triage them per-component.
Instead, in session 1 cleanup:

- audit `apps/renderer/src/components/**` for any directory whose top-level `*App.tsx`
  is not imported in `App.tsx`.
- move those directories to `apps/renderer/src/components/_attic/` (or delete, user's
  call).
- the goal: the components folder stops advertising 95 apps when only 34 are routed.

## Session-1 action list (derived from ledger)

1. **UNWIRE-SYSTEM-CONCEPT routes (7)**: remove from `App.tsx` switch; make
   launchpad stop listing them as apps; references to them as "apps" are wrong.
   Some re-surface as shell panels (Executions → Review shell, Babysitter →
   chronicle surface) — that's a later refactor, not session 1. Session 1 just
   stops claiming they are vApps.
2. **MERGE-INTO routes (3)**: drop duplicate routes; aliases can live in
   `router.ts` as redirects.
3. **KEEP-BUT-QUARANTINE routes (9 + residual)**: all get `<NotWiredYet />`
   placeholder per GUI rot diagnostic §Session-1 fix list item 5.
4. **KEEP-AND-WIRE routes (10)**: these are the v1.1 "make it actually work"
   target set. Fix contract drift one by one in a follow-up session. Do NOT
   attempt all ten in the cleanup session.
5. **DEFER routes (4)**: same as quarantine; they show `<NotWiredYet />` with a
   clear "pending scope decision" note pointing at the reconciliation intent.
6. **Attic sweep**: move unrouted component directories out of
   `apps/renderer/src/components/`.

## Known open questions (user decisions needed)

1. **Which chat survives**, operator-chat or agent-chat? Both canon slots (#24
   Agent Comms, #34 Comms) exist; the renderer currently has both. Before wire
   time we need to pick which route is which.
2. **HQ as a shell, not an app**: the launchpad is currently a vApp tile list.
   HQ wants to be the shell (per canon + `research/frontend-patterns/
   dual-surface-shell`). This is a small refactor but it's architectural — the
   launchpad experience changes. Out of scope for session-1 cleanup unless user
   wants to pull it forward.
3. **Blueprint Planner vs Intent Schematic naming**: canon calls it Blueprint
   Planner; renderer splits it. User should pick the final name; I'm defaulting
   to Blueprint Planner everywhere and redirecting Intent Schematic.
4. **Voice quarantine permanent?** Voice app has had mic issues and the
   overlay was removed. Until voice has an owner and a clear canon disposition
   (probably "a mode inside brain-dump, not a vApp"), it's quarantined.

## Pointers

- `04-CANON/VAPP-RECONCILIATION-TABLE.md` — upstream canon table.
- `11-GAPS/GUI-ROT-DIAGNOSTIC-2026-04-13.md` — why "error unknown" is global.
- `01-PLANS/v1.1-EXECUTION-ROADMAP-2026-04-13.md` — when these actions land.
- `10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md` — why some
  routes are REBUILD-ON-A rather than fix-now.
