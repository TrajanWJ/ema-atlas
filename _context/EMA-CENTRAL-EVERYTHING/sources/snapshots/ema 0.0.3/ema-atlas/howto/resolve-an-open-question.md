# Playbook — resolve an open question

Use this when you're closing one of the entries in
[`OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md). The point is to land the
decision **somewhere durable** and to leave the question entry as a marker
pointing at the resolution — never delete it.

## Steps

1. **Confirm the question is actually resolved.** Acceptable resolutions:
   - a merged change in the canonical EMA repo with the schema/contract/code
     that implements the decision
   - a design doc in `docs/decisions/<NNNN>-<slug>.md` of the canonical EMA
     repo (ADR-style — Context / Decision / Consequences / Status)
   - explicit user-confirmation captured into a transfer-pack node body
     under a `> resolved YYYY-MM-DD:` blockquote

   If none of those exist yet, the question is **parked**, not resolved.
   Use `status: parked` and link the discussion thread.

2. **Update `OPEN_QUESTIONS.md`** in place:
   ```markdown
   ## Q<N> — <title>

   - **Status:** resolved 2026-MM-DD → <link to decision doc / commit>
   - **Resolution:** <one paragraph: what was chosen, what was rejected, why>
   - **Blast radius (was):** <unchanged from before>
   - **Where it surfaces (was):** <unchanged>
   ```
   Do **not** delete the entry. Future agents need the historical context.

3. **Propagate the resolution into the graph.**
   - The relevant `graph/edges/<topic>.md` should have its "Open" section
     trimmed of the resolved bullet, with a back-reference to the decision
     doc.
   - Any node body that mentioned the question should be updated.
   - If the resolution introduces a new term, add it to `GLOSSARY.md`.

4. **Check downstream questions.** Resolving Q1 (agent identity) often
   shrinks Q4 (where personal AI runs). Re-read every other entry and
   update its Blast radius if your decision affects it.

5. **Regenerate the manifest.**
   ```bash
   ./scripts/manifest.sh
   ```

## Verification

```bash
./scripts/check-graph.sh
rg '^- \*\*Status:\*\* resolved' OPEN_QUESTIONS.md  # should include Q<N>
```

A fresh agent reading only `OPEN_QUESTIONS.md` should be able to follow the
link to the decision doc without checking out any other branch.

## Commit message template

```
docs: resolve OPEN_QUESTIONS Q<N> — <one-line title>

- OPEN_QUESTIONS.md: mark Q<N> resolved → <decision doc>
- graph/edges/<topic>.md: trim Open section, link decision
- GLOSSARY.md: add <term> if introduced
- N node bodies updated to reflect resolution

Decision: <one-line summary>. Affects Q<...> (downstream).
```

## Cross-references

- [`OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md)
- [`CONTRIBUTING_TO_GRAPH.md`](../CONTRIBUTING_TO_GRAPH.md) §E
- [`GLOSSARY.md`](../GLOSSARY.md)
