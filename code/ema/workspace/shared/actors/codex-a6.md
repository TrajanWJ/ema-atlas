# codex-a6 — workspace folder hardening

- actor_id: codex-a6
- harness: Codex
- role: audit shared workspace structure and propose hardening for immediate 10+ agent use
- status: complete
- created_at: 2026-04-21T04:56Z
- updated_at: 2026-04-21T05:05Z
- inputs:
  - `workspace/shared/README.md`
  - `workspace/shared/WORKSPACE_CONTRACT.md`
  - `docs/AGENT_SHARED_WORKSPACE_ARCHITECTURE.md`
  - `workspace/shared/swarm/SWARM_META_BUILD_2026-04-21.md`
- outputs:
  - `workspace/shared/actors/codex-a6.md`

## Bottom line

The current `workspace/shared/` layout is a good skeleton, but it is **not yet hardened for immediate use by 10+ agents**. It has top-level buckets, but it lacks the things that make a shared workspace actually operable under load:

1. **local folder-level guidance**
2. **standard templates**
3. **indexes / manifests for fast discovery**
4. **lifecycle separation** for active vs archived/stale artifacts
5. **naming/status conventions** that agents can follow without guessing

Right now, agents can place files here, but they still have to infer structure. That means drift will happen immediately.

## Audit of current state

Current structure is roughly:

```text
workspace/shared/
├── README.md
├── WORKSPACE_CONTRACT.md
├── actors/
├── exports/
├── handoffs/
├── inbox/
├── plans/
├── schedules/
├── scratch/
├── sessions/
├── swarm/
└── tasks/
```

What is present:
- strong top-level intent
- clear authority boundary vs canon/runtime
- correct major collaboration buckets
- swarm docs already using the space

What is missing:
- no `START_HERE.md` or “how to operate this today” entrypoint
- no per-folder `README.md` files
- no reusable templates for actor/handoff/plan/session/task/schedule docs
- no directory-level active/archive split
- no index files for actor registry, current handoffs, current session map, or current task views
- no explicit stale/closed/archive convention
- no examples to show required fields
- no reserved place for shared schemas/conventions
- no per-actor scratch convention
- no inbox triage lifecycle

## Design principle for hardening

Do **not** turn `workspace/shared/` into a second canonical database.

Instead, add just enough structure so agents can:
- discover the right place quickly
- write files with consistent shapes
- distinguish active vs stale material
- find the latest coordination state without scanning every file
- promote durable truth elsewhere later

## Recommended additions

## 1. Add a `START_HERE.md` at workspace root

### Why
`README.md` explains architecture, but a busy agent needs an operational entrypoint.

### Proposed file
- `workspace/shared/START_HERE.md`

### Should contain
- what to read first
- where to write actor output
- where to put handoffs
- filename rules
- “active vs archived” rule
- “promote durable truth out of here” reminder
- 5-minute startup checklist

### Startup checklist
1. read `START_HERE.md`
2. read `swarm/` current dispatch or session doc
3. open your `actors/<actor-id>.md`
4. check `handoffs/` for anything addressed to you
5. check `sessions/` for current runtime/session attachment
6. write outputs in the declared location

## 2. Add per-folder `README.md` files

### Why
Top-level folder names are not enough once many agents are writing concurrently.

### Proposed files
```text
workspace/shared/actors/README.md
workspace/shared/handoffs/README.md
workspace/shared/inbox/README.md
workspace/shared/plans/README.md
workspace/shared/schedules/README.md
workspace/shared/tasks/README.md
workspace/shared/sessions/README.md
workspace/shared/swarm/README.md
workspace/shared/scratch/README.md
workspace/shared/exports/README.md
```

### Each folder README should define
- purpose
- what belongs there
- what does not belong there
- filename patterns
- required frontmatter/heading fields
- active/archive rules
- example files

This is the smallest change with the highest anti-drift value.

## 3. Add a `templates/` folder

### Why
Without templates, every agent invents its own file shape.

### Proposed folder
```text
workspace/shared/templates/
```

