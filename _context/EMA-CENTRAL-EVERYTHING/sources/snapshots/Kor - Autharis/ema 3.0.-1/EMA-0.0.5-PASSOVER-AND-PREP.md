# EMA 0.0.5 Passover And Prep

Status: active working prep for the next EMA codebase
Date: 2026-04-24
Scope: `/Users/tawj/Desktop/Kor - Autharis/ema 3.0.-1`

This file is the current handoff anchor for `EMA-0.0.5--4-24`.

Use this before trusting older local docs. Some older donor docs still assume
`Project -> Space`. The newer working direction in this thread is
`Organization -> Space -> Project`, and that change is intentional.

## 1. Current source-of-truth direction

### Product posture

- EMA is a shared human-agent workspace.
- EMA owns truth.
- Hermes owns execution.
- Surfaces do not own state.
- Native-first is the current default posture.
- Browser parity still matters and should share the same shell APIs.

### 0.0.5 target posture

- New repo name: `EMA-0.0.5--4-24`
- Build style: daemon-first, sync-aware, native-first
- Backend: Gleam/BEAM first
- Desktop shell: Tauri
- Surface layer: shared UI for desktop and web
- Visible vApp count at start: one
- First vApp: `Blueprint`

### Day-one visible product shape

- Full organization interfaces
- Full space interfaces
- Full project interfaces
- Full settings area
- Full invite system
- Device and node visibility
- Project and space switching in the top bar
- Workspace shell with desktop center

## 2. Key decisions locked so far

### 2.1 Topology

The active design direction is:

```text
Organization
  -> Spaces
    -> Projects
```

This is preferred over `Project -> Space` for the current product vision.

Why this is better for 0.0.5:

- spaces feel like the actual collaboration environment
- projects feel like scoped efforts inside that environment
- org-level invites, membership, and device trust read more naturally
- one space can host multiple related projects without pretending they are the
  same thing
- HQ for a space becomes more legible as a real shared dashboard

Implication:

- older local donor docs that treat project as the immediate container of space
  are still useful for object design, but their containment model is no longer
  the local winner

### 2.2 Shell behavior

- The shell should be workspace-first with a desktop center.
- The top bar should contain:
  - a space selector on the far right
  - a project selector immediately to its left
- The project selector should show projects in the currently selected space.

### 2.3 Blueprint vApp

- `Blueprint` is the only vApp at first.
- It should be a semantic design-document workspace.
- It should start as:
  - one primary project-level canonical blueprint doc
  - supporting child docs and appendices
  - comments
  - change suggestions
  - proposal extraction / promotion bridge
- It should help build the EMA master design docs first.
- It should not quietly become a second hidden authority system.

### 2.4 Settings and org functionality

The first version should include operational settings from day one:

- profile
- organization settings
- members
- invites
- spaces
- projects
- roles
- devices / nodes
- runtime / provider settings
- appearance
- activity / operational state

### 2.5 Trust and identity

- No centralized account server should be treated as authority.
- Human identity should be based on a cryptographic user identity.
- Devices should be paired to that human identity.
- Email should be delivery only, not truth.
- Device grants should be explicit.
- Remote shells, SSH-like access, and cross-computer actions should be
  capability-gated per device and per role.

### 2.6 Time and lineage metadata

Every important write should carry:

- unix time
- logical clock / monotonic sequence
- originating peer id

Scaffold for richer distributed conflict metadata later, but do not pretend the
first version solves fully egalitarian multi-writer truth.

## 3. Revised architecture stance for 0.0.5

### 3.1 Recommended bounded contexts

The earlier `ema 0.0.3` bounded-context split still looks strong, with the
containment model adjusted to match `Org -> Space -> Project`.

Recommended first subsystem families:

- `ema_identity`
  - users
  - actors
  - devices
  - memberships
  - role assignments
  - cryptographic identity bindings
- `ema_orgs`
  - organizations
  - org settings
  - invite flows
  - member registry
  - trust defaults
- `ema_spaces`
  - spaces
  - space membership
  - space shell state
  - shared dashboards
  - default project routing
- `ema_projects`
  - projects
  - project settings
  - datasets
  - project-specific blueprint root
  - app bindings
- `ema_coordination`
  - lanes
  - lane claims
  - handoffs
  - queue items
  - responsibilities
  - weekly phases
  - checkups
- `ema_knowledge`
  - wiki documents
  - blueprint nodes
  - comments
  - references
  - semantic metadata
- `ema_exec_control`
  - proposals
  - plans
  - specs
  - runs / executions
  - approvals
  - outcomes
- `ema_harness`
  - Hermes bridge
  - drivers
  - session bindings
  - runtime adapters
- `ema_replication`
  - peers
  - sync cursors
  - replica state
  - authority leases
  - failover / provisional-write lineage
