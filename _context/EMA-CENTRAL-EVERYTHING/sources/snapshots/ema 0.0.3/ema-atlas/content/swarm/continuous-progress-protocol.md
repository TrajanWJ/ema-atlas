# Continuous Progress Protocol

## The frame

This protocol keeps a swarm moving when more than one agent, and possibly
another orchestrator, is working in the same workspace at the same time.
It assumes there is no safe, hidden global lock. Progress is coordinated
through visible claims, explicit handoffs, and short feedback loops. If a
worker cannot make its work legible to the rest of the swarm, that work is
not yet safely in motion.

The core rule is simple: **one lane, one visible owner, one next step**.
Workers can collaborate across lanes, but they should not silently share a
lane, and they should not expand scope without recording the change where
other agents can see it.

## Lane model

A lane is a bounded stream of work with one primary owner at a time. Lanes
exist so that parallel agents can move without colliding.

Recommended lane types:

- `discovery` for reading, mapping, and deciding what matters.
- `implementation` for editing code or content.
- `verification` for tests, checks, screenshots, or validation.
- `handoff` for packaging context for the next worker.
- `recovery` for fixing drift, conflicts, or broken assumptions.
- `orchestration` for coordinating plan changes across workers.

Rules for lanes:

- A worker should hold at most one primary lane at a time.
- A lane claim should name the exact files, folders, or artifacts in scope.
- If two workers need the same files, they should negotiate a handoff or
  split the lane, not race.
- If another orchestrator is already active, treat visible lane ownership as
  real unless the claim has clearly expired.

## Claims

A claim is a short, public statement that says who is doing what, where,
and for how long. Claims keep the swarm from guessing.

Every claim should include:

- owner
- lane
- target
- files or paths in scope
- current step
- refresh time or expiry
- blocker, if any

Use a claim when:

- starting a new lane
- changing the goal of an active lane
- taking over work after a handoff
- returning after a pause that may have gone stale

Suggested claim format:

```md
Claim: <owner> | Lane: <lane>
Scope: <exact files or artifact names>
Goal: <what will be true when this lane is done>
Next: <current step>
Refresh by: <time or interval>
Blocker: <none or short note>
```

Claims should be short and honest. If the work is uncertain, say so. A weak
claim is better than an implied one.

## Handoffs

A handoff is the moment a lane changes hands or leaves the current worker's
control. Handoffs should happen before the worker exits a lane, not after the
fact.

Use a handoff when:

- the lane is done
- the lane is blocked and someone else can continue
- the lane drifts outside its original scope
- another worker will finish verification or cleanup

Every handoff should include:

- what changed
- what remains open
- where the work lives
- what to verify next
- any risks or assumptions that still matter

Suggested handoff format:

```md
Handoff: <from> -> <to>
State: done | blocked | partial | waiting
Changed: <files, content, or decisions>
Open: <remaining work>
Verify: <next checks or commands>
Notes: <risks, dependencies, or context>
```

If another orchestrator is involved, the handoff must be visible in the
workspace before the work is treated as transferred.

## Protected zones

Protected zones are areas a worker should not touch without a visible reason
to do so.

Examples:

- files already claimed by another worker
- generated output that another worker is validating
- scope belonging to a different lane
- files with unresolved merge or state conflicts
- artifacts marked as fixed inputs or reference truth

If a protected zone blocks progress, do one of three things:

- ask for a handoff
- claim a different lane
- record the blocker and stop

Do not quietly edit across a protected zone. Hidden overlap is how swarms
lose trust.

## Done-when

Work is done only when the lane has a visible finish condition, not when a
worker feels finished.

A lane is done when:

- the target outcome is achieved
- the relevant files or artifacts are updated
- the result is checked or verified
- the workspace record shows the final state
- the next owner, if any, has enough context to continue

If the work creates a new open question, the lane is not fully done unless
that question is explicitly handed off or parked.

## Refresh cadence

Claims must stay fresh. A claim that is not refreshed becomes uncertain and
may be reclaimed by another worker.

Cadence rules:

- refresh after every meaningful milestone
- refresh after any scope change
- refresh after tests, failures, or blockers
- refresh at least every 15 minutes while actively editing

If a worker cannot refresh within that window, it should mark itself blocked
or hand off the lane. Silence is not ownership.

When a long command or test run is in progress, the worker should update the
workspace before starting it and again when it finishes, so other agents know
the lane is still alive.

## Drift handling

Drift is any change in the work that makes the current claim less true than it
was when written. Drift is normal; hiding it is not.

Handle drift in three steps:

1. Stop and name the drift.
2. Decide whether the lane still fits.
3. Either update the claim or hand the lane off.

Use the smaller fix when the original lane still makes sense. Re-claim when
the target changed but the ownership is still valid. Hand off when the new
shape is materially different, especially if another orchestrator or worker
would now be a better fit.

Never let drift become silent scope expansion. If the lane got bigger, say so.
If the lane got narrower, say so. If the lane is no longer the right lane,
leave it cleanly.

## Restart rules

When a worker restarts after interruption, it should assume its memory is
stale and the workspace is the source of truth.

Restart sequence:

- read the latest claims, handoffs, and notes
- check what changed since the last refresh
- inspect the exact files or artifacts in scope
- decide whether the previous claim is still valid
- reclaim or re-enter the lane explicitly

If the claim expired, do not continue as if nothing happened. Reclaim the
lane or take a new lane. If another worker advanced the work, adopt that
state instead of redoing or overwriting it.

If a restart reveals that the original plan no longer matches reality, the
worker should switch to `recovery` or `handoff` instead of pretending the old
claim still applies.

## What should be visible in the workspace

The workspace should make the swarm legible at a glance. A human or agent
should be able to see who is active, what they own, and what happens next.

At minimum, the workspace should show:

- active claims with owner, lane, scope, and refresh time
- current handoffs and who they are waiting on
- protected zones or files that are intentionally off-limits
- blockers and drift notes
- verification status for completed lanes
- the next visible action for each active lane

If the workspace does not show these things, the swarm is relying on memory
or chat, and that is too fragile for continuous progress.

## Minimal operating loop

1. Claim a lane.
2. Make the next visible change.
3. Refresh the claim.
4. Verify or record the blocker.
5. Hand off or close the lane.

This loop should be short enough that another worker can join without asking
for a private briefing.

## Practical default

If there is any doubt about ownership, prefer the safer move:

- pause before touching a protected zone
- write the claim or handoff before the next edit
- keep the lane narrow
- make the next step obvious

Continuous progress is not constant motion. It is a steady sequence of small,
visible, resumable steps that survive interruption and overlap.
