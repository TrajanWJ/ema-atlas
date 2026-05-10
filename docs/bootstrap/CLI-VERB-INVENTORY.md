# CLI Verb Inventory - Pipeline Floor Pre-Sprint

Date: 2026-05-10
Repo: `/Users/trajanm4air/Desktop/Active builds/EMA-0.0.6`
Branch observed: `bootstrap/m2-m3-shell-port`

This is the read-only inventory requested after the bootstrap orchestrator halted.
It answers one question: which EMA CLI verbs and daemon event families already
exist, and what must Sprint 2 add before the orchestrator can file its own work.

## Executive Summary

- The pipeline floor is absent as a CLI surface: there is no top-level `ema intent`,
  `ema proposal`, or `ema canon` command.
- The pipeline floor is also absent as persisted current data: the canonical DB has
  zero `intent.*`, zero `proposal.*`, and zero `canon.*` rows.
- `ema intention` is not the missing canonical intent system. It is a harvested
  session-intention review/backfeed tool, mostly file-backed, with optional queue
  backfeed.
- Proposal vocabulary exists in contracts/daemon catalog, but there is no general
  proposal lifecycle CLI. The only found proposal write path is blueprint section
  promotion to `proposal.drafted`, not `proposal.created/approved/rejected`.
- There is no `canon` event family in the current catalog and no canon node CLI.
- Coordination writers are real and daemon-backed for org, space, project, lane,
  queue, campaign, mission, handoff, problem/solution, checkup, vcalendar, swarm,
  and agent reports.
- `actor.created` events exist, but there is no `ema actor register/list/show` CLI.
- `execution` is queryable and harness dispatch writes `dispatch.*`,
  `execution.*`, and `tool.*`, but executions are not proposal-linked.
- Workspace artifacts are explicitly hybrid local state:
  `hybrid_file_sqlite_index`, not daemon-canonical canon.
- `readiness --json` currently reporting `intent_writer: "node"` should be treated
  as misleading for the canonical pipeline floor; it appears to describe legacy
  `intention`/file-backed behavior, not `intent.created` daemon ownership.
- Codex remains separately blocked by flag drift: current code uses
  `codex exec --ask-for-approval`, but `codex exec --help` does not expose that
  flag on the subcommand.
- Sprint 2 should be a pipeline-floor sprint, not Codex/restart survival.

## Top-Level CLI Commands

Inventory source: `apps/cli/src/bin.ts` command dispatch plus `ema help`.