### Proposed contents
```text
workspace/shared/templates/actor.md
workspace/shared/templates/handoff.md
workspace/shared/templates/plan.md
workspace/shared/templates/task-view.md
workspace/shared/templates/schedule-block.md
workspace/shared/templates/session.md
workspace/shared/templates/inbox-item.md
workspace/shared/templates/export-note.md
workspace/shared/templates/swarm-dispatch.md
workspace/shared/templates/checklist.md
```

### This is the single most important missing folder.

## 4. Add active/archive lifecycle splits

### Why
A flat folder becomes unreadable fast once files accumulate across sessions and days.

### Minimal pattern
Use subfolders only where churn is high:

```text
actors/archive/
handoffs/active/
handoffs/archive/
inbox/new/
inbox/triaged/
inbox/archive/
plans/active/
plans/archive/
schedules/active/
schedules/archive/
sessions/active/
sessions/archive/
swarm/archive/
exports/pending/
exports/promoted/
```

### Notes
- `actors/` should keep current actor records at the top level; old ones go in `actors/archive/`
- `sessions/active/` vs `sessions/archive/` is especially important
- `handoffs/active/` prevents stale handoffs from looking current
- `exports/pending/` vs `exports/promoted/` supports promotion workflow without ambiguity

## 5. Add lightweight index files for fast discovery

### Why
With 10+ agents, scanning directories is too slow and too error-prone.

These should be **small computed or maintained indexes**, not authorities.

### Proposed files
```text
workspace/shared/actors/INDEX.md
workspace/shared/handoffs/INDEX.md
workspace/shared/sessions/INDEX.md
workspace/shared/tasks/INDEX.md
workspace/shared/swarm/INDEX.md
```

### Purpose of each
- `actors/INDEX.md` — active agents, status, assignment, output path
- `handoffs/INDEX.md` — open handoffs by target actor
- `sessions/INDEX.md` — active session records and resume points
- `tasks/INDEX.md` — latest task/agenda view files
- `swarm/INDEX.md` — current dispatch, current synthesis, current registry-like docs

These are navigational aids, not canonical truth.

## 6. Add a `conventions/` or `schemas/` folder

### Why
Templates alone are not enough if naming and status vocabularies drift.

### Recommended choice
```text
workspace/shared/conventions/
```

### Proposed contents
```text
workspace/shared/conventions/FILENAME_RULES.md
workspace/shared/conventions/STATUS_VOCAB.md
workspace/shared/conventions/TIMESTAMP_RULES.md
workspace/shared/conventions/LINKING_RULES.md
workspace/shared/conventions/PROMOTION_RULES.md
```

### Minimal vocabularies worth standardizing now
- status: `assigned | active | blocked | done | stale | archived`
- timestamps: ISO-8601 UTC
- links: always repo-relative paths in backticks
- filenames: date-prefixed or actor/task-scoped, as already suggested in contract

This avoids every harness inventing different status words.

## 7. Add explicit inbox triage structure

### Why
`inbox/` is currently too vague. Multi-agent teams need to know whether something is unreviewed or already routed.

### Proposed structure
```text
inbox/
├── README.md
├── new/
├── triaged/
└── archive/
```

### Meaning
- `new/` — not yet reviewed or assigned
- `triaged/` — reviewed and linked to task/plan/handoff elsewhere
- `archive/` — closed or superseded intake notes

This keeps intake from becoming a junk drawer.

## 8. Add explicit session structure

### Why
Sessions are one of the highest-drift areas. The current empty `sessions/` bucket is too weak.

### Proposed structure
```text
sessions/
├── README.md
├── INDEX.md
├── active/
├── archive/
└── attachments/
```

### Meaning
- `active/` — one current breadcrumb file per live session
- `archive/` — completed or stale sessions
- `attachments/` — optional helper artifacts like transcript references, tmux notes, PTY metadata links

Even if `attachments/` is rarely used, reserving it now prevents ad hoc placement later.

## 9. Add `scratch/<actor-id>/` convention

### Why
A shared `scratch/` root becomes chaotic immediately.

### Proposed rule
Each active agent gets its own scratch subtree:

