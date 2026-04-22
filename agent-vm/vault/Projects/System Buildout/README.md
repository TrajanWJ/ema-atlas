---
title: "README"
created: 2026-03-16
updated: 2026-03-16
type: project
status: active
confidence: 0.60
confidence_updated: 2026-03-18
source: project
tags: [knowledge, ops, prompts, research, security, skills]
summary: "A living agent ecosystem that self-organizes, self-critiques, and evolves its own prompts."
---
# System Buildout

> Multi-agent collaboration engine — building the system that builds itself.

**Status:** 🔨 ACTIVE
**Started:** 2026-03-16
**Discord:** 🔧 System Buildout category
**Agents:** 🤝 Right Hand · 💻 Coder · 🔬 Researcher · ⚙️ Ops

## What We're Building

A living agent ecosystem that self-organizes, self-critiques, and evolves its own prompts.

## Completed (Mar 16)

### Sequential Agent Chain: Self-Critique & Auto-Evolution
- **🔬 Researcher** → designed self-critique loop, SOUL.md evolution triggers, usage pattern analysis
- **💻 Coder** → implemented protocols and vault tracking
- **🛡️ Security** → audited (findings noted, not pursuing immutable baseline per Trajan)

**Deliverables:**
- `protocols/self-evolution.md` — 5-dimension scoring, confidence gates, 3-signal evolution engine
- `protocols/usage-tracking.md` — 6 metrics, 3-tier analysis, proactive behavior drivers
- `vault/System/Evolution Signals.md` — 4 initial signals captured

### Dynamic Agent Ecosystem
- 5 collaboration modes (sequential, parallel, open-ended, swarm, DM)
- Agent autonomy (self-exit, kick, spawn, create skills)
- Dynamic agent generation from vault templates
- `vault/Agents/Templates/` blueprint library

### Infrastructure Fixes
- Auth alert false positives fixed (switched to direct token expiry check)
- Gateway restart loop fixed (refresh script was killing gateway via systemctl)
- Cross-channel scanning added to heartbeat rotation

## Current Phase: Operational Maturity
The foundation is built. Now it's about:
1. **Session architecture** — write-only feeds, resetByChannel, cross-session state
2. **Research feeds** — Brave API key needed, then reddit-intel + github-interesting go live
3. **Self-evolution validation** — evolution loop runs every 6h, need to review first outputs
4. **Agent performance tracking** — log real task outcomes, build performance heuristics
5. **Cron persistence** — bulletproof recreation after doctor --fix

## Key Decisions
- DD-016: Dynamic Agent Ecosystem
- No immutable safety baseline — overkill for this setup
- Security audits only when task-relevant, not as default chain step

## Vault Links
- [[Self-Critique and Auto-Evolution Design]]
- [[Self-Evolution Security Audit]]
- [[Evolution Signals]]
