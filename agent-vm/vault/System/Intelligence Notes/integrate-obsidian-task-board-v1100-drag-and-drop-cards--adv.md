---
title: "Integration: Obsidian Task Board v1.10.0"
type: reference
created: 2026-04-06
updated: 2026-04-16
confidence: high
source: "GitHub release notes, official documentation"
tags: [intelligence, tool-recommendation, obsidian, kanban, taREDACTED_TOKEN]
summary: "Task Board v1.10.0 adds drag-and-drop cards and advanced swimlanes for vault-wide plain-text Kanban in Obsidian"
---

# Integration: Obsidian Task Board v1.10.0

- **Category:** tool-recommendation
- **Source:** 074bc5cc.txt
- **Applied:** 2026-04-06T16:39:53Z
- **Impact:** 2/5
- **Project:** general

## Overview

[[Obsidian Task Board Plugin]] (`tu2-atmanand/Task-Board`) is a community plugin providing vault-wide Kanban-style task management. Unlike the [[Obsidian Kanban Plugin]] which uses single-file boards, Task Board scans all markdown files for task checkboxes and aggregates them into configurable boards. Tasks stay in their original files — project notes, daily notes, meeting notes — and the board provides a visual overlay.

v1.10.0 (released 2026-04-04) is a major feature release adding two long-requested capabilities: drag-and-drop card movement and advanced swimlanes.

## Key Features in v1.10.0

### Drag-and-Drop Cards

The most-requested feature since the project's inception (issue #5). Moving a card between columns automatically updates the underlying markdown file:

- Tag-based columns: adds/changes the tag on the task line
- Status columns: changes the checkbox status character
- Date columns: updates the date property
- Auto-scroll activates when dragging toward board edges

This was stabilized over two beta releases (beta-1 on 2026-03-17, beta-2 on 2026-04-01) before shipping in v1.10.0.

### Advanced Swimlanes

Swimlanes add horizontal grouping to the board — tasks are grouped into rows by a property while columns remain the primary axis. Two unique concepts:

1. **Custom Swimlanes** — choose which property defines grouping, with manual sort order control
2. **Aggregator Swimlane** — collapses less-important swimlanes into a single row at the bottom, keeping the board focused

Additional controls include column exclusion from swimlane UI and two layout types selectable via dropdown.

### moment.js to date-fns Migration

Completed across v1.9.6 and v1.10.0. Key benefits:

- **Bundle size**: ~5-30KB (tree-shakeable) vs moment.js's ~300KB
- **Maintenance**: date-fns is actively maintained; moment.js has been in maintenance-only mode since 2020
- **Immutability**: pure functions reduce mutation bugs
- **Custom formats**: enables arbitrary date format patterns via date-fns tokens (`yyyy-MM-dd` instead of moment's `YYYY-MM-DD`)

Settings were renamed: `universalDateFormat` and `taskCompletionDateTimePattern` replaced by `dateFormat` and `dateTimeFormat`.

## Comparison with Kanban Plugin

| Aspect | Task Board | Kanban Plugin |
|---|---|---|
| Data model | Vault-wide scan | Single-file boards |
| Drag-and-drop | Yes (v1.10.0) | Yes (core feature) |
| Swimlanes | Yes, advanced | No |
| Column types | 11+ semantic types | User-defined lists |
| Maturity | ~1.5 years, 415 stars | ~4 years, 4,167 stars |

**Use Task Board when**: tasks are scattered across vault files and you want aggregation without moving them, or you need swimlanes/semantic columns.

**Use Kanban Plugin when**: you want simple, proven, single-file boards with battle-tested drag-and-drop.

## Integration Details

Check if `task-board` plugin is installed; if so, update to v1.10.0+. If not installed, evaluate for vault task management as alternative to current tracking. Task Board is the clear successor to [[CardBoard plugin]] for vault-wide scanning with active development.

### Known Cautions

- **Map View** has a LocalStorage architecture issue (#561) — do not rely on it until v2.0.0
- Some inline checklist items may stop appearing if not configured under "Custom statuses" (breaking change in v1.10.0)
- No published performance benchmarks for vaults with 10,000+ notes

## Sources

1. [Task Board GitHub](https://github.com/tu2-atmanand/Task-Board) — repository, README, release notes
2. [v1.10.0 Release Notes](https://github.com/tu2-atmanand/Task-Board/releases/tag/1.10.0)
3. [Task Board Documentation](https://tu2-atmanand.github.io/task-board-docs/)
4. [CardBoard GitHub](https://github.com/roovo/obsidian-card-board) — predecessor comparison

---
Tags: #intelligence #tool-recommendation #auto-applied
