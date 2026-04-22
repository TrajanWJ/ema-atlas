---
title: "Claude Code v2.1.84: WorktreeCreate HTTP Hook"
type: reference
created: 2026-03-26
updated: 2026-04-05
confidence: 0.80
source: intelligence/81b52f1e
tags: [claude-code, hooks, worktree, agent-os, openclaw, config-change]
summary: "v2.1.84 adds WorktreeCreate lifecycle hook so agent-OS can track isolated git worktree creation via HTTP callback."
---

# Claude Code v2.1.84: WorktreeCreate HTTP Hook

*Intelligence note — config change flagged 2026-03-26, impact 2/5*

## What This Is

Claude Code v2.1.84 introduced a `WorktreeCreate` lifecycle hook that fires whenever a new git worktree is created inside a CC session. This is part of a broader expansion of CC's hook system beyond the original tool-use hooks (`PreToolUse`, `PostToolUse`) toward **lifecycle-level observability hooks** that fire on agent structural events.

This hook is the worktree counterpart to the `TaskCreated` hook added in the same release cycle — together they give the host OS visibility into both task dispatch and workspace isolation events.

## Why It Matters for Agent-OS

Git worktrees are Claude Code's primary workspace isolation mechanism. When an agent uses the `EnterWorktree` tool (or the superpowers worktree skill), CC creates a new git worktree at a separate path. This lets multiple agents operate on the same repo simultaneously without clobbering each other's state.

Without the `WorktreeCreate` hook, the host system (OpenClaw's bridge API, Agent-OS-Frontend) has no reliable way to know:
- Which agents currently have active worktrees
- What branches those worktrees are on
- When a worktree was created vs still pending teardown

The hook bridges this gap by sending an HTTP event to a registered endpoint at the moment of worktree creation.

## Hook Payload

Based on the CC hook system pattern (mirroring `TaskCreated` and other lifecycle hooks), the `WorktreeCreate` payload contains:

```json
{
  "event": "WorktreeCreate",
  "worktree_path": "/path/to/worktree",
  "branch": "feature/foo",
  "session_id": "...",
  "timestamp": "2026-03-26T08:08:48Z"
}
```

The hook can be registered as a command hook (runs a local script) or as an HTTP hook pointing to an endpoint like `/api/hooks/worktree`.

## Recommended Configuration

Add to `~/.claude/settings.json` under `hooks`:

```json
"WorktreeCreate": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "/home/trajan/.claude/hooks/worktree-tracker.sh"
      }
    ]
  }
]
```

Or with an HTTP target pointing to the bridge API:

```json
"WorktreeCreate": [
  {
    "hooks": [
      {
        "type": "http",
        "url": "http://localhost:PORT/api/hooks/worktree"
      }
    ]
  }
]
```

The bridge API endpoint then logs the event to `feed.jsonl` for visibility in Agent-OS-Frontend dashboards.

## Relationship to Existing Hook System

The current production `settings.json` uses these hooks:

| Hook | Purpose |
|------|---------|
| `PreToolUse[Bash]` | Safety check + chop tool logging |
| `PostToolUse[Write]` | Ori validation + vault QMD update |
| `SessionStart` | Ori orient + Letta subconscious init |
| `UserPromptSubmit` | Letta whisper |
| `Stop` | Ori capture + Letta transcript sync |

`WorktreeCreate` slots into this system as an **infrastructure-level lifecycle hook**, distinct from tool-use hooks. It fires on structural agent operations rather than individual tool calls.

## Sibling Hooks (v2.1.84 Batch)

These hooks were introduced in the same v2.1.84 release cycle:

- **`TaskCreated`** — fires when a Task tool invocation begins; enables pre-flight enrichment and intake validation. See [[claude-code-v2184-taskcreated-hook--new-lifecycle-]].
- **`WorktreeCreate`** (this note) — fires when `EnterWorktree` or equivalent creates a git worktree.

## Implementation Notes

- The hook fires **synchronously** at worktree creation time — a slow or erroring hook script will delay the worktree from becoming available.
- Register with a short timeout (5s or less) to avoid blocking agent workflows.
- For the feed.jsonl logging pattern, write an append-only log entry rather than updating shared state to avoid write contention from parallel agents.
- **Status:** Auto-flagged for application. Verify endpoint availability and timeout settings before applying to production configs.

## Related Notes

- [[claude-code-v2184-taskcreated-hook--new-lifecycle-]] — sibling hook for task creation events
- [[claude-code-channels]] — v2.1.80+ Channels architecture (MCP-based external event push)
- [[config-claude-code-v2183-claudecodesubprocessenvscrub1-sc]] — related v2.1.83 config change

---
Tags: #intelligence #config-change #lifecycle-hooks #worktree #agent-os
