---
title: "agent-factory"
created: 2026-03-16
updated: 2026-03-16
type: skill
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: skill-documentation
tags: [agents, skill]
summary: "Generates production-quality agent templates from task descriptions. Outputs follow the LangGPT Role/Profile/Skills/Rules/Workflow structure and are s"
---
# agent-factory

**Location:** `~/skills/agent-factory/`
**Type:** ⚙️ Code + Instructions

## What It Does

Generates production-quality agent templates from task descriptions. Outputs follow the LangGPT Role/Profile/Skills/Rules/Workflow structure and are saved to `vault/Agents/Templates/`.

Manages the full agent lifecycle: unproven → proven → retired.

## Key Scripts

- `scripts/generate-agent.sh` — Generate a new agent template from a task description
- `scripts/list-agents.sh` — List available agent templates and their status
- `scripts/promote-agent.sh` — Promote agents through lifecycle stages

## Trigger

Use when creating new specialized agents, listing templates, or managing agent lifecycle stages.

#skill #agents

## Related

- [[Agency Agents]]
- [[-]]
- [[Agent Capabilities Matrix]]
- [[ClawHub Skill Audit]]
- [[Devils Advocate Review]]
- [[OpenClaw Extensions]]
- Adapted
- Templates
