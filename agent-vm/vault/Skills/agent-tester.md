---
title: "agent-tester"
created: 2026-03-16
updated: 2026-03-16
type: skill
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: skill-documentation
tags: [agents, skill, testing]
summary: "Automated testing framework for AI agents. Takes a SOUL.md path, runs structured test scenarios (helpfulness, persona consistency, safety, edge cases,"
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
