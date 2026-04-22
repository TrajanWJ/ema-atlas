---
title: agent-factory
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
summary: >-
  Generates production-quality agent templates from task descriptions. Outputs
  follow the LangGPT Role/Profile/Skills/Rules/Workflow structure and are s
wiki_id: skills/agent-factory
imported_from: vault/Skills/agent-factory.md
imported_at: '2026-04-04T00:23:57.203Z'
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
