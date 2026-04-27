# Style Guide

Voice and form conventions for everything written in this repo. Read
this if you're writing a brief, a matrix, a research doc, a node body,
an edge file, a howto, or any markdown the atlas renders.

> The voice is **calm, specific, and honest about what's not yet
> decided.** Marketing tone is not the voice. Tutorial tone is not the
> voice. The voice is "an experienced collaborator briefing another
> experienced collaborator."

## Voice rules

1. **Plain. Specific. Falsifiable.** Use file paths, branch names,
   Q-numbers. Avoid "robust", "powerful", "comprehensive".
2. **Don't paraphrase the canonical rule.** Render verbatim:
   *"EMA owns truth. Hermes owns execution. Surfaces do not own state."*
3. **Don't recommend.** Surface tradeoffs, name costs, leave the
   choice to the user. Decision matrices have an empty Decision section.
4. **Cite when you claim.** A real path, a real Q-number, a real
   commit. If you can't cite, mark `[UNVERIFIED]`.
5. **Use present tense for what exists, future tense for what doesn't.**
   "EMA has a typed event_log." vs "Build-step 03 will land a Subject."
6. **Active voice.** "The driver registry rejects unsupported placements,"
   not "Unsupported placements are rejected."
7. **Short paragraphs, generous whitespace.** Three sentences is a long
   paragraph. Use lists when items don't flow.

## Term discipline

- Use exact terms from `GLOSSARY.md`. Don't introduce synonyms.
- Vault candidate terms (`Brain Dump`, `Auto-Resolve Gate`, `Cognitive
  Cockpit`, etc.) are **candidates** until promoted; cite them as
  `<Term> (vault candidate, see GLOSSARY.md)` in user-facing copy.
- "Driver" ≠ "Provider" ≠ "Harness". The three are distinct
  abstractions; treating them as one is one of the named architecture
  mistakes (see `MACBOOK_AGENT_HANDOFF_MASTER.md` §20).
- Capitalize EMA. Capitalize Hermes. Lowercase BEAM/Gleam everywhere
  except start of sentence.

## Reference discipline

- Use **relative** links inside the repo: `[OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)`,
  not full URLs. Exception: per-branch READMEs use full GitHub URLs
  because they're rendered on individual branches.
- For files inside other directories, use the full repo-relative path:
  `[research/parts/identity-project-space.md](research/parts/identity-project-space.md)`.
- For an open question reference, write `Q1` (not "question 1" or
  "the agent identity question") — the auto-linker (`lib/text-decorate.ts`)
  catches Q-references.
- For a glossary term, just use the term verbatim — the auto-linker
  finds it.

## Doc-shape rules per type

### Briefs (`content/briefs/<slug>.md`)
The frame · What's already true · What's still open · Three futures
expanded · Decision pressure · Read next. ~1000 words.

### vApp briefs (`content/vapps/<slug>.md`)
What it owns · What it renders · What humans do · What agents do via
CLI · Chronicle/review/memory · How it satisfies the canonical rule ·
v0.0.3 question. ~300-500 words.

### Deep vApp briefs (`content/vapps/<slug>-deep.md`)
Stance · Object model · Three futures deepened · Humans · Agents-via-CLI
· Smallest provable v0.0.3 slice · Decision pressure unique to vApp ·
Cross-references. ~1500-2500 words.

### Decision matrices (`content/decisions/Q<n>-<slug>.md`)
Question · Options being weighed · Criteria table · Costs and bets ·
Open questions this decision creates · Reversibility plan · Provenance ·
Decision (BLANK). ~1200-2000 words.

### Build-step starters (`research/build-steps/<NN>-*.md`)
Goal/Depends-on/Open-questions-held-open header · What this step
produces · Type sketches · Module layout · Supervision tree fragment ·
Acceptance criteria · Property tests · What gets stubbed · Cross-references.
~800-1200 words.

### Per-part Gleam mappings (`research/parts/<slug>.md`)
Part summary · Type sketch · Actor sketch · Supervision tree fragment ·
Erlang/Elixir interop · Tests · Open questions specific to Gleam mapping ·
Read next. ~600-1000 words.

### Howto playbooks (`howto/<slug>.md`)
Steps · Verification · Commit message template · Cross-references.
Anti-patterns section optional but encouraged.

### Node bodies (`graph/nodes/<branch>.qmd`)
Frontmatter (machine-readable) · Why this matters · What lives here ·
Where it connects · How to load it efficiently. Optional later sections:
Stack & contents · Doctrine extracted (YYYY-MM-DD).

### Topic edges (`graph/edges/<topic>.md`)
Rule · Primary nodes · Secondary nodes · Cross-references · Open. Each
node bullet is `- \`<node-id>\` — \`<path-or-reason>\``.

## Markdown discipline

- Code spans for: file paths, module names, branch names, Q-numbers
  inside text, exact CLI commands.
- Code blocks (` ``` `) for: multi-line code, multi-line shell, text
  art, supervision tree fragments. Always with a language tag where it
  exists (`bash`, `gleam`, `ts`, `elixir`, `text`).
- Bold (`**…**`) for: invariants, principle names (P1-P10), question
  IDs in matrices.
- Italic (`*…*`) for: questions that linger (in `content/demo/narrative.md`),
  status labels in inline prose.
- Block quotes (`> …`) for: the canonical rule, status notes, framing
  asides.

## Anti-patterns

- ❌ Marketing words. "world-class", "next-generation", "seamless".
- ❌ Implicit recommendations dressed as analysis. "Consider X" is a
  recommendation. Write "X has property Y; Z has property W."
- ❌ Long paragraphs. Break them up.
- ❌ Synonyms. "EMA daemon" ≠ "EMA core" ≠ "the system" — pick one and
  promote it to the glossary.
- ❌ Markdown in headings (no `## **bold**`).
- ❌ Emojis except in `MAP.md` category headers (where they're
  navigational).

## When in doubt

Ask: "would another experienced collaborator read this and either
agree or disagree, with no third option?" If they could read it three
ways, it's too vague. Tighten until they can only read it one.

## Cross-references

- [`GLOSSARY.md`](GLOSSARY.md) — the only source of canonical terms
- [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) — P1-P10 for invariant references
- [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md) — Q-number references
- [`CONTRIBUTORS.md`](CONTRIBUTORS.md) — broader contributor onboarding
- [`CONTRIBUTING_TO_GRAPH.md`](CONTRIBUTING_TO_GRAPH.md) — graph-side workflows
- [`howto/`](howto/) — recipes per task type
