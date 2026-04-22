---
id: "8470ecc7-dd70-4c41-9508-7382c6e6f82b"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Stolen Patterns Implementation Guide
tags: [research, implementation, cross-pollination, steal]
source: session-2026-04-07
---

# Stolen Patterns — Concrete Implementation Guide

From deep code analysis of 15+ repos. Prioritized by impact and effort.

## Tier 1: Implement This Week

### 1. Task Dependencies + Ready Filter (from task-master)
- Add `dependencies` (list of task IDs) to Task schema
- Build `Ema.Tasks.DependencyGraph` with `build_blocks_map/1` and `filter_ready/1`
- Wire into MCP next_task tool and Dispatcher
- Migration: add `dependencies` jsonb column to tasks

### 2. Vault Health Checks (from memory-compiler lint suite)
- Broken wikilinks: regex extract [[links]], check target exists
- Orphan pages: count inbound links, flag zero-inbound
- Missing backlinks: asymmetric link detection
- Sparse articles: word count excluding frontmatter
- Stale articles: hash comparison
- CLI: `ema wiki lint`

### 3. Preflight Checker for Executions (from task-master)
- Before dispatching execution: check daemon health, project path exists, git clean, claude available
- Returns structured PreflightResult with per-check pass/fail
- Prevents wasted Claude API calls on broken setups

### 4. Coverage Indicators (from llm-wiki-compiler)
- When SystemBrain generates pages, tag sections with [coverage: high/medium/low — N sources]
- High = 5+ sources, medium = 2-4, low = 0-1
- Tells agents when to trust wiki vs read raw files

## Tier 2: Implement This Sprint

### 5. Agent Safety Rules (from gstack freeze/careful)
- Add `safety_rules` to Agent schema
- PreToolUse check: destructive command detection (rm -rf, --force, DROP TABLE)
- Per-agent edit boundaries (freeze scope)
- 3-strike escalation: agent must stop after 3 failed hypotheses
- Iron law: no fixes without documented root cause

### 6. Execution Workflow State Machine (from task-master)
- Replace status string with FSM: preflight→setup→execute→review→finalize→complete
- Guard conditions prevent invalid transitions
- Auto-persist after each transition
- Attempt counting with max retries

### 7. Loop Presets for Autonomous Work (from task-master)
- Named presets: default, test-coverage, entropy, proposals, brain-dump-triage
- One task per iteration, progress file, completion signals
- CLI: `ema loop --preset proposals --iterations 5`

### 8. Blast Radius Analysis (from codesight)
- BFS through reverse import graph (alias/import/use)
- Show affected files, routes, models before changes
- Hot file detection: most-imported modules
- CLI: `ema superman blast <file>`

### 9. Agent Learnings System (from gstack)
- Per-project learnings: pitfall, pattern, preference, architecture, tool
- JSONL storage per agent, confidence scores
- Inject relevant learnings into agent context on session start
- Prune stale learnings when referenced files deleted

## Tier 3: Next Sprint

### 10. Specialist Dispatch / Review Army (from gstack)
- Specialist agent behaviors: security, performance, testing, design
- Parallel dispatch via DynamicSupervisor
- Structured JSON findings with dedup
- Adaptive gating: skip specialists that never find issues

### 11. Concept Article Generation (from llm-wiki-compiler)
- Scan for patterns spanning 3+ wiki pages
- Generate interpretive articles in concepts/ directory
- Types: recurring decisions, methodology evolution, recurring failures

### 12. Conversation-to-Knowledge Compilation (from memory-compiler)
- SessionWatcher captures sessions → daily extraction → topic compilation
- Daily logs as intermediate format
- Zero-cron: piggyback on session-end events

### 13. Checkpoint/Resume for Agent Sessions (from gstack)
- Save decisions, remaining work, branch, modified files on session end
- Resume by loading checkpoint + injecting into new session context
- Cross-branch resume for workspace handoffs
