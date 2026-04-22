# Plan: Babysitter + Stream-of-Consciousness + Tick Spec Master Guide

**Generated**: 2026-04-04 UTC  
**Estimated Complexity**: Medium

## Overview

This document consolidates the currently scattered Babysitter operating model, stream-of-consciousness channel architecture, and tick/status formatting rules into one actionable master guide.

The goal is to stop losing the plan across Discord messages, memory notes, CONTINUE.md alerts, and one-off analysis docs.

## Recovered Source Map

These are the primary sources recovered and merged here:

1. `/home/trajan/.openclaw/agents/main/workspace/BABYSITTER-PHASE-ANALYSIS-2026-04-04.md`
   - agent/channel ownership
   - immediate actions
   - W8 sequencing
2. `/home/trajan/.openclaw/agents/main/workspace/memory/2026-04-04.md`
   - deployed stream category + channel contracts
   - severity/escalation rules
   - minimum useful status template
   - anti-noise / fail-closed guidance
3. `/home/trajan/.openclaw/agents/main/workspace/HEARTBEAT.md`
   - babysitter monitoring obligations
   - failed-message babysitter behavior
4. `/home/trajan/.openclaw/agents/main/workspace/CONTINUE.md`
   - real degraded-mode alert examples
   - evidence of current alert formatting drift
5. Current Discord discussion in `#babysitter-live`
   - new requirement that ticks be operationally useful, not vibe/status blurbs

## Success Criteria

This master guide is successful if:
- there is **one canonical description** of what each stream channel is for
- Babysitter knows **when to post, when not to post, and when to escalate**
- ticks become **operator deltas** instead of stream-of-consciousness fluff
- a human can scan the channels and answer:
  - what changed
  - what is broken
  - who owns it
  - what happens next
  - whether attention is needed

## Non-Goals

- Rewriting the underlying EMA implementation in this document
- Defining every UI detail for dashboards
- Solving broader EMA architecture conflicts unrelated to Babysitter/streams/ticks

## Canonical Operating Model

### 1. System Roles

**Babysitter is a coordinator, not a duplicate worker.**

- underlying systems remain authoritative in their domains
- Babysitter triages, assigns, tracks, nudges, escalates
- Right Hand remains the human-facing synthesis layer
- overlays are informational; the human control-plane outranks them

### 2. Control Plane vs Data Plane

#### Control plane
- `#babysitter-sprint`
- purpose: directives, ownership, escalations, milestone summaries
- authoritative for human decisions

#### Data plane / overlay streams
- `#system-heartbeat`
- `#intent-stream`
- `#pipeline-flow`
- `#agent-thoughts`
- `#intelligence-layer`
- `#memory-writes`
- `#execution-log`
- `#evolution-signals`
- `#speculative-feed`
- `#babysitter-live`

### 3. Stream Category Contract

The `🧵 STREAM` category exists to make internal machine activity visible **without polluting the control channel**.

Each stream should have exactly one job:

| Channel | Canonical job | Post type |
|---|---|---|
| `#system-heartbeat` | raw machine health facts | health snapshots only |
| `#intent-stream` | anti-collision declarations before work starts | intent claims |
| `#pipeline-flow` | handoffs, queued/running/completed/failed transitions | flow deltas |
| `#agent-thoughts` | provisional reasoning and hypotheses | thought/risk/assessment |
| `#intelligence-layer` | higher-order pattern synthesis after multiple events | synthesis only |
| `#memory-writes` | durable facts worth remembering | compact confirmed facts |
| `#execution-log` | append-only execution evidence | action/result logs |
| `#evolution-signals` | repeated patterns worth crystallizing | evolution notes |
| `#speculative-feed` | low-confidence exploration | speculative notes |
| `#babysitter-live` | operator rollup of current implementation/debugging work | useful ticks + rollups |

### 4. `#babysitter-live` Contract

`#babysitter-live` is **not** the canonical stream brain and **not** freeform journaling.

It should function as an operator rollup lane for active Babysitter / EMA fixes.

Allowed posts:
- useful ticks (delta updates)
- concise blocker updates
- implementation milestone notes
- integration rollups
- “attention needed” escalation summaries

Disallowed posts:
- vague vibe updates
- repeated status with no material change
- raw inner-monologue thought spam
- duplicate health snapshots already present in `#system-heartbeat`

## Canonical Tick Spec

### Tick purpose

A tick should answer five things fast:
1. **What changed?**
2. **Why does it matter?**
3. **What is blocked?**
4. **What happens next?**
5. **Do you need human attention?**

### Standard tick template

```md
⚡ tick | HH:MM UTC
- **Changed:** ...
- **Impact:** ...
- **Blocked:** ...
- **Next:** ...
- **Attention needed:** none / specific ask
```

### Dense single-line form

```md
⚡ tick | <area> | <change> | <impact> | <blocker> | <next>
```

