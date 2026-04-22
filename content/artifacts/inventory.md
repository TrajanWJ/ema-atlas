# Atlas Deliverables Inventory

A catalog of every format and concrete instance the EMA Atlas exposes,
grouped by media type. Used as the data source for the `/artifacts` route
and as a reference when proposing a new deliverable.

> Counts in this file are real (verified by `ls` and `wc -w` against the
> tree at `ema-transfer-pack-20260422-060938/`). Statuses are honest —
> verified by reading file headers and the canonical
> [`DELIVERABLES_INDEX.md`](../../DELIVERABLES_INDEX.md). When you ship
> a new deliverable, follow [`howto/add-a-deliverable.md`](../../howto/add-a-deliverable.md)
> and update the row here as well.

---

## Briefs (markdown)

Long-form per-part briefs at `content/briefs/<slug>.md`, rendered by
`app/briefs/[slug]/page.tsx`. Pipeline: markdown → `lib/markdown.ts`
loader → page route. Print-friendly variant is the same source feeding
`scripts/build-pdfs.sh`.

| Slug | Title | Status | Words | File path | Route |
|---|---|---|---|---|---|
| authority-control-plane | Authority / Control Plane | shipped | 1366 | `content/briefs/authority-control-plane.md` | `/briefs/authority-control-plane` |
| coordination-environment | Coordination / Agent Environment | shipped | 1360 | `content/briefs/coordination-environment.md` | `/briefs/coordination-environment` |
| harness-execution | Harness / Execution Fabric | shipped | 1330 | `content/briefs/harness-execution.md` | `/briefs/harness-execution` |
| identity-project-space | Identity / Org / Project / Space | shipped | 1064 | `content/briefs/identity-project-space.md` | `/briefs/identity-project-space` |
| mesh-replication | Mesh / Replication / Presence | shipped | 1240 | `content/briefs/mesh-replication.md` | `/briefs/mesh-replication` |
| semantic-layer | Semantic Layer / Knowledge System | shipped | 1113 | `content/briefs/semantic-layer.md` | `/briefs/semantic-layer` |
| shared-workspace | Shared Workspace | shipped | 1255 | `content/briefs/shared-workspace.md` | `/briefs/shared-workspace` |
| shells-surfaces | Shells / Surfaces | shipped | 985 | `content/briefs/shells-surfaces.md` | `/briefs/shells-surfaces` |

8 entries · all shipped · total ~9,713 words.

## Slides

One dynamic Next.js route, `app/slides/[slug]/page.tsx`, that templates
4 slides per part (intro + 3 vision stances). Pipeline: `lib/ema-atlas.ts`
`Part.visions` → in-page React layout → screen-only (no PDF export yet).

| Slug | Status | Template depth | Route |
|---|---|---|---|
| authority-control-plane | sketched | 4 slides (intro + 3 visions) | `/slides/authority-control-plane` |
| coordination-environment | sketched | 4 slides (intro + 3 visions) | `/slides/coordination-environment` |
| harness-execution | sketched | 4 slides (intro + 3 visions) | `/slides/harness-execution` |
| identity-project-space | sketched | 4 slides (intro + 3 visions) | `/slides/identity-project-space` |
| mesh-replication | sketched | 4 slides (intro + 3 visions) | `/slides/mesh-replication` |
| semantic-layer | sketched | 4 slides (intro + 3 visions) | `/slides/semantic-layer` |
| shared-workspace | sketched | 4 slides (intro + 3 visions) | `/slides/shared-workspace` |
| shells-surfaces | sketched | 4 slides (intro + 3 visions) | `/slides/shells-surfaces` |

8 entries · all sketched (template renders, content depth could expand).

## Canvas boards

Dynamic Next.js route `app/canvas/[slug]/page.tsx`. Renders 3 vision
cards on a thread-style layout. Pipeline: `lib/ema-atlas.ts`
`Part.visions` → React layout. Could integrate Mermaid SVG inline once
the SVGs are built.

