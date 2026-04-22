---
title: "Context-Gateway Evaluation"
created: 2026-03-16
updated: 2026-03-16
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: external-research
tags: [code, github, knowledge, openclaw, prompts, research]
summary: "Context-Gateway is a **transparent HTTP proxy** written in Go that sits between an AI coding agent (Claude Code, Cursor, etc.) and the LLM API provide"
---
# Context-Gateway Evaluation

> **Source:** [compresr/context-gateway](https://github.com/rudegent1705/Context-Gateway) (Go, 85+ source files)
> **Date:** 2026-03-16
> **Purpose:** Evaluate as alternative/complement to our LCM-based context management

## Overview

Context-Gateway is a **transparent HTTP proxy** written in Go that sits between an AI coding agent (Claude Code, Cursor, etc.) and the LLM API provider (Anthropic, OpenAI, Google, Ollama, Bedrock). It intercepts requests, compresses context on-the-fly, and manages token budgets — all without modifying the client or provider.

**Core idea:** Reduce tokens sent to the LLM by compressing tool outputs, pre-summarizing conversation history, and managing expand-on-demand loops. The LLM never sees the full raw context unless it explicitly asks for it.

## Architecture

```
Client (Claude Code) → Context-Gateway (localhost proxy) → LLM Provider API
                              ↓
                    ┌─────────────────┐
                    │  Compression    │
                    │  Pipes          │
                    ├─────────────────┤
                    │  tool_output    │  ← Compress large tool results
                    │  tool_discovery │  ← Optimize tool schemas
                    ├─────────────────┤
                    │  Preemptive     │
                    │  Summarizer     │  ← Background summarization
                    ├─────────────────┤
                    │  Cost Control   │  ← Track token spend
                    │  Monitoring     │  ← Request logging, telemetry
                    └─────────────────┘
```

### Key Components

1. **Gateway** (`internal/gateway/`) — HTTP proxy with SSRF protection, provider auto-detection via request format, configurable compression thresholds (off, 256, 1k, 2k, 4k, 8k, 16k, 32k, 64k, 128k)

2. **Pipes** (`internal/pipes/`) — Content transformation pipeline:
   - `tool_output` — Compresses large tool results with simple compressor + expand-on-demand
   - `tool_discovery` — Optimizes tool schema payloads

3. **Preemptive Summarizer** (`internal/preemptive/`) — Background summarization engine:
   - Detects compaction requests via provider-specific patterns (Claude Code prompt patterns, Codex patterns)
   - Tracks token usage per session
   - Triggers background summarization when usage > configurable threshold
   - Caches summaries for instant retrieval on compaction requests
   - Worker pool with job queue, status tracking, retention

4. **Adapters** (`internal/adapters/`) — Provider-specific request/response handling for Anthropic, OpenAI, Gemini, Ollama, Bedrock

5. **Cost Control** (`internal/costcontrol/`) — Token pricing, usage tracking, dashboard

6. **Expand-Context Loop** (`gateway/expand_context_handler.go`) — When the LLM asks for more context (via `expand_context` tool), the gateway re-expands the compressed content and re-sends

### Legitimacy Assessment

⚠️ **Mixed signals on this repo:**
- The README is generic/marketing-style with download links to `.zip` files — unusual for a serious Go project
- However, the actual source code is substantial (85+ Go files, proper packages, tests, go.mod)
- The `go.mod` lists `github.com/compresr/context-gateway` as the module name — different from the clone URL (`rudegent1705/Context-Gateway`), suggesting it's a mirror/fork
- The `.zip` download links in README are suspicious (pointing to `internal/hooks/` — this could be a trojanized fork)
- **DO NOT install the .zip files.** The Go source code itself appears legitimate.

## Comparison with Our LCM Approach

| Aspect | Context-Gateway | [[OpenClaw]] LCM |
|--------|----------------|--------------|
| **Level** | HTTP proxy (transport) | In-process (conversation management) |
| **Approach** | Compress before sending to LLM | Compact/expand conversation DAG |
| **Granularity** | Per-request, per-tool-output | Per-message, hierarchical summaries |
| **Transparency** | Invisible to client | Integrated into [[OpenClaw]] session |
| **Expand mechanism** | LLM calls `expand_context` tool | Agent calls `lcm_expand` / `lcm_expand_query` |
| **Preemptive summarization** | Yes — background worker pre-summarizes | No — compaction on-demand when context grows |
| **Cost tracking** | Built-in pricing + dashboard | Not built-in |
| **Provider support** | Anthropic, OpenAI, Gemini, Ollama, Bedrock | N/A (built into [[OpenClaw]]) |
| **Memory** | Session-scoped only | Cross-session (summary DAG persists) |
| **Lossless** | Expand-on-demand (partial lossless) | Full lossless (DAG preserves everything) |

### Where Context-Gateway Wins
- **Zero integration cost** — drop-in proxy, works with any client
- **Preemptive summarization** — summaries ready BEFORE needed, reducing latency
- **Tool output compression** — specifically targets large tool results (file reads, command outputs) which are our biggest context hogs
- **Cost tracking** — built-in token spend visibility

### Where LCM Wins
- **Cross-session persistence** — summaries survive session boundaries
- **Hierarchical expansion** — can drill into any depth of the summary DAG
- **Semantic search** — `lcm_grep` finds content across all compacted history
- **True lossless** — nothing is ever permanently lost, just compressed

## Actionable Insights

1. **Preemptive summarization is a great idea.** LCM compacts on-demand, which means there's always a latency hit when context grows large. A background worker that pre-summarizes recent conversation could make compaction instant.

2. **Tool output compression deserves attention.** Our biggest context consumers are tool outputs (file reads, command results, web fetches). Compressing these before they enter the conversation would be more efficient than waiting for full-context compaction.

3. **Configurable compression thresholds** — Context-Gateway lets users choose: off, 256, 1k, 2k, 4k... 128k. This per-tool-output threshold is a smart UX — lets power users trade quality for speed.

4. **The expand-on-demand loop** — when the LLM says "I need more context on X", the proxy re-expands and re-sends. This is similar to LCM's `lcm_expand` but automated at the proxy level. Could be useful for our subagents who may not know to call `lcm_expand`.

5. **Don't install this specific repo's binaries** — the ZIP download links are suspicious. If we want to use this approach, build from the Go source or find the canonical `compresr/context-gateway` repo.

## Verdict

**Not a replacement for LCM, but complementary concepts worth stealing.** The preemptive summarization pattern and tool-output-specific compression are the two most actionable ideas. LCM's cross-session DAG and semantic search are capabilities Context-Gateway doesn't attempt.

## Links

- [[DeerFlow Architecture Study]] — DeerFlow's SummarizationMiddleware is a simpler version of this
- [[Claude Code Internals Study]] — Claude Code's own context compaction
