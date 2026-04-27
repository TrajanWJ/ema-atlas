# Launchpad — deep brief

> Sibling to `content/vapps/launchpad.md`. The 300-500 word brief is
> the stance summary; this file is the next layer of pressure.

## Stance

Launchpad is a **shell surface**, not a vApp proper. In the
seven-layer stack (`ARCHITECTURE.md`) it sits in the *Surfaces* row
labelled "Top-level: Launchpad · HQ · Virtual Desktop". The fresh
context note (`05-fresh-context-project-app-model.md` §"Launchpad")
defines it as "Windows 8 / start menu style launcher … frame
containing apps / vApps / useful info". It is the first thing a user
sees and the parent frame in which vApps render. Architecturally it
is a typed-projection composition layer over four planes —
control-plane recent activity, workspace pinned artifacts, collab
plane presence, runtime queue depth — collapsed into one tile grid.

Launchpad inherits the **place.org** lineage
(`graph/nodes/codebase-place-org.qmd`, status `doctrine-only`,
contributes `[ux-metaphor, surface]`, key artifacts under
`code/place.org/app/(desktop)/`). The lineage is *doctrine-only*:
nothing from place.org's Next.js implementation ships verbatim; what
ships is the metaphor — apps as tiles, projects as places,
useful-info as a first-class peer of launchable apps. Per
`graph/nodes/docs-host-system-launchpad-hq.qmd` ("Surface-side
planning for the Launchpad and HQ vApps"), the surface plan is in
`host/EMA-v1.1-Next-Steps/01-PLANS/2026-04-13-FRONTEND-BUILDOUT-PLAN.md`
and is itself flagged as gated on Q7 (surface stack:
native vs web).

Under the canonical rule — *EMA owns truth. Hermes owns execution.
Surfaces do not own state.* — Launchpad is the surface most likely to
violate the rule by accident. A launcher *wants* to remember which
tile you clicked, which project you opened last, which info pinned on
top. Per existing `content/vapps/launchpad.md`: "Tile registrations
live in a per-user workspace artifact
(`workspace://launchpad/layout.json`). No Launchpad code calls
`event_log.append/2`; it can only emit `SurfaceFocusEvent` through a
narrow typed channel." The discipline is that *layout is a workspace
artifact, not a Launchpad-private store*. P3 (`DESIGN_PRINCIPLES.md`)
applies: layout is durable, addressable, and lives in repo-/space-
owned storage.

Launchpad is also where the vault-candidate **Cognitive Cockpit**
stance (`GLOSSARY.md` — "treats the operator UI as an ambient
awareness layer (calm-technology) rather than a chat app with bots")
collides with the Win8 / Start-menu DNA from
`05-fresh-context-project-app-model.md`. The Win8 metaphor is grid +
launch + count badges; the Cockpit metaphor is calm + ambient +
glanceable. A Launchpad designed for one is hostile to the other —
this is the core decision pressure on the surface.

## Object model

Objects Launchpad renders (none owned canonically — all references
trace to plane owners):

- **Tile** — a launchable vApp slot. Per existing `launchpad.md`:
  "Tile registrations live in a per-user workspace artifact
  (`workspace://launchpad/layout.json`)". Lives on the
  **Workspace plane**. Has a typed `vApp` reference (Wiki, Chat,
  Threads, Agent vEnv, Blueprint, Code, Files, Images per the
  enumeration in `05-fresh-context-project-app-model.md` and
  `howto/add-a-vapp.md`).
- **Info tile** — a glanceable projection (today's calendar, queue
  depth, open-question count, current workstream). Lives on the
  **Workspace plane** as a layout entry; its rendered content is a
  read-only projection from the Control plane (event_log) or the
  Collab plane (open-question density per
  `research/parts/semantic-layer.md`).
- **Recent session tile** — a typed projection of the user's recent
  Hermes sessions filtered by `member_id`. Lives on the
  **Control plane** as `event_log` events
  (`SessionStart`, `Turn`); the tile is a derived view.
- **Recent workspace artifact tile** — a directory listing of the
  user's recent writes under `workspace/shared/` (P3,
  `DESIGN_PRINCIPLES.md`). Lives on the **Workspace plane**.
- **Project / Space switcher** — a UI affordance over the typed
  identity registry (`Project`, `Space` per `ARCHITECTURE.md`
  identity sketch). Lives on the **Control plane** (identity); the
  switcher writes a `SurfaceFocusEvent` per existing `launchpad.md`.
- **Notification badge** — count + reason payload per vApp. Lives
  on the **Control plane** as a typed projection over per-vApp
  unread/queued event streams. The badge resolves to a typed memory
  link (thread id, workstream id, queue item id) per existing
  `launchpad.md`.
- **Layout artifact** — `workspace://launchpad/layout.json` — the
  per-user, per-Project tile arrangement. Lives on the
  **Workspace plane**. Versioned by the workspace, not by the
  surface.
- **Surface focus event** — emitted by Launchpad on Project/Space
  switch (per existing `launchpad.md`). Lives on the
  **Control plane** as a typed event so the **Intelligence Layer**
  (vault candidate, `GLOSSARY.md`) can scope `context_for/2`
  correctly.

Objects Launchpad does *not* render: chat scrollback, wiki bodies,
blueprint canvases, dispatch streams, execution lineage. Launchpad
*launches* the vApp that owns each of those; it never previews them
beyond a counter or a one-line summary.

## Three futures (deepening the universal stances)

### Operator Cathedral — *Disciplined Mission Console*

Launchpad is a precise console. Tiles are typed, sized by category,
and ordered by a published policy (recency, project priority, badge
count). Info tiles render only typed projections — no embeds, no
iframes, no surface-side state caching. Notification badges are
governed: a vApp that wants to badge must register a typed
`NotificationSchema{vapp, kind, source_projection}`. Project/Space
switcher is explicit; no implicit "last project" memory.

- **Bet:** that legibility is the product. The user trusts EMA *because*
  the launcher refuses to render anything it cannot project from a
  typed source.
- **Tension:** the discipline produces a launcher that feels less like
  a place and more like a console. The place.org DNA fades to a grid
  of badges. Q7 (native vs web) becomes a question about which
  platform best supports typed projection rendering at speed.
- **Question:** when does projection rigor stop protecting the user
  and start performing for them? `content/briefs/shells-surfaces.md`
  hard question 3 ("How much place.org DNA should survive before the
  metaphor becomes nostalgia") generalizes here.

### Living Workspace — *Inhabited Launcher*

Launchpad is a calm room. Tiles breathe with project pulse.
Workstream cards rotate gently. The **Cognitive Cockpit** stance
shapes every pixel — ambient awareness, not interruption. Layout is
fluid; Brain Dump intake (`GLOSSARY.md` vault candidate) is a
first-class tile with one-shot capture into the appropriate Space.
Drag-drop on tiles spawns the right vApp with the dropped artifact
as context.

- **Bet:** that adoption depends on the launcher feeling like home.
  Calm beats console at the daily-driver layer.
- **Tension:** "calm" tempts surface-side state (remember my mood,
  remember my last gesture) and that lands directly on P1/P3.
  Layout as a workspace artifact is testable; "remembered context"
  is not.
- **Question:** if a Launchpad tile becomes interactive (one-line
  reply on a thread, quick task tick), does it become a vApp? The
  pressure check in `howto/add-a-vapp.md` ("does it own or render
  state — not both, not neither") says yes; the Cognitive Cockpit
  stance says the line is moot.

### Mesh Commonwealth — *Federated Launch Surface*

Launchpad spans peers. A tile can launch a vApp on this node, on a
daemon, or against a peer (`Peer(NodeId)` per `ARCHITECTURE.md`).
**Distributed AI Delegation** (`GLOSSARY.md` vault candidate) shows
a peer's queue depth on your launcher; **MCP Gateway** lets a peer's
agent launch a tile on your node under a capability lease. Project
switcher includes peer projects.

- **Bet:** that the launcher is the most natural place to surface
  cross-peer execution because launching is the moment the user
  picks placement.
- **Tension:** Q9 (replication boundary) is deliberately deferred
  per `DESIGN_PRINCIPLES.md` P6; peer-aware launch implies Q9 is
  partially answered. Q10 (permission map) decides whether a peer
  can render a notification badge on your launcher at all.
- **Question:** if a peer's tile crashes on your launcher, whose
  surface is degraded? `research/parts/shells-surfaces.md`
  host-truth-watcher test ("when `host_truth_watcher` reports
  `degraded: true`, every `ContextFor` response includes the
  warning field") generalizes to per-peer degradation.

## What humans do here

1. **Launch a vApp.** Artifact: a vApp window opens in the Virtual
   Desktop (per `content/vapps/virtual-desktop.md`). Control-plane
   record: `SurfaceFocusEvent{member_id, project_id, vapp,
   at_ms}` per existing `launchpad.md`. Presupposes Q3 (Project ↔
   Space cardinality decides the project context for the launched
   vApp).
2. **Switch Project / Space.** Artifact: the active scope for the
   user changes; subsequent vApp launches inherit the new scope.
   Control-plane record: `SurfaceFocusEvent{member_id, project_id,
   space_id, at_ms}`. Presupposes Q3 and Q1 (so an agent's
   surface-focus event is distinguishable from a human's).
3. **Pin / unpin an info tile.** Artifact: a write to
   `workspace://launchpad/layout.json` (per existing `launchpad.md`).
   Control-plane record: none direct (workspace artifact). The
   layout file is a workspace artifact under P3.
4. **Drag a file onto the Files tile.** Artifact: the Files vApp
   opens with the file as context. Control-plane record:
   `SurfaceFocusEvent` plus a Files-vApp-specific
   `ContextAttached`. Presupposes Files vApp exists.
5. **Promote Launchpad to active surface (vs Virtual Desktop).**
   Artifact: focus shift. Control-plane record:
   `SurfaceFocusEvent{member_id, surface: Launchpad}`. Cheap; pure
   focus state. Presupposes Q7 (so the surface-stack semantics for
   "active surface" are decided).
6. **Review notification badges.** Artifact: a click resolves to a
   typed memory link (thread id, workstream id, queue item id, per
   existing `launchpad.md`). Control-plane record: none for the
   review itself; the badge clear is a per-vApp event.
7. **Customize layout per Project.** Artifact: a per-Project layout
   variant under `workspace://launchpad/layout.<project_id>.json`.
   Control-plane record: none direct.

## What agents do here via CLI

Parity with the human surface is required (`howto/add-a-vapp.md`
verification: "every action a human can take in the UI has a CLI
path documented").

1. **`ema launchpad register-vapp --name --entrypoint`** (existing
   `launchpad.md`). Registers a vApp tile in the user's layout
   artifact. The **Adapter protocol over direct lifecycle calls**
   doctrine extracted from `codebase-mission-control-claude` (per
   `graph/nodes/codebase-mission-control-claude.qmd` —
   `register → heartbeat → assignments → progress` is one POST
   endpoint dispatching on `{framework, action, payload}`) is the
   reference shape for vApp registration.
2. **`ema launchpad tile add --kind --source`** (existing). Adds a
   custom info tile sourced from a typed projection. The
   **Background Results Contract** (`GLOSSARY.md` vault candidate)
   applies if the tile renders an async sub-agent's outcome — the
   tile body is the XML wrapper rendered as JSON.
3. **`ema launchpad notify --vapp --count --reason`** (existing).
   Writes a typed notification record consumed by the badge
   projection. **Per-identity rate limits** (doctrine extracted from
   `codebase-mission-control-claude`) apply: a noisy agent cannot
   starve other agents' badges.
4. **`ema launchpad activity --tail`** (existing). Read-only
   subscriber to the user's combined activity stream via `ws_hub`
   (per `research/parts/shells-surfaces.md`). No artifact, no
   control-plane record. The **Scope Advisor** (vault candidate)
   may pre-filter the tail by Honcho-modeled context.
5. **`ema launchpad focus --project --space`** (extension). Emits
   a `SurfaceFocusEvent` on the agent's behalf. Presupposes Q1
   (so the focus event has typed agent attribution).
6. **`ema launchpad layout save --as <name>`** (extension). Writes
   a named layout variant under `workspace://launchpad/`. The
   **Handoff Envelope** (vault candidate) applies if the layout is
   handed off to a successor agent on the same vApp.
7. **`ema launchpad open <vapp> --project --as <agent_id>`**
   (extension). Programmatic launch of a vApp into the Virtual
   Desktop on behalf of the agent. Presupposes Q1 and the Virtual
   Desktop vApp exists.

## Smallest provable v0.0.3 slice

**Scope:** per existing `launchpad.md` — "**After v0.0.3 — but
cheaply.** Launchpad's value is composition: it needs at least two
real vApps to be more than a static page. Ship Chat in v0.0.3, then
add a 3-tile Launchpad shell (Chat, Threads-stub, Files-stub)
immediately after." The v0.0.3-shaped slice is the minimal frame:
one project switcher, three tiles (Chat real, two stubs), one
typed `SurfaceFocusEvent`.

**2-week acceptance criteria:**

1. A `SurfaceFocusEvent` `EventBody` variant exists in the Gleam
   tree alongside the other control-plane events from
   `research/build-steps/01-control-plane-skeleton.md`.
2. Launchpad reads `workspace://launchpad/layout.json` from the
   workspace plane (per `ARCHITECTURE.md`'s
   `Project.workspace_root`) on every render. Surface code
   contains no in-memory layout cache; refresh blows the view away
   and rehydrates from the workspace file (per
   `research/parts/shells-surfaces.md` "Surfaces hold no durable
   state" test).
3. The Project switcher reads the user's projects from the
   identity registry (`research/build-steps/02-identity-registry-skeleton.md`)
   and emits a `SurfaceFocusEvent` on switch.
4. One real vApp tile (Chat from
   `content/vapps/chat-deep.md` v0.0.3 slice) launches into the
   active surface frame; two stub tiles (Threads, Files) render as
   "coming soon" placeholders that still register through the
   `ema launchpad register-vapp` CLI per existing `launchpad.md`.
5. One info tile (queue depth) renders a typed projection over
   `event_log` — the count is computed via
   `research/build-steps/01-control-plane-skeleton.md`'s `replay`
   filtered by `kind = QueueItem`.
6. Layout-prefs round-trip test (reused from
   `research/parts/shells-surfaces.md` test list): a layout saved
   by Launchpad on member A's device is readable on member A's
   other device, and *not* by member B.
7. Endpoint-last test (per `research/parts/shells-surfaces.md`):
   the supervisor child list places `http/supervisor` after
   `surfaces/supervisor` — Launchpad is mounted on the same
   endpoint and inherits the boot order.

**Build-step dependencies:**

- `research/build-steps/01-control-plane-skeleton.md` — `event_log`,
  `command_bus`. Required for `SurfaceFocusEvent` and the queue-
  depth projection.
- `research/build-steps/02-identity-registry-skeleton.md` —
  `Member`/`Project`/`Space`, `context_for(project, actor)`.
  Required for the project switcher and the per-user layout scope.
- `research/build-steps/06-surfaces-skeleton.md` — mist + wisp
  HTTP/WS, `ws_hub`, layout-prefs round-trip. Required for the
  shell renderer and the live activity tail.

**Explicitly deferred:** Cognitive Cockpit ambient styling,
Distributed AI Delegation tiles, peer-aware project switcher (Q9),
drag-drop spawn affordances, custom info tile schema registry,
Intelligence Layer pre-routing on focus events.

## Decision pressure unique to this surface

1. **Win8 grid metaphor vs Cognitive Cockpit ambient stance.** Per
   `05-fresh-context-project-app-model.md` ("Windows 8 / start menu
   style launcher") and `GLOSSARY.md` Cognitive Cockpit. Grid wins
   discoverability; ambient wins daily-driver calm. The two stances
   force different visual systems and different notification
   philosophies.
2. **Tile registration as workspace artifact vs control-plane
   record.** Existing `launchpad.md` says workspace artifact
   (`workspace://launchpad/layout.json`). Control-plane would let
   the layout be event-replayable but multiplies the event-log
   write rate by every drag.
3. **Project switcher as Launchpad concern vs Virtual Desktop
   concern.** Launchpad: switching is part of "what can I open".
   Desktop: switching is part of "where am I". Per
   `content/briefs/shells-surfaces.md` hard question 1
   ("Whether HQ or the Virtual Desktop is the *home* surface") and
   existing `content/vapps/hq.md` ("HQ is the 'what is happening'
   surface, distinct from Launchpad's 'what can I open'"), the
   Launchpad-vs-Desktop seam is contested.
4. **Notification badges as polled vs pushed.** Polled: each badge
   re-renders on a tick. Pushed: the badge subscribes to a typed
   projection via `ws_hub` (per `research/parts/shells-surfaces.md`).
   Pushed is faster but multiplies subscription count by tile count.
5. **Per-Project layout vs per-user-global layout.** Per-Project
   matches how `Project.workspace_root` resolves
   (`ARCHITECTURE.md`); per-user-global matches "Launchpad is my
   launcher across all projects". Mixing both forces a layout-merge
   policy.
6. **vApp inventory as static enum vs dynamic registry.** Static:
   the eight vApps in `05-fresh-context-project-app-model.md` are
   compiled-in. Dynamic: `ema launchpad register-vapp` (per
   existing `launchpad.md`) registers arbitrary vApps at runtime,
   following the **Adapter protocol** doctrine from
   `graph/nodes/codebase-mission-control-claude.qmd`. Dynamic is
   more flexible; static is easier to reason about.
7. **Native vs web (Q7) parity for Launchpad specifically.**
   Launchpad has the heaviest grid + drag-drop UI in the surface
   stack; native (Tauri, per `graph/nodes/codebase-place-companion.qmd`)
   wins feel; web (Next.js, per `graph/nodes/codebase-place-org.qmd`)
   wins distribution. `OPEN_QUESTIONS.md` Q7 is unresolved
   precisely on this surface.

## Cross-references

- `content/vapps/launchpad.md` — the 300-500 word stance (sibling,
  do not modify)
- `content/vapps/hq.md` and (forthcoming) `hq-deep.md` —
  Launchpad is "what can I open"; HQ is "what is happening". Read
  both for the seam.
- `content/vapps/virtual-desktop.md` and (forthcoming)
  `virtual-desktop-deep.md` — Launchpad and the Virtual Desktop
  share the place.org lineage; Launchpad is one surface inside (or
  beside) the Desktop frame.
- `ARCHITECTURE.md` — seven-layer stack (Surfaces row, "Top-level:
  Launchpad · HQ · Virtual Desktop"), `Project.workspace_root`,
  identity sketch
- `DESIGN_PRINCIPLES.md` — P1 (authority before surface), P3
  (workspace state durable), P6 (local before distributed), P7
  (extract doctrine, not residue), P10 (org/space first-class)
- `howto/add-a-vapp.md` — pressure-check, CLI parity requirement
- `research/parts/shells-surfaces.md` — `mist`/`wisp` endpoint,
  `ws_hub`, `LayoutPrefs` round-trip test, "Surfaces hold no
  durable state" test, endpoint-last assertion
- `content/briefs/shells-surfaces.md` — three futures expanded,
  decision pressure, hard questions 1/2/3
- `research/build-steps/01-control-plane-skeleton.md`
- `research/build-steps/02-identity-registry-skeleton.md`
- `research/build-steps/06-surfaces-skeleton.md`
- `graph/nodes/codebase-place-org.qmd` — donor of the launcher
  metaphor (status: `doctrine-only`, contributes
  `[ux-metaphor, surface]`)
- `graph/nodes/codebase-place-companion.qmd` — donor of the native
  desktop frame
- `graph/nodes/codebase-mission-control-claude.qmd` — doctrine
  extracts: hierarchical capability roles + dual auth, adapter
  protocol over direct lifecycle calls, per-identity rate limits
- `graph/nodes/docs-host-system-launchpad-hq.qmd` — surface-side
  buildout plan
- `05-fresh-context-project-app-model.md` §"Launchpad" — the source
  product framing
- `GLOSSARY.md` — Launchpad, Cognitive Cockpit, Brain Dump,
  Intelligence Layer, Background Results Contract, Scope Advisor,
  Distributed AI Delegation, MCP Gateway, Auto-Resolve Gate,
  Handoff Envelope
- `OPEN_QUESTIONS.md` — Q1, Q3, Q6, Q7, Q9, Q10
