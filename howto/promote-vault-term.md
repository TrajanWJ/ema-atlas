# Playbook — promote a vault candidate term

The "Vault candidate terms" section of [`GLOSSARY.md`](../GLOSSARY.md)
holds 15 named concepts mined from `docs-host-obsidian-vault` that the
user has written about elsewhere but hasn't yet adopted into the canonical
EMA vocabulary. This playbook is for promoting a candidate term — moving
it from the candidate table into the main canonical table.

> A candidate term is **not** wrong. It just hasn't been authoritatively
> adopted yet. Promoting it makes it part of EMA's controlled vocabulary
> and commits future deliverables to use it consistently.

## When to promote

- The term has appeared in at least two distinct vault docs **AND** at
  least one current EMA design discussion (a node body, an edge file, a
  brief, an open-question entry).
- The user has explicitly endorsed it, or it has been used in a `> resolved`
  blockquote on an open question.
- The term sharpens a distinction the canonical glossary currently glosses
  over.

If none of those are true, **don't promote it yet**. Cite it as a
candidate (`Brain Dump (vault candidate, see GLOSSARY.md)`) and let it
mature.

## Steps

1. **Confirm the source.** Run `git show
   origin/docs-host-obsidian-vault:<path>` against the path cited in the
   candidate row. Make sure the definition still matches; vault docs evolve.

2. **Check for a duplicate.** Grep `GLOSSARY.md` for synonyms or
   near-synonyms in the canonical table. If there's overlap, **extend the
   existing entry** with the candidate's nuance instead of adding a new row
   (per the no-synonyms rule in `CONTRIBUTING_TO_GRAPH.md` §7).

3. **Move the row** from the "Vault candidate terms" table to the main
   canonical table in `GLOSSARY.md`. Keep the source citation; replace the
   "candidate" framing with a confident definition.

4. **Find every place the term is already used as a candidate** and remove
   the parenthetical "(vault candidate)". Grep:
   ```bash
   rg "vault candidate" --type md
   ```

5. **Update at least one node and one edge** to use the now-canonical term.
   - Node: `graph/nodes/<branch>.qmd` — add the term as a tag in
     `contributes:` if appropriate (note: only after extending
     `graph/SCHEMA.md` controlled vocab if the term implies a new tag).
   - Edge: `graph/edges/<topic>.md` — add a sentence in the relevant
     section explaining how the term participates in the topic.

6. **Add a CHANGELOG entry** under the current wave/pass.

7. **Regenerate the manifest and graph.json:**
   ```bash
   ./scripts/check-graph.sh && ./scripts/manifest.sh && \
     ./scripts/graph-json.sh && ./scripts/index.sh
   ```

## Verification

```bash
# the term should appear in INDEX.md
rg '<promoted term>' INDEX.md
# graph.json should include it
python3 -c "import json; print([t for t in json.load(open('graph.json'))['glossary'] if '<promoted term>' in t['term']])"
# no orphan "(vault candidate)" mentions of the term remain
rg '<promoted term>.*vault candidate' --type md   # should be empty
```

## Commit message template

```
glossary: promote <term> from vault candidate to canonical

- GLOSSARY.md: move <term> row out of "Vault candidate terms" into
  the main table; <one-line on what nuance it adds>
- graph/nodes/<branch>.qmd: add <term> usage in body and (optionally)
  to contributes: tag list
- graph/edges/<topic>.md: <one-line on how <term> participates in topic>
- CHANGELOG.md: prepend entry

Source: <path in docs-host-obsidian-vault>. Endorsed by: <user message
or resolved-question reference>.
```

## Anti-patterns

- ❌ Promoting a term because it sounds cool. Promotion is a vocabulary
  commitment; future deliverables have to use it consistently.
- ❌ Promoting two synonyms. Pick one.
- ❌ Editing the candidate row in place to make it "more canonical-looking"
  without the underlying user endorsement. The candidate framing is
  protective — leave it until the term is actually adopted.

## Cross-references

- [`GLOSSARY.md`](../GLOSSARY.md) — both tables
- [`CONTRIBUTING_TO_GRAPH.md`](../CONTRIBUTING_TO_GRAPH.md) §7
- [`howto/resolve-an-open-question.md`](resolve-an-open-question.md) —
  similar shape: don't delete history, mark transition explicitly
