---
title: "Brain Dump"
space: wiki
tags: ["apps","brain-dump","inbox"]
source: manual
---

# Brain Dump

Capture-first inbox for thoughts, ideas, and observations. Lowest friction path to get something into EMA.

## Flow

```
Thought → Brain Dump Item → (processing) → Intent Cluster → Proposal Seed → Proposal
```

1. **Capture** — `ema dump "thought"` or `POST /api/brain-dump/items`
2. **Embed** — Async vector embedding with retryable status
3. **Cluster** — Assign to intent cluster via semantic similarity
4. **Score** — Recompute cluster readiness when membership changes
5. **Surface** — Promote ready clusters to proposal queue

## CLI

```bash
ema dump "investigate auth token expiry"       # Quick capture (shortcut)
ema brain-dump list                             # View inbox
ema brain-dump list --project ema               # Filter by project
ema brain-dump unprocessed                      # Unprocessed items only
ema brain-dump create "longer thought"          # Create with options
ema brain-dump process <id>                     # Mark processed (default: archive)
ema brain-dump process <id> --action promote    # Process with specific action
ema brain-dump delete <id>                      # Remove
```

The `ema dump` shortcut accepts `--project`, `--space`, `--actor`, and `--task` options for quick association.

## API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/brain-dump/items` | GET | List all items |
| `/api/brain-dump/items` | POST | Create item (content, source) |
| `/api/brain-dump/items/:id/process` | PATCH | Mark processed |
| `/api/brain-dump/items/:id` | DELETE | Delete |

## MCP

No dedicated `ema_brain_dump` MCP tool exists yet (planned). Brain dump items can be created indirectly via the `create_task` tool or the REST API.

## Related

- [[Proposal Pipeline]]
- [[Vault]]
