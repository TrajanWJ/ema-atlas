---
title: "skill-self-evolution-enhancer"
created: 2026-03-16
updated: 2026-03-16
type: skill
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: skill-documentation
tags: [agents, evolution, github, prompts, skills]
summary: "Adds self-evolution capabilities to ANY other skill. Creates `.learnings/` directories, `EVOLUTION.md`, and domain-specific feedback loops for skills "
---
# skill-self-evolution-enhancer

**Source:** ClawHub (3.3 rating)
**Installed:** 2026-03-16
**Type:** Meta-skill (enhances other skills)

## What It Does

Adds self-evolution capabilities to ANY other skill. Creates `.learnings/` directories, `EVOLUTION.md`, and domain-specific feedback loops for skills that don't have self-improvement built in.

## Key Capabilities
- Scaffold generator (`scripts/generate-evolution.sh`)
- Domain config extraction from target skill's SKILL.md
- Per-skill learning triggers and error triggers
- Review→Apply→Report loops
- Experience invalidation when learnings are contradicted

## Use Cases
- "Add self-evolution to [[ai-daily-digest]]"
- Scale self-improvement across the entire skill library
- Domain-specific learning (not just generic agent improvement)

## Related Skills
- [[self-improving-agent]] — core self-improvement (this extends it per-skill)
- [[evolution-loop]] — evolution loop management
- [[context-evolution]] — context/prompt evolution
- [[README]]
- [[backlog]]
- [[briefing-2026-03-16]]
