# Cortex Context

## Vault Organisation

| Folder | Purpose |
|--------|---------|
| `Who Is Trajan/` | Identity and background |
| `Preferences & Tendencies/` | Personal defaults, style preferences |
| `Learnings & Gotchas/` | Cross-project footguns and hard-won lessons |
| `Contacts & People/` | Collaborators and stakeholders |
| `System Setup/` | Machine config, services, data flow docs |
| `Agent Context/Conventions/` | Coding standards, architecture, security, testing, git workflow (read-only) |
| `AI Knowledge/` | Tool evaluations, stack decisions, research notes, plugin docs |
| `Trajan's Projects/` | Active project notes |
| `Session Log/` | Session records; `Exports/` contains synced Claude Code sessions |
| `Goals/` | 3-year, yearly, monthly goals and weekly reviews |
| `Daily Notes/` | Daily journal entries |
| `Templates/` | Note templates (daily, project, weekly review) |
| `Archive/` | Deprecated content |

## Naming Conventions

- Session logs: `YYYY-MM-DD - Brief Title.md`
- Research notes: `Research - Topic Area YYYY.md`
- Gotchas: `YYYY-MM-DD - Brief Problem.md`
- Projects: `Project Name.md`
- System docs: `System Component.md`

## Active Projects

Trajan is building several projects: **place.org** (web app with animation/WebGPU focus), **EMA** (primary task/knowledge system — TypeScript/Electron monorepo), **Proslync**, **ExecuDeck**, **DispoHub**, **LetMeScale**, and others. The Claude Code ecosystem is heavily used, with many plugins evaluated under `AI Knowledge/Claude Code Plugins/`.

## Key References

- Coding conventions: `Agent Context/Conventions/`
- Stack decisions: `AI Knowledge/My Stack Decisions.md`
- Known footguns: `Learnings & Gotchas/`

## Notes for Claude

<!-- Customise this section with any standing instructions for Cortex sessions -->
- Use `[[wikilinks]]` for internal references
- Place tags at the bottom of notes
- Never delete notes — archive to `Archive/`
- Check for existing notes before creating duplicates
- EMA is the primary system; this vault is legacy/read-only for task management
