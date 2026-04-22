# claude-a9 — anti-drift mechanisms

- owner: claude-a9
- created_at: 2026-04-21T05:11:00Z
- status: proposed
- scope: concrete rules and mechanisms to prevent divergence between shared workspace, canonical graph, and runtime state

## Thesis

EMA should treat drift prevention as a first-class architectural feature, not a cleanup task.

The system has three distinct authority domains:

1. **canonical graph** — durable semantic truth
2. **runtime/control plane** — live operational truth
3. **shared workspace** — collaboration overlays and temporary coordination artifacts

Drift happens when one layer silently starts pretending to be another.

So v1 should enforce two things at the same time:

- **strict write boundaries**
- **continuous reconciliation with visible incidents**

## Core anti-drift law

Every record, file, or rendered item must answer these four questions explicitly:

```yaml
authority_kind: canonical | runtime | workspace_overlay | computed_export
authority_ref: <stable id or path>
write_owner: canon | daemon | agent_workspace | none
reconcile_policy: strict | overlay_merge | regenerate | expire
```

If EMA cannot answer those fields, the item is not trustworthy enough to participate in normal workflows.

## The main drift classes to defend against

### 1. Workspace pretending to be canon
Example:
- actor notes become the de facto source of project truth
- handoffs contain the latest real assignment state, but canon never receives it
- task markdown stores completion state without canonical backing

### 2. Runtime pretending to be canon
Example:
- live session claim implies durable ownership forever
- a running process becomes the only place where execution status exists
- daemon memory diverges from on-disk records after restart

### 3. Canon lagging behind reality
Example:
- execution completed in runtime, but no canonical execution record exists
- approved proposals remain `proposed`
- durable architecture decisions remain trapped in swarm notes

### 4. Computed views becoming shadow databases
Example:
- board columns carry independent state
- agenda exports get edited by hand
- task views disagree with source entities

### 5. Time drift / staleness drift
Example:
- old workspace overlays still look current
- dead sessions remain “active”
- abandoned handoffs still pollute views

## Authority rules

## 1. Single writer per fact class

Each fact type gets one preferred write authority:

| Fact class | Authority |
|---|---|
| intent meaning, proposal meaning, decisions, execution history | canonical graph |
| active claim, session liveness, heartbeats, worker status | runtime/control plane |
| handoff asks, local collaboration notes, temporary schedules, actor memos | shared workspace |
| boards/agendas/task lists/exports | computed only |

Rule:
- if two domains can both be directly edited for the same fact, drift is guaranteed

## 2. Workspace may reference canon/runtime, but not replace them

Workspace files may contain:
- `intent_refs`
- `proposal_refs`
- `execution_refs`
- `session_refs`
- `actor_refs`

But they should not become the only place where those facts live.

If a workspace file starts carrying durable fields like:
- final approval state
- durable ownership
- completed execution outcome
- official dependency graph

then it must be promoted or rewritten.

## 3. Runtime facts are leased, not eternal

Any runtime-owned record that implies current truth should carry expiry semantics:

```yaml
runtime_status: active
lease_expires_at: 2026-04-21T05:25:00Z
last_heartbeat_at: 2026-04-21T05:20:00Z
```

If lease/heartbeat expires:
- runtime state downgrades to `stale` or `unknown`
- workspace views must stop presenting it as active truth
- reconcile process emits an incident

This prevents ghost sessions and zombie claims.

## 4. Computed exports are always marked non-authoritative

Every generated task/agenda/board/export file should include:

```yaml
generated: true
authoritative: false
source_inputs:
  - canon:int_a1b2c3d4
  - runtime:claim:exe_x1
  - workspace:handoff:hermes-a4--review
generated_at: 2026-04-21T05:11:00Z
generator_ref: ema-view-engine-v1
```

Rule:
- generated files may be deleted and regenerated
- manual edits to generated files are drift events, not normal usage

## Concrete anti-drift rules

## Rule A — provenance is mandatory

Every actionable or cross-linked record must include provenance.

### Workspace file minimum
```yaml
owner: claude-a9
created_at: 2026-04-21T05:11:00Z
updated_at: 2026-04-21T05:11:00Z
status: open
authority_kind: workspace_overlay
related_refs:
  - int_...
  - prp_...
  - exe_...
```

### Canon entity minimum
```yaml
id: prp_a1b2c3d4
type: proposal
created_at: ...
updated_at: ...
author_ref: agt_claude_a9
source_workspace_paths:
  - workspace/shared/actors/claude-a9.md
```

### Runtime record minimum
```yaml
runtime_ref: claim:exe_a1b2c3d4:agt_claude_a9
source_ref: exe_a1b2c3d4
started_at: ...
last_heartbeat_at: ...
lease_expires_at: ...
```

If provenance is missing, EMA should warn and reduce trust.

## Rule B — no orphan actionable items

Any item shown as actionable must have:
- `source_ref`
- `authority_kind`
- `writeback_target`

Example:

```yaml
task_key: task:exe_a1b2c3d4:resume
source_ref: exe_a1b2c3d4
authority_kind: canonical
writeback_target:
  kind: canon_entity
  ref: exe_a1b2c3d4
```

