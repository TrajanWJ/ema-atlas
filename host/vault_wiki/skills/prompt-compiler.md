---
title: prompt-compiler
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: skill-documentation
tags:
  - agents
  - prompts
  - skill
summary: >-
  Assembles agent context from modular, reusable prompt blocks. Compiles a
  role-specific SOUL.md-equivalent from a library of composable modules in `vau
wiki_id: skills/prompt-compiler
imported_from: vault/Skills/prompt-compiler.md
imported_at: '2026-04-04T00:23:57.212Z'
---
# prompt-compiler

**Location:** `~/skills/prompt-compiler/`
**Type:** ⚙️ Code + Instructions

## What It Does

Assembles agent context from modular, reusable prompt blocks. Compiles a role-specific SOUL.md-equivalent from a library of composable modules in `vault/Agents/Modules/`, respecting token budgets and domain relevance.

Each module has YAML frontmatter: domain, priority, estimated_tokens, dependencies, description.

## Key Scripts

- `scripts/compile.sh` — Compile a prompt from selected modules
- `scripts/list-modules.sh` — List available prompt modules

## Trigger

Use when building a new agent SOUL.md, assembling context for a role, or managing the prompt module library. Commands: "compile a prompt", "list modules", "add module".

#skill #prompts #agents

## Related

- [[Agent Capabilities Matrix]]
- [[Devils Advocate Review]]
- [[OpenClaw Extensions]]
- [[README]]
- [[Tego Security Index Evaluation]]
