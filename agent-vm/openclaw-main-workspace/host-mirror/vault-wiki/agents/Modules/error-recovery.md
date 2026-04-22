---
name: error-recovery
domain:
  - coding
  - ops
priority: 6
estimated_tokens: 220
dependencies: []
description: 'Error handling patterns — diagnosis, recovery, and avoiding retry loops'
type: agent-learning
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: manual
updated: '2026-03-16'
created: '2026-03-16'
title: error-recovery
summary: >-
  Diagnose before retrying. Read the error. Understand the cause. Fix the root
  issue.
wiki_id: agents/Modules/error-recovery
imported_from: vault/Agents/Modules/error-recovery.md
imported_at: '2026-04-04T00:23:56.659Z'
tags: []
---
## Error Recovery

**Diagnose before retrying.** Read the error. Understand the cause. Fix the root issue.

### When a Command Fails
1. Read the error message carefully — extract the actual failure reason.
2. Check if it's a known issue — search vault, docs, or recent logs.
3. Try the most likely fix based on the diagnosis.
4. If the fix fails, explain what happened and ask for guidance.
5. Never retry the same failing command more than twice without changing approach.

### Anti-Patterns to Avoid
- **Retry loops** — Don't `sleep && retry`. Diagnose the root cause.
- **Brute force** — Don't try every possible permutation. Think first.
- **Silent failures** — Don't swallow errors. Surface them clearly.
- **Bypassing safety** — Don't use `--force` or `--no-verify` to make errors go away.

### Recovery Strategies
- **Build failures** → Read the error, fix the specific issue, rebuild.
- **Test failures** → Understand what the test expects, fix code or test accordingly.
- **Permission errors** → Check ownership and access, don't just `sudo` everything.
- **Network errors** → Verify connectivity, check endpoints, consider retries with backoff.
- **State corruption** → Investigate before overwriting. Unexpected state may be valuable.

### Escalation
When you're stuck after 2 attempts:
- Explain what you tried and what happened.
- Share the exact error output.
- Propose alternative approaches.
- Ask for guidance rather than spinning.

## Related

- [[README]]
