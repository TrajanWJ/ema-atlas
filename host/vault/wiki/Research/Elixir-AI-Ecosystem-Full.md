---
id: "1d66bf4a-786e-41f1-a2b9-e6ffcfc5e260"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Elixir AI Ecosystem (Full)
tags: [research, elixir, ecosystem, agents, frameworks]
source: session-2026-04-07
---

# Elixir AI Ecosystem — 31 Projects

## Agent Frameworks (5)
- **Jido** (910 stars) — Autonomous agent framework, GenServer patterns, streaming
- **Legion** — Agents generate+execute actual Elixir code with sandboxing
- **Sagents** — LiveView integration, middleware, human-in-the-loop
- **SwarmEx** — Lightweight OpenAI Swarm for Elixir
- **OpenAI Symphony** (13K stars) — Production agent orchestration from OpenAI, pure Elixir

## LLM Clients (6)
- **ExLLM** — All-in-one: Claude, OpenAI, Ollama, structured outputs
- **OpenAI_ex** — Battle-tested OpenAI client
- **LangChain Elixir** — Idiomatic Elixir LangChain
- **llm_composer** — HTTP-based multi-backend
- **req_llm** — Req plugin architecture
- **Altar AI** — Protocol-based adapter with fallback

## MCP Implementations (3)
- **Hermes MCP** — Full client/server, Plug/Phoenix, SSE, distributed
- **MCPhoenix** — Phoenix-native MCP server
- **mcp_sse** — SSE transport MCP

## Event Sourcing / CQRS (3)
- **Commanded** — Battle-tested CQRS/ES with EventStore
- **Incident** — Port/Adapter pattern ES
- **Awesome Elixir CQRS** — Curated reference list

## State Machines / Workflows (2)
- **Machinery** — Lightweight FSM with Ecto, guards, callbacks
- **Durable** — Resumable workflows like Temporal, PostgreSQL-backed

## TUI Frameworks (3)
- **Ratatouille** (805 stars) — Elm Architecture TUI
- **TermUI** — Modern BubbleTea-inspired, 60 FPS
- **Garnish** — SSH-based remote TUI

## Distributed State (2)
- **DeltaCRDT** — Delta CRDT for EMA's sync features
- **Horde** — Distributed Supervisor+Registry on CRDT

## Knowledge / Graphs (2)
- **libgraph** — Native graph data structures
- **RDF-ex** — Semantic web / SPARQL for Elixir

## Personal AI Agents (2)
- **AlexClaw** — BEAM personal AI, pgvector memory, RSS/web/GitHub monitoring
- **NexAgent** — Self-evolving, zero memory leaks, self-patching

## Priority for EMA
1. Hermes MCP — upgrade EMA's MCP with SSE transport
2. Durable — resumable execution workflows
3. Ratatouille/TermUI — rich TUI for ema watch/now/briefing
4. DeltaCRDT+Horde — EMA's planned P2P sync
5. ExLLM — potential replacement for custom Bridge adapters
