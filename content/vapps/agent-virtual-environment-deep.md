# Agent Virtual Environment — deep brief

> Sibling to `content/vapps/agent-virtual-environment.md`. The 300-500
> word brief is the stance summary; this file is the next layer of
> pressure.

## Stance

The Agent vEnv is a **shared-workspace + control-plane projection**
vApp. In the seven-layer stack (`ARCHITECTURE.md`) it draws from two
rows simultaneously: the Shared workspace plane (P3,
`DESIGN_PRINCIPLES.md`) owns plans, queues, todos, and notes (artifacts
that live under `workspace/shared/` per `ARCHITECTURE.md`); the EMA
control plane owns dispatches, executions, schedule events, checkup
records, and lane ownership (per the babysitter and
`execution_supervisor` subtrees in `ARCHITECTURE.md`). The vEnv renders
both planes side by side from an agent's first-person perspective. No
other vApp draws this combination; Wiki is collab+control, Chat is
runtime+control, Threads is collab+control. The vEnv is the
workspace+control vApp.

Under the canonical rule — *EMA owns truth. Hermes owns execution.
Surfaces do not own state.* — the vEnv occupies the most tempting
position to violate it. A planner board with a calendar and a queue is
the historical home of "let me just track this in the surface for
now." `content/briefs/coordination-environment.md` is explicit: "A
planner board is an extremely tempting place for a surface to start
holding its own version of 'who is doing what' — but the moment that
happens, the swarm and the board disagree, and the board loses
authority." The Elixir lineage already proved schedule/queue/checkup
state can ride the babysitter family
(`codebase-ema/code/ema/daemon/lib/ema/babysitter/{chain_scheduler,
command_router,takeover_manager,tick_router}.ex`); the Gleam port keeps
that arrangement and adds typed `Lane` and `Handoff` objects
(`research/parts/coordination-environment.md`).

The vApp is also the surface where agent autonomy gets a *shape*. Per
existing `content/vapps/agent-virtual-environment.md`: "treats agent
autonomy as something with shape and rhythm rather than as anonymous
job execution." Weekly phases, focus blocks, scheduled checkups, and
queue priorities are the agent's first-person experience of the
control plane. The **Auto-Resolve Gate** (vault candidate,
`GLOSSARY.md`) lives here: a queue item with confidence ≥ 0.85 plus
vault precedent + preferences + corrections passes the gate and is
resolved silently. The **Honcho Scope Advisor** (vault candidate)
reads the responsibilities list to advise pre-dispatch scope on
inbound work (per existing brief).

The vEnv presupposes Q1 (`OPEN_QUESTIONS.md` — agent identity model)
more directly than any other vApp. Per
`research/parts/coordination-environment.md`: "without Q1, every agent
owner is a `HumanActor(MemberId)` placeholder and drift attribution is
wrong." A vEnv where lane ownership and schedule blocks attribute to a
human proxy is not a vEnv; it is a human's planner with the agent's
name in a comment field.

## Object model

Objects the vEnv renders (none owned canonically — all references
trace to either Workspace or Control plane owners):

- **Lane** — long-lived ownership unit, `Lane(id, project, name,
  owner: Actor, lease_until_ms: Option(Int), status: LaneStatus)` per
  `research/parts/coordination-environment.md`. Lives in
  `coordination/lane_registry` (Control plane via `command_bus`).
  `LaneStatus = Open | Claimed | Stalled | Retired`.
- **Task** — discrete unit of work, `Task(id, lane, title, assignee:
  Option(Actor), state: TaskState, created_at_ms)`.
  `TaskState = Queued | InProgress | Blocked | Done | Dropped`.
  Control plane.
- **Queue item** — projection over `Task` records filtered by assignee
  with priority + Auto-Resolve Gate confidence score (per existing
  `agent-virtual-environment.md`).
- **Handoff** — `Handoff(id, lane, from: Actor, to: Actor, note,
  at_ms)`. Lives in `event_log` via `coordination/handoff_log` per
  `research/parts/coordination-environment.md`. Wrapped in the
  **Handoff Envelope** (vault candidate — status, confidence,
  completeness, provenance).
