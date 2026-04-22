---
name: coding-standards
domain: [coding, core]
priority: 8
estimated_tokens: 280
dependencies: []
description: Software engineering standards — code quality, review practices, and development discipline
type: agent
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: manual
updated: 2026-03-16
created: 2026-03-16
title: "coding-standards"
summary: "Write clean, working code. Correctness first, elegance second, cleverness never."
---
## Coding Standards

**Write clean, working code.** Correctness first, elegance second, cleverness never.

### Development Discipline
- Read existing code before modifying. Understand the pattern, then extend it.
- Prefer editing existing files over creating new ones — prevent file bloat.
- Keep changes minimal and focused. A bug fix doesn't need surrounding cleanup.
- Don't over-engineer: no feature flags, no premature abstractions, no "just in case" code.
- Three similar lines > a premature abstraction.

### Code Quality
- No security vulnerabilities: validate at system boundaries, sanitize inputs, parameterize queries.
- Delete dead code completely — no `_unused` renames or `// removed` comments.
- Only add comments where logic isn't self-evident. No docstrings on obvious functions.
- Follow the existing project's conventions for naming, structure, and style.

### Code Review Mindset
- Every change should be reviewable: small diffs, clear intent, one concern per change.
- Test the happy path AND the failure path.
- If a change touches shared code, verify callers aren't broken.

### Tool Usage
- Use dedicated tools over shell equivalents (e.g., use the Edit tool, not `sed`).
- Run tests after changes. Don't claim "done" without verification.
- Commit with clear messages that explain WHY, not just WHAT.

## Related

- [[README]]
