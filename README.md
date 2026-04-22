# EMA / Hermes Transfer Pack

Cross-machine handoff for the EMA / Hermes / place.org / OpenClaw lineage
rewrite. The repo is structured as a **navigable graph** so a fresh agent can
load only the slice of context its task needs.

## Canonical rule

> **EMA owns truth. Hermes owns execution. Surfaces do not own state.**

## Read in this order

1. [`MACBOOK_AGENT_HANDOFF_MASTER.md`](MACBOOK_AGENT_HANDOFF_MASTER.md) — single-file passover brief
2. [`SYSTEM_GRAPH.md`](SYSTEM_GRAPH.md) — lineage map and concept edges
3. [`AGENT_TRAVERSAL.md`](AGENT_TRAVERSAL.md) — how to load context from the graph efficiently
4. [`AGENT_BOOTSTRAP.md`](AGENT_BOOTSTRAP.md) — fresh-machine setup (Path A: EMA installed; Path B: ecosystem from scratch)
5. [`05-fresh-context-project-app-model.md`](05-fresh-context-project-app-model.md) — newest user PRD framing (project/space/org, named app surfaces)
6. [`GLOSSARY.md`](GLOSSARY.md) — controlled vocabulary
7. [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) — single canonical list of unresolved decisions
8. [`TIMELINE.md`](TIMELINE.md) — chronological lineage skeleton
9. [`CONTRIBUTING_TO_GRAPH.md`](CONTRIBUTING_TO_GRAPH.md) — rules for keeping the graph self-aware as it grows
10. The four-doc handoff series:
   - [`01-best-prompt-and-answer.md`](01-best-prompt-and-answer.md)
   - [`02-project-transfer-brief.md`](02-project-transfer-brief.md)
   - [`03-architectural-evolution-and-major-decisions.md`](03-architectural-evolution-and-major-decisions.md)
   - [`04-agent-orchestration-and-shared-workspace-briefing.md`](04-agent-orchestration-and-shared-workspace-briefing.md)

## Repo layout

```
.                            # main: handoff docs + graph + bootstrap
├─ MACBOOK_AGENT_HANDOFF_MASTER.md
├─ 0[1-5]-*.md               # high-signal handoff docs (numbered reading order)
├─ SYSTEM_GRAPH.md           # rendered lineage graph
├─ AGENT_TRAVERSAL.md        # how to load context from the graph
├─ AGENT_BOOTSTRAP.md        # fresh-machine setup (paths A and B)
├─ GLOSSARY.md               # controlled vocabulary
├─ OPEN_QUESTIONS.md         # canonical list of unresolved decisions
├─ TIMELINE.md               # chronological lineage skeleton
├─ CONTRIBUTING_TO_GRAPH.md  # rules for keeping the graph self-aware
├─ SYSTEM_MANIFEST.json      # machine-readable index (regen via scripts/manifest.sh)
├─ BRANCH_MAP.md             # short branch list
├─ BRANCH_MAP_EXPANDED.md    # long branch list
├─ graph/
│   ├─ SCHEMA.md             # node frontmatter + tag vocabulary
│   ├─ nodes/<branch>.qmd    # one node per branch (frontmatter = edges)
│   └─ edges/<topic>.md      # cross-cutting topic indexes
└─ scripts/
    ├─ probe.sh              # detect Path A vs Path B
    ├─ check-graph.sh        # graph integrity check (warns, never blocks)
    └─ manifest.sh           # regenerate SYSTEM_MANIFEST.json
```

The codebase, lineage, docs, and recovery snapshots live on **other branches**
of this same repo (see `SYSTEM_GRAPH.md` and `BRANCH_MAP_EXPANDED.md`).
You should rarely need to check them out — load only the artifacts each
node's `key_artifacts:` frontmatter points at, via `git show origin/<branch>:<path>`.

## On a fresh machine

```bash
git clone https://github.com/TrajanWJ/ema-transfer-pack-20260422-060938.git
cd ema-transfer-pack-20260422-060938
git fetch --all
./scripts/probe.sh           # tells you which bootstrap path you're on
```

Then follow [`AGENT_BOOTSTRAP.md`](AGENT_BOOTSTRAP.md).

## Notes on the pack

- Public + intentionally over-included. Pruning happens later, not now.
- Some branches mirror sanitized snapshots of private repos (place.org,
  place-companion); republished intentionally for this transfer window.
- The transfer pack is **not** the canonical EMA repo. The canonical repo is
  `TrajanWJ/ema`; the snapshot under `codebase-ema` is a read-only mirror.
