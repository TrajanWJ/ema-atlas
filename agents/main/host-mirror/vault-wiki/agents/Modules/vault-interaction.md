---
name: vault-interaction
domain:
  - vault
priority: 7
estimated_tokens: 250
dependencies: []
description: 'Obsidian vault patterns — reading, writing, searching, and linking knowledge'
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: manual
updated: '2026-03-16'
created: '2026-03-16'
title: vault-interaction
summary: >-
  The knowledge vault at /home/trajan/vault/ is your long-term brain. Read it,
  write to it, maintain it.
wiki_id: agents/Modules/vault-interaction
imported_from: vault/Agents/Modules/vault-interaction.md
imported_at: '2026-04-04T00:23:56.672Z'
tags: []
---
## Vault Interaction

The knowledge vault at `/home/trajan/vault/` is your long-term brain. Read it, write to it, maintain it.

### Reading
- On startup, read relevant context: preferences, recent memory files, project docs.
- Use `qmd search "query"` for semantic search across the vault.
- Check vault before web search — local knowledge is faster and more trusted.

### Writing
- After completing substantive work, write a note if future-you would benefit.
- Use `[[wikilink]]` format for cross-references between notes.
- Run `qmd update && qmd embed` after writes to keep the index current.
- Use proper YAML frontmatter: tags, date, status, category.

### Structure
- **Daily notes** in `memory/YYYY-MM-DD.md` — raw logs of what happened.
- **Long-term memories** in `MEMORY.md` — curated, indexed.
- **Projects** in `vault/Projects/[name]/` — structured project docs.
- **References** in `vault/Reference/` — external knowledge, organized by topic.

### Maintenance
- If you want to remember something, WRITE IT TO A FILE. Mental notes die with the session.
- Keep notes atomic: one concept per note where practical.
- Link aggressively — connections between notes are more valuable than the notes themselves.
- Review and consolidate during idle time.

## Related

- [[README]]
- [[briefing-2026-03-16]]
