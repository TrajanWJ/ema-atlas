---
id: PLAN-FRONTEND-BUILDOUT
type: plan
layer: planning
title: "Frontend GUI buildout plan — renderer, shell, settings, top bar"
status: draft
created: 2026-04-13
scope: "apps/renderer/, apps/electron/, shell surfaces"
related:
  - "[[13-CLI-GUI-PARITY/RENDERER-APP-TRIAGE-LEDGER-2026-04-13]]"
  - "[[11-GAPS/GUI-ROT-DIAGNOSTIC-2026-04-13]]"
  - "[[11-GAPS/2026-04-13-FORENSIC-AUDIT-GAP-LEDGER]]"
  - "[[11-GAPS/2026-04-13-MISSING-FEATURES-LEDGER]]"
  - "[[05-WIKI/SETTINGS-OBJECT-SPEC]]"
  - "[[05-WIKI/TOP-BAR-SPACES-ORGS-SPEC]]"
  - "[[01-PLANS/2026-04-13-SUBPROJECT-A-DAEMON-BACKBONE-SPEC-DRAFT]]"
  - "[[01-PLANS/v1.1-EXECUTION-ROADMAP-2026-04-13]]"
  - "[[14-WORKSTREAMS/FRONTEND-WORKSTREAM]]"
tags: [plan, renderer, gui, shell, v1.1, frontend]
---

# Frontend Buildout Plan

> The renderer isn't mostly-broken — it's mostly-uninformative and
> ghost-filled. This plan sequences the work to make it **legible, honest,
> and useful** without waiting for sub-project A. The shell, top bar,
> settings, and error surfaces are all hygiene-axis work that doesn't
> block on daemon extraction.
>
> Per the triage ledger, 34 routes need dispositions. This plan is what
> happens AFTER disposition: build order + shell-level investments.

## Ordering principle

Front-load **legibility** (everything that stops the UI from lying), then
**structure** (shell, top bar, settings), then **surface quality** (vApp
polish on the routes that earned KEEP-AND-WIRE). Vapp expansion comes last
and is per-route.

## Phase F0 — Error honesty (1-2 sessions)

Goal: when something breaks, the user sees *what* broke, not "error unknown."

| Task | File | Change |
|---|---|---|
| F0.1 | `apps/renderer/src/lib/api.ts:37` | Replace `.catch(() => ({ error: "unknown" }))` with typed error class surfacing status code + body snippet + route |
| F0.2 | `apps/renderer/src/lib/api.ts` (whole file) | Replace `JSON.parse(text) as T` with Zod schema parse against `@ema/shared/schemas` |
| F0.3 | All ~15 `.catch(() => {})` in stores | Replace with `.catch((err) => set({ error: err.message, loading: false }))`; add `error: string \| null` to each store |
| F0.4 | Shell ErrorBoundary | Real boundary component around `<AppSwitch />` that shows store error state + "copy to clipboard" + "reload vApp" |
| F0.5 | WS connection indicator | Tiny pill in top-right: `connected` / `reconnecting` / `offline` — subscribed to socket state |

Exit criteria: no route in the renderer can display the literal string
"unknown" unless an actual payload has that word in it. Every fetch failure
surfaces route + status + error message.

## Phase F1 — Ghost purge (0.5 session)

Goal: stop listing features we don't have.

| Task | File | Change |
|---|---|---|
| F1.1 | `apps/renderer/src/App.tsx:88-141` | Remove 10 `ConnectedDraftApp` shells from route switch: wiki, canvas, evolution, decision-log, campaigns, habits, journal, focus, responsibilities, temporal |
| F1.2 | Launchpad registry | Remove the same 10 from the launchpad app list |
| F1.3 | Per-route disposition | For each REBUILD-ON-A and KEEP-BUT-QUARANTINE route in the triage ledger, swap the component for a single shared `<NotWiredYet />` component that shows: status, tracking intent link, "why this doesn't work yet," and "check back after phase Xn" |
| F1.4 | Duplicate stores | Delete one of each pair: audit/audit-trail, gap/gaps, project/projects, decision/decision-log, token/token-monitor — grep imports first, migrate consumers to survivor |

The component files for quarantined routes are NOT deleted — they freeze.
Re-enablement later is: restore route entry + remove quarantine wrapper.

## Phase F2 — Shell redesign (1-2 sessions)

Goal: structured shell that matches the mental model of Spaces and
Organizations, with honest status.

See spec: [[05-WIKI/TOP-BAR-SPACES-ORGS-SPEC]]

Shell regions:

```
┌────────────────────────────────────────────────────────────────────┐
│ [Org▾] [Space▾]   [workstream badge]      [⟳ daemon] [me▾]  ── topbar
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                        <active vApp>                               │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ [launchpad⌘K]  [brain-dump⌘↑C]  [notifications]            [quit]  │ ── dock
└────────────────────────────────────────────────────────────────────┘
```

| Task | Target |
|---|---|
| F2.1 | `<OrgSwitcher />` component — reads `/api/organizations` (new endpoint or dev stub), dropdown, creates "personal" default |
| F2.2 | `<SpaceSwitcher />` component — reads `/api/spaces`, shows within-org, "+ new space" inline |
| F2.3 | `<WorkstreamBadge />` — per [[14-WORKSTREAMS/WORKSTREAM-IDENTITY-DRAFT]], shows current thread-of-work with session id + click-to-switch |
| F2.4 | `<DaemonStatus />` — subscribes to socket state + `/api/health` poll; color: green/yellow/red; click to open daemon panel |
| F2.5 | `<MeMenu />` — avatar + user state + "switch actor" + "settings" + "quit" |
| F2.6 | Dock cleanup — remove unused icons, wire command palette `⌘K` to launchpad |

