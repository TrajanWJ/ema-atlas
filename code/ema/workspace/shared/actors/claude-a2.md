# claude-a2 — temporal engine v1

- owner: claude-a2
- created_at: 2026-04-21T04:47:00Z
- status: proposed
- scope: minimal temporal frontmatter + CLI surface for EMA v1

## Goal

Define the smallest useful temporal model that lets EMA:

1. place work into explicit time blocks
2. show an actor agenda for now/today/next
3. attach recurring intent through a cadence reference
4. track execution state without needing a full calendar system first

This should work in markdown/frontmatter first, with daemon indexing later.

## Design stance

For v1, temporal data should be:

- **small**: a few fields that fit in normal markdown entities
- **composable**: usable in canon entities and shared workspace files
- **indexable**: easy for CLI/daemon to scan without complex parsing
- **non-calendar-native**: enough for planning and execution, not a full scheduling suite

## Minimal temporal frontmatter v1

### Required v1 fields

```yaml
scheduled_window:
  start: 2026-04-21T09:00:00Z
  end: 2026-04-21T10:30:00Z
phase: queued
cadence_ref: daily-startup
```

### Semantics

#### `scheduled_window`
A bounded intended execution window.

Minimal shape:

```yaml
scheduled_window:
  start: <iso8601 timestamp>
  end: <iso8601 timestamp>
```

Rules:

- `start` and `end` are ISO-8601 timestamps
- `end` must be later than `start`
- omitted `scheduled_window` means unscheduled
- v1 should prefer UTC storage; display conversion can happen in CLI
- this is a **plan window**, not proof of actual runtime execution

Why this field exists:

- supports `ema block`
- supports day/agenda views
- gives the daemon a simple sortable interval
- avoids premature complexity like RRULEs or external calendar semantics

#### `phase`
Current temporal lifecycle state of the item.

Recommended v1 enum:

- `queued` — intended but not active yet
- `ready` — schedulable / can start now if chosen
- `active` — currently in execution
- `paused` — intentionally interrupted
- `done` — completed
- `missed` — scheduled window passed without completion
- `canceled` — no longer intended

Rules:

- `phase` is the operator-facing execution state
- `phase` is not the same thing as canonical approval/proposal state
- `active` should be rare and usually driven by an explicit CLI action or runtime signal
- `missed` can be computed by CLI/indexer, but allowing it in frontmatter is useful for explicit acknowledgement

#### `cadence_ref`
Reference to a named recurrence/cadence definition.

Minimal shape:

```yaml
cadence_ref: daily-startup
```

Rules:

- value is a stable string identifier, not an inline schedule rule
- it points to a cadence definition elsewhere in EMA later
- in v1, unresolved `cadence_ref` is allowed but should warn in validation
- absence means one-off work

Why reference instead of embedding recurrence rules now:

- keeps frontmatter small
- allows future canonical cadence entities
- avoids locking v1 into a calendar spec too early

## Optional but useful adjacent fields

These are not the temporal core, but they make the v1 CLI much more usable.

```yaml
actor: claude-a2
timezone: UTC
blocked_by: []
priority: 3
```

Recommended interpretation:

- `actor`: owner/assignee for agenda views
- `timezone`: preferred display timezone, not the source of truth
- `blocked_by`: keeps `ema agenda` from surfacing impossible work as actionable
- `priority`: simple sorting tie-breaker

## Minimal entity example

```markdown
---
id: block-2026-04-21-deep-work
kind: block
actor: claude-a2
title: Draft temporal engine v1
scheduled_window:
  start: 2026-04-21T09:00:00Z
  end: 2026-04-21T10:30:00Z
phase: queued
cadence_ref:
status: active
---

Draft the minimal temporal frontmatter and CLI surface for EMA v1.
```

## Cadence definition shape for later lookup

Do not require this everywhere in v1, but design `cadence_ref` so it can point at something like:

```markdown
---
id: cadence-daily-startup
kind: cadence
name: daily-startup
schedule_hint: every day at local 09:00
default_duration_minutes: 30
timezone: America/Los_Angeles
status: active
---
```

Important: `schedule_hint` can be descriptive in v1. It does not need a full recurrence grammar yet.

## CLI surface v1

The CLI should expose three user-facing verbs first:

1. `ema block` — create/update explicit time blocks
2. `ema schedule` — inspect and normalize schedule data
3. `ema agenda` — show actionable temporal views

### 1. `ema block`

Purpose: create or mutate a scheduled work block attached to a markdown entity or standalone block file.

#### Proposed subcommands

```bash
ema block create <title> --start <ts> --end <ts>
ema block create <title> --today 09:00-10:30
ema block move <id> --start <ts> --end <ts>
ema block start <id>
ema block pause <id>
ema block done <id>
ema block cancel <id>
ema block list [--actor <id>] [--day <date>]
```

