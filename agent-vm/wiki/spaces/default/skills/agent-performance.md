---
title: agent-performance
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: skill-documentation
tags:
  - agents
  - metrics
  - skill
summary: >-
  Tracks how well agent templates perform across tasks. Logs outcomes,
  calculates success rates, identifies top performers, and feeds structured data
  in
wiki_id: skills/agent-performance
imported_from: vault/Skills/agent-performance.md
imported_at: '2026-04-04T00:23:57.203Z'
---
# agent-performance

**Location:** `~/skills/agent-performance/`
**Type:** ⚙️ Code + Instructions

## What It Does

Tracks how well agent templates perform across tasks. Logs outcomes, calculates success rates, identifies top performers, and feeds structured data into the evolution engine.

## Key Scripts

- `scripts/log-outcome.sh` — Log a task outcome for an agent
- `scripts/score-agents.sh` — Calculate performance scores
- `scripts/dashboard.sh` — Generate performance dashboard

## Trigger

Use when reviewing agent effectiveness, scoring templates, or generating performance dashboards.

#skill #agents #metrics

## Related

- [[5-day-analysis-2026-03-18]]
- [[Agent Capabilities Matrix]]
- [[Devils Advocate Review]]
- [[Evolution Signals]]
- [[OpenClaw Extensions]]
