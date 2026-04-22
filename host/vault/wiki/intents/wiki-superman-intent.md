---
title: "Wiki ↔ Superman Integration Intent"
type: intent
status: active
priority: high
project: Wiki
created: 2026-04-04
updated: 2026-04-04
summary: "Wiki intent pages become Superman's context source. Agent dispatch reads wiki intents. On completion, wiki intent auto-updates."
tags: [wiki, superman, intent, context, agents]
intent_type: integration
---

# Wiki ↔ Superman Integration Intent

## Goal
Superman.context_for(project_id) queries the wiki instead of filesystem .superman files. Intent pages in wiki ARE the superman context.

## Current State
Superman reads .superman files from vault. VaultWatcher detects changes, parser builds graph, context_for() assembles block.

## Target State
- Intent pages (type:intent) in wiki ARE the .superman context
- `GET /api/projects/:id/intents` returns Superman context block (already implemented)
- At agent dispatch: OpenClaw injects wiki context automatically
- On execution complete: agent writes result → wiki suggests intent status update

## The Context Block Format

```
# Wiki Context: {project}
## Active Intents
- [[intent-title]] (priority: high, status: in-progress)
## Constraints
{from CONSTRAINT fields on intent pages}
## Recent Decisions
{type:decision pages for this project}
## Related Research
{type:research pages tagged with project}
```

## Status
- [x] `/api/projects/:id/intents` endpoint built
- [ ] OpenClaw dispatch hook reads from wiki
- [ ] Intent status update on execution complete
- [ ] Superman.context_for() points to wiki API
