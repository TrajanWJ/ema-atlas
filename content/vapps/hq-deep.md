# HQ — deep brief

> Sibling to `content/vapps/hq.md`. The 300-500 word brief is the
> stance summary; this file is the next layer of pressure.

## Stance

HQ is a **shell surface**, not a vApp proper. In the seven-layer
stack (`ARCHITECTURE.md`) it sits in the *Surfaces* row labelled
"Top-level: Launchpad · HQ · Virtual Desktop". Per
`05-fresh-context-project-app-model.md` §"HQ": "unique per user and
per project … personal HQ aware of all projects and orgs … dashboard
of what is happening in business/project/coding work … live GitHub
repos, client links, uptime awareness". HQ is the
"what-is-happening" surface — distinct from Launchpad's
"what-can-I-open" (per existing `content/vapps/hq.md`). It is
read-mostly by design: typed projections from the control plane,
workspace summaries, and external integration feeds composed into
one dashboard with two scoping modes (Personal HQ across all member
projects; Project HQ inside one project).

HQ inherits doctrine from
`graph/nodes/codebase-mission-control-claude.qmd` ("Pattern donor
for HQ"; status `inspiration`). The doctrine extracts named in that
node are load-bearing for HQ: **Hierarchical capability roles + dual
auth** (`viewer < operator < admin` with both human session and
machine API key carrying a role; agents identify on every call for
audit attribution), **Adapter protocol over direct lifecycle calls**
(`register → heartbeat → assignments → progress` is one POST
endpoint dispatching on `{framework, action, payload}`),
**Per-identity rate limits** (heartbeat and task-poll quotas scoped
per agent identity, not per IP), and **Hardening as a separate
overlay with deny-by-default network**. The first three apply
directly to HQ's external feed registration; the fourth applies to
HQ's deployment posture. The residue (Next.js 16 / SQLite-WAL /
pnpm / Docker substrate, the 32-panel UI, the specific `MC_*` env
vars) does not transfer.

Under the canonical rule — *EMA owns truth. Hermes owns execution.
Surfaces do not own state.* — HQ is the most read-heavy surface in
the system and that is the point. Per existing `content/vapps/hq.md`:
"Every external feed lands as a typed projection in the control
plane (via a feed adapter), and HQ reads from the projection — not
from the feed directly. HQ code never holds incident state, never
owns the proposal queue, never stores feed credentials." A GitHub
PR row on HQ is a row because a feed adapter wrote a typed event to
`event_log` for it; HQ reads the projection. Crucially, HQ is the
surface where the **Adapter protocol** doctrine prevents the
Mission-Control-Claude residue (per-feed routes, per-feed schemas)
from creeping back in.

