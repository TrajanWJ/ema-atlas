# Orchestration Kernel

This is the simplest control model for an active EMA swarm.

If the swarm starts feeling muddy, fall back to this.

## Core rule

- one active objective
- one main write lane
- one lead orchestrator
- support lanes only around the main lane
- all movement visible through claims and handoffs

This is the anti-chaos baseline. If the swarm cannot describe itself in those
terms, it is too fragmented.

## Roles

### Lead orchestrator

Owns:

- current objective
- lane split
- who owns the main write lane
- when support lanes are useful
- when a lane should stop, split, or hand off

Does not own:

- every file
- every implementation detail
- private truth

### Main lane owner

Owns:

- the primary artifact or route in motion
- the final substance of the current deliverable
- the main handoff when that lane pauses or finishes

Does not own:

- surrounding repo hygiene
- broad architecture cleanup
- every nearby improvement

### Support lane owners

Own:

- alignment
- context curation
- repo hygiene
- handoff packaging
- verification

Do not own:

- the main deliverable substance
- broad redesign
- hidden fixes inside the main lane

## Lane stack

Every wave should be explainable as:

1. `main`
   - the one lane that directly advances the current deliverable
2. `support`
   - zero to five narrow lanes that reduce friction around `main`
3. `recovery`
   - temporary lane only when drift, conflict, or blockage appears

If there are multiple lanes directly changing the same deliverable, the swarm is
probably over-splitting or drifting.

## Control loop

1. Name the objective.
2. Name the main lane.
3. Name the main lane owner.
4. Create only the support lanes that are actually needed.
5. Keep claims current.
6. Kill or hand off stale lanes quickly.
7. End with one main handoff, not many competing stories.

## Default lane policy

- If a lane changes product substance, it is probably `main`.
- If a lane only makes the next move easier, it is `support`.
- If a lane exists only because the swarm got confused, it is `recovery`.

## When orchestration is getting worse

Warning signs:

- too many active lanes with unclear ownership
- support lanes quietly rewriting the main artifact
- new docs appearing faster than product movement
- workers reading huge amounts of context before acting
- multiple orchestrators solving the same ambiguity in parallel
- no one can say what the one current objective is

## Reset move

When the swarm feels off:

1. stop opening new lanes
2. restate the one active objective
3. name the one main write lane
4. reduce support lanes to only the useful ones
5. hand off or close everything else

Better orchestration is usually subtraction, not addition.
