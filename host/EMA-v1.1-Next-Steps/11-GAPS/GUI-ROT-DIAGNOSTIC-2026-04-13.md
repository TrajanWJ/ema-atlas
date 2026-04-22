---
id: GAP-GUI-ROT-DIAGNOSTIC
type: gap
layer: reality-vs-expectation
title: "GUI rot diagnostic — why most renderer apps surface 'error unknown'"
status: diagnosed
created: 2026-04-13
scope: apps/renderer + services WS/HTTP edge
related:
  - "[[11-GAPS/CONVERGENCE-DEBT-SUMMARY]]"
  - "[[11-GAPS/RENDERER-RECONCILIATION-QUESTIONS]]"
  - "[[13-CLI-GUI-PARITY/RENDERER-APP-TRIAGE-LEDGER-2026-04-13]]"
  - "[[10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE]]"
tags: [gap, renderer, gui, error-handling, reality]
---

# GUI Rot Diagnostic

> User-felt symptom: "many apps simply do not work, just say 'error unknown' throughout."
> This document names the mechanisms that produce that symptom and ranks them by blast radius.

## TL;DR

The renderer is not mostly-broken. It is mostly-**uninformative**. A small number of
systemic defects at the edge (HTTP client, ws glue, store error-swallowing, and route
drift) turn every backend miss into the same generic "unknown" string, which makes the
entire UI feel dead even when the daemon is healthy. Separately, a large chunk of
renderer routes (see the triage ledger) have **no backend at all** — they were
scaffolded from the old Tauri build and point at services that were never ported.

## 1. Primary error sink

**File:** `apps/renderer/src/lib/api.ts:37`

```ts
const body = await res.json().catch(() => ({ error: "unknown" })) as { error?: string };
```

Every HTTP failure the fetch client can't cleanly parse collapses to the literal string
`"unknown"`. This is the dominant source of user-visible "error unknown" text. It
masks:

- 404 (route not wired at all)
- 500 with non-JSON body (daemon crash, middleware failure)
- CORS/auth rejection
- timeout / connection refused
- schema drift between renderer and backend

Any of those can trigger it, and the user sees the same message.

**Why it matters:** fixing this single line is the highest-leverage legibility win
in the whole codebase. Before any "make apps work" effort, apps must at least be
able to tell the truth about what's broken.

## 2. Store error-swallowing

**Pattern:** 147 `.catch(() => {})` / `.catch(() => [])` blocks across
`apps/renderer/src/**` stores and components (per 2026-04-13 survey).

Most renderer stores follow a shape like:

```ts
try {
  const data = await api.get(...);
  set({ data, error: null });
} catch {
  set({ data: [], error: 'something_failed' });
}
```

The error path drops the actual message, replaces it with a static string, and
the component renders "something_failed" or nothing at all. The user can't tell
a missing endpoint from a backend crash from an auth rejection.

**Blast radius:** every stateful app (tasks, proposals, goals, executions, focus,
journal, …).

## 3. Route drift

**Example found in survey:**
`apps/renderer/src/components/executions/ExecutionsApp.tsx:118` calls
`/api/executions/:id/events`. The route is **not defined** in
`services/core/executions/executions.router.ts`. Any click produces a 404, which
funnels into defect #1 and surfaces as "error unknown."

This is not an isolated case. The renderer was scaffolded against a mental model
of the old Elixir backend and never reconciled with the actual TS `services/core/*`
route surface. Some apps call endpoints that exist on the server with different
shapes; others call endpoints that were never built; others never make a request
at all and are just stubs.

**Consequence for v1.1:** "make the renderer work" is not a renderer task. It is
a contract reconciliation task. For each wired app, decide:

- is the endpoint wired and matching the expected shape? → test and fix shape drift.
- is the endpoint missing? → either write it, quarantine the app, or delete the app.
- is the backend intentionally absent? → the app is a stub and should say so.

The triage ledger (`13-CLI-GUI-PARITY/RENDERER-APP-TRIAGE-LEDGER-2026-04-13.md`)
captures the per-app decision for all 34 wired routes.

## 4. Phoenix wire protocol glue (fragile, not dead)

**Files:**
- `apps/renderer/src/lib/ws.ts` — imports `phoenix` JS client
- `services/realtime/server.ts` — manually reimplements the Phoenix wire protocol
  format `[joinRef, ref, topic, event, payload]`

This is not broken. The TS ws server mimics enough of Phoenix's wire shape that the
renderer's `phoenix` client can connect and join channels. It's a lift-and-shift
from the Elixir era that currently works.

**But:** it's one of the most fragile parts of the stack. There is no contract
enforcement on topic names, payload shapes, or error shapes. Any channel that
emits an error (`channel.on("error", ...)`) funnels it through `channels-store.ts:17`
as `unknown`, which loops back to defect #2.

