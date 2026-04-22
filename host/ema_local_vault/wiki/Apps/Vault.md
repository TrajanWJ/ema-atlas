---
title: "Vault (SecondBrain)"
space: wiki
tags: ["apps","vault","knowledge"]
source: manual
---

# Vault (SecondBrain)

Markdown-based knowledge store with SQLite index, semantic search, and knowledge graph.

## Storage

Files: `~/.local/share/ema/vault/`

| Space | Purpose |
|-------|---------|
| `wiki/` | Persistent reference (architecture, agents, tools, ops) |
| `projects/` | Project-specific docs, specs, roadmaps |
| `system/state/` | System state snapshots |
| `research-ingestion/` | Ingested research materials |
| `user-preferences/` | User configuration |
| `intents/` | Generated intent projections |
| `archive/` | Immutable historical records |
| `imports/` | Imported knowledge (host, agent-vm) |

## Features

- **Full-text search** — keyword, semantic (vector), hybrid modes
- **Knowledge graph** — note linking, backlinks, typed relationships
- **Orphan detection** — find unlinked notes
- **Note CRUD** — create, read, update, delete, move
- **Frontmatter** — id, title, space, tags, source_type, content_hash

## CLI

```bash
ema vault search "auth architecture"        # Search notes
ema vault tree                              # Directory tree
ema vault read wiki/Architecture/overview.md  # Read a note
ema vault write wiki/new-page.md -c "content" # Create/update note
echo "content" | ema vault write path.md --stdin  # Pipe content in
ema vault graph                             # Link graph stats
ema vault backlinks <id>                    # Backlinks for a note
ema vault imports                           # Import provenance log
ema vault stale                             # Intent projection file ages
```

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/vault/tree` | Directory tree |
| `GET /api/vault/note?path=X` | Read note |
| `PUT /api/vault/note` | Create/update note |
| `DELETE /api/vault/note?path=X` | Delete |
| `POST /api/vault/note/move` | Move note |
| `GET /api/vault/search?q=X` | Search (keyword/semantic/hybrid) |
| `GET /api/vault/graph` | Full link graph |
| `GET /api/vault/graph/neighbors/:id` | Connected notes |
| `GET /api/vault/graph/orphans` | Unlinked notes |

## Sync

OpenClaw vault syncs into EMA via reconcile loop:
- Source: `192.168.122.10` OpenClaw vault
- Target: EMA SecondBrain via `PUT /api/vault/note`
- Cadence: configurable via `OPENCLAW_VAULT_SYNC` env
- **Status: OpenClaw vault sync inactive (agent-vm offline)**

## Related

- [[Brain Dump]]
- [[EMA Architecture Overview]]
