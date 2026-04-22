---
title: "KAIROS Pattern — Cross-Session Memory Distillation"
type: reference
created: 2026-04-05
tags: [pattern, agent-architecture, memory, kairos, ema]
summary: "Always-on background agent that actively compresses sessions into actionable knowledge units"
---

# KAIROS Pattern — Cross-Session Memory Distillation

## The Pattern

KAIROS is a design pattern extracted from Claude Code source analysis. Unlike traditional per-invocation agents, KAIROS operates continuously in the background and **actively compresses sessions into actionable knowledge units** after each session ends.

## Key Innovation

Post-session distillation: instead of accumulating raw session logs, the agent extracts decisions, patterns, and learnings into structured vault notes. This reduces context bloat while preserving signal.

## Current Gap in EMA

EMA's infrastructure (vault + heartbeat cron) has **no automated post-session distillation step**. Knowledge is stored manually or via scan, not by active distillation.

## Implementation Options

1. **Post-session cron hook**: Reads LCM summaries → writes vault notes
2. **Heartbeat integration**: Every N heartbeats, summarize since last distillation
3. **Pipeline extension**: Extend auto-knowledge capture to pull from session transcripts

## Why This Matters

Each Claude Code session generates learnings that decay if not captured. Manual capture is inconsistent. Automated distillation ensures the vault stays current without human effort.

## Related

- [[EMA Engine Architecture]]
- [[Fleet-Mem Coordination Pattern]]