| Slug | Status | Layout | Route |
|---|---|---|---|
| authority-control-plane | sketched | 3 vision cards, thread style | `/canvas/authority-control-plane` |
| coordination-environment | sketched | 3 vision cards, thread style | `/canvas/coordination-environment` |
| harness-execution | sketched | 3 vision cards, thread style | `/canvas/harness-execution` |
| identity-project-space | sketched | 3 vision cards, thread style | `/canvas/identity-project-space` |
| mesh-replication | sketched | 3 vision cards, thread style | `/canvas/mesh-replication` |
| semantic-layer | sketched | 3 vision cards, thread style | `/canvas/semantic-layer` |
| shared-workspace | sketched | 3 vision cards, thread style | `/canvas/shared-workspace` |
| shells-surfaces | sketched | 3 vision cards, thread style | `/canvas/shells-surfaces` |

8 entries · all sketched.

## Mermaid diagrams

Source `.mmd` files at `content/diagrams/<slug>/<name>.mmd` (3 per part).
Pipeline: `mmdc` (mermaid-cli) → SVG sibling at
`content/diagrams/<slug>/<name>.svg` via `./scripts/build-mermaid-svg.sh`.

| Part | now (mmd / svg) | three-futures (mmd / svg) | decisions (mmd / svg) |
|---|---|---|---|
| authority-control-plane | shipped / rendered | shipped / rendered | shipped / rendered |
| coordination-environment | shipped / rendered | shipped / rendered | shipped / rendered |
| harness-execution | shipped / rendered | shipped / rendered | shipped / rendered |
| identity-project-space | shipped / rendered | shipped / rendered | shipped / rendered |
| mesh-replication | shipped / rendered | shipped / rendered | shipped / rendered |
| semantic-layer | shipped / rendered | shipped / rendered | shipped / rendered |
| shared-workspace | shipped / rendered | shipped / rendered | shipped / rendered |
| shells-surfaces | shipped / rendered | shipped / rendered | shipped / rendered |

24 entries · all `.mmd` written and all `.svg` rendered (24 SVG files
produced 2026-04-22 via `npx mmdc -b transparent`).

## Decision cards

Pulled from `OPEN_QUESTIONS.md` by `lib/decisions.ts`, rendered by
`components/decision-card.tsx` on `/decisions`. Axis labels and
red/amber/green readiness pills are hardcoded in `lib/decisions.ts`
(`AXES` and `READINESS` maps).

| ID | Question | Status | Axis (left ↔ right) | Readiness |
|---|---|---|---|---|
| Q1 | Are agent identities first-class members of Org/Space? | open | agents as guests ↔ agents as full members | red |
| Q2 | Is collaboration state in `event_log` or adjacent? | open | single event log ↔ adjacent collab store | red |
| Q3 | Project ↔ Space cardinality | open | strict scope ↔ fluid scope | red |
| Q4 | Where does the Personal AI execute? | open | user-machine local ↔ remote daemon / per-call placement | amber |
| Q5 | Harness/driver contract surface | open | sync RPC ↔ streaming events | red |
| Q6 | Discord mirror direction | open | read-only mirror ↔ EMA superset / bidirectional | amber |
| Q7 | Surface stack for Launchpad/HQ | open | native-first ↔ web-first | amber |
| Q8 | Sync model for docs/wiki/canvas | open | centralized event log ↔ CRDT (Yjs / Automerge / Elixir) | amber |
| Q9 | Replication boundary | open (deferred) | open ↔ open | green |
| Q10 | How org/space permissions map onto runtime/tool permissions | open | simple inheritance ↔ explicit policy bundles | green |

10 entries · all open · pipeline: `OPEN_QUESTIONS.md` → `loadDecisions()`
in `lib/decisions.ts` → `components/decision-card.tsx` on `/decisions`.

## Futures cards