```text
scratch/
├── README.md
├── shared/
├── claude-a1/
├── claude-a2/
├── hermes-a4/
├── codex-a6/
└── ...
```

### Minimal meaning
- `scratch/shared/` — intentionally shared temporary artifacts
- `scratch/<actor-id>/` — disposable actor-local work area

This preserves utility without turning scratch into hidden permanent storage.

## 10. Add `examples/` or embed examples in templates

### Why
Some agents follow examples better than abstract rules.

### Preferred option
Either:
- add `workspace/shared/examples/`
- or put one realistic filled example in each template file

I slightly prefer **filled examples inside templates**, to avoid maintaining two parallel sets of files.

## High-priority concrete folder/file set

If we only add the minimum needed for immediate 10+ agent usability, it should be this:

```text
workspace/shared/
├── START_HERE.md
├── templates/
│   ├── actor.md
│   ├── handoff.md
│   ├── plan.md
│   ├── schedule-block.md
│   ├── session.md
│   ├── task-view.md
│   └── inbox-item.md
├── conventions/
│   ├── FILENAME_RULES.md
│   ├── STATUS_VOCAB.md
│   ├── TIMESTAMP_RULES.md
│   └── PROMOTION_RULES.md
├── actors/
│   ├── README.md
│   ├── INDEX.md
│   └── archive/
├── handoffs/
│   ├── README.md
│   ├── INDEX.md
│   ├── active/
│   └── archive/
├── inbox/
│   ├── README.md
│   ├── new/
│   ├── triaged/
│   └── archive/
├── plans/
│   ├── README.md
│   ├── active/
│   └── archive/
├── schedules/
│   ├── README.md
│   ├── active/
│   └── archive/
├── sessions/
│   ├── README.md
│   ├── INDEX.md
│   ├── active/
│   ├── archive/
│   └── attachments/
├── tasks/
│   ├── README.md
│   ├── INDEX.md
│   └── views/
├── swarm/
│   ├── README.md
│   ├── INDEX.md
│   └── archive/
├── exports/
│   ├── README.md
│   ├── pending/
│   └── promoted/
└── scratch/
    ├── README.md
    └── shared/
```

## Folder-by-folder missing pieces

## `actors/`
### Missing
- actor template
- actor index
- archive convention

### Recommended files
- `actors/README.md`
- `actors/INDEX.md`
- `templates/actor.md`
- `actors/archive/`

### Why
Actor files are already functioning as the registry, so they need the strongest consistency.

## `handoffs/`
### Missing
- active/archive split
- open handoff index
- explicit template

### Recommended files
- `handoffs/README.md`
- `handoffs/INDEX.md`
- `handoffs/active/`
- `handoffs/archive/`
- `templates/handoff.md`

### Why
Handoffs lose value if stale notes cannot be distinguished from open work.

## `tasks/`
### Missing
- clear distinction between computed views and authored notes
- index of latest views
- view template

### Recommended structure
```text
tasks/
├── README.md
├── INDEX.md
├── views/
└── snapshots/
```

### Note
This stays compatible with the “tasks are computed views, not duplicate stores” direction.

## `sessions/`
### Missing
- active/archive split
- current session index
- session breadcrumb template

### Recommended files
- `sessions/README.md`
- `sessions/INDEX.md`
- `sessions/active/`
- `sessions/archive/`
- `templates/session.md`

### Why
This is required if sessions are going to be resumable and discoverable.

## `swarm/`
### Missing
- current-vs-old coordination docs separation
- index of active swarm docs

### Recommended files
- `swarm/README.md`
- `swarm/INDEX.md`
- `swarm/archive/`

### Why
Swarm dispatches and syntheses will accumulate quickly.

## `exports/`
### Missing
- promotion-state separation
- export-note template

### Recommended structure
```text
exports/
├── README.md
├── pending/
├── promoted/
└── rejected/
```

Optional but useful:
- `rejected/` for exports that should not be promoted after review

## `plans/` and `schedules/`
### Missing
- active/archive split
- templates

### Recommended files
- `plans/README.md`
- `plans/active/`
- `plans/archive/`
- `templates/plan.md`

