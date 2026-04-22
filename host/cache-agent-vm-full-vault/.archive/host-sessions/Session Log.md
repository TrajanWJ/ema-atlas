# Session Log

> Claude writes session records here. QMD indexes them for cross-session recall.

---

## Templates

- [[Session Summary Template]] — End-of-session state capture (compact + verbose)
- [[Decision Record Template]] — Architecture Decision Records (ADRs, MADR-based)
- [[Discovery Log Template]] — Research findings with categorization
- [[Progress Update Template]] — Work status, blockers, and dependencies

## How This Works

1. At the end of a session, Claude creates a new note using the appropriate template
2. Notes are named: `YYYY-MM-DD - [Brief Title].md`
3. QMD indexes them every 30 minutes (cron)
4. Next session: Claude searches past sessions via QMD for relevant context

## How to Search Past Sessions

QMD provides hybrid search (BM25 keyword + vector semantic). Use these patterns to find past sessions:

### By Topic (Semantic Search)
```bash
# QMD finds conceptually related sessions even without exact keyword matches
qmd vsearch "authentication flow design"
qmd vsearch "state management decision"
qmd vsearch "deployment configuration"
```

### By Keyword (Exact Match)
```bash
# BM25 keyword search — fast, precise
qmd search "zustand"
qmd search "ADR-0001"
qmd search "ExecuDeck auth"
```

### By Tag (Filtered Search)
```bash
# Search within tagged categories
qmd search "#adr"           # All architecture decisions
qmd search "#gotcha"        # All gotchas and pitfalls discovered
qmd search "#session"       # All session summaries
qmd search "#progress"      # All progress updates
qmd search "#discovery"     # All discovery logs
```

### By Project
```bash
qmd search "#project-execudeck"
qmd vsearch "ExecuDeck command palette"
```

### By Date Range
```bash
# File naming convention makes date filtering possible
qmd search "2026-03"        # All March 2026 sessions
```

### QMD Keywords (Hidden Metadata)
Templates include HTML comments for QMD keywords that are indexed but invisible in Obsidian:
```markdown
<!-- QMD keywords: websocket, real-time, polling, SSE -->
```
Search for these terms directly: `qmd search "websocket"`

### From Within Claude Code
```
/recall auth flow          # Superpowers recall skill uses QMD under the hood
/recall --temporal tuesday  # What happened on Tuesday
/recall --graph auth        # Graph-based connections
```

### Search Strategy for New Sessions

When starting a new session on a topic:
1. `qmd vsearch "[topic]"` — semantic search for related past work
2. `qmd search "#adr"` — check if relevant decisions already exist
3. `qmd search "[[Project Name]]"` — find all sessions for the project
4. Read the project note in `Trajan's Projects/` for current status

## Session Records

_Records will appear here as sessions are logged._

#session-log #memory
