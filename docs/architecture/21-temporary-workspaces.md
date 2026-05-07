# Temporary Workspaces

## Purpose

A temporary workspace is an EMA workspace made for a bounded topic, cleanup
effort, investigation, or conceptual pass that should not become a durable
project by default.

It exists when the user or agents need a focused room for a decision-heavy
operation such as GitHub cleanup, vendor review, repo migration, donor
comparison, or an architectural spike.

## Shape

Temporary workspaces use the existing EMA topology:

```text
Organization -> Temporary Workspaces space -> temporary project
```

They are intentionally normal projects with an explicit temporary naming
convention:

```text
tmp-<topic>-<yyyy-mm-dd>
```

The temporary flag is operational, not a new authority layer. The daemon still
owns truth through the same project, lane, queue, handoff, problem, and report
registries.

## Rules

- A temporary workspace must have one topic and a done-when.
- It may contain lanes, queue items, decisions, repo inventories, and handoffs.
- It must not become the canonical home for durable product work.
- It must end in one of three states: promoted, archived, or dropped.
- Destructive external actions discovered inside it require an explicit
  approval checkpoint before execution.

## Promotion

Promote a temporary workspace when the topic becomes durable. Promotion means:

1. Create or choose the durable EMA project.
2. Move or recreate the surviving lanes and queue items there.
3. Record a final agent report on the temporary lane.
4. Archive or close the temporary workspace.

## GitHub Cleanup Use Case

GitHub cleanup is a temporary workspace because the work is cross-repo,
decision-heavy, and partially destructive. The workspace should keep:

- repository inventory;
- proposed visibility changes;
- rename/delete/archive candidates;
- canonical successor repository decisions;
- exact commands to run after approval;
- evidence for each irreversible action.

No GitHub repo delete, rename, transfer, visibility change, or forced push
should happen from a temporary workspace without a user-approved matrix naming
the exact repositories and actions.
