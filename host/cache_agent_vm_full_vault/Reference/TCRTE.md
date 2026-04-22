---
title: "TCRTE Prompt Framework"
type: prompt-template
tags: [prompt-engineering, framework, role-context-task]
source: https://github.com/dpintoryan/Promptly
use_for: [work, planning, email, general tasks]
summary: "Role-Context-Task-Constraints-Output Format framework. Best for structured work tasks."
created: 2026-03-18
updated: 2026-03-18
status: active
confidence: 0.80
confidence_updated: 2026-03-18
---

# TCRTE Framework

**Best for:** Work, school, planning, email, structured tasks

## Template

```
**Role:** You are a [specific role/expert]

**Context:** [Relevant background and situation. What's the current state? What do you know?]

**Task:** [Specific, actionable task description. What exactly needs to happen?]

**Constraints:**
- [Constraint 1 — time, format, audience, tone]
- [Constraint 2]
- [Additional constraints as needed]

**Output Format:** [Exact format required — bullet list, markdown, JSON, numbered steps, paragraph, table]
```

## Example

```
**Role:** You are a senior software engineer doing code review

**Context:** This is a PR for a Python Flask API endpoint that handles user authentication. The codebase uses SQLAlchemy ORM and JWT tokens. Team is 3 devs, mid-level skill.

**Task:** Review this code for security issues, performance problems, and code quality. Focus especially on the authentication flow.

**Constraints:**
- Keep feedback actionable, not theoretical
- Assume reviewer doesn't know the author
- Max 10 bullet points

**Output Format:** Markdown with sections: Critical Issues, Suggestions, Positive Notes
```

## When to Switch Frameworks
- Complex reasoning → use [[Chain-of-Thought]] instead
- Need to match a style/format → use [[Few-Shot]] instead

## Related

- [[TCRTE]]
- [[chain-of-thought]]
- [[few-shot]]
- [[GitHub]]
- [[Intel]]
- [[-]]
- [[Favorites]]
