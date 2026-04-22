---
id: "f96c8ad8-39b3-4f02-9199-017718f3add5"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Repowise Patterns
tags: [research, cross-pollination, repowise, codebase-intelligence]
source: session-2026-04-07
---

# Repowise — Codebase Intelligence Patterns

## Four Intelligence Layers (steal all)
1. **Graph Intelligence** — Tree-sitter AST → NetworkX dependency graphs → PageRank critical symbols → community detection
2. **Git Intelligence** — Hotspot files (high churn + complexity), co-change pairs, ownership %
3. **Documentation Intelligence** — Auto-generated wiki with confidence scoring that decays as code changes
4. **Decision Intelligence** — Architectural decisions extracted from git history, linked to governed code

## Task-Oriented MCP Tools (steal design philosophy)
Instead of entity-based (read_file, search_code), use task-based:
- get_overview, get_context, get_risk, get_why, search_codebase
- get_dependency_path, get_dead_code, get_architecture_diagram

## Auto-Documentation Decay
CLAUDE.md auto-refreshes after each commit. Confidence scores degrade as code changes. Self-healing documentation.

## Dead Code Detection
Pure graph traversal (no LLM calls, <10 seconds). Finds unreachable code via import graph analysis.

## Memory Consolidation (from claude-code-prompts)
Four-layer memory: CLAUDE.md → Auto Memory → Session Memory → Auto Dream
- First extraction at ~10K tokens
- Updates every ~5K tokens or 3 tool calls
- Auto-dream keeps index under 200 lines
- Four-phase: Orient → Gather Signal → Consolidate → Prune
