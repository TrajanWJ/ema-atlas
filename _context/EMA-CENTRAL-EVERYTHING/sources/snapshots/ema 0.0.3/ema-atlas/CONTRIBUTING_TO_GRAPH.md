# Contributing to the Graph

Rules for keeping the transfer pack self-aware as it grows. The graph
(`graph/nodes/`, `graph/edges/`, `SYSTEM_GRAPH.md`, `SYSTEM_MANIFEST.json`)
loses value the moment it stops matching reality. These rules exist so it
doesn't.

## Invariants

1. **Every remote branch has exactly one node file.** Naming:
   `graph/nodes/<branch>.qmd`. `scripts/check-graph.sh` enforces this.
2. **Every node references a real branch.** No node files for branches that
   no longer exist; delete them in the same commit that deletes the branch.
3. **Reciprocal edges.** If `A.preserves_from = [B]`, then `B.inspires` must
   contain `A`. The check script enforces this for `preserves_from` already.
4. **Controlled vocabulary.** Tags in `contributes:` come only from
   `graph/SCHEMA.md`. New tags require a SCHEMA edit first.
5. **Every doc at repo root is reachable from the graph.** Either via a
   node's `key_artifacts:` or via an edge file's body. Orphan docs rot.
6. **Open questions live in `OPEN_QUESTIONS.md`.** Don't sprinkle them
   across nodes. Cross-reference instead.
7. **Glossary terms are stable.** Don't introduce a synonym; extend the
   existing definition.

## Workflows

### A — Adding a new branch

```bash
# 1. push the branch
git push origin <branch>
# 2. create the node FIRST
$EDITOR graph/nodes/<branch>.qmd       # use SCHEMA frontmatter
# 3. add cross-references
#    - to at least one graph/edges/<topic>.md
#    - to at least one other node's `inspires` or `adjacent_to`
#    - update SYSTEM_GRAPH.md tables if cross-cutting
# 4. annotate the branch's README with the graph-pointer block
#    (copy from any existing branch's README — the block is delimited by
#     <!-- graph-pointer --> ... <!-- /graph-pointer -->)
# 5. regenerate manifest and check
./scripts/manifest.sh
./scripts/check-graph.sh
```

### B — Re-classifying a branch

If a `doctrine-only` branch becomes `canonical` (or vice versa), update:
- the node's `status:`
- the node's `load_priority:`
- every edge file that lists it
- `SYSTEM_GRAPH.md` (eras table + load-priority bands)

### C — Deleting a branch

```bash
git push origin --delete <branch>
git rm graph/nodes/<branch>.qmd
# scrub references from edge files and from other nodes'
# preserves_from / inspires / adjacent_to / superseded_by
./scripts/check-graph.sh
```

### D — Adding a cross-cutting concept

If your work surfaces a new topic that doesn't fit any existing edge file:

1. Pick a tag from the SCHEMA vocabulary, or extend it.
2. Create `graph/edges/<topic>.md` using the same shape as existing files
   (Primary / Secondary / Cross-references / Open).
3. Update each cited node's `referenced_in_docs:` to include the new edge file.
4. Add the topic row to `SYSTEM_GRAPH.md`'s topic table.

### E — Resolving an open question

1. Move the resolution into the relevant doc (a node body, an edge file, or
   a fresh design doc under a topic-named path).
2. Mark the entry in `OPEN_QUESTIONS.md` as `status: resolved YYYY-MM-DD →`
   with a link to the resolving doc. **Do not delete the entry** — historical
   context outlives the decision.
3. If the resolution shrinks the surface area of *another* open question,
   update that one too.

## Commit-message conventions

- `graph: <action>` — anything touching `graph/`, `SYSTEM_GRAPH.md`,
  `SYSTEM_MANIFEST.json`, or per-branch graph-pointer blocks.
- `docs: <action>` — handoff docs at repo root, GLOSSARY, OPEN_QUESTIONS,
  AGENT_*.
- `branch:<name>: <action>` — content changes inside a single branch.

## Pre-commit checklist

Before any commit that touches `graph/` or root-level docs:

```bash
./scripts/check-graph.sh        # warns on schema violations
./scripts/manifest.sh           # regenerates SYSTEM_MANIFEST.json
git diff --stat                 # eyeball the change set
```

Commit `SYSTEM_MANIFEST.json` whenever the underlying data changed — it's the
machine-readable index agents may rely on.

## When in doubt

- Ask: "does the graph still answer 'what does this branch contribute, and
  what does it depend on?' for every node?"
- Ask: "if I were a fresh agent reading only README + SYSTEM_GRAPH +
  GLOSSARY + OPEN_QUESTIONS, would I find this change?"
- Ask: "did I add a reciprocal edge?"

If the answer to any of those is no, fix it before pushing.
