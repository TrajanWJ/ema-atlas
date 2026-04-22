---
tags:
  - prompt-engineering
  - meta-prompting
  - framework
  - structured-prompts
summary: >-
  ⭐ 11k+ — Programming language for prompts. Published research
  (arXiv:2402.16929).
source: 'https://github.com/langgptai/LangGPT'
category: Prompt Framework
date: 2026-03-14T00:00:00.000Z
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
type: knowledge
updated: '2026-03-16'
created: '2026-03-14'
title: LangGPT - Structured Prompt Framework
wiki_id: reference/Prompt_Engineering/LangGPT_-_Structured_Prompt_Framework
imported_from: vault/Reference/Prompt Engineering/LangGPT - Structured Prompt Framework.md
imported_at: '2026-04-04T00:23:56.932Z'
---

# LangGPT — Structured Prompt Framework

⭐ 11k+ — "Programming language for prompts." Published research (arXiv:2402.16929).

## Core Concept

Transforms prompt engineering from ad-hoc tips into a **structured methodology**:
- Hierarchical templates inspired by programming paradigms
- Reusable modules like code components
- Variables, commands, conditional logic

## Template Structure

```markdown
# Role: Your_Role_Name

## Profile
- Author: YourName
- Version: 1.0
- Language: English
- Description: Clear role description

## Goal
- Outcome: What to deliver
- Done Criteria: How we know it's finished
- Non-Goals: What's out of scope

### Skills
1. Specific skill description
2. Expected behavior and output

## Rules
1. Don't break character
2. Don't hallucinate

## Workflow
1. Analyze user input
2. Apply relevant skills
3. Deliver structured output

## Initialization
As a <Role>, follow <Rules>, greet user, introduce <Workflow>.
```

## Key Features

- **Claude Code Skill** — installable to `~/.claude/skills/`
- **Example Library** — FitnessGPT, Poet, Xiaohongshu Master, Name Master
- **Advanced Techniques** — variables, commands, conditional logic
- **Model Compatibility** — GPT-4, Claude, GPT-3.5 guidance
- **Philosophical Docs** — dialogue dynamics, mirror tendencies, statistical gravity wells

## Relevance to Our Stack

- **System Agent Templates** — use LangGPT format for SOUL.md consistency
- **Meta-Prompter Skill** — LangGPT templates as base for generated prompts
- **Standardization** — every agent follows Role/Profile/Skills/Rules/Workflow
- **Claude Code Integration** — install the LangGPT skill directly

## Local Path

`/tmp/prompt-repos/LangGPT/`

## Related

- [[langgpt-structured-prompt-framework]]
- [[LangGPT System Prompts Collection]]
- [[README]]
- Metaprompting
- [[and]]
- [[README]]
- Dynamic
- Agent
- Architecture
