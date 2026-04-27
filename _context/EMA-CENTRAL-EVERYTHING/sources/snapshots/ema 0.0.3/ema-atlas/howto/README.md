# How-To Playbooks

Recipes for the most common changes a contributor (human or agent) will make
to this transfer pack and to EMA itself. Each playbook is **self-contained**
— you should be able to read one file, do the work, and have the graph still
pass `scripts/check-graph.sh`.

| Playbook | When to use it |
|---|---|
| [`add-a-branch.md`](add-a-branch.md) | You're adding a new lineage/codebase/docs branch to the transfer pack |
| [`add-a-driver.md`](add-a-driver.md) | You're adding a new harness driver (claude-cli, codex-cli, peer-remote, ...) to EMA |
| [`add-a-vapp.md`](add-a-vapp.md) | You're proposing a new vApp inside the EMA shell (Wiki, Chat, Threads, ...) |
| [`run-a-swarm-wave.md`](run-a-swarm-wave.md) | You're orchestrating or joining active multi-agent work and need the shared coordination contract |
| [`add-an-edge-topic.md`](add-an-edge-topic.md) | You're introducing a cross-cutting concept that doesn't fit any existing `graph/edges/*.md` |
| [`resolve-an-open-question.md`](resolve-an-open-question.md) | You're closing one of the entries in `OPEN_QUESTIONS.md` |
| [`load-context-for-a-task.md`](load-context-for-a-task.md) | You're a fresh agent and need to load just enough context to act on a task |
| [`extract-doctrine-from-a-legacy-branch.md`](extract-doctrine-from-a-legacy-branch.md) | You want to mine an OpenClaw/place.org/ClaudeForge branch for patterns without re-importing code |

> **Rule of thumb:** if you can't find a playbook that matches your task,
> first check whether one of these covers a superset, then write a new
> playbook *before* doing the work.

## Conventions

- Every playbook ends with a **verification block** (commands you run, what
  you expect to see).
- Every playbook ends with a **commit-message template**.
- Every playbook references the relevant entries in
  [`GLOSSARY.md`](../GLOSSARY.md) and [`OPEN_QUESTIONS.md`](../OPEN_QUESTIONS.md)
  so terminology stays consistent and unresolved-decision dependencies are
  visible.
