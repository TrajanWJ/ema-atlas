# Discord Self-Nudge / Lane Activation Spec

Updated: 2026-04-14 UTC

## Goal

Define durable, non-annoying behavior for how Discord lanes become active, stay active, and self-nudge when useful.

This exists because channel creation alone does not create real work.

---

## Core rule

A self-nudge is **not** stream-of-consciousness spam.

A self-nudge is a small, structured, justified message emitted when:
- a lane is canonical or explicitly enabled for nudges
- there is real unsurfaced state worth surfacing
- silence would hide actionable context
- the lane has not been nudged too recently

If those conditions are not met, the lane should stay quiet.

---

## Lane modes and nudge eligibility

### 1. `human-command`
Examples:
- `command`
- `orchestrator-control`
- `babysitter-sprint`

Behavior:
- no idle chatter
- only nudge when a human decision is actually needed
- nudge format should explicitly ask for a decision or show a blocker

### 2. `session-bound`
Examples:
- `orchestrator-implementation`
- `orchestrator-ema`
- `ema-runtime-recovery`
- `ema-ui-surface`

Behavior:
- nudge if session is stalled, waiting, blocked, or completed with result needing promotion
- do not nudge merely to prove aliveness

### 3. `event-fed`
Examples:
- `pipeline-flow`
- `system-heartbeat`
- `memory-writes`
- `intent-stream`

Behavior:
- no autonomous summarization inside the stream lane unless configured
- mostly post only on real events
- if source is silent, lane stays silent

### 4. `digest-fed`
Examples:
- `babysitter-digest`
- `agent-results`
- `command-queue`
- `decisions-log`

Behavior:
- ideal place for self-nudges
- summarize deltas, not raw activity
- should coalesce multiple changes into one message

### 5. `temporary-repair`
Examples:
- `babysitter-repair-log`

Behavior:
- allowed to nudge while incident is active
- must expire or archive after incident window

### 6. `archive` / `knowledge/reference`
Behavior:
- never self-nudge by default

---

## Activation lifecycle

### Stage 0 — Scaffolding
Lane exists but has no real source/binding.

Allowed behavior:
- one bootstrap post or pinned routing note
- no recurring nudges yet

### Stage 1 — Warm activation
Lane has purpose + source + first rule.

Allowed behavior:
- first real nudge when useful
- explicit cooldown required

### Stage 2 — Running
Lane has stable source and observed value.

Allowed behavior:
- periodic nudges/summaries if real deltas exist
- inactivity is acceptable if nothing changed

### Stage 3 — Dormant
Lane was once useful but currently cold.

Allowed behavior:
- no regular nudges
- maybe one dormancy summary or archive recommendation

---

## Self-nudge trigger classes

A self-nudge should only fire on a recognized trigger class.

### A. Blocker surfaced
Example:
- workstream waiting on human choice
- provider failure blocks execution
- routing ambiguity stalls next step

### B. Stalled work
Example:
- session active but no meaningful progress for N interval
- queued work unclaimed too long

### C. Completion requiring promotion
Example:
- execution finished
- synthesis ready
- decision extracted
- digest ready

### D. Health threshold crossed
Example:
- error rate spike
- queue depth abnormal
- lane expected feed silent for too long

### E. Recurrence threshold crossed
Example:
- same issue appears repeatedly across multiple channels
- enough repeated signal to justify promotion to control lane

### F. Age threshold crossed
Example:
- unresolved task older than configured limit
- lane dormant long enough to archive or reclassify

---

## Nudge suppression rules

Self-nudges must be suppressed when:
- nothing materially changed
- a similar nudge was sent within cooldown
- another lane already emitted the canonical version
- the lane is stream-only and a digest lane should carry the summary instead
- the system lacks confidence in what to say
- the lane is archive/reference only

When suppressed, do nothing.

---

## Cooldown defaults

These are starting defaults, not permanent truth.

- command/control lanes: 2h minimum unless a new blocker appears
- digest lanes: 30m to 2h depending on traffic
- incident/repair lanes: 15m to 60m depending on severity
- stream lanes: event-based only, no timer-driven self-nudges by default
- archive/reference lanes: disabled

Important:
A new critical blocker can bypass cooldown.
A repeated low-signal reminder cannot.

---

## Canonical message shapes

### Control-lane nudge
Use when human action is needed.

Format:
- what changed
- why it matters
- what decision/action is needed
- where the detailed lane is

Example:
> `orchestrator-control`: 2 implementation lanes are stalled on routing ownership. Need decision: keep routing in `orchestrator-implementation` or promote to `orchestrator-ema`. Details in `agent-dispatch` and `babysitter-live`.

### Digest-lane nudge
Use for rollups.

Format:
- count/summary
- notable delta
- pending action or “no action needed”

Example:
> `babysitter-digest`: 3 new stream events promoted. 1 unresolved item remains: lane activation/self-nudge policy for new RE channels.

### Session-bound nudge
Use when a workstream is blocked or done.

Format:
- workstream identity
- current state
- blocker/result
- next move

Example:
> `orchestrator-implementation`: runtime recovery thread completed initial audit; next move is binding lane registry to active categories.

### Repair-lane nudge
Use while incident is active.

Format:
- current repair status
- open issue
- blast radius
- next verification step

---

## Forever rules worth keeping

These are the parts that should be remembered long-term unless reality changes.

1. **Silence is often the correct behavior.**
2. **A lane should not self-nudge just to look alive.**
3. **Only canonical or explicitly enabled lanes get autonomous nudges.**
4. **Control lanes ask for decisions; stream lanes emit events; digest lanes summarize.**
5. **Every nudge needs a reason: blocker, stall, completion, threshold, recurrence, or age.**
6. **If another lane already said it canonically, suppress duplicates.**
7. **Temporary repair lanes expire.**
8. **A lane is not “running” just because a channel exists.**

---

## Testing plan

To validate self-nudge behavior, test these cases:

1. **No-change silence**
- expected: no message

2. **Single real blocker in a control lane**
- expected: one concise nudge

3. **High stream activity**
- expected: stream lane gets events, digest lane gets one rollup, not ten

4. **Duplicate candidate nudges across lanes**
- expected: only canonical lane emits

5. **Dormant lane**
- expected: no keepalive chatter

6. **Temporary repair lane after closure**
- expected: final summary then archive recommendation

---

## Next implementation work

1. Add lane metadata/config:
- lane mode
- canonical flag
- cooldown
- digest target
- archive rule

2. Add nudge decision function:
- `shouldNudge(lane, state, recentMessages, config)`

3. Add promotion function:
- decide whether content belongs in stream lane, digest lane, or control lane

4. Add suppression memory:
- last nudge time
- last nudge fingerprint
- last canonical emitter

5. Integrate with auto-bump policy:
- self-nudges should not distort layout more than necessary
- stream lanes should not out-rank control lanes just because they are noisy

---

## Final principle

The system should feel like a competent operator who speaks when there is something to say, not like a bot trying to prove consciousness by posting into every room.
