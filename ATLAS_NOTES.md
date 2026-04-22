# Atlas Notes

How the lineage graph (this transfer pack's `graph/`, `*.md` docs,
`graph.json`, `SYSTEM_MANIFEST.json`) feeds the **EMA Atlas** Next.js app
that now lives at the repo root (`app/`, `components/`, `lib/`).

This file is the bridge between the archive layer and the presentation
layer. It does not make decisions about how the atlas app is built — those
live in the app's own code. It documents the data contract.

> **Status (2026-04-22):** the atlas app scaffolding is in progress. This
> doc reflects the data shapes that already exist in this repo and are
> safe to consume. New shapes added by the app should be reflected back
> here.

## What the atlas can present

Per `README.md`, the app's intended top-level routes:

| Route | What it shows | Backed by |
|---|---|---|
| `/` | atlas landing page | `AGENT_QUICKREF.md`, `GLOSSARY.md` |
| `/parts` | the EMA system by part | `graph.json#nodes`, filtered by `era` and `status` |
| `/artifacts` | deliverable formats | the handoff docs (`0[1-5]-*.md`, `MACBOOK_AGENT_HANDOFF_MASTER.md`) plus `howto/` |
| `/showroom` | gallery-like deliverables wall | `lib/ema-atlas.ts`, `graph.json`, current local knowledge pack |
| `/program` | cross-part program map | `lib/ema-atlas.ts`, local `ema-003-*.md` program/backlog docs |
| `/demo` | staged narrative walkthrough | current part narratives plus unresolved question pressure |
| `/graph` | constellation view | `graph.json#triples` (force-directed or sankey) |
| `/desktop` | place-inspired spatial surface | `codebase-place-org` and `codebase-place-companion` nodes; UX metaphor edge |
| `/docs` | linked local knowledge pack | the full `*.md` set + `graph/edges/` + `graph/nodes/` |

## Stable data sources

The atlas should read from these files only. Never reach across `git show`
into other branches at runtime — pre-bake whatever you need at build time.

| File | Shape | Stability |
|---|---|---|
| [`graph.json`](graph.json) | `{nodes, triples, topics, open_questions, glossary, counts}` | **stable** schema_version 1; regen via `scripts/graph-json.sh` |
| [`SYSTEM_MANIFEST.json`](SYSTEM_MANIFEST.json) | `{branches, nodes, entry_docs, ...}` | stable schema_version 1; regen via `scripts/manifest.sh` |
| [`graph/nodes/<branch>.qmd`](graph/nodes/) | YAML frontmatter + markdown body | stable schema (see `graph/SCHEMA.md`) |
| [`graph/edges/<topic>.md`](graph/edges/) | markdown with Primary/Secondary/Cross-references/Open sections | stable shape; new topics added per `howto/add-an-edge-topic.md` |
| [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) | `## Q<n> — title` blocks, status/blast/where-it-surfaces fields | stable; new questions appended only |
| [`GLOSSARY.md`](GLOSSARY.md) | markdown table `\| **term** \| def \| source \|` | stable; new terms appended only |
| [`TIMELINE.md`](TIMELINE.md) | era headers + bulleted dated entries | stable shape |
| Handoff docs `01-*` … `05-*` and `MACBOOK_AGENT_HANDOFF_MASTER.md` | long-form markdown | stable |

## Loading pattern (recommended)

In `lib/`, build a single typed atlas dataset at build time:

```ts
// lib/atlas.ts (sketch — adapt to your actual style)
import graph from '../graph.json';
import manifest from '../SYSTEM_MANIFEST.json';

export type AtlasNode = (typeof graph.nodes)[number];
export type AtlasTriple = (typeof graph.triples)[number];
export type AtlasTopic = (typeof graph.topics)[number];
export type AtlasQuestion = (typeof graph.open_questions)[number];
export type AtlasTerm = (typeof graph.glossary)[number];

export const ATLAS = {
  nodes: graph.nodes,
  triples: graph.triples,
  topics: graph.topics,
  questions: graph.open_questions,
  glossary: graph.glossary,
  rule: graph.canonical_rule,
  counts: graph.counts,
  branches: manifest.branches, // branch -> head sha
};
```

Render rules a UI must respect to stay correct:

1. **Don't paraphrase the canonical rule.** Render
   `graph.canonical_rule` verbatim, never reword.
2. **Always render `status` next to a node.** A `canonical` node and an
   `archive` node deserve very different visual weight.
3. **Filter "load_priority" defaults to ≤3** unless the user explicitly
   opens an "include archive" toggle.
4. **Glossary terms in body text should auto-link** to their entry. Build
   a regex from `graph.glossary[*].term` at build time.
5. **Open-question references** (e.g. "Q1") in any rendered prose should
   auto-link to the corresponding entry.

## How the app should NOT diverge from the graph

- **Don't store node descriptions in the app.** Read them from `graph.json`.
  If you want richer copy than what's in the node body, edit
  `graph/nodes/<id>.qmd` and regenerate.
- **Don't invent new statuses or eras.** They come from `graph/SCHEMA.md`.
  If you need a new one, add it to SCHEMA first (see
  `howto/add-a-branch.md` §2 and `howto/add-an-edge-topic.md`).
- **Don't fork the open-question list.** UI may reorder/group, but the
  text and IDs come from `OPEN_QUESTIONS.md`.

## Build pipeline

Add to your build (e.g. `package.json` `prebuild`):

```bash
./scripts/check-graph.sh && \
./scripts/manifest.sh && \
./scripts/graph-json.sh && \
./scripts/index.sh
```

This guarantees the atlas always renders the freshest graph and that the
graph passes its integrity check before deploy. (CI on Vercel: run the
same script chain in the build step; fail the deploy if check-graph emits
warnings, or downgrade to a soft-warn — your call.)

## What the atlas can teach the archive

Going the other way: when the atlas surfaces a question that the archive
hadn't captured (e.g. "the desktop route needs a 'spatial-zone' tag"),
update the archive in the same commit as the app change:

- new tag → `graph/SCHEMA.md` controlled vocabulary
- new connection → relevant `graph/edges/<topic>.md`
- new question → `OPEN_QUESTIONS.md`
- new term → `GLOSSARY.md`

Then regenerate `graph.json` so the atlas picks up its own new context.

## Cross-references

- [`README.md`](README.md) — atlas + archive overview
- [`AGENT_QUICKREF.md`](AGENT_QUICKREF.md) — single-page everything
- [`AGENT_TRAVERSAL.md`](AGENT_TRAVERSAL.md) — context-loading discipline
- [`CONTRIBUTING_TO_GRAPH.md`](CONTRIBUTING_TO_GRAPH.md) — graph invariants
- [`LIB_DATA_CONTRACT.md`](LIB_DATA_CONTRACT.md) — formal schema for `lib/`