Use the dense form only when the update is genuinely simple.

### Tick quality bar

A tick is good if it is:
- delta-based, not ambient
- concrete, not interpretive
- short enough to scan
- specific enough to act on

### Tick examples

**Bad**
```md
⚡ tick ? | working on feedback layer and runtime settling
```

Why bad:
- no clear change
- no operational impact
- no owner/blocker/next action

**Good**
```md
⚡ tick | 17:10 UTC
- **Changed:** dedupe harvester proposals now feed `pipes-actions`; worker loop tightened in `project-worker`
- **Impact:** duplicate proposals drop earlier and execution handoff is cleaner
- **Blocked:** `brain-ingester` and action modules disagree on payload shape
- **Next:** normalize the action contract, then test 3 end-to-end proposal→worker flows
- **Attention needed:** none
```

**Escalation tick**
```md
⚡ tick | 17:24 UTC
- **Changed:** execution path halted after contract normalization exposed a second mismatch in feedback payloads
- **Impact:** proposal ingestion works, but completion events are not reliably faning out to Discord/UI
- **Blocked:** feedback payload contract ownership is unclear between `feedback.broadcast` and downstream consumers
- **Next:** assign canonical schema owner, patch consumers, rerun fanout verification
- **Attention needed:** decide whether `feedback.broadcast` is the canonical event envelope
```

## Posting Rules

### Post in `#babysitter-live` when:
- a meaningful implementation delta lands
- a blocker changes
- ownership changes
- a milestone is completed
- there is an ask for human attention

### Do **not** post when:
- nothing changed
- only confidence/feelings changed
- the message would repeat a heartbeat without adding operator meaning
- the update belongs in another stream (`#pipeline-flow`, `#agent-thoughts`, etc.)

### Noise suppression rule

Post only on:
- incident opened
- severity changed
- owner changed
- blocker identified or cleared
- degraded mode entered/exited
- milestone reached
- human action required

## Severity + Escalation Model

### Severity tiers
- **P0** — user-visible unresponsiveness, command loss, silent drops
- **P1** — degraded but responding; 429s/auth churn/delayed execution
- **P2** — control-plane drift, stale status, excess noise
- **P3** — cosmetic / non-blocking

### Escalation ladder
1. self-recovered → log + monitor
2. alert with no owner → assign owner
3. owner stalled → escalate
4. cross-system ambiguity → intelligence synthesis
5. confirmed durable lesson → memory-write

### Repeated-user-message rule
- ping #2 in ~5 min on same issue → upgrade severity toward P0
- ping #3 / frustration signal → mandatory owner + blocker + ETA update
- ping #4 with no progress → explicitly declare stalled incident

### Minimum useful escalation template

```md
What is broken:
What lane owns it:
What system is doing now:
Next visible update:
```

## Fail-Closed Rules

When provider pressure/auth churn is present:
- stop nonessential chatter
- do not claim dispatch succeeded without confirmation
- suppress low-priority internal bot noise
- do not emit “all clear” on partial recovery
- exit degraded mode only after auth is valid **and** a real end-to-end dispatch succeeds

## Sprint Plan

## Sprint 1: Freeze the Canonical Contracts
**Goal**: make the operating model explicit and findable.

**Demo/Validation**:
- one guide exists and is shared
- channel owners can point to one source of truth
- future tick/style disputes resolve against this guide

### Task 1.1: Publish the master guide
- **Location**: this file; optionally mirror to vault/wiki
- **Description**: treat this file as the canonical plan source
- **Dependencies**: none
- **Acceptance Criteria**:
  - guide includes channels, tick spec, escalation model, fail-closed rules
  - guide names `#babysitter-live` as operator rollup, not stream brain
- **Validation**:
  - manual read-through confirms all three missing fragments are merged

### Task 1.2: Mark channel purpose explicitly
- **Location**: Discord channel topics for `#babysitter-live`, `#babysitter-sprint`, key stream channels
- **Description**: align topics with the contracts above
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - topics clearly distinguish control plane from stream overlays
- **Validation**:
  - topic text matches guide language

### Task 1.3: Decide where the canonical doc lives long-term
- **Location**: workspace and/or vault
- **Description**: choose stable home so this does not become “lost plan” again
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - one link/path is the canonical reference
- **Validation**:
  - future references use same path

## Sprint 2: Standardize Tick Production
**Goal**: make every tick operationally useful.

**Demo/Validation**:
- last 10 ticks in `#babysitter-live` are readable as operator deltas
- no vague “working on X” ticks without change/impact/blocker/next

### Task 2.1: Replace freeform tick habit with the standard template
- **Location**: posting behavior and any generator/prompt that emits ticks
- **Description**: enforce Changed / Impact / Blocked / Next / Attention needed
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - new ticks conform to the template
- **Validation**:
  - sample audit of 10 recent ticks

