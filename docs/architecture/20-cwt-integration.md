# 20 - current-work-tracker integration

Status: active bridge
Date: 2026-05-07

## Purpose

`current-work-tracker-trajan` (CWT) is the local-first capture surface for
Trajan's day-to-day work state. EMA is the long-term authority for canonical
lane, queue, problem, handoff, execution, vCalendar, campaign, and mission
records.

The integration rule is simple:

- CWT may own draft/local records in SQLite.
- CWT must project a readable mirror into the Desktop shared-files root.
- EMA may inspect that projection and preview promotion.
- EMA must not treat CWT SQLite or the shared-files mirror as canonical daemon
  truth until a daemon import writer records EMA events.

## File Projection

Default root:

```text
~/Desktop/Space shared files-uploads-vDesktop-vFilesystem-root/current-work-tracker-trajan/
```

Required files:

```text
manifest.json
local-n-sync/index.json
local-n-sync/current-state.md
records/projects/index.json
records/projects/<id>.json
records/lanes/index.json
records/queue/index.json
records/queue/<id>.json
records/campaigns/index.json
records/problems/index.json
records/handoffs/index.json
records/vcalendar/index.json
records/executions/index.json
records/responsibilities/index.json
records/checkups/index.json
```

`manifest.json` identifies the projection:

```json
{
  "projection": "cwt-shared-files-v0",
  "generated_at": "2026-05-07T00:00:00.000Z",
  "counts": {
    "projects": 3,
    "lanes": 3,
    "queue_items": 4
  },
  "local_n_sync": {
    "mode": "file_projection",
    "namespace": "current-work-tracker-trajan",
    "index": "local-n-sync/index.json",
    "current_state": "local-n-sync/current-state.md"
  }
}
```

`local-n-sync/current-state.md` is the human/agent-readable summary. JSON record
files are the machine-readable source for promotion previews.

## EMA CLI

Readiness:

```bash
ema cwt status --json
```

Promotion preview:

```bash
ema cwt ingest --dry-run --json
```

The non-dry-run ingest path intentionally returns `writer_pending`. That is the
correct behavior until EMA has a daemon writer that accepts a CWT import bundle
and emits canonical `project`, `lane`, `queue_item`, `problem`, `handoff`,
`execution`, and `vcalendar` events.

## Promotion Boundary

The first daemon writer should be named around import intent, not around CWT as
a permanent subsystem. CWT is a feeder surface.

Recommended writer shape:

```text
cwt.import_preview     read-only validation and mapping
cwt.import_commit      daemon event write after operator confirmation
```

`cwt.import_commit` must:

- preserve the CWT source id in metadata/provenance;
- map CWT `project.kind` into an EMA-supported field or log a problem record if
  `project.kind` remains outside `@ema/contracts`;
- reject queue items missing `why`, `done_when`, or `source`;
- preserve lane/queue/problem/handoff dependencies;
- record an execution event with the projection root and manifest timestamp.

## First-Day Operating Contract

For day one, the useful loop is:

1. Capture all live obligations in CWT.
2. Run the CWT in-app Agent Chat command `sync`.
3. Run `ema cwt status --json`.
4. Run `ema cwt ingest --dry-run --json`.
5. Claim one EMA lane only after the queue preview is coherent.

This keeps CWT fast and local while giving EMA enough structure to integrate the
data without a migration later.
