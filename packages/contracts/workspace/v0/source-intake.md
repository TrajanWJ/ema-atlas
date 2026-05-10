<!-- wiki-id: ema:workspace-source-intake-contract -->
<!-- see-also: ema:workspace-schema-v0, ema:next-campaign-cross-pollination-source-intake, ema:operating-model, ema:head-orchestrator -->

# Workspace Source Intake Contract v0

Generated: 2026-05-10

This contract makes cross-pollination a durable workspace primitive. Any track
that uses external docs, open-source repos, social/research signals, or internal
donor material must record the source posture before it imports code or changes
EMA/Proslync product objects.

## Required Spine

```text
SourceQuery -> SourceRecord -> DonorArtifact -> PatternExtraction
-> EntityClass/ProductObjectDelta -> QueueItem -> ImplementationArtifact
-> VerificationEvidence -> SourceRegistryUpdate
```

## Record Families

| Family | ID shape | Conflict strategy | Purpose |
|---|---|---|---|
| SourceQuery | `source_query:<ulid>` | append-only | Search intent, operator, query text, and why it matters. |
| SourceRecord | `source:<ulid>` | append-only + supersede | Retrieved source with URL/path, date, type, confidence, and license posture. |
| DonorArtifact | `donor_artifact:<ulid>` | append-only + content hash | Concrete files, APIs, docs, or screenshots extracted from a source. |
| PatternExtraction | `pattern:<ulid>` | CRDT prose | Reusable mechanism separated from donor branding and implementation detail. |
| ProductObjectDelta | `object_delta:<ulid>` | per-target entity policy | Mapping from extracted pattern to EMA entity or Proslync product object. |
| SourceRegistryUpdate | `source_registry_update:<ulid>` | append-only | Proof that the source registry was updated after implementation/queueing. |

## SourceRecord Schema

Required fields:

| Field | Requirement |
|---|---|
| `source_id` | Stable `source:<ulid>`. |
| `query_id` | Parent `source_query:<ulid>`. |
| `title` | Source title as retrieved. |
| `origin` | URL or absolute local path. |
| `retrieved_at` | ISO date/time; at minimum `YYYY-MM-DD`. |
| `retrieved_by` | Actor/tool, for example `actor:codex` via `web.search`. |
| `source_type` | `official_docs`, `primary_repo`, `paper`, `vendor_page`, `journalism`, `social_voice`, `local_memory`, or `internal_artifact`. |
| `license_name` | SPDX or source-provided name; `unknown` only when paired with `license_posture=source-needed`. |
| `license_url` | License page/file when available. |
| `license_posture` | `direct-port-allowed`, `adapt-allowed`, `rewrite-only`, `inspiration-only`, `blocked`, or `source-needed`. |
| `confidence` | `verified`, `source-needed`, `inspiration-only`, `synthetic`, or `stale`. |
| `pattern_summary` | Mechanism worth reusing, not broad praise. |
| `target_route` | `build-now`, `queue`, `block`, `reject`, or `park`. |
| `target_objects` | EMA entity families and/or Proslync product objects affected. |
| `queue_refs` | EMA lane/queue IDs created or updated. |
| `verification_refs` | Commands, screenshots, artifacts, or source cards proving adoption. |

## License Posture Rules

- `direct-port-allowed`: permissive or project-compatible license confirmed;
  code may be copied only with provenance and review.
- `adapt-allowed`: license compatible but local topology differs; code may be
  reshaped with explicit provenance.
- `rewrite-only`: use the idea, not the code. Required for topology, auth,
  identity, capability, recovery, and distributed write logic unless explicitly
  cleared.
- `inspiration-only`: no implementation import; source may shape questions,
  product language, or QA heuristics.
- `blocked`: do not import or derive implementation from this source.
- `source-needed`: no implementation import until license and source authority
  are verified.

GPL, AGPL, unclear-license, and source-needed donors are blocked for code import
by default. They may inform a clean-room rewrite only when the SourceRecord says
`rewrite-only` or `inspiration-only` and records the reason.

## Minimum Track Gate

Before a track edits code, it must either:

1. Update the query log, source inventory, and pattern-routing table for any
   external/internal donor source it used; or
2. State `internal-only: true` in its handoff/report and explain why no source
   record was required.

Track outputs must link SourceRecords to queue items and verification evidence,
so the cockpit can answer: "what source justified this implementation slice?"
