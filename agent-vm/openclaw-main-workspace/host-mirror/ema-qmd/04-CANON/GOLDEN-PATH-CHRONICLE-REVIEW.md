# Golden Path — Chronicle Review Decisions

This is the active Chronicle -> Review -> Promotion Receipt flow on the current branch.

## Purpose

- Chronicle is the raw landing zone for imported session/history material.
- Review is the curation and decision layer over Chronicle sessions and entries.
- Promotion receipts are the durable bridge into real runtime objects or recorded downstream targets.

## Flow

1. Import raw material into Chronicle.
   - `POST /api/chronicle/import`
   - `POST /api/chronicle/import-file`
   - `ema chronicle import-bundle`
   - `ema chronicle import-file`
2. Chronicle persists raw payloads and stored artifacts under `~/.local/share/ema/chronicle/`.
3. Chronicle indexes session, entry, and artifact metadata in SQLite.
4. A Chronicle extraction or backfill pass derives durable review candidates from imported sessions.
   - `POST /api/review/backfill`
   - direct service call: `backfillChronicleReviewQueue(...)`
5. Review items become visible in the review queue.
   - `GET /api/review/items`
   - `ema review list`
6. Humans approve, reject, or defer review items.
   - `POST /api/review/items/:id/approve`
   - `POST /api/review/items/:id/reject`
   - `POST /api/review/items/:id/defer`
   - `ema review approve|reject|defer <id>`
7. Approved items can be promoted into real runtime targets and produce promotion receipts as lineage.
   - `POST /api/review/items/:id/promote`
   - `ema review promote <id> --to <intent|goal|calendar_entry|execution> ...`
8. Promotion receipts write a durable provenance bridge and link the Chronicle source back to what it informed.

## Current Promotion Targets

- `intent`
- `goal`
- `calendar_entry`
- `execution`

Promotion currently creates or attaches to these real runtime targets, then records a durable receipt/provenance bridge.

## Provenance Rule

- Chronicle raw files remain the import landing zone.
- SQLite review tables must always retain:
  - `extraction_id`
  - `chronicle_session_id`
  - `chronicle_entry_id` where applicable
  - `chronicle_artifact_id` where applicable
  - human decision actor/timestamp fields on the review item
- Promotion receipts must always retain:
  - `review_item_id`
  - `extraction_id`
  - `chronicle_session_id`
  - `chronicle_entry_id` where applicable
  - `chronicle_artifact_id` where applicable
  - `target_kind`
  - `target_id`

## Current Scope

The current Review layer is intentionally thin:

- Chronicle remains the raw landing zone and browse surface.
- Chronicle extraction creates durable candidate rows before human review.
- Review creates one durable review item per extraction and preserves explicit human decision fields.
- Promotion receipts record downstream linkage without auto-creating intents, proposals, executions, or canon writes.

## Practical operator note (validated 2026-04-13)

A safe real-data validation slice on the host was:

1. Import one discovered local Codex session with `ema ingest import --limit 1 --offset 0`.
2. Run review backfill for that imported Chronicle slice.
3. Inspect the resulting pending queue with `ema review list`.

On the validated host, the running HTTP daemon was older than the branch and did **not** yet expose `POST /api/review/backfill`, so the slice was executed by importing `services/dist/core/review/service.js` directly under **Node 22**. That Node version matters because `better-sqlite3` was built against Node 22 on the host.

Example direct invocation:

```bash
~/.nvm/versions/node/v22.22.1/bin/node --input-type=module -e '
import { backfillChronicleReviewQueue, listReviewItems } from "./services/dist/core/review/service.js";
const run = backfillChronicleReviewQueue({ source_kind: "codex", limit: 1, offset: 0, only_missing_reviews: true });
console.log(JSON.stringify({ run, items: listReviewItems({ limit: 10 }) }, null, 2));
'
```

Validated result for that slice: 1 Chronicle session scanned, 1 extracted session, 23 extractions, 23 pending review items.
