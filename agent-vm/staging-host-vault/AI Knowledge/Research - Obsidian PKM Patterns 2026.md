# Research: Obsidian PKM Patterns for AI-Integrated Vaults (2026)

> Comprehensive research on vault architectures, note formats, plugins, metadata strategies, and maintenance patterns for Obsidian vaults where AI agents read AND write. Conducted March 2026.

---

## 1. Vault Architectures for AI Read/Write

### The Core Challenge

When an AI agent both reads and writes to a vault, the architecture must solve problems that human-only vaults never face:

- **Signal-to-noise**: AI-generated content can flood the vault if ungoverned
- **Authority boundaries**: Which files does the AI own vs. the human?
- **Context loading**: The AI needs to quickly find the right context at session start
- **Temporal coherence**: Notes must make sense when retrieved weeks or months later

### Architecture Comparison

| Architecture | Description | AI Fit | Weaknesses |
|---|---|---|---|
| **PARA** (Forte) | Projects/Areas/Resources/Archives | Good for action-oriented vaults | Weak on knowledge interconnection |
| **Zettelkasten** (Ahrens) | Atomic notes with dense bidirectional links | Great for retrieval, poor for AI writing | AI struggles with atomic granularity |
| **Johnny Decimal** | Numbered category system | Good for folders, rigid | Too rigid for evolving AI content |
| **LYT** (Kepano/Milo) | Links, MOCs, fluid taxonomy | Excellent for growing vaults | Requires periodic MOC gardening |
| **Goal Cascade** (obsidian-claude-pkm) | Vision-to-tasks hierarchy with AI agents | Purpose-built for AI | Opinionated about productivity |
| **Trajan's Current** (this vault) | Functional zones with MOCs | Good separation of concerns | Needs periodic notes and goal cascade |

### Recommended Hybrid for AI Vaults

The strongest pattern emerging in 2026 combines:

