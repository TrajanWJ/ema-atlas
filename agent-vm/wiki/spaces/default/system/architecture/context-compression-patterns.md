---
title: Context Compression Patterns
type: knowledge
domain: agent-architecture
tags:
  - context
  - compression
  - tokens
  - proxy
  - Wet
  - RLM
created: '2026-03-19'
confidence: 0.8
source: 'agent:coder'
summary: >-
  Wet (Go proxy, 82% context bloat reduction via tool result compression) vs RLM
  compact-hook approach, and where each applies in our stack.
wiki_id: system/architecture/context-compression-patterns
imported_from: vault/Architecture/context-compression-patterns.md
imported_at: '2026-04-04T00:23:56.785Z'
---

# Context Compression Patterns

## The Problem

Long-running agent sessions accumulate context bloat:
- Tool call results returned in full, even when stale
- Repeated file reads with unchanged content
- Verbose shell output that only the last 10 lines matter from
- Error messages with full stack traces cited in full multiple times

This pushes agents toward context limits, forces session restarts, and wastes tokens.

## Pattern 1: Wet — Go Proxy for Tool Result Compression

### What It Is

`buildoak/wet` is a Go proxy that sits between the AI client and the tool execution layer. It intercepts tool results and compresses stale/redundant ones before they enter context.

### Architecture

```
Claude Code (or any agent)
    │
    ↓ tool call
[Wet Go Proxy]
    │ intercepts result
    │ checks: is this result stale? (same file, unchanged since last read)
    │         is this result too long? (heuristic threshold)
    │         is this a repeat? (same command run twice)
    │
    ├─ if stale/long/repeat:
    │     spawn Sonnet subagent
    │     Sonnet meta-compresses: "file auth.py: unchanged since t-1, key facts: [...]"
    │     return compressed version
    │
    └─ if fresh/short: pass through unchanged
    │
    ↓ (compressed) result
Claude Code receives smaller context
```

### Stats

- 82% of context bloat from stale tool results (per buildoak measurements)
- Sonnet subagent adds latency (~1-2s per compression) but saves many tokens
- Net: faster sessions, lower cost, less context pressure

### When to Use Wet

| Scenario | Use Wet? |
|----------|----------|
| Long Coder sessions with many file reads | ✅ Yes |
| Researcher doing multi-URL fetch + re-reads | ✅ Yes |
| Short dispatch tasks (<10 tool calls) | ❌ Overhead not worth it |
| Sessions where tool results are always fresh | ❌ Nothing to compress |
| Real-time monitoring (tool results always matter) | ❌ Don't compress live data |

### Integration Path

Wet runs as a local proxy. Agent points its tool executor at `localhost:<wet-port>` instead of direct execution. Low integration overhead if our tooling supports proxy injection.

**Watch:** `buildoak/wet` — check if Claude Code supports transparent proxy injection.

## Pattern 2: RLM Compact-Hook

### What It Is

`EncrEor/rlm-claude` (already in watch-repos.txt) implements a compact hook that fires when Claude Code's context reaches a threshold. The hook:
1. Detects context approaching limit
2. Pauses agent
3. Runs a summarization pass over recent messages
4. Replaces verbose exchanges with compact summaries
5. Resumes agent

### Architecture

```
Claude Code session
    │
    │ (context usage monitored by hook)
    │
    ↓ threshold hit (e.g., 80% of context window)
[RLM compact hook fires]
    │
    │ identify last N tool calls + responses
    │ summarize: "session state as of checkpoint X"
    │ replace verbose history with summary
    │
    ↓ resumed with compact context
Claude Code continues with more headroom
```

### When to Use RLM Compact-Hook

| Scenario | Use? |
|----------|------|
| Single-session long tasks (full feature implementation) | ✅ Best fit |
| Session cannot be restarted (stateful external ops) | ✅ Critical |
| Multi-session orchestration (can restart) | ❌ Restart instead |
| Already using Wet proxy | ❌ Redundant — pick one |

## Comparison

| Dimension | Wet | RLM Compact-Hook |
|-----------|-----|-----------------|
| **Trigger** | Per tool call | Context threshold |
| **Scope** | Tool results only | Entire conversation |
| **Latency** | +1-2s per compressed call | One-time cost at threshold |
| **Lossiness** | Low (Sonnet compresses) | Medium (summary loses detail) |
| **Transparency** | Invisible to agent | Visible (context changes) |
| **Setup** | Proxy (external) | Hook (in-session) |
| **Best for** | Chronic bloat prevention | Emergency context rescue |

## Where Each Applies in Our Stack

```
Our Stack                    Compression Pattern
──────────────────────────   ────────────────────────────
gh-issues long impl runs   → Wet (chronic bloat prevention)
Coder building features    → Wet (many file reads, stale results)
Researcher multi-URL fetch → Wet (large page fetches, re-reads)
Vault Keeper full scans    → RLM compact-hook (long single session)
Any session near limit     → RLM compact-hook (emergency)
Short dispatch tasks       → Neither (overhead not worth it)
```

## Recommended Priority

1. **Evaluate Wet** — if it supports Claude Code proxy injection, deploy it for Coder and Researcher
2. **RLM compact-hook** — already in watch-repos.txt (EncrEor/rlm-claude); evaluate its compact hook specifically
3. **Our own version** — if neither fits, implement a simple `qmd-context.sh`-style wrapper: check file staleness before including full content

## Related
- [[fleet-mem-coordination]]
- [[consensus-loop-pattern]]
- [[Agent Roster]]
