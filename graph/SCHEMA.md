# Graph Schema

This directory turns the transfer pack into a **navigable graph** so an agent
(or qmd-aware search tool) can load just the slice of context it needs without
re-reading every branch.

## Layout

- `graph/nodes/<branch>.qmd` — one node per branch. YAML frontmatter is the
  machine-readable edge set; body is human/agent-readable summary.
- `graph/edges/<topic>.md` — cross-cutting edges grouped by theme
  (e.g. authority, surfaces, collaboration). Each topic file lists the
  branches/files that participate and how.
- `SYSTEM_GRAPH.md` (repo root) — the rendered overview with the full edge
  table; regenerate from `graph/` whenever nodes change.

## Node frontmatter

```yaml
---
id: <branch-name>                  # primary key — matches `git branch -r`
type: codebase | lineage | docs | recovery | meta
era: place-org | ema-daemon | claudeforge | openclaw | mesh-p2p | meta | hybrid
status: canonical | doctrine-only | inspiration | archive | active | meta
contributes: [tag, ...]            # concept tags this branch donates
preserves_from: [node-id, ...]     # branches whose ideas/code live on here
inspires: [node-id, ...]           # branches downstream of this one
superseded_by: [node-id, ...]      # what replaces this branch in the rewrite
adjacent_to: [node-id, ...]        # peer / sibling lineages
referenced_in_docs: [path, ...]    # repo-relative paths that cite this branch
key_artifacts: [path, ...]         # branch-internal paths worth loading first
aliases: [name, ...]               # historical names / old repo paths
load_priority: 1-5                 # 1 = read first; 5 = archive only
---
```

## Tag vocabulary (controlled)

Use these tags in `contributes` so search stays consistent:

- **authority** — control-plane, system-of-record, lineage tracking
- **execution** — runtime, dispatch, harness
- **surface** — UI shell, Discord/web/CLI/editor
- **workspace** — shared human-agent state, plans, handoffs, exports
- **collab** — docs/wiki/canvas synchronous collaboration
- **identity** — org/space/member/agent identity model
- **placement** — local/daemon/peer/host-affinity
- **memory** — second-brain, vault, knowledge ingest
- **orchestration** — multi-agent, roles, watchdog
- **doctrine** — patterns/lessons rather than reusable code
- **ux-metaphor** — desktop/launchpad/HQ/place feel
- **transport** — p2p/mesh/networking
- **driver** — harness driver for a specific runtime
- **recovery** — historical residue useful for replay/debug only

## How agents should use this

1. Read `SYSTEM_GRAPH.md` for the map.
2. Load the `meta` and `canonical` nodes (load_priority 1-2).
3. Pull `key_artifacts` from a node before reading the branch body.
4. Follow `preserves_from` / `superseded_by` edges to jump eras instead of
   linearly scanning every branch.

## How to extend

When adding a branch, create the node file FIRST, then push the branch.
When making a cross-cutting connection, add it to a `graph/edges/<topic>.md`
file AND update both endpoints' `referenced_in_docs`.
