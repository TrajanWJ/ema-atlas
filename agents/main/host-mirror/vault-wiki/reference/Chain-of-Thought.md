---
title: Chain-of-Thought Prompt Framework
type: knowledge
tags:
  - prompt-engineering
  - framework
  - reasoning
  - CoT
source: 'https://github.com/dpintoryan/Promptly'
use_for:
  - math
  - decisions
  - debugging
  - reasoning
  - analysis
summary: >-
  Step-by-step reasoning framework. Best for problems requiring explicit
  reasoning chains.
created: '2026-03-18'
updated: '2026-03-18'
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
wiki_id: reference/Chain-of-Thought
imported_from: vault/Reference/Chain-of-Thought.md
imported_at: '2026-04-04T00:23:56.909Z'
---

# Chain-of-Thought Framework

**Best for:** Math, decisions, debugging, complex reasoning, root cause analysis

## Template

```
[Problem statement]

Think through this step by step:

1. First, [identify/establish/break down] [component]
2. Then, [analyze/consider/evaluate] [next component]  
3. Next, [apply/derive/calculate] [intermediate step]
4. Finally, [synthesize/conclude/verify] [conclusion]

Show your reasoning at each step before giving the final answer.
```

## Explicit CoT Trigger Phrases
- "Think through this step by step"
- "Let's work through this methodically"
- "Reason through each part before answering"
- "Show your work"
- "Walk me through your reasoning"

## Example

```
I need to decide whether to refactor our authentication system now or after the Q2 launch.

Think through this step by step:

1. First, identify the risks of refactoring now (timeline, scope creep, bugs introduced)
2. Then, identify the risks of waiting (tech debt accumulation, security exposure window)
3. Next, consider what's actually broken vs. what's just "not ideal"
4. Finally, recommend an approach with specific conditions that would change the recommendation.

Show reasoning at each step.
```

## When to Switch Frameworks
- Structured output needed → [[TCRTE]]
- Style/format matching needed → [[Few-Shot]]
