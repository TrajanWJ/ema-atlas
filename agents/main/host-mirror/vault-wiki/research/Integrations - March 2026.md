---
title: March 2026 Integrations — GitHub Intel Deep Dive
type: research
created: '2026-03-18'
tags:
  - integrations
  - github-intel
  - chop
  - mcp
  - memory
  - agent-tooling
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
summary: >-
  Real integrations executed from github-interesting deep dive analysis. chop
  installed, sqlite-memory-mcp added, iris-eval-mcp added, mem.sh typed memory,
  harness-init.sh project state, workflow files.
key_topics:
  - chop
  - sqlite-memory-mcp
  - iris-eval
  - mem-sh
  - harness-init
  - typed-memory
  - token-compression
source: research
updated: '2026-03-18'
wiki_id: research/Integrations_-_March_2026
imported_from: vault/Research/Integrations - March 2026.md
imported_at: '2026-04-04T00:23:57.090Z'
---

# March 2026 Integrations

Executed from deep analysis of github-interesting + priority repo history.

## Shipped

### 1. chop — CLI Output Compressor
- **Repo:** https://github.com/AgusRdz/chop
- **Installed at:** `/home/trajan/bin/chop`
- **Status:** Live in Claude Code via PreToolUse hook in `~/.claude/settings.json`
- **Impact:** 50-90% token reduction on CLI output. Prevents early context compaction.
- **Pattern:** Go binary, hooks into Claude Code PreToolUse, compresses before API call

### 2. sqlite-memory-mcp — WAL-Safe Persistent Memory
- **Repo:** https://github.com/RMANOV/sqlite-memory-mcp
- **Installed at:** `/home/trajan/tools/sqlite-memory-mcp/`
- **MCP server:** `sqlite-memory` in `~/.claude/mcp.json`
- **DB:** `~/.claude/memory/memory.db`
- **Impact:** 21 MCP tools, WAL-safe for 10+ concurrent sessions, FTS5 BM25 search, task kanban

### 3. iris-eval-mcp — Agent Observability
- **Repo:** https://github.com/iris-eval/mcp-server
- **MCP server:** `iris-eval` in `~/.claude/mcp.json`
- **Impact:** Per-tool-call traces, cost in USD, 12 eval rules, web dashboard. Zero-SDK.

### 4. mem.sh — Typed Memory CLI
- **Inspired by:** https://github.com/ZenSystemAI/multi-agent-memory
- **Location:** `/home/trajan/bin/mem.sh`
- **Types:** fact (upsert), event (append), decision (append), status (update-in-place)
- **Storage:** `~/vault/System/memory/{facts,events,decisions,statuses}/`

### 5. harness-init.sh — Project State Tracker
- **Inspired by:** https://github.com/Phlegonlabs/Harness-Engineering-skills
- **Location:** `/home/trajan/bin/harness-init.sh`
- **Creates:** `.harness/state.json` + `docs/PRD.md` + `docs/PROGRESS.md`

### 6. Workflow Files (natural language)
- **Location:** `~/.openclaw/agents/main/workspace/workflows/`
- `skill-audit.md`, `vault-weekly.md`, `repo-deep-dive.md`
- Inspired by [[gh-aw]] — write workflows as markdown, run as agent instructions

## Skipped

### graph-memory
- Container has glibc/musl incompatibility with onnxruntime. Config saved at `/home/trajan/docker/graph-memory/`.

### multi-agent-memory
- Requires OpenAI key. mem.sh covers the pattern without it.

## Key Takeaways

1. **chop** = highest-ROI integration. Immediate, live, 50-90% CLI token savings.
2. **Typed memory** (fact/event/decision/status) > flat MEMORY.md. Clear lifecycle semantics.
3. **Repo-backed state** (Harness pattern) = planning that survives session death.
4. **iris-eval** = first real observability layer. Cost + quality + PII scanning.
5. **Workflow markdown** = agent instructions that live in the repo, not in ephemeral context.

## Related

- [[integrations-march-2026]]
- [[claude-code-2026-march-sonnet46-system-prompt]]
- [[5-day-analysis-2026-03-18]]
