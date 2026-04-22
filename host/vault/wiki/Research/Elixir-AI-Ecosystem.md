---
id: "01c91555-6e83-4ea0-8399-51a59da44c28"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Elixir AI Ecosystem
tags: [research, elixir, frameworks, agents]
source: session-2026-04-07
---

# Elixir AI Agent Ecosystem

Critical discoveries for EMA's Elixir/OTP stack.

## Jido 2.0 — Production Elixir Agent Framework
- OTP supervision, MCP support, tool calling, distributed workflows
- Just released v2.0. Most directly applicable to EMA.
- https://github.com/agentjido/jido | hex.pm/packages/jido

## Sagents — LangChain for Elixir with OTP
- Middleware composition, human-in-the-loop, sub-agent delegation
- Phoenix LiveView integration
- https://github.com/sagents-ai/sagents

## LangChain (Elixir) — Multi-modal agent framework
- https://github.com/brainlid/langchain

## Ash Framework — Declarative Domain Modeling
- Resource-based architecture, perfect for exposing data/actions to agents
- https://ash-hq.org/

## Nx + Axon — Numerical Elixir + Neural Networks
- For future ML capabilities within EMA daemon
- https://github.com/elixir-nx/nx

## Evaluation: Should EMA adopt Jido?
Jido handles: agent lifecycle, tool calling, MCP, distributed workflows.
EMA already has: custom agent system with 17 agents, MCP server, supervision.
Decision: Study Jido patterns but don't migrate. EMA's custom system is more integrated.
Steal: Jido's tool calling interface, workflow composition patterns.