- `ema_shell`
  - Launchpad
  - HQ
  - Virtual Desktop
  - app layouts
  - shell bindings

### 3.2 Recommended monorepo shape

```text
EMA-0.0.5--4-24/
  apps/
    daemon/
    desktop/
    web/
  packages/
    contracts/
    surface-core/
    design-system/
  docs/
    design/
    research/
    donor-notes/
```

### 3.3 Storage

Current best first-storage stance:

- SQLite-backed canonical store first
- append-oriented control-plane/event lineage
- durable object tables plus event streams where needed

Why:

- portable
- desktop-friendly
- home-node-friendly
- easier to ship locally first
- compatible with later replication journals

## 4. P2P and sync stance

### 4.1 What is actually wanted

The target is not fake "cloud sync".

The target is:

- peer-aware EMA nodes
- at least one always-on host node per organization long term
- current-state propagation between online peers
- usable behavior away from home
- explicit visibility when the system is current, stale, provisional, or
  degraded

### 4.2 Recommended first truth model

For 0.0.5, the most realistic authority model is:

```text
Organization
  -> one preferred home authority node
  -> one or more online replicas / trusted peers
  -> explicit lease / currentness model
```

Important nuance:

- The home node remains the preferred canonical home.
- Another peer may accept writes only if it is provably current enough and the
  lineage records where the write landed.
- For those writes to survive and propagate back, at least one current node must
  stay online until the home node can catch up.
- UI must clearly show:
  - connected to home
  - connected to current replica
  - provisional authority
  - stale replica
  - local draft only

This matches the user's stated desire more closely than either:

- pure local drafts only
- or "all peers are equal writers now"

### 4.3 Collaboration plane stance

Current strongest direction:

- structural truth should remain EMA-owned
- rich collaborative editing likely needs an adjacent collab subsystem
- do not merge all collaboration into the control-plane event log
- do not let the collab layer quietly become truth

Promising practical route:

- daemon-owned structure, lineage, attribution, and promotion
- adjacent rich-text/object collaboration transport for Blueprint/wiki editing
- persisted back into EMA-owned object versions and audit trails

## 5. Blueprint vApp pressure-check

The atlas `add-a-vapp` playbook remains correct and should govern Blueprint.

Blueprint must answer:

1. What objects does it own or render?
2. What truths does it expose?
3. What actions can humans take?
4. What actions can agents take?
5. What chronicle / review / memory links exist?
6. What runtime / workstream / project context can it show?
7. How does it avoid being decorative?

Current intended answer shape:

- renders project-scoped semantic blueprint docs
- bridges selected content into proposals / plans / specs
- keeps comments, edits, and structure visible and attributable
- feeds EMA design-doc construction first

## 6. High-signal donor docs to mine again

### In this workspace

- `/Users/tawj/Desktop/Kor - Autharis/ema 3.0.-1/lane3-domain-model-and-system-design.md`
- `/Users/tawj/Desktop/Kor - Autharis/ema 3.0.-1/EMA_CORPUS_NAVIGATION.md`

### EMA 0.0.3 synthesis docs

- `/Users/tawj/Desktop/ema 0.0.3/ema-003-lineage-architecture-synthesis.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-003-gleam-beam-bounded-contexts.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-003-shared-agent-swarm-workspace.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-003-implementation-slices.md`

### Atlas app pages and graph nodes

- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/app/collab-plane-options/page.tsx`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/app/blueprint/page.tsx`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/app/open-questions-map/page.tsx`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/nodes/docs-host-system-launchpad-hq.qmd`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/graph/nodes/docs-place-org-era-research.qmd`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/howto/add-a-vapp.md`

### Autharis donor material

- `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`
- `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/dispatch/`

## 7. Current framework and library groundwork

### Local/BEAM side

Strong candidates for 0.0.5 prep:

- Gleam OTP actor system
- Wisp / Mist for HTTP and websocket edges
- sqlight for SQLite access

### Desktop side

- Tauri v2
- capability-based window/webview permissions
- sidecar-compatible packaging if needed

### Collaboration research

- Yjs remains a strong practical candidate for rich multi-writer text/object
  sync
- Automerge remains compelling for offline-first document convergence, but it
  risks creating a second history source if used carelessly

### Distributed BEAM notes

Important implementation pressure from official Erlang docs:

- bare distributed Erlang over the public internet is not good enough by
  default
- cookie-based trust alone should not be treated as sufficient security
- TLS distribution should be assumed if nodes communicate over untrusted
  networks
- node discovery and clustering do not solve product-level authority semantics

Practical interpretation for EMA:

- use BEAM distribution carefully
- separate:
  - transport connectivity
  - cluster/node discovery
  - EMA truth authority
  - device/user trust
