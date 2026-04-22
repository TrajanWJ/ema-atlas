---
title: "Code Review Skills Landscape"
created: 2026-03-17
updated: 2026-03-17
type: research
status: active
confidence: 0.40
confidence_updated: 2026-03-18
source: auto-capture
tags: [agent-stack, code-review, quality-gate, skills]
summary: "Code review is a gap in the current agent stack. The **coder** agent builds features and the **gh-issues** skill opens PRs, but there's no dedicated c"
---
# Code Review Skills Landscape

> Auto-captured 2026-03-17 via transcript-scanner cron

## Why This Matters

Code review is a gap in the current agent stack. The **coder** agent builds features and the **gh-issues** skill opens PRs, but there's no dedicated code review skill for:
- Reviewing PRs before merge (automated quality gate)
- Reviewing agent-generated code (adversarial check)
- Enforcing style/security/performance patterns

## Top ClawHub Skills (by score)

| Skill ID | Name | Score |
|---|---|---|
| `code-review` | Code Review | 3.748 |
| `quack-code-review` | Code Review | 3.661 |
| `requesting-code-review` | Requesting Code Review | 3.640 |
| `modified-code-review` | Modified Code Review | 3.568 |
| `code-review-assistant` | Code Review Assistant | 3.549 |
| `code-review-fix` | code-review-fix | 3.543 |
| `gitlab-code-review` | GitLab Code Review | 3.478 |

## Current Coverage

- **gh-issues skill** handles PR review comments reactively (responds to reviewer feedback)
- **Devil's Advocate agent** can review proposals but isn't code-specialized
- **coding-agent skill** spawns Claude Code for implementation, not review
- No automated pre-merge review gate exists

## Integration Opportunity

A code review skill installed on the **coder** or **security** agent would close the loop:
1. gh-issues picks up an issue → coder builds → **code-review checks** → PR opens
2. Incoming PRs from contributors → code-review runs → comments posted

## Next Steps

- [ ] Evaluate top 2-3 skills (`code-review`, `quack-code-review`) via `clawhub info`
- [ ] Test best candidate on a real PR
- [ ] Consider adding to coder agent's skill set

## Tags

#code-review #skills #agent-stack #quality-gate

## Related

- [[Code Review Skills Landscape]]
- [[ai-landscape-2026-03-17]]
- [[ai-landscape-2026-03-16]]