#### Effects

- `create` writes a markdown item with `scheduled_window` and `phase: queued`
- `move` updates `scheduled_window`
- `start` sets `phase: active`
- `pause` sets `phase: paused`
- `done` sets `phase: done`
- `cancel` sets `phase: canceled`
- `list` is a raw schedule-oriented view, less filtered than `agenda`

#### v1 default behavior

If no storage target is specified, blocks should land in the shared workspace schedule area, not canon by default.

Example path strategy:

- `workspace/shared/schedules/YYYY-MM-DD--<slug>.md`

This respects the workspace/canon boundary: planned local execution first, canonical promotion later if needed.

### 2. `ema schedule`

Purpose: inspect schedule state and validate temporal metadata.

#### Proposed subcommands

```bash
ema schedule show [--actor <id>] [--day <date>] [--week]
ema schedule validate [<path>]
ema schedule freebusy [--actor <id>] [--day <date>]
ema schedule pull [--actor <id>]
```

#### Notes

- `show` renders scheduled items ordered by `scheduled_window.start`
- `validate` checks timestamp format, start/end ordering, and `cadence_ref` resolution where possible
- `freebusy` is a thin computed view over existing blocks, not a separate store
- `pull` means “collect scheduled items from workspace + known canonical sources,” not external calendar sync yet

If scope must be reduced further for first landing, keep only:

```bash
ema schedule show
ema schedule validate
```

### 3. `ema agenda`

Purpose: answer “what should I do now or next?”

#### Proposed invocations

```bash
ema agenda
ema agenda --now
ema agenda --today
ema agenda --actor <id>
ema agenda --next 5
ema agenda --include-missed
```

#### Agenda selection logic

`ema agenda` should be a computed view, not its own data store.

Suggested v1 ordering:

1. `phase: active`
2. current `scheduled_window` containing now
3. upcoming `queued`/`ready` items ordered by nearest `scheduled_window.start`
4. unscheduled `ready` items
5. optionally `missed` items

Suggested default filters:

- exclude `done` and `canceled`
- exclude blocked items when `blocked_by` is non-empty
- prefer actor-scoped results when actor context is known

This gives EMA a useful operator loop without needing a full planner.

## Derived behavior

The daemon/indexer should compute these views from frontmatter, not duplicate them as separate truth.

### Computable states

Given `scheduled_window`, `phase`, and clock time, EMA can derive:

- `is_now` — current time is inside the scheduled window
- `is_upcoming` — start is in the future
- `is_overdue` — end is in the past while phase is not terminal
- `duration_minutes`
- agenda ordering

This is enough for v1 dashboards and CLI summaries.

## Validation rules for v1

Minimal validator rules:

1. `scheduled_window.start` and `scheduled_window.end` must parse as ISO-8601
2. `end > start`
3. `phase` must be in the allowed enum
4. `cadence_ref` may be null/empty, but if present should be a simple stable identifier
5. warn when `phase: active` but current time is far outside the window
6. warn when overlapping active blocks exist for the same actor

## What should stay out of v1

Avoid adding these to the first slice:

- full RRULE recurrence support
- external calendar sync
- time-tracking as canonical truth
- complex dependency scheduling
- automatic rescheduling heuristics
- rich timezone math embedded in every file
- a separate agenda persistence store

## Boundary between workspace, canon, and runtime

### Shared workspace
Best place for:

- local blocks
- actor planning
- near-term agendas
- schedule experiments

### Canon
Best place for:

- durable cadence definitions
- approved recurring responsibilities
- durable commitments worth preserving

### Runtime
Best place for:

- current clock tick
- active session state
- watchers/indexes over schedule files
- ephemeral “what is active right now” signals

## Recommended first implementation slice

If implementation time is tight, land exactly this:

### Frontmatter

```yaml
scheduled_window:
  start: <iso8601>
  end: <iso8601>
phase: queued|ready|active|paused|done|missed|canceled
cadence_ref: <string-or-null>
```

### Commands

```bash
ema block create <title> --start <ts> --end <ts>
ema block start <id>
ema block done <id>
ema block list [--day <date>]
ema schedule show [--day <date>]
ema schedule validate [<path>]
ema agenda [--today|--now]
```

That is enough to prove the temporal engine shape before building deeper OTP and canonical integrations.

## Bottom line

EMA v1 does not need a full calendar engine.
It needs a minimal temporal grammar that lets agents and the daemon agree on:

- **when work is intended to happen** → `scheduled_window`
- **what lifecycle state it is in** → `phase`
- **whether it belongs to a recurring pattern** → `cadence_ref`

Then `ema block`, `ema schedule`, and `ema agenda` can operate as thin, useful interfaces over markdown-backed temporal state.
