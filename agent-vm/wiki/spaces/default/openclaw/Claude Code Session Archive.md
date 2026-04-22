---
title: "Claude Code Session Archive"
type: reference
created: 2026-04-06
tags: [claude-code, sessions, history, archive]
summary: "Guide to accessing 2,589 Claude Code sessions (582MB) across 10+ projects, with 108 summaries and full session catalog"
---

# Claude Code Session Archive

## Overview

| Metric | Value |
|--------|-------|
| Total session JSONL files | 2,589 |
| Total size | 582 MB |
| Date range | March 13 - April 6, 2026 |
| Session summaries | 108 (exported Mar 25) |
| Projects with sessions | 10+ |
| Command history entries | ~2,000 |

## Access Methods

### 1. Project Session JSONL Files (Primary)

**Path:** `/home/trajan/.claude/projects/{project-slug}/{session-uuid}.jsonl`

```bash
# List all sessions for the home project
ls /home/trajan/.claude/projects/-home-trajan/*.jsonl | wc -l

# Read a specific session
cat /home/trajan/.claude/projects/-home-trajan/{uuid}.jsonl | head -20

# Resume any session
claude --resume {session-uuid}

# Search across all sessions for a keyword
grep -l "keyword" /home/trajan/.claude/projects/-home-trajan/*.jsonl
```

#### Session JSONL Format
```json
{"type":"permission-mode","permissionMode":"bypassPermissions","sessionId":"uuid"}
{"type":"file-history-snapshot","messageId":"uuid","snapshot":{...}}
{"type":"summary","summary":"Compressed conversation context...","messageId":"uuid"}
{"role":"user","content":[{"type":"text","text":"user message"}]}
{"role":"assistant","content":[{"type":"text","text":"response"}],"model":"claude-opus-4-6"}
```

### 2. Exported Session Catalog (Pre-built Index)

**Path:** `/home/trajan/vault/Claude-Code-Sessions/`

| File | Size | Content |
|------|------|---------|
| sessions.json | 1 MB | Comprehensive JSON index of all 2,479 sessions |
| Session-History-Index.md | 1 KB | Wiki index with category links |
| core-home.md | 324 KB | 1,485 sessions from home project |
| skills.md | 84 KB | 414 sessions from skills projects |
| application-projects.md | 4.2 KB | 17 sessions from app projects |
| other.md | 6.5 KB | 58 uncategorized sessions |
| temporary.md | 3.4 KB | 14 temp workspace sessions |
| infrastructure.md | 1.1 KB | 3 infra sessions |
| tools-utils.md | 2.4 KB | 9 utility sessions |

Each markdown file lists sessions with: timestamp, session ID, size, message count, first message preview, and `claude --resume` command.

### 3. Session Summaries (Human-readable)

**Path:** `/home/trajan/vault/Session Summaries/`
- 108 markdown files (460 KB total)
- Batch exported on March 25, 2026
- Format: `{uuid}.md` with topic, key messages, and source reference

### 4. Command History

**Path:** `/home/trajan/.claude/history.jsonl`
```json
{"display":"command text","timestamp":1773390256742,"project":"/home/trajan","sessionId":"uuid"}
```

### 5. File History (Change Tracking)

**Path:** `/home/trajan/.claude/file-history/`
- 433 files (8.4 MB)
- Tracks file changes and backups across sessions

## Sessions by Project

| Project | Sessions | Size | Description |
|---------|----------|------|-------------|
| `-home-trajan` | 1,969 | ~400 MB | Main development, all orchestration |
| `-home-trajan-skills-agent-tester` | 412 | ~100 MB | Agent testing framework |
| `-` (root) | 94 | ~30 MB | Root directory sessions |
| `-home-trajan-hate-my-brother-dev` | 15 | ~5 MB | Side project |
| `-home-trajan-Desktop-Coding-Projects-execudeck` | 11 | ~3 MB | ExecuDeck project |
| `-home-trajan-Projects-agent-os-demo-pages` | 10 | ~3 MB | Agent OS demo |
| `-home-trajan-Desktop-Proslync-documentation` | 9 | ~2 MB | Proslync docs |
| `-home-trajan-Desktop-Coding-Projects-claude-remote-discord` | 9 | ~2 MB | Discord bot |
| `-home-trajan-vault` | 8 | ~2 MB | Vault operations |
| `-home-trajan-Projects-ema-daemon` | 8 | ~2 MB | EMA development |

## Subagent Sessions

Many sessions spawned subagents stored as:
**Path:** `/home/trajan/.claude/projects/{project}/subagents/agent-a{hash}.jsonl`
**Meta:** Paired `.meta.json` files track subagent status and parent session.

## Querying Sessions

```bash
# Find sessions that mention a topic
grep -rl "EMA" /home/trajan/.claude/projects/-home-trajan/*.jsonl | wc -l

# Get session sizes sorted
ls -lS /home/trajan/.claude/projects/-home-trajan/*.jsonl | head -20

# Extract all user messages from a session
python3 -c "
import json, sys
for line in open(sys.argv[1]):
    d = json.loads(line)
    if d.get('role') == 'user':
        for c in d.get('content', []):
            if c.get('type') == 'text':
                print(c['text'][:200])
                print('---')
" /path/to/session.jsonl

# Find sessions by date (from filename timestamps)
ls -lt /home/trajan/.claude/projects/-home-trajan/*.jsonl | head -20
```

## Related

- [[OpenClaw Session Archive]]
- [[Codex Session Archive]]
- [[OpenClaw System Overview]]