### Task 2.2: Add a route rule for where updates belong
- **Location**: operator guidance / prompt rules
- **Description**: route thoughts to `#agent-thoughts`, state transitions to `#pipeline-flow`, health facts to `#system-heartbeat`, operator deltas to `#babysitter-live`
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - fewer duplicates across streams
- **Validation**:
  - no repeated cross-posted content unless intentionally summarized

### Task 2.3: Define “attention needed” semantics
- **Location**: tick spec
- **Description**: normalize values to `none`, `decision`, `approval`, `unblock`, `incident`
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - human attention requests become skimmable and searchable
- **Validation**:
  - future ticks use constrained labels

## Sprint 3: Tighten Babysitter Incident Operations
**Goal**: reduce noise, improve escalation clarity, and stop repeated low-value alerts.

**Demo/Validation**:
- during degraded mode, low-priority chatter falls off sharply
- incident updates clearly name owner/blocker/next update

### Task 3.1: Enforce fail-closed behavior for internal noise
- **Location**: Babysitter + internal routing logic
- **Description**: quiet internal cron/bot chatter under provider pressure
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - low-priority channels do not consume main babysitter attention during pressure
- **Validation**:
  - degraded-mode run shows suppressed internal spam

### Task 3.2: Require ownership on nontrivial incidents
- **Location**: incident posting behavior
- **Description**: every meaningful incident post must name owner/lane
- **Dependencies**: Sprint 1
- **Acceptance Criteria**:
  - no open issue without owner
- **Validation**:
  - incident sample audit

### Task 3.3: Collapse repeated alerts into summary deltas
- **Location**: alert/reporting logic
- **Description**: repeated degraded heartbeats should produce a summarized operator update instead of a flood
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - sustained incidents yield compact summaries instead of raw repetition
- **Validation**:
  - compare before/after alert volume

## Sprint 4: Make the Guide Durable
**Goal**: prevent plan loss.

**Demo/Validation**:
- this guide is easy to find from workspace and/or vault
- recovery after session loss does not depend on memory

### Task 4.1: Mirror the guide into durable knowledge storage
- **Location**: `/home/trajan/vault/` or wiki space
- **Description**: store a long-term version under architecture/operations
- **Dependencies**: Sprint 1 complete
- **Acceptance Criteria**:
  - searchable durable copy exists
- **Validation**:
  - file is indexed and retrievable

### Task 4.2: Link from AGENTS/MEMORY/heartbeat references if needed
- **Location**: relevant workspace docs
- **Description**: make the guide discoverable from startup and incident paths
- **Dependencies**: Task 4.1
- **Acceptance Criteria**:
  - future sessions can find the guide in one hop
- **Validation**:
  - grepping “babysitter master guide” finds the canonical file

## Immediate Action Queue

Ordered next moves:

1. **Adopt the new tick template immediately** in `#babysitter-live`
2. **Treat `#babysitter-live` as operator rollup only**
3. **Stop cross-posting health facts** already represented in `#system-heartbeat`
4. **Require blocker + next step** on every nontrivial tick
5. **Normalize attention-needed labels** (`none`, `decision`, `approval`, `unblock`, `incident`)
6. **Choose a durable canonical home** for this guide
7. **Mirror it into vault/wiki** so it stops being a lost plan

## Testing Strategy

- Manual audit of the next 10 `#babysitter-live` ticks
- Check whether each tick answers the 5 operator questions
- During next degraded incident, verify:
  - fewer duplicate posts
  - clear owner/blocker/next update
  - low-priority chatter suppressed
- Verify channel topics align with their contracts

## Potential Risks & Gotchas

1. **Drift between guide and behavior**
   - mitigation: use the tick template immediately, not later
2. **Channel purpose overlap**
   - mitigation: enforce one-job-per-channel routing rule
3. **Guide gets lost again**
   - mitigation: mirror to vault/wiki and link from startup docs
4. **Ticks become too verbose**
   - mitigation: keep to 5 bullets max; dense form allowed for tiny deltas
5. **Escalations still feel vague**
   - mitigation: enforce owner + blocker + next visible update fields

## Rollback Plan

If this structure proves too heavy:
- keep the channel contracts
- keep the tick template
- reduce ceremony elsewhere
- do **not** revert to freeform vague ticks

## Recommended Canonical Summary

If you want the shortest durable rule set, it is this:

- `#babysitter-sprint` = control tower
- stream channels = overlays by lane
- `#babysitter-live` = operator rollup for active work
- ticks must always include **Changed / Impact / Blocked / Next / Attention needed**
- post only on meaningful delta
- fail closed under provider pressure

## Execution Follow-On

This guide now has a dedicated execution companion:
- `[[Babysitter Surface Governor Execution Plan]]`

Use this guide for:
- channel purpose
- tick quality bar
- operator posting rules
- escalation clarity

Use the execution plan for:
- semantic lane × cadence bucket architecture
- code touchpoints in EMA
- rollout sequencing
- implementation validation
