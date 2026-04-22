---
title: "Stack Decisions Lists Dippy and Lasso as Installed but Neither Exists on Disk"
type: intelligence
created: 2026-04-13
updated: 2026-04-14
confidence: 0.95
source: filesystem-audit
tags: [intelligence, best-practice, stack-hygiene, hooks, safety]
summary: "My Stack Decisions.md marked Dippy and Lasso as ==INSTALLED== while neither binary/directory existed — exposing documentation drift as a reliability risk for reference docs."
---

# Stack Decisions Lists Dippy and Lasso as Installed but Neither Exists on Disk

## Summary

[[My Stack Decisions]] listed two safety hooks — **Dippy** (PreToolUse Bash auto-approver at `~/Dippy/`) and **Lasso claude-hooks** (PostToolUse prompt injection scanner at `~/.claude/hooks/prompt-injection-defender/`) — with `==INSTALLED==` status. Filesystem verification on 2026-04-14 confirms neither path exists. The actual hooks configuration in `~/.claude/settings.json` shows completely different tooling has replaced them.

## The Problem: Documentation Drift in Reference Docs

The Stack Decisions document uses a clear legend: `==INSTALLED== means verified on disk`. When entries carry this status without actual verification, the document transitions from a **source of truth** to an **aspirational wishlist** — and anyone (human or agent) consulting it will make incorrect assumptions about what's actually running.

This is particularly dangerous for safety tooling. An agent reading the Stack Decisions doc would assume prompt injection scanning (Lasso) and destructive command blocking (Dippy) are active, when in reality neither is present. The actual safety layer consists of different tools entirely.

## Current Reality (Verified 2026-04-14)

### What the Stack Decisions Doc Claims

| Tool | Claimed Status | Claimed Path |
|---|---|---|
| Dippy | ==INSTALLED== | `~/Dippy/` |
| Lasso claude-hooks | ==INSTALLED== | `~/.claude/hooks/prompt-injection-defender/` |

### What Actually Exists

| Hook Type | Actual Tool | Path | Status |
|---|---|---|---|
| PreToolUse (Bash) | **chop** | `~/bin/chop` | Verified on disk |
| PreToolUse (Bash) | **safety-check.sh** | `~/.claude/hooks/safety-check.sh` | Verified on disk |
| PostToolUse (Write) | **vault-post-write.sh** | `~/.claude/hooks/vault-post-write.sh` | Verified on disk |
| Stop | **ori capture** | `~/.claude/hooks/ori/capture.mjs` | Verified on disk |

There is **no prompt injection scanner** (Lasso's role) currently active. The PreToolUse safety layer is now handled by `chop` and `safety-check.sh`, not Dippy.

## Root Cause

Documentation drift. The Stack Decisions doc was written (or updated) at a point when Dippy and Lasso were planned or briefly installed, then the actual tooling changed without the doc being updated. The `==INSTALLED==` markers were never re-verified against the filesystem.

The older copy at `vault/Reference/My Stack Decisions.md` (last verified 2026-03-16) also lists Dippy and Lasso as installed, meaning this drift has persisted for at least a month across multiple copies of the document.

## Recommended Actions

1. **Update Stack Decisions doc**: Change Dippy and Lasso to `**REPLACED**` status, noting their successors (`chop`/`safety-check.sh`)
2. **Add verification dates per-entry**: The doc has a global "Last verified" date, but individual entries should track when they were last confirmed on disk
3. **Add `chop` and `safety-check.sh`** to the Safety & Quality Hooks table with correct `==INSTALLED==` status
4. **Evaluate prompt injection gap**: Lasso's prompt injection scanning role has no replacement in the current hooks config — determine if this is an accepted risk or an oversight
5. **Consolidate doc copies**: Two copies of Stack Decisions exist (`Reference/` and `Research/AI-Knowledge/`) with divergent content — pick one as canonical and link the other

## Broader Pattern: Reference Doc Reliability

This is not unique to Dippy/Lasso. Any reference document that claims runtime state (installed, running, active) will drift unless there's a verification mechanism. Options:

- **Manual**: Add a "last verified" date per entry and schedule periodic re-checks
- **Automated**: A script that checks each claimed path/process and flags mismatches
- **Hybrid**: Automated check that creates a vault note listing discrepancies for human review

The [[My Stack Decisions]] doc is the single most important reference for understanding the tooling environment. Its reliability directly affects agent behavior and user trust.

## Related

- [[My Stack Decisions]] — the reference document in question
- [[Claude Code Design Stack]] — related tooling architecture decisions
- [[Research - Self-Hosted AI Agent Platforms 2026]] — broader platform evaluation context

---

- **Category:** best-practice
- **Source:** filesystem-audit, task-afb668ac.txt
- **Applied:** 2026-04-13T15:05:57Z
- **Verified:** 2026-04-14
- **Impact:** 3/5
- **Project:** general

Tags: #intelligence #best-practice #stack-hygiene #auto-applied