| Command | Current role | Writer class | Notes |
| --- | --- | --- | --- |
| `help` | Help surface | read-only | Static CLI help. |
| `ping` | Daemon ping | read-only | Health check. |
| `status` | Runtime status | read-only | Health/projection read. |
| `events` | Event inspection | read-only | Reads canonical event stream. |
| `org` | Org create | daemon writer | `org.create` emits `org.created`; also creates default space. |
| `space` | Space create | daemon writer | `space.create` emits `space.created`. No broad list/show CLI found. |
| `project` | Project create/registry | mixed | `project.create` is daemon-backed; `project registry show` reads registry/projection. |
| `swarm` | Swarm lifecycle | daemon writer | create/start/pause/stop/report. |
| `vcalendar` | Calendar blocks/phases | daemon writer | block add/move, phase set, tick/read surfaces. |
| `checkup` | Checkup schedule/complete | daemon writer | daemon-backed. |
| `campaign` | Campaign create/archive | daemon writer | daemon-backed. |
| `mission` | Mission lifecycle | daemon writer | create/start/pause/complete. |
| `lane` | Lane lifecycle | daemon writer | open/claim/move/block/release/close; list/show read registry. |
| `queue` | Queue lifecycle | daemon writer | add/ready/block/close; list/show read registry. |
| `handoff` | Handoff lifecycle | daemon writer | request/accept/reject/complete. |
| `problem` | Problem/solution graph | daemon writer | log/solution/link. |
| `blueprint` | Blueprint planner | daemon writer | Includes section promotion to proposal draft. |
| `wiki` | Wiki mirror/search | mixed | Not part of pipeline floor. |
| `hermes` | Hermes status surface | read-only/stub | Not live pipeline writer. |
| `harness` | Dispatch harness | mixed | Simulated daemon-backed; Codex adapter currently flag-broken. |
| `peer` | Peer/relay utilities | mixed | Not part of pipeline floor. |
| `agent` | Agent read/report/planner logs | mixed | `report` writes; orient/meta-progress are reads; planner logs are blueprint events. |
| `next` | Project next-action read | read-only | Projection/read surface. |
| `tl`, `/tl` | Timeline/about | read-only | Projection/read surface. |
| `gap` | Gap analysis | read-only | Diagnostic. |
| `doctor` | Runtime/readiness diagnostic | diagnostic | May trigger readiness/capability checks. |
| `desktop` | Desktop integration | mixed | Not part of pipeline floor. |
| `recovery` | Recovery audit | mixed | Not part of pipeline floor. |
| `cwt` | Cockpit alias | mixed | Alias to `cockpit`. |
| `cockpit` | Client/project work registry | mixed | Active registry/projection surface. |
| `intention` | Harvested intention review/backfeed | hybrid/file | Not canonical `intent`. |
| `bootstrap` | Bootstrap diagnostic | diagnostic | Not pipeline writer. |
| `capability` | Capability assert/report | diagnostic with side effects | Codex check can trigger smoke dispatch. |
| `db` | SQLite inspection | read-only | Direct canonical DB reads. |
| `workspace` | Workspace artifact store | hybrid/file | Uses file plus local SQLite index. |
| `execution` | Execution list/show/timeline | read-only | Reads canonical execution events. |
| `dispatch` | Dispatch list | read-only | Reads dispatch projections/events. |
| `proslync` | Proslync bootstrap diagnostic | diagnostic with side effects | Builds readiness, can trigger Codex capability smoke. |
| `readiness` | Readiness diagnostic | diagnostic with side effects | Builds substrate/capability status. |
| `actor` | Missing | absent | `ema actor --help` returns unknown command. |
| `intent` | Missing | absent | `ema intent --help` returns unknown command. |
| `proposal` | Missing | absent | `ema proposal --help` returns unknown command. |
| `canon` | Missing | absent | `ema canon --help` returns unknown command. |

## Canonical Event Families Observed

The current event envelope and DB support a real coordination layer:

| Family | Evidence | Current CLI write surface |
| --- | --- | --- |
| `actor.*` | `actor.created`, `actor.assigned_to_project` in catalog | No top-level actor CLI found. Seed/daemon paths only. |
| `org.*` | `org.created` | `ema org create`. |
| `space.*` | `space.created` | `ema space create`. |
| `project.*` | `project.created`, materialization events | `ema project create`. |
| `lane.*` | opened/claimed/moved/blocked/released/closed | `ema lane ...`. |
| `queue_item.*` | added/ready/blocked/closed | `ema queue ...`. |
| `campaign.*` | create/archive events | `ema campaign ...`. |
| `mission.*` | lifecycle events | `ema mission ...`. |
| `handoff.*` | lifecycle events | `ema handoff ...`. |
| `problem.*`, `solution.*` | problem/solution graph events | `ema problem ...`. |
| `checkup.*` | checkup events | `ema checkup ...`. |
| `vcalendar.*` | block/phase/tick events | `ema vcalendar ...`. |
| `swarm.*` | swarm lifecycle/report events | `ema swarm ...`. |
| `agent.reported` | agent report event | `ema agent report`. |
| `blueprint.*` | planner and promotion events | `ema blueprint ...`, `ema agent log ...`. |
| `dispatch.*` | harness dispatch events | `ema harness dispatch ...`. |
| `execution.*` | execution started/ended/failed events | harness dispatch; execution CLI reads only. |
| `tool.*` | tool invoked/returned/errored events | harness dispatch. |
| `proposal.*` | catalog supports drafted/submitted/accepted/rejected/superseded | Only blueprint promotion to `proposal.drafted` found; no general CLI. |
| `intent.*` | Not found | absent. |
| `canon.*` | Not found | absent. |

## Current DB Counts

Read from `apps/daemon/canonical.db` during this pass:

```text
actor.created|3
org.created|2
space.created|3
project.created|13
lane.opened|68
queue_item.added|111
COUNT(DISTINCT execution_id)|50
total events|652
intent_like|0
proposal_like|0
canon_like|0
blueprint_promote|0
```

The total event count has increased since the orchestrator log because readiness
and capability checks can create failed Codex smoke dispatch/execution events.
That side effect is itself part of the current CLI truth.

## Pipeline Floor Gap Analysis

