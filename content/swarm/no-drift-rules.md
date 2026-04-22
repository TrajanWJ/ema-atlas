# No Drift Rules

This document is for active EMA swarms that need to stay productive while
multiple workers, orchestrators, or reviewers are moving in the same area.
Its job is to prevent slow scope creep, hidden rewrites, and coordination
documents from replacing actual product progress.

## What counts as drift

Drift is any change that makes the current lane less true than it was when
the work started.

Common forms of drift:

- The task grows beyond the files, surfaces, or decisions that were claimed.
- A worker starts solving a nearby problem because it feels related.
- A doc, note, or plan starts getting more attention than the product work it
  is supposed to support.
- A fix turns into a redesign without a visible re-claim.
- A worker keeps editing after the scope has clearly changed.
- A handoff is implied but never written down.
- A worker spends time polishing process language instead of moving the work
  forward.

If the work no longer matches the original lane, that is drift even if the new
direction seems useful.

## Allowed moves

Workers may make small, local moves without escalating when they stay inside
the claimed lane.

Allowed moves include:

- fixing the exact issue already in scope
- making the smallest edit that unblocks the next step
- updating a note, claim, or handoff that reflects the work already done
- adding a short clarification when it prevents confusion for the next worker
- verifying the result of the current lane

Allowed moves must be narrow. If the move changes the shape of the task, it is
no longer a local move.

## When to stop

Stop immediately when any of these happen:

- the change would touch files or decisions outside the visible scope
- the current fix would require a different owner or a different skill set
- the work is still uncertain but the next edit would make it look settled
- the task is becoming documentation-heavy without clearing product blockers
- the same issue keeps reappearing in a way that suggests the lane is wrong
- another worker has already claimed the area and you do not have a handoff

When in doubt, stop earlier. Stopping is cheaper than silently expanding the
lane.

## When to hand off

Hand off instead of continuing when:

- the task has changed shape
- the remaining work is mostly verification, cleanup, or follow-up
- another worker is better suited to finish it
- the current lane is blocked by someone else’s work
- the answer depends on a decision you cannot make alone
- you have enough context to summarize the state, but not enough to finish

A good handoff should say what changed, what remains open, what should happen
next, and what risks still matter.

## How to avoid doc sprawl

Docs are useful only when they reduce friction for product work. They become
drift when they start replacing it.

Anti-sprawl rules:

- Do not create a new document when a short note in an existing place would do.
- Do not expand a rule set just because the swarm is active.
- Do not rewrite coordination text unless it changes the next move.
- Do not split one practical idea into multiple documents for status, style, or
  completeness.
- Do not keep refining the wording after the action is already clear.
- Do not treat metadata, commentary, or process logs as progress unless they
  directly unblock the product work.

If a document is not helping someone move faster, it is probably growing in the
wrong direction.

## Progress test

Before adding more process, ask:

- Does this make the next implementation, review, or decision easier?
- Could the same result be achieved with a smaller note or a handoff?
- Is this solving the task, or only describing the task better?
- Would another worker know what to do next because of this change?

If the answer is no, stop editing the process and return to the lane.

## Practical loop

Use this loop whenever drift shows up:

1. Name the drift in one sentence.
2. Decide whether the lane still fits.
3. Make the smallest valid move or hand off.
4. Record only what another worker needs to continue.
5. Return to product work as soon as the path is clear.

## Default rule

If you are unsure whether a move is drift, treat it as drift until it proves
otherwise.

