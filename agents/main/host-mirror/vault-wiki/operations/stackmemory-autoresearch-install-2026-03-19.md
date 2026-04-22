---
title: StackMemory + Autoresearch Install Log
created: '2026-03-19'
type: playbook
tags:
  - stackmemory
  - autoresearch
  - install
  - mcp
wiki_id: operations/stackmemory-autoresearch-install-2026-03-19
imported_from: vault/Operations/stackmemory-autoresearch-install-2026-03-19.md
imported_at: '2026-04-04T00:23:56.860Z'
summary: ''
---

# StackMemory + Autoresearch Pattern Install — 2026-03-19

## StackMemory

**Version installed:** 1.8.1 (via npm global)
**Path:** ~/.npm-global/bin/stackmemory

**Status after setup:**
- ✅ Project initialized (SQLite, ~/home)
- ✅ MCP registered in Claude Code config.json
- ✅ 57 MCP tools loaded
- ✅ 4 Claude hooks registered
- ⚠️ Linear API key not set (optional)
- ⚠️ Hook daemon not started (start with: stackmemory hooks start)

**Wrapper scripts available:** claude-sm, claude-smd, codex-sm, opencode-sm

**To restart after reboot:** `export PATH="$HOME/.npm-global/bin:$PATH"` (added to ~/.bashrc)

## Autoresearch Pattern

**Files created:**
- `~/bin/parallel-dispatch.sh` — bounded parallel task runner (max 4 concurrent), results to ~/dispatch/results.tsv
- `~/bin/autoresearch-loop.sh` — research loop with vault cache check, max 3 parallel
- `~/vault/Architecture/autoresearch-pattern.md` — full pattern documentation
- `~/dispatch/research-queue.txt` — sample queue file

**Pattern summary:** Screen cheap (vault check), research if novel, implement only on confirmed value. Bounded concurrency. Never stop.
