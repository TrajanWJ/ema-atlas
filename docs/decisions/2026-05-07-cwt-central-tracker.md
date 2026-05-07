# cwt as EMA's Central Tracker — 2026-05-07

`current-work-tracker-trajan` (cwt; project id
`project:01KR0AAG8D004J8015N9P8A0VY`) is hereby designated **EMA's
central tracker for projects, clients, and work**, and EMA's CLI is
formally split across multiple first commands per a new "multi-first-command"
doctrine.

## Context

Two pressures converged today:

1. **Agency reality.** Trajan operates as an agency. Multiple clients
   are imminent (Proslync is live; more queued). The pre-existing model
   — a `kind="client"` flag on `project` — does not handle "one client →
   many projects" (e.g. Proslync mobile + Proslync web + Proslync
   stripe), per-client handoff bundles, or per-client billing surfaces.
2. **vApp-pace pressure.** Many vApps (atlas-vapp, threads-vapp,
   agent-workspace-vapp, chronicle, duct-tape-onion-harness, cwt) are
   pending. Waiting for EMA-the-system to be complete before any single
   vApp owns its surface area pushes every concrete deliverable behind
   one front. cwt is far enough along that it can ship and start owning
   truth today — including a real first-class `client` record and a
   real `project` record family — without waiting for the daemon's full
   `lane`/`queue`/etc. writer landing.

The earlier framing of cwt as a "pending-EMA stand-in that retires via
`promote-all` once contracts ship" (per cwt blueprints 01 and 03) is
inconsistent with both pressures.

## Decision

### 1. cwt is the writer-of-truth for project, client, and work record families.

cwt owns:

- `client` (first-class; new record family; one client → many projects
  via `project.client_id`)
- `project` (elevated to a tracked record; gains `client_id`, `kind`,
  `client_label`, `client_color`, `status`, `archived_at`)
- `campaign`, `mission`, `lane`, `queue`, `problem`, `solution`,
  `vcalendar`, `checkup`, `handoff`, `execution`, `dependency`,
  `responsibility`

EMA daemon (this build) owns:

- `org`, `space`, agent identity, daemon-process, shell-state
- the daemon transport itself

The boundary, in one line: **cwt owns project-and-below; EMA owns
org-and-above and the daemon transport.**

### 2. Promotion semantics: mirror, not retire.

When `@ema/contracts` ships project + client extensions, cwt does not
retire. Instead:

- cwt's local SQLite store remains the warm read projection.
- Every cwt write fans out: local projection first, daemon event log
  second.
- Reads stay local even when the daemon is offline.
- The local store goes from "source of truth" to "writer-mirroring
  projection" — *not* from "source of truth" to "draft scratch."

The verb formerly named `cwt promote-all` is renamed
`cwt mirror-into-daemon`. It runs once to import existing local-only
records into the daemon event log, after which records carry both a
local id and a daemon sequence number.

### 3. Multi-first-command CLI doctrine.

EMA's CLI is deliberately split across multiple top-level binaries on
`PATH`, each with a focused surface:

```
~/.local/bin/
├── ema      EMA daemon + agent orchestration verbs
└── cwt      current-work-tracker — projects, clients, work
            (more per-vApp first commands as they earn it)
```

Reasoning: an LLM agent can hold the full `--help` and verb grammar of
a small focused CLI in context; a monolithic CLI cannot fit that way
without truncation. Splitting first commands per vApp is more
LLM-friendly.

Rules:

1. One vApp → at most one first command. Adding a new first command
   requires a justifying blueprint section.
2. No first command absorbs another. `ema` does not own `cwt client
   list`. `cwt` does not own `ema agent orient`. They cooperate via
   shared contracts.
3. Identical envelope conventions: every first command supports
   `--json`, `--project <id|name|cwd>`, `--space <id|name>`, and emits
   the `workspace_scope` envelope from
   [docs/architecture/19-project-scoped-agent-workspaces.md](../architecture/19-project-scoped-agent-workspaces.md).
4. Conflict-free verbs across commands. `cwt next` and `ema next` may
   coexist with different defaults; verb *meaning* collisions are not
   allowed.

### 4. Cross-binary integration is at the contracts layer.

`ema` reads project/client metadata from cwt's local SQLite store today,
and from the daemon's projection once cwt becomes a daemon-mirroring
writer. New project- or client-related record families do not get added
to EMA core — they go on cwt.

## Consequences

- Records that EMA's daemon does not yet model (`client`, `project.client_id`,
  `project.kind`, `project.client_label`, `project.client_color`) are
  cwt-owned and `EMA-pending`. A `problem` record is opened on first
  daemon promote, per cwt blueprint 03's divergence rule.
- The cwt active build at `Active builds/current-work-tracker-trajan/`
  is real (Phase 1+ in flight per cwt blueprint 08; Phase 8 first-class
  `client` delta queued).
- The Desktop AGENTS.md and CLAUDE.md ship updated CLI doctrine and
  point at cwt for project/client lookups.
- `Projects/EMA/atlas/clients/` is added as a stub plane that points at
  cwt as the writer-of-truth.
- This decision **does not** change the `Organization → Space → Project`
  topology. Topology stays canonical (per
  [docs/plans/RUNTIME-RECOVERY-HANDOFF.md](../plans/RUNTIME-RECOVERY-HANDOFF.md)).
  cwt's `client` record sits inside a space alongside projects; it does
  not introduce a new topology level.
- This decision **does not** add a separate Personal-vs-Client *space*.
  Both clients and personal projects live under `Personal Workspace`
  (the same `space:01J00000000000000000000013`) and are partitioned by
  the cwt-side `client_id`, `kind`, and `project.client_id` fields.

## References

- cwt project: `Projects/current-work-tracker-trajan/project.md`
- Role flip + multi-first-command doctrine:
  `Projects/current-work-tracker-trajan/blueprint/09-ema-central-tracker-promotion.md`
- Recovery + scaffold plan (incl. Phase 8 first-class `client` delta):
  `Projects/current-work-tracker-trajan/blueprint/08-recovery-and-scaffold-plan.md`
- Original "clients are projects" decision (now amended):
  `Projects/current-work-tracker-trajan/blueprint/06-clients-and-personal-projects.md`
- Workspace scope envelope contract:
  `docs/architecture/19-project-scoped-agent-workspaces.md`

## Status

Decided 2026-05-07. Active. Effective immediately for any new EMA-side
work that needs project or client metadata.
