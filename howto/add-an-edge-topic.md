# Playbook — add an edge topic

Use this when a cross-cutting concept emerges that doesn't fit any of the
existing `graph/edges/*.md` files (current set:
authority, collab, execution, identity, memory, orchestration, recovery,
surfaces, transport, ux-metaphor, workspace).

## Steps

1. **Pick a tag.** First check the controlled vocabulary in
   [`graph/SCHEMA.md`](../graph/SCHEMA.md). If the existing tags don't fit:
   - extend SCHEMA's vocabulary in the same commit
   - keep the new tag short, lowercase, hyphenated

2. **Create `graph/edges/<topic>.md`.** Use this skeleton:
   ```markdown
   # Edge: <topic> (one-line definition)

   **Rule:** <the principle this topic enforces>

   ## Primary
   - `<node-id>` — `<path-or-reason>`

   ## Secondary
   - `<node-id>` — `<path-or-reason>`

   ## Cross-references
   - `<doc-or-section>`

   ## Open
   - <unresolved questions; link to OPEN_QUESTIONS.md if global>
   ```

3. **Add the topic to `SYSTEM_GRAPH.md`'s topic table** (the "Concept
   edges" section). Match the row format used for existing topics.

4. **Update each cited node's frontmatter** so `referenced_in_docs:`
   includes the new edge file. This makes the edge visible from inside the
   node, not just from the topic file.

5. **If the topic introduces a verb the codebase will use** (e.g. "dispatch",
   "replay", "personalize"), add it to `GLOSSARY.md` so the term is
   canonical.

## Verification

```bash
./scripts/check-graph.sh
./scripts/manifest.sh
rg "$(basename graph/edges/<topic>.md .md)" SYSTEM_GRAPH.md
```

Expected:
- 0 warnings
- the new topic appears in SYSTEM_GRAPH.md's topic table
- the manifest's `edge_topics` array contains the new topic

## Commit message template

```
graph: add <topic> edge topic

- graph/edges/<topic>.md: rule, primary/secondary, cross-references, open
- graph/SCHEMA.md: add <new-tag> to controlled vocabulary (if needed)
- SYSTEM_GRAPH.md: list under Concept edges
- N node frontmatter updates: referenced_in_docs += graph/edges/<topic>.md

Reason: <one-line motivation, what task surfaced it>
```

## Cross-references

- [`graph/SCHEMA.md`](../graph/SCHEMA.md)
- [`CONTRIBUTING_TO_GRAPH.md`](../CONTRIBUTING_TO_GRAPH.md) §D
- [`AGENT_TRAVERSAL.md`](../AGENT_TRAVERSAL.md) — how topics are loaded