**Disposition:** leave it alone in v1.1 cleanup. Sub-project A's Effect RPC
adoption retires it wholesale. Touching it now would compete with A.

## 5. No workspace typecheck

Root `package.json` has no `typecheck` script. Schema drift between
`shared/schemas/*` and `services/core/*/service.ts` is invisible until it breaks
a test or ships to the renderer as an "error unknown." Adding a typecheck script
across all workspaces and fixing the first wave of errors it surfaces is a
prerequisite for any wire-up work — otherwise we fix route drift by hand and
reintroduce it next week.

## 6. "Desktop popout" misdirection

`apps/renderer/src/App.tsx:76-86` detects that a non-launchpad route was
navigated in the main window, closes it, and re-opens it as an Electron
BrowserWindow via `openApp(route)`. When this machinery fails (window-manager
not ready, app config missing, IPC handler missing), the user sees no response —
not "error unknown," but a dead click. This is a quieter but related legibility
defect: **the user can't tell the difference between "nothing happened" and
"something broke silently."**

## 7. Voice overlay removed, traces remain

`App.tsx:2` notes "VoiceOverlay removed — was causing mic permission errors and
floating orb." `components/voice/VoiceApp` still exists and is wired in
`App.tsx:130`. If the user clicks `voice`, they hit a surface that has known
permission issues. Disposition in the triage ledger: quarantine until voice has
a clear owner.

## Root-cause ranking (highest blast radius first)

| # | Defect | Blast radius | Fix cost | Session-1 verdict |
|---|---|---|---|---|
| 1 | `api.ts` collapses all errors to `"unknown"` | Every HTTP-using app | tiny | FIX NOW |
| 2 | 147 `.catch(() => {})` store swallows | Every stateful app | medium (mechanical) | FIX NOW (helper + codemod) |
| 3 | Route drift / missing endpoints | ~half of wired apps | large (per-app) | TRIAGE NOW, fix per-app across later sessions |
| 4 | Phoenix wire protocol glue | Any ws-using app | N/A (retires in sub-project A) | LEAVE |
| 5 | No workspace typecheck | Whole repo | small script + first-pass fixes | FIX NOW |
| 6 | Desktop-popout dead-click mode | Any non-launchpad route | small | FIX NOW |
| 7 | Voice overlay residue | Voice app only | trivial (quarantine) | QUARANTINE |

## Session-1 fix list (non-blocking for sub-project A)

These are the changes that can land without depending on the meta-bootstrap spec.
They are hygiene — they make errors legible, they don't add features, they don't
touch architecture.

1. **Error envelope:** rewrite `apps/renderer/src/lib/api.ts` so error responses
   produce `{ status, code, message, body }` with real context. All callers read
   `.message`. Never collapse to `"unknown"`.
2. **Error capture helper:** add `apps/renderer/src/lib/capture-error.ts` that
   normalizes unknowns to a structured shape and logs to console. Replace the
   mechanical `.catch(() => {})` idiom across stores with `.catch(captureError)`.
3. **Typecheck script:** add `"typecheck": "tsc -b"` (or equivalent) to root
   `package.json`. Wire into CI-equivalent (`pnpm check`). Fix the first wave of
   errors surfaced in `shared/` and renderer edge code.
4. **App-health gate:** add a `/api/backend/routes` introspection endpoint in
   services. Renderer calls it on startup and renders a "not wired yet" placeholder
   card for any app whose backing route is missing instead of crashing on click.
5. **Quarantine list:** for apps with no canonical backend (see triage ledger
   disposition == QUARANTINE), swap their route target from the real component to
   a `<NotWiredYet />` placeholder that explains why and points at the triage row.
6. **Dead-click diagnostics:** wrap `openApp()` in `App.tsx:84` with a try/catch
   that surfaces failures via the error capture helper instead of silently
   dropping the click.

Estimated effort: one focused session of mechanical edits plus one round of
review. Does NOT require daemon architecture changes. Does NOT block sub-project
A. Explicitly OK to ship before A.

## What this diagnostic does NOT fix

- Apps that need a backend that doesn't exist (half the wired set).
- Ws fragility (retires in A).
- CLI rot (separate diagnostic).
- Daemon lifecycle (sub-project A).
- Any canon/realty reconciliation beyond legibility.

Those live in separate deliverables in this folder and in sub-project A's spec.

## Pointers

- `10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md` — why ws/http
  glue is left alone in v1.1 cleanup.
- `13-CLI-GUI-PARITY/RENDERER-APP-TRIAGE-LEDGER-2026-04-13.md` — per-app decisions.
- `13-CLI-GUI-PARITY/CLI-ROT-DIAGNOSTIC-2026-04-13.md` — CLI counterpart of this doc.
- `01-PLANS/v1.1-EXECUTION-ROADMAP-2026-04-13.md` — where the session-1 fix list
  sits relative to A, C, and the follow-up passes.
