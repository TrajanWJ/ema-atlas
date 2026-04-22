# Shared Workspace Contract

## Why this exists

Agents on the agent VM need a single, architecture-owned place to collaborate.
Without that, context drifts into:
- random home-directory folders
- one-off temp files
- isolated repo subtrees
- session-local notes nobody else can find

This workspace reduces that drift.

## What belongs here

Belongs here:
- multi-agent planning artifacts
- handoff notes
- local shared schedules and agendas
- runtime breadcrumbs for active sessions
- task manifests that are useful across sessions
- coordination notes that have not yet been promoted to canon

Does not belong here permanently:
- final canonical intent/proposal/execution records
- hidden personal scratch that no one else needs
- compiled outputs or vendored dependencies
- secrets

## File conventions

Use markdown unless there is a strong reason not to.

Recommended filename shape:
- `YYYY-MM-DD-short-topic.md`
- `agent-id--topic.md`
- `task-id--topic.md`

Include at top when relevant:
- owner / actor
- created_at
- related intent / proposal / execution ids
- status

## Promotion rule

If a file becomes durable truth, copy or rewrite it into:
- EMA docs
- canonical graph entities
- runtime records
- repo-owned architecture notes

This workspace is for collaboration and orientation, not permanent ontology sprawl.
