---
title: "EMA Architecture Deep Dive"
type: reference
created: 2026-04-06
tags: [architecture, ema, tauri, elixir, desktop]
summary: "EMA desktop app architecture: multi-window, glass morphism, pipes, and mesh"
---

# EMA Architecture Deep Dive

## Multi-Window Design

Built on Tauri 2's WebviewWindow API. Each app component is a separate OS-level window rather than a tab or pane within a single window.

**Why:** Multi-monitor workflows. A dashboard on one screen, editor on another, chat on a third. Each window independently positionable, resizable, minimizable. Native OS window management (Alt-Tab, taskbar entries, snap layouts) works naturally.

**Implementation:** Tauri 2 WebviewWindow creates and manages independent OS windows from the Rust backend. Windows communicate via Tauri's event system.

## Visual Design: Glass Morphism

- **Dark void** base (near-black backgrounds)
- **Frosted blur** on overlapping surfaces (backdrop-filter: blur)
- **Accent palette:** Teal (#2BA89E), Blue, Amber (#E8A838)
- Depth conveyed through blur intensity and opacity rather than shadows

## ProposalEngine

Four-stage pipeline using PubSub for inter-stage communication:

1. **Generator** -- Produces initial proposals from user input and context
2. **Refiner** -- Improves proposals using additional context, constraints, and past patterns
3. **Debater** -- Challenges proposals, identifies weaknesses, generates alternatives
4. **Tagger** -- Classifies, categorizes, and routes refined proposals

Each stage publishes to PubSub topics. Stages can be independently scaled, replaced, or bypassed.

## Pipes System

Pipes are the primary automation primitive in EMA.

- **7 stock pipes** -- Built-in workflows for common operations
- **22 triggers** -- Events that can initiate pipe execution
- **Registry** -- Catalog of available pipes with metadata
- **Loader** -- Resolves pipe definitions and dependencies at runtime
- **Executor** -- Runs pipes with error handling, retry, and observability

Pipes are composable. Complex workflows are built by chaining simple pipes.

## Babysitter

Monitors 7 Discord streams in real-time:

| Stream | Purpose |
|---|---|
| live | Real-time agent output |
| heartbeat | Agent health/liveness signals |
| intent | Parsed user intent from Discord messages |
| pipeline | Pipe execution status |
| agent | Agent lifecycle events (start, stop, error) |
| intelligence | Insights and analysis results |
| memory | Memory write/read events |

The Babysitter aggregates these streams into a unified view and triggers alerts on anomalies.

## Claude Bridge

Elixir OTP bridge connecting EMA to Claude Code CLI.

**Architecture:**
- OTP GenServer manages Claude Code CLI process lifecycle
- Streaming output parsed and forwarded to EMA's event system
- Circuit breaker prevents cascade failures when Claude Code is unavailable
- Cost tracking per-request and per-session for budget management

**Why Elixir OTP:** Supervision trees provide automatic restart on crash. GenServer state machines model the CLI lifecycle cleanly. Built-in telemetry for monitoring.

## Memory Engine

Replaces Honcho with a local-first memory system:

- **IntentStore** -- Records parsed user intents with timestamps and context
- **OutcomeStore** -- Records what happened as a result of each intent (success, failure, partial)
- **ContextAssembler** -- Reconstructs relevant context for new tasks by querying IntentStore and OutcomeStore

**Design principle:** Intent and outcome are stored separately so the system can learn the mapping between them over time.

## Mesh Architecture

Peer-to-peer space system for data organization and sync:

### Space Types

| Space | Description |
|---|---|
| Personal | Private to the user, single device |
| Org | Shared within an organization |
| Shared | Explicitly shared with selected peers |
| Ghost | Ephemeral, auto-deleting after TTL |
| Public | Openly accessible |

### Capabilities

- **Device sync** -- Replicate spaces across user's devices
- **Federation** -- Spaces can federate across instances for org/shared use cases
- **P2P** -- Direct peer-to-peer sync without central server where possible

## Intelligence Layer

Higher-order reasoning capabilities built on top of the core systems:

- **Intent parsing** -- Natural language to structured intent representation
- **Question refinement** -- Ambiguous questions iteratively refined before execution
- **Routing** -- Direct tasks to the appropriate agent, pipe, or subsystem
- **Metaprompting** -- Generate optimized prompts for downstream LLM calls based on task type and context
