# Playbook — add a branch

Use this when you're adding a new branch to the transfer pack (codebase
snapshot, lineage residue, doc cluster, recovery fixture).

## Steps

1. **Push the branch** with content already in it.
   ```bash
   git push origin <branch>
   ```

2. **Create the node file FIRST.** Copy the closest existing node and edit:
   ```bash
   cp graph/nodes/codebase-claudeforge.qmd graph/nodes/<branch>.qmd
   $EDITOR graph/nodes/<branch>.qmd
   ```
   Required frontmatter (see [`graph/SCHEMA.md`](../graph/SCHEMA.md)):
   - `id` = `<branch>` exactly
   - `type` = one of `codebase | lineage | docs | recovery | meta`
   - `era` = one of `place-org | openclaw | claudeforge | ema-daemon | mesh-p2p | hybrid | meta`
   - `status` = one of `canonical | doctrine-only | inspiration | archive | active | meta`
   - `contributes` = tags from the controlled vocab in `graph/SCHEMA.md`
   - `key_artifacts` = 3-6 paths inside the branch worth `git show`ing first

3. **Add reciprocal edges.** If `<branch>.preserves_from = [X]`, then
   `graph/nodes/X.qmd` must list `<branch>` under `inspires:`.

4. **Place the node in at least one topic edge.** Open the relevant
   `graph/edges/<topic>.md` and add the new node under Primary or Secondary.
   If no topic fits, see [`add-an-edge-topic.md`](add-an-edge-topic.md).

5. **Annotate the branch's README** with the `<!-- graph-pointer -->` block.
   Copy the block from any existing branch's README; only the branch name in
   the `graph/nodes/<branch>.qmd` link changes.

6. **Update `SYSTEM_GRAPH.md`** if the new branch shifts the era table or
   load-priority bands.

7. **Regenerate the manifest.**
   ```bash
   ./scripts/manifest.sh
   ```

## Verification

```bash
./scripts/check-graph.sh    # expect 0 warnings
git diff --stat
```

You should see (at minimum):
- `graph/nodes/<branch>.qmd` (new)
- one `graph/edges/*.md` (modified)
- one or more sibling node files (modified — reciprocal edges)
- `SYSTEM_MANIFEST.json` (modified)

## Commit message template

```
graph: add <branch> node + edges

- graph/nodes/<branch>.qmd: <one-line summary, era, status>
- graph/edges/<topic>.md: list under <Primary|Secondary>
- reciprocal: <peer-node>.qmd updated under inspires:
- branch README: graph-pointer block

Refs: <handoff doc paths if any>
```

## Cross-references

- [`CONTRIBUTING_TO_GRAPH.md`](../CONTRIBUTING_TO_GRAPH.md) — invariants the change must satisfy
- [`graph/SCHEMA.md`](../graph/SCHEMA.md) — frontmatter and tag vocabulary
- [`GLOSSARY.md`](../GLOSSARY.md) — for any new terms the branch introduces
