# Project Status

Snapshot of where the EMA project stands right now. Refreshed each
significant push. Last refresh: **2026-04-22, end of wave 9 (one deep brief still in flight)**.

## One-line state

The **prep stage for EMA v0.0.3** (Gleam/BEAM rewrite) is
**substantially complete** — see [`MILESTONE_PREP_COMPLETE.md`](MILESTONE_PREP_COMPLETE.md).
6 of 10 OPEN_QUESTIONS now have decision matrix drafts ready for the
user (Q1, Q2, Q3, Q4, Q5, Q9). All 6 v0.0.3 build-step starters
documented under `research/build-steps/`. The Gleam project scaffold
sketch is at `research/scaffold/`. The atlas presents all of this
through 30+ Next.js routes.

## Swarm control model

- one active objective
- one main write lane
- current main-lane owner: `Claude deliverables orchestrator`
- Codex posture: support lanes only around the main lane
- support work is limited to alignment, context curation, repo hygiene,
  handoff packaging, and verification
- if a task starts touching the main deliverable substance, it should be
  handed to the main lane instead of expanded in support

## What's shippable today

### Atlas site — `npm run dev` then open localhost:3000

| Route | Status | Renders |
|---|---|---|
| `/` | shipped | hero + featured triptych + featured parts |
| `/parts` | shipped | all 8 EMA parts |
| `/parts/[slug]` | shipped | per-part page with hard questions + visions |
| `/briefs/[slug]` | sketched | will read `content/briefs/<slug>.md` (8 briefs ready) |
| `/slides/[slug]` | sketched | 4-slide template per part |
| `/canvas/[slug]` | sketched | 3-vision thinking board per part |
| `/futures-board` | shipped | 24 futures grouped by stance |
| `/decisions` | shipped | 10 open questions as decision cards |
| `/questions` | shipped | OPEN_QUESTIONS.md rendered |
| `/timeline` | shipped | TIMELINE.md rendered |
| `/research` | shipped | research/ tree listing |
| `/research/[slug]` | shipped | per-research-doc viewer |
| `/vapps` | shipped | 8 named app surfaces |
| `/vapps/[slug]` | shipped | per-vApp brief viewer |
| `/docs` | shipped | 4-tier doc tile grid (~25 docs) |
| `/docs/[slug]` | shipped | per-doc viewer |
| `/desktop` | sketched | place.org-inspired surface (stub) |
| `/graph` | sketched | constellation view (stub) |
| `/artifacts` | sketched | format inventory (stub) |
| `/demo` | sketched | staged narrative — content/demo/narrative.md ready |
| `/showroom` | planned | ATLAS_NOTES mention only |
| `/program` | planned | ATLAS_NOTES mention only |
| `/launchpad` | sketched | newly added by user |

### Lineage archive

- 36 branches, navigable graph (36 nodes × 4 edge kinds = 91 triples,
  11 topic edges)
- 33 canonical glossary terms + 15 vault candidate terms
- 10 open questions + 1 decision matrix template
- 9 howto playbooks
- 5 utility scripts (probe, check-graph, manifest, graph-json, index, regen-all)
- 2 build scripts (build-pdfs, build-mermaid-svg) — stubs, ready when tools installed

### Top-level docs (Tier 1 + Tier 2 reading list)

VISION · MACBOOK_AGENT_HANDOFF_MASTER · AGENT_QUICKREF · FAQ · ROADMAP ·
DESIGN_PRINCIPLES · ARCHITECTURE · EMA_V0_0_3_PREP · GLEAM_NOTES ·
OPEN_QUESTIONS · GLOSSARY · TIMELINE · SECURITY_PRIVACY ·
CONTRIBUTORS · CONTRIBUTING_TO_GRAPH · CHANGELOG · DELIVERABLES_INDEX

### Research (wave 3+)

- `research/GLEAM_BEAM_FIT.md` (4413 words; per-claim citations)
- `research/COLLAB_PLANE_OPTIONS.md` (3401 words; CRDT/OT/hybrid survey for Q2/Q8)
- `research/parts/<slug>.md` × 8 (per-part Gleam type/actor/supervisor mappings)
- `research/build-steps/<n>-*.md` (2 of 4 landed; M subagent in flight)

## What's in flight right now

- **Live wave** — one narrow deliverables lane chosen by Claude
- **Main lane** — `main-deliverables`
- **Main lane owner** — `Claude deliverables orchestrator`
- **Support posture** — Codex support swarm keeps claims, handoffs,
  context, and verification tight without rewriting the main artifact

## Where the project is going next (per ROADMAP.md)

Stage 2 — v0.0.3 preparation. Specifically: minimum answers to
**Q1, Q3, Q5, Q5-sub** before Gleam code starts. Q6 can ship as
read-only; Q9 is deferred.

After v0.0.3 lands: pick ONE vApp to ship first. The candidates
already have briefs in `content/vapps/`.

## What the user owns (don't touch)

- `content/swarm/*` — user's swarm coordination doctrine
- `README.md` — user is iterating on the atlas pivot framing
- `app/launchpad/page.tsx` — user-added route
- Anything matching `content/swarm/*` or having a recent `Note: file was modified`
  reminder in the conversation transcript

## Health checks

```bash
./scripts/regen-all.sh        # all 4 regenerators in order
npx next build                # atlas build (skip on slow disk)
git log --oneline -10         # recent waves
```

## Recent waves

See [`CHANGELOG.md`](CHANGELOG.md). Latest entry summarizes what wave 5
shipped and what's still in flight.

## When this file goes stale

This file is **handcrafted on each push**. If you see counts or status
columns that don't match `INDEX.md` / `graph.json` / actual `app/`
contents, refresh this file.
