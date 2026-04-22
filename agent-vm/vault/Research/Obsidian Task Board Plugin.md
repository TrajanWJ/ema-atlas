---
title: "Obsidian Task Board Plugin - Research"
type: research
created: 2026-04-16
tags: [obsidian, plugin, kanban, taREDACTED_TOKEN, productivity]
summary: "Deep dive on Obsidian Task Board plugin v1.10.0 - vault-wide Kanban with drag-and-drop, swimlanes, date-fns migration"
---

# Obsidian Task Board Plugin

## What It Is

Task Board is an Obsidian community plugin by Atmanand Gauns (`tu2-atmanand`) that provides vault-wide Kanban-style task management. It scans all markdown files in a vault for task items (checkboxes) and displays them on configurable boards with columns, filters, and multiple view types. The plugin ID in the community store is `task-board`.

The core philosophy is **plain-text, vault-wide task aggregation**: tasks live wherever you write them -- project notes, daily notes, meeting notes -- and Task Board collects them into a centralized visual interface. This contrasts with file-scoped Kanban approaches where tasks must live inside a dedicated board file.

- **Repository**: https://github.com/tu2-atmanand/Task-Board
- **Documentation**: https://tu2-atmanand.github.io/task-board-docs/
- **License**: GPL-3.0
- **Language**: TypeScript
- **Stars**: ~415 (as of April 2026)
- **Created**: September 2024
- **Latest release**: v1.10.1 (2026-04-10)

## Relationship to CardBoard

Task Board is a spiritual successor to the [[CardBoard plugin]] (`roovo/obsidian-card-board`, written in Elm, ~620 stars). The author explicitly states in the README that he used CardBoard and was inspired by its vault-wide scanning approach, but found it lacking features and stalled in development (last push February 2024). Since Elm was unfamiliar, he started a new plugin in TypeScript rather than contributing to CardBoard. Task Board is **not** a fork -- it is a ground-up rewrite with additional inspiration from [[GitHub Projects]] board layouts.

Despite some community references calling it "formerly CardBoard," this is imprecise. They are separate projects by different authors. CardBoard still exists and works but is no longer actively developed.

## How It Works

### Scanning and Data Model

1. Task Board scans all markdown files in the vault for task-format lines (`- [ ]`, `+ [ ]`, `* [ ]`, `> [ ]`).
2. Tasks can include sub-tasks (indented checkboxes), body descriptions, images, and file attachments.
3. Scanned tasks are indexed and categorized by their properties (tags, dates, status, priority, path).
4. Boards are defined through configuration -- each board has columns that filter tasks by type (date ranges, tags, status, priority, path patterns, etc.).
5. Changes made on the board (marking complete, editing, dragging) write back to the original markdown files in real-time.

### Scanning Filters

Since scanning an entire vault can be expensive, the plugin offers scanning filters to exclude specific files or folders, and multiple scanning modes to control performance ("balanced" mode, selective file scanning, etc.).

### Column Types

Task Board supports a rich set of column types, which is one of its differentiators:

- **Undated** -- tasks with no date property
- **Dated** -- tasks filtered by date ranges (relative: before/after/between, similar to CardBoard)
- **Tagged** -- tasks with specific tags
- **Untagged** -- tasks without any tags
- **Other Tags** -- catch-all for tags not assigned to named columns
- **Status** -- filter by task status/checkbox type
- **Priority** -- filter by priority property
- **Path** -- filter by file path pattern
- **Filtered** -- custom advanced filter columns
- **All Pending Tasks** -- everything not completed
- **Completed** -- done tasks

## v1.10.0 Key Features (Released 2026-04-04)

### Drag and Drop Cards

