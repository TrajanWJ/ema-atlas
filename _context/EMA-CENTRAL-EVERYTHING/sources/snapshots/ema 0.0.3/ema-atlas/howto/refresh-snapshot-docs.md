# Playbook — refresh snapshot docs

Several top-level docs in this repo are **hand-crafted snapshots**.
They go stale fast. Use this playbook after any significant push to keep
them honest.

> The snapshot docs each carry a "When this file goes stale" or
> "Refresh after…" note. This playbook collects them in one place.

## Snapshot docs

| File | Refresh trigger | What to update |
|---|---|---|
| [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) | Any significant push | Atlas-route status table, lineage-archive counts, in-flight subagents |
| [`NEXT.md`](../NEXT.md) | Live wave or priority shifts | "If you have N minutes/hour/day/week" guidance |
| [`MAP.md`](../MAP.md) | New top-level docs or directories | Tree fragments per category |
| [`DELIVERABLES_INDEX.md`](../DELIVERABLES_INDEX.md) | New deliverable in any format | Per-format tables; per-route status |
| [`AGENT_QUICKREF.md`](../AGENT_QUICKREF.md) | Numbers section drift | "Numbers" section + any new entry-doc |
| [`SHIP_CHECKLIST.md`](../SHIP_CHECKLIST.md) | Any build-step file changes; any OPEN_QUESTIONS resolution | Per-step boxes; cross-cutting Q-dependency boxes |
| [`content/decisions/PRIORITY.md`](../content/decisions/PRIORITY.md) | Any matrix moves to `resolved/` | Tier ordering |
| [`CHANGELOG.md`](../CHANGELOG.md) | Any landed wave/pass | Prepend a new entry under the current wave |

## Quick refresh sequence (after a push)

```bash
# 1. Run regenerators (auto-derived files)
./scripts/regen-all.sh

# 2. Compare auto-derived numbers to handcrafted snapshots
python3 -c "import json; d=json.load(open('graph.json')); print('counts:', d['counts'])"
ls content/briefs/*.md | wc -l
ls content/diagrams/*/*.svg | wc -l
ls content/vapps/*.md | wc -l
ls research/parts/*.md | wc -l
ls research/build-steps/*.md | wc -l
ls content/decisions/Q*.md 2>/dev/null | wc -l
ls app/**/page.tsx | wc -l

# 3. Open each snapshot doc, eyeball mismatches, hand-fix
$EDITOR PROJECT_STATUS.md NEXT.md MAP.md DELIVERABLES_INDEX.md \
        AGENT_QUICKREF.md SHIP_CHECKLIST.md content/decisions/PRIORITY.md

# 4. CHANGELOG entry
$EDITOR CHANGELOG.md   # prepend an entry under the current wave

# 5. Commit + push
git commit -m "docs: refresh snapshot docs after wave N"
git push origin main
```

## Refresh discipline per doc

### PROJECT_STATUS.md

- Atlas-route table: walk `app/` and verify every page.tsx has a
  matching row with the right status.
- Lineage-archive counts: pull from `graph.json#counts`.
- "What's in flight right now" — drop anything that landed; add anything
  newly dispatched.
- "Where the project is going next" — re-check against `ROADMAP.md`.

### NEXT.md

- "If you have N minutes/hour/day/week" should reflect the current wave's
  shape, not the previous one.
- The "Last refresh" date and current main-lane owner stay current.

### MAP.md

- Tree fragments are descriptive, not exhaustive. Add a row per new
  category, not per file.
- Counts in inline annotations are nice-to-have, not required.

### DELIVERABLES_INDEX.md

- For each new file in `content/`, add a row to the matching format table.
- For each new route in `app/`, add a row to the routes table.
- Status flips: planned → sketched → shipped on real progress, never on
  "we wrote a stub for it."

### AGENT_QUICKREF.md

- "Numbers" section pulls from `graph.json#counts` plus directory ls.
- New entry docs go in the 30-second-tour table.

### SHIP_CHECKLIST.md

- When a build-step file gets a new acceptance criterion, mirror the
  box here.
- When an OPEN_QUESTIONS Q resolves, mark its box checked AND check
  any per-step boxes that were assumption-laden against it.

### content/decisions/PRIORITY.md

- A matrix moves to `content/decisions/resolved/` → demote that Q from
  its tier (or remove if tier becomes empty).
- A new question gets added to OPEN_QUESTIONS → add to the matching tier.

### CHANGELOG.md

- One entry per wave, newest first. Don't list file diffs — those live
  in `git log`. The point is **why the repo got richer.**
- Date format: `## YYYY-MM-DD — wave N: <one-line theme>`.

## Anti-patterns

- ❌ Letting PROJECT_STATUS show "in flight" for something that landed
  3 commits ago.
- ❌ Editing the auto-derived files (`graph.json`, `SYSTEM_MANIFEST.json`,
  `INDEX.md`) by hand. Re-run the regenerators instead.
- ❌ Adding a new snapshot doc without adding it to this playbook's
  table at the top.
- ❌ Using `wc -l` counts in commit messages — link to the doc that has
  the number, don't bake counts into messages that age fast.

## Verification

```bash
./scripts/regen-all.sh      # 0 warnings
git status --short          # only your hand-edits left
git diff --stat             # only the snapshot docs you intended to touch
```

## Cross-references

- [`scripts/regen-all.sh`](../scripts/regen-all.sh) — auto-derived chain
- [`CONTRIBUTING_TO_GRAPH.md`](../CONTRIBUTING_TO_GRAPH.md) — graph-side workflows
- [`CONTRIBUTORS.md`](../CONTRIBUTORS.md) — pre-push checklist
- [`howto/run-a-swarm-wave.md`](run-a-swarm-wave.md) — wave-end CHANGELOG shape
