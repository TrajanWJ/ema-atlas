# Playbook — load context for a task

Use this when you're a fresh agent and you need to read **just enough** to
act on a specific task without burning your context window on the whole
transfer pack.

## Step 0 — always-loaded set (≤30k tokens)

These you read every time, no exceptions:

- [`README.md`](../README.md)
- [`MACBOOK_AGENT_HANDOFF_MASTER.md`](../MACBOOK_AGENT_HANDOFF_MASTER.md)
- [`SYSTEM_GRAPH.md`](../SYSTEM_GRAPH.md)
- [`GLOSSARY.md`](../GLOSSARY.md)
- [`OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md) — only the Status lines if you're short on tokens

## Step 1 — classify the task

Look at the work and pick **one** primary topic. If your task spans two,
pick the one whose decisions are upstream of the other (e.g. identity is
upstream of collaboration; authority is upstream of execution).

| If the task is about… | Topic | Edge file |
|---|---|---|
| schema, control plane, audit, replay | authority | `graph/edges/authority.md` |
| Hermes, drivers, dispatch, runtimes | execution | `graph/edges/execution.md` |
| UI shell, vApps, native/web | surfaces | `graph/edges/surfaces.md` |
| plans/handoffs/notes/exports | workspace | `graph/edges/workspace.md` |
| docs/wiki/canvas/threads | collab | `graph/edges/collab.md` |
| org/space/project/membership | identity | `graph/edges/identity.md` |
| multi-agent, roles, watchdog | orchestration | `graph/edges/orchestration.md` |
| second-brain, vault, ingest | memory | `graph/edges/memory.md` |
| P2P, mesh, placement | transport | `graph/edges/transport.md` |
| Launchpad/HQ/desktop | ux-metaphor | `graph/edges/ux-metaphor.md` |
| historical fixtures only | recovery | `graph/edges/recovery.md` |

Read the edge file. It points at the **primary** and **secondary** nodes.

## Step 2 — load only the primary nodes

For each primary node listed in the edge:

1. `cat graph/nodes/<branch>.qmd` (free; ~20-50 lines)
2. From its `key_artifacts:`, pull only the paths you need:
   ```bash
   git show origin/<branch>:<path>
   ```
3. **Do not check out the branch.** Don't `git checkout`. Don't clone the
   underlying repo. The node + key_artifacts are designed to be enough.

## Step 3 — check unresolved decisions

Grep `OPEN_QUESTIONS.md` for any open question whose Blast radius mentions
your topic. If there is one, your work either:
- (a) presupposes a particular resolution (document the assumption in a
  docstring or commit message), or
- (b) is gated on the question being resolved first
  (use [`resolve-an-open-question.md`](resolve-an-open-question.md) before
  proceeding).

## Step 4 — only widen if blocked

You should rarely need to load secondary nodes. Widen only when:
- the primary node's key_artifacts don't actually answer your question
- the edge file's "Open" section flags a sub-topic you need

If you do widen, **update the node** so the next agent gets the new
information for free:
```bash
# add the path you wish had been there
$EDITOR graph/nodes/<branch>.qmd   # add to key_artifacts
```

## Anti-patterns

- ❌ "Let me check out every codebase- branch and grep around."
- ❌ Reading all five `0X-*.md` handoff docs every time. Read
  `MACBOOK_AGENT_HANDOFF_MASTER.md` (it summarizes them) and widen on demand.
- ❌ Treating the latest enrichment commit as canon. The canonical EMA
  repo is `TrajanWJ/ema`; this transfer pack is a *map of* it.

## Verification

You're done loading when you can answer all of these without re-reading:
1. What state plane does my change affect? (control / runtime / collab / workspace)
2. Which open question, if any, am I assuming a resolution to?
3. Which other branch's contract does my change have to match?
4. Where does the change land — in the canonical EMA repo, in this transfer
   pack, or both?

## Cross-references

- [`AGENT_TRAVERSAL.md`](../AGENT_TRAVERSAL.md) — the full traversal protocol
- [`AGENT_BOOTSTRAP.md`](../AGENT_BOOTSTRAP.md) — if your machine isn't set up yet
