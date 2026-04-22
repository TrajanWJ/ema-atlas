---
title: Consensus Loop Pattern
type: system
domain: agent-architecture
tags: [multi-agent, consensus, code-review, quality-gate]
created: 2026-03-19
confidence: 0.80
source: agent:coder
summary: Claude implements in isolated git worktrees, GPT/Codex independently reviews, nothing merges without cross-model consensus.
---

# Consensus Loop Pattern

## What It Is

A multi-model review gate where implementation and review are done by different model families. Prevents single-model blind spots from reaching main branch.

```
Claude (Sonnet/Opus)        GPT-4o / Codex
      │                           │
  implement                    review
  in worktree                  independently
      │                           │
      └──────── consensus ────────┘
                    │
              only then merge
```

## Why It Works

Different model families have different failure modes:
- Claude tends toward over-abstraction, type ceremony, verbose docstrings
- GPT tends toward pragmatic but sometimes insecure shortcuts
- Codex trained on GitHub corpus catches style/convention issues

Cross-model review catches what same-model review misses. Neither model will hallucinate the same bug.

## Implementation Sketch

### 1. Isolated Worktree Setup

```bash
# Create isolated worktree for each issue
git worktree add ~/worktrees/issue-{N} -b feature/issue-{N}
cd ~/worktrees/issue-{N}
```

Wade (`ivanviragine/wade`) automates this per-issue.

### 2. Claude Implements

Claude Code implements in the worktree with full context.
Output: diff, changed files, self-assessment.

### 3. Codex/GPT Reviews Independently

Spawn GPT or Codex with:
- The diff only (not the original task description to avoid anchoring)
- Explicit instruction: "Find bugs, security issues, and style violations. Do not be polite."
- Structured output: `{verdict: approve|request_changes, issues: [...], severity: critical|minor}`

### 4. Consensus Gate

```bash
if verdict == "approve":
    git merge feature/issue-{N}
elif verdict == "request_changes":
    send issues back to Claude
    Claude addresses, re-submits
    re-review (max 2 rounds)
    if still blocked → escalate to Trajan
```

### 5. Logging

Every consensus decision logged to `vault/Sessions/` with:
- What was disputed, what was resolved
- Which model was right (for fitness tracking)

## When to Require Consensus vs Single-Agent

### Require Consensus

| Signal | Threshold |
|--------|-----------|
| Touches auth/security code | Always |
| Public API surface changes | Always |
| Database schema changes | Always |
| >200 lines changed | Always |
| New external dependencies | Always |
| High-stakes features (payments, data export) | Always |

### Single-Agent OK

| Signal | Notes |
|--------|-------|
| Docs/README changes | Low blast radius |
| Test additions only | Self-verifying |
| Config tweaks (not secrets) | Reversible |
| Internal-only scripts | Not user-facing |
| Fixing typos in comments | Zero risk |

### Rule of Thumb
> "If a bug here would be a page-at-3am event, require consensus."

## Integration with Our Dispatch

In our dispatch system (AGENTS.md — Right Hand), add a `consensus_required` flag to task spec:

```json
{
  "task": "implement issue #47 — OAuth refresh flow",
  "agent": "coder",
  "consensus_required": true,
  "reviewer": "codex",
  "merge_gate": "consensus"
}
```

Right Hand checks this flag after Coder returns. If set, spawns reviewer before marking done.

## Failure Modes to Watch

1. **Anchoring** — don't show reviewer the original task description, only the diff
2. **Review fatigue** — if Codex approves everything, it's not reading carefully; calibrate with known bugs
3. **Infinite loops** — hard cap at 2 review rounds, then escalate
4. **Model unavailability** — if GPT/Codex unavailable, Devil's Advocate (same model, adversarial mode) is an acceptable fallback

## Related Patterns

- [[spec-driven-dev-patterns]] — what Coder implements before consensus
- [[fleet-mem-coordination]] — shared context during multi-agent review
- [[GouvernAI risk-tier model]] — alternative: classify risk before deciding whether to require consensus
