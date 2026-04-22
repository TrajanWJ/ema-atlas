# Milestone — prep stage substantially complete

**Date:** 2026-04-22
**Wave:** end of wave 9 (in flight)

> The prep stage was: **stage everything required to start the EMA
> v0.0.3 build on Gleam/BEAM.** That stage is now substantially
> complete. The atlas presents the system; the research backs the
> language choice; the build-step starters scaffold the supervision
> tree; the decision matrices put the unresolved questions in front
> of the user for resolution.

## What landed in this prep cycle

### Decision pressure surfaced

5 of 10 open questions have decision matrix drafts ready for the user:

- ✅ **Q1** — agents as first-class members
- ✅ **Q2** — collab state location
- ✅ **Q3** — Project ↔ Space cardinality
- 🟡 **Q4** — Personal AI execution locus *(in flight)*
- ✅ **Q5** — driver contract surface
- ⏳ **Q6** — Discord direction *(matrix not yet drafted)*
- ⏳ **Q7** — surface stack *(partly answered by atlas Next.js choice)*
- ⏳ **Q8** — sync model *(matrix not yet drafted; option survey ready)*
- 🟡 **Q9** — replication boundary *(in flight; will land at "deferred")*
- ⏳ **Q10** — perm map *(matrix not yet drafted)*

All 5 drafted matrices follow `content/decision-matrix-template.md` —
options named, criteria scored, bets/costs, reversibility plan,
provenance. **Decision sections stay blank for the user to fill.**

### Build-step starters

All 6 v0.0.3 build steps documented under `research/build-steps/`:

1. ✅ control-plane-skeleton
2. ✅ identity-registry-skeleton
3. ✅ driver-registry-skeleton
4. ✅ sessions-and-babysitter
5. ✅ collab-substrate-skeleton (against Q2 deferred)
6. ✅ surfaces-skeleton

Each carries its own type sketches, supervision tree fragment,
acceptance criteria, gleam_qcheck property tests, and explicit
"what gets stubbed and why" section listing Q-dependencies.

Aggregated into [`SHIP_CHECKLIST.md`](SHIP_CHECKLIST.md) — mechanical
gates the v0.0.3 build can be measured against.

### Gleam project scaffold

[`research/scaffold/`](research/scaffold/) — 14 files including
`gleam.toml`, `manifest.toml`, top-level `src/ema.gleam` composing the
7-subtree supervision graph in boot order, 7 supervisor modules,
4 actor stubs (event_log, identity/registry, drivers/registry,
simulated_tui), gleam_qcheck test scaffold. Reference shape only —
copy into a real `gleam new ema` project to start coding.

### Research corpus

- [`research/GLEAM_BEAM_FIT.md`](research/GLEAM_BEAM_FIT.md) — 4413
  words, language + ecosystem capability survey.
- [`research/COLLAB_PLANE_OPTIONS.md`](research/COLLAB_PLANE_OPTIONS.md)
  — 3401 words, CRDT/OT/hybrid options for Q2/Q8.
- [`research/parts/<slug>.md`](research/parts/) × 8 — per-part Gleam
  type/actor/supervisor mappings.

### Doctrine extracted (10 nodes)

Principles (not code) carried forward from:
- codebase-execudeck, codebase-superman, codebase-t3code-fork
- codebase-frontend-layer, codebase-mission-control-claude,
  codebase-place-org-openclaw
- codebase-place-org, codebase-place-companion
- lineage-original-elixir-ema, lineage-openclaw-agent-workspaces

Each doctrine extract is replicable in EMA's Gleam daemon, framed
runtime-agnostic.

### Atlas surface

The presentation layer expressing all of the above is now real:

- 30+ Next.js routes (atlas, parts, briefs, slides, canvas, futures-board,
  decisions, questions, timeline, research, vapps, docs, desktop, graph,
  demo, artifacts, showroom, program, /api/graph, plus 15+ surface-preview
  routes the user added)
- 8 part briefs (~1000w each)
- 6 deeper vApp briefs (1500-2500w each); 2 more in flight
- 24 Mermaid diagrams + SVG renders
- Build-time auto-linking for glossary terms and Q-references
- Vercel deploy scaffolding (vercel.ts + atlas-ci.yml + howto/deploy-atlas.md)

### Process scaffolding

- 11 howto playbooks (add-a-branch, add-a-driver, add-a-vapp,
  add-an-edge-topic, add-an-atlas-route, add-a-deliverable,
  resolve-an-open-question, promote-vault-term, run-a-swarm-wave,
  load-context-for-a-task, extract-doctrine-from-a-legacy-branch,
  refresh-snapshot-docs, gleam-fit-review)
- 8 utility scripts (probe, check-graph, manifest, graph-json, index,
  regen-all, build-pdfs, build-mermaid-svg)
- Snapshot docs (PROJECT_STATUS, NEXT, MAP, DELIVERABLES_INDEX,
  AGENT_QUICKREF, SHIP_CHECKLIST, content/decisions/PRIORITY)
- Style guide (STYLE_GUIDE.md) for voice consistency
- Contributors guide (CONTRIBUTORS.md) for onboarding

## What's still gating the v0.0.3 build start

The user has to:

1. **Pick a winner from each of the 5 drafted matrices** (Q1, Q2, Q3,
   Q4, Q5). Use [`howto/resolve-an-open-question.md`](howto/resolve-an-open-question.md).
2. **Decide if Q6, Q8, Q10 need matrices before v0.0.3 ships** or
   can be deferred. (Q9 is already designed to land at "deferred";
   the matrix is in flight.)
3. **Approve the Gleam scaffold shape** in `research/scaffold/` — say
   yes/no on the supervisor names, the boot order, the version pins.

Once those happen, build-step 01 (control-plane-skeleton) can start
landing real code in `TrajanWJ/ema`.

## What this milestone is NOT

- Not the v0.0.3 ship. v0.0.3 lands when [`SHIP_CHECKLIST.md`](SHIP_CHECKLIST.md)
  is fully checked.
- Not a recommendation for which option to pick on each question. The
  decision matrices stay blank in the Decision section.
- Not the end of the prep stage. Q9 matrix and the remaining 2 deeper
  vApp briefs (hq-deep, virtual-desktop-deep) are still in flight.

## What to do with this milestone doc

- If you're TrajanWJ: open the 5 drafted matrices, pick a winner per
  matrix, mark Q1/Q2/Q3/Q4/Q5 as `resolved YYYY-MM-DD →` in
  `OPEN_QUESTIONS.md`.
- If you're a fresh agent joining: this is your "what's been done"
  brief. Read `PROJECT_STATUS.md` for "what's shippable today" and
  `NEXT.md` for "what to do next."
- This file gets archived to `research/build-steps/MILESTONE-prep-substantially-complete-2026-04-22.md`
  on the day v0.0.3 ships.

## Cross-references

- [`PROJECT_STATUS.md`](PROJECT_STATUS.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`SHIP_CHECKLIST.md`](SHIP_CHECKLIST.md)
- [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md)
- [`content/decisions/PRIORITY.md`](content/decisions/PRIORITY.md)
- [`EMA_V0_0_3_PREP.md`](EMA_V0_0_3_PREP.md)
