---
title: "capabilities"
created: 2026-03-16
updated: 2026-03-16
type: agent
status: active
source: manual
tags: [agents, architecture, code, security]
summary: "To spawn this agent:"
---
# 🔍 Code Reviewer — Capabilities

> Review pull requests for security, correctness, and style

## What This Agent Can Do
- 1. Read and understand codebases across multiple languages and frameworks
- 2. Identify bugs, anti-patterns, and security vulnerabilities in code
- 3. Suggest idiomatic, maintainable improvements with clear rationale
- 4. Write tests that cover edge cases and failure modes
- 5. Explain complex technical decisions in plain language

## Domain
**coding** — Software development, code review, debugging, architecture

## Spawning

To spawn this agent:
```
Use template: code-reviewer
Task: [describe the specific task]
```

## Status: proven
This agent has been validated through successful production use.
Promote after 3+ successful uses with: `promote-agent.sh code-reviewer proven`

## Related

- [[Agent Capabilities Matrix]]
