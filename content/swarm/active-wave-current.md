# Active Wave

## Objective

- Advance one real EMA deliverables lane that makes the product vision more legible without drifting into meta-work.
- What must be more true at the end of this wave:
  - EMA should be easier to see as a real shared human-agent workspace through concrete deliverables.

## Main Lane

- owner: Claude deliverables orchestrator
- lane name: `main-deliverables`
- authority note:
  - the lead orchestrator approves the lane boundary for this wave; Claude chooses one deliverable inside that approved boundary and claims it before editing
- exact scope:
  - one narrow deliverables lane chosen by Claude after a visible claim
  - Claude must pick exactly one category for the wave:
    - HQ / Launchpad / Virtual Desktop
    - Wiki / semantic layer
    - Threads / Server
    - Chat / harness-facing
    - atlas support route around one of the surfaces above
- touches:
  - the exact route, page, content, or artifact Claude claims
- does not touch:
  - broad repo cleanup
  - swarm control docs unless blocked
  - unrelated architecture rewrites
  - speculative mesh/distributed expansion
- done-when:
  - one concrete deliverable lane lands with a clean handoff and without widening into adjacent product areas

## Support Lanes

### Support 1
- owner: Codex support swarm
- lane: `alignment-watch`
- purpose:
  - keep the live wave pointed at one objective and one main lane
- scope:
  - claims, handoffs, scope contradictions, and visible drift notes
- done-when:
  - the main lane has clear ownership, visible boundaries, and no hidden scope collision

### Support 2
- owner: Codex support swarm
- lane: `context-curator`
- purpose:
  - reduce search friction around the main lane without becoming a second author
- scope:
  - read-order, cross-links, source pointers, and small context hygiene around the active deliverable
- done-when:
  - the next worker can find the minimum useful context quickly

### Support 3
- owner: Codex support swarm
- lane: `repo-hygiene`
- purpose:
  - keep the repo trustworthy while staying out of the main artifact
- scope:
  - low-blast-radius naming, link, and structure cleanup
- done-when:
  - broken or stale references around the active lane are cleaned without changing product substance

### Support 4
- owner: Codex support swarm
- lane: `handoff-pack`
- purpose:
  - package ongoing progress so the next move is fast
- scope:
  - compact handoffs, lane summaries, and progress capture
- done-when:
  - a fresh orchestrator or worker can resume without re-reading everything

### Support 5
- owner: Codex support swarm
- lane: `verification-guard`
- purpose:
  - check that support work and swarm wiring are still helping rather than colliding
- scope:
  - builds, link checks, and consistency checks around the support pack
- done-when:
  - support changes are safe and the main lane remains clear to continue

## Recovery Posture

- active: yes
- reason:
  - the swarm recently felt muddy and over-expanded, so recovery stays on as a standing watch until the main lane stays narrow and stable
- trigger to become an active recovery lane:
  - only if the wave stops being describable as one objective, one main lane, and a few support lanes
- owner: lead orchestrator
- done-when:
  - the wave can be described cleanly as one objective, one main lane, and a few support lanes

## Current Risks

- drift risk:
  - support work grows faster than the product lane
- ownership risk:
  - main deliverables scope is not claimed narrowly enough and attracts parallel edits
- unresolved question:
  - surface authority can still blur, especially around Threads/Discord, HQ/Desktop, and Chat/execution boundaries
- current freeze:
  - do not settle those surface-boundary questions inside this wave unless a blocked lane forces the smallest possible clarification

## Current Handoffs

- from: lead orchestrator
- to: Claude deliverables orchestrator
- state: active
- next step:
  - claim one narrow deliverables lane and move it

- from: lead orchestrator
- to: Codex support swarm
- state: active
- next step:
  - keep alignment, context, hygiene, handoff quality, and verification tight without touching the main artifact

## Stop Rules

- what should cause the wave to pause:
  - no one can clearly name the one active objective or the one main write lane
- what should cause a handoff:
  - the current lane changes shape, blocks on another owner, or drifts into a different product area
- what should cause a lane split:
  - only when the work naturally separates into a main deliverable lane and a truly independent support lane with a disjoint write scope

## Practical Reading

- If you are Claude, take the `main-deliverables` lane.
- If you are support swarm, stay out of the main deliverable and help the next move land faster.
- Claims and handoffs are the only accepted serialization point for coordination in this wave.
- If the wave starts feeling muddy again, return to:
  - [Orchestration Kernel](./orchestration-kernel.md)
  - [No Drift Rules](./no-drift-rules.md)
  - [Deliverables Support Lanes](./deliverables-support-lanes.md)