Required pipeline:

```text
intent -> proposal -> approval -> execution -> canon
```

Current state:

| Pipeline piece | Status | Gap |
| --- | --- | --- |
| Intent | absent | No event family, no daemon writer, no CLI verbs, no projection. |
| Proposal | partial/stale | Catalog has `proposal.drafted/submitted/accepted/rejected/superseded`; no top-level CLI; no approval gate surface. |
| Approval | absent as doctrine language | Catalog says `proposal.accepted`, not `proposal.approved`; no CLI `approve/reject`. |
| Execution | partial | Harness writes execution events, but no required `proposal_id` linkage. |
| Canon | absent | No `canon.*` catalog family, no daemon writer, no CLI verbs, no projection. |

This confirms the bootstrap halt: EMA can coordinate work, but it cannot yet
represent its own pipeline as first-class canonical state.

## Sprint 2 Scope Recommendation

Sprint 2 should be named: **Pipeline Floor**.

Minimum event families:

- `intent.created`
- `intent.updated`
- `proposal.created`
- `proposal.approved`
- `proposal.rejected`
- `execution.linked_to_proposal`
- `canon.written`
- `canon.superseded`

Before implementation, reconcile naming drift:

- Existing catalog uses `proposal.drafted`, `proposal.submitted`,
  `proposal.accepted`, `proposal.rejected`, `proposal.superseded`.
- Pipeline doctrine uses `proposal.created` and `proposal.approved`.
- Recommendation: make the pipeline names canonical in Sprint 2 and either map
  existing blueprint draft events into the new lifecycle explicitly or mark the
  old proposal names as blueprint-local/legacy. Do not silently treat
  `accepted` as `approved` without documenting the translation.

Minimum CLI verb groups:

- `ema intent create|show|list|update`
- `ema proposal create|show|list|approve|reject`
- `ema canon write|show|list|supersede`
- `ema execution link-proposal` or harness/dispatch flags requiring
  `--proposal <id>` for real provider dispatches
- `ema actor register|show|list` if BOOTSTRAP requires a stable orchestrator
  actor not already seeded

Out of scope for Sprint 2:

- Real Codex adapter completion, except for removing the known invalid
  `codex exec --ask-for-approval` assumption when touching capability smoke.
- Restart survival proof.
- Artifact canonicalization beyond enough canon node writes to prove
  `canon.written`.
- Broad cockpit/web/desktop work.

Acceptance gate:

```text
ema intent create --id BOOTSTRAP-INT-001 ...
ema intent show BOOTSTRAP-INT-001 --json
ema proposal create --id BOOTSTRAP-PROP-001 --intent BOOTSTRAP-INT-001 ...
ema proposal approve BOOTSTRAP-PROP-001 --actor HUMAN-001 --rationale "..."
ema canon write --id BOOTSTRAP-CANON-000-pre-pipeline-finding ...
ema canon show BOOTSTRAP-CANON-000-pre-pipeline-finding --json
```

The gate passes only if those writes are daemon-canonical events in
`apps/daemon/canonical.db`, and their projections survive a daemon restart or
at least read back from the same canonical event log.

## Commands Run

```text
node apps/cli/dist/bin.js help
exit 0

node apps/cli/dist/bin.js actor --help
exit 64, unknown command

node apps/cli/dist/bin.js intent --help
exit 64, unknown command

node apps/cli/dist/bin.js proposal --help
exit 64, unknown command

node apps/cli/dist/bin.js canon --help
exit 64, unknown command

node apps/cli/dist/bin.js <top-level-command> --help
exit 0 for known top-level commands inspected in this inventory

sqlite3 apps/daemon/canonical.db "<event count queries>"
exit 0

rg/sed/nl inspections across apps/cli/src, apps/daemon/src, and packages/contracts/events
exit 0
```

## Files Read

- `README.md`
- `AGENTS.md`
- `docs/bootstrap/ORCHESTRATOR-LOG.md`
- `docs/architecture/STACK.md`
- `apps/cli/src/bin.ts`
- `apps/cli/src/commands/*.ts`
- `apps/daemon/src/ema_daemon/event_envelope.gleam`
- `apps/daemon/src/ema_*/**/*.gleam` where referenced by CLI commands
- `packages/contracts/events/catalog.v0.md`
- `packages/contracts/events/proposal.md`

No runtime code was changed by this inventory.
