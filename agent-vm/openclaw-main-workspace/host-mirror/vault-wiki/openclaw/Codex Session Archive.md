---
title: "Codex Session Archive"
type: reference
created: 2026-04-06
tags: [codex, openai, sessions, history, archive]
summary: "Guide to accessing 65 Codex CLI sessions (29MB) including GPT-5.4 sessions, MCP configs, and OpenClaw Codex agent data"
---

# Codex Session Archive

## Overview

| Metric | Value |
|--------|-------|
| Active sessions | 44 JSONL files |
| Archived sessions | 21 (11 active, 10 deleted) |
| Total size | ~29 MB |
| Date range | March 19 - April 6, 2026 |
| Primary model | GPT-5.4 |
| Context window | 258,400 tokens |

## Access Methods

### 1. Active Codex Sessions

**Path:** `/home/trajan/.codex/sessions/2026/{MM}/{DD}/rollout-{timestamp}-{uuid}.jsonl`

```bash
# List all sessions
find /home/trajan/.codex/sessions/ -name "*.jsonl" | sort

# List sessions by date
ls /home/trajan/.codex/sessions/2026/04/06/

# Read a session
cat /home/trajan/.codex/sessions/2026/04/06/rollout-*.jsonl | head -20
```

#### Session JSONL Format
```json
{"timestamp":"2026-04-06T02:16:26Z","type":"session_meta","payload":{"id":"uuid","cwd":"/path","cli_version":"0.115.0","model_provider":"openai","base_instructions":"..."}}
{"timestamp":"...","type":"event_msg","payload":{"role":"user","content":"..."}}
{"timestamp":"...","type":"response_item","payload":{"role":"assistant","content":"..."}}
{"timestamp":"...","type":"token_count","payload":{"input":1234,"output":567}}
{"timestamp":"...","type":"task_complete","payload":{"status":"success"}}
```

### 2. Archived OpenClaw Codex Agent Sessions

**Path:** `/home/trajan/archive/openclaw/config/.openclaw/agents/codex/sessions/`

These are sessions from when Codex ran as an OpenClaw agent (different format -- OpenClaw JSONL):

```bash
# List archived sessions
ls /home/trajan/archive/openclaw/config/.openclaw/agents/codex/sessions/*.jsonl

# Session index with metadata
cat /home/trajan/archive/openclaw/config/.openclaw/agents/codex/sessions/sessions.json
```

**Archived session sizes:**
- 5 large sessions (200KB - 1.5MB) with substantial work
- 6 small sessions (3.4KB each) -- likely test/health check sessions
- 10 deleted sessions (marked with `.deleted.TIMESTAMP.Z`)

### 3. Codex Configuration

**Path:** `/home/trajan/.codex/config.toml`

```toml
model = "gpt-5.4"
# MCP servers configured: codebase-memory-mcp, EMA, filesystem, context7, git, fetch, playwright
```

### 4. Codex Command History

**Path:** `/home/trajan/.codex/history.jsonl`
Contains session command history with timestamps and session IDs.

### 5. Codex Agent Workspace (Archived)

**Path:** `/home/trajan/archive/openclaw/config/.openclaw/agents/codex/workspace/`

Contains the Codex agent's OpenClaw workspace with:
- `IDENTITY.md`, `SOUL.md`, `AGENTS.md`, `CLAUDE.md`, `TOOLS.md`, `USER.md`
- Multiple `.bak-2026-04-03-codex*` backups showing config iteration
- `.learnings/` directory
- `skills/` directory

## Codex Configuration Details

| Setting | Value |
|---------|-------|
| Model | GPT-5.4 (gpt-5.3-codex fallback) |
| Context window | 258,400 tokens |
| CLI version | 0.115.0 |
| Auth mode | ChatGPT (Google OAuth) |
| MCP servers | 9 configured |
| Sandbox | Enabled with custom permissions |
| Rate limits | 300m primary, 10080m secondary windows |

### MCP Servers Configured
1. codebase-memory-mcp
2. EMA
3. filesystem
4. context7
5. git
6. fetch
7. playwright
8. (2 others from config)

## Session Timeline

| Period | Sessions | Notes |
|--------|----------|-------|
| Mar 19-31 | ~15 | Early exploration, setup |
| Apr 1-2 | ~5 | Light usage |
| Apr 3-5 | ~30 | Heavy usage during EMA buildout |
| Apr 6 | 4 | Current day |

## Databases

Two SQLite databases with WAL support:
- `logs_1.sqlite` (424 KB + 2.2 MB WAL) -- Execution logging
- `state_5.sqlite` (232 KB + 3.1 MB WAL) -- State management

```bash
# Query Codex logs
sqlite3 /home/trajan/.codex/logs_1.sqlite ".tables"
sqlite3 /home/trajan/.codex/state_5.sqlite ".tables"
```

## Related

- [[OpenClaw Session Archive]]
- [[Claude Code Session Archive]]
- [[OpenClaw System Overview]]