If missing:
- classify as `orphan_overlay`
- exclude from default task/board/agenda views
- suggest promotion or rewrite

## Rule C — promotion is explicit and loss-aware

When workspace content becomes durable truth, EMA should not “just copy text around.”

Promotion should create an explicit linkage:

```yaml
promoted_from:
  path: workspace/shared/handoffs/hermes-a5--handoff.md
  selected_at: 2026-04-21T05:11:00Z
  promoted_by: agt_operator
promotion_kind: workspace_to_canon
```

This matters because promotion is where semantic drift often happens.

Rule:
- no silent promotion
- no canon entity with unclear source lineage
- no workspace doc labeled “final” without a canonical counterpart if it is durable truth

## Rule D — runtime admission is separate from workspace suggestion

Workspace schedule blocks, actor notes, or handoffs may suggest runtime actions, but runtime only adopts them through admission.

Example:
- workspace says “claude-a9 is working this now”
- runtime does not trust that automatically
- daemon creates an admitted claim only after session bind/claim action

This avoids workspace files faking live state.

## Rule E — canonical mutations should be append-safe and reviewable

Canonical truth should prefer transitions that preserve legibility:
- proposal -> decision
- execution planned -> active -> completed
- intent updated with new refs
- relation added/superseded

Avoid fragile duplicated fields across many files when one reference chain would do.

The more fields duplicated across canon entities, the more drift repair work EMA creates.

## Rule F — stale overlays expire by policy

Workspace collaboration artifacts should not appear fresh forever.

Recommended default TTLs:
- `sessions/` breadcrumbs: hours
- `handoffs/`: until ack/resolved, then archive quickly
- `tasks/exports/`: regenerate or expire daily
- actor notes claiming current activity: short TTL unless refreshed
- swarm dispatches: superseded by new dispatch files

Each overlay type should define:

```yaml
freshness_policy:
  stale_after: PT6H
  expire_after: P7D
  archive_after: P14D
```

When stale:
- render with warning
- de-prioritize in joins
- optionally hide from default views

## Rule G — docs/specs need operational freshness markers

Docs are part of system integrity in EMA, so anti-drift must include documentation.

Architecture docs that describe active behavior should declare:

```yaml
doc_role: architecture_contract | historical_note | draft
applies_to: canon_v1 | runtime_v1 | workspace_v1
last_reconciled_at: 2026-04-21T05:11:00Z
reconciled_against:
  - repo_state
  - runtime_contract
```

If a doc is old and unreconciled:
- mark as advisory
- do not let agents treat it as current operational truth by default

This prevents spec/implementation split-brain.

## Mechanisms EMA should implement

## 1. Reconciler loop

EMA should have a periodic reconciler that compares:

- canonical graph index
- runtime state store
- workspace overlay index

The reconciler should produce incidents, not silently mutate everything.

### Example checks
1. runtime claim exists for `exe_*`, but canonical execution is `completed`
2. workspace handoff asks for work on `prp_*`, but proposal is rejected/superseded
3. actor file says `status: active`, but no runtime heartbeat exists
4. canonical execution is `active`, but no runtime worker/session exists
5. generated export hash does not match current inputs
6. workspace file references missing canonical ids
7. canonical refs exist but point to wrong type/path

### Output shape
```yaml
incident_id: drift_0001
severity: warning | error
drift_kind: runtime_canon_mismatch
detected_at: 2026-04-21T05:11:00Z
source_refs:
  - exe_a1b2c3d4
  - runtime:claim:exe_a1b2c3d4:agt_claude_a9
suggested_fix: close_runtime_claim
auto_fixable: true
```

## 2. Join index with freshness + trust scoring

EMA should index all three domains into a normalized join model, but with trust metadata:

```yaml
ref: exe_a1b2c3d4
canonical_state: active
runtime_state: stale
workspace_mentions: 3
trust:
  canonical: high
  runtime: low
  workspace: medium
freshness:
  canonical_updated_at: ...
  runtime_heartbeat_at: ...
  workspace_updated_at: ...
```

Views should use trust/freshness to avoid presenting stale overlays as truth.

## 3. Write-path enforcement in CLI/daemon

Every mutation command should route to one authority only.

Examples:
- `ema task claim` -> runtime
- `ema handoff resolve` -> workspace
- `ema proposal approve` -> canon
- `ema task done` -> source-specific writeback, never to the computed export

Hard rule:
- no CLI command should default to mutating whichever file is easiest to edit

## 4. Generated file protection

For generated exports in `workspace/shared/tasks/exports/` and similar:
- include generation headers
- optionally store input hash
- reject or warn on manual edits
- regenerate instead of patching in place

Recommended metadata:

```yaml
generated: true
input_hash: sha256:...
render_hash: sha256:...
regenerate_command: ema view render actor--claude-a9
```

## 5. Ack/resolve protocol for handoffs

Handoffs are a major drift source because they linger.

Require simple state transitions:
- `open`
- `acknowledged`
- `resolved`
- `superseded`

And track:
```yaml
from: hermes-a5
to: claude-a9
created_at: ...
acknowledged_at:
resolved_at:
superseded_by:
```

