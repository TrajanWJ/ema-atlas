---
title: agent-tester
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: skill-documentation
tags:
  - agents
  - skill
  - testing
summary: >-
  Automated testing framework for AI agents. Takes a SOUL.md path, runs
  structured test scenarios (helpfulness, persona consistency, safety, edge
  cases,
wiki_id: skills/agent-tester
imported_from: vault/Skills/agent-tester.md
imported_at: '2026-04-04T00:23:57.204Z'
---
# agent-tester

**Location:** `~/skills/agent-tester/`
**Type:** ⚙️ Code + Instructions

## What It Does

Automated testing framework for AI agents. Takes a SOUL.md path, runs structured test scenarios (helpfulness, persona consistency, safety, edge cases, tool usage) against it using Claude, and scores responses.

## Key Scripts

- `scripts/test-agent.sh` — Run the full test suite against an agent's SOUL.md
- `scripts/compare-versions.sh` — Compare agent versions side-by-side

## Trigger

Use when testing a new agent before deployment, evaluating quality after changes, running regression tests, or comparing versions. Command: `/test-agent`.

#skill #agents #testing

## Related

- [[2026-03-16_0630_🔬]]
- [[ClawHub]]
- [[Mining]]
- [[+]]
- [[Agent Capabilities Matrix]]
- S
- [[Anti-Pattern]]
- [[OpenClaw Extensions]]
- [[README]]
- Prompting
