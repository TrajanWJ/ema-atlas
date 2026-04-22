# claude-a1 — canonical graph v1

Status: complete
Owner: claude-a1
Created: 2026-04-21
Scope: minimal BEAM-native canonical graph v1 for EMA

## Recommendation in one line

EMA canon v1 should be a **git-tracked markdown entity store** with **strict frontmatter**, a **small fixed entity set**, and a **BEAM materialized index in ETS** used for fast reads while keeping filesystem + git as the durable semantic store.

## Design goals

1. Keep canonical truth human-readable and repo-native.
2. Keep runtime truth in the daemon/runtime layer, not in markdown.
3. Avoid inventing a giant ontology before EMA has stable workflows.
4. Make promotion from `workspace/shared/` explicit and loss-aware.
5. Let BEAM treat canon as an indexed graph, not just a pile of files.

## Minimal canon v1 folder model

```text
canon/
├── README.md
├── intents/
├── proposals/
├── decisions/
├── executions/
├── agents/
├── projects/
├── relations/
└── snapshots/
```

### Why this is enough

- `intents/` — durable desired state / goals / work targets
- `proposals/` — suggested changes or plans against intents/projects
- `decisions/` — approval, rejection, supersession, policy decisions
- `executions/` — actual performed work with outcome + lineage
- `agents/` — stable actor identities for authorship / assignment / provenance
- `projects/` — stable scope roots
- `relations/` — only for edges that do not fit cleanly as inline refs
- `snapshots/` — optional generated exports/frozen summaries, never primary graph input

Anything else in v1 is probably premature.

## Canonical entity rule

Every canonical entity is one markdown file:

- path-derived type
- stable string id in frontmatter
- markdown body for human meaning
- frontmatter for machine indexing
- git commit history for temporal audit

Canonical entity files should be named:

```text
canon/<type-plural>/<id>.md
```

Example:

```text
canon/proposals/prp_a1b2c3d4.md
canon/executions/exe_z9y8x7w6.md
```

Do **not** encode status or title in filenames. The id should remain stable even if title/status changes.

## Minimal entity types and required frontmatter

## 1. Intent

```yaml
---
id: int_a1b2c3d4
type: intent
version: 1
title: Establish canonical graph v1
status: active
project_ref: pro_ema0001
parent_intent_ref:
proposal_refs: []
decision_refs: []
execution_refs: []
created_at: 2026-04-21T04:00:00Z
updated_at: 2026-04-21T04:00:00Z
author_ref: agt_claude_a1
labels: [architecture, canon]
---
```

Use for durable goals and target states, not ephemeral todos.

## 2. Proposal

```yaml
---
id: prp_a1b2c3d4
type: proposal
version: 1
title: Add canon markdown entity store
status: proposed
project_ref: pro_ema0001
intent_refs: [int_a1b2c3d4]
supersedes_ref:
decision_refs: []
execution_refs: []
created_at: 2026-04-21T04:05:00Z
updated_at: 2026-04-21T04:05:00Z
author_ref: agt_claude_a1
source_workspace_paths:
  - workspace/shared/actors/claude-a1.md
labels: [architecture, v1]
---
```

Use for candidate plans, changes, or interventions before approval/execution.

## 3. Decision

```yaml
---
id: dec_a1b2c3d4
type: decision
version: 1
title: Approve canon v1 layout
status: accepted
decision_kind: approval
project_ref: pro_ema0001
intent_refs: [int_a1b2c3d4]
proposal_refs: [prp_a1b2c3d4]
supersedes_ref:
created_at: 2026-04-21T04:10:00Z
updated_at: 2026-04-21T04:10:00Z
author_ref: agt_operator
labels: [governance]
---
```

Use for approvals, rejections, supersessions, and explicit architectural rulings.

## 4. Execution

```yaml
---
id: exe_a1b2c3d4
type: execution
version: 1
title: Implement canon folder scaffold
status: completed
result: success
project_ref: pro_ema0001
intent_refs: [int_a1b2c3d4]
proposal_ref: prp_a1b2c3d4
decision_ref: dec_a1b2c3d4
actor_refs: [agt_codex_a10]
started_at: 2026-04-21T04:20:00Z
completed_at: 2026-04-21T04:28:00Z
created_at: 2026-04-21T04:20:00Z
updated_at: 2026-04-21T04:28:00Z
artifact_paths:
  - canon/README.md
  - canon/intents/int_a1b2c3d4.md
git_commit:
summary_ref:
labels: [implementation]
---
```

Use for durable records of what actually happened. Sessions are not executions.

## 5. Agent

```yaml
---
id: agt_claude_a1
type: agent
version: 1
name: claude-a1
status: active
kind: ai_agent
created_at: 2026-04-21T04:00:00Z
updated_at: 2026-04-21T04:00:00Z
labels: [swarm]
---
```

Use as stable provenance handles. Keep lightweight.

## 6. Project

```yaml
---
id: pro_ema0001
type: project
version: 1
title: EMA
status: active
created_at: 2026-04-21T04:00:00Z
updated_at: 2026-04-21T04:00:00Z
labels: [root]
---
```

Use as graph root/scope boundary.

## 7. Relation

Most edges should live inline as `*_ref` and `*_refs` fields on entity nodes.

Only use `relations/` when the edge itself needs metadata.

```yaml
---
id: rel_a1b2c3d4
type: relation
version: 1
relation_type: blocks
source_ref: int_a1b2c3d4
target_ref: int_z9y8x7w6
status: active
created_at: 2026-04-21T04:00:00Z
updated_at: 2026-04-21T04:00:00Z
---
```