- if `libcluster` is used, treat it as node discovery / connection help, not
  the core source of truth for EMA replication semantics

## 8. Visual and shell doctrine to preserve

### 8.1 From the place-era design spec

The strongest reusable cues from the place-era spec are not "copy place.org".
They are:

- calm deep-blue atmosphere
- frosted glass surface treatment
- living but slow ambient motion
- desktop as environment, not gimmick
- native feeling transitions between structured shell and immersive workspace
- top ambient/status bar as a real context surface

Useful extracted visual rules:

- deep blue-black base
- cool transparent glass panels
- quiet borders that materialize on hover
- soft glow instead of loud neon
- time-aware background shifts
- restrained motion with slow breathing rather than constant twitching

### 8.2 From the older frontend buildout plan

The old buildout plan contributes a very important rule:

- legibility before flourish

The first shell should tell the truth clearly about:

- current org / space / project
- current node and sync state
- errors
- feature readiness
- what is wired versus placeholder

This means 0.0.5 should preserve:

- scoped switching in the top bar
- daemon/node health visibility
- explicit "not wired yet" states instead of ghost features
- structured settings early
- command/launch affordances without pretending unfinished apps are live

## 9. Major deltas from older local doctrine

These older assumptions are no longer safe to auto-trust:

- `Project -> Space` as the primary containment model
- "space lives inside project by default" as the local winner
- replication only after shell work
- shell minimalism before org/space/project/settings interfaces

These still remain useful:

- EMA truth doctrine
- Hermes boundary
- run/session separation
- actor modeling
- lane/handoff/checkup objects
- shell hierarchy and surface posture

## 10. Open design questions still worth answering before implementation

1. Exact `Organization -> Space -> Project` cardinality rules
   - Can a project belong to exactly one space?
   - Can projects move between spaces?
   - Can a personal workspace contain spaces of its own?

2. Peer-authority semantics
   - What exactly qualifies a replica as current enough to accept writes?
   - What is the rejoin / catch-up rule when the home node returns?
   - What state is allowed to be provisional?

3. Identity recovery
   - Is root identity recovered by keyring only, or by seed phrase as well?
   - How are paired devices added and revoked?

4. Blueprint object model
   - Section types
   - proposal extraction flow
   - comment model
   - semantic references
   - supporting-doc linkage

5. Settings information architecture
   - exact tabs and scope split between org, space, project, user, and device

## 11. Concrete working assumptions for 0.0.5

These are the current best assumptions unless explicitly replaced.

### 10.1 Org / space / project cardinality

- an organization owns many spaces
- a space owns many projects
- a project belongs to exactly one space
- a project may later be moved between spaces, but that should be an explicit
  controlled action with lineage
- space is the main shared environment
- project is the scoped effort, object cluster, and blueprint home

### 10.2 Personal workspace model

- every user gets a personal root environment by default
- the cleanest first implementation is likely:
  - one personal organization
  - one default personal space
  - zero or more personal projects inside that space
- org invite flow should coexist with personal workspace from the beginning

### 10.3 Invite model

Day-one invite support should include:

- org invites
- space invites
- project invites
- email delivery
- invite links
- pending invite state
- acceptance flow tied to cryptographic identity and paired device flow

### 10.4 Shell information architecture

Recommended first shell tree:

```text
Workspace Shell
  Topbar
    current organization
    current project selector
    current space selector
    current node / sync state
    account / device menu

  Left rail
    Blueprint
    Organization
    Space
    Project
    Members
    Invites
    Devices / Nodes
    Data Mounts
    Activity
    Settings

  Main area
    structured page shell by default
    virtual desktop center when the route calls for it
```

Recommended route posture:

- `Blueprint` is the only real vApp
- admin/management surfaces are still first-class product areas
- the desktop metaphor should deepen the center of the shell, not swallow the
  whole app too early

### 10.5 First settings split

- user settings
  - profile
  - appearance
  - paired devices
  - personal identity
- organization settings
  - overview
  - members
  - roles
  - invites
  - nodes
  - trust
- space settings
  - overview
  - members
  - projects
  - visibility
  - sync/currentness
- project settings
  - overview
  - blueprint root
  - datasets
  - data mounts
  - agent/runtime settings
  - permissions

### 10.6 Authority/currentness states the UI should show

The UI should avoid vague "online/offline" language and show more exact states.

Recommended first states:

- `home_current`
  - connected to the preferred authority node
- `replica_current`
  - connected to a replica that is current enough to serve as live truth
- `replica_provisional`
  - current enough to accept temporary writes, but not the preferred home
- `replica_stale`
  - online, but known not to hold the latest truth
- `local_draft`
  - local-only work not yet promoted into shared current state
- `offline_readonly`
  - browsing replicated state only

These states should be visible in:

- top bar
- device/node settings
- space/project operational surfaces
- relevant write flows

### 10.7 First canonical object families

Minimum object families worth naming before implementation:

- `organization`
- `space`
- `project`
- `actor`
- `membership`
- `device`
- `peer`
- `invite`
- `blueprint_document`
- `blueprint_section`
- `comment`
- `proposal`
- `plan`
- `spec`
- `execution`
- `approval`
- `dataset`
- `data_mount`
- `lane`
- `handoff`

## 12. Recommended next practical moves

When beginning implementation, do this in order:

1. Create `EMA-0.0.5--4-24/` monorepo skeleton
2. Write local doctrine docs into that repo immediately:
   - architecture overview
   - topology decision
   - peer authority model
   - Blueprint vApp spec
3. Scaffold `apps/daemon` with bounded contexts and opaque IDs first
4. Scaffold `apps/desktop` and `apps/web` with the same shell contracts
5. Build the top shell and settings surfaces before deep Blueprint UI polish
6. Implement peer/node/currentness visibility early so sync posture is visible
7. Keep Blueprint as the first deep vApp

## 13. Second layered research wave — implementation pressure

This section captures a deeper research pass focused on best practices,
pressure points, and what still deserves questioning before implementation.

### Layer 1 — State-plane doctrine

High-signal source:

- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/app/state-planes/page.tsx`

Strong takeaways:

- EMA should keep four planes legible:
  - control
  - runtime
  - collaboration
  - workspace
- every plane should have one owner
- surfaces should render multiple planes but own none
- control-plane truth must stay append-oriented
- runtime should stay ephemeral
- collaboration should not be collapsed into either chat transcripts or
  surface-local caches
- workspace should remain grep-friendly and agent-friendly where plain-text
  shared artifacts still make sense

Best-practice implication:

- 0.0.5 should name plane ownership early in code and docs
- shell features should never create hidden stores of truth
- if a feature needs local cache, its cache should be visibly derivative

Further investigation:

- exactly which Blueprint edits become canonical control-plane actions
- how much of the older "workspace/shared/" file-plane should survive once
  Blueprint/wiki become richer

### Layer 2 — Control-plane event contract

High-signal source:

- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/app/event-kinds/page.tsx`

Strong takeaways:

- event kinds should be a versioned contract
- drivers and surfaces may emit existing kinds, but should not invent kinds
  ad hoc
- handoff, proposal, incident, execution, session, and wiki event families all
  matter independently

Best-practice implication:

- 0.0.5 should define a small event catalog early
- event families should be stable and reviewed, not casually grown inside UI
  code
- the daemon should reject unknown event kinds rather than silently accepting
  arbitrary names

Further investigation:

- first minimal event catalog for 0.0.5
- event versioning strategy
- whether Blueprint promotion uses `proposal.*` directly or an intermediate
  draft event family

### Layer 3 — Swarm coordination rigor

High-signal sources:

- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/continuous-progress-protocol.md`
- `/Users/tawj/Desktop/ema 0.0.3/ema-atlas/content/swarm/object-model.md`
- `/Users/tawj/Desktop/Kor - Autharis/autharis/_shared/lanes.md`

Strong takeaways:

- one lane, one visible owner, one next step
- claims should be explicit, fresh, and scoped
- handoffs should be real objects, not just messages
- protected zones matter
- workstream, lane, queue item, handoff, responsibility, cadence, and checkup
  remain the right object family

Best-practice implication:

- 0.0.5 should make coordination objects first-class early
- even before rich agent UI, backend schema and API should already understand:
  - lane
  - lane claim
  - handoff
  - queue item
  - checkup
- human and agent work should become legible through those objects, not through
  hidden side notes

Further investigation:

- whether a lane belongs to a project only, or to both space and project
- whether project-level Blueprint sections can emit lane seeds directly
- how far to carry Autharis-style protected scope discipline into EMA UI

### Layer 4 — Shell and top-bar honesty

High-signal sources:

- `origin/docs-host-system-launchpad-hq:host/EMA-v1.1-Next-Steps/05-WIKI/TOP-BAR-SPACES-ORGS-SPEC.md`
- `origin/docs-host-system-launchpad-hq:host/EMA-v1.1-Next-Steps/01-PLANS/2026-04-13-FRONTEND-BUILDOUT-PLAN.md`
- `origin/docs-place-org-era-research:host/place.org-openclaw/docs/superpowers/specs/2026-03-20-place-org-design.md`

Strong takeaways:

- shell legibility comes before shell spectacle
- top-level switching must be explicit
- daemon/currentness state should be visible, not implied
- the place-era shell was strongest when it felt like an environment, not when
  it tried to be clever
- calm atmosphere and spatiality matter, but honesty matters more

Best-practice implication:

- 0.0.5 should ship honest shell chrome before decorative richness
- top bar should clearly show:
  - organization
  - space
  - project
  - current node/sync state
  - current actor or device menu
- unfinished areas should be visibly unfinished rather than "fake working"

Further investigation:

- whether project selector should appear only when a space has projects, or
  always remain visible
- whether HQ is space-home and Blueprint is project-home, or whether both need
  dual scoping

### Layer 5 — Framework and runtime best practices

High-signal sources:

- `https://hexdocs.pm/gleam_otp/gleam/otp/actor.html`
- `https://hexdocs.pm/gleam_otp/`
- `https://hexdocs.pm/sqlight/index.html`
- `https://docs.yjs.dev/`
- `https://docs.yjs.dev/tutorials/persisting-the-document-to-a-central-database`
- `https://hexdocs.pm/libcluster/readme.html`
- `https://hexdocs.pm/phoenix_pubsub/Phoenix.PubSub.html`
- `https://www.erlang.org/doc/apps/ssl/ssl_distribution.html`
- `https://www.sqlite.org/wal.html`
- `https://v2.tauri.app/reference/acl/capability/`
- `https://v2.tauri.app/plugin/shell/`

