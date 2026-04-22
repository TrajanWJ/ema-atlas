---
id: "a100c445-3dba-4800-9a30-d7376be8c36a"
title: ""
space: wiki
tags: []
source: manual
---

---
title: Jido vs EMA Agent Patterns
tags: [research, elixir, agents, jido, architecture]
source: session-2026-04-07
---

# Jido 2.0 vs EMA Agent System — Steal Guide

## What Jido Does Better

### 1. Pure Agent / Directive Split
Jido: `cmd/2` is pure: `(agent, action) -> {agent, directives}`. No side effects.
EMA: AgentWorker mixes state, LLM calls, tool exec, DB writes in one GenServer.
**Steal:** Extract AgentLogic module — pure function returns effects list.

### 2. Typed Tool Definitions
Jido/LangChain: Tools carry schema, execute_fn, async flag as structs.
EMA: Tools are string names dispatched via case statement.
**Steal:** `%Tool{name, description, params_schema, execute_fn, async?}`

### 3. Async Tool Execution
LangChain: Groups async/sync tools, runs async in parallel via Task.async.
EMA: All tool calls sequential.
**Steal:** Split tool calls, parallel execute async-safe ones.

### 4. Run Modes
LangChain: :while_needs_response, :until_success, :step, custom Mode behaviour.
EMA: Single-pass execution.
**Steal:** Mode system for different execution patterns.

### 5. Append-Only Thread (not compression)
Jido: Full history preserved, different views projected.
EMA: AgentMemory compresses after 20 messages (loses detail).
**Steal:** Keep full log, project summarized view for LLM context.

## What EMA Does Better
- 138 PubSub broadcasts (Jido has basic event bus)
- 18 actor workspace with phase cadence (Jido has no actor model)
- Multi-provider SmartRouter (Jido has no routing)
- Proposal pipeline with debate (Jido has no proposal system)
- Integrated vault/wiki knowledge (Jido has no knowledge system)

## What to Avoid from Jido
- Over-abstraction: 117 files for agent framework (Pods, Topology, Discovery layers)
- Ecto for in-memory structs (defstruct + validation is simpler)
- Full Plugin manifest system (EMA's context modules work fine)