Rule:
- unresolved handoffs older than threshold raise warnings
- a resolved handoff should stop generating default task pressure

## 6. Lease-based actor activity

Actor file `status: active` should not be enough by itself.

If an actor file claims:
```yaml
status: active
current_assignment: ...
```

then either:
- it links to a live runtime session/claim, or
- it is downgraded to `declared_active_unverified`

This avoids “everyone looks busy forever” drift.

## 7. Promotion queue

EMA should maintain a lightweight promotion queue for workspace artifacts that look durable.

Candidates:
- repeated swarm decisions
- stable architecture proposals
- handoffs with accepted conclusions
- actor notes referenced by multiple files
- schedules that became real commitments

The queue can live as a computed report, not another truth store.

Fields:
```yaml
candidate_path: workspace/shared/actors/claude-a9.md
reason: referenced_by_multiple_records
promotion_target: canon/proposals/
status: pending_review
```

## 8. Conflict classification instead of silent overwrite

When domains disagree, EMA should classify conflict type before any fix:

- `workspace_stale`
- `runtime_stale`
- `canon_missing`
- `broken_ref`
- `duplicate_shadow_state`
- `manual_edit_of_generated_file`
- `expired_lease`
- `unpromoted_durable_truth`

This makes repair legible and automatable.

## Recommended precedence rules

When facts disagree, EMA needs stable precedence.

### For durable semantic state
Prefer:
1. canonical graph
2. explicitly promoted/reconciled docs
3. workspace overlays
4. generated exports

### For live operational state
Prefer:
1. runtime/control plane with valid heartbeat/lease
2. recent session breadcrumbs
3. actor files
4. old workspace notes

### For planning/collaboration context
Prefer:
1. newest non-generated workspace artifact with valid refs
2. canon-linked related notes
3. stale workspace artifacts with warnings

Important:
- precedence decides **what to show by default**
- it does not excuse leaving drift unresolved

## Anti-drift file/folder conventions

### `workspace/shared/actors/`
Must be:
- human-readable
- timestamped
- linked to canonical/runtime refs when claiming active work

Must not be:
- sole durable registry of long-term assignments

### `workspace/shared/handoffs/`
Must be:
- directed
- stateful (`open`, `acknowledged`, etc.)
- short-lived

Must not be:
- permanent project memory

### `workspace/shared/tasks/`
Should contain:
- view definitions
- generated exports
- templates

Should not contain:
- manually curated shadow task ledgers

### `workspace/shared/sessions/`
Should be:
- breadcrumbs to runtime/session refs
- freshness-sensitive

Should not be:
- the sole operational session authority

## Minimal v1 validations

EMA should warn or fail when:

1. a generated export is manually edited
2. a workspace record references missing canonical ids
3. a runtime claim points to nonexistent/superseded source
4. an actor claims active work without lease/heartbeat evidence
5. a handoff remains open past TTL
6. a canonical execution is `active` but has no runtime/session support
7. a canonical proposal/decision/execution claims source workspace paths that no longer exist
8. the same fact appears writable in more than one place
9. two computed exports disagree for the same source ref
10. a stale workspace artifact is still feeding default agenda/task views

## Suggested v1 daemon jobs

1. **workspace index reconcile** — rescan files, refresh overlay index
2. **runtime lease sweeper** — expire dead claims/sessions
3. **canon/runtime drift checker** — compare execution and claim status
4. **workspace promotion candidate detector** — flag durable overlay content
5. **generated export verifier** — confirm hashes and freshness
6. **broken reference scanner** — detect missing ids/paths
7. **staleness annotator** — mark old overlays and unresolved handoffs

These jobs should create visible incident records/logs, not hidden magic.

## Recommended CLI surface

- `ema doctor drift` — run drift checks and print incidents
- `ema doctor refs` — find broken refs across canon/workspace/runtime indexes
- `ema workspace stale` — list stale overlays and expired artifacts
- `ema promote suggest` — show promotion candidates from workspace to canon
- `ema task show <task-key>` — include `authority_kind`, `source_ref`, `writeback_target`
- `ema session doctor` — report stale leases / ghost sessions
- `ema handoff audit` — show open/unacked/expired handoffs

## Concrete v1 policies

1. **Everything gets provenance.**
2. **Every live claim gets a lease.**
3. **Every export is marked non-authoritative.**
4. **Every actionable item needs a writeback target.**
5. **Workspace overlays expire unless refreshed or promoted.**
6. **Promotion creates lineage, not just copied text.**
7. **Conflicts become incidents, not silent overwrites.**
8. **CLI writes route to one authority only.**
9. **Default views prefer fresh trusted sources.**
10. **Docs that describe current reality must carry reconciliation metadata.**

## Short version

To stop drift, EMA should act like a system with:
- one semantic authority
- one runtime authority
- one collaboration surface
- zero ambiguous write paths

The key move is not “merge everything.”
It is:

- **label every source**
- **expire stale overlays**
- **lease live state**
- **promote durable truth explicitly**
- **treat views as projections**
- **run reconciliation continuously**

That gives EMA a shared workspace that stays useful without letting it become a shadow brain.