The most requested feature (issue #5, from the project's early days). Moving a card from one column to another automatically updates the relevant property on the task in the source markdown file. For tag-based columns, it adds/changes the tag. For status columns, it changes the checkbox status. For date columns, it updates the date property. Auto-scroll activates when dragging toward board edges.

Implementation note: drag-and-drop was introduced experimentally in v1.9.x releases and stabilized for v1.10.0 after two beta releases (beta-1 on 2026-03-17, beta-2 on 2026-04-01).

### Advanced Swimlanes

This is Task Board's distinctive feature, described as "maybe one of its kind." Swimlanes add a horizontal grouping dimension to the Kanban board -- tasks are grouped into rows (swimlanes) based on a property, while columns remain the primary axis.

Two unique concepts:

1. **Custom Swimlanes** -- Configure which property defines the swimlane grouping. Manual sorting of swimlane order is supported, so the user controls which rows appear first.
2. **Aggregator Swimlane** -- Groups all "less important" swimlanes into a single collapsed row at the bottom. This keeps the board focused on priority swimlanes while still showing everything.

Additional swimlane controls:
- **Exclude columns** -- certain column types (like "Untagged") can be excluded from the swimlane UI since they do not benefit from sub-grouping.
- **Two UI types** -- "Vertical headers" and another layout, selectable via dropdown.
- **Swimlanes Config Modal** -- dedicated configuration interface.

### Other v1.10.0 Features

- **Card context menu** -- right-click on task cards for quick actions (change properties, open editor).
- **Minimal Theme alternate checkbox icons** -- renders custom checkbox states visually.
- **Exclude inline checkbox items** -- only configured custom statuses are scanned, reducing noise.
- **Date-Time picker** -- for reminder property via context menu.
- **Custom date formats** -- enabled by the date-fns migration (see below).

## Migration from moment.js to date-fns

This migration happened across v1.9.6 (February 2026) and was finalized in v1.10.0 with the complete removal of moment.js.

### What Changed

- All date parsing, formatting, and comparison logic moved from `moment.js` to `date-fns` (v4.1.0).
- Settings renamed: `universalDateFormat` and `taskCompletionDateTimePattern` replaced by separate `dateFormat` and `dateTimeFormat` using date-fns format tokens (e.g., `yyyy-MM-dd` instead of moment's `YYYY-MM-DD`).
- New semantic date filter operators: `before`, `after`, `onOrBefore`, `onOrAfter`.
- A `robustDateParser` function was added for automatic format detection.
- Settings UI includes a date format validator with links to date-fns documentation.
- Locale strings updated throughout.

### Why It Matters

1. **Bundle size**: moment.js is ~300KB (with locales); date-fns is tree-shakeable and typically adds 5-30KB depending on functions used. For an Obsidian plugin, this directly impacts load time.
2. **Maintenance**: moment.js has been in maintenance mode since September 2020. The moment team themselves recommend alternatives. date-fns is actively maintained.
3. **Immutability**: date-fns functions are pure and return new Date objects, reducing mutation bugs. moment objects are mutable, a known source of subtle bugs.
4. **Custom formats**: date-fns supports arbitrary format patterns out of the box, enabling the "unlimited date formats" feature. Users can now use whatever date format they prefer rather than being locked to a fixed set.
5. **Obsidian ecosystem alignment**: Obsidian itself ships moment.js as a global, but plugins bundling their own copy create version conflicts and bloat. Using date-fns avoids this coupling.

## Comparison with Other Kanban Plugins

### vs. Kanban Plugin (obsidian-community/obsidian-kanban)

The [[Obsidian Kanban Plugin]] by mgmeyers (~4,167 stars) is the most popular Kanban solution for Obsidian.

| Aspect | Task Board | Kanban Plugin |
|---|---|---|
| **Data model** | Vault-wide scan; tasks live in any file | Single-file; each board is one `.md` file |
| **Task source** | Aggregates from entire vault | Tasks exist only within the board file |
| **Plain-text** | Tasks remain in original files | Board file is markdown but tasks are board-local |
| **Drag and drop** | Yes (v1.10.0) | Yes (core feature from the start) |
| **Swimlanes** | Yes, advanced (v1.10.0) | No |
| **Column types** | 11+ types (date, tag, status, priority, path, etc.) | User-defined lists (no semantic types) |
| **Stars** | ~415 | ~4,167 |
| **Maturity** | Active development, ~1.5 years old | Mature, ~4 years old |
| **Architecture** | TypeScript, React-based | TypeScript |
| **Task editing** | Dedicated modal with sub-tasks, descriptions | Inline editing in board |
| **Multiple boards** | Multiple boards in single view, tab switching | One board per file, open multiple files |
| **Views** | Kanban + Map view (experimental) | Kanban only |
| **Filtering** | Advanced board + column filters, scanning filters | Lane-level filtering, search |

**When to use Task Board**: You want tasks scattered across your vault (project notes, daily notes, meeting notes) aggregated into boards without moving them. You want swimlanes or semantic column types. You use GTD/DFP methodologies.

**When to use Kanban Plugin**: You want a simple, proven, single-file board. Tasks belong to the board, not to other notes. You value maturity and ecosystem adoption. You want drag-and-drop that has been battle-tested for years.

### vs. CardBoard (roovo/obsidian-card-board)

| Aspect | Task Board | CardBoard |
|---|---|---|
| **Vault-wide scanning** | Yes | Yes |
| **Language** | TypeScript | Elm |
| **Active development** | Yes (multiple releases per month) | Stalled (last push Feb 2024) |
| **Drag and drop** | Yes | Planned but never shipped |
| **Column types** | 11+ | 2 (date-based, tag-based) |
| **Swimlanes** | Yes | No |
| **Task editing modal** | Yes | Click to open source file |
| **Stars** | ~415 | ~620 |

Task Board is the clear successor if you want the vault-wide scanning approach with active development and modern features.

## Configuration and Setup

### Installation

Install from Obsidian Community Plugins (search "Task Board") or via BRAT for beta releases.

### Initial Setup

1. Enable the plugin. Open Task Board via the ribbon icon or Command Palette.
2. Click "Scan vault modal" button in the header to run initial scan.
3. Three pre-configured example boards are provided out of the box.
4. Edit or delete these and create custom boards via the Board Config Modal.

### Board Configuration

Each board is configured through the Board Config Modal:
- **Columns**: Add columns of any supported type (dated, tagged, status, priority, path, filtered, etc.).
- **Board filters**: Advanced filters applied at the board level to scope which tasks appear.
- **Column filters**: Additional per-column filters for fine-grained control.
- **Swimlanes**: Configure via the Swimlanes Config Modal -- choose grouping property, ordering, aggregator behavior.

### Key Settings Areas

The plugin settings are organized into tabs:
- **General** -- scanning filters, startup behavior, daily notes compatibility
- **UI** -- card design style, properties visibility
- **Properties** -- custom statuses, property configuration
- **Inline Tasks** -- settings for tasks that are inline checkboxes
- **Task Notes** -- settings for note-level task behavior
- **Map View** -- (experimental, has known LocalStorage issues per issue #561)
- **Automations** -- auto-completion, status change rules
- **Formats** -- date/time format configuration with validation

### Task Format Compatibility

Supports task formats from the Tasks plugin, Dataview, and standard Obsidian checkboxes:
- `- [ ] Task @due(2026-04-16)`
- `- [ ] Task [due:: 2026-04-16]`
- Multi-level sub-tasks, descriptions, and callout tasks (with limitations)

### Known Issues (v1.10.x)

- **Map View LocalStorage issue** (#561): Map view stores data in LocalStorage, which is architecturally problematic. Planned fix in v2.0.0. The author recommends not relying on map view for daily workflow.
- Some inline checklist items may stop appearing if not configured under "Custom statuses" settings (breaking change in v1.10.0).

## What We Don't Know

- **Performance at scale**: No published benchmarks for vaults with 10,000+ notes. Scanning filters mitigate this but real-world performance data is absent from documentation.
- **Sync/collaboration behavior**: No documentation on behavior with Obsidian Sync or multi-device setups beyond basic file-level syncing.
- **v2.0.0 timeline**: The Map View architecture fix and other v2.0 features are milestoned but no target date is published.
- **Community adoption trajectory**: At 415 stars in ~1.5 years, growth is steady but significantly behind the Kanban plugin. Whether this reflects awareness gaps or feature/stability differences is unclear.

## Sources

1. GitHub: tu2-atmanand/Task-Board repository (README, releases) -- https://github.com/tu2-atmanand/Task-Board [fetched 2026-04-16, T1]
2. GitHub: v1.10.0 release notes -- https://github.com/tu2-atmanand/Task-Board/releases/tag/1.10.0 [fetched 2026-04-16, T1]
3. GitHub: v1.9.6 release notes (date-fns migration) -- https://github.com/tu2-atmanand/Task-Board/releases/tag/1.9.6 [fetched 2026-04-16, T1]
4. GitHub: v1.10.1 release notes -- https://github.com/tu2-atmanand/Task-Board/releases/tag/1.10.1 [fetched 2026-04-16, T1]
5. GitHub: roovo/obsidian-card-board repository (README) -- https://github.com/roovo/obsidian-card-board [fetched 2026-04-16, T1]
6. GitHub: obsidian-community/obsidian-kanban repository metadata -- https://github.com/obsidian-community/obsidian-kanban [fetched 2026-04-16, T1]
7. Task Board Documentation site -- https://tu2-atmanand.github.io/task-board-docs/ [fetched 2026-04-16, T1; note: individual feature pages returned 404, table of contents used for feature inventory]
