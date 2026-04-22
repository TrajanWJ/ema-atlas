# Changelog

Tracks how this repo's self-awareness and atlas have evolved. Newest first.
Each entry names the commit purpose, not the file diff — for diffs see `git log`.

> The repo was originally `TrajanWJ/ema-transfer-pack-20260422-060938` and
> was renamed to `TrajanWJ/ema-atlas` on 2026-04-22 once the atlas Next.js
> app became the center of gravity. The old URL still redirects.

## 2026-04-22 — wave 2: atlas deliverables + EMA v0.0.3 prep

- 6 background subagents dispatched in parallel:
  - 4 part briefs (`content/briefs/<slug>.md`) for authority, harness, workspace, coordination
  - 4 part briefs for semantic-layer, shells, identity, mesh
  - 24 Mermaid diagrams (8 parts × {now, three-futures, decisions}) under `content/diagrams/`
  - `EMA_V0_0_3_PREP.md` — preparation spec for the Gleam/BEAM rewrite
  - `app/questions/`, `app/timeline/`, `lib/markdown.ts`
  - `app/futures-board/`, `app/decisions/`, `components/futures-grid.tsx`, `components/decision-card.tsx`

## 2026-04-22 — pass 13/14: doctrine extracts + vault terms + FAQ

- `FAQ.md`: anticipated questions a fresh agent will ask in their first hour.
- 3 nodes get "Doctrine extracted" sections (`codebase-execudeck`,
  `codebase-superman`, `codebase-t3code-fork`) — principles, not code,
  with file:line citations from each branch.
- `GLOSSARY.md`: 15 candidate terms mined from `docs-host-obsidian-vault`
  (Space taxonomy, Ghost Space, Brain Dump, Auto-Resolve Gate, Handoff
  Envelope, Background Results Contract, Bridge Server, Cognitive Cockpit,
  Intelligence Layer, Vault Cognitive Layer, Superman Semantic Layer,
  Honcho, Scope Advisor, MCP Gateway, Distributed AI Delegation). Marked
  "candidate" pending promotion via the open-question workflow.
- Repo renamed to `ema-atlas` via `gh repo rename`.

## 2026-04-22 — passes 8/10/11/12: machine-readable graph + atlas bridge

- `graph.json` (60+KB): full machine-readable graph with nodes, triples,
  topics, open-questions, glossary. `scripts/graph-json.sh` regenerator.
- `AGENT_QUICKREF.md`: single-page everything (rule, 4 lineages, 3 state
  planes, 10 questions, 11 topics, named app surfaces, 3 mistakes to
  avoid, regen commands).
- `ATLAS_NOTES.md`: bridge doc — how the Next.js app should consume the
  graph (data sources, render rules, build pipeline).
- `LIB_DATA_CONTRACT.md`: TypeScript-shaped contract for `graph.json` and
  the manifest, controlled vocabularies, validation snippet.
- `<!-- xref-footer -->` block appended to every handoff doc (01-04 and
  MACBOOK_AGENT_HANDOFF_MASTER) with cross-links to README, SYSTEM_GRAPH,
  INDEX, AGENT_TRAVERSAL, AGENT_BOOTSTRAP, GLOSSARY, OPEN_QUESTIONS, and
  every topic edge.

## 2026-04-22 — passes 4/5/6/7: enrich all priority-4/5 nodes + howto + INDEX

- 21 priority-4/5 nodes enriched with backfilled `key_artifacts:` and
  Stack/Why/How sections grounded in actual branch contents (a separate
  subagent surveyed all 21 branches first).
- `howto/` playbooks: add-a-branch, add-a-driver, add-a-vapp,
  add-an-edge-topic, resolve-an-open-question, load-context-for-a-task,
  extract-doctrine-from-a-legacy-branch.
- `INDEX.md`: one-page lookup of every term, node, doc, edge topic,
  glossary entry, open question, howto, and script. `scripts/index.sh`
  regenerator.

## 2026-04-22 — pass 3: priority-3 node enrichments + TIMELINE + CONTRIBUTING

- 8 priority-3 nodes enriched with full Why/Stack/Connect/How sections.
- `TIMELINE.md`: chronological lineage skeleton with confirmed dates from
  vault notes (2026-03-17 OpenClaw gateway fix, 2026-03-20 place.org build
  session, 2026-04-03 EMA-OpenClaw integration spec, 2026-04-13 daemon
  extraction notes, 2026-04-20 Hermes-EMA context integration, 2026-04-22
  audit + transfer pack creation).
- `CONTRIBUTING_TO_GRAPH.md`: invariants and workflows (add/reclassify/
  delete a branch, add a topic, resolve a question).

## 2026-04-22 — pass 2: high-priority node bodies + GLOSSARY + OPEN_QUESTIONS + manifest

- 7 priority-1/2 nodes enriched (`main`, `lineage-index`,
  `design-review-fresh-context`, `codebase-ema`,
  `lineage-original-elixir-ema`, `codebase-claudeforge`,
  `docs-ema-next-steps`).
- `GLOSSARY.md`: 33 controlled terms (EMA, Hermes, Surface, Workspace,
  Driver vs Provider vs Harness, Org/Project/Space/Member, Personal AI,
  vApp, Launchpad, HQ, Virtual Desktop, Threads, Blueprint, OpenClaw,
  ClaudeForge, place.org, Mesh-P2P, Doctrine, ...).
- `OPEN_QUESTIONS.md`: 10 canonical questions with status, blast radius,
  surfaces, and operating rule.
- `SYSTEM_MANIFEST.json` + `scripts/manifest.sh`: machine-readable index.

## 2026-04-22 — pass 1: graph + bootstrap + per-branch pointers

- `graph/SCHEMA.md`: node frontmatter + controlled tag vocabulary.
- `graph/nodes/<branch>.qmd` × 36: one node per branch with reciprocal
  edges, key_artifacts, load_priority.
- `graph/edges/<topic>.md` × 11: cross-cutting topic indexes (authority,
  execution, surfaces, workspace, collab, identity, orchestration,
  memory, transport, ux-metaphor, recovery).
- `SYSTEM_GRAPH.md`: rendered overview.
- `AGENT_TRAVERSAL.md`: how to load context efficiently from the graph.
- `AGENT_BOOTSTRAP.md`: fresh-machine setup — Path A (EMA installed),
  Path B (provision the ecosystem from scratch).
- `scripts/probe.sh`: detect which bootstrap path the machine is on.
- `scripts/check-graph.sh`: graph integrity check (warns, never blocks).
- All 35 non-main branches annotated with a `<!-- graph-pointer -->`
  README block linking back to `main`.

## 2026-04-22 — bootstrap: original transfer pack snapshot

- 5 high-signal handoff docs (`01-best-prompt-and-answer.md`,
  `02-project-transfer-brief.md`,
  `03-architectural-evolution-and-major-decisions.md`,
  `04-agent-orchestration-and-shared-workspace-briefing.md`,
  `MACBOOK_AGENT_HANDOFF_MASTER.md`).
- `05-fresh-context-project-app-model.md`: newest user-direct PRD framing.
- `BRANCH_MAP.md` + `BRANCH_MAP_EXPANDED.md`.
- 36 branches across codebases, lineages, docs, recovery, history.

---

## Update protocol

When you ship a meaningful change to the pack/atlas, prepend an entry here
with the date, the wave/pass label, and a brief bulleted summary of *what
self-awareness or surface area this added*. Don't list file diffs — those
live in `git log`. The point of this file is to read **why** the repo got
richer, not what bytes moved.
