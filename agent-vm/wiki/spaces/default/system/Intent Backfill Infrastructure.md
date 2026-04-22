---
title: "Intent Backfill Infrastructure"
type: architecture
status: active
created: 2026-04-04
updated: 2026-04-04
tags: [intent, backfill, infrastructure, wiki, superman, openclaw, claude, codex]
summary: "Pipeline and source manifest for recovering intents from old wiki/vault material and local message/session history into the wiki intent layer."
---

# Intent Backfill Infrastructure

## Goal

Recover historical intent from old wiki pages, Superman/vault artifacts, OpenClaw message/session history, Claude project logs, and Codex history into a durable wiki-native intentions state.

## Current Builder

- Script: `/home/trajan/.openclaw/agents/main/workspace/scripts/build_intentions_state.py`
- Output dir: `/home/trajan/wiki/spaces/default/system/intent-state`
- Canonical pages remain under `wiki/spaces/default/intents/`
- Aggregate state page: [[Intentions State]]

## Source Tiers

1. **Canonical wiki intent pages** — existing ground truth intent pages already in the wiki
2. **Legacy intent registry** — `vault/System/intent-registry.json`
3. **OpenClaw sessions** — user turns from `.openclaw/agents/*/sessions/*.jsonl`
4. **Claude project logs** — user turns from `.claude/projects/**/*.jsonl`
5. **Codex history + sessions** — `.codex/history.jsonl` plus OpenClaw codex session logs
6. **Direct Discord API backfill** — next phase; not yet executed by the local builder

## Recovery Model

- Extract only **user-authored asks / requests / directives**
- Ignore wrappers, transport metadata, and subagent boilerplate
- Classify each recovered text with `intelligence/intent_parser.py`
- Write machine-readable state into `system/intent-state/`
- Preserve existing wiki intents as canonical while using recovered records as evidence

## Current Coverage

| Source | Count |
|---|---:|
| claude_project | 484 |
| codex_history | 8 |
| codex_session | 13 |
| local_markdown_resource | 285 |
| openclaw_session | 305 |
| vault_registry | 1 |
| wiki_intent | 4 |

## Local Resource Expansion

- The builder now scans local markdown architecture/spec/roadmap resources across workspace, vault, and wiki.
- It uses curated path filters plus keyword matching so plans, integration docs, and system design notes become intent evidence.
- This is intentionally broader than the first seed pass and should keep enriching the state even before direct Discord history is added.

## Next Step to Finish Discord Backfill Properly

Add a chunked Discord history runner that pages through `message.read` by channel and writes raw message dumps into a local raw-data directory. Then point this same builder at that raw directory so Discord becomes first-class instead of inferred through OpenClaw session mirrors.

## Run

```bash
python3 /home/trajan/.openclaw/agents/main/workspace/scripts/build_intentions_state.py
```

## Why This Shape

This keeps the wiki as the durable source of truth, lets Superman consume a real intention state now, and avoids waiting on a perfect historical Discord export before the rest of the system can move.