8 parts × 3 vision stances = 24 cards. Source: `Part.visions` in
`lib/ema-atlas.ts` (each part has visions for the three universal
stances `Operator Cathedral`, `Living Workspace`, `Mesh Commonwealth`).
Rendered by `components/futures-grid.tsx` on `/futures-board`,
groupable by stance.

| Part | Operator Cathedral | Living Workspace | Mesh Commonwealth |
|---|---|---|---|
| authority-control-plane | shipped | shipped | shipped |
| coordination-environment | shipped | shipped | shipped |
| harness-execution | shipped | shipped | shipped |
| identity-project-space | shipped | shipped | shipped |
| mesh-replication | shipped | shipped | shipped |
| semantic-layer | shipped | shipped | shipped |
| shared-workspace | shipped | shipped | shipped |
| shells-surfaces | shipped | shipped | shipped |

24 entries · all shipped on `/futures-board`.

## Research docs

Located under `research/`. Pipeline: markdown → `lib/markdown.ts` →
`/research` and `/research/[slug]` routes (in flight).

| File | Status | Words | Fit topic |
|---|---|---|---|
| `research/GLEAM_BEAM_FIT.md` | shipped | 4413 | Gleam-language and BEAM-ecosystem fit for EMA v0.0.3 |
| `research/COLLAB_PLANE_OPTIONS.md` | shipped | 3401 | Collaboration-plane substrate survey (drives Q2 / Q8) |
| `research/parts/authority-control-plane.md` | shipped | 934 | Per-part Gleam/BEAM mapping — authority |
| `research/parts/coordination-environment.md` | shipped | 863 | Per-part Gleam/BEAM mapping — coordination |
| `research/parts/harness-execution.md` | shipped | 859 | Per-part Gleam/BEAM mapping — harness |
| `research/parts/identity-project-space.md` | shipped | 915 | Per-part Gleam/BEAM mapping — identity |
| `research/parts/mesh-replication.md` | shipped | 941 | Per-part Gleam/BEAM mapping — mesh |
| `research/parts/semantic-layer.md` | shipped | 884 | Per-part Gleam/BEAM mapping — semantic layer |
| `research/parts/shared-workspace.md` | shipped | 787 | Per-part Gleam/BEAM mapping — shared workspace |
| `research/parts/shells-surfaces.md` | shipped | 863 | Per-part Gleam/BEAM mapping — shells/surfaces |
| `research/build-steps/01-control-plane-skeleton.md` | shipped | 1223 | v0.0.3 build step 1 — typed authority spine |
| `research/build-steps/02-identity-registry-skeleton.md` | shipped | 1333 | v0.0.3 build step 2 — identity registry |
| `research/build-steps/03-driver-registry-skeleton.md` | shipped | 1409 | v0.0.3 build step 3 — driver registry |
| `research/build-steps/04-sessions-and-babysitter.md` | shipped | 1535 | v0.0.3 build step 4 — sessions + babysitter |
| `research/raw/` | as-needed | — | scratch space for subagents |

15 documented files (plus `research/raw/` scratch). Total ~20.4k words
of research content.

## vApp briefs

Per-named-app surface briefs at `content/vapps/<slug>.md`. Pipeline:
markdown → `lib/markdown.ts` → `/vapps` and `/vapps/[slug]` routes
(in flight).

| Slug | Status | Words | File path |
|---|---|---|---|
| agent-virtual-environment | shipped | 401 | `content/vapps/agent-virtual-environment.md` |
| blueprint | shipped | 402 | `content/vapps/blueprint.md` |
| chat | shipped | 387 | `content/vapps/chat.md` |
| hq | shipped | 413 | `content/vapps/hq.md` |
| launchpad | shipped | 363 | `content/vapps/launchpad.md` |
| threads-server | shipped | 401 | `content/vapps/threads-server.md` |
| virtual-desktop | shipped | 424 | `content/vapps/virtual-desktop.md` |
| wiki | shipped | 398 | `content/vapps/wiki.md` |

8 entries · all shipped (DELIVERABLES_INDEX.md still lists these as
`planned`; the markdown bodies are landed and read honestly as
shipped briefs, but route wiring is `in flight`).

