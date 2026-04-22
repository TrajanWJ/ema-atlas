---
title: Wiki Navigation Guide
created: '2026-04-01'
type: knowledge
status: active
tags:
  - wiki
  - navigation
  - agents
  - system
summary: How agents navigate and use the wiki. Replaces old Obsidian workflows.
wiki_id: system/Wiki-Navigation
imported_from: vault/System/Wiki-Navigation.md
imported_at: '2026-04-04T00:23:57.272Z'
---

# Wiki Navigation Guide

## For Agents

The knowledge vault is a Quartz-powered static wiki served at `http://192.168.122.10:8090/`.

### Finding Content

| Method | Command | Best For |
|---|---|---|
| Semantic search | `qmd search "query"` | Finding related content by meaning |
| Structured query | `~/bin/wiki-query.sh type=research tags=multi-agent` | Filtering by frontmatter |
| Full-text | `grep -r "term" ~/vault/ --include='*.md'` | Exact text matches |
| Browse | `ls ~/vault/{Namespace}/` | Exploring a category |
| Recent | `find ~/vault -name '*.md' -mtime -7 -type f` | Recently changed files |

### Writing Content

1. Create markdown files in the appropriate namespace under `~/vault/`
2. Always include frontmatter: `type`, `tags`, `summary`, `created`
3. Use `[[wikilinks]]` to connect pages
4. After writing: `qmd update && qmd embed` to refresh search index
5. Rebuild wiki: `~/bin/wiki-rebuild.sh` (auto-runs on deploy)

### Namespace Map

| Directory | Purpose |
|---|---|
| `Agents/` | Agent configs, rosters, learnings |
| `Architecture/` | System design, ADRs, patterns |
| `Codebases/` | Codebase documentation |
| `Courses/` | Interactive codebase courses (HTML) |
| `Daily Notes/` | Auto-generated daily logs |
| `Decisions/` | Decision records |
| `Media/` | Media analysis notes |
| `Operations/` | Runbooks, SOPs |
| `Projects/` | Project tracking |
| `Reference/` | External resources, bookmarks |
| `Research/` | Deep dives, analyses |
| `Resources/` | Curated resource lists |
| `Security/` | Security audits, hardening |
| `Skills/` | Agent skill documentation |
| `System/` | Operational docs |
| `Templates/` | Reusable page templates |
| `Tools/` | Tool documentation |
| `Trajan/` | Personal preferences, decisions |

### Serving

- **Wiki (markdown):** http://192.168.122.10:8090/ (Quartz, port 8090)
- **Courses (HTML):** http://192.168.122.10:8091/ (Python HTTP, port 8091)
- Rebuild: `~/bin/wiki-rebuild.sh`
- Sync courses: `~/bin/sync-courses.sh`