Strong takeaways:

- Gleam OTP actors are typed and supervision-friendly enough for bounded
  daemon subsystems
- SQLite WAL is attractive for local concurrency, but all writers must be on
  the same host; it is not a cross-peer sync solution
- recent SQLite WAL bugfixes mean version pinning matters if multiple local
  processes will write/checkpoint concurrently
- Yjs is practical and mature for rich collaboration, but attribution and
  canonicalization need a server-side bridge
- libcluster helps nodes find each other; it does not define product truth,
  leases, or conflict semantics
- Phoenix PubSub is useful for fan-out and cluster topic distribution, but it
  is transport, not authority
- Erlang distribution over untrusted networks should use TLS; cookie-only trust
  is not enough
- Tauri capabilities are a real match for EMA because different windows and
  webviews can carry different powers and scopes
- Tauri shell and file-system plugins should be heavily scoped, not globally
  enabled

Best-practice implication:

- pin a modern SQLite version and treat WAL as local-node durability only
- keep replication above the SQLite layer
- use capability-scoped Tauri windows so admin/device/runtime surfaces can have
  different powers than ordinary Blueprint views
- use cluster and pubsub libraries as transport helpers, not doctrine

Further investigation:

- exact SQLite version pin and local write model for daemon + desktop process
- whether 0.0.5 should centralize all db writes in daemon only
- whether Blueprint collab bridge lives inside daemon or as a sidecar service
- whether Phoenix PubSub is worth including at all if the first daemon edge is
  Gleam-native

### Cross-layer conclusions

The best cross-layer rules strengthened by this research pass are:

- topology is a product decision, not a small schema choice
- clustering is not authority
- event names are not UI copy; they are system contract
- shell honesty is part of trust
- collaboration transport is not collaboration truth
- local durability and distributed replication must be designed separately

### Best-practice shortlist for 0.0.5

1. Keep all canonical writes inside the daemon.
2. Make the shell visibly scoped at org, space, and project levels.
3. Treat device/node currentness as a first-class product surface.
4. Start with a small reviewed event catalog.
5. Separate local SQLite durability from cross-peer replication.
6. Use explicit Tauri capabilities per window/webview.
7. Keep Blueprint structural truth server-owned even if rich text uses a CRDT.
8. Model lane claims and handoffs early, even if agent UI is still thin.
9. Do not let cluster formation libraries decide product semantics.
10. Make unfinished surfaces obviously honest.

## 14. Online research wave — four high-signal layers

This section captures a deeper online research pass focused on four areas with
the highest likely impact on EMA 0.0.5 implementation quality.

### Layer 1 — Distributed authority and node transport

Primary sources:

- https://www.erlang.org/docs/29/system/distributed.html
- https://www.erlang.org/docs/25/reference_manual/distributed
- https://www.erlang.org/doc/apps/ssl/ssl_distribution.html
- https://hexdocs.pm/libcluster/readme.html
- https://hexdocs.pm/phoenix_pubsub/Phoenix.PubSub.html

Key signals:

- Distributed Erlang connections are transitive by default.
- Hidden nodes and dynamic node names are real built-in concepts and may be
  useful for remote/operator-style EMA clients.
- Erlang's own docs explicitly warn that unsecured distribution can expose the
  cluster to total compromise.
- TLS distribution exists, but cluster transport security still does not define
  product-level authority semantics.
- `libcluster` helps nodes discover and connect.
- `Phoenix.PubSub` helps fan out state and events across connected nodes.

Best-practice read for EMA:

- treat BEAM clustering as transport and presence, not truth
- use TLS for any distributed node traffic over non-trusted networks
- keep authority leases and currentness rules in EMA, not in cluster plumbing
- consider hidden-node or temporary-client semantics for remote admin/observer
  access

Points to investigate further:

- whether EMA desktop clients should be hidden nodes
- whether dynamic node naming is a good fit for temporary away-from-home access
- whether the daemon should allow direct Erlang node connectivity at all, or
  expose a narrower EMA protocol over TLS instead

### Layer 2 — SQLite durability and replicated single-writer patterns

Primary sources:

- https://www.sqlite.org/wal.html
- https://fly.io/docs/litefs/
- https://fly.io/docs/litefs/how-it-works/
- https://fly.io/docs/litefs/position/
- https://fly.io/docs/litefs/config/
- https://fly.io/docs/litefs/faq/
- https://fly.io/docs/litefs/migrations/
- https://fly.io/docs/litefs/backup/

Key signals:

- SQLite WAL is excellent for local concurrency, but all processes must be on
  the same host; it is not a networked multi-peer write system.
- Recent SQLite WAL race fixes mean version pinning matters if multiple local
  writers/checkpointers exist.
- LiteFS is one of the clearest real-world examples of what EMA wants in one
  dimension:
  - local copies
  - single writer
  - lease-based primary
  - tracked replication position
  - read serving from replicas
- LiteFS also exposes the exact risk EMA should care about:
  stale-primary or stale-lease behavior can lose or roll back writes.
- LiteFS TXID plus checksum is extremely relevant to EMA's desire for unix time
  plus logical comparison and canon reconciliation.
- Migrations in single-writer replicated systems need explicit handling and
  idempotence.

Best-practice read for EMA:

- centralize database writes in the daemon process on a given node
- separate:
  - local SQLite durability
  - cross-peer replication journal
  - authority lease
- expose replication position/currentness visibly in the product
- treat backup as mandatory, not optional
- design migrations as idempotent and authority-aware

Points to investigate further:

- whether EMA should mimic LiteFS-style `TXID/checksum/current position`
  concepts for its own replication metadata
- whether EMA needs explicit write forwarding semantics between nodes
- whether the host node should support static primary mode first, with later
  dynamic failover

### Layer 3 — Collaboration sync for Blueprint and semantic docs

Primary sources:

- https://docs.yjs.dev/
- https://docs.yjs.dev/ecosystem/connection-provider/y-websocket
- https://docs.yjs.dev/ecosystem/database-provider/y-indexeddb
- https://docs.yjs.dev/getting-started/allowing-offline-editing
- https://automerge.org/
- https://automerge.org/docs/reference/concepts/
- https://automerge.org/docs/reference/repositories/
- https://automerge.org/docs/tutorial/local-sync/

Key signals:

- Yjs is mature, transport-agnostic, and practical for shared editing.
- Yjs has clear offline support and local persistence patterns.
- Yjs websocket transport is straightforward for central auth and awareness.
- Automerge is more aggressively local-first and repo-oriented.
- Automerge makes storage and network adapters explicit, which maps well to EMA
  wanting different node roles and sync fabrics.
- Both systems reinforce the same architectural warning:
  document sync plumbing is not the same thing as canonical product truth.

Best-practice read for EMA:

- keep Blueprint structure daemon-owned
- allow rich collaborative text/object sync beside the daemon, not instead of it
- persist local collaboration state for resilience
- treat sync transport as swappable and explicitly bounded
- separate awareness/presence from promoted canonical state

Current EMA-leaning interpretation:

- Yjs looks like the fastest route to a usable Blueprint editor
- Automerge remains a very strong conceptual donor for local-first repo
  thinking, but may be heavier than needed for the very first deep vApp

Points to investigate further:

- exact boundary between Blueprint prose edits and canonical Blueprint structure
- whether comments and inline prompt threads live in the collab plane or become
  immediately canonical EMA objects
- whether EMA should keep a CRDT log at all, or only object snapshots plus
  attributable op history

### Layer 4 — Native desktop security, secret storage, and identity substrate

Primary sources:

- https://v2.tauri.app/reference/acl/capability/
- https://v2.tauri.app/learn/security/capabilities-for-windows-and-platforms/
- https://v2.tauri.app/plugin/shell/
- https://v2.tauri.app/plugin/opener/
- https://v2.tauri.app/es/plugin/stronghold/
- https://v2.tauri.app/plugin/store/
- https://www.w3.org/TR/webauthn-3/

Key signals:

- Tauri capabilities are exactly the kind of scoped authority model EMA should
  care about.
- By default, Tauri commands can be broadly exposed unless capability scoping is
  tightened.
- Windows and webviews can have different capabilities, which is a huge fit for
  EMA's "different surfaces, different powers" requirement.
