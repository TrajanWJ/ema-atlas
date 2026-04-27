# Workspace Inventory

Captured on `2026-04-24`.

This is the first-pass inventory of the EMA-related folders currently visible on
this machine.

## Main EMA clusters found

### `/Users/tawj/Desktop/ema 0.0.3`

Role:
- local EMA research pack
- synthesis docs
- donor-analysis workspace
- contains the live local `ema-atlas` repo

Notes:
- not itself a git repo
- contains many high-value synthesis docs:
  - `ema-003-lineage-architecture-synthesis.md`
  - `ema-003-gleam-beam-bounded-contexts.md`
  - `ema-003-shared-agent-swarm-workspace.md`
  - `ema-003-implementation-slices.md`
- contains `ema-atlas/`
- contains `transfer-pack/`
- contains a symlink-like alias `ema-transfer-pack-20260422-060938 -> ema-atlas`

Approx size:
- `1.0G`

### `/Users/tawj/Desktop/ema 0.0.3/ema-atlas`

Role:
- real git repo
- atlas site
- lineage archive
- graph/deliverables hub
- major doctrinal source

Git:
- repo: yes
- branch: `main`
- remote: `https://github.com/TrajanWJ/ema-atlas.git`

Notes:
- currently the strongest external EMA doctrine + presentation source
- contains Next.js app, graph docs, branch maps, architecture docs, open
  questions, and swarm content

Approx size:
- `860M`

### `/Users/tawj/Desktop/Kor - Autharis/ema 3.0.-1`

Role:
- active EMA 0.0.5 planning workspace
- local prep docs only

Git:
- repo: no

Notes:
- current central local planning files include:
  - `EMA-0.0.5-PASSOVER-AND-PREP.md`
  - `EMA_CORPUS_NAVIGATION.md`
  - `lane3-domain-model-and-system-design.md`

Approx size:
- `100K`

### `/Users/tawj/Desktop/Kor - Autharis/autharis`

Role:
- separate product repo
- donor workspace for swarm operations, lane discipline, shell concepts, and
  shared workspace rigor

Git:
- repo: yes
- branch: `main`
- remote: none configured locally

Notes:
- heavily dirty working tree
- should not be mistaken for EMA proper
- high-value donor area:
  - `_shared/lanes.md`
  - `_shared/dispatch/`
  - `_shared/handoffs/`

Approx size:
- `729M`

### `/Users/tawj/Desktop/Kor - Autharis`

Role:
- non-EMA monorepo root around Autharis ecosystem
- contains the current 0.0.5 planning folder

Git:
- repo: no

Notes:
- this is part of the muddle because EMA planning currently lives inside an
  unrelated root

Approx size:
- `979M`

### `/Users/tawj/Desktop/code/ema`

Role:
- stub / placeholder only

Git:
- repo: no

Notes:
- essentially empty except `meta support/`
- not a meaningful current EMA source of truth

Approx size:
- `0B`

## Hidden tool/project state also present

These are not source-of-truth product folders, but they do matter:

- `/Users/tawj/.claude/projects/-Users-tawj-Desktop-ema-0-0-3`
- `/Users/tawj/.claude/projects/-Users-tawj-Desktop-Kor---Autharis`
- `/Users/tawj/.claude/projects/-Users-tawj-Desktop-Kor---Autharis-ema-3-0--1`

These should be treated as tool memory, not product architecture.

## Core diagnosis

The current muddle is not just duplicate folders. It is duplicate roles:

- one folder is a repo plus archive plus site
- one folder is a research pack around that repo
- one folder is a future-planning workspace inside another product root
- one folder is a donor repo with valuable methods but different product goals
- one folder is an empty stub with the "right" name

The fix is not "pick one folder name and dump everything into it."

The fix is to separate:

- active EMA codebase
- doctrine and design docs
- donor material
- archive snapshots
- machine-only tool state

Inside `EMA-CENTRAL-EVERYTHING`, that now maps most directly to:

- `runtime/`
- `doctrine/`
- `donors/`
- `sources/snapshots/` and `archive/`
- hidden tool folders preserved inside imported snapshots

## 0.0.5 folder audit note

Updated on `2026-04-24` during Codebase Architecture Slice A.

Live lane/status truth now lives at:

- `runtime/EMA-0.0.5--4-24/docs/orchestration/STATUS.md`

The active runtime source remains:

- `runtime/EMA-0.0.5--4-24/`

The active doctrine source remains:

- `doctrine/`

One safe audit move landed:

- `runtime/EMA-0.0.5--4-24/docs/architecture/13-peer-computer-access.md`
  moved to
  `runtime/EMA-0.0.5--4-24/docs/operations/peer-computer-access.md`
  because it is trusted-dev/operator guidance, not an architecture invariant.

The per-file folder-audit table and escalated lane candidates live at:

- `runtime/EMA-0.0.5--4-24/docs/architecture/FOLDER-AUDIT-2026-04-24.md`

This inventory is intentionally a workspace-level classification, not a
complete manifest of every generated file under the runtime. Build output,
dependency folders, local pid/log files, and packaged update archives are
tracked by `.gitignore` or local tooling rather than by this inventory.
