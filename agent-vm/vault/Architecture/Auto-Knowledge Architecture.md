---
title: "Auto-Knowledge Architecture"
created: 2026-03-14
updated: 2026-04-17
type: architecture
status: active
confidence: 0.65
confidence_updated: 2026-04-17
source: auto-capture
tags: [github, knowledge, openclaw, ops, research, skills]
summary: "```"
---
# Auto-Knowledge Architecture

**Date:** 2026-03-14 (updated: 2026-04-17 — verified against crontab)
**Status:** Partially Active — some original scripts replaced by EMA v5 dispatch engine

## Pipeline (Current)

```
Session Activity
    ↓
transcript-scanner.sh (cron every 6h, flock-gated)
    ↓ mines session transcripts for knowledge
    ↓
signal-to-queue.sh (cron every 3h)
    ↓ converts signals → dispatch queue tasks
    ↓
Ontology-Sync (cron every 3h, flock-gated)
    ↓ extracts entities from new vault notes (sync.py)
    ↓
QMD Re-index (cron every 30min)
    ↓ makes new content searchable
    ↓
vault-research-loop.sh (cron every 4h)
    ↓ scans vault for gaps, generates research proposals
    ↓
proactive-task-generator.sh (cron every 2h)
    ↓ generates tasks for dispatch engine
```

> [!note] Evolved from original design
> The original capture.sh → OpenClaw notification pipeline has been replaced by the EMA v5 dispatch engine. Scripts in `~/skills/auto-knowledge/scripts/` still exist but some are no longer cron-scheduled directly. The dispatch engine now handles task execution.

## Components

| Script | Location | Cron | Status | Purpose |
|---|---|---|---|---|
| transcript-scanner.sh | ~/bin/ | 0 */6 (flock) | **ACTIVE** | Mine session transcripts for knowledge |
| signal-to-queue.sh | ~/bin/ | 0 */3 | **ACTIVE** | Convert signals → dispatch queue |
| sync.py (ontology) | ~/skills/obsidian-ontology-sync/scripts/ | 0 */3 (flock) | **ACTIVE** | Extract entities from vault notes |
| vault-research-loop.sh | ~/bin/ | 0 */4 (flock) | **ACTIVE** | Scan vault for gaps → research proposals |
| proactive-task-generator.sh | ~/bin/ | 0 */2 | **ACTIVE** | Generate tasks for dispatch |
| capture.sh | ~/skills/auto-knowledge/scripts/ | — | **NOT IN CRON** | Original capture script (superseded) |
| transcript-scanner.py | ~/skills/auto-knowledge/scripts/ | — | **NOT IN CRON** | Original scanner (replaced by .sh wrapper) |
| pattern-detector.py | ~/skills/auto-knowledge/scripts/ | — | **NOT IN CRON** | Pattern detection (may run via dispatch) |
| agent-roster-review.py | ~/skills/auto-knowledge/scripts/ | — | **NOT IN CRON** | Roster review (may run via dispatch) |
| auto-knowledge-gated.sh | ~/bin/ | — | **ACTIVE** | Usage gate wrapper |

## Principles

1. Scripts report AND act (not just suggest)
2. One vault note per capture run (cost control)
3. Pattern threshold: 5+ across 2+ days (prevent premature agent creation)
4. Don't auto-create agents — Right Hand reviews proposals
5. All scripts are self-contained (no pip, no LLM calls)
6. Usage-gated: skip when weekly remaining < 45%

## References

- [[System/System Overview]] — agent management design
- [[Operations/Usage Optimization Review]] — token cost analysis

## Related

- [[Aspirational Knowledge Loop]]
- [[Hermes Agent]]
- [[Self-Organizing Agent Architectures]]
