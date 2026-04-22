# Workflow: Session Memory

How session logs and QMD create cross-session memory for Claude Code.

---

## The Memory Stack

```
Claude Code session (conversation + tool use)
       ↓ (SessionEnd hook)
sync-claude-sessions → converts JSONL to clean markdown
       ↓
Session Log/ in vault → human-readable session summaries
       ↓
QMD indexes (BM25 keyword + vector embeddings)
       ↓
Next session: qmd search / vsearch → pulls relevant past context
       ↓
claude-mem (optional) → cross-session observations (SQLite + ChromaDB)
```

## Automatic Flow

### During a Session
- Claude Code records all tool invocations and responses in JSONL transcript
- claude-mem (if installed) captures observations via hooks
- Session transcript lives at `~/.claude/projects/{project}/{sessionId}/`

### At Session End
1. **vault-optimizer agent** dispatched (forced by CLAUDE.md rules)
   - Checks if session log exists for today — creates one if missing
   - Cross-references new notes with existing vault content
   - Updates MOC/index entries for any new files
   - Dispatch: `Agent(prompt="Read ~/.claude/agents/vault-optimizer.md. Run all 6 optimization passes.")`
2. **Session summary** created in `Session Log/` using [[Session Summary Template]]
   - File name: `YYYY-MM-DD - Brief Title.md`
   - Captures: what was done, decisions, blockers, next steps
3. **Stop hook** fires — `check-session-log.sh` warns if no log was written today
4. **QMD re-indexes** (cron every 30 min) — picks up new vault content
   ```bash
   qmd update && qmd embed
   ```

### At Next Session Start
1. **Context recovery** via QMD:
   ```bash
   # Semantic search for past context
   qmd vsearch "what did I decide about authentication?"

   # Keyword search for specific terms
   qmd search "ExecuDeck command palette"
   ```
2. **claude-mem injection** (if installed) — automatically injects compressed context from last 10 sessions
3. **Manual recovery** — read the most recent session log directly:
   ```
   Read the most recent session log for [project] and summarize
   where we left off and what the next steps are.
   ```

## Manual Flow

Some knowledge is too important to rely on automatic indexing:

| Event | Action | Where |
|---|---|---|
| Interesting finding | Create vault note | `AI Knowledge/` (see [[Workflow - Knowledge Growth]]) |
| Decision made | Create ADR | `Session Log/` using [[Decision Record Template]] |
| New pattern learned | Create skill | Via `superpowers:writing-skills` |
| Bug with workaround | Log in session summary | `Session Log/` using [[Session Summary Template]] |
| Project milestone | Update project note | `Trajan's Projects/` |

## Search Modes

| Mode | Command | Use Case | Example |
|---|---|---|---|
| Semantic | `qmd vsearch "query"` | Natural language questions | "What did I decide about state management?" |
| Keyword | `qmd search "term"` | Specific term lookup | "Zustand" |
| Temporal | `qmd search --after 2026-03-01` | Recent sessions | "What did I work on this week?" |
| Vault | Obsidian search or Glob | Find notes by tag/location | Notes tagged `#architecture` |
| MCP | Obsidian MCP bridge | From within Claude Code | Read vault notes during coding |

## Session Summary Best Practices

A good session summary enables future context recovery. Include:

### Must Have
- **Date and project** — which project, which day
- **What was accomplished** — completed tasks, files changed
- **Decisions made** — choices and their rationale
- **Next steps** — exact next action for the next session (handover)

### Should Have
- **Blockers** — anything unresolved that blocks progress
- **Discoveries** — new tools, patterns, or insights found
- **Links** — wikilinks to relevant vault notes, ADRs, plans

### Avoid
- **Full code dumps** — the git history has the code; the summary explains the why
- **Vague entries** — "worked on stuff" is not useful; "implemented CommandPalette toggle with Ctrl+K shortcut in `src/components/CommandPalette.tsx`" is
- **Missing next steps** — every summary must end with what to do next

## Cross-Session Memory Architecture

```
Session 1                    Session 2                    Session 3
    │                            │                            │
    ├─ transcript (JSONL)        ├─ reads Session 1 log       ├─ reads Session 2 log
    ├─ session log (vault)       ├─ QMD search for context    ├─ QMD search for context
    ├─ QMD indexed               ├─ transcript (JSONL)        ├─ continues from handover
    └─ handover notes            ├─ session log (vault)       └─ ...
                                 ├─ QMD indexed
                                 └─ handover notes
```

Each session can access:
- **Its own context** — conversation history within the session
- **Previous sessions** — via QMD search and vault session logs
- **Vault knowledge** — via MCP bridge to Obsidian (port 22360)
- **Compressed history** — via claude-mem's cross-session observations

## Maintaining the Memory System

### Weekly
- [ ] Verify QMD is indexing new sessions: `qmd search "this week's topic"`
- [ ] Check that session logs exist in `Session Log/` for each work day
- [ ] Clean up any empty or duplicate session exports

### Monthly
- [ ] Review QMD index size and prune if needed
- [ ] Archive old session exports (older than 3 months) to reduce index size
- [ ] Verify claude-mem database is not growing unbounded (if installed)

### If Memory Seems Broken
1. Check sync-claude-sessions is running: look for recent exports
2. Check QMD index: `qmd search "recent known topic"` should return results
3. Re-index if needed: `qmd update && qmd embed`
4. Verify MCP bridge is running on port 22360

## See Also

- [[Workflows MOC]]
- [[QMD]] — the search and embedding engine
- [[sync-claude-sessions]] — session export tool
- [[claude-mem]] — cross-session observation system
- [[Session Summary Template]] — format for session logs
- [[Workflow - Daily Development]] — where session memory fits in daily work

#workflow #memory #sessions
