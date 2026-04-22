---
title: GitNexus Installation
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: system-generated
tags:
  - knowledge
  - mcp
  - openclaw
  - prompts
  - research
  - skills
summary: >-
  Graph-powered code intelligence for AI agents. Indexes codebases into a
  knowledge graph (KuzuDB) with symbols, relationships, execution flows, and clu
wiki_id: research/GitNexus_Installation
imported_from: vault/Research/GitNexus Installation.md
imported_at: '2026-04-04T00:23:57.038Z'
---
# GitNexus Installation

**Date:** 2026-03-16
**Status:** ✅ Installed & Configured
**Version:** 1.4.1

## What Is GitNexus

Graph-powered code intelligence for AI agents. Indexes codebases into a knowledge graph (KuzuDB) with symbols, relationships, execution flows, and clusters. Exposes this via CLI tools and an MCP server for Claude Code integration.

**License:** PolyForm Noncommercial 1.0.0
**Repo:** https://github.com/abhigyanpatwari/GitNexus

## Installation

```bash
sudo npm install -g gitnexus  # v1.4.1
```

Installed globally at `/usr/lib/node_modules/gitnexus/`. Had to `chmod +x` the CLI entry point after install.

## Indexed Repositories

### `/home/trajan/skills` ✅
- **345 files** | **1,123 symbols** | **1,980 edges** | **85 clusters** | **71 execution flows**
- Indexing took 6.4s (KuzuDB 2.9s, FTS 2.9s)
- Embeddings disabled (can enable with `--embeddings` flag)
- Auto-generated: `AGENTS.md`, `CLAUDE.md`, `.claude/skills/gitnexus/` (6 skill files for Claude Code)

### `/home/trajan/.openclaw/agents/main/workspace` ❌
- Workspace is mostly markdown (SOUL.md, AGENTS.md, etc.) — no code to index
- GitNexus crashes with LRU cache error when no parseable code files exist (bug in v1.4.1: `createASTCache(0)` fails)

## MCP Server Configuration

Added via Claude Code's built-in MCP management:

```bash
claude mcp add gitnexus -- npx -y gitnexus@latest mcp
```

This added the MCP server to the project-level config at `~/.claude.json` (scoped to the workspace project). The MCP server runs via stdio and serves **all indexed repos** — so the skills index is accessible from any Claude Code session.

## Available Tools

### CLI Commands
| Command | Purpose |
|---|---|
| `gitnexus analyze [path]` | Index a repository (full analysis) |
| `gitnexus query <search>` | Search knowledge graph for execution flows |
| `gitnexus context [name]` | 360° view of a symbol (callers, callees, processes) |
| `gitnexus impact <target>` | Blast radius analysis (what breaks if you change something) |
| `gitnexus list` | List all indexed repos |
| `gitnexus status` | Show index status for current repo |
| `gitnexus wiki [path]` | Generate repository wiki from knowledge graph |
| `gitnexus mcp` | Start MCP server (stdio) |
| `gitnexus serve` | Start HTTP server for web UI |
| `gitnexus cypher <query>` | Raw Cypher query against graph |
| `gitnexus clean` | Delete index for current repo |

### MCP Tools (available in Claude Code)
- `gitnexus_query` — Find execution flows related to a concept
- `gitnexus_context` — Full context for a symbol (callers, callees, process participation)
- `gitnexus_impact` — Blast radius analysis before editing
- `gitnexus_detect_changes` — Verify changes only affect expected symbols (pre-commit)
- Resource URIs like `gitnexus://repo/skills/process/{processName}` for tracing flows

## Verification Results

All three core tools tested successfully against `/home/trajan/skills`:

1. **`query "agent collaboration"`** — returned 5 processes, 20 definitions including [[multi-agent-collaboration]] classes, [[intelligent-delegation]] scoring functions, [[personality-dynamics]] generators
2. **`context handleTranscript`** — showed symbol in `discord-voice/index.ts:218-322`, outgoing calls to `getSession`, `ensureVoiceManager`, `loadCoreAgentDeps`, `sanitizeNoEmojiHint`, participation in 2 processes
3. **`impact handleTranscript`** — returned LOW risk, 0 upstream callers (entry point function)

## Auto-Generated Files

GitNexus created Claude Code integration files in the skills repo:
- `AGENTS.md` — instructions for Claude Code to use GitNexus tools
- `CLAUDE.md` — project context with GitNexus usage guidelines  
- `.claude/skills/gitnexus/` — 6 skill directories:
  - `gitnexus-cli` — CLI [[usage patterns]]
  - `gitnexus-debugging` — Debugging workflow with GitNexus
  - `gitnexus-exploring` — Code exploration patterns
  - `gitnexus-guide` — General guide
  - `gitnexus-impact-analysis` — Impact analysis workflow
  - `gitnexus-refactoring` — Refactoring with blast radius checks

## Usage Notes

- **Re-index after code changes:** `cd /home/trajan/skills && gitnexus analyze`
- **Enable semantic search:** `gitnexus analyze --embeddings` (requires more resources)
- **Force full re-index:** `gitnexus analyze --force`
- **The workspace repo has no code** — GitNexus is only useful for repos with actual source files (JS/TS/Python etc.)
- **Node.js compatibility:** Works with Node 22 but has an edge case bug where repos with 0 parseable files crash

## Known Issues

1. **LRU Cache bug with empty repos:** When a git repo has no parseable code files, `createASTCache(0)` is called with maxSize=0, which violates LRU cache's requirement for `max > 0`. Filed mentally — avoid running `analyze` on markdown-only repos.
2. **Permission issue on install:** The CLI binary at `dist/cli/index.js` doesn't get +x permission during `npm install -g`. Needs manual `chmod +x`.

## Links

- [[Reference/System Services|Claude Code MCP Servers]]
- [[Skills/README|Skills Directory Structure]]
