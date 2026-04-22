# System Data Flow

> The feedback loop — how context flows between sessions and grows over time.
> Last verified: 2026-03-11

---

## Vault Metrics

| Metric | Value |
|---|---|
| **Total markdown files** | 81 |
| **Session logs** | 1 session + 4 templates + 1 index |
| **Vault size on disk** | 4.2 MB |
| **Claude config size** | 1.3 GB (includes plugin caches) |
| **QMD reindex interval** | Every 30 minutes |

---

## The Core Loop

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│   SESSION STARTS                                                  │
│   │                                                               │
│   ├── Claude reads ~/.claude/CLAUDE.md (global instructions)      │
│   ├── Claude reads project CLAUDE.md (if exists)                  │
│   ├── Claude searches QMD for relevant vault context              │
│   └── Claude reads project note from Trajan's Projects/           │
│                                                                   │
│   WORK HAPPENS                                                    │
│   │                                                               │
│   ├── Claude reads Agent Context/Conventions/ for standards       │
│   ├── Claude uses Agent Context/Prompts/ when applicable          │
│   └── Claude references AI Knowledge/ for tool decisions          │
│                                                                   │
│   SESSION ENDS                                                    │
│   │                                                               │
│   ├── Claude writes session summary to Session Log/               │
│   ├── Claude updates project note with progress                   │
│   ├── Claude creates ADRs for architecture decisions              │
│   └── Claude adds discoveries to relevant vault notes             │
│                                                                   │
│   BETWEEN SESSIONS (automated)                                    │
│   │                                                               │
│   └── QMD cron (every 30 min) reindexes vault                    │
│       ├── New session logs become searchable                      │
│       ├── Updated project notes are indexed                       │
│       └── New discoveries are findable                            │
│                                                                   │
│   NEXT SESSION STARTS (richer context)                            │
│   └── ← back to top                                              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## What Flows Where

| Data | From | To | Trigger | Example |
|---|---|---|---|---|
| Coding standards | Agent Context/Conventions/ | Claude's behavior | Claude reads before coding | Reading `Error Handling.md` before writing try/catch patterns |
| Past session context | Session Log/ | Current session via QMD | QMD search at session start | Searching "letmescale auth" to find past decisions |
| Project status | Trajan's Projects/ | Claude's awareness | Read at session start | Reading `ExecuDeck.md` for current phase and blockers |
| Session learnings | Claude's work | Session Log/ | Claude writes at session end | Writing `2026-03-11 - Vault Integration Setup.md` |
| Architecture decisions | Claude's reasoning | Session Log/ (ADRs) | When decisions are made | Creating `ADR-0001 - Choose FalkorDB over Neo4j.md` |
| Project progress | Claude's work | Trajan's Projects/ | Updated during/after work | Adding "Phase 2 complete" to project note |
| Tool discoveries | Claude's research | AI Knowledge/ | When new tools are found | Creating a note when Claude discovers a new npm package |
| Config changes | Claude's setup work | System Setup/ | When system config changes | Updating this section after modifying mcp.json |
| Vault search index | All vault files | QMD database | Cron every 30 min | New session log becomes searchable within 30 minutes |

## Access Paths (Priority Order)

Claude can reach the vault three ways. Use whichever is available:

1. **Direct filesystem** — Always works. Read/Write to `~/Documents/obsidian_first_stuff/twj1/`. No dependencies.
2. **QMD MCP** — Semantic search. Best for finding relevant context across the vault. Available when QMD daemon is running.
3. **obsidian-claude-code-mcp** — WebSocket on port 22360. Rich tools (view, create, edit). Only when Obsidian is open.

## Enforcement Architecture (Revised 2026-03-13)

The loop is enforced at three levels:

1. **Global CLAUDE.md** (~80 lines) — loaded every session, inlines key conventions, references Agent Context for depth
2. **Per-project CLAUDE.md** (17 projects) — reminds Claude about vault integration even in project directories
3. **Stop hook** — `check-session-log.sh` fires at session end, warns if no session log written today
4. **QMD cron** — reindexes every 30 minutes, making new writes searchable for next session

Previous architecture (260-line CLAUDE.md, no hooks, no per-project stubs) had zero enforcement — agents ignored vault rules because instructions were too long and there was no mechanism to check compliance.

## Growth Patterns

### Organic Growth (every session)
- Session logs accumulate → richer cross-session memory
- Project notes update → better project awareness
- Gotchas and fixes captured → fewer repeated mistakes

### Curated Growth (periodic, by Trajan)
- New conventions added to Agent Context/Conventions/
- New prompts added to Agent Context/Prompts/
- New tools evaluated in AI Knowledge/
- Workflows refined based on emerging patterns

### Maintenance (periodic)
- Archive old session logs (> 90 days → `Session Log/Archive/`)
- Prune outdated tool notes from AI Knowledge/
- Update conventions when standards evolve
- Verify QMD is indexing correctly

## Failure Modes

| What Breaks | Impact | Recovery |
|---|---|---|
| QMD cron stops | No semantic search, context degrades | `crontab -e` and verify entry |
| Obsidian not running | No MCP bridge, no sidebar | Use filesystem + QMD instead |
| Node v22 removed | QMD and CloudCLI stop | Reinstall via nvm |
| Vault moved | All paths break | Update ~/.claude/CLAUDE.md and QMD collection |
| Session logs bloat | QMD slows down | Archive old logs |

#system #data-flow #feedback-loop
