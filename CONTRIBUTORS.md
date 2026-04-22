# Contributors

How a contributor (human or AI agent) reads this repo, navigates it,
and adds to it without breaking the lineage discipline.

## Who this repo is for

- The user (TrajanWJ) running long-horizon work toward EMA v0.0.3 on
  Gleam/BEAM.
- AI agents that join cold across machines and need to act fast — see
  [`AGENT_BOOTSTRAP.md`](AGENT_BOOTSTRAP.md) and
  [`AGENT_TRAVERSAL.md`](AGENT_TRAVERSAL.md).
- Future collaborators who arrive after the build starts and need to
  understand the lineage they're inheriting.

## Reading order

There are three reading orders depending on what you came for.

### "I want to act on this in the next hour"

1. [`AGENT_QUICKREF.md`](AGENT_QUICKREF.md)
2. [`FAQ.md`](FAQ.md)
3. The `howto/` playbook that matches your task
4. Stop. Act.

### "I want to understand the project deeply"

1. [`VISION.md`](VISION.md)
2. [`MACBOOK_AGENT_HANDOFF_MASTER.md`](MACBOOK_AGENT_HANDOFF_MASTER.md)
3. [`SYSTEM_GRAPH.md`](SYSTEM_GRAPH.md)
4. [`TIMELINE.md`](TIMELINE.md)
5. The 5 numbered handoff docs (`01-…` through `05-…`)
6. [`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md)
7. [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md)
8. [`GLEAM_NOTES.md`](GLEAM_NOTES.md) and the `research/` corpus
9. [`EMA_V0_0_3_PREP.md`](EMA_V0_0_3_PREP.md)

### "I want to build the atlas site"

1. [`README.md`](README.md)
2. [`ATLAS_NOTES.md`](ATLAS_NOTES.md)
3. [`LIB_DATA_CONTRACT.md`](LIB_DATA_CONTRACT.md)
4. `lib/ema-atlas.ts` (the data model)
5. `app/page.tsx` (entry point) — then any specific route
6. [`DELIVERABLES_INDEX.md`](DELIVERABLES_INDEX.md)
7. [`howto/add-a-deliverable.md`](howto/add-a-deliverable.md)

## Operating discipline

The repo is held together by four invariants. Don't break them.

1. **The canonical rule wins.** "EMA owns truth. Hermes owns execution.
   Surfaces do not own state." If your change seems to violate this
   rule, [file an open question](OPEN_QUESTIONS.md), don't shortcut.

2. **The graph stays consistent.**
   [`scripts/check-graph.sh`](scripts/check-graph.sh) must pass with
   zero warnings before any commit that touches `graph/`. See
   [`CONTRIBUTING_TO_GRAPH.md`](CONTRIBUTING_TO_GRAPH.md).

3. **Vocabulary is controlled.** Definitions live in
   [`GLOSSARY.md`](GLOSSARY.md). Tags live in
   [`graph/SCHEMA.md`](graph/SCHEMA.md). Don't introduce a synonym;
   extend the existing entry.

4. **History is preserved.** Open questions don't get deleted when
   resolved — they get marked. Vault candidate terms don't disappear
   when promoted — they migrate. Old commits don't get rewritten.

## Commit message conventions

| Prefix | Use when |
|---|---|
| `graph: …` | Touching `graph/`, `SYSTEM_GRAPH.md`, `SYSTEM_MANIFEST.json`, or per-branch graph-pointer blocks |
| `atlas: …` | Touching `app/`, `components/`, `lib/`, `content/`, atlas-side configuration |
| `docs: …` | Top-level `*.md` files (handoff docs, GLOSSARY, OPEN_QUESTIONS, FAQ, etc.) |
| `gleam: …` | Anything Gleam-/BEAM-specific (`research/`, `GLEAM_NOTES.md`, `EMA_V0_0_3_PREP.md`) |
| `glossary: …` | Promoting/demoting/extending terms in `GLOSSARY.md` |
| `branch:<name>: …` | Content changes inside a non-main branch |
| `chore: …` | Build scripts, tooling, dependency bumps |

Cite design principles by P-number when relevant
(`feat(driver): typed contract via Subject(DriverMsg) (P2, P5)`).

## How to add to the repo

| Want to… | Use |
|---|---|
| add a new branch | [`howto/add-a-branch.md`](howto/add-a-branch.md) |
| add a harness driver | [`howto/add-a-driver.md`](howto/add-a-driver.md) |
| add a vApp | [`howto/add-a-vapp.md`](howto/add-a-vapp.md) |
| add a topic edge | [`howto/add-an-edge-topic.md`](howto/add-an-edge-topic.md) |
| add a deliverable (brief, slide, canvas, diagram, PDF, …) | [`howto/add-a-deliverable.md`](howto/add-a-deliverable.md) |
| resolve an open question | [`howto/resolve-an-open-question.md`](howto/resolve-an-open-question.md) |
| promote a vault candidate term | [`howto/promote-vault-term.md`](howto/promote-vault-term.md) |
| extract doctrine from a legacy branch | [`howto/extract-doctrine-from-a-legacy-branch.md`](howto/extract-doctrine-from-a-legacy-branch.md) |
| Gleam-fit-review a new part | [`howto/gleam-fit-review.md`](howto/gleam-fit-review.md) |
| load only the context your task needs | [`howto/load-context-for-a-task.md`](howto/load-context-for-a-task.md) |

## Subagent etiquette

When you dispatch a background agent, follow these rules so concurrent
agents don't collide:

- **Be specific about which paths the agent may write to.** Tell it
  which files NOT to modify.
- **One agent per file.** If two agents both need to modify
  `lib/ema-atlas.ts`, sequence them, or have one agent do both
  modifications.
- **Self-contained prompts.** The agent has no memory of this
  conversation; include the absolute repo path, the relevant docs to
  read first, and the exact output shape.
- **Verify outputs by name.** When an agent reports completion, the
  parent should `ls` the claimed paths before treating them as ground
  truth.
- **Re-run regenerators after agent batches.** `check-graph.sh` →
  `manifest.sh` → `graph-json.sh` → `index.sh`.

## Pre-push checklist

Before any push to `main`:

```bash
./scripts/check-graph.sh        # must be 0 warnings
./scripts/manifest.sh           # regen
./scripts/graph-json.sh         # regen
./scripts/index.sh              # regen
git diff --stat                 # eyeball
```

If you're touching the atlas app, also:

```bash
npx next build                  # must compile clean
```

## When in doubt

Read [`AGENT_QUICKREF.md`](AGENT_QUICKREF.md). If still in doubt, file
an entry in [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md). Surfacing a
question is always better than silently breaking an invariant.