- Shell/opener access must be explicitly scoped to programs, args, paths, and
  URLs.
- Tauri Stronghold gives a serious local secret/key storage option.
- WebAuthn remains the best standard web-facing model for scoped public-key
  credentials and strong device/user-bound authentication ceremonies.

Best-practice read for EMA:

- do not give every window access to shell, fs, or network powers
- split admin/runtime/device windows from ordinary Blueprint views
- use Stronghold or equivalent for local secret material rather than casual
  file storage
- treat WebAuthn-like scoped public-key patterns as an inspiration for EMA
  invite redemption and device pairing

Points to investigate further:

- whether EMA desktop identity should use Tauri Stronghold directly for keyring
  material
- whether invite acceptance should create a project/org-scoped credential or
  simply pair a device under a user root
- which windows in EMA should have shell/fs/network capabilities by default,
  and which should have none

### Cross-layer best practices reinforced by online research

1. One writer at a time is not a limitation to hide; it is an invariant to
   design around.
2. Cluster connectivity and product authority are separate systems.
3. Replication needs explicit freshness metadata, not just "online/offline".
4. Rich document sync should not silently become source-of-truth storage.
5. Native desktop powers must be scoped per surface.
6. Secret storage and identity material deserve a first-class design, not a
   later patch.

## 14. Online research wave 2: denser four-layer signal pack

This pass intentionally narrows to four layers only, but uses more links per
layer and keeps the sources as close to official docs/specs as possible.

### Layer 1 — BEAM transport, distribution, and authority boundaries

Primary sources:

- https://www.erlang.org/doc/apps/kernel/net_kernel.html
- https://www.erlang.org/docs/26/reference_manual/distributed
- https://www.erlang.org/docs/23/apps/erts/erl_dist_protocol
- https://www.erlang.org/docs/23/apps/erts/alt_dist
- https://www.erlang.org/docs/22/apps/ssl/ssl_distribution
- https://hexdocs.pm/libcluster/readme.html
- https://hexdocs.pm/phoenix_pubsub/Phoenix.PubSub.html

Key signals:

- `net_kernel` and distributed Erlang give node connectivity, monitoring, and
  message transport, but they do not define EMA product authority.
- Erlang's own docs explicitly warn that insecure distribution can expose the
  node to complete compromise; EMA cannot treat "same cluster" as "same trust."
- The distribution protocol and alternative distribution docs reinforce that
  transport can be swapped or customized, which fits EMA's future peer and
  remote-runtime ambitions.
- `libcluster` helps discovery and membership, not canonical-write arbitration.
- `Phoenix.PubSub` is useful for fanout/projections and collab-side delivery,
  not for replacing a control-plane commit model.

Best-practice read for EMA:

- use distributed Erlang only on intentionally trusted links
- prefer TLS distribution whenever nodes talk over anything broader than a
  sealed local network
- keep authority leases / home-peer logic above transport
- treat cluster presence, peer health, and write authority as separate states
- do not let BEAM node membership imply permission to mutate canon

Points to investigate further:

- whether EMA should use standard TLS distribution or a more isolated app-level
  transport between peers first
- whether peer write eligibility should be expressed as a signed authority lease
  record in canon
- how much of peer liveness should live in runtime telemetry versus canonical
  audit history

### Layer 2 — SQLite durability, writer topology, and replication thinking

Primary sources:

- https://sqlite.org/wal.html
- https://www.sqlite.org/cgi/src/doc/begin-concurrent/doc/begin_concurrent.md
- https://www.sqlite.org/lockingv3.html
- https://www.sqlite.org/sharedcache.html
- https://fly.io/docs/litefs/how-it-works/
- https://fly.io/docs/litefs/position/
- https://fly.io/docs/litefs/config/
- https://fly.io/docs/litefs/migrations

Key signals:

- SQLite WAL is excellent for a local daemon-owned database, but it is not a
  peer-to-peer truth protocol.
- `BEGIN CONCURRENT` is interesting, but it still serializes commit and should
  not be mistaken for "many peers can safely write canon at once."
- SQLite itself discourages leaning on shared-cache as a magic concurrency fix.
- LiteFS is high-signal not because EMA should copy it literally, but because
  its model makes replication position, primary/candidate behavior, and read
  consistency explicit.
- The strongest practical interpretation for EMA remains: one daemon process
  owns writes to the local canonical store; replication is an adjacent journaled
  concern with explicit freshness metadata.

Best-practice read for EMA:

- one local daemon should own SQLite writes
- separate "local ACID durability" from "cross-peer replication"
- expose replica freshness with durable positions, not vague sync booleans
- plan migrations around current authority, not just process startup order
- design for read-after-write semantics explicitly when shells are connected to
  non-authority replicas

Points to investigate further:

