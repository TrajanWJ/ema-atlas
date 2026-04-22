---
type: research
wiki_id: research/AI-Knowledge/Claude_Code_Plugins/sync-claude-sessions
imported_from: vault/Research/AI-Knowledge/Claude Code Plugins/sync-claude-sessions.md
imported_at: '2026-04-04T00:23:56.975Z'
tags: []
summary: ''
---
# sync-claude-sessions

> Export Claude Code JSONL sessions to clean, searchable markdown files.

## Quick Info

| Field | Value |
|---|---|
| **Part of** | [ArtemXTech/personal-os-skills](https://github.com/ArtemXTech/personal-os-skills) (219 stars) |
| **Standalone** | [wbelk/claude-qmd-sessions](https://github.com/wbelk/claude-qmd-sessions) (23 stars) |
| **License** | MIT (personal-os-skills), unspecified (qmd-sessions) |

## What It Does

Reads JSONL session transcripts from `~/.claude/projects/` and converts them to clean markdown:

- **Extracts** user messages and assistant text responses
- **Filters out** tool_use, tool_result, and thinking blocks
- **Adds frontmatter:** title, date, tags
- **Output format:** `{project}/{date}-{slug}-{id}.md`

## personal-os-skills Bundle

The ArtemXTech marketplace includes 6 skills total:

| Skill | Purpose |
|---|---|
| **Sync-Claude-Sessions** | Export conversations to Obsidian markdown with auto-sync hooks |
| **Recall** | Retrieve prior context via temporal/topic searching + graph visualization |
| **Granola** | Sync meeting notes to Obsidian (local caching, no API needed) |
| **Wispr Flow** | Voice dictation processing — stats, search, export, dashboard |
| **TaskNotes** | Obsidian task management via API |
| **NotebookLM** | Import notebooks as interconnected knowledge graphs |

## Hooks Integration

Auto-triggers via Claude Code hooks:

| Hook | Action |
|---|---|
| `PreCompact` / `SessionEnd` | Convert session + run `qmd update && qmd embed` |
| `SessionStart` | Convert session, output CLAUDE.md files + recent turns for context restoration |

Uses `pgrep -f "qmd.*embed"` to prevent concurrent embedding processes.

## Install

**Marketplace (personal-os-skills):**
```
/plugin marketplace add ArtemXTech/personal-os-skills
```

**Standalone (qmd-sessions):**
```bash
cp -r . ~/.claude/skills/qmd-sessions/
```
Then run `/qmd-sessions` for interactive setup wizard.

## qmd-sessions Details

The standalone version walks through configuring:
1. Output directory
2. Conversion settings
3. QMD collection
4. Embeddings
5. MCP server
6. Hooks
7. CLAUDE.md guidance

**Context restoration:** loads markdown files + recent turns on session startup, capped at ~50 exchanges (100 turns, 14,000 character limit).

**Refresh command:** `/qmd-sessions refresh` — manually load CLAUDE.md files and recent turns.

## Gotchas

- Requires **Bun**, **Node ≥22**, and **qmd ≥1.0.0** (standalone version)
- Embed operations skip if another session's embed is already running (checked via `pgrep`)
- Context restoration capped at 14,000 characters to prevent token overflow
- Only processes sessions from `~/.claude/projects/`; doesn't include subagent sessions

## Obsidian Integration

Point the output directory at your Obsidian vault folder. Sessions become vault notes — searchable both in Obsidian and via [[QMD]].

## The /recall Skill

Three modes for retrieving past context:

| Mode | Purpose |
|---|---|
| **Temporal** | Scan by date ("what did I work on Tuesday?") |
| **Topic** | BM25 search across QMD collections |
| **Graph** | Interactive visualization of sessions and related files |

## See Also

- [[QMD]] — search engine companion
- [[claude-mem]] — alternative persistent memory
- [[Obsidian-Claude Connectivity]] — central integration reference

#claude-code #sessions #memory #export
