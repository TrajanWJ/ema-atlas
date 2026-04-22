---
id: WIKI-TOP-BAR-SPACES-ORGS-SPEC
type: object-spec
layer: canon
title: "Top bar spec — organizations, spaces, workstreams, daemon status"
status: draft
created: 2026-04-13
scope: "apps/renderer shell top bar + services organizations+spaces domains"
related:
  - "[[05-WIKI/SETTINGS-OBJECT-SPEC]]"
  - "[[05-WIKI/EMA-SHARED-OBJECT-MODEL-DRAFT]]"
  - "[[14-WORKSTREAMS/WORKSTREAM-IDENTITY-DRAFT]]"
  - "[[14-WORKSTREAMS/WORKSTREAM-AND-MIRRORING-NOTES]]"
  - "[[01-PLANS/2026-04-13-FRONTEND-BUILDOUT-PLAN]]"
tags: [wiki, spec, shell, top-bar, spaces, organizations, v1.1]
---

# Top Bar Spec — Organizations, Spaces, Workstreams, Daemon

> The current top bar has rough space handling and no organization
> concept. It also fails to communicate daemon state or workstream
> identity. This spec defines the three left-side selectors, the
> center workstream badge, and the right-side status cluster.

## Mental model

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [🏢 Org ▾]  [📁 Space ▾]   │ #stream-name (sess:abc12) │  [⟳] [👤 me ▾] │
│   │           │                    │                       │       │   │
│   │           │                    │                       │       └── me menu
│   │           │                    │                       └────────── daemon status
│   │           │                    └────────────────────────────────── workstream badge
│   │           └─────────────────────────────────────────────────────── space switcher
│   └─────────────────────────────────────────────────────────────────── org switcher
└─────────────────────────────────────────────────────────────────────────┘
```

## Core data objects

### Organization

```ts
interface Organization {
  id: string;              // slug, immutable
  name: string;            // display
  created_at: number;
  brand_color?: string;    // hex
  icon?: string;           // emoji or icon key
  default_space_id?: string;
  actor_id: string;        // owner actor
}
```

There is always at least one org: `personal` (auto-created on bootstrap,
cannot be deleted). The user-visible concept is optional — some users
will only ever see one org and can hide the switcher from settings.

### Space

```ts
interface Space {
  id: string;              // slug, immutable
  org_id: string;
  name: string;
  description?: string;
  created_at: number;
  archived_at?: number;
  icon?: string;
  color?: string;
  pinned_vapp_ids: string[];
  default_vapp_id?: string;
}
```

Space is the smallest routing unit. Every vApp fetch passes the active
space to the backend via `x-ema-space` header. Queries are scoped to that
space; a "show all spaces" toggle exists for specific surfaces (HQ, Review).

### Workstream (see [[14-WORKSTREAMS/WORKSTREAM-IDENTITY-DRAFT]])

```ts
interface Workstream {
  id: string;
  title: string;             // human label, editable
  intent_id?: string;        // anchor intent if one exists
  space_id: string;          // always belongs to a space
  session_id?: string;       // current active session
  started_at: number;
  last_active_at: number;
  status: 'active' | 'idle' | 'paused' | 'closed';
}
```

The workstream badge shows the currently-selected workstream and acts as
a quick-switcher. A workstream is the "thread of work" — the same concept
that unifies a CLI session, a renderer state, and a chronicle trace.

## Top bar regions — component by component

### Region 1 — OrgSwitcher

**Component:** `<OrgSwitcher />`
**Position:** far left
**Behavior:**

- Renders current org (icon + name).
- Click: opens dropdown listing all orgs the user belongs to, "+ New Organization" at bottom.
- Select: calls `PUT /api/session/active-org` then `setActiveOrg(id)` in Zustand; triggers refetch of spaces.
- Hidden when: `global.settings.hide_org_switcher === true` AND only one org exists.
- Keyboard: `Cmd+Shift+O` toggles dropdown.

**API:**
```
GET  /api/organizations           → Organization[]
POST /api/organizations           → Organization (create)
PUT  /api/organizations/:id       → Organization (update)
DELETE /api/organizations/:id     → archive (cannot delete 'personal')
PUT  /api/session/active-org      → { org_id }
```

**Headers sent on scoped requests:** `x-ema-org: <org_id>`

### Region 2 — SpaceSwitcher

**Component:** `<SpaceSwitcher />`
**Position:** immediately right of OrgSwitcher
**Behavior:**

- Renders current space (icon + name).
- Click: opens dropdown listing all non-archived spaces within the active org.
- Scoped to active org — switching org resets active space to that org's `default_space_id` or first space.
- "+ New Space" at bottom.
- Keyboard: `Cmd+1` through `Cmd+9` jumps to spaces 1-9 in the active org.

**API:**
```
GET  /api/spaces?org_id=X         → Space[]
POST /api/spaces                  → Space (create, requires org_id)
PUT  /api/spaces/:id              → Space (update)
PUT  /api/session/active-space    → { space_id }
POST /api/spaces/:id/archive      → Space (soft delete)
```

**Headers sent on scoped requests:** `x-ema-space: <space_id>`

### Region 3 — WorkstreamBadge (center)

**Component:** `<WorkstreamBadge />`
**Position:** center / flex-grow
**Behavior:**

- Shows current workstream: `#<title> (sess:<short-id>)`.
- Color: status-driven (active=green, idle=gray, paused=amber, closed=dim).
- Click: opens workstream picker — list of open workstreams in this space, + "New workstream" + "Close current".
- Right-click / long-press: opens workstream detail panel showing anchor intent, session id, created_at, last_active.
- Updates in real-time from `workstream.updated` WS events.