- whether EMA should keep a durable replication cursor per object family, per
  peer, or per canonical journal
- whether standby peers can serve strongly consistent reads only after an
  acknowledged position barrier
- whether Blueprint and org/project metadata should share one canonical store
  initially or be split into separate SQLite databases with shared lineage

### Layer 3 — Rich collaboration, CRDT boundaries, and permission shape

Primary sources:

- https://docs.yjs.dev/
- https://docs.yjs.dev/api/document-updates
- https://docs.yjs.dev/api/about-awareness
- https://docs.yjs.dev/getting-started/adding-awareness
- https://docs.yjs.dev/getting-started/allowing-offline-editing
- https://docs.yjs.dev/ecosystem/connection-provider/y-websocket
- https://docs.yjs.dev/api/faq
- https://automerge.org/

Key signals:

- Yjs is still the most practical near-term path for live collaborative editing
  if EMA wants real multiplayer Blueprint prose early.
- Yjs explicitly separates durable document updates from awareness/presence,
  which matches EMA's need to keep "who is here" out of canonical truth.
- Yjs also explicitly warns that permissions are not practically enforced inside
  a YDoc; permission boundaries have to be enforced outside and often across
  smaller docs.
- Automerge remains high-value conceptually for local-first thinking and
  arbitrary-byte sync, but Yjs still looks faster to operationalize for 0.0.5.
- The safest EMA stance remains hybrid: daemon owns structural truth and
  attribution; CRDT sync handles collaborative prose and transient shared state.

Best-practice read for EMA:

- keep Blueprint structure daemon-owned even if text editing uses Yjs
- do not store org/project permissions "inside the doc"
- separate awareness/presence from durable truth
- split collaborative documents along permission seams rather than treating one
  giant doc as the entire workspace
- preserve attributable operations when agent edits cross from prose into canon

Points to investigate further:

- first exact boundary between `blueprint_document`, `blueprint_section`, and
  a Yjs-backed text body
- whether inline comments are Yjs-side annotations, canonical EMA comments, or
  a bridge between both
- whether agent edits should land as patches, suggestions, or proposal-extracts
  before they can affect Blueprint structure

### Layer 4 — Native desktop security, key custody, and scoped powers

Primary sources:

- https://v2.tauri.app/security/
- https://v2.tauri.app/learn/security/capabilities-for-windows-and-platforms/
- https://v2.tauri.app/reference/acl/capability/
- https://v2.tauri.app/plugin/shell/
- https://v2.tauri.app/plugin/opener/
- https://docs.rs/crate/tauri-plugin-stronghold/latest
- https://docs.rs/tauri-plugin-stronghold/latest/tauri_plugin_stronghold/stronghold/struct.Stronghold.html
- https://www.w3.org/TR/webauthn-3/

Key signals:

- Tauri's security model maps unusually well to EMA because it assumes a trust
  boundary between frontend webviews and privileged native code.
- Capability files are granular and window/webview specific, which is exactly
  what EMA needs for "Blueprint window" versus "admin/settings/device" windows.
- Shell and opener powers are dangerous by default and should be narrowly
  whitelisted.
- Stronghold is a serious option for local secret/key custody on macOS, Linux,
  and Windows.
- WebAuthn Level 3 continues to reinforce a strong public-key ceremony model for
  scoped credentials, user consent, and device-bound identity.

Best-practice read for EMA:

- capability-scope every window and webview from day one
- keep Blueprint read/write views much less privileged than admin/device views
- store long-lived secrets and key material in a real secret store
- model invites and device pairing as public-key ceremonies, not password flows
- make "this window can launch shell commands" a rare, auditable exception

Points to investigate further:

- whether EMA identity should use Stronghold snapshots as the primary desktop
  secret container
- whether per-org or per-space grants should mint separate device capabilities
  locally
- whether remote shell / SSH / agent-dispatch permissions should be granted per
  surface, per device, or per project/space role

### Cross-layer best practices sharpened by wave 2

1. Treat transport, discovery, and authority as three different subsystems.
2. Keep one local writer for canon and make replication explicit, journaled, and
   position-aware.
3. Use CRDTs for collaboration where they shine, but keep permissions and canon
   outside the CRDT itself.
4. Scope native powers by window, webview, and task, not just by app.
5. Design identity and invites as cryptographic ceremonies, not generic auth
   forms.
6. Make stale/current/provisional replica state visible to the human operator.

## 15. Quick reminder for future me

If you reopen this workspace later, start here:

- read this file first
- then read `lane3-domain-model-and-system-design.md`
- then re-open the donor docs listed in section 6

Most important local correction:

```text
For 0.0.5 prep, prefer:
Organization -> Space -> Project

Do not silently fall back to:
Organization -> Project -> Space
```
