# System Vault Structure

> How the Obsidian vault is organized and the purpose of each section.
> Last verified: 2026-03-13

---

## Top-Level Sections

```
twj1/
├── CLAUDE.md                          ← Instructions for Claude when vault is cwd
├── Welcome.md                         ← Vault index (links to all sections)
│
├── Who Is Trajan/         (1 file)    ← Identity, background, how Trajan thinks
├── Preferences & Tendencies/ (1 file) ← Global defaults, code & comms style
├── Learnings & Gotchas/   (1 file)    ← Cross-project lessons and footguns
├── Contacts & People/     (2 files)   ← Collaborators, stakeholders, working styles
│
├── System Setup/          (7 files)   ← THIS SECTION: meta-documentation
├── Agent Context/         (32 files)  ← Behavioral context Claude reads
│   ├── Conventions/       (5 files)
│   ├── Prompts/           (19 files)  ← Analysis/ Code/ Meta/ Project/
│   └── Roles/             (6 files)
├── AI Knowledge/          (24 files)  ← Research library
│   ├── Architecture Blueprints/ (3)
│   ├── Claude Code Plugins/     (10)
│   ├── Directories & Resources/ (1)
│   ├── Obsidian Integration/    (6)
│   └── (top-level)              (4)
├── Trajan's Projects/     (2 files)   ← Active project state
├── Session Log/           (6 files)   ← Session records (1 log + 4 templates + 1 index)
├── Workflows/             (7 files)   ← Process checklists
│
├── .claude/agents/        (16 agents) ← Dispatchable subagents (symlinked to ~/.claude/agents/)
├── .claude/commands/      (7 commands)← Slash commands (checkpoint, orchestrate, etc.)
├── .claude/skills/        (34 skills) ← kepano + custom skills (optimize-vault, etc.)
└── .obsidian/plugins/     (2 plugins) ← Claudian, claude-code-mcp
```

## Section Purposes

### Who Is Trajan/ (1 file)
**Identity context.** Background, expertise, values, current focus — the "brief the agent" section. Helps Claude calibrate responses to who it's working with. Curated by Trajan; Claude updates when user reveals new context.

### Preferences & Tendencies/ (1 file)
**Global defaults.** Communication style, code preferences, tool choices, anti-patterns. Changes more often than identity, less often than project notes. Claude updates when user corrects its approach.

### Learnings & Gotchas/ (1 file)
**Cross-project lessons.** Hard-won knowledge that isn't tied to a single project — platform quirks, library footguns, config traps. Claude writes here immediately after fixing non-trivial bugs (Failure Protocol in global CLAUDE.md). Grows every time something bites.

### Contacts & People/ (2 files)
**Stakeholder context.** People who come up in work — roles, working styles, what Claude needs to know. Created immediately when a person is mentioned with context. Prevents re-explaining collaborators each session.

### System Setup/ (7 files)
**Meta-documentation.** How the whole system is wired — machine, Claude Code config, Obsidian, services, data flow. Read this when troubleshooting or onboarding.

### Agent Context/ (32 files)
**Claude's behavioral guide.** Conventions (5 files — coding standards, testing, security), reusable prompts (19 files across Analysis, Code, Project, Meta), and agent role definitions (6 roles). Plus 2 index files (MOC + Prompt Library Sources). Claude reads these to maintain consistent behavior across sessions. Curated by Trajan — Claude reads but doesn't modify without asking.

### AI Knowledge/ (24 files)
**Research library.** Tool evaluations (10 plugin notes), stack decisions, installation playbook, architecture blueprints (3), Obsidian integration docs (6). This is the "what tools exist and which ones I chose" section. Grows when new tools are evaluated.

### Trajan's Projects/ (2 files)
**Project state.** One note per active project with architecture, phase progress, decisions, and gotchas. Claude reads at session start and updates at session end. Grows when new projects are started.

### Session Log/ (6 files)
**Session memory.** Contains 1 actual session log (`2026-03-11 - Vault Integration Setup.md`), 4 templates (Session Summary, Decision Record, Discovery Log, Progress Update), and 1 index. Claude writes here after each session. QMD indexes these so future sessions can search past work. Grows every session.

### Workflows/ (7 files)
**Process checklists.** 6 workflow files (Daily Development, Goal Cascade, Knowledge Growth, New Project Setup, Research to Implementation, Session Memory) plus 1 MOC index. Will be refined as patterns emerge from actual usage.

## Design Principles

1. **Separate what Claude knows from what Claude does** — Agent Context (behavior) vs Workflows (actions)
2. **Separate research from state** — AI Knowledge (tools evaluated) vs Trajan's Projects (current work)
3. **Separate human-curated from AI-written** — Conventions are curated; Session Log is auto-generated
4. **Everything is searchable** — QMD indexes the entire vault every 30 minutes
5. **Claude writes to disk** — No Obsidian dependency; direct filesystem always works
6. **Structure is extensible** — New top-level sections emerge when 3+ related notes don't fit existing categories
7. **Archive, never delete** — Stale content moves to `Archive/` subfolders

## Self-Evolving Structure

This vault is not static. Claude actively manages it:

### Autonomy by Zone

| Zone | Claude's Autonomy |
|---|---|
| `Session Log/` | **Full** — create freely, no approval needed |
| `Trajan's Projects/` | **Full** — create and update project notes |
| `Learnings & Gotchas/` | **Full** — create immediately when failure protocol fires |
| `Contacts & People/` | **Full** — create when person mentioned with context |
| `AI Knowledge/` | **High** — create research notes, update tool notes |
| `System Setup/` | **High** — update immediately when system changes |
| `Preferences & Tendencies/` | **High** — update when user corrects approach |
| `Who Is Trajan/` | **Moderate** — update when user reveals new context |
| `Workflows/` | **Moderate** — update existing, propose new |
| `Agent Context/Prompts/`, `Roles/` | **Moderate** — create new, update existing |
| `Agent Context/Conventions/` | **Low** — read only, ask before modifying |
| Top-level structure | **Propose** — create when 3+ related notes don't fit |

### Schema Evolution

Notes don't need rigid schemas. When 3+ notes share the same structure, that signals a new template should be created. New note types and their homes are tracked in `Welcome.md`.

### Consolidation (Future)

| Frequency | Operation |
|---|---|
| Per-session | Capture learnings, update project notes |
| Weekly | Cross-reference, detect patterns |
| Monthly | Archive stale content, synthesize recurring themes |

See [[Research - Self-Evolving Vault Patterns]] for the full research behind this design.

## Three-Layer Instruction Architecture

| Layer | File | Lines | When Loaded |
|-------|------|-------|-------------|
| **Global** | `~/.claude/CLAUDE.md` | ~80 | Every session, every project |
| **Per-project** | `~/.claude/projects/{project}/CLAUDE.md` | ~17 | When working in that project dir |
| **Vault** | `vault/CLAUDE.md` | ~55 | When working inside the vault |

**Plus enforcement:** A Stop hook (`check-session-log.sh`) fires at session end and warns if no session log was written today.

The global CLAUDE.md inlines key coding conventions and references Agent Context for depth. Per-project stubs (deployed to 17 projects) ensure vault awareness even when Claude works outside the vault. The vault CLAUDE.md covers vault-specific operations only (autonomy zones, note types, format rules).

Previous architecture (260-line global CLAUDE.md, no hooks, no per-project stubs) was not followed by agents.

#system #structure #vault