- `schedules/README.md`
- `schedules/active/`
- `schedules/archive/`
- `templates/schedule-block.md`

## Suggested template shapes

## `templates/actor.md`
```md
# <actor-id>

- actor_id: <actor-id>
- harness: <runtime>
- role: <short role>
- status: assigned|active|blocked|done
- assignment: <current task>
- inputs:
  - <path>
- outputs:
  - <path>
- handoff_to:
- updated_at: <timestamp>

## Notes

## Current conclusions

## Open questions
```

## `templates/handoff.md`
```md
# <from-actor> handoff

- from: <actor-id>
- to: <actor-id>
- subject: <short subject>
- status: active
- created_at: <timestamp>
- related_paths:
  - <path>

## Why this handoff exists

## Current state

## Read next

## Exact next action requested

## Blockers / caveats
```

## `templates/session.md`
```md
# <session-id>

- actor_id: <actor-id>
- session_id: <session-id>
- status: active|stale|closed
- started_at: <timestamp>
- updated_at: <timestamp>
- tool_surface: tmux|pty|daemon|other
- attached_to:
  - <execution-ref-or-path>
- resume_hint: <short command or location>

## Current focus

## Bound files

## Recent outputs

## Next resume action
```

## `templates/task-view.md`
```md
# <view-name>

- view_type: agenda|board|queue|by-actor|by-project
- generated_at: <timestamp>
- generated_from:
  - <path or entity source>
- scope: <scope>
- freshness: ephemeral

## Items

- [ ] <item> — owner: <actor> — source: <path/ref>
```

## `templates/schedule-block.md`
```md
# <date> <topic>

- actor_id: <actor-id>
- status: scheduled|active|done|cancelled
- scheduled_window: <timestamp..timestamp>
- phase:
- related_refs:
  - <path or ref>
- updated_at: <timestamp>

## Goal

## Inputs

## Expected output
```

## `templates/inbox-item.md`
```md
# <intake topic>

- created_at: <timestamp>
- created_by: <actor or source>
- status: new|triaged|archived
- related_paths:
  - <path>

## Raw intake

## Why it matters

## Suggested routing
```

## Operational rules I would add immediately

## Rule 1: every high-churn folder gets `README.md` + template + active/archive rule
Without that, the folder is only nominally defined.

## Rule 2: every active artifact must declare `updated_at`
This gives agents a basic way to judge freshness.

## Rule 3: every index file is advisory, not authoritative
Useful for navigation, but no second hidden truth store.

## Rule 4: stale files must move out of the active surface
Especially in:
- `handoffs/`
- `sessions/`
- `plans/`
- `schedules/`
- `swarm/`

## Rule 5: scratch must be actor-scoped unless intentionally shared
Prevents accidental hiding of important context.

## Rule 6: templates should live in-repo before more swarms launch
This is the fastest way to reduce drift across harnesses.

## Priority order

## P0 — must add before relying on this for 10+ agents
1. `START_HERE.md`
2. `templates/`
3. folder `README.md` files
4. `handoffs/active|archive`
5. `sessions/active|archive`
6. `actors/INDEX.md`
7. `swarm/INDEX.md`

## P1 — should add next
1. `conventions/`
2. `inbox/new|triaged|archive`
3. `plans/active|archive`
4. `schedules/active|archive`
5. `tasks/INDEX.md` and `tasks/views/`
6. `exports/pending|promoted`

## P2 — useful but optional for first pass
1. `attachments/` under `sessions/`
2. `rejected/` under `exports/`
3. actor-scoped `scratch/<actor-id>/` precreated
4. filled example docs

## Final recommendation

The current workspace should be treated as **v0 skeleton**. To make it truly usable by 10+ agents immediately, EMA should add:

- one operational entrypoint (`START_HERE.md`)
- per-folder local rules (`README.md` in each folder)
- reusable templates (`templates/`)
- lifecycle separation (`active/`, `archive/`, `pending/`, `promoted/`)
- lightweight indexes (`INDEX.md`)
- a small conventions layer (`conventions/`)

That is enough to make the shared workspace legible, navigable, and resistant to immediate drift without turning it into a second canonical system.
