# Intent Engine Bootstrap Refinement

> Light refinement pass only. This document does **not** redesign the Intent Engine.
> It narrows authority, Day 1 ingestion, and the minimal self-building loop so the existing system can bootstrap cleanly.

## Purpose

Optimize for the **first working self-building loop**, not completeness.

The target loop is:

**root intent → approved proposal → execution → parent intent update → optional child intent**

---

## 1. Day 1 Sources of Truth

For bootstrap behavior, keep the split explicit:

- **wiki / vault** = semantic truth
  - what the intent means
  - rationale
  - constraints
  - decisions
  - long-form context

- **`control_plane_intents`** = runtime intent truth
  - canonical Day 1 intent record
  - current runtime status
  - linked refs and current focus pointers

- **`.superman/` intent folders** = execution scratchpads
  - accepted plans
  - working notes
  - execution-local artifacts
  - temporary context projections

### Important

- `intent_nodes` remains the older intent-map / semantic hierarchy model.
- For Day 1 runtime orchestration, **`control_plane_intents` is canonical**.
- `.superman/metadata.json` is **not** the single source of truth for the overall pipeline.

---

## 2. Day 1 Intent Creation

### Exact Day 1 intent-creating sources

Use only these:

1. **`intent/README.md`**
   - human-authored or explicitly curated
   - creates the root intent

2. **Execution completion payload / `results.json`**
   - may create **one** follow-on child intent only if it explicitly contains:
     - unmet acceptance criteria
     - blocker
     - next required step

### Not intent-creating on Day 1

These may be read as context, but should **not** create intents:

- proposal drafts
- queued proposals
- redirected proposals
- reflexions
- session summaries
- Discord/chat transcripts
- outcome trackers
- workflow-patterns
- vault-wide note ingestion
- scanners / cron / passive surfaces

---

## 3. Bootstrap Ingestion Order

1. Load **`intent/README.md`**
2. Create or bind the root intent in `control_plane_intents`
3. Bind an **approved proposal** to that intent
4. Run execution
5. Ingest execution completion payload / `results.json`
6. Update parent intent status
7. Optionally create **one** child intent from explicit execution delta

### Proposal rule

Draft / queued / redirected proposals do **not** create intent nodes.

Approved proposals may:
- bind to an existing intent
- drive execution
- contribute lineage

But proposal prose itself should not create a new intent during bootstrap.

---

## 4. Required Day 1 Intent Fields

Minimum useful fields in `control_plane_intents`:

- `id`
- `project`
- `slug`
- `title`
- `kind`
- `status`
- `summary`

Useful but secondary on Day 1:

- `priority`
- `current_focus`
- `next_actions`
- `linked_refs`
- `metadata`

Deferred until later:

- rich objectives model
- autonomous blocker generation
- broad ontology / hierarchy expansion
- automatic intent creation from weak signals

---

## 5. Clarify Level vs Phase vs Status

These are different axes and should not be blended.

### level
- semantic depth / abstraction
- belongs to the intent-map model
- mostly stable

### phase
- process lifecycle stage of work
- belongs primarily to execution/event flow
- examples: intake, proposal, dispatch, execution, done

### status
- current state of a record
- intent status, proposal status, execution status each have their own vocabulary

### Clean rule

- **Intent = meaning + coarse progress**
- **Execution = runtime state + phase**
- **Events = timeline evidence**

Do not use `level` as if it means “currently implementing.”

---

## 6. Context Assembler: Day 1 Pull Order

The Context Assembler should read from all three authorities in this order:

1. **Intents DB / control-plane state**
   - current runtime state
   - active linkage
   - parent/child or dependency pointers in use

2. **wiki / vault**
   - meaning
   - rationale
   - constraints
   - decisions
   - research and examples

3. **`.superman/` scratchpad**
   - accepted plan
   - execution notes
   - recent reflections
   - local run artifacts

This keeps scratchpad artifacts from pretending to be canonical truth.

---

## 7. Smallest Self-Building Loop

The smallest safe loop that produces a second intent is:

1. Human writes root intent in `intent/README.md`
2. Root intent is created in `control_plane_intents`
3. One proposal is approved against that intent
4. One execution runs
5. Execution completes
6. Parent intent is updated
7. If explicit remaining work exists, create **one** child intent

The **second intent must come from execution outcome**, not proposal prose.

---

## 8. Pollution Risks and Guards

### Main risks

- proposal drafts becoming intents
- redirected proposals creating fake branches
- reflexions becoming intent creators too early
- session/chat/log artifacts becoming intent nodes
- execution artifacts rewriting semantic intent meaning
- `.superman/metadata.json` being treated as pipeline authority
- mixing `intent_nodes` and `control_plane_intents` without naming the canonical Day 1 model

### Guards

- **approved-only gate**
- **execution-complete-only gate**
- **explicit-delta rule**
- **single-child-per-execution-delta**
- **no same-pass recursive ingest**
- **no reverse authority**
  - `.superman` never overrides DB state
  - `.superman` never overrides vault meaning
  - DB never auto-overwrites vault prose

---

## 9. What Stayed the Same

- the existing Intent Engine direction
- proposal → execution → narrative loop
- vault/wiki as major context input
- `.superman` as execution-local structure
- EMA as orchestrator

## 10. What Is Clarified

- canonical Day 1 runtime intent schema
- exact Day 1 intent creation sources
- authority split across vault / DB / `.superman`
- proposal does not create intents during bootstrap
- second intent only from execution delta
- `level` vs `phase` vs `status`

## 11. What Is Deferred

- autonomous multi-source intent discovery
- reflexions/session summaries/Discord creating intents
- broad scanner-driven intent generation
- automatic bidirectional sync between vault and DB
- deep intent-map exploitation during Day 1 runtime orchestration

## 12. Bootstrap Sequence

1. Human writes `intent/README.md`
2. EMA creates/binds the root intent in `control_plane_intents`
3. One proposal is approved against that intent
4. One execution runs
5. Execution completion updates the parent intent
6. If explicit unmet work remains, EMA creates one child intent
7. Next proposal/execution loop continues from that child

## 13. Single Next Action

Implement the first clean bootstrap path:

**root intent from `intent/README.md` → approved proposal binding → execution completion → parent intent update → optional single child intent**