**API:**
```
GET  /api/workstreams?space_id=X&status=active → Workstream[]
POST /api/workstreams                          → Workstream (create)
PUT  /api/workstreams/:id                      → Workstream (update)
PUT  /api/session/active-workstream            → { workstream_id }
POST /api/workstreams/:id/close                → Workstream (archive)
```

**Headers sent:** `x-ema-workstream: <workstream_id>` (optional — some routes ignore it)

### Region 4 — DaemonStatus

**Component:** `<DaemonStatus />`
**Position:** right side, before MeMenu
**Behavior:**

- Pill with icon + color:
  - `connected` (green) — WS open AND last `/api/health` OK within 30s
  - `reconnecting` (amber, pulse) — WS closed, retry scheduled
  - `offline` (red) — retries exhausted OR `/api/health` unreachable
  - `degraded` (amber) — WS open but health returned partial (e.g., 1+ subsystem down)
- Click: opens Daemon Panel (modal or flyout) with:
  - Full health JSON
  - Subsystem status list
  - [Start] [Stop] [Restart] buttons (if daemon_mode=managed or attach)
  - Link to log stream
  - Last 10 WS events
- Subscribes to: socket state + `/api/health` every 15s + WS `daemon.*` events.

**See:** [[01-PLANS/2026-04-13-DAEMON-EXTRACTION-IMPL-NOTES]] §5 for how
this interacts with `EMA_MANAGED_RUNTIME` modes.

### Region 5 — MeMenu

**Component:** `<MeMenu />`
**Position:** far right
**Behavior:**

- Avatar + display name.
- Click: dropdown with:
  - Current actor (switch to different actor)
  - Settings (opens settings vApp)
  - About
  - Quit
- Keyboard: none by default — this is a mouse-target.

## Header propagation rule

**Every API request from the renderer** attaches:

```
x-ema-org:        <active_org_id>
x-ema-space:      <active_space_id>
x-ema-workstream: <active_workstream_id?>
```

Implementation: central `apiClient` reads from `useShellContext()` (Zustand
slice) and injects. Services validates + defaults. Routes that don't care
can ignore the headers. Routes that are scope-sensitive use them to filter
queries.

## State management

Single Zustand slice `shell-store`:

```ts
interface ShellState {
  active_org: Organization | null;
  active_space: Space | null;
  active_workstream: Workstream | null;
  daemon_status: 'connected' | 'reconnecting' | 'offline' | 'degraded';
  daemon_last_health: HealthResponse | null;
  
  setActiveOrg: (id: string) => Promise<void>;
  setActiveSpace: (id: string) => Promise<void>;
  setActiveWorkstream: (id: string) => Promise<void>;
}
```

Orgs/spaces/workstreams lists live in their own stores (`orgs-store`,
`spaces-store`, `workstreams-store`). The shell store only tracks
*active* selections.

## Persistence

Active selections persist via `PUT /api/session/*` endpoints. On daemon
restart, the session is recovered from the last known active selection in
the `user_state` table (already exists). If the recovered space/org no
longer exists, fall back to `personal` org + that org's default space.

## Migration

Current top bar has a hash-router + dock. Keep the dock. Add the top bar
above it as a new layout row.

Order:

1. Create `shared/schemas/organization.ts` + `space.ts` + `workstream.ts` (space schema already partial in `shared/schemas/`).
2. Backend: `services/core/organizations/` (untracked dir exists), `services/core/spaces/`, `services/core/workstreams/`.
3. Shell: `apps/renderer/src/components/shell/TopBar.tsx` assembles the 5 regions.
4. Wire header propagation in `apps/renderer/src/lib/api.ts`.
5. Update services route validators to accept + use the new headers where relevant.

## Open questions

- Should orgs be a v1.1 concept or deferred to v1.2? The user said "top
  bar with spaces and organizations needs work" — interpreting as v1.1.
  Minimum: ship with `personal` org hardcoded, UI hidden when only one
  org exists. Full multi-org gets deferred.
- Workstreams intersect with intents — one workstream per active intent?
  Or workstream is a session-level concept independent of intent? Defer
  to [[14-WORKSTREAMS/WORKSTREAM-IDENTITY-DRAFT]].
- Keyboard shortcuts for space switching (`Cmd+1..9`) conflict with some
  vApp-internal bindings. Resolve via settings (see
  [[05-WIKI/SETTINGS-OBJECT-SPEC]] Category 5).
- Color coding vs icons for org/space distinction — user preference. Ship
  both, let users pick in settings.
