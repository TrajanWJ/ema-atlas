# Playbook — extract doctrine from a legacy branch

Use this when you want to mine an OpenClaw / place.org / ClaudeForge /
agent-os-* branch for **patterns** without re-importing code. The principle
is in [`03-architectural-evolution-and-major-decisions.md`](../03-architectural-evolution-and-major-decisions.md)
§7.7: *extract doctrine, not residue.*

## When to use this

- You're designing a new EMA subsystem and want to avoid re-discovering a
  problem an earlier era already solved.
- You're tempted to copy code from a `doctrine-only` or `inspiration` branch.
  **Stop and use this playbook instead.**

## Steps

1. **Identify the branch's status.** Open `graph/nodes/<branch>.qmd`. If
   `status:` is `canonical` or `active`, you don't need this playbook —
   that branch's code is allowed to flow forward. If `status:` is
   `doctrine-only`, `inspiration`, or `archive`, continue.

2. **Read the node body, not the branch.** The `Why this is here` /
   `Stack & contents` / `How to load it efficiently` sections are designed
   to give you the doctrine without the code. If they don't, that's a node
   bug — fix the node before fixing your subsystem (see
   [`add-a-branch.md`](add-a-branch.md) §2-§3 for the right shape).

3. **Pull only the doctrine documents** via `git show`:
   - Architecture docs (e.g. `ARCHITECTURE.md`, `FORK-ARCHITECTURE.md`)
   - Identity / role / soul docs (e.g. `agents/<role>/IDENTITY.md` in
     `lineage-openclaw-agent-workspaces`)
   - Plan documents (e.g. `.plans/01-...md` in `codebase-t3code-fork`)
   - Top-level READMEs of subprojects

4. **Write a doctrine note** under
   `code/ema/docs/doctrine/<topic>-<source-branch>-<YYYY-MM-DD>.md`
   in the canonical EMA repo, with:
   - **Source branch + paths** (so the provenance is recoverable)
   - **What the prior era got right** (one paragraph)
   - **What the prior era got wrong** (one paragraph)
   - **What to carry forward as principle, not code** (numbered list)
   - **What to leave behind** (numbered list)

5. **Cross-reference back into the graph.** Add the doctrine note's path to
   the source node's `referenced_in_docs:` frontmatter, and add a line in
   the relevant `graph/edges/<topic>.md` under "Cross-references".

## Anti-patterns

- ❌ Copy-pasting Elixir/TS modules from a `doctrine-only` branch into the
  canonical repo. If you find yourself doing this, the branch should
  probably be re-classified to `canonical` (see
  [`CONTRIBUTING_TO_GRAPH.md`](../CONTRIBUTING_TO_GRAPH.md) §B) — but that
  decision needs explicit user sign-off, not a silent copy.
- ❌ Extracting "doctrine" that is actually one person's preference dressed
  up as principle. Doctrine has to be *replicable* across multiple eras of
  the lineage; if you can't find the same pattern in at least two branches,
  it's not doctrine yet.
- ❌ Importing OpenClaw runtime config (`.openclaw/`, `runtime/openclaw.sanitized.json`).
  That is residue, not doctrine.

## Verification

```bash
ls code/ema/docs/doctrine/
./scripts/check-graph.sh
```

Doctrine note should be discoverable from:
- the source node's `referenced_in_docs:`
- at least one `graph/edges/<topic>.md` "Cross-references" section
- a grep for the topic term

## Commit message template

```
ema: extract <topic> doctrine from <source-branch>

- code/ema/docs/doctrine/<topic>-<source-branch>-<date>.md: principle, not code
- transfer-pack/graph/nodes/<source-branch>.qmd: referenced_in_docs += note
- transfer-pack/graph/edges/<topic>.md: link doctrine note

Carries forward: <one-line>. Leaves behind: <one-line>.
```

## Cross-references

- [`03-architectural-evolution-and-major-decisions.md`](../03-architectural-evolution-and-major-decisions.md) §7.7
- [`graph/edges/orchestration.md`](../graph/edges/orchestration.md) — historic example: OpenClaw → babysitter
- [`graph/nodes/lineage-openclaw.qmd`](../graph/nodes/lineage-openclaw.qmd)
