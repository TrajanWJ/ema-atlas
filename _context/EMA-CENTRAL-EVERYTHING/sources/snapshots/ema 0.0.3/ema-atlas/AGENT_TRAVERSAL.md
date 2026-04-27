# Agent Traversal

How to load context from this transfer pack **without** reading every branch.
The repo is structured as a graph (see `graph/SCHEMA.md`); use the graph to
take the shortest path to what your task needs.

---

## Step 0 — orient

Always-loaded set (≤8 files, ≤30k tokens):

- `README.md`
- `MACBOOK_AGENT_HANDOFF_MASTER.md`
- `SYSTEM_GRAPH.md`
- `BRANCH_MAP.md`, `BRANCH_MAP_EXPANDED.md`
- `05-fresh-context-project-app-model.md` (newest user PRD framing)
- `graph/SCHEMA.md`

Everything else is on demand.

---

## Step 1 — pick the topic

Map your task to a topic edge and load only that file:

| If your task is about… | Load this edge file |
|---|---|
| schema, control plane, event log, audit, replay | `graph/edges/authority.md` |
| Hermes, harness drivers, dispatch, runtimes | `graph/edges/execution.md` |
| Discord/web/CLI/native UI, vApps | `graph/edges/surfaces.md` |
| plans/handoffs/notes/exports under workspace/shared | `graph/edges/workspace.md` |
| docs/wiki/canvas/threads, real-time editing, CRDT | `graph/edges/collab.md` |
| org/space/project/membership, personal AI scope | `graph/edges/identity.md` |
| multi-agent coordination, roles, watchdog | `graph/edges/orchestration.md` |
| second-brain, vault, knowledge ingest | `graph/edges/memory.md` |
| P2P, mesh, peer dispatch, placement | `graph/edges/transport.md` |
| Launchpad, HQ, virtual desktop, place metaphor | `graph/edges/ux-metaphor.md` |
| historical fixtures, replay test data | `graph/edges/recovery.md` |

Each edge file lists its **primary** and **secondary** nodes, plus the
specific paths within those branches that matter.

---

## Step 2 — load only the nodes the edge points to

For each node listed:

1. Read `graph/nodes/<branch>.qmd` first (~20 lines, free).
2. If `key_artifacts:` is non-empty, fetch *those paths only* from the branch
   via `git show origin/<branch>:<path>` — do not check out the whole branch.
3. If `load_priority` ≥ 4, you almost never need the body of the branch.

Example — designing the harness driver registry:

```bash
# 1. edge
cat graph/edges/execution.md

# 2. primary node bodies
cat graph/nodes/codebase-ema.qmd
cat graph/nodes/codebase-claudeforge.qmd

# 3. only the artifacts that matter
git show origin/codebase-ema:code/ema/docs/HERMES_HARNESS_DRIVER_REGISTRY.md
git show origin/codebase-ema:code/ema/docs/HERMES-EMA-AI-ENGINE-INTERFACE-PLAN.md
git show origin/codebase-claudeforge:packages/server/src/providers/hermes-provider.ts
```

That's the whole loop. Three files of context for a typical design task,
not 36 branches.

---

## Step 3 — when to widen

Widen only when an edge is incomplete:

- The edge file is missing a node you need → add it, update the node's
  `referenced_in_docs:` to point back at the edge file.
- A node has empty `key_artifacts:` → run `git ls-tree -r origin/<branch>
  --name-only | head -50` to discover, then *update the node*.
- Two edges contradict → reconcile in the edge file with the older era's
  notes preserved as `> historical:` blockquotes; do not silently overwrite.

---

## Step 4 — qmd / search hygiene

The graph is designed to be searchable by qmd-aware tools (Quarto,
ripgrep+frontmatter, simple `yq` queries). To keep search useful:

- Frontmatter keys are stable (see `graph/SCHEMA.md`); do not rename.
- Tag vocabulary is controlled — pick from the SCHEMA list.
- One concept per `contributes:` tag. If your branch needs a new concept,
  add it to the controlled vocabulary first.
- Always add reciprocal edges: if `A.preserves_from = [B]`, then
  `B.inspires` should contain `A`.

Quick searches:

```bash
# all canonical nodes
rg '^status: canonical' graph/nodes

# everything contributing to identity
rg '^contributes:.*identity' graph/nodes

# what references a doc
rg -l '05-fresh-context-project-app-model.md' graph/

# load priority 1 only
rg '^load_priority: 1' graph/nodes
```

---

## Step 5 — when you change something, update the graph

The graph rots fast if commits don't maintain it. The rule:

> **Any commit that adds, removes, or re-classifies a branch MUST update the
> matching `graph/nodes/<branch>.qmd` in the same commit, and update
> `SYSTEM_GRAPH.md` if the change is cross-cutting.**

A pre-commit hook lives at `scripts/check-graph.sh` (best-effort; warns, does
not block). Run it manually if needed:

```bash
./scripts/check-graph.sh
```

---

## Anti-patterns

- ❌ `git checkout` a `codebase-*` branch and grep blindly — load the node
  first, follow `key_artifacts`.
- ❌ Treat any branch as "the next version of EMA" — only `codebase-ema`
  has `status: canonical`.
- ❌ Add a new doc at the repo root without linking it from at least one
  node's `referenced_in_docs:` — orphans break the graph.
- ❌ Read all five `0X-*.md` handoff docs every turn — read
  `MACBOOK_AGENT_HANDOFF_MASTER.md` (it summarizes them) and only widen if
  the topic edge demands it.