This keeps the graph simple without losing typed edges when needed.

## Shared frontmatter contract

Every canonical entity should support these core fields:

```yaml
id:
type:
version: 1
title:
status:
created_at:
updated_at:
author_ref:
labels: []
```

Common reference conventions:

- singular edge: `<name>_ref`
- plural edge: `<name>_refs`
- paths to non-canonical source material: `source_workspace_paths`
- paths to produced artifacts: `artifact_paths`

This keeps parsing and ETS indexing trivial in Elixir.

## Body format

Each entity body should stay markdown-first, not YAML-heavy.

Recommended sections:

```md
# <title>

## Summary

## Context

## Details

## Lineage Notes
```

Frontmatter is for indexable fields.
Body is for explanation, rationale, and human-readable nuance.

## Git as the canonical store

For canon v1, git should be treated as the durable storage layer for semantic records:

- filesystem markdown = canonical content
- git history = append-only audit/history layer
- current checkout = current materialized truth
- BEAM index = performance cache / query layer

That means:

- no database is required for canonical graph persistence in v1
- daemon can rebuild index from disk on boot
- git diff/log become first-class audit and review tools
- promotion into canon naturally becomes a repo change

## BEAM-native read model

The BEAM side should not treat markdown as ad hoc text blobs.
It should load canon into a small in-memory graph index.

### ETS tables assumed in v1

1. `:ema_canon_entities`
   - key: `id`
   - value: parsed entity struct/map

2. `:ema_canon_by_type`
   - key: `type`
   - value: set/list of ids

3. `:ema_canon_refs_out`
   - key: `id`
   - value: outgoing refs `{field, target_id}`

4. `:ema_canon_refs_in`
   - key: `target_id`
   - value: incoming refs `{source_id, field}`

5. `:ema_canon_by_status`
   - key: `{type, status}`
   - value: ids

6. `:ema_canon_by_project`
   - key: `project_ref`
   - value: ids

Optional later:

- `:ema_canon_by_label`
- `:ema_canon_path_index`
- `:ema_canon_fulltext` backed by something else, not ETS alone

### Why ETS is enough initially

- fast startup for a small/medium graph
- cheap fanout queries for agenda/task/lineage views
- simple invalidation when watched files change
- no need to commit to graph DB or extra persistence system yet

ETS here is a **materialized index**, not the source of truth.
If ETS disappears, rebuild from `canon/`.

## Loader/indexer assumptions

A minimal Elixir loader should:

1. walk `canon/**/*.md`
2. parse frontmatter + body
3. validate `id`, `type`, `version`
4. assert path/type agreement
5. extract all `*_ref` and `*_refs`
6. insert entity + edges into ETS
7. expose query helpers for lineage and scoped listings

On invalid files, the daemon should mark them as index errors rather than silently accepting malformed canon.

## Promotion boundary: workspace -> canon

This is the most important rule.

### Shared workspace is for

- handoffs
- planning drafts
- swarm coordination
- session breadcrumbs
- scratch synthesis
- local operational notes

### Canon is for

- durable intent
- approved proposals
- explicit decisions
- completed or materially started executions
- stable actors/projects/relations

## Promotion test

A workspace artifact should be promoted only if at least one is true:

1. it defines durable state EMA should remember after the current session
2. it changes or clarifies intent/proposal/decision/execution lineage
3. another agent or operator must be able to cite it as authoritative later
4. losing it would damage project memory or auditability

If not, it should remain in workspace or be discarded.

## Promotion pattern

Do **not** simply move raw workspace notes into canon unchanged.
Prefer this flow:

1. workspace file captures active thinking
2. agent/operator distills durable outcome
3. new canonical entity is written into `canon/`
4. canonical entity links back via `source_workspace_paths`
5. workspace file may then link forward to canonical id

That preserves signal and avoids canon becoming a dump of scratch markdown.

## Authority split

To stay aligned with existing EMA decisions:

- `workspace/shared/` = collaboration surface
- `canon/` = durable semantic/project truth
- daemon runtime/control plane = live operational truth

More concretely:

- session liveness belongs to runtime
- PTY bindings belong to runtime/session records
- active clocks/cadences belong to runtime
- intent/proposal/decision/execution lineage belongs to canon
- pre-canonical notes belong to workspace

## Minimal v1 invariants

1. Every canonical file has exactly one entity.
2. Every entity id is globally unique.
3. File path and `type` must agree.
4. References point to ids, not filenames.
5. Canon writes happen through repo files and are git-reviewable.
6. ETS may be rebuilt entirely from disk.
7. Workspace files are never auto-treated as canonical without explicit promotion.

## Recommended first implementation slice

1. create `canon/` with the 7 folders above
2. define one Elixir parser/validator for frontmatter entities
3. define one entity struct representation
4. build ETS loader + watcher-based reindex
5. support only `project`, `agent`, `intent`, `proposal`, `decision`, `execution`
6. reserve `relation` for exceptional cases
7. add one CLI command like `ema canon validate` and one like `ema canon lineage <id>`

## Bottom line

The smallest viable EMA canonical graph is **not** a database-first graph engine.
It is:

- markdown entities in `canon/`
- strict frontmatter contracts
- git-backed durability and review
- ETS-backed BEAM query index
- explicit promotion from workspace into canonical records

That gives EMA a usable graph-shaped memory system immediately, without collapsing workspace, runtime, and canon into one ambiguous store.
