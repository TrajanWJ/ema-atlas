# Deliverables Support Lanes

This document defines the lanes for the rest of the swarm while Claude
focuses on deliverables.

The purpose here is not to compete with the main write lane. The purpose is to
make the deliverables lane safer, clearer, and easier to finish by improving
alignment, context quality, repo hygiene, and handoff quality around it.

## Operating rule

- Keep the deliverables lane unblocked.
- Do not duplicate the deliverables write scope.
- Do not broaden the product surface just because extra context is available.
- Prefer small support moves that make the next deliverable easier to land.
- If a task starts looking like the main artifact, hand it back to the
  deliverables owner.

## Support lane map

### 1. Alignment Watch

Purpose: keep everyone pointed at the same truth before drift spreads.

What this lane does:

- read the active claims, handoffs, and lane ownership notes
- flag contradictions in scope, naming, or sequencing
- surface unresolved questions instead of silently smoothing them over
- keep the current wave aligned with the shared product direction

What this lane touches:

- coordination docs
- claim and handoff notes
- short alignment updates

What this lane does not touch:

- deliverable content itself
- large architectural rewrites
- any file already owned by the active deliverables lane

Done when:

- the current ownership picture is legible
- conflicts are named early
- the next worker can tell what is safe to do

### 2. Context Curator

Purpose: improve the quality of the inputs without expanding the output.

What this lane does:

- gather only the minimum context needed for the next step
- trim stale or redundant notes
- normalize references, filenames, and path names
- make the useful context easier to find again

What this lane touches:

- supporting docs
- index or overview pages
- cross-links and reference lists

What this lane does not touch:

- product copy that is still being actively authored
- speculative background material
- broad documentation expansions

Done when:

- the next worker can start with less searching
- the relevant context is shorter, cleaner, and current

### 3. Repo Hygiene

Purpose: keep the workspace easy to trust and easy to scan.

What this lane does:

- fix small formatting issues
- remove obviously stale references where safe
- clean up broken links or duplicated pointers
- keep folder and file names consistent with the current scheme

What this lane touches:

- low-risk cleanup spots
- link hygiene
- naming consistency
- minor structural corrections

What this lane does not touch:

- content rewrites with product meaning
- large refactors
- anything that would change the deliverable direction

Done when:

- the workspace is cleaner without becoming noisier
- no one needs to wonder if a broken reference is real

### 4. Handoff Pack

Purpose: turn ongoing work into something another worker can continue fast.

What this lane does:

- summarize what changed
- list what remains open
- note the smallest safe next step
- call out risks, blockers, and assumptions

What this lane touches:

- handoff notes
- lane summaries
- compact progress records

What this lane does not touch:

- the main deliverable draft unless the handoff itself is the deliverable
- long retrospective narratives
- unresolved design debates that belong in the active lane

Done when:

- the next worker can resume without re-reading the whole thread
- open questions are visible instead of buried

### 5. Verification Guard

Purpose: check that the support work is actually helping and not drifting.

What this lane does:

- confirm links, paths, and references still resolve
- sanity-check that support edits did not collide with the active lane
- verify the support doc set still matches current ownership

What this lane touches:

- lightweight checks
- doc validation
- cross-file consistency

What this lane does not touch:

- feature implementation
- deliverable drafting
- speculative cleanup not tied to a visible issue

Done when:

- the support changes are demonstrably safe
- the deliverables lane is still clear to continue

## Lane assignment guidance

- If the task helps the deliverable but does not need to be in the deliverable,
  use a support lane.
- If the task changes the substance of the deliverable, it belongs in the main
  deliverables lane.
- If the task is mostly about deciding what is true, use Alignment Watch.
- If the task is mostly about making source material easier to use, use Context
  Curator.
- If the task is mostly cleanup and has low blast radius, use Repo Hygiene.
- If the task is mostly packaging progress for the next worker, use Handoff
  Pack.
- If the task is mostly checking safety or consistency, use Verification Guard.

## Suggested swarm posture

While Claude stays on deliverables, the rest of the swarm should bias toward:

- keeping claims current
- reducing context friction
- removing easy repo noise
- leaving clean handoffs
- avoiding duplicate effort on the main artifact

The goal is simple: when the deliverables lane is ready to move, everything
around it should already be aligned enough to help instead of slow it down.
