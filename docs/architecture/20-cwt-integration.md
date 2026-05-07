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
- Promoted CWT project/storage artifacts should land in EMA project Git
  worktrees. CWT shared files are feeder projections, not durable versioning.

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

## Holodeck Launch Bridge

CWT also has a shell-level launch bridge in the EMA web surface:

```text
http://localhost:5173/cwt
http://localhost:5173/?vapp=cwt
```

The EMA vApp id is `cwt`, label `Current Work`. It registers with the same app
registry used by the Dock, Launchpad, URL router, direct panel routes, and the
holodeck left rail. The rendered surface is an iframe pointing at the standalone
CWT web server, which defaults to:

```text
http://localhost:3015
```

The URL can be overridden in the EMA web build with:

```bash
NEXT_PUBLIC_CWT_WEB_URL=http://localhost:3015
```

This bridge is intentionally a launcher/embedder, not a data authority. The CWT
SQLite store and shared-files projection continue to own CWT-side truth until
the daemon import/mirroring writer exists.

## EMA CLI

Readiness:

```bash
ema cwt status --json
```

Promotion preview:

```bash
ema cwt ingest --dry-run --json
```

Promotion commit:

```bash
ema cwt ingest --all --json
ema cwt ingest --only queue:<id>,problem:<id> --json
```

The non-dry-run ingest path writes the first proven record families through the
existing daemon command writers:

- `lane` -> `lane.open`
- `queue_item` -> `queue.add`
- `problem` -> `problem.log`

Every imported record carries a `cwt.shared_files:<cwt-id>` source marker. The
commit path uses that marker as its idempotency key, so re-running the same
import is a no-op for records already mirrored into daemon state.

The writer refuses records whose `project_id` is not already known by the daemon.
That keeps CWT import from accidentally minting duplicate project worktrees.
Project materialization and project-id reconciliation are still explicit follow-up
work.

Dry-run output includes a `project_storage` policy. The default is
`driver: "git_worktree"` and `versioning: "git"`, matching EMA project
materialization.

## Promotion Boundary

The first daemon writer should be named around import intent, not around CWT as
a permanent subsystem. CWT is a feeder surface.

Writer shape:

```text
cwt.import_preview     read-only validation and mapping
cwt.import_commit      daemon command write after operator confirmation
```

Current `cwt.import_commit` behavior:

- preserve the CWT source id in metadata/provenance;
- write lane, queue item, and problem records into daemon-canonical events;
- reject queue items missing `why`, `done_when`, or `source`;
- reject records whose projects are not daemon-known;
- skip records already carrying the same `cwt.shared_files:<cwt-id>` marker.

Remaining promotion work:

- daemon event family or import ledger records for `cwt.*_imported`;
- write-back of daemon mirror ids to CWT projection/source rows;
- project materialization/reconciliation for CWT projects not yet daemon-known;
- expansion beyond lane/queue/problem to campaign, mission, handoff, execution,
  vCalendar, responsibility, and checkup records.

## First-Day Operating Contract

For day one, the useful loop is:

1. Capture all live obligations in CWT.
2. Run the CWT in-app Agent Chat command `sync`.
3. Run `ema cwt status --json`.
4. Run `ema cwt ingest --dry-run --json`.
5. Claim one EMA lane only after the queue preview is coherent.

This keeps CWT fast and local while giving EMA enough structure to integrate the
data without a migration later.
