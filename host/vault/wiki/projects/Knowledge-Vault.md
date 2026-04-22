---
title: "Knowledge Vault"
type: reference
created: 2026-04-06
tags: [project, obsidian, knowledge-management, pkm, qmd]
summary: "Obsidian-based knowledge management system with 2,605+ notes and QMD indexing"
---

# Knowledge Vault

Obsidian-based knowledge management system serving as the central knowledge repository across all projects. Large-scale vault with automated indexing, embedding, and graph visualization.

## Status

- Active, continuously growing
- Apr 5 audit: 2,605+ notes, 7,156 wikilinks, 1,497 broken links, 1,901 orphans

## Location

`~/vault/`

## Tech Stack / Tooling

- **Editor**: Obsidian
- **Indexing**: QMD (indexing + embedding)
- **Format**: Markdown with YAML frontmatter
- **Linking**: `[[wikilinks]]` for cross-references

## Key Features

- **2,605+ notes** across projects, research, daily notes, and references
- **7,156 wikilinks** forming a dense knowledge graph
- **QMD indexing/embedding** for semantic search and BM25 retrieval
- **Frontmatter enforcement** for consistent metadata
- **Auto-linking** for reducing orphan notes
- **Graph visualization** for exploring knowledge topology

## Health Metrics (Apr 5, 2026)

| Metric | Count |
|--------|-------|
| Notes | 2,605+ |
| Wikilinks | 7,156 |
| Broken links | 1,497 |
| Orphan notes | 1,901 |

## Architecture Decisions

- Obsidian chosen for local-first markdown with plugin ecosystem
- QMD provides CLI-based indexing without requiring Obsidian to be running
- Frontmatter-first approach enables programmatic note processing
- Wikilinks over standard markdown links for Obsidian graph integration

## Related

- [[EMA]] — life OS that reads from and writes to the vault
- [[Agent-OS-Demo]] — Graph view visualizes vault knowledge
- [[Dispatch-System]] — dispatch tasks reference vault notes for context
