---
title: "System Vault Structure"
type: reference
created: 2026-03-15
updated: 2026-04-16
confidence: high
source: direct observation of ~/vault/
summary: "Complete map of Obsidian vault organization — directories, purposes, autonomy zones, and design principles"
tags: [system, structure, vault, obsidian, meta]
---

# System Vault Structure

> How the Obsidian vault is organized and the purpose of each section.
> Last verified: 2026-04-16
> Vault path: `~/vault/` (3,090 markdown files, 1.5 GB)

---

## Top-Level Sections

```
~/vault/
├── CLAUDE.md                          ← Vault-specific Claude instructions
├── Welcome.md / Wiki.md / index.md    ← Vault index and navigation
│
├── Trajan/                ← Identity, preferences, personal context
├── Daily Notes/           ← Daily logs and journaling
├── Inbox/                 ← Capture inbox (GTD-style)
│
├── System/                ← THIS SECTION: meta-documentation (100+ files)
├── Agents/                ← Agent definitions and configs
├── Agent Knowledge/       ← Research library for agent capabilities
├── Agent-Learnings/       ← Learned patterns from agent usage
│
├── Projects/              ← Active project state
├── Operations/            ← Ops runbooks and workflows
├── Ops/                   ← Operational notes
├── Architecture/          ← System design and ADRs
├── Decisions/             ← Decision records
│
├── Research/              ← Research notes
├── Reference/             ← Reference documentation
├── Resources/             ← External resources
├── Tools/                 ← Tool evaluations and configs
├── Skills/                ← Skill library
├── Security/              ← Security notes
│
├── Claude-Code-Bot/       ← Claude Code bot context
├── Claude-Code-Memory/    ← Per-project auto-memory files
├── Claude-Code-Sessions/  ← Session logs
├── Session Summaries/     ← Summarized session records
│
├── EMA/                   ← Exponential moving average analytics
├── Learnings & Gotchas/   ← Failure patterns and lessons learned
├── Codebases/             ← Codebase documentation
├── Courses/               ← Learning notes
├── LCM Summaries/         ← LCM output summaries
├── Media/                 ← Media references
├── Reports/               ← Generated reports
├── Templates/             ← Note templates
│
├── .archive/              ← Git-level archive of old content
├── _deprecated/           ← Archived stale content
├── _hubs/                 ← Hub/MOC files
└── ontology/              ← Vocabulary and taxonomy
```

## Section Purposes

### Trajan/
**Identity context.** Background, expertise, values, current focus. Helps Claude calibrate responses. Curated by Trajan.

### System/
**Meta-documentation.** How the whole system is wired — machine, Claude Code config, Obsidian, services, data flow, agent orchestration. Read this when troubleshooting or onboarding. Largest section at 100+ files.

### Agents/ + Agent Knowledge/ + Agent-Learnings/
**Agent ecosystem.** Agent definitions, capability matrices, dispatch patterns, learned behaviors. Claude reads these to understand available subagents and their capabilities.

### Projects/
**Project state.** One note per active project with architecture, phase progress, decisions, and gotchas. Read at session start, updated as work progresses.

### Claude-Code-Sessions/ + Session Summaries/
**Session memory.** Session logs and summaries. QMD indexes these for cross-session recall.

### Claude-Code-Memory/
**Per-project auto-memory.** MEMORY.md index files for each project, written by Claude's auto-memory system.

### Operations/ + Ops/
**Runbooks and workflows.** Process documentation, cron jobs, operational procedures.

### Architecture/ + Decisions/
**Design records.** ADRs, system design notes, decision rationale.

### Research/ + Reference/ + Resources/ + Tools/
**Knowledge library.** Research notes, tool evaluations, external references. QMD indexes these for retrieval. See [[System QMD Search]] for search patterns.

### Daily Notes/ + Inbox/
**Capture and journaling.** Daily logs (GTD daily notes), inbox for unsorted captures. Inbox is processed using GTD principles — items are clarified, organized, and moved to their proper home. See [[System Daily Notes]] for the daily note template and workflow.

### EMA/
**Analytics and trends.** Exponential moving average calculations for tracking goal progress, productivity metrics, and habit streaks over time.

### Learnings & Gotchas/
**Failure library.** Captured when something breaks or an approach fails. Each note records what happened, why, and how to avoid it next time. Claude writes here automatically when the failure protocol fires.

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

## How to Navigate This Vault

**Starting a session:** Read [[Welcome]] for the vault index. Call `ori_orient` to get a session briefing with daily context, active goals, and reminders.

**Finding notes:** Use `qmd search "topic"` or `~/bin/antfly-search.sh "topic"` for full-text search. QMD re-indexes every 30 minutes and after every vault write via the `vault-post-write.sh` hook.

**Understanding a section:** Each top-level directory typically has a hub note in `_hubs/` (e.g., `_hubs/System Hub.md`) or a README-style note at the top of the section. Start there.

**Cross-referencing:** Notes use `[[wikilinks]]` for internal references. Obsidian's graph view visualizes these connections. The [[ontology]] directory defines shared vocabulary and taxonomies.

**Session context:** Recent session logs live in `Claude-Code-Sessions/`. Summaries in `Session Summaries/`. Use [[System Session Management]] for the full session lifecycle.

## Instruction Architecture

| Layer | File | When Loaded |
|-------|------|-------------|
| **Global** | `~/.claude/CLAUDE.md` | Every session, every project |
| **Rules** | `~/.claude/rules/*.md` | Every session (no-rm, research, vault-ops, etc.) |
| **Per-project** | `~/.claude/projects/{project}/CLAUDE.md` | When working in that project dir |
| **Vault** | `~/vault/CLAUDE.md` | When working inside the vault |

**Plus enforcement:** Ori + Letta hook system (SessionStart, UserPromptSubmit, PostToolUse, Stop) enforces patterns at runtime. vault-post-write.sh runs qmd update after every Write to vault. See [[System Claude Code]] for full hook inventory.

#system #structure #vault