1. **Functional zone folders** (like this vault's `Agent Context/`, `AI Knowledge/`, etc.) for clear authority boundaries
2. **MOCs** as navigational hubs that both human and AI can traverse
3. **Goal cascade files** for connecting vision to daily action
4. **Flat daily/periodic notes** for temporal context
5. **An Inbox/** for unprocessed captures that the AI can triage

This matches what [[System Vault Structure]] already establishes, with the gap being periodic notes and goal cascade.

### obsidian-claude-pkm: Deep Dive

[GitHub: ballred/obsidian-claude-pkm](https://github.com/ballred/obsidian-claude-pkm) (MIT, v3.1, Feb 2026)

This is the most complete open-source implementation of an AI-integrated Obsidian vault. Key architecture:

```
vault-template/
├── CLAUDE.md                    ← AI navigation + available skills/agents
├── Daily Notes/                 ← YYYY-MM-DD.md daily journals
├── Goals/                       ← The cascade hierarchy
│   ├── 0. Three Year Goals.md
│   ├── 1. Yearly Goals.md
│   ├── 2. Monthly Goals.md
│   └── 3. Weekly Review.md
├── Projects/                    ← Each has its own CLAUDE.md
├── Templates/                   ← Daily, Weekly Review, Project
├── Archives/                    ← Completed content
├── Inbox/                       ← Unprocessed captures
└── .claude/
    ├── agents/                  ← 4 specialized AI agents
    ├── skills/                  ← 12 slash commands
    ├── rules/                   ← Path-specific conventions
    ├── hooks/                   ← Auto-commit, session init
    └── output-styles/           ← Productivity Coach persona
```

**Four specialized agents:**

| Agent | Purpose | Key Capability |
|---|---|---|
| `goal-aligner` | Audits daily activities against stated goals | Produces alignment score, flags 14+ day gaps |
| `weekly-reviewer` | Facilitates 3-phase weekly review (Collect/Reflect/Plan) | Reads all daily notes, calculates goal progress |
| `note-organizer` | Vault hygiene: fixes links, consolidates tags, archives stale notes | Proposes changes before executing |
| `inbox-processor` | GTD-style inbox triage | Categorizes as next-action/project/waiting/someday/reference |

**The Goal Cascade** flows: 3-Year Vision -> Yearly Goals -> Projects -> Monthly Goals -> Weekly Review -> Daily Tasks. Each level references the one above via wikilinks. The `/review` skill auto-detects which cadence to run based on context (time of day, day of week, day of month).

**What to adopt vs. what to skip:**

| Feature | Adopt? | Reasoning |
|---|---|---|
| Goal cascade files (3yr/yearly/monthly/weekly) | Yes | Core value prop; gives daily work purpose |
| `/daily` skill with cascade context surfacing | Yes | Morning routine surfaces ONE Big Thing + project next-actions |
| `/weekly` skill with 3-phase review | Yes | Structured reflection prevents drift |
| Auto-commit hook | Maybe | Good for Git-backed vaults; Trajan already uses Git |
| Productivity Coach output style | Worth trying | Accountability partner persona |
| Full `/adopt` installation | No | Too opinionated; cherry-pick the patterns instead |

See also: [[Workflow - Goal Cascade]]

---

## 2. Note Formats for LLM Consumption

### What Makes Notes AI-Retrievable

Semantic search (like QMD's vector embeddings) retrieves notes based on meaning, not keywords. But retrieval quality depends heavily on how notes are written.

**Principles for LLM-friendly notes:**

| Principle | Why It Matters | Example |
|---|---|---|
| **Lead with context** | First 2-3 sentences get highest embedding weight | "ExecuDeck is a dual-surface command environment..." not "## Overview" |
| **One topic per note** | Atomic notes retrieve more precisely | Split "MCP Tools" into per-tool notes |
| **Explicit relationships** | LLMs understand stated connections better than implied ones | "This replaces X because Y" > just linking to X |
| **Concrete over abstract** | Specific details retrieve better than vague descriptions | "Runs on port 3001, requires Node 20+" > "a server" |
| **Natural language headings** | Semantic search matches questions to headings | "How to configure QMD" > "Configuration" |
| **Self-contained summaries** | Each note should be understandable without reading linked notes | Include a one-line context sentence even in deeply linked notes |

### Recommended Note Template for AI Retrieval

```markdown
# Note Title

> One-line summary: what this is and why it matters.

## Context
[2-3 sentences: when/why this was created, what problem it addresses]

## Content
[Main content with clear structure]

## Connections
- Related to: [[Note A]] — because [explicit reason]
- Replaces: [[Note B]] — which was [reason for replacement]
- Used by: [[Project C]]

## Metadata
- Created: YYYY-MM-DD
- Status: active/archived
- Tags at bottom: #tag1 #tag2
```

### Frontmatter vs. Inline Metadata

| Approach | Pros | Cons | AI Fit |
|---|---|---|---|
| YAML frontmatter | Machine-parseable, Dataview-queryable, Obsidian Properties UI | Clutters top of file, not all tools parse it | Good for structured queries |
| Inline fields `[key:: value]` | Visible in text, Dataview-queryable | Non-standard syntax | Good for human reading |
| Bottom-of-file tags | Simple, portable, visible | Not queryable for complex values | Good for categorization |
| Table-based metadata | Human-readable, QMD-searchable | Not machine-queryable like frontmatter | Great for AI retrieval |

**Recommendation for this vault**: Continue using the table-based "Quick Info" pattern from [[Workflow - Knowledge Growth]] for research notes, with tags at the bottom. Add YAML frontmatter only when Dataview queries are needed. This keeps notes clean for both human reading and QMD retrieval.

---

## 3. Obsidian Plugins for AI Workflows

### Plugin Assessment Matrix

| Plugin | What It Does | AI Workflow Value | Recommendation |
|---|---|---|---|
| **Dataview** | Live queries over vault metadata | Dashboards, progress tracking, goal status aggregation | Install — core infrastructure |
| **Templater** | Dynamic templates with scripting | Automated note creation with dates, variables, JS | Install — enables daily/weekly templates |
| **Periodic Notes** | Daily/weekly/monthly/quarterly/yearly note creation | Structured temporal notes with templates | Install — essential for review cadence |
| **Tasks** | Global task management across all files | Query incomplete tasks vault-wide, due dates, recurrence | Install — complements daily workflow |
| **QuickAdd** | Macro-powered capture and note creation | One-hotkey capture to inbox, chained actions | Install — reduces friction for captures |
| **Kanban** | Visual board view for notes | Project phase tracking, visual workflow | Optional — nice for visual thinkers |
| **Calendar** | Calendar view linked to daily notes | Navigate daily notes visually | Install — low cost, high convenience |
| **Obsidian Git** | Auto-commit and sync via Git | Backup, version history, cross-device sync | Install if not using other Git workflow |

### Dataview: The Dashboard Engine

Dataview is the most impactful plugin for an AI-integrated vault. It can:

- **LIST** all notes matching criteria (e.g., all active projects)
- **TABLE** data from frontmatter across notes (e.g., goal progress dashboard)
- **TASK** queries across the entire vault (e.g., all incomplete tasks from this week)
- **CALENDAR** view of date-tagged content

Example: A goal dashboard that pulls status from all goal files:
```dataview
TABLE status, progress, last-updated
FROM "Goals"
SORT file.name ASC
```

Example: Incomplete tasks from this week's daily notes:
```dataview
TASK
FROM "Daily Notes"
WHERE !completed
WHERE file.day >= date(today) - dur(7 days)
```

**For Trajan's vault**: Dataview would enable live dashboards in MOC files like [[AI Knowledge Hub]] — showing note counts, recently updated files, and status summaries without manual maintenance.

### Templater: Dynamic Note Creation

Templater goes beyond basic templates with:
- `tp.date` — dynamic dates with arithmetic (`tp.date.now("YYYY-MM-DD", 1)` for tomorrow)
- `tp.file` — file creation/modification dates, title insertion
- `tp.web` — fetch web content into templates
- `tp.system` — execute system commands
- User scripts — custom JavaScript functions
- `tp.frontmatter` — access and manipulate frontmatter values

**For Trajan's vault**: Templater powers the daily/weekly/monthly note templates that the obsidian-claude-pkm system relies on. Even without that system, Templater makes periodic note creation frictionless.

### Periodic Notes: The Temporal Backbone

Creates notes at every cadence with dedicated templates:
- **Daily**: Journal, tasks, reflection
- **Weekly**: Review, planning, goal check
- **Monthly**: Milestone check, quarterly alignment
- **Quarterly**: Strategic review
- **Yearly**: Annual retrospective and planning

Each cadence can have its own template, folder, and naming format. Combined with Templater, each note auto-links to adjacent periods (yesterday/tomorrow, last week/next week).

### QuickAdd: Friction Reduction

Four modes of operation:
1. **Template**: Create a note from template with one hotkey
2. **Capture**: Append text to a specific file (e.g., add to today's daily note)
3. **Macro**: Chain multiple actions (create note + update index + open note)
4. **Multi**: Organize choices into menus

**For Trajan's vault**: QuickAdd macros could automate "new tool evaluation" — creating the note from template, adding it to the right MOC, and opening it for editing, all with one hotkey.

---

## 4. Tagging and Metadata Strategies

### Tag Hierarchy Design

The obsidian-claude-pkm system uses a three-tier hierarchy that works well:

```
#priority/high, #priority/medium, #priority/low
#status/active, #status/waiting, #status/completed, #status/archived
#context/work, #context/personal, #context/health, #context/learning
```

Eleanor Konik's research recommends a hybrid approach:
- **Folders** for broad exclusive categories (a note lives in one place)
- **Tags** for cross-cutting attributes (status, priority, action needed)
- **Links** for semantic relationships (this relates to that)

### Metadata Strategy for QMD/Semantic Search

| Metadata Type | Storage Method | QMD Searchability | Use Case |
|---|---|---|---|
| Note type | Tag: `#research`, `#project`, `#session` | High (in text) | Filter by content kind |
| Status | Tag: `#status/active` | High | Filter active vs archived |
| Priority | Tag: `#priority/high` | High | Surface urgent items |
| Created date | Frontmatter or filename | Medium (if indexed) | Temporal queries |
| Related project | Wikilink: `[[ExecuDeck]]` | High (linked text) | Project-scoped search |
| Key concepts | Natural language in content | High (embeddings) | Semantic retrieval |
| One-line summary | `> blockquote` at top of note | Very high (prominent text) | Best retrieval signal |

**Key insight**: QMD's vector search works on natural language, not structured fields. The most important optimization is writing clear, descriptive opening sentences — not adding more YAML fields.

### Recommended Tag Taxonomy for This Vault

Building on existing vault tags and the PKM patterns:

```
# Content type
#research    #project    #session    #workflow    #convention    #decision

# Status
#status/active    #status/archived    #status/tbd

# Domain
#system    #structure    #vault    #pkm    #tools

# Priority (use sparingly)
#priority/high    #priority/low
```

Keep the tag set small and consistent. Tags should answer "what kind of thing is this?" and "what state is it in?" — not duplicate information already in the content.

---

## 5. Daily Notes and Periodic Review Patterns

### The Periodic Notes Hierarchy

| Cadence | Purpose | Time Investment | Key Output |
|---|---|---|---|
| **Daily** | Plan, execute, reflect | 10-15 min (5 morning + 5 evening) | Task list, reflection, energy log |
| **Weekly** | Review, align, plan | 30 min (Sunday) | Wins/challenges, ONE Big Thing, project status |
| **Monthly** | Milestone check, adjust | 30-60 min (month end) | Quarterly progress, priority rebalancing |
| **Quarterly** | Strategic review | 1-2 hours | Goal revision, project portfolio review |
| **Yearly** | Vision refresh | 2-4 hours | Annual retrospective, next year theme |

### Daily Note Template (Optimized for AI)

The obsidian-claude-pkm daily template is comprehensive but heavy. A leaner version optimized for both human use and AI retrieval:

```markdown
---
date: {{date:YYYY-MM-DD}}
tags: daily-note
---

# {{date:dddd, MMMM DD, YYYY}}

## Context
- **Week's ONE Big Thing:** [from weekly review]
- **Monthly Focus:** [from monthly goals]

## Focus
> ONE thing that makes today a win:

## Tasks
### Must Do
- [ ]

### Should Do
- [ ]

## Notes
[Capture during the day]

## Reflection
- **Win:**
- **Challenge:**
- **Learned:**
- **Energy:** /10
- **Tomorrow's priority:**

## Links
- [[{{date-1:YYYY-MM-DD}}|Yesterday]] | [[{{date+1:YYYY-MM-DD}}|Tomorrow]]
- [[Weekly Review - Week {{date:w}}]]
```

### Weekly Review Template (Optimized for AI)

The weekly review is where the AI provides the most value — aggregating daily notes, calculating progress, and surfacing patterns:

```markdown
---
date: {{date:YYYY-MM-DD}}
tags: weekly-review
week: {{date:w}}
---

# Weekly Review: Week {{date:w}} ({{date:YYYY-MM-DD}})

## Last Week
### Wins
1.
2.
3.

### Challenges
1.
2.

### Patterns Noticed
-

## Goal Progress
| Goal | Progress | Activity This Week |
|---|---|---|
| | | |

## Project Status
| Project | Phase | Next Action |
|---|---|---|
| [[ExecuDeck]] | | |

## Next Week
### ONE Big Thing
>

### Key Tasks
- [ ]
- [ ]
- [ ]

## Review Checklist
- [ ] All daily notes reviewed
- [ ] Goal progress updated
- [ ] Projects statuses current
- [ ] Next week planned
```

### How Periodic Notes Feed the AI

The critical insight from obsidian-claude-pkm is **cascade context surfacing**: each morning, the AI reads the current weekly review to surface the ONE Big Thing, reads project CLAUDE.md files for next-actions, and reads monthly goals for focus. This means:

1. Weekly reviews must be **machine-readable** (clear headings, consistent format)
2. Project notes must have a **"Next Actions" section** that the AI scans
3. Monthly goals must state the **current focus** in a predictable location

The AI then generates a "Today's Context" block at the top of the morning routine. This is the feedback loop that makes the cascade work — daily notes inform weekly reviews, which inform monthly reviews, which adjust the goals that flow back down.

---

## 6. Knowledge Graph Patterns

### MOCs vs Tags vs Folders

| Method | Strengths | Weaknesses | Best For |
|---|---|---|---|
| **MOCs** (Maps of Content) | Provide narrative context, flexible, human-readable | Require manual maintenance | Navigational hubs for topic clusters |
| **Tags** | Cross-cutting, fast to apply, filterable | No context, can proliferate | Status/type metadata |
| **Folders** | Clear location, works with any tool | One location per file, rigid hierarchy | Authority boundaries, content zones |
| **Links** | Semantic connections, graph-visible | Can become noise if overused | Explicit relationships between ideas |

### The LYT Framework

Linking Your Thinking (Nick Milo) proposes three layers:

1. **Bottom-up notes**: Individual atomic notes as they arise
2. **MOCs**: Emerge when a cluster of 5-10+ notes forms around a topic
3. **Home note**: Top-level index linking to all MOCs

This vault already follows this pattern with [[Welcome]] as the home note and MOCs like [[Agent Context MOC]], [[Workflows MOC]], and [[AI Knowledge Hub]].

### Digital Garden Maturity Model

From Maggie Appleton's digital garden patterns, notes have three maturity stages:

| Stage | Symbol | Description | Action |
|---|---|---|---|
| Seedling | (new) | Rough early idea, just captured | Needs development |
| Budding | (developing) | Cleaned up and clarified | Ready for connections |
| Evergreen | (mature) | Reasonably complete, maintained | Reference-ready |

**For this vault**: The `#status/tbd` tag already captures the seedling state. Consider adding `#status/developing` for the middle stage. Notes tagged `#status/active` without `tbd` are effectively evergreen.

### Zettelkasten Principles Worth Adopting

Even without full Zettelkasten methodology, three principles improve any vault:

1. **Atomicity**: One idea per note (already followed in `AI Knowledge/` tool notes)
2. **Explicit connections**: State WHY notes link, not just that they do ("Replaces X because Y")
3. **Structure notes**: MOCs that provide narrative context for clusters (already in use)

---

## 7. Vault Maintenance and Hygiene

### The Vault Rot Problem

Vaults degrade over four axes:

| Rot Type | Symptom | Prevention |
|---|---|---|
| **Link rot** | Broken wikilinks from renamed/moved files | Weekly link check (note-organizer agent or `/check-links`) |
| **Content rot** | Outdated information (deprecated tools, old decisions) | Monthly audit of `#status/active` notes |
| **Tag rot** | Inconsistent or proliferating tags | Maintain controlled vocabulary; quarterly tag audit |
| **Bloat** | Too many low-value notes diluting search quality | Quality gate before creation (see [[Workflow - Knowledge Growth]]) |

### Maintenance Calendar

| Frequency | Task | Tool/Method |
|---|---|---|
| **Weekly** | Check for orphan notes (no incoming links) | Dataview query or note-organizer agent |
| **Weekly** | Review session log for promotable insights | Part of `/weekly` review |
| **Monthly** | Audit stale notes (no edits 90+ days) | Dataview query on `file.mday` |
| **Monthly** | Update Quick Info tables (star counts, status) | Manual for key tools |
| **Quarterly** | Tag audit: consolidate duplicates, remove unused | Grep for all `#` prefixes |
| **Quarterly** | Archive completed/abandoned projects | Move to `Archives/` with completion date |
| **Yearly** | Full vault review: does the structure still serve? | Strategic review |

### Quality Gates (from [[Workflow - Knowledge Growth]])

Before creating any new note:
1. Does a note on this topic already exist? (search first)
2. Is this relevant to current or planned projects?
3. Can I fill at least the summary + key content?
4. Does it fit an existing category?

### Archive Strategy

- **Don't delete**: Mark with `#status/archived` instead. QMD still indexes but deprioritizes.
- **Move completed projects**: `Archives/Projects/ProjectName-YYYY/`
- **Move old daily notes**: `Archives/Daily Notes/YYYY-MM/` (monthly batches)
- **Keep goal files**: Even completed yearly goals stay in `Goals/` for cascade continuity

---

## 8. Specific Recommendations for This Vault

### High-Priority Actions

| # | Action | Why | Effort |
|---|---|---|---|
| 1 | **Install Periodic Notes + Templater plugins** | Enable daily/weekly/monthly note creation with templates | Low |
| 2 | **Create goal cascade files** in a `Goals/` folder | Connect daily work to long-term vision; biggest gap in current vault | Medium |
| 3 | **Install Dataview plugin** | Enable live dashboards in MOC files | Low |
| 4 | **Create daily note template** | Structured capture for each day, feeding weekly reviews | Low |
| 5 | **Create weekly review template** | Structured reflection, goal progress tracking | Low |
| 6 | **Install Tasks plugin** | Query incomplete tasks across all notes | Low |
| 7 | **Install QuickAdd plugin** | One-hotkey capture to inbox | Low |

### Medium-Priority Actions

| # | Action | Why | Effort |
|---|---|---|---|
| 8 | Add `> summary blockquote` to all existing notes | Improves QMD retrieval quality | Medium |
| 9 | Cherry-pick obsidian-claude-pkm agents | Goal-aligner and weekly-reviewer are highest value | Medium |
| 10 | Add explicit "why" to wikilinks | Improves both human and AI understanding of connections | Ongoing |
| 11 | Create `Inbox/` folder | Unprocessed captures with GTD triage workflow | Low |

### What NOT To Do

- **Don't adopt obsidian-claude-pkm wholesale** — it's opinionated and would conflict with this vault's existing structure. Cherry-pick the goal cascade and review templates.
- **Don't over-tag** — keep the tag vocabulary small and consistent. If you need more than 20 distinct tags, the taxonomy needs simplification.
- **Don't add YAML frontmatter everywhere** — only where Dataview queries justify it (daily notes, goal files). QMD searches natural language better than structured fields.
- **Don't create empty placeholder notes** — they dilute search quality. Wait until there's real content.

### Proposed Vault Structure Evolution

```
twj1/
├── CLAUDE.md
├── Welcome.md
│
├── Agent Context/          ← [existing] Claude's behavioral guide
├── AI Knowledge/           ← [existing] Research library
├── Trajan's Projects/      ← [existing] Active project state
├── Session Log/            ← [existing] Session records
├── Workflows/              ← [existing] Process checklists
├── System Setup/           ← [existing] Meta-documentation
│
├── Goals/                  ← [NEW] Goal cascade
│   ├── Three Year Vision.md
│   ├── Yearly Goals 2026.md
│   ├── Monthly Goals.md
│   └── (weekly reviews go here too)
│
├── Daily Notes/            ← [NEW] Periodic daily journals
│   └── YYYY-MM-DD.md
│
├── Inbox/                  ← [NEW] Unprocessed captures
│
├── Templates/              ← [NEW] Note templates
│   ├── Daily Template.md
│   ├── Weekly Review Template.md
│   └── Monthly Review Template.md
│
└── Archives/               ← [NEW] Completed/stale content
    ├── Daily Notes/
    └── Projects/
```

---

## Sources and References

| Source | Type | Key Contribution |
|---|---|---|
| [obsidian-claude-pkm](https://github.com/ballred/obsidian-claude-pkm) | GitHub repo (MIT, v3.1) | Goal cascade, AI agents, review system |
| Maggie Appleton — [Digital Garden History](https://maggieappleton.com/garden-history) | Blog post | Note maturity stages (seedling/budding/evergreen) |
| Eleanor Konik — Folders vs Tags | Blog post | Hybrid approach: folders for categories, tags for cross-cutting |
| Zettelkasten.de | Method documentation | Atomicity, connectivity, structure notes |
| Tiago Forte — PARA Method | Book/Course | Projects/Areas/Resources/Archives framework |
| Nick Milo — Linking Your Thinking | Framework | MOC-based organization with home note |
| Dataview docs | Plugin documentation | Live query engine over vault metadata |
| Templater docs | Plugin documentation | Dynamic templates with scripting |
| QuickAdd docs | Plugin documentation | Macro-powered capture and note creation |
| obsidian-claude-pkm agents | Repo source files | Goal-aligner, weekly-reviewer, note-organizer, inbox-processor |
| obsidian-claude-pkm workflow examples | Repo docs | Morning/evening/weekly/monthly workflow patterns |

---

## See Also

- [[System Vault Structure]] — current vault architecture
- [[Workflow - Goal Cascade]] — TBD workflow for goal tracking
- [[Workflow - Knowledge Growth]] — how knowledge enters the vault
- [[Workflow - Session Memory]] — session capture patterns
- [[AI Knowledge Hub]] — vault knowledge index
- [[My Stack Decisions]] — adopted tools tracking

#research #pkm #vault #obsidian #ai