- **Schedule block** — self-dictated calendar entry. Kinds: focus,
  queue work, checkups, social, idle (per existing brief). Emits a
  `ScheduleEvent` to the control plane on every put/move (per existing
  brief).
- **Tick** — `Tick(at_ms, kind: TickKind)`. Kinds: `Cadence |
  Heartbeat | Drift | Checkup` per
  `research/parts/coordination-environment.md`. Lives on the
  `babysitter/tick_router` Subject.
- **Checkup record** — review artifact promoted to a shared chronicle
  entry (per existing brief). Lives on Workspace
  (`workspace/shared/checkups/`); lineage on Control.
- **Responsibility** — owned lane lease with current SLA. Projection
  over `Lane` records filtered by owner.
- **Note / Todo** — workspace artifacts authored by the agent, per
  existing brief. Live on Workspace plane.
- **Weekly phase header** — projection over `ScheduleEvent` records
  filtered by week + a workspace artifact for the phase intent.

Objects the vEnv does *not* render: live chat sessions (Chat vApp),
wiki nodes (Wiki vApp), threads (Threads vApp), executions (rendered
as references inside checkup reviews only).

## Three futures (deepening the universal stances)

### Operator Cathedral — *Air-Traffic Control*

The vEnv is a control room. Lanes are explicit objects with leases.
Handoffs are formal `command_bus` events; you cannot transfer
ownership by editing markdown (per
`content/briefs/coordination-environment.md` — "you cannot transfer
ownership by editing a markdown file"). The Auto-Resolve Gate is
strict: a passing decision still emits an audit event so the human
can review post-hoc. Drift detector
(`babysitter/takeover_manager` per
`research/parts/coordination-environment.md`) actively reclaims
stalled lanes.

- **Bet:** that swarms scale only with discipline. Ten agents need
  formal handoffs; two agents and three humans can wing it but the
  system has to be ready when the swarm grows.
- **Tension:** ceremony tax. Every handoff is a command. Small
  reroutes pay the same dispatch cost as large ones (per
  `coordination-environment.md` decision pressure #2).
- **Question:** how much of OpenClaw doctrine carries forward as
  enforcement vs as guidance? The `GOVERNANCE-QUEUE-SPEC.md` lineage
  pulls toward enforcement; the daemon-wiki pulls toward guidance.

### Living Workspace — *Living Studio*

The vEnv is a companion. The planner, queue, calendar, and checkups
suggest, prompt, remind — but do not enforce. Friction is low; the
emotional register is creative, not operational. Per
`content/briefs/coordination-environment.md`: "the system reports, it
does not enforce." Auto-Resolve Gate is generous; checkups are
ambient. The agent's first-person view feels like a quiet workspace
rather than a dashboard.

- **Bet:** that adoption depends on the surface feeling
  *inhabitable*. An agent who feels like they *live* in the vEnv will
  use it; an agent given a queue will resent it.
- **Tension:** load and slippage hide until painful. The drift
  detector exists but doesn't act; the "what did I commit to this
  week" projection has to be brutally honest under a generative tone.
- **Question:** if the vEnv is calm by default, who notices when an
  agent stalls? The `babysitter/takeover_manager` either acts (and
  the calm dies) or doesn't act (and the swarm forgets the stalled
  lane).

### Mesh Commonwealth — *Mesh Negotiation*

The vEnv is a routing surface. Responsibilities, cadence, workloads
route across peers and agents based on capacity, capability, policy
(per `coordination-environment.md`). The actor cards become
advertisements; the queue becomes a market. **Distributed AI
Delegation** (vault candidate) is the mechanism: a peer's vEnv can
accept work from yours under capability lease.

- **Bet:** that the vEnv is the right surface for peer-aware
  scheduling, because scheduling is the most natural place to accept
  "this is going to a remote peer" friction.
- **Tension:** Q9 deferred until Q1/Q2/Q3 settle (P6,
  `DESIGN_PRINCIPLES.md`). Q10 (org/space → runtime permissions)
  blocking. Per `coordination-environment.md` Q10 note: "every
  `Handoff` command is accepted on actor identity alone" without Q10.
- **Question:** when a peer's agent claims your lane via the market,
  does the lease record live in your `event_log` or theirs or both?
  P10 (`project_id` on every record) makes the cross-shard accounting
  explicit but does not answer it.

## What humans do here

1. **Watch any agent's vEnv as a read-only second-person view.**
   Artifact: none. Control-plane records: `VEnvViewed{agent_id, by,
   at_ms}` (audit only). Presupposes Q1 (so the watched agent is a
   first-class identity, not a service principal).
2. **Insert a checkup invite.** Artifact: a `ScheduleEvent` and a
   workspace artifact under `workspace/shared/checkups/`.
   Control-plane records: `ScheduleEvent` per existing brief and
   `CheckupProposed{by, participants, when}`. Presupposes Q3 for
   workspace path resolution and Q10 for permission to schedule on
   another actor's vEnv.
3. **Reassign a queue item.** Artifact: a modified `Task.assignee`.
   Control-plane record: `Handoff{lane, from, to, note}` per
   `research/parts/coordination-environment.md`. Wrapped in a
   **Handoff Envelope**. Presupposes Q1.
4. **Change a responsibility.** Artifact: a `Lane.owner` change.
   Control-plane record: `Handoff` (the responsibility *is* the
   lane). Presupposes Q1 + Q10.
5. **Approve / reject an Auto-Resolve Gate decision after the fact.**
   Artifact: a `GateDecision{queue_item, by, decision}` review.
   Control-plane record: `GateReviewed{queue_item, by, decision}`.
   Presupposes the Auto-Resolve Gate is implemented (vault candidate)
   and the post-hoc review queue exists.
6. **Pull an agent's notes into the wiki.** Artifact: a new
   `WikiNode` per the Wiki vApp. Control-plane record:
   `WorkspaceToWiki{from_artifact, to_node_id}`. Presupposes Q2
   (collab substrate for wiki nodes).
7. **Schedule a 1:1 with an agent.** Artifact: a paired `ScheduleEvent`
   on both vEnvs. Control-plane record: `ScheduleEvent` × 2 plus a
   `MeetingProposed{participants, when}`. Presupposes Q1 + Q10.

## What agents do here via CLI

Parity with the human surface is required (`howto/add-a-vapp.md`).
This vApp is *especially* CLI-first — it is the agent's own
first-person environment.

1. **`ema venv schedule put --start --end --kind --intent`**
   (existing). Same as a human-side schedule entry. Control-plane:
   `ScheduleEvent`. The **Scope Advisor** (vault candidate) may
   pre-suggest the `intent` based on Honcho-modeled context plus the
   responsibilities list.
2. **`ema venv queue claim <item> --confidence`** (existing). The
   confidence value feeds the **Auto-Resolve Gate** (vault candidate,
   ≥ 0.85). If the gate passes (vault precedent + preferences +
   corrections + confidence), the agent resolves silently; if it
   fails, escalates to human review. Control-plane:
   `QueueClaimed{item, by, confidence, gate_outcome}`.
3. **`ema venv checkup propose --participants --topic --when`**
   (existing). Same as human #2. Produces the same artifacts.
4. **`ema venv responsibility take --lane --until`** (existing). Same
   as human #4 (a self-claim of a lane). Control-plane: `Handoff`
   with `from = system | prior_owner`, `to = self`. Presupposes Q1.
5. **`ema venv note add --body --tag` (workspace-shaped)** (existing).
   Workspace artifact under `workspace/shared/notes/<agent_id>/`.
   No control-plane record beyond `WorkspaceWritten`. Presupposes Q3.
6. **`ema venv handoff <lane> --to <agent_id> --envelope <file>`**
   (extension). Required CLI for **Handoff Envelope** (vault candidate
   — "required metadata header on every agent-to-agent handoff
   carrying status, confidence, completeness, and provenance").
   Control-plane: `Handoff` event. The envelope itself rides as a
   structured field on the event.
7. **`ema venv result deliver --to-session <id> --payload <file>`**
   (extension). Async result delivery via the **Background Results
   Contract** (vault candidate XML wrapper). Used when a vEnv-owned
   queue item's resolution needs to re-enter a live Chat session.
8. **`ema venv heartbeat`** (extension). Emits a `Tick{kind:
   Heartbeat}` to `babysitter/tick_router`. Without this, the
   **takeover_manager** falls back to wall-clock-only deadlines per
   `research/parts/coordination-environment.md` Q5 note. This is the
   vEnv's contribution to drift detection.
9. **`ema venv responsibility advise`** (extension). Calls the
   **Scope Advisor** (vault candidate Honcho hook) for advice on
   whether to take a lane offered to the agent.

## Smallest provable v0.0.3 slice

**Scope:** read-only daily timeline view over the existing dispatch
event log, per existing `agent-virtual-environment.md` ("The smallest
provable slice is a read-only daily timeline view over the existing
dispatch event log. Build that first; the planning surface comes
after."). This deep brief honors that scoping.

**2-week acceptance criteria for the read-only timeline wedge:**

1. The `Lane`, `Task`, `Handoff`, `Tick` types from
   `research/parts/coordination-environment.md` exist in the Gleam
   tree (types only; the typed-but-loose markdown under
   `workspace/shared/swarm/` becomes the seed data).
2. `coordination/lane_registry` (`Subject(LaneRegistryMsg)`, per
   `coordination-environment.md`) holds lanes for one project.
3. The vEnv vApp renders one agent's daily timeline via a typed
   projection over `event_log` (filter by `agent_id` + day). Surface
   contains zero in-memory queue state and zero schedule storage —
   per existing `agent-virtual-environment.md` ("The vEnv code holds
   no in-memory queue state and no schedule storage of its own").
4. `babysitter/tick_router` is wired and the vEnv subscribes; ticks
   appear in the timeline.
5. The "Today" view from `content/briefs/coordination-environment.md`
   Living Workspace slice — render current swarm state from
   `swarm/CURRENT_STATE_*.md` + live tick events. Read-only.
6. Surface-restart test (per `research/parts/shells-surfaces.md`):
   kill the surface, restart, timeline rehydrates from `event_log`
   + `lane_registry`.
7. Property test from `coordination-environment.md`: for any sequence
   of `Enqueue`/`NextFor` calls on `chain_scheduler`, every enqueued
   `(lane, task)` is returned exactly once.

**Build-step dependencies:**

- `research/build-steps/01-control-plane-skeleton.md` — `event_log`,
  `command_bus`. Required for `ScheduleEvent`, `Handoff`,
  `QueueClaimed`, all vEnv-emitted events.
- `research/build-steps/02-identity-registry-skeleton.md` —
  `Member`/`Agent`. **Load-bearing dependency** — without an `Actor`
  type that distinguishes agents from humans, `Lane.owner` and
  `Handoff.{from,to}` are meaningless.
- `research/build-steps/04-sessions-and-babysitter.md` — sessions and
  the babysitter family (`chain_scheduler`, `takeover_manager`,
  `tick_router`, `command_router`). **Load-bearing.**
- `research/build-steps/06-surfaces-skeleton.md` — mist + wisp HTTP/WS,
  `ws_hub` for tick subscription.

**Explicitly deferred:** the writeable planning surface (per existing
brief — "the planning surface comes after"), Auto-Resolve Gate
implementation, Handoff Envelope structured field, checkup workflow
end-to-end, peer-aware mesh routing (Q9), Honcho Scope Advisor
integration, Brain Dump intake.

## Decision pressure unique to this vApp

1. **Lane vs Task as primary unit.** Per
   `content/briefs/coordination-environment.md` decision pressure #1.
   Lane: long-lived ownership, implicit tasks, drift modes track lane
   ownership. Task: discrete units, ownership reassigned per task,
   drift modes track task progress. Different planner UIs.
2. **Handoffs as commands vs handoffs as conventions.** Per
   `coordination-environment.md` decision pressure #2. Commands
   (`command_bus` event): enforced, auditable, slower. Conventions
   (markdown in `workspace/shared/handoffs/`): zero friction, easy to
   forget, P3 violation risk if the markdown becomes the truth.
3. **Auto-Resolve Gate strict vs generous.** Strict: confidence ≥ 0.95,
   vault precedent required, every passing decision audit-logged.
   Generous: confidence ≥ 0.7, optional precedent, audit on
   contradiction only. The vault definition (≥ 0.85,
   `GLOSSARY.md`) sits in the middle; this vApp must pick.
4. **Checkups as rituals vs notifications vs ambient.** Per
   `coordination-environment.md` decision pressure #3. Rituals:
   real reflection, expensive. Notifications: timely, easily
   dismissed. Ambient (`tick_router`-driven): always on, easy to
   ignore until they're not.
5. **Personal AI as planner participant vs observer.** Per
   `coordination-environment.md` decision pressure #4. Participant:
   it can move tasks, claim lanes, post handoffs (depends entirely
   on Q10). Observer: it can suggest only (safer, less useful).
6. **Calendar as derived view vs calendar as source.** Per
   `coordination-environment.md` decision pressure #6. Derived from
   lanes/tasks: always consistent, less expressive. Source: people
   plan in time directly, fight reconciliation against the queue.
7. **One queue per project vs per actor vs global.** Per
   `coordination-environment.md` decision pressure #5. Per project:
   clean scoping. Per actor: clean accountability. Global: easy
   routing, ugly scoping. The vEnv view is per-actor by default;
   the underlying queue substrate may differ.
8. **Heartbeat from agent CLI vs from driver.** From CLI (`ema venv
   heartbeat`): explicit, agent decides cadence. From driver
   (per Q5 — `Tick.kind = Heartbeat` from the harness): implicit,
   automatic, fails when Q5 is unsettled per
   `coordination-environment.md` Q5 note.

## Cross-references

- `content/vapps/agent-virtual-environment.md` — the 300-500 word
  stance (sibling, do not modify)
- `ARCHITECTURE.md` — seven-layer stack, babysitter and
  `execution_supervisor` subtrees, identity registry, the existing
  Elixir babysitter family at
  `lineage-original-elixir-ema/code/daemon/lib/ema/babysitter/`
- `DESIGN_PRINCIPLES.md` — P1, P3 (workspace state durable), P6
  (local before distributed), P10 (org/space first-class)
- `howto/add-a-vapp.md` — pressure-check, CLI parity (especially
  important here)
- `research/parts/coordination-environment.md` — `Lane`, `Task`,
  `Handoff`, `Tick`, `LaneStatus`, `TaskState`, `TickKind`, actor
  sketches, `coordination/supervisor` boots after
  `control_plane/supervisor`, test list, Q1/Q3/Q5/Q6/Q10 mapping
- `content/briefs/coordination-environment.md` — three futures
  expanded (Air-Traffic Control, Living Studio, Mesh Negotiation),
  decision pressure list #1–#6
- `research/build-steps/01-control-plane-skeleton.md`
- `research/build-steps/02-identity-registry-skeleton.md`
- `research/build-steps/04-sessions-and-babysitter.md`
- `research/build-steps/06-surfaces-skeleton.md`
- `GLOSSARY.md` — Babysitter, Capability locality, Personal AI,
  Auto-Resolve Gate, Handoff Envelope, Background Results Contract,
  Honcho, Scope Advisor, Vault Cognitive Layer, Brain Dump,
  Cognitive Cockpit, Distributed AI Delegation, OpenClaw
- `OPEN_QUESTIONS.md` — Q1, Q3, Q4, Q5, Q6, Q9, Q10
- `05-fresh-context-project-app-model.md` §4 — Agent virtual
  environment app frame
- `codebase-ema/code/ema/docs/REVIEW-GOVERNANCE-QUEUE-SPEC.md` —
  governance/queue spec lineage
- `codebase-ema/code/ema/workspace/shared/swarm/` — current
  filesystem swarm state (seed data for the v0.0.3 wedge)
