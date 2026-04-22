---
title: "OpenClaw Session Archive"
type: reference
created: 2026-04-06
tags: [openclaw, archived, sessions, history, lcm]
summary: "Complete guide to accessing 4,402 conversations and 175K messages from the OpenClaw LCM database and agent session logs"
---

# OpenClaw Session Archive

## Overview

| Metric | Value |
|--------|-------|
| Total conversations | 4,402 |
| Total messages | 175,443 |
| User messages | 21,586 |
| Assistant messages | 82,654 |
| Tool calls | 68,730 |
| Context summaries | 2,473 |
| Unique sessions | 4,402 |
| Date range | March 16 - April 6, 2026 |
| Session JSONL files | 1,147 |
| Total session data | ~1.2 GB |

## Access Methods

### 1. LCM Database (Primary Source)

**Path:** `/home/trajan/archive/openclaw/config/.openclaw/lcm.db`
**Size:** 1.4 GB | **Format:** SQLite with FTS5

```bash
# Open the database
sqlite3 /home/trajan/archive/openclaw/config/.openclaw/lcm.db

# Count conversations
SELECT COUNT(*) FROM conversations;

# Get conversations by day
SELECT date(created_at) as day, COUNT(*) as convos 
FROM conversations GROUP BY day ORDER BY day;

# Get messages for a specific conversation
SELECT role, substr(content, 1, 200) as preview, timestamp
FROM messages WHERE conversation_id = ?
ORDER BY timestamp;

# Search message content (FTS5)
SELECT * FROM messages_fts WHERE messages_fts MATCH 'search query';

# Get summaries (compressed context)
SELECT content FROM summaries WHERE conversation_id = ? ORDER BY created_at;
```

#### Database Schema

**conversations**: `conversation_id`, `session_id`, `title`, `created_at`, `updated_at`
**messages**: `id`, `conversation_id`, `role` (user/assistant/system/tool), `content`, `timestamp`, `token_count`, `reasoning`
**message_parts**: Structured content blocks within messages
**summaries**: `summary_id`, `conversation_id`, `kind` (leaf/condensed), `depth`, `content`, `token_count`, `earliest_at`, `latest_at`
**context_items**: Additional context attached to conversations
**large_files**: Binary/large content stored separately

### 2. Agent Session JSONL Files

**Path:** `/home/trajan/archive/openclaw/config/.openclaw/agents/{agent}/sessions/`

Each agent has its own session directory with JSONL event logs.

#### Session JSONL Format
```json
{"type":"session","version":3,"id":"session-uuid","timestamp":"2026-04-05T...","cwd":"/path"}
{"type":"model_change","id":"...","provider":"anthropic","modelId":"claude-sonnet-4-6"}
{"type":"thinking_level_change","level":"high"}
{"type":"message","id":"...","message":{"role":"user","content":[{"type":"text","text":"..."}]}}
{"type":"message","id":"...","message":{"role":"assistant","content":[...],"usage":{"input":1234,"output":567}}}
```

#### Agent Session Sizes

| Agent | Files | Size | Description |
|-------|-------|------|-------------|
| main | 552 | 1.1 GB | Primary orchestrator, all user interactions |
| researcher | 50 | 59 MB | Deep research tasks |
| coder | 95 | 24 MB | Code generation and debugging |
| ops | 39 | 13 MB | Infrastructure and deployment |
| concierge | 26 | 12 MB | User assistance coordination |
| codex | 22 | 10 MB | OpenAI Codex agent sessions |
| browser-automation | 12 | 9.5 MB | Web browsing tasks |
| strategist | 17 | 2.4 MB | Strategic planning |
| prompt-engineer | 16 | 2.4 MB | Prompt optimization |
| tech-lead | 4 | 2.1 MB | Technical leadership |
| vault-keeper | 8 | 1.7 MB | Vault maintenance |
| architect | 8 | 1.6 MB | Architecture design |
| devils-advocate | 9 | 964 KB | Critical analysis |
| security | 4 | 776 KB | Security analysis |
| quality-lead | 5 | 160 KB | QA and testing |
| pm | 2 | 180 KB | Product management |
| analyst | 2 | 52 KB | Data analysis |
| chief-of-staff | 2 | 24 KB | Executive coordination |

#### Reading Session Files
```bash
# List all sessions for an agent
ls /home/trajan/archive/openclaw/config/.openclaw/agents/main/sessions/*.jsonl

# Read a session's messages
cat session.jsonl | jq -r 'select(.type=="message") | .message.role + ": " + (.message.content[0].text // "")' 

# Count messages per session
for f in *.jsonl; do echo "$f: $(grep -c '"type":"message"' "$f") messages"; done
```

### 3. Session Index Files

Each agent has a `sessions.json` index:
**Path:** `/home/trajan/archive/openclaw/config/.openclaw/agents/{agent}/sessions/sessions.json`

Contains session metadata, configuration snapshots, and routing information.

## Daily Activity Distribution

| Date | Conversations | Notes |
|------|--------------|-------|
| Mar 16 | 191 | Foundation day, first agent buildout |
| Mar 17 | 47 | Post-mortem, stabilization |
| Mar 18 | 208 | Normal operations |
| Mar 19 | 190 | Normal operations |
| Mar 20 | 255 | Peak weekday activity |
| Mar 21 | 1 | Quiet day |
| Mar 22 | 166 | Weekend work |
| Mar 23 | 73 | Light day |
| Mar 24 | 142 | Normal |
| Mar 25 | 230 | High activity |
| Mar 26 | 89 | Light |
| Mar 27 | 139 | Normal |
| Mar 28 | 134 | Normal |
| Mar 29 | 138 | Normal |
| Mar 30 | 150 | Normal |
| Mar 31 | 231 | End of month push |
| Apr 1 | 234 | Start of April |
| Apr 2 | 173 | Normal |
| Apr 3 | 359 | EMA architecture marathon (6h session) |
| Apr 4 | **851** | **Peak day** -- major engineering session, 10 commits |
| Apr 5 | 378 | Engine recovery, parallel dispatch |
| Apr 6 | 23 | Final day (partial) |

## Summary Content Examples

The LCM summaries contain compressed conversation context. Examples of captured knowledge:
- Session bloat diagnosis and fix (session-health.sh creation)
- Agent dispatch patterns and feed channel setup
- System buildout night documentation (11 agents, 37 skills, 10 crons)
- Discord channel architecture decisions
- Multi-agent coordination patterns

## Related

- [[OpenClaw System Overview]]
- [[OpenClaw Agent Performance]]
- [[OpenClaw Daily Operations Log]]
- [[Claude Code Session Archive]]
- [[Codex Session Archive]]
