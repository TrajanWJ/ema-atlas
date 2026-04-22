---
title: "Metaprompting Patterns"
created: 2026-03-14
updated: 2026-04-14
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: reference
tags: [metaprompting, patterns, prompt-engineering]
summary: "The agent observes its own performance and generates improvements to its own prompts."
---
# Metaprompting Patterns

> Patterns for generating, improving, and evolving prompts and agent configurations.

## Core Patterns

### 1. Recursive Self-Improvement
The agent observes its own performance and generates improvements to its own prompts.
```
When you complete a task successfully, reflect on what made it work.
When you fail, analyze why and suggest a SOUL.md amendment.
Write proposed changes to memory/proposed-amendments.md for review.
```

### 2. Prompt Scaffolding
Start with a minimal prompt and iteratively expand based on observed failures:
```
v1: "You are a helpful assistant"
v2: "You are a helpful assistant. Be concise. Don't hallucinate."
v3: "You are a helpful assistant. Be concise. Don't hallucinate. Use tools before asking questions."
```
Each iteration addresses a specific observed failure mode.

### 3. Role-Expertise Stacking
Layer multiple expert roles to get compound capabilities:
```
You are simultaneously:
- A systems administrator (for infrastructure decisions)
- A security researcher (for threat awareness)
- A technical writer (for documentation quality)
Apply all three perspectives to every task.
```

### 4. Constraint-First Design
Define what the agent should NOT do before what it should:
```
NEVER: hallucinate information, send messages without review, delete files without backup
ALWAYS: check existing files before creating new ones, verify commands before running
THEN: help with whatever the user needs
```

### 5. Context Window Optimization
Structure prompts to front-load the most important instructions:
```
## Critical (read every time)
[Most important rules — 200 words max]

## Reference (consult as needed)
[Detailed guides — agent reads when relevant]

## Archive (rarely needed)
[Historical context — available but not loaded by default]
```

### 6. Self-Documenting Prompts
Every instruction includes its rationale:
```
Be concise in responses.
  WHY: Long responses get skipped. Short responses get read.
  EXCEPTION: Technical explanations that need detail.
```

## Metaprompt Templates

### Generate a SOUL.md
```
Create a SOUL.md for an agent that:
- Role: [describe the agent's primary function]
- Personality: [tone, style, quirks]
- Capabilities: [tools, access, integrations]
- Constraints: [what it must never do]
- Optimization: [what it should prioritize]

Include sections for: Core Identity, Boundaries, Tools, Communication Style, Proactive Behaviors
```

### Generate a Workflow
```
Design an automation workflow that:
- Trigger: [what starts it]
- Input: [what data it receives]
- Steps: [ordered operations]
- Output: [what it produces]
- Error handling: [what happens when steps fail]
- Notification: [who gets told what, when]
```

### Evaluate a Prompt
```
Rate this prompt on:
1. Clarity (1-10): Is the instruction unambiguous?
2. Completeness (1-10): Does it cover edge cases?
3. Efficiency (1-10): Does it minimize token waste?
4. Robustness (1-10): Will it work across different contexts?
5. Safety (1-10): Does it prevent harmful outputs?

Suggest specific improvements for the lowest-scored dimension.
```

## See Also

- [[Agent Templates Index]] — SOUL.md templates using these patterns
- [[Agent Automation Workflows]] — Automation workflows built from these patterns
- [[OpenClaw Advanced Config Patterns]] — System configs optimized with these patterns

#metaprompting #patterns #prompt-engineering

## Staleness Review (2026-04-14)

Verified during vault audit. Patterns remain valid and broadly applicable. Cleaned broken/garbage Related links. The superpowers skills system (brainstorming, writing-plans, etc.) implements several of these patterns in practice.

## Related

- [[Agent Automation Workflows]]
- [[System Prompt Patterns]]
- [[OpenClaw Advanced Config Patterns]]
