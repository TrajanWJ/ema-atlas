# Orchestrator Alignment

## The frame

This document is for multiple orchestrators and supervisor agents working
against the same EMA swarm workspace at the same time. The goal is not
to eliminate parallelism; the goal is to keep parallelism from turning
into silent divergence. When more than one agent is moving, the shared
workspace only stays useful if everyone treats the same artifacts as
canonical, publishes movement in a predictable way, and refuses to
overwrite another actor's work as a shortcut.

The alignment rule is simple: **EMA owns truth, Hermes owns execution,
surfaces do not own state**. In swarm terms, that means no orchestrator
gets to invent its own version of the world. A supervisor may plan,
route, compare, and reconcile, but it does not get to quietly fork the
record. If something is not shared, it is not coordination data yet.

## What must be shared

The following things must be visible to every active orchestrator and
supervisor working the workspace:

- Current swarm state, including who is active, who owns which lane or
  responsibility, and what movement is in progress.
- Active task or workstream intent, so two orchestrators do not race to
  solve different interpretations of the same objective.
- Handoffs, claims, relinquishments, and blocked items.
- Canonical artifacts that describe authority, scope, and ordering.
- Conflict notes, so the system remembers that disagreement happened
  even after the immediate move is settled.

If a piece of context changes the next move, it must be placed where the
other orchestrator can see it without asking for private backchannel
knowledge. Hidden state is how two well-intentioned agents drift apart
while both believe they are following the same plan.

## What stays canonical

These are the sources that should be treated as the record of truth for
swarm coordination:

- The shared swarm status and session maps.
- The handoff record and any explicit ownership transfer.
- The current canonical plan or directive for the workstream.
- The latest agreed conflict resolution, including who yielded and why.
- Any supervisor-issued constraint that changes what another agent may
  do next.

Interpretation layers, scratch notes, temporary drafts, and local
working memory are not canonical. They are useful only until they are
promoted into the shared record. If two agents disagree, the canonical
artifact wins over the local recollection every time.

## How divergence starts

Divergence usually appears in one of four ways:

1. Two orchestrators read the same workspace at different times and both
   assume they are still seeing the latest state.
2. One agent treats an inferred intention as if it were a shared
   commitment.
3. A supervisor updates its own plan but never publishes the resulting
   constraint to the shared record.
4. An agent responds to a partial conflict by resetting its own view
   instead of reconciling with the other actor's movement.

The fix is not more confidence. The fix is tighter publication
discipline: mark claims, mark transfers, mark uncertainty, and update
the shared record before acting on the next assumption.

## How to avoid divergence

- Read the shared record before making a move, even if you think you
  already know the answer.
- Announce scope before editing, especially when the change might touch
  shared coordination artifacts.
- Prefer additive updates over silent replacement.
- Record uncertainty instead of flattening it into a false certainty.
- Treat another active orchestrator as a collaborator unless it has
  explicitly ceded the lane.
- If your move depends on a new interpretation, write that interpretation
  down where the other actor can challenge it.

The practical rule is that a supervisor should never be surprised by
its own concurrency. If another agent could plausibly be making the same
move, assume it is happening until the shared state proves otherwise.

## How to interact with another active orchestrator

When another orchestrator is active, interaction should be explicit and
short:

1. Announce the lane or subject you are touching.
2. State whether you are observing, proposing, claiming, or yielding.
3. Name the artifact you expect to change.
4. Wait for a visible acknowledgement when the move is exclusive.
5. Publish the result back into the shared record as soon as the move is
   complete.

If the other orchestrator is already in motion, do not jump past them
with a parallel rewrite. First determine whether the work is truly
independent. If it is independent, note the separation. If it is not,
negotiate a handoff or a split of scope before either side continues.

## How to resolve conflicting movement

Conflicts should be resolved by reconciliation, not by destructive
reset. The preferred order is:

1. Compare what each orchestrator believes is true.
2. Identify the shared artifact or claim that actually conflicts.
3. Decide whether one side should yield, both sides should merge, or the
   work should be split into separate lanes.
4. Update the shared record with the chosen resolution.
5. Only then continue execution from the resolved state.

Never solve a conflict by deleting history, wiping a workspace, or
rewinding another agent's legitimate work. If movement already happened,
preserve it as evidence and reconcile forward. A destructive reset hides
the disagreement instead of resolving it, and hidden disagreement is the
fastest way to create duplicate effort and corrupted authority.

When the right answer is unclear, pause and mark the state as contested.
That is not failure. It is the honest shape of a multi-actor workspace
that has not yet converged.

## Operating contract

- Share what changed.
- Canonicalize what matters.
- Yield when another orchestrator already owns the active move.
- Reconcile forward instead of resetting backward.
- Keep the shared record ahead of the local story.

If every active agent follows that contract, the swarm can move in
parallel without losing its ability to agree on what happened.
