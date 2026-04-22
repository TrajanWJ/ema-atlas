---
title: "Overnight Autonomous Proposals — 2026-03-18"
created: 2026-03-18
updated: 2026-03-18
type: project
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: agent:main
summary: "19 research proposals generated autonomously overnight covering agent architecture, knowledge quality, performance, self-learning, vault structure"
tags: [dispatch, autonomous, proposals, system-buildout]
---
# Overnight Autonomous Proposals — 2026-03-18

The dispatch engine + research-implement pipeline ran autonomously overnight and produced 19 proposals across 8 focus areas. Zero failures.

## Proposals by Focus Area

### Agent Architecture (1 proposal)
- Structured A2A communication contracts
- Hierarchical memory with per-agent persistent state
- Checkpoint-based execution with incremental progress
- Systematic context window management
- Dynamic skill composition

### Aspirational Alignment (1 proposal)
- Aspirational directory migration
- Gap report script (vault-aspiration-gap.sh)
- SOUL.md anti-pattern frequency tracker
- Aspirational-to-dispatch bridge
- Alignment heartbeat check

### Knowledge Quality (2 proposals)
- Quality score system (vault-quality-score.sh)
- Write-time quality gates (pre-commit validation)
- TODO lifecycle with expiry and escalation
- Source tiering enforcement
- Knowledge decay detection

### Performance Optimization (3 proposals)
- Mandatory incremental writes with checkpoints
- Scope budgeting before dispatch
- Wire helper scripts into dispatch-engine.sh

### Self-Learning (3 proposals)
- Close the outcome tracking loop
- Pre-dispatch reflection injection (Reflexion pattern)
- Signal-to-action evaluator (280 dormant signals)
- UCB1 bandit-based agent selection
- Human feedback capture (lightweight RLHF)
- Memory consolidation with tiered decay

### Vault Formatting (2 proposals)
- Standardize source field vocabulary
- Enforce frontmatter schema
- Fix 54 zero-wikilink files
- Normalize name vs title field

### Vault Structure (1 proposal)
- Decompose Agents/ into purpose-driven dirs
- Confidence decay + source-tier defaults
- Semantic hub MOCs
- Inbox/ as processing pipeline

## Implementation Priority (Recommended)
1. **A2A contracts** — foundation for everything else
2. **Outcome tracking** — can't improve what you don't measure
3. **Quality gates** — prevent garbage accumulating
4. **Checkpoint execution** — stop losing work on timeouts
5. **Frontmatter enforcement** — quick wins, scriptable

## Source Files
All at: `~/dispatch/results/pipeline-*-proposal.md`

## Related
- [[5-day-analysis-2026-03-18]]
- [[Aspirational Agent System]]
- [[Agent Orchestration Patterns]]
