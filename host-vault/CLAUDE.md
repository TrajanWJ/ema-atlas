# Vault Operations Guide

> This file loads when Claude Code runs from the vault directory.
> For coding conventions, see `~/.claude/CLAUDE.md` (loaded globally).

## Vault Structure

```
twj1/
├── Who Is Trajan/         ← Identity, background
├── Preferences & Tendencies/ ← Global defaults, style
├── Learnings & Gotchas/   ← Cross-project footguns (USE THIS)
├── Contacts & People/     ← Collaborators, stakeholders
├── System Setup/          ← Machine, services, config docs
├── Agent Context/         ← Conventions only (5 files, read-only)
├── AI Knowledge/          ← Tool evaluations, stack decisions, research
├── Trajan's Projects/     ← Active project notes
├── Session Log/           ← Session records
├── Templates/             ← Note templates
├── Archive/               ← Moved/deprecated content
```

## Autonomy by Zone

| Zone | You Can |
|------|---------|
| Session Log/, Trajan's Projects/, Learnings & Gotchas/, Contacts & People/ | Create and update freely |
| AI Knowledge/, System Setup/, Preferences & Tendencies/ | Create and update freely |
| Agent Context/Conventions/ | **Read only** — ask before modifying |
| Top-level structure | Create when 3+ notes justify it |

## Note Types & Naming

| Type | Location | Naming |
|------|----------|--------|
| Session logs | `Session Log/` | `YYYY-MM-DD - Brief Title.md` |
| Project notes | `Trajan's Projects/` | `Project Name.md` |
| Tool evaluations | `AI Knowledge/` | `Tool Name.md` |
| People | `Contacts & People/` | `Person Name.md` |
| Gotchas | `Learnings & Gotchas/` | `YYYY-MM-DD - Brief Problem.md` |

## Format Rules

- `[[wikilinks]]` for internal references
- Tags at bottom: `#tag1 #tag2`
- Pipe tables, no HTML
- Source claims with links
- Never delete — archive to `Archive/` subfolder
- Check for existing notes before creating