## Demo narrative

| Slug | Status | Words | File path | Route |
|---|---|---|---|---|
| narrative | shipped (route is stub) | 817 | `content/demo/narrative.md` | `/demo` |

1 entry · markdown is a 7-act scripted walkthrough. The `app/demo/page.tsx`
route is currently a stub that does not yet render the narrative.

## Decision matrix template

| Slug | Status | Words | File path |
|---|---|---|---|
| decision-matrix-template | shipped | 641 | `content/decision-matrix-template.md` |

1 entry · template to be copied to `content/decisions/Q<n>-<slug>.md`
when resolving an `OPEN_QUESTIONS.md` entry. Cross-referenced by
`howto/resolve-an-open-question.md`.

## Build-step starters (v0.0.3)

Per-build-step research/spec docs at `research/build-steps/`. Pipeline:
markdown → `/research/[slug]` route (in flight).

| File | Status | Words |
|---|---|---|
| `research/build-steps/01-control-plane-skeleton.md` | shipped | 1223 |
| `research/build-steps/02-identity-registry-skeleton.md` | shipped | 1333 |
| `research/build-steps/03-driver-registry-skeleton.md` | shipped | 1409 |
| `research/build-steps/04-sessions-and-babysitter.md` | shipped | 1535 |

4 entries · all shipped (wave 5 subagent M output landed).

## Routes inventory

Every route under `app/`, with status and what it renders.

| Route | Renders | Status |
|---|---|---|
| `/` | hero + featured parts + featured triptych (`app/page.tsx`) | shipped |
| `/parts` | all 8 parts list | shipped |
| `/parts/[slug]` | single part with hard questions + visions + deliverable chips | shipped |
| `/briefs/[slug]` | brief markdown render (currently uses Part data, transitioning to `content/briefs/`) | sketched |
| `/slides/[slug]` | 4-slide deck per part | sketched |
| `/canvas/[slug]` | 3-card thinking board per part | sketched |
| `/artifacts` | inventory of deliverable formats (this file is the data source) | sketched |
| `/demo` | staged 7-act narrative walkthrough | planned (markdown shipped, route stub) |
| `/showroom` | gallery wall of deliverables | planned |
| `/program` | cross-part program map | planned |
| `/graph` | constellation view backed by `graph.json` | sketched |
| `/desktop` | place.org-inspired spatial surface | sketched |
| `/docs` | linked local knowledge pack index | sketched |
| `/docs/[slug]` | single root-level markdown doc | sketched |
| `/questions` | `OPEN_QUESTIONS.md` rendered | shipped |
| `/timeline` | `TIMELINE.md` rendered | shipped |
| `/futures-board` | 24-vision grid (groupable by stance) | shipped |
| `/decisions` | decision pressure board (Q1–Q10 cards) | shipped |
| `/research` | research/ tree index | in flight |
| `/research/[slug]` | single research doc | in flight |
| `/vapps` | named app surface list | in flight |
| `/vapps/[slug]` | single vApp brief | in flight |
| `/launchpad` | launchpad surface | sketched |

23 routes total under `app/`.

## Update protocol

When you ship a new deliverable:

1. Follow [`howto/add-a-deliverable.md`](../../howto/add-a-deliverable.md)
   for the canonical recipe (pick part(s), pick format, write artifact in
   the canonical location, wire the route, add a chip, cross-reference
   into the graph, update `CHANGELOG.md`).
2. Update the corresponding row here **and** in
   [`DELIVERABLES_INDEX.md`](../../DELIVERABLES_INDEX.md): flip
   `planned` → `sketched` → `shipped`.
3. If the deliverable introduces a new format, add a row to the
   "Format inventory" table in
   [`howto/add-a-deliverable.md`](../../howto/add-a-deliverable.md)
   first, then add a new section to this file.
4. Counts in this file are real — re-run `wc -w` and `ls | wc -l` before
   editing rather than incrementing by hand.