Scoping rule: **every data fetch in shell surfaces Org + Space in the
request context.** Add `x-ema-org` and `x-ema-space` headers to the api
client, passed from a React context provided by the switchers. Services
must validate or default these headers (coordination with backend).

## Phase F3 — Settings redesign (1 session)

See spec: [[05-WIKI/SETTINGS-OBJECT-SPEC]]

Summary: replace current thin `SettingsApp` with a scoped settings object
tree. Settings live at three scopes — global (per machine), org (per
organization), space (per space). Categories: Identity, Daemon,
Appearance, Data, Keybindings, Advanced.

Phase F3 deliverables:

| Task | Target |
|---|---|
| F3.1 | `<SettingsShell />` with left-nav categories + right-pane editor |
| F3.2 | Scope picker at top of settings: `global` / `org:<name>` / `space:<name>` |
| F3.3 | Per-category forms (each category is its own component under `apps/renderer/src/components/settings/`) |
| F3.4 | Services endpoint: `GET/PUT /api/settings/:scope/:category` with Zod shapes per [[05-WIKI/SETTINGS-OBJECT-SPEC]] |
| F3.5 | Keybindings editor — lists active bindings, click-to-rebind, conflicts shown inline |
| F3.6 | Daemon control panel (start/stop/restart/install/logs) — links to [[01-PLANS/2026-04-13-DAEMON-EXTRACTION-IMPL-NOTES]] #F3.6 |

## Phase F4 — Keep-and-wire vApps (2-3 sessions)

The KEEP-AND-WIRE routes from the triage ledger, in dependency order.

Per route: (a) verify backend contract, (b) fix store shape drift, (c) add
error state + loading state, (d) add WS subscription where applicable, (e)
replace any hardcoded data with real fetches.

Order:

1. **Desk** (#1 in triage) — default home, must be legible first
2. **Brain-dump** (#3) — highest-value capture surface
3. **Tasks** (#4) — core loop
4. **Wiki** (#10) — write/navigation drift
5. **Pipes** (#14) — real backing service
6. **Goals** — already partial, needs polish
7. **Settings** — wired in F3 above
8. **Terminal** — already works, double-check xterm handling

Stretch: Agenda (#2) if calendar backend ships.

## Phase F5 — HQ decomposition (1 session)

`HQApp.tsx` (862 LOC) is a god aggregator hitting 6 endpoints and writing
to executions + proposals. Break it into:

- `<HQOverview />` — read-only summary
- `<HQReview />` — execution/proposal approve/reject (moves there from
  routes #6 and #7 per triage)
- `<HQProvenance />` — `/review/provenance`
- `<HQChronicle />` — chronicle sessions

Result: HQ becomes a shell tab-group over real sub-routes, each with its
own store slice.

## Phase F6 — Launchpad as real surface (0.5 session)

Launchpad currently lists apps from a static registry. Make it:

- Grouped by category (capture / work / knowledge / system)
- Honest about status (hide quarantined, show "coming soon" with intent
  link for rebuild-on-a)
- Searchable (fuzzy match across title + description + tags)
- Keyboard-first (`⌘K` opens it, arrows navigate, enter activates)

## Dependencies / sequencing

```
F0 (error honesty)
  │
  ├─▶ F1 (ghost purge) ─┐
  │                     ├─▶ F4 (keep-and-wire) ─▶ F5 (HQ) ─▶ F6 (launchpad)
  ├─▶ F2 (shell) ───────┤
  │                     │
  └─▶ F3 (settings) ────┘
```

F0 blocks everything. F1/F2/F3 are parallel. F4/F5/F6 need F1 done for
route clarity and F2 done for org/space scoping.

## Non-goals (explicitly deferred)

- vApp-per-BrowserWindow isolation → sub-project C
- Pluggable vApp manifest + loader → sub-project C
- Multi-user login / team spaces → post v1.1
- Voice surface polish → untouched
- Whiteboard/storyboard real implementations → deferred per triage ledger
- Mobile / web responsive layout → not this cycle

## Acceptance — phase-by-phase

- **F0:** grep `apps/renderer/ -r "catch(() => {})"` → 0 hits. No user-facing "unknown" that isn't an actual payload string.
- **F1:** `App.tsx` route switch has zero `ConnectedDraftApp` references. Launchpad shows only working routes + honest quarantines.
- **F2:** Top bar renders org+space+workstream+daemon status. All API calls include `x-ema-org` and `x-ema-space` headers.
- **F3:** Settings vApp has 6 categories working end-to-end with scope picker. Daemon panel can start/stop services.
- **F4:** All 8 priority vApps render real data, survive daemon restart, show error states on failure.
- **F5:** `HQApp.tsx` ≤ 200 LOC, 4 sub-components.
- **F6:** `⌘K` opens launchpad from anywhere.

## Session-sizing

Optimistic total: **8-10 working sessions.** Pessimistic: 15 if shell
redesign uncovers more store drift. Phase F0 should ship end of session 1.
