# Threads / Server — deep brief

> Sibling to `content/vapps/threads-server.md`. The 300-500 word brief
> is the stance summary; this file is the next layer of pressure.

## Stance

Threads / Server is the **collaboration-plane** vApp covering async
multi-party conversation. In the seven-layer stack
(`ARCHITECTURE.md`) it sits in the *Collaboration plane* row alongside
Docs, Wiki, and Canvas. Its substrate is the same TBD substrate
(Q2/Q8) as the Wiki — channel/thread/message/membership/reaction
records do not fit `event_log`'s append-only shape (P9,
`DESIGN_PRINCIPLES.md` — "Live docs/wiki/canvas edits don't fit
`event_log`'s append-only shape"). The collab supervisor sketched in
`ARCHITECTURE.md` (`collab/supervisor (NEW — substrate TBD)`) is
shared between Threads and Wiki; the substrate decision binds them
together.

Under the canonical rule — *EMA owns truth. Hermes owns execution.
Surfaces do not own state.* — Threads occupies a uniquely loaded
position because the legacy surface it replaces (Discord) is the
canonical example of "surface became the de facto state container."
`content/briefs/shells-surfaces.md` is explicit: "Every prior era of
this lineage drifted because a surface (Discord, place.org,
ClaudeForge) became the de facto state container." Threads' job is to
reproduce Discord's affordances *while* keeping the collab plane as
the only durable owner. The Discord mirror itself (Q6,
`OPEN_QUESTIONS.md`) is the test case: it must be a one-way
projection in the canonical direction (EMA → Discord) with inbound
Discord events arriving as *proposed* messages that the collab plane
either accepts or rejects (per existing `threads-server.md` canonical
rule section). Anything bidirectional without a gate re-creates the
drift.

