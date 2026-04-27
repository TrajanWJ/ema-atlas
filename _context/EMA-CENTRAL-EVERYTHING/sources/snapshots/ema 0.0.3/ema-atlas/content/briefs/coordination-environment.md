# Coordination / Agent Environment

## The frame

Coordination is the part of EMA that turns "many actors moving at once"
into a thing humans can stay on top of. Lanes, tasks, queues, handoffs,
checkups, weekly phases, focus blocks, and the self-paced virtual
calendar all live here. The canonical rule pulls hard at this layer:
**EMA owns truth, Hermes owns execution, surfaces do not own state.**
A planner board is an extremely tempting place for a surface to start
holding its own version of "who is doing what" — but the moment that
happens, the swarm and the board disagree, and the board loses authority.
Coordination is meant to be the rendered form of control-plane facts
about lane ownership, dispatch state, and handoff status — not its own
parallel system.

The shape is partway built. The filesystem swarm at
`code/ema/workspace/shared/swarm/` already tracks current state, session
maps, and implementation state with explicit dates. The actor cards name
specific agents (`claude-a1` through `claude-a9`, `codex-a6` through
`codex-a10`, `hermes-a4`, `hermes-a5`) — not roles, but instances.
Handoffs have their own directory and INDEX. Inside the daemon, the
babysitter family already does ticking, routing, takeover, and channel
management; the control-plane dispatch reconciler exists. There is a
governance/queue spec but no queue process yet. The open question is not
whether EMA can coordinate — it is — but how formal the dispatch should
feel, how much of it should run as ambient maintenance, and how much
autonomy personal AI should have inside the planner surface.

## What's already true

- The swarm has a tracked, dated state in
  `codebase-ema/code/ema/workspace/shared/swarm/CURRENT_STATE_2026-04-21.md`,
  `codebase-ema/code/ema/workspace/shared/swarm/IMPLEMENTATION_STATE_2026-04-21.md`,
  and `codebase-ema/code/ema/workspace/shared/swarm/SESSION_MAP_2026-04-21.md`.
- Actors are explicitly enumerated, not abstract:
  `codebase-ema/code/ema/workspace/shared/actors/claude-a1.md` through
  `claude-a9.md`, `codex-a6.md` through `codex-a10.md`, plus
  `hermes-a4.md` and `hermes-a5.md`.
- Handoffs have their own substrate at
  `codebase-ema/code/ema/workspace/shared/handoffs/INDEX.md` and
  `codebase-ema/code/ema/workspace/shared/handoffs/README.md`.
- The babysitter family already runs ticking, routing, takeover, and
  channel management:
  `codebase-ema/code/ema/daemon/lib/ema/babysitter/chain_scheduler.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/babysitter/command_router.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/babysitter/takeover_manager.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/babysitter/tick_router.ex`,
  `codebase-ema/code/ema/daemon/lib/ema/babysitter/tick_renderer.ex`.
- Dispatch reconciliation lives in the control plane:
  `codebase-ema/code/ema/daemon/lib/ema/control_plane/dispatch_reconciler.ex`.
- A governance/queue spec is written but unimplemented:
  `codebase-ema/code/ema/docs/REVIEW-GOVERNANCE-QUEUE-SPEC.md`, with
  related daemon-wiki notes at
  `codebase-ema/code/ema/docs/daemon-wiki/HANDOFF.md` and
  `codebase-ema/code/ema/docs/daemon-wiki/GOVERNANCE.md`.

## What's still open

- **Q1** — without first-class agent identity, lane claims and handoffs
  attribute to filenames rather than principals; this is fine for two
  humans and three agents, fragile at ten.
- **Q3** — Project ↔ Space cardinality decides whether a planner board
  spans projects or strictly belongs to one.
- **Q5** — harness contract surface controls how a "task dispatched" event
  appears in the planner; weak contract means weak rendering.
- **Q6** — Discord mirror direction matters here because the planner is
  the most natural surface to mirror; bidirectional coordination has
  very different governance from a one-way mirror.
- **Q10** — runtime/tool permissions versus org/space permissions
  determines whether "personal AI may move my tasks" is a single check
  or a policy bundle.

## The three futures, expanded

### Coordination as Air-Traffic Control (operator-cathedral)

In this future the planner is a control room. Lanes are explicit and
claimed. Handoffs are formal events recorded in
`dispatch_reconciler.ex` and `event_log.ex`. Drift audits run on a
schedule; nothing ambiguous is allowed to sit. The current
`REVIEW-GOVERNANCE-QUEUE-SPEC.md` and `daemon-wiki/HANDOFF.md` already
imply this stance — the planner is a queue with discipline, not a
suggestion.

**What this would force you to build first**
- A real lane object with explicit ownership and lease semantics, built
  on top of the existing actor cards.
- A handoff command in `command.ex` that no surface can bypass — you
  cannot transfer ownership by editing a markdown file.
- A drift detector running on top of `dispatch_reconciler.ex` that
  surfaces "claimed but inactive" and "active but unclaimed" lanes.

**What this would force you to give up**
- Lightweight, "I'll just pick this up" handoffs; every transfer is a
  recorded event with an actor and a timestamp.
- Some swarm velocity — the most ad-hoc reroutes get blocked behind a
  command, and small tasks pay the same dispatch tax as large ones.

