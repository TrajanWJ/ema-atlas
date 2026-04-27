# Virtual Desktop — deep brief

> Sibling to `content/vapps/virtual-desktop.md`. The 300-500 word
> brief is the stance summary; this file is the next layer of
> pressure.

## Stance

The Virtual Desktop is a **shell surface** — the outermost frame in
the seven-layer stack (`ARCHITECTURE.md`, *Surfaces* row, "Top-level:
Launchpad · HQ · Virtual Desktop"). Per
`05-fresh-context-project-app-model.md` §"Main interface": "the
**virtual desktop** … accessible as an app in the native desktop app
environment or on the website, like original place.org". The
Virtual Desktop is the spatial metaphor that lets vApps, Launchpad,
and HQ coexist as windows in one inhabited place. It is the most
expensive surface to build well and the most easily reduced to
costume (per existing `content/vapps/virtual-desktop.md`).

The Virtual Desktop is the strongest expression of the **place.org**
lineage. `graph/nodes/codebase-place-org.qmd` (status
`doctrine-only`, contributes `[ux-metaphor, surface]`, key artifacts
including `code/place.org/app/(desktop)/layout.tsx`,
`code/place.org/app/(desktop)/page.tsx`) is the conceptual donor;
`graph/nodes/codebase-place-companion.qmd` ("Tauri (Rust) + minimal
HTML frontend … `src-tauri/src/ws_server.rs`") is the
native-desktop-companion donor. Per the place-companion node:
"Direct prior art for the 'native desktop app' surface mentioned in
`05-fresh-context-project-app-model.md`." Both inherit as doctrine
only — nothing from the place.org Next.js app or the place-companion
Tauri shell ships verbatim; what ships is the metaphor (apps as
windows, projects as places, presence as first-class) and the
shape of the native↔web split.

Under the canonical rule — *EMA owns truth. Hermes owns execution.
Surfaces do not own state.* — the Virtual Desktop is the surface
that hosts the most state and owns the least of it. Per existing
`content/vapps/virtual-desktop.md`: "The Virtual Desktop holds
layout, geometry, and presence projection — no domain truth.
Layouts are workspace artifacts owned by the workspace plane;
presence is a collab-plane projection. The desktop renders both and
emits typed surface events through narrow channels." Window
geometry, dock layout, wallpaper, and presence pills are all
*projections*, not authoritative state.

The Virtual Desktop is the primary site of two unresolved questions.
Q7 (`OPEN_QUESTIONS.md` — "surface stack for Launchpad/HQ") forces
the native-vs-web pick on this surface specifically because the
Virtual Desktop is where native feel matters most (drag, snap,
multi-window, presence cursors) and where web distribution matters
most (the place.org "open in browser, it's just a place" promise).
And `content/briefs/shells-surfaces.md` hard question 1 ("Whether HQ
or the Virtual Desktop is the *home* surface") and hard question 3
("How much place.org DNA should survive before the metaphor becomes
nostalgia") both come to ground here.

## Object model

Objects the Virtual Desktop renders (none owned canonically — all
references trace to plane owners):

- **Window** — a vApp or shell rendered inside a movable, resizable
  frame. The vApp inside is the state owner; the window itself is
  pure geometry. Lives on the **Workspace plane** as part of the
  layout artifact.
- **Layout artifact** —
  `workspace://desktop/layout.<project_id>.json` (per existing
  `virtual-desktop.md`: "It owns window geometry and dock layout as
  per-user workspace artifacts"). Lives on the **Workspace plane**.
  Versioned by the workspace, not by the surface.
- **Dock entry** — a launchable shortcut to a vApp or shell. Lives
  on the **Workspace plane** as part of the layout artifact;
  semantically equivalent to a Launchpad tile, scoped to the
  Desktop frame.
- **Wallpaper / scene** — per-Project / per-Space artifact (per
  existing `virtual-desktop.md`: "place.org DNA: the desktop is
  *somewhere*, not nowhere"). Lives on the **Workspace plane** as
  a versioned asset under `workspace://desktop/wallpaper/`.
- **Presence pill** — other-user / other-agent presence (cursors,
  window outlines) when in a shared Space. Ephemeral; lives on the
  **Collab plane** as a `ws_hub` subscription (per
  `research/parts/shells-surfaces.md`). Per existing
  `virtual-desktop.md`: "presence is a collab-plane projection".
- **Surface focus event** — emitted on Project / Space switch and
  on presence join / leave (per existing `virtual-desktop.md`:
  "Presence joins / leaves emit `SurfaceFocusEvent` so the
  Intelligence Layer scopes context correctly"). Lives on the
  **Control plane** as a typed event.
- **Native window handle** — when running in the native desktop
  shell (per `graph/nodes/codebase-place-companion.qmd`'s Tauri
  lineage), each Window has an OS-level handle that the surface
  must reconcile against the layout artifact. Ephemeral; lives in
  the native runtime (Tauri's `tauri.conf.json`-shaped registry).
  Web shell has no equivalent.
- **Drop target** — the desktop background as a typed drop zone:
  dropping a file spawns the Files vApp with the file as context
  (per existing `virtual-desktop.md` "Drop files / artifacts onto
  the desktop to spawn the right vApp"). Pure UI affordance; the
  spawn fires through the same `ema desktop window open` shape as
  any other launch.
- **Focus-mode toggle** — hides chrome for deep work (per existing
  `virtual-desktop.md`). Per-user UI state; persisted to the layout
  artifact under a `mode: "focus" | "normal"` field.

Objects the Virtual Desktop does *not* render: chat scrollback,
wiki bodies, blueprint canvases, dispatch streams, execution
lineage. Those belong to the vApps inside the windows. The Desktop
*frames* them; it never previews their contents.

## Three futures (deepening the universal stances)

### Operator Cathedral — *Disciplined Window Manager*

The Virtual Desktop is a precise window manager. Layouts are
strict, named, and snap-aligned. Wallpaper is austere. Presence
pills are typed and minimal — a name, a role, a cursor. Native and
web parity is governed: per the **Adapter protocol** doctrine
extracted from `graph/nodes/codebase-mission-control-claude.qmd`,
window operations go through one typed endpoint dispatching on
`{framework: "tauri" | "web", action, payload}`. The desktop is a
control surface, not a place.

- **Bet:** that the operator daily-driver wants window discipline
  more than ambient charm. A snap-aligned Cathedral beats a
  wandering room.
- **Tension:** the discipline costs the place.org soul. Per
  `content/briefs/shells-surfaces.md` hard question 3 ("How much
  place.org DNA should survive before the metaphor becomes
  nostalgia"), Cathedral leans hard toward "metaphor is nostalgia,
  ship the manager".
- **Question:** if the Desktop becomes a window manager, does
  Launchpad become superfluous? Per
  `content/briefs/shells-surfaces.md` ("Operator Shell
  Hierarchy"), Launchpad is the launcher and the Desktop is
  optional advanced mode — the inverse of this future.

### Living Workspace — *Inhabited Place*

The Virtual Desktop is *somewhere*. Wallpaper is a real scene per
project — code-project desktops feel different from client-project
desktops. Presence is felt: cursors, window outlines, the sound of
someone in the room. Layout is fluid and forgiving. The
**Cognitive Cockpit** stance shapes the chrome — calm, ambient,
glanceable. Per `content/briefs/shells-surfaces.md`'s "Virtual
Desktop as Center" future: "The product is unforgettable because it
is a place."

- **Bet:** that adoption depends on the Desktop feeling like home.
  Place beats console at the daily-driver layer; the place.org
  inheritance pays off.
- **Tension:** "place" tempts surface-side state (remember the
  room, remember the mood, remember the visitors). P3 violation
  surface area is high. Q1 matters: an agent's presence pill must
  be visibly distinguishable from a human's per the dual-auth
  doctrine extracted from `codebase-mission-control-claude.qmd`.
- **Question:** when the Desktop is the home (per
  `content/briefs/shells-surfaces.md` hard question 1), what does
  HQ become? A panel inside the Desktop, a window beside it, or a
  redundant surface? `content/vapps/hq.md` hints at the latter
  (HQ is "the 'what is happening' surface, distinct from
  Launchpad's 'what can I open'") — but the Desktop-as-center
  future absorbs both.

### Mesh Commonwealth — *Shared Spatial Substrate*

The Virtual Desktop spans peers. A Space's Desktop is shared
across all members regardless of node — invite a peer's agent
into your Desktop and their cursor is on your screen.
**Distributed AI Delegation** (`GLOSSARY.md` vault candidate) lets
a peer's agent open a window on your Desktop under a capability
lease. Wallpaper / scene becomes a public artifact for `Public`
Spaces. The native shell becomes one window into a federated
spatial substrate.

- **Bet:** that the Desktop is the most natural cross-peer
  collaboration surface because spatial co-presence is the most
  natural way to feel a peer's work.
- **Tension:** Q9 (replication boundary) is deferred per P6.
  Building peer-aware Desktop early violates P6. Q10 (permission
  map) decides whether a peer's agent can resize your window at
  all.
- **Question:** when a peer's window crashes on your Desktop,
  whose surface is degraded? Per `research/parts/shells-surfaces.md`
  host-truth-watcher test, "when `host_truth_watcher` reports
  `degraded: true`, every `ContextFor` response includes the
  warning field" — the Desktop must surface per-peer degradation
  visibly (a greyed-out window, a pill).

## What humans do here

1. **Open / close / move / resize / tile a vApp window.**
   Artifact: a write to the layout artifact. Control-plane
   record: none direct (low-stakes, high-frequency, per existing
   `virtual-desktop.md`: "Layout changes are workspace artifacts,
   not control-plane events"). Presupposes Q3 (project context for
   per-project layout).
2. **Save and restore a window layout per Project.** Artifact: a
   named layout variant under
   `workspace://desktop/layouts/<name>.json`. Control-plane record:
   none direct.
3. **Invite another user / agent into the desktop as
   co-presence.** Artifact: a presence subscription on the Space's
   `ws_hub` channel. Control-plane record: `SurfaceFocusEvent{
   member_id, surface: VirtualDesktop, space_id, action: "join"}`
   per existing `virtual-desktop.md`. Presupposes Q1 (so an
   agent's presence is typed) and Q3.
4. **Switch between Personal Desktop and Project Desktops.**
   Artifact: focus shift; the active layout artifact changes.
   Control-plane record: `SurfaceFocusEvent`. Presupposes Q3.
5. **Drop a file / artifact onto the desktop.** Artifact: the
   right vApp opens with the dropped item as context (per
   existing `virtual-desktop.md` "spawn the right vApp"). Control-
   plane record: a vApp-specific `ContextAttached` (per Chat's
   shape in `content/vapps/chat-deep.md`).
6. **Change wallpaper / scene.** Artifact: a versioned write to
   `workspace://desktop/wallpaper/<project_id>/<asset>` per
   existing `virtual-desktop.md` ("Wallpaper / scene changes are
   versioned workspace artifacts (the place itself has a
   history)"). Control-plane record: `WallpaperChanged{project_id,
   asset, by, at_ms}`.
7. **Toggle focus mode.** Artifact: a write to the layout
   artifact's `mode` field. Control-plane record: none direct.

## What agents do here via CLI

Parity with the human surface is required (`howto/add-a-vapp.md`).

1. **`ema desktop layout save --name --project`** (existing
   `virtual-desktop.md`). Same artifact as human #2. The
   **Handoff Envelope** (`GLOSSARY.md` vault candidate) applies if
   the layout is the closing act of an agent-to-agent handoff —
   the successor agent loads the same layout to inherit the
   workspace shape.
2. **`ema desktop layout load <name>`** (existing). Same as human
   #2 in load-direction. Read-only on the artifact; the load
   triggers per-window opens.
3. **`ema desktop window open --vapp --position --size`**
   (existing). Same as human #1 in open-direction. The
   **Adapter protocol** doctrine from
   `graph/nodes/codebase-mission-control-claude.qmd` is the
   reference shape for the underlying open call: one POST endpoint
   dispatching on `{framework: "tauri" | "web", action: "open",
   payload}` — so a native window and a web window go through the
   same path.
4. **`ema desktop presence join --space --as <agent-id>`**
   (existing). Same as human #3. Presupposes Q1 (agent identity
   first-class). The **Per-identity rate limits** doctrine
   applies: an agent that joins-leaves rapidly is rate-limited
   per identity, not per IP.
5. **`ema desktop wallpaper set --project --asset`** (existing).
   Same as human #6. The asset path resolves through the
   `Project.workspace_root` per `ARCHITECTURE.md`. Control-plane
   record: `WallpaperChanged`.
6. **`ema desktop focus --on | --off`** (extension). Same as
   human #7. Pure layout-artifact write.
7. **`ema desktop watch --project --space` (streaming)**
   (extension). Read-only subscriber to the Space's presence
   stream and layout stream via `ws_hub` (per
   `research/parts/shells-surfaces.md`). The
   **Background Results Contract** XML wrapper applies if the
   watcher consumes async sub-agent presence updates.
8. **`ema desktop window close <window_id>`** (extension).
   Symmetrical with `window open`. Pure layout-artifact write.

## Smallest provable v0.0.3 slice

**Scope:** per existing `virtual-desktop.md` — "**After v0.0.3.**
The Virtual Desktop is the most expensive surface to build well
and the most easily reduced to costume. It needs at least three
real vApps to feel inhabited rather than ornamental. The smallest
provable slice is a single-window 'desktop' that hosts Chat with a
wallpaper and a dock — basically a chrome around the v0.0.3 Chat
ship." This deep brief preserves that scope and pins the
v0.0.3-shaped *seed*: chrome around Chat, layout artifact, one
typed `SurfaceFocusEvent`, no presence yet.

**2-week acceptance criteria:**

1. A `Layout` typed record exists in the Gleam tree with `windows:
   List(Window)`, `dock: List(DockEntry)`, `wallpaper:
   Option(WallpaperRef)`, `mode: FocusMode`. The record serializes
   to / deserializes from the layout artifact JSON.
2. The Desktop reads
   `workspace://desktop/layout.<project_id>.json` from the
   workspace plane (per `ARCHITECTURE.md`'s
   `Project.workspace_root`) on render. Surface code contains no
   in-memory layout cache; refresh blows the view away and
   rehydrates from the workspace file (per
   `research/parts/shells-surfaces.md` "Surfaces hold no durable
   state" test).
3. One window hosts the Chat vApp's v0.0.3 slice (per
   `content/vapps/chat-deep.md`). The window frame is pure
   geometry; Chat owns its own state per the canonical rule.
4. A dock with one entry (Chat) launches the same window when
   clicked. Window position and size persist across refresh via
   the layout artifact.
5. A wallpaper artifact under `workspace://desktop/wallpaper/`
   renders behind the window. Changing the wallpaper via
   `ema desktop wallpaper set` emits `WallpaperChanged` to
   `event_log` and re-renders the desktop.
6. A `SurfaceFocusEvent{member_id, surface: VirtualDesktop,
   project_id}` fires on Project switch (per existing
   `virtual-desktop.md` and `launchpad.md`'s shared event shape).
7. Both shells boot: a web shell (mist + wisp per
   `research/parts/shells-surfaces.md`) and a native shell shaped
   like `graph/nodes/codebase-place-companion.qmd`'s Tauri
   companion (`src-tauri/src/ws_server.rs` is the prior-art
   reference). Both render the same layout artifact for the same
   user; one typed contract, two frames. Per
   `research/parts/shells-surfaces.md` `LayoutPrefs` round-trip
   test, member A's layout reads on member A's other device but
   not on member B's.

**Build-step dependencies:**

- `research/build-steps/01-control-plane-skeleton.md` — `event_log`,
  `command_bus`. Required for `SurfaceFocusEvent` and
  `WallpaperChanged`.
- `research/build-steps/02-identity-registry-skeleton.md` —
  `Member`/`Project`/`Space`. Required for per-user layout scope
  and for the eventual presence model.
- `research/build-steps/06-surfaces-skeleton.md` — mist + wisp
  HTTP/WS, `ws_hub`, `LayoutPrefs` round-trip,
  surface-rehydrate test. Required for the web shell renderer
  and the layout-artifact contract.

**Explicitly deferred:** Cognitive Cockpit ambient styling,
multi-cursor presence (Q1 + Q2 unresolved), peer-aware shared
desktop (Q9), drag-drop file spawn affordances, named layout
variants UI, focus-mode chrome polish, native shell beyond
"renders the same layout" (Tauri build, signing, distribution
all deferred).

## Decision pressure unique to this surface

1. **Native vs web (Q7) on Desktop specifically.** The Desktop is
   where native feel matters most (drag, snap, multi-window,
   presence cursors) and where web distribution matters most
   (place.org promise). Per `OPEN_QUESTIONS.md` Q7 and
   `content/briefs/shells-surfaces.md` decision pressure #2.
   Native-first costs distribution; web-first costs feel. Both
   shells per the v0.0.3 slice ship the same layout contract;
   the per-shell polish is where the divergence lives.
2. **Desktop-as-home vs HQ-as-home vs Launchpad-as-home.** Per
   `content/briefs/shells-surfaces.md` hard question 1. Desktop
   wins memorability (place.org DNA); HQ wins legibility
   (read-mostly, project pulse); Launchpad wins discoverability
   (grid + launch). The pick decides which surface is the user's
   first interaction on launch.
3. **Place.org DNA preserved vs metaphor as nostalgia.** Per
   `content/briefs/shells-surfaces.md` hard question 3.
   Preserved: wallpaper per project, scenes have history,
   presence is felt. Nostalgia: the metaphor is fond but the
   surface is just a window manager. The Cathedral and Living
   futures sit on opposite sides of this.
4. **Layout as workspace artifact vs control-plane event.**
   Existing `virtual-desktop.md` says workspace artifact ("Layout
   changes are workspace artifacts, not control-plane events
   (low-stakes, high-frequency)"). Control-plane would let layout
   be event-replayable but multiplies write rate by every drag.
   Workspace artifact matches `Launchpad`'s same call.
5. **Window per vApp vs window per session.** Per vApp: opening
   Chat once gives you one window; new sessions appear as tabs.
   Per session: each Chat session is its own window. Per-vApp
   matches the OS-window mental model; per-session matches "a
   conversation deserves its own room".
6. **Personal Desktop vs Project Desktop as default.** Personal:
   the user lands on their Personal Desktop and switches into
   projects. Project: the user lands on the active project's
   Desktop. Personal matches "my workspace"; Project matches
   "this project's workspace". Mirrors the Personal HQ vs Project
   HQ pressure on `hq-deep.md`.
7. **Native shell as Tauri (place-companion lineage) vs new
   stack.** Tauri inherits from
   `graph/nodes/codebase-place-companion.qmd` (status
   `doctrine-only`) and is doctrine, not code. A new native stack
   (Wails, Electron, raw OS) would be a re-pick. Tauri matches
   the lineage; a re-pick costs migration but might fit Gleam/BEAM
   FFI better.

## Cross-references

- `content/vapps/virtual-desktop.md` — the 300-500 word stance
  (sibling, do not modify)
- `content/vapps/launchpad.md` and (sibling) `launchpad-deep.md`
  — Launchpad is "what can I open"; the Desktop hosts the windows
  Launchpad opens
- `content/vapps/hq.md` and (sibling) `hq-deep.md` — HQ is
  "what is happening"; the Desktop frames HQ as one window or
  absorbs it (the Desktop-as-home future)
- `content/vapps/chat-deep.md` — Chat is the v0.0.3 vApp the
  Desktop chrome wraps
- `ARCHITECTURE.md` — seven-layer stack (Surfaces row, "Top-level:
  Launchpad · HQ · Virtual Desktop"), `Project.workspace_root`,
  identity sketch
- `DESIGN_PRINCIPLES.md` — P1 (authority before surface), P3
  (workspace state durable), P6 (local before distributed), P7
  (extract doctrine, not residue), P10 (org/space first-class)
- `howto/add-a-vapp.md` — pressure-check, CLI parity requirement
- `research/parts/shells-surfaces.md` — `mist`/`wisp` endpoint,
  `ws_hub`, `LayoutPrefs` round-trip test, "Surfaces hold no
  durable state" test, host-truth-watcher degraded-mode test
- `content/briefs/shells-surfaces.md` — three futures (especially
  "Virtual Desktop as Center"), hard question 1 (HQ vs Desktop
  as home), hard question 3 (place.org DNA), decision pressure
  #1 (HQ-as-home vs Desktop-as-home) and #2 (native vs web)
- `research/build-steps/01-control-plane-skeleton.md`
- `research/build-steps/02-identity-registry-skeleton.md`
- `research/build-steps/06-surfaces-skeleton.md`
- `graph/nodes/codebase-place-org.qmd` — UX-metaphor donor
  (status: `doctrine-only`, key artifacts under
  `code/place.org/app/(desktop)/`); the source of the Desktop
  metaphor
- `graph/nodes/codebase-place-companion.qmd` — native-desktop
  donor ("Tauri (Rust) + minimal HTML frontend …
  `src-tauri/src/ws_server.rs`"); direct prior art for the
  native shell
- `graph/nodes/codebase-mission-control-claude.qmd` — adapter
  protocol doctrine (one POST endpoint dispatching on
  `{framework, action, payload}`) used here for the
  native↔web window-open contract
- `graph/nodes/docs-host-system-launchpad-hq.qmd` — surface-side
  buildout plan (covers Desktop alongside Launchpad and HQ)
- `05-fresh-context-project-app-model.md` §"Main interface" — the
  source product framing ("the **virtual desktop** … accessible
  as an app in the native desktop app environment or on the
  website, like original place.org")
- `GLOSSARY.md` — Virtual Desktop, place.org / placeOS,
  Cognitive Cockpit, Personal AI, Intelligence Layer,
  Background Results Contract, Handoff Envelope, Distributed AI
  Delegation, MCP Gateway
- `OPEN_QUESTIONS.md` — Q1, Q2, Q3, Q7, Q9, Q10