Threads is also where agents become first-class participants in a
public conversation, not bots-with-permissions. Per
`05-fresh-context-project-app-model.md` §3 ("visible multi-agent
conversations/DMs"), the design assumes agents post and read in
channels alongside humans. That assumption is conditional on Q1
(`OPEN_QUESTIONS.md` — agent identity model); without Q1 settled,
every agent message attributes to a service principal or human
proxy, and the "see what the AI is saying in #incidents" view
collapses.

The vApp expresses the **Cognitive Cockpit** stance (vault candidate,
`GLOSSARY.md` — "ambient awareness layer (calm-technology) rather
than a chat app with bots"). Threads is the public square; Chat is
the private workshop; the difference is not the substrate (both are
collab/runtime), it is the social register. Whether to actually
maintain that distinction or unify the two surfaces is hard question
#2 from `content/briefs/shells-surfaces.md`.

## Object model

Objects Threads renders (none owned canonically — all references
trace to the Collab plane or, for promotions, the Control plane):

- **Channel** — top-level container, scoped to Project or Space (per
  existing `threads-server.md`). Lives on the **Collab plane**. Has a
  `kind` and a `mirror_status` (Q6).
- **Thread** — typed conversation inside a channel. Kinds enumerated
  in existing `threads-server.md`: `incident | review |
  proposal-discussion | social | async-standup`. Lives on Collab.
- **Message** — body + author (Actor) + attachments. Lives on Collab.
  Attachments may reference workspace artifacts (Workspace plane),
  wiki nodes (Collab plane), control-plane records (e.g. an
  `ExecutionId` quote), or code diffs.
- **Reaction** — author + emoji + target message. Lives on Collab.
- **Membership** — `(Member, Channel | Thread, role)`. Lives on
  Collab; resolution depends on **identity registry** per
  `research/build-steps/02-identity-registry-skeleton.md`.
- **Mirror state** — per-channel Discord mirror direction and last
  outbound seq. Lives on Collab; the Discord-side state is *not*
  authoritative.
- **Pinned message → Workspace artifact** — promotion event lives on
  the **Control plane** (`PinPromoted{message_id,
  workspace_artifact_path}`); the artifact lives on the Workspace
  plane.
- **Promoted thread → Control-plane proposal** — `Proposal{intent,
  project_id, member_id}` (per `ARCHITECTURE.md`). Lives on Control;
  the originating thread keeps a `PromotedFrom` edge (per
  `Relation` enum in `research/parts/semantic-layer.md`).
- **Tagged-in agent capability scope** — `capability_set: Set(
  Capability)` granted to an agent for the scope of a thread. Per
  `Dispatch` sketch in `ARCHITECTURE.md`. Lives on Control.

Objects Threads does *not* render: live chat sessions (Chat vApp),
wiki nodes as primary content (Wiki vApp), schedule events / queue
items (Agent vEnv), executions (rendered as references only).

## Three futures (deepening the universal stances)

### Operator Cathedral — *Channel-as-incident-room*

Threads is operational. Channels have strict typed `kind` values.
Threads inside have explicit lifecycle (`open → resolved | escalated
→ archived`). Promoting a thread to a control-plane proposal is a
formal act; promoting a pin to a workspace artifact is event-logged.
The Discord mirror is read-only outbound (Q6 variant 1). Agents
posting in `#incidents` carry typed capability scopes — they cannot
take actions outside the thread's grant.

- **Bet:** that the value of moving off Discord is *governance*, not
  feature parity. EMA earns its keep by making conversation auditable.
- **Tension:** social channels feel weird in a tightly typed system.
  `kind = social` is the awkward escape hatch. Lifecycle on every
  thread is overhead.
- **Question:** if every conversation is auditable, does anyone risk
  saying anything? The OpenClaw doctrine (`GLOSSARY.md` — "earlier
  multi-agent / Discord-native operator system; doctrine donor") gave
  weight to lightweight chatter; this future taxes it.

### Living Workspace — *Channel-as-room*

Threads is calm. The **Cognitive Cockpit** stance dominates
(`GLOSSARY.md`). Channels feel like rooms. Multi-agent conversation
is ambient. Pinning is informal. Promotion to artifact or proposal is
suggested by the Vault Cognitive Layer when patterns emerge, not
imposed. Agents are visible participants by default (Q1 assumed
settled in favor of first-class). The Discord mirror is bidirectional
during the migration (Q6 variant 2) and the gate accepts most inbound
Discord events.

- **Bet:** that adoption requires familiarity. People won't migrate
  off Discord for a control-room; they will migrate for "Discord plus
  the things Discord can't do."
- **Tension:** P3 violation surface area is high. "Calm" tempts the
  design to let messages be the durable thing — recreating the
  Discord drift inside EMA. The Q6 bidirectional path needs a strong
  gate or it is just Discord with extra steps.
- **Question:** when an agent and a human disagree in a thread, who
  has the floor? Hard question #2 from
  `content/briefs/shells-surfaces.md` ("Whether Chat and Threads are
  distinct products or two views of one underlying model")
  generalizes here to Thread-vs-DM-vs-Chat.

### Mesh Commonwealth — *Channel-as-federation-edge*

Threads spans peers. A channel can be local to one Project, mirrored
to a Space, federated to an Org, or made `OrgWide` / `Public` (per
`Visibility` enum in `research/parts/semantic-layer.md`). Cross-peer
thread membership is gated by **MCP Gateway** (vault candidate)
boundaries. The Discord mirror is one of many rendering targets (Q6
variant 3 — "EMA superset with Discord as one rendering target").
**Distributed AI Delegation** lets an agent on peer A respond in a
thread that is canonically owned by peer B.

- **Bet:** that conversations want to flow across organizational
  boundaries and EMA earns its keep by making federation safe.
- **Tension:** Q9 (replication boundary) is deferred until Q1/Q2/Q3
  settle (P6, `DESIGN_PRINCIPLES.md`). Building peer-aware Threads
  early violates P6. Q10 (org/space → runtime permissions) is
  blocking.
- **Question:** if a thread is canonically on peer B but I have a
  capability lease to participate, where does *my* search index keep
  it? The "one search per project" intuition collapses.

## What humans do here

1. **Create a channel.** Artifact: a `Channel` record on the Collab
   plane, scoped to a Project or Space (per existing
   `threads-server.md`). No control-plane record (collab-only).
   Presupposes Q3 (Project ↔ Space cardinality) for scope resolution
   and Q2 for substrate.
2. **Open a thread inside a channel with explicit kind.** Artifact: a
   `Thread{channel, kind}` record. Presupposes Q2.
3. **Post a message with attachments.** Artifact: a `Message`
   record. If attachment is a workspace artifact, render as
   reference (P3 — no copy into the message body as truth).
   Presupposes Q1 (so agent attachments attribute correctly) and Q2.
4. **Pin a message → workspace artifact.** Artifact: a workspace
   file under `workspace/shared/pins/`. Control-plane record:
   `PinPromoted{message_id, artifact_path}`. Presupposes Q3 for path
   resolution.
5. **Promote a thread → control-plane proposal.** Artifact: a
   `Proposal{intent: "thread.promote", project_id, member_id,
   thread_ref}`. Control-plane record: the proposal itself. Per
   `ARCHITECTURE.md` ("send user intent back as Proposal").
6. **Configure Discord mirror direction per channel.** Artifact: an
   updated `mirror_status` on the Channel. Control-plane record:
   `MirrorConfigChanged{channel_id, direction, by}`. Presupposes Q6.
7. **Tag an agent into a thread with a scoped capability_set.**
   Artifact: a thread membership grant. Control-plane record:
   `AgentScoped{agent_id, thread_id, capability_set, until}`. Presupposes
   Q1 (first-class agent identity) and Q10 (capability mapping).
8. **Open a review thread tied to an `ExecutionId`.** Artifact: a
   `Thread{kind: review}` with an attached `ExecutionId` reference
   (per existing `threads-server.md` chronicle section). Presupposes
   the execution lineage is queryable via `control_plane/replay`.

## What agents do here via CLI

Parity with the human surface is required (`howto/add-a-vapp.md`).

1. **`ema threads channel create --space --kind --name`** (existing).
   Same as human #1.
2. **`ema threads post --channel --thread --body --attach <artifact>`**
   (existing). Same as human #3. The **Auto-Resolve Gate** (vault
   candidate, `GLOSSARY.md` — confidence ≥ 0.85) applies if the post
   is the agent closing a queue item — passes the gate, no human
   review required for the resolution itself; the post still appears
   in the thread. The **Background Results Contract** XML wrapper
   applies if the post is an async sub-agent's result re-injected
   into a `kind: review` thread.
3. **`ema threads watch --channel --filter` (streaming subscribe)**
   (existing). Read-only via `ws_hub` per
   `research/parts/shells-surfaces.md`. No artifact, no event.
4. **`ema threads promote-thread <id> --to proposal | artifact`**
   (existing). Same as human #5/#4. The **Handoff Envelope** (vault
   candidate — status, confidence, completeness, provenance per
   `GLOSSARY.md`) wraps the thread tail when the promotion implies a
   handoff to another agent for execution.
5. **`ema threads mirror status --channel`** (existing). Read-only
   query of `mirror_status`. No artifact, no event.
6. **`ema threads scope agent --thread --agent --capability_set
   --until`** (extension, agent-side). Same as human #7. The
   **Scope Advisor** (vault candidate) may pre-suggest the
   capability_set based on Honcho-modeled context.
7. **`ema threads dm --to <member_or_agent> --body`** (extension).
   Same as a posted message but to a private DM thread. Visible to
   admin per Q10 policy decisions; multi-agent DMs are first-class
   per `05-fresh-context-project-app-model.md` §3.
8. **`ema threads incident open --execution_id --severity --channel`**
   (extension). Opens a `kind: incident` thread auto-attached to the
   execution lineage. Often closes via the **Background Results
   Contract** when the responding agent posts.

## Smallest provable v0.0.3 slice

**Scope:** single-channel read-only mirror of one Discord channel
rendered through the EMA shell, with one promote-to-artifact path.
Per existing `threads-server.md` ("After v0.0.3. ... The smallest
provable pre-slice is a single-channel read-only mirror of one
Discord channel rendered through the EMA shell — useful as a wedge,
not a vApp"). This deep brief acknowledges the existing brief defers
the full vApp; the v0.0.3 slice is the wedge.

**2-week acceptance criteria for the wedge:**

1. A `Channel` and `Message` type exist in the Gleam tree with the
   plane assignment from `ARCHITECTURE.md` honored.
2. `surfaces/discord_bridge` (`Subject(DiscordBridgeMsg)`, per
   `research/parts/shells-surfaces.md`) implements `IncomingMessage`
   only — `PublishOut` is stubbed. FFI to `:gun` for Discord REST per
   the same file.
3. Inbound Discord events land via the bridge as *proposed* `Message`
   records that the collab plane gates per existing `threads-server.md`
   ("inbound Discord events arriving as proposed messages that the
   collab plane either accepts or rejects").
4. The Threads vApp renders one channel via a typed projection from
   the collab plane. Surface code contains no direct collab mutation;
   every action goes through `collab_plane.propose_*`.
5. A "pin → workspace" path: pinning a message produces a workspace
   file under `workspace/shared/pins/` and a `PinPromoted` event in
   `event_log`.
6. Surface-restart test (per `research/parts/shells-surfaces.md`):
   kill the surface, restart, channel rehydrates from the collab
   plane.
7. Per-Project scoping: messages from a Discord channel mirrored into
   `Project A` are not visible from `Project B` (P10 enforcement).

**Build-step dependencies:**

- `research/build-steps/01-control-plane-skeleton.md` — `event_log`,
  `command_bus`. Required for `PinPromoted`, `MirrorConfigChanged`,
  proposal records.
- `research/build-steps/02-identity-registry-skeleton.md` —
  `Member`/`Agent` for message authorship, even before Q1 settles
  (agents post via service principal until Q1).
- `research/build-steps/05-collab-substrate-skeleton.md` —
  per-object event log adjacent to control plane. **Load-bearing
  dependency.** Without this, Threads has no substrate.
- `research/build-steps/06-surfaces-skeleton.md` — mist + wisp HTTP/WS,
  `ws_hub`, `surfaces/discord_bridge` slot in the supervision tree
  ("only if Q6 says so", per `research/parts/shells-surfaces.md`).

**Explicitly deferred:** full channel/category UI, multi-channel
mirror, bidirectional Discord (Q6 variants 2/3), agent-as-first-class
identity (Q1), thread typed lifecycle, capability-scoped agent
tagging, federation across peers (Q9), DM substrate.

## Decision pressure unique to this vApp

1. **Discord mirror direction (Q6 — three variants).**
   *Read-only outbound:* EMA owns truth, Discord is a render target,
   inbound is rejected by default. *Bidirectional with gate:*
   Discord-originated messages enter as proposals, EMA can accept; the
   gate is the entire risk surface. *EMA superset:* Discord is one of
   many render targets, no inbound at all (cleanest, hardest to
   migrate).
2. **Thread `kind` as fixed enum vs open vocabulary.** Fixed (existing
   `threads-server.md`: `incident | review | proposal-discussion |
   social | async-standup`) gives typed render and lifecycle. Open
   vocabulary gives flexibility at the cost of governance.
3. **Agents as first-class members vs scoped service principals
   (Q1).** First-class: an agent has a `MemberId`, posts attribute to
   it, capability scopes are per-agent. Service principal: every
   agent message attributes to a system actor, scopes are per-thread.
4. **Promote-thread-to-proposal as user gesture vs ambient
   recommendation.** Gesture: user explicitly clicks "promote." Ambient:
   the Vault Cognitive Layer (vault candidate) detects
   proposal-shaped patterns and suggests promotion.
5. **Channel scoping at Project vs Space vs both.** Per existing
   `threads-server.md` ("scoped to Project or Space"). Depends on Q3.
   Project-only is simpler; Space-spanning matches the Cognitive
   Cockpit stance better.
6. **Threads distinct from Chat vs unified surface.** Per
   `content/briefs/shells-surfaces.md` hard question #2 / decision
   pressure #3. Distinct: two surfaces, two renders. Unified: one
   collab substrate, two view modes (Threads = public/multi-actor,
   Chat = private/single-actor).
7. **DMs as a Threads kind vs a separate substrate.** As a kind:
   `Thread{kind: dm, members: [a, b]}`. Separate: a DM substrate
   with different permission gates and (potentially) different sync
   semantics. The multi-agent DM case from
   `05-fresh-context-project-app-model.md` §3 pulls toward Threads
   parity.

## Cross-references

- `content/vapps/threads-server.md` — the 300-500 word stance
  (sibling, do not modify)
- `ARCHITECTURE.md` — seven-layer stack, `collab/supervisor (NEW —
  substrate TBD)`, surface candidates including "Discord (read-only
  mirror first per Q6)"
- `DESIGN_PRINCIPLES.md` — P1 (authority before surface), P3
  (workspace state durable), P6 (local before distributed), P9
  (collab adjacent to control), P10 (org/space first-class), and
  the "three architecture mistakes" #1 ("surfaces become the real
  state container")
- `howto/add-a-vapp.md` — pressure-check, CLI parity
- `research/parts/shells-surfaces.md` — `surfaces/discord_bridge`
  (`Subject(DiscordBridgeMsg)`), `IncomingMessage` / `PublishOut`,
  `ws_hub`, "only if Q6 says so" supervision-tree note
- `content/briefs/shells-surfaces.md` — three futures expanded,
  Cognitive Cockpit stance, hard question #2 (Threads vs Chat),
  decision pressure #3 and #4
- `research/build-steps/01-control-plane-skeleton.md`
- `research/build-steps/02-identity-registry-skeleton.md`
- `research/build-steps/05-collab-substrate-skeleton.md`
- `research/build-steps/06-surfaces-skeleton.md`
- `GLOSSARY.md` — Threads / Server, Surface, Cognitive Cockpit,
  Vault Cognitive Layer, Brain Dump, Auto-Resolve Gate, Handoff
  Envelope, Background Results Contract, Scope Advisor, MCP Gateway,
  Distributed AI Delegation, Bridge / Bridge Server, OpenClaw,
  ClaudeForge
- `OPEN_QUESTIONS.md` — Q1, Q2, Q3, Q6, Q8, Q9, Q10
- `05-fresh-context-project-app-model.md` §3 — Threads / Server frame,
  multi-agent visibility, Discord migration intent