**Smallest provable slice (2 weeks):** one lane, one handoff. A lane
exists as a typed object owned by an actor card, the only way to
transfer it is via a `Handoff` command on `command.ex` that produces an
`event_log.ex` entry, and the `tick_renderer.ex` shows current owner
and last-handoff time. Everything else stays informal.

### Coordination as Living Studio (living-workspace)

The studio version treats coordination as a generative, collaborative
environment rather than a queue with timestamps. The planner, queue,
calendar, and checkups feel like companions: they suggest, they prompt,
they remind, but they do not enforce. Friction is low, the
emotional register is creative rather than operational, and the price
is that load and slippage can hide until they are painful.

**What this would force you to build first**
- A planner surface that reads from the swarm's existing INDEX files
  and `tick_router.ex` stream and renders a single living view, not a
  spreadsheet.
- An honest "what did I commit to this week" projection on top of the
  weekly phase model — generative tone, brutal numbers underneath.
- A checkup system that runs as ambient maintenance via
  `babysitter/chain_scheduler.ex` and produces gentle prompts rather
  than blocking dialogs.

**What this would force you to give up**
- Hard SLA-style accountability; the system reports, it does not
  enforce.
- A unified "queue" abstraction; you accept multiple soft surfaces over
  one underlying state.

**Smallest provable slice (2 weeks):** a "Today" view that renders
current swarm state from `swarm/CURRENT_STATE_*.md` and live tick
events from `babysitter/tick_router.ex` as one calm feed, with
inline commit/uncommit affordances for the human and read-only
visibility into agent activity. One view, two data sources, no new
storage.

### Coordination as Mesh Negotiation (mesh-commonwealth)

In this future coordination is a routing layer. Responsibilities,
cadence, and workloads route across peers and agents based on capacity,
capability, and policy. The planner is less a board and more a
negotiator surface: "I have this work, who can take it?" The actor
cards become advertisements; the queue becomes a market. This is the
hardest path because every smart routing decision needs a permission
story attached.

**What this would force you to build first**
- A capability advertisement on each actor card — what an agent can do,
  on which projects, with which limits.
- A routing engine extending `babysitter/command_router.ex` that can
  consider remote actors, not only local ones.
- A clear "ask before optimizing" boundary: which scheduling decisions
  the system makes silently and which require explicit consent.

**What this would force you to give up**
- The intuition that the user is the only scheduler; some allocation
  decisions stop being human-initiated.
- Simplicity in the planner UI; the surface has to explain *why* a task
  landed where it did.

**Smallest provable slice (2 weeks):** two daemons, one shared queue,
one routed task. A task posted on daemon A is offered to actor cards on
both daemons via capability match, the assignment is recorded in
`event_log.ex` on both sides, and the planner shows "routed to remote
actor" with an explicit consent step before dispatch. One task, one
route, one consent.

## Decision pressure

1. **Lane vs task as primary.** Lane: long-lived ownership, implicit
   tasks. Task: discrete units, ownership reassigned per task.
   Different planner UIs, different drift modes.
2. **Handoffs as commands vs handoffs as conventions.** Commands
   (`command.ex` event): enforced, auditable, slower. Conventions
   (markdown in `handoffs/`): zero friction, easy to forget.
3. **Checkups as rituals vs notifications vs ambient.** Rituals: real
   reflection, expensive. Notifications: timely, easily dismissed.
   Ambient (`tick_router.ex`-driven): always on, easy to ignore until
   they're not.
4. **Personal AI as planner participant vs planner observer.**
   Participant: it can move tasks, claim lanes, post handoffs; depends
   entirely on Q10. Observer: it can suggest only; safer, less useful.
5. **One queue per project vs one queue per actor vs one global queue.**
   Per project: clean scoping. Per actor: clean accountability. Global:
   easy routing, ugly scoping.
6. **Calendar as derived view vs calendar as source.** Derived from
   lanes and tasks: always consistent, less expressive. Source of
   truth: people can plan in time directly, but you fight reconciliation
   against the queue.

## Read next

- `graph/nodes/lineage-openclaw-agent-workspaces.qmd`
- `graph/nodes/codebase-executive.qmd`
- `graph/nodes/design-review-fresh-context.qmd`
- `graph/edges/orchestration.md`
- `graph/edges/workspace.md`
- `graph/edges/authority.md`
- `codebase-ema/code/ema/docs/REVIEW-GOVERNANCE-QUEUE-SPEC.md`
- `codebase-ema/code/ema/docs/EMA_AGENT_CLI_COORDINATION_PLAN.md`
- `codebase-ema/code/ema/docs/AGENT_SHARED_WORKSPACE_ARCHITECTURE.md`
- `codebase-ema/code/ema/docs/daemon-wiki/HANDOFF.md`
- `codebase-ema/code/ema/docs/daemon-wiki/GOVERNANCE.md`
- `codebase-ema/code/ema/docs/daemon-wiki/DISPATCH.md`
- `codebase-ema/code/ema/docs/daemon-wiki/ROUTING.md`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/01-PLANS/CURRENT-PRIORITIES.md`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/01-PLANS/v1.1-EXECUTION-ROADMAP-2026-04-13.md`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/01-PLANS/VERTICAL-SLICES-DRAFT.md`
- `docs-ema-next-steps/host/EMA-v1.1-Next-Steps/07-TRACKS/TRACK-B-CONTROL-PLANE-SEED.md`
