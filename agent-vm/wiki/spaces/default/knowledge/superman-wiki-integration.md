---
title: "Superman ↔ Wiki Integration"
type: knowledge
created: 2026-04-04
updated: 2026-04-04
summary: "How Superman context system reads from the wiki as its knowledge source."
tags: [superman, wiki, integration, ema, context-injection]
---

# Superman ↔ Wiki Integration

## Overview

Superman (EMA's semantic intelligence layer) now reads its intent and context data directly from the wiki. Instead of parsing `.superman` files from project directories, the context_for() pipeline queries the wiki API for structured intent pages.

---

## How Superman Reads from Wiki

### Endpoint

```
GET http://localhost:8093/api/projects/:id/intents
```

Returns a Superman-compatible context block with the project's active intents:

```json
{
  "project_id": "EMA",
  "intents": [
    {
      "frontmatter": {
        "title": "Intent Title",
        "status": "active",
        "priority": "high",
        "project": "EMA",
        "intent_type": "feature"
      },
      "content": "...",
      "slug": "intent-title"
    }
  ],
  "bundle": null
}
```

### CLI Tool

```bash
# Get Superman context for a project
wiki-context.sh <project-name>

# Example
wiki-context.sh EMA
```

---

## .superman Files → Wiki Intent Pages

### Mapping

| `.superman` keyword | Wiki frontmatter field | Notes |
|---|---|---|
| `INTENT: <text>` | `title` + `intent_type: general` | One file per intent |
| `CONSTRAINT: <text>` | `intent_type: constraint` | Use `constraint` as intent_type |
| `CONTEXT: <text>` | Intent body `## Context` section | Background knowledge |
| `RELATIONSHIP: <text>` | Intent body `## Notes` section | Document cross-project deps |
| `PRIORITY: <key> = <val>` | `priority: high/medium/low` | Per-intent priority in frontmatter |
| `IDENTITY: <text>` | Project-level wiki page (not intent) | Lives in `projects/` space |

### Creating Intent Pages

```bash
# Create a new intent page
wiki-intent.sh "Intent Title" [project] [priority]

# Example: JWT auth migration intent for EMA project
wiki-intent.sh "Migrate to JWT auth" EMA high
# → Creates: /home/trajan/wiki/spaces/default/intents/migrate-to-jwt-auth.md
```

### Migration: Old `.superman` → Wiki Intents

For each entry in an existing `.superman` file:

1. Extract each `INTENT:` line → run `wiki-intent.sh "<intent text>" <project>`
2. Extract `CONSTRAINT:` lines → create intent pages with `intent_type: constraint`
3. Add `CONTEXT:` notes to the `## Context` section of the relevant intent page
4. Extract `RELATIONSHIP:` lines → add to `## Notes` in the project's main wiki page
5. Archive the old `.superman` file (keep for reference, don't delete)

```bash
# One-liner to list a .superman file's intents for manual migration
grep "^INTENT:" /path/to/project/.superman | sed 's/^INTENT: //'
```

---

## The context_for() Pipeline

```
wiki intent pages (intents/*.md)
    │
    ▼  (wiki-api indexes on file change)
wiki API: GET /api/projects/:id/intents
    │
    ▼  (inject-wiki-context.sh or Superman.context_for/2)
context block assembled:
  ## Wiki Context
  Project: <id>
  ### Active Intents
  - Intent Title [status] priority:high
    │
    ▼
prepended to agent dispatch task / spawned agent prompt
```

### For Agent Dispatch (Shell)

```bash
# inject-wiki-context.sh prepends wiki context to any task string
inject-wiki-context.sh <project> "<task description>"

# Example in agent dispatch:
ENRICHED_TASK=$(inject-wiki-context.sh EMA "Fix the auth redirect bug")
openclaw dispatch --task "$ENRICHED_TASK"
```

### For Agent Dispatch (Elixir/EMA)

```elixir
# Superman.context_for/2 now wraps the wiki API
def context_for(project_id, opts \\ []) do
  case wiki_api_intents(project_id) do
    {:ok, response} -> format_context_block(response)
    {:error, _}     -> load_superman_file_fallback(project_id)
  end
end

defp wiki_api_intents(project_id) do
  Req.get("http://localhost:8093/api/projects/#{project_id}/intents")
end
```

---

## Search

```bash
# Search wiki from CLI (full-text + BM25)
wiki-search.sh "query" [type] [limit]

# Examples
wiki-search.sh "auth migration"
wiki-search.sh "JWT" intent 5
wiki-search.sh "EMA roadmap" project
```

---

## Status Check

```bash
wiki-status.sh
# === Wiki Status ===
# ✅ Wiki API: online (localhost:8093)
# 📄 Pages indexed: 1313
# ✅ Web mirror: online (localhost:8090)
# ✅ wiki-api.service: active
```

---

## Design Notes

### Why Wiki Over .superman Files

- **Single source of truth** — intents live with all other knowledge, not scattered in project dirs
- **Structured frontmatter** — status, priority, project, intent_type are queryable fields
- **API-first** — wiki API is already running and indexed; no new infrastructure
- **Human-readable** — intent pages have full markdown bodies, not just one-liner keywords
- **Searchable** — full-text search across all intents via wiki-search.sh

### Fallback Behavior

If the wiki API is offline or returns no intents:
- `inject-wiki-context.sh` silently skips context injection and passes the task through unchanged
- EMA's `Superman.context_for/2` should fall back to parsing `.superman` files from project dirs

### Intent Page Location

All intent pages: `/home/trajan/wiki/spaces/default/intents/*.md`

The wiki API auto-indexes them. No manual registration required.

---

## Related

- [[Superman Architecture]] — full EMA semantic intelligence layer design
- [[Superman Runtime Architecture]] — .superman file parser + KnowledgeGraph design
- Wiki API source: `/home/trajan/wiki/` (Quartz + custom API layer)
