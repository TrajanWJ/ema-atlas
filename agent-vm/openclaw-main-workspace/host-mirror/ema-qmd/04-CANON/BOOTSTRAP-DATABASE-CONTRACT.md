---
id: CANON-BOOTSTRAP-DATABASE-CONTRACT
type: bootstrap-contract
layer: canon
title: "EMA v1.1 Bootstrap Database Contract"
status: active
created: 2026-04-13
updated: 2026-04-13
tags: [bootstrap, database, daemon, backend, planning, convergence]
---

# EMA v1.1 Bootstrap Database Contract

## Statement

This folder is the **primary bootstrap database/corpus** for the EMA v1.1 buildout pass.

If the daemon, backend, or a coding agent needs to reconstruct "what is going on, what is decided, what is planned, what is blocked, and how the parts fit together," this folder should be the **first dataset ingested** before scanning broader archives, imports, or stale repo history.

## What this folder is

- A convergence database for v1.1 architecture, sequencing, reconciliation, and recovery.
- The packaged context that ties together canon, current plans, decisions, gaps, runtime notes, and handoffs.
- An ingest-first operator corpus for daemon/bootstrap recovery and future backend knowledge indexing.

## What this folder is not

- Not a replacement for active code truth in `~/Projects/ema`.
- Not a replacement for runtime operational truth in `~/.local/share/ema/ema.db`.
- Not a reason to flatten canon, planning, runtime, and gaps into one fake unified truth page.
- Not an archival dump to ingest blindly without trust boundaries.

## Bootstrap ingest order

1. Read `README.md` and `bootstrap-database.json`.
2. Read `04-CANON/*` to establish trust hierarchy and semantic boundaries.
3. Read the meta-bootstrap decision in `10-DECISIONS/2026-04-13-META-BOOTSTRAP-T3CODE-AS-EMA-BACKBONE.md`.
4. Read the active plan set in `01-PLANS/*`, especially the meta-bootstrap pointer, Sub-project A spec draft, execution roadmap, daemon extraction notes, and frontend plan.
5. Read `11-GAPS/*`, `12-RUNTIME/*`, and `13-CLI-GUI-PARITY/*` to understand current contradictions and missing pieces.
6. Read `09-HANDOFFS/*` for resumable operator/agent context.
7. Read `08-IMPORTS/*` only after the primary bootstrap graph is established.

## Extraction targets

The daemon/backend should be able to derive at least these object families from this folder:

- decision
- plan
- gap
- runtime-reality note
- workstream
- handoff packet
- implementation note
- import/reference candidate

Each extracted object should preserve:

- source path
- frontmatter id, when present
- layer/type
- date
- direct links to related docs in this folder

## Invariants

- Preserve plane separation. Canon, planning, runtime truth, gap ledgers, and handoffs are related planes, not interchangeable copies.
- Prefer explicit dated docs when multiple files discuss the same topic.
- Link contradictions instead of overwriting them; contradictions are often the point of the folder.
- Preserve provenance back to file paths and dates so future promotion into runtime objects can be audited.

## Writeback rules

When the daemon/backend or an agent writes new context derived from this folder, it should write into the matching plane:

- Architecture/trust/meaning updates -> `04-CANON/` or `10-DECISIONS/`
- Sequencing/execution updates -> `01-PLANS/` or `14-WORKSTREAMS/`
- Reality drift and missing pieces -> `11-GAPS/`, `12-RUNTIME/`, or `13-CLI-GUI-PARITY/`
- Agent resume packets -> `09-HANDOFFS/`
- Borrow/adapt notes -> `08-IMPORTS/`

## Boundary with live EMA runtime

The live EMA runtime still owns operational truth:

- active code and service behavior live in `~/Projects/ema`
- live operational state lives in `~/.local/share/ema/ema.db`

This folder is upstream of that runtime as a bootstrap corpus for the v1.1 convergence pass. It should shape daemon/backend planning and knowledge indexing, but it should not silently override observed host/runtime behavior.
