---
title: "README"
created: 2026-03-16
updated: 2026-03-19
type: system
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: system
tags: [discord, evolution, mcp, ops, prompts, skills]
summary: "Agent self-improvement data. All agents contribute automatically."
---
# System

Agent self-improvement data. All agents contribute automatically.

**Last updated:** 2026-03-19 02:22 UTC

## Files
- [[Usage Patterns]] — Session stats, token usage, cron health, agent usage
- [[Evolution Signals]] — Tracked signals for prompt auto-evolution (3-signal threshold)
- [[Evolution Log]] — Every self-modification to agent prompt files
- [[Devils Advocate Review]] — Quality reviews of new agents/skills
- [[Discord Server Map]] — Channel/category structure
- [[System Overview]] — Full system architecture
- `Channel Context/` — Per-channel metaprompt data

## How This Section Works
1. **[[Usage Patterns]]** updated during heartbeats — tracks what agents do most
2. **[[Evolution Signals]]** logged after interactions — 3+ consistent signals at >80% confidence = prompt update
3. **[[Evolution Log]]** records every self-modification for auditability
4. **Devil's Advocate** reviews before any new agent/skill is deployed
