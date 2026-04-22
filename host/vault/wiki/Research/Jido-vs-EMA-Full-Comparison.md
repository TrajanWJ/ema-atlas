---
id: "ffab554e-2992-4d0f-987c-d564750365d0"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Jido 2.0 vs EMA — Full Module Comparison
tags: [research, elixir, jido, agents, architecture, critical]
source: session-2026-04-07
---

# Jido 2.0 vs EMA Agent System — Exhaustive Comparison

## Scorecard: 22 Features Compared

| Feature | Winner | Gap Size |
|---------|--------|----------|
| Agent definition (immutable struct) | Jido | Large |
| Agent lifecycle (hibernate/thaw) | Jido | Large |
| Strategy/execution model | Jido | **Critical** |
| Tool calling (typed + schema) | Jido | Large |
| Workflow composition | Jido | Large |
| Signal/event system | Jido | Medium |
| Memory (world model + thread) | Jido | Large |
| Persistence (checkpoint/restore) | Jido | Medium |
| Supervision | Tie | — |
| MCP support | **EMA** | Large |
| LLM integration | Jido | Small |
| Streaming | Tie | — |
| Reasoning strategies (7 built-in) | Jido | **Critical** |
| Plugin system | Jido | Medium |
| Observability | Jido | Large |
| Error handling | Jido | Medium |
| Chat/messaging | Jido | Medium |
| Context injection | **EMA** | Large |
| Domain awareness | **EMA** | Large |
| Phoenix integration | **EMA** | Medium |
| Directive pattern | Jido | Large |
| Multi-tenancy | N/A | — |

## 3 Critical Steals (Transform EMA's Agents)

### 1. Directive Pattern — Agent-as-Value
`cmd(agent, action) -> {agent, directives}` is pure. No side effects in logic.
Runtime executes directives. Makes agents testable without mocking CLI.

### 2. Strategy Abstraction
7 built-in reasoning strategies: ReAct, Chain of Thought, Tree of Thoughts,
Graph of Thoughts, Algorithm of Thoughts, Chain of Draft, TRM.
EMA has ONE pattern: prompt→CLI→parse.

### 3. Typed Tool System
Tools are Action modules with name/description/schema/run.
Auto-generates JSON schema for LLM. Type-safe dispatch.
EMA: string names + case statement dispatch.

## Where EMA Wins
- Domain context injection (8 subsystems in one bundle)
- MCP server (Jido has none)
- Phoenix real-time (channels + PubSub + Ecto)
- 138 PubSub broadcasts across 87 context modules

## Verdict
Jido is architecturally superior for agent logic. EMA is superior for
domain integration. Steal Jido's agent patterns, keep EMA's domain layer.