HQ is the seam between operator-shell and ambient-cockpit framings.
The vault-candidate **Cognitive Cockpit** (`GLOSSARY.md`,
"calm-technology") is most natural on HQ because the surface is
read-mostly. The contrasting Mission-Control-Claude pattern is
denser, with action surfaces inline (acknowledge incident, approve
proposal, reject). `content/briefs/shells-surfaces.md` hard
question 1 ("Whether HQ or the Virtual Desktop is the *home*
surface") puts HQ at the center of the surface-stack debate.

## Object model

Objects HQ renders (none owned canonically — all references trace
to plane owners):

- **Pulse card** — a typed projection of one slice of project state
  (running executions, recent dispatches, open incidents, queue
  depth, last 24h chronicle, per existing `hq.md`). Lives on the
  **Control plane** as derived projections over `event_log`. The
  card is read-only; the click-through opens the underlying record.
- **External feed event** — a typed event written by a feed
  adapter from an upstream source (GitHub PR/commit/CI, client
  portal, uptime probe). Lives on the **Control plane** as
  `event_log` rows with a `feed_kind` discriminator. The adapter
  follows the **Adapter protocol** doctrine extracted from
  `graph/nodes/codebase-mission-control-claude.qmd`
  (`register → heartbeat → assignments → progress`).
- **Open-question card** — a count + recent list of `OpenQuestion`-
  kind nodes (per `research/parts/semantic-layer.md`) for the
  project. Lives on the **Collab plane**; HQ reads via
  `context_for/2`.
- **Workstream card** — an active workstream with ETA / blockers
  per existing `hq.md`. Lives on the **Workspace plane** as a
  workstream artifact under `workspace/shared/workstreams/`; HQ
  reads the artifact and the linked control-plane events.
- **Incident card** — an `Incident` record from the
  `incidents/{authority, event, executor, policy}` subsystem per
  `ARCHITECTURE.md`. Lives on the **Control plane**. The
  acknowledge action emits a typed `IncidentAcked{incident_id, by,
  note, at_ms}` event.
- **Pending proposal card** — a `Proposal{intent, project_id,
  member_id, …}` queued for the user. Lives on the **Control
  plane**. The decide action emits `ProposalApproved |
  ProposalRejected{by, at, proposal_id}`.
- **Personal HQ aggregate** — a per-user view that reads pulse
  cards across all `Project`s the user is a `Member` of (per
  `ARCHITECTURE.md` identity sketch), grouped by `Org`. Per
  existing `hq.md`: "Personal HQ aware of all projects and orgs".
  Computed live from the identity registry.
- **Feed registration artifact** — `workspace://hq/feeds/<kind>/
  <name>.json` per existing `hq.md` ("Feed registrations are
  workspace artifacts so Personal HQ can mirror them across
  projects"). Lives on the **Workspace plane**.
- **Layout / pinned-cards artifact** — `workspace://hq/layout.json`
  (or per-project variant). Lives on the **Workspace plane**, same
  shape as Launchpad's layout artifact.

Objects HQ does *not* render: chat scrollback, wiki node bodies,
blueprint canvases, agent virtual calendars, queue items as primary
content (Agent vEnv vApp owns those). HQ shows their *aggregate
state* and links out to the owning vApp.

## Three futures (deepening the universal stances)

### Operator Cathedral — *Mission Console*

HQ is a precision dashboard. Cards are typed, sized by category,
and ordered by an explicit policy (severity, recency, project
priority). External feeds are first-class but governed: every feed
adapter must implement the **Adapter protocol** with a registered
`{framework, action, payload}` schema, must declare its **per-
identity rate limit**, and must run under deny-by-default network
posture (per `graph/nodes/codebase-mission-control-claude.qmd`
hardening doctrine). Acknowledge / approve actions are explicit and
audit-attributed via the dual-auth doctrine.

- **Bet:** that operators trust EMA *because* HQ refuses to render
  any state it cannot project from a typed source, and refuses to
  let any agent act without role-attributed audit.
- **Tension:** the discipline produces a console that feels like a
  control tower. The fresh-context framing
  (`05-fresh-context-project-app-model.md`) gestures at "live GitHub
  repos, client links, uptime awareness" — Cathedral renders those
  precisely but coldly.
- **Question:** does HQ become the *home* surface (per
  `content/briefs/shells-surfaces.md` hard question 1) once it is
  precise enough? The surface that operators trust enough to leave
  open all day is the home surface.

### Living Workspace — *Calm Awareness Surface*

HQ is ambient. The **Cognitive Cockpit** stance shapes every card
— glanceable, low-frequency, no modal interrupts. Workstream cards
breathe; pulse cards rotate gently. Acknowledge and approve actions
are inline but understated. Personal HQ is the daily-driver
surface; Project HQ is one click in. Background results
(`GLOSSARY.md` **Background Results Contract**) arrive as quiet
card updates, not pushes.

- **Bet:** that the surface a user keeps open in the corner of the
  screen all day is the surface that defines the product. Calm
  beats control-tower at the daily-driver layer.
- **Tension:** "calm" tempts the surface to cache state, dedupe
  badges, render-without-record. P3 violation surface area is
  high. Q1 matters: an agent's incident-ack must be visibly
  attributed without being shouty.
- **Question:** when a card becomes interactive (acknowledge,
  approve, decide), does it become a vApp? The pressure check in
  `howto/add-a-vapp.md` says yes; the Cockpit stance says the line
  is moot.

### Mesh Commonwealth — *Federated Operator Dashboard*

HQ spans peers. Personal HQ aggregates across Orgs and across peer
nodes. A peer's GitHub feed can mirror to your HQ via the **MCP
Gateway** (`GLOSSARY.md` vault candidate); a peer's incident can
appear on your HQ if you have a leased `viewer` role on their
`Project`. **Distributed AI Delegation** lets a peer's queue depth
appear on your dashboard. The dual-auth doctrine extends: a peer's
agent ack on your incident carries the peer's identity plus the
lease.

- **Bet:** that HQ is the surface where mesh earns its keep,
  because operating across peers is the most natural place to
  accept "this dashboard spans nodes" friction.
- **Tension:** Q9 (replication boundary) is deferred per P6.
  Building peer-aware HQ early violates P6. Q10 (permission map)
  decides whether a peer's ack is legitimate on your project at
  all.
- **Question:** if a peer's feed adapter writes to your
  `event_log`, who owns the event? P10 says `project_id` is on
  every record; the peer-write story needs an explicit
  `originating_node_id` field on every cross-peer event.

## What humans do here

1. **Drill from a pulse card into the underlying records.**
   Artifact: a navigation to the owning vApp (Chat for sessions,
   Files for artifacts, Wiki for nodes). Control-plane record:
   `SurfaceFocusEvent` (per existing `launchpad.md` shape).
   Presupposes Q3 (project context resolution).
2. **Acknowledge an incident.** Artifact: an
   `IncidentAcked{incident_id, by, note, at_ms}` event. Control-plane
   record: same. Presupposes Q1 (so an agent's ack is distinguishable
   from a human's per the dual-auth doctrine).
3. **Approve / reject a pending proposal.** Artifact: a
   `ProposalDecision`. Control-plane record: `ProposalApproved |
   ProposalRejected{by, at, proposal_id}` (same shape as Chat
   surface, per `content/vapps/chat-deep.md`). Presupposes Q1, Q10
   (whose role can approve which kind of proposal).
4. **Pin / reorder cards.** Artifact: a write to
   `workspace://hq/layout.json` (per existing `hq.md`). Control-plane
   record: none direct. Layout is a workspace artifact under P3.
5. **Switch between Personal HQ and Project HQ.** Artifact: focus
   shift; subsequent queries scope to the new context.
   Control-plane record: `SurfaceFocusEvent`. Presupposes Q3.
6. **Register an external feed.** Artifact: a feed registration
   under `workspace://hq/feeds/<kind>/<name>.json` (per existing
   `hq.md`). Control-plane record: `FeedRegistered{kind, name,
   project_id, by}`. Presupposes the **Adapter protocol** doctrine
   so the feed plugs into one POST endpoint, not a new route.
7. **Watch the chronicle tail for the project.** Artifact: a live
   subscription to the project's `event_log` slice via `ws_hub`
   (per `research/parts/shells-surfaces.md`). Read-only.

## What agents do here via CLI

Parity with the human surface is required (`howto/add-a-vapp.md`).

1. **`ema hq pulse --project`** (existing `hq.md`). Returns the
   same pulse data the UI renders. Read-only; no artifact. The
   **Scope Advisor** (`GLOSSARY.md` vault candidate) may pre-filter
   by Honcho-modeled context. **Per-identity rate limits**
   (doctrine from `graph/nodes/codebase-mission-control-claude.qmd`)
   apply: a noisy agent cannot starve other agents' pulse calls.
2. **`ema hq incident ack <id> --note`** (existing). Same as
   human #2. The agent's call carries an `X-Agent-Name`-shaped
   header per the dual-auth doctrine; the resulting event records
   the agent identity for audit attribution.
3. **`ema hq proposal list --pending --for-user <id>`** (existing).
   Read-only. The agent must have a `viewer` (or higher) role on
   the project per the hierarchical-roles doctrine.
4. **`ema hq proposal decide <id> --approve | --reject --reason`**
   (existing). Same as human #3. The **Auto-Resolve Gate** (vault
   candidate, confidence ≥ 0.85, `GLOSSARY.md`) applies: if the
   gate passes for the proposal kind, the agent's decide is
   accepted without human review; otherwise the call escalates.
5. **`ema hq feed register --kind github | uptime | client
   --config`** (existing). Same as human #6. The feed adapter
   implements the **Adapter protocol** — one POST endpoint
   dispatching on `{framework, action, payload}` per the doctrine
   extracted from `graph/nodes/codebase-mission-control-claude.qmd`
   ("`register → heartbeat → assignments → progress` is one POST
   endpoint").
6. **`ema hq watch --project --filter` (streaming)** (extension).
   Same shape as `ema chat watch` (per `content/vapps/chat-deep.md`).
   Read-only subscriber to the project's `event_log` slice via
   `ws_hub`. The **Background Results Contract** XML wrapper
   applies if the watcher is consuming async sub-agent outcomes.
7. **`ema hq personal --as <member_id>`** (extension). Aggregates
   across all projects the member belongs to, per existing
   `hq.md`'s Personal HQ definition. Presupposes Q3 and the
   identity registry from
   `research/build-steps/02-identity-registry-skeleton.md`.

## Smallest provable v0.0.3 slice

**Scope:** per existing `hq.md` — "**After v0.0.3.** HQ becomes
valuable in proportion to how much real control-plane traffic
exists. Pre-v0.0.3 it would render mostly empty cards. The smallest
provable slice (post-v0.0.3) is a Personal HQ that shows running
Hermes sessions across projects + GitHub PR status — two feeds,
one user. Build outward from there." This deep brief preserves
that scope and pins the v0.0.3-shaped *seed*: one feed adapter,
one pulse card, one acknowledge action, the dual-auth doctrine
proven end-to-end.

**2-week acceptance criteria:**

1. A `Pulse` typed projection exists in the Gleam tree that reads
   `event_log` slices for "running executions, recent dispatches,
   queue depth, last 24h chronicle" (per existing `hq.md`'s pulse
   definition). The projection is pure; HQ surface code never
   computes pulse state in-memory.
2. One feed adapter (GitHub PR feed) is implemented behind one
   POST endpoint (per the **Adapter protocol** doctrine) that
   dispatches on `{framework: "github", action, payload}`. The
   adapter writes typed `FeedEvent{feed_kind: GithubPr, …}` rows
   to `event_log` and never writes to surface code directly.
3. The adapter declares a **per-identity rate limit** at
   registration time (e.g. 30/min per agent for poll, 20/min per
   agent for incident-ack) per the doctrine extracted from
   `graph/nodes/codebase-mission-control-claude.qmd`. A flooding
   test confirms one agent over-quota does not delay another.
4. The HQ vApp renders one Personal HQ for one user with two
   pulse cards (running Hermes sessions across projects, GitHub PR
   status). Surface-restart test (per
   `research/parts/shells-surfaces.md`): kill the surface, restart
   it; the dashboard rehydrates from `event_log` + workspace
   artifacts alone.
5. `ema hq incident ack <id> --note` carries a typed agent
   identity (per Q1's eventual resolution; default to
   `HumanActor` per `research/parts/shells-surfaces.md` Q1 note
   today). The resulting `IncidentAcked` event records the actor.
6. `ema hq proposal decide <id>` writes a `ProposalApproved` or
   `ProposalRejected` to `event_log`; HQ re-renders with the
   proposal removed from the pending list within one tick.
7. Layout-prefs round-trip test (reused from
   `research/parts/shells-surfaces.md`): a layout saved by HQ on
   member A's device is readable on member A's other device, not by
   member B.

**Build-step dependencies:**

- `research/build-steps/01-control-plane-skeleton.md` — `event_log`,
  `command_bus`, `replay`. Required for `FeedEvent`,
  `IncidentAcked`, `ProposalApproved/Rejected`.
- `research/build-steps/02-identity-registry-skeleton.md` —
  `Member`/`Project`/`Org`, `context_for(project, actor)`.
  Required for Personal HQ aggregation across projects and for the
  hierarchical-roles doctrine.
- `research/build-steps/04-sessions-and-babysitter.md` — sessions
  registry. Required for the "running Hermes sessions across
  projects" pulse card.
- `research/build-steps/06-surfaces-skeleton.md` — mist + wisp
  HTTP/WS, `ws_hub`, `LayoutPrefs` round-trip. Required for the
  shell renderer and the live activity tail.

**Explicitly deferred:** Cognitive Cockpit ambient styling,
Distributed AI Delegation tiles, peer-aware Personal HQ (Q9),
hardening overlay (deferred to deployment story; doctrine
acknowledged but the deny-by-default network is not v0.0.3-shaped),
custom feed kind registry, Intelligence Layer pre-routing on HQ
queries.

## Decision pressure unique to this surface

1. **HQ-as-home vs Desktop-as-home.** Per
   `content/briefs/shells-surfaces.md` hard question 1. HQ wins
   legibility (read-mostly, calm, project pulse); Desktop wins
   memorability (place.org DNA). The pick decides which surface
   the user opens first on launch.
2. **Personal HQ as primary vs Project HQ as primary.** Personal:
   the user lands on Personal HQ and drills into projects.
   Project: the user lands on the active project's HQ. Personal
   matches "what is happening across my work"; Project matches
   "what is happening in this project".
3. **External feed pull vs push (and adapter protocol shape).**
   Pull: HQ adapters poll upstream sources on a tick. Push:
   upstream sources webhook into the EMA feed endpoint. The
   **Adapter protocol** doctrine from
   `graph/nodes/codebase-mission-control-claude.qmd` is shaped for
   `register → heartbeat → assignments → progress` — pull-leaning;
   push-friendly upstreams need an adapter on the EMA side.
4. **Acknowledge / approve as inline action vs link-out to owner
   vApp.** Inline: HQ has its own incident-ack and proposal-decide
   surfaces. Link-out: HQ shows the card, click-through opens the
   owner vApp (Threads for incident, Chat for proposal). Inline is
   faster; link-out keeps the canonical-rule cleaner (HQ stays
   read-mostly).
5. **Hierarchical roles enforced at HQ vs at the action endpoint.**
   At HQ: HQ filters cards and disables actions per the user's
   role per the dual-auth doctrine. At the endpoint: HQ shows
   everything, the action endpoint rejects with a typed error.
   At-HQ matches the calm UX; at-endpoint matches the canonical
   rule (surfaces don't gate authority; the daemon does). Both can
   ship; only one is the source of truth.
6. **Notification surface as HQ vs Launchpad.** Launchpad badges
   are counts; HQ cards are details. A user with both surfaces
   open sees the same fact twice. Picking one as primary requires
   a story for what the other shows in its place.
7. **Hardened deployment as v0.0.3 default vs opt-in overlay.**
   Per `graph/nodes/codebase-mission-control-claude.qmd` doctrine
   ("Hardening as a separate overlay with deny-by-default
   network"), the cleanest answer is opt-in — the v0.0.3 default
   is unhardened, with a documented hardening overlay. Default
   matches "ship something usable"; hardened matches "production
   posture from day one".

## Cross-references

- `content/vapps/hq.md` — the 300-500 word stance (sibling, do
  not modify)
- `content/vapps/launchpad.md` and (sibling) `launchpad-deep.md`
  — HQ ("what is happening") vs Launchpad ("what can I open")
  seam
- `content/vapps/virtual-desktop.md` and (sibling)
  `virtual-desktop-deep.md` — HQ-as-home vs Desktop-as-home
  question
- `ARCHITECTURE.md` — seven-layer stack (Surfaces row, "Top-level:
  Launchpad · HQ · Virtual Desktop"), `incidents/{authority,
  event, executor, policy}`, identity sketch
- `DESIGN_PRINCIPLES.md` — P1 (authority before surface), P3
  (workspace state durable), P4 (identity layers separate), P6
  (local before distributed), P7 (extract doctrine, not residue),
  P10 (org/space first-class)
- `howto/add-a-vapp.md` — pressure-check, CLI parity requirement
- `research/parts/shells-surfaces.md` — `mist`/`wisp` endpoint,
  `ws_hub`, `LayoutPrefs` round-trip test, "Surfaces hold no
  durable state" test, host-truth-watcher degraded-mode test
- `content/briefs/shells-surfaces.md` — three futures, hard
  question 1 (HQ vs Desktop as home), Cognitive Cockpit framing
- `research/build-steps/01-control-plane-skeleton.md`
- `research/build-steps/02-identity-registry-skeleton.md`
- `research/build-steps/04-sessions-and-babysitter.md`
- `research/build-steps/06-surfaces-skeleton.md`
- `graph/nodes/codebase-mission-control-claude.qmd` — pattern
  donor for HQ; doctrine extracted (2026-04-22): hierarchical
  capability roles + dual auth, adapter protocol over direct
  lifecycle calls, per-identity rate limits, hardening as a
  separate overlay with deny-by-default network
- `graph/nodes/docs-host-system-launchpad-hq.qmd` — surface-side
  buildout plan
- `graph/nodes/codebase-place-org.qmd` — UX-metaphor donor (HQ is
  one of the place.org-lineage surfaces)
- `05-fresh-context-project-app-model.md` §"HQ" — the source
  product framing ("unique per user and per project … live GitHub
  repos, client links, uptime awareness")
- `GLOSSARY.md` — HQ, Cognitive Cockpit, Personal AI, Intelligence
  Layer, Background Results Contract, Auto-Resolve Gate, Scope
  Advisor, Distributed AI Delegation, MCP Gateway
- `OPEN_QUESTIONS.md` — Q1, Q3, Q4, Q7, Q9, Q10
