---
type: knowledge
wiki_id: system/System_Data_Flow
imported_from: vault/System/System Data Flow.md
imported_at: '2026-04-04T00:23:57.266Z'
tags: []
summary: ''
---
# System Data Flow

> The feedback loop — how context flows between sessions and grows over time.
> Last verified: 2026-04-02

---

## Vault Metrics

| Metric | Value |
|---|---|
| **Total markdown files** | 2,922 (as of 2026-04-02) |
| **Vault size on disk** | 258 MB |
| **QMD reindex interval** | On every Write (vault-post-write.sh hook) + periodic cron |

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

Claude can reach the vault multiple ways. Use whichever is available:

1. **Direct filesystem** — Always works. Read/Write to `~/vault/`. No dependencies.
2. **vault-filesystem MCP** — `@modelcontextprotocol/server-filesystem` serving `~/vault`. Standard MCP filesystem tools.
3. **QMD MCP** — Semantic search. Best for finding relevant context across the vault. Available when QMD is running.
4. **antfly MCP** — `http://localhost:8080/mcp/v1/` — vault search HTTP service.
5. **graph-memory MCP** — `http://localhost:3100/mcp/vault` — knowledge graph queries.

## Enforcement Architecture (Revised 2026-04-02)

The loop is enforced at multiple levels:

1. **Global CLAUDE.md** — loaded every session, covers test integrity, anti-sycophancy, safety gates, session scribe protocol
2. **Rules directory** (`~/.claude/rules/`) — no-rm.md, research.md, vault-ops.md, and others
3. **Ori hooks** — SessionStart (orient), PostToolUse/Write (validate + vault-post-write), Stop (capture)
4. **Letta subconscious hooks** — SessionStart, UserPromptSubmit (whisper), Stop (sync-transcript)
5. **Safety hooks** — PreToolUse Bash: `chop` + `safety-check.sh`
6. **vault-post-write.sh** — runs `qmd update` + `qmd embed` after every Write to vault, keeping search index current

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
| Vault moved | All paths break | Update ~/.claude/CLAUDE.md, mcp.json vault-filesystem path, and QMD collection |
| Session logs bloat | QMD slows down | Archive old logs |

#system #data-flow #feedback-loop
