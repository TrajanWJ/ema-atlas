---
title: "Intelligence Layer - System Vision"
created: 2026-03-24
type: architecture
status: aspirational
confidence: 0.90
source: trajan-direct
tags: [architecture, metaprompting, orchestration, intelligence-layer, vision]
domain: system-design
summary: "Vision for a universal intelligence layer that sits above all tools and agents — handling intent parsing, metaprompting, prompt consulting, and orchestration for every interaction, not just code tasks."
---

# Intelligence Layer — System Vision

## Core Principle

**Claude Code is for action tasks only.** The intelligence layer — LLM review, metaprompting, intent parsing, prompt consulting — runs on **every interaction**, including queries that never touch Claude Code or any specialist agent.

## The Intelligence Layer

A persistent processing layer that intercepts every inbound request and applies structured LLM reasoning before routing anywhere. This isn't just a dispatch classifier — it's a thinking layer.

### What It Does

1. **Intent Parsing** — Figure out exactly what Trajan wants, not just what he said. Expand shorthand, resolve ambiguity, infer context from recent history and vault knowledge. Ask: "What is the real question here? What would the ideal version of this request look like?"

2. **Question Refinement** — Determine the *right* question to ask. Often the stated question isn't the best framing. The layer should reformulate, sharpen, and sometimes decompose a single question into the 2-3 sub-questions that actually need answering.

3. **Routing Intelligence** — Who is the right person/tool/system to answer this? Options include:
   - Direct response (Right Hand handles it)
   - Claude Code session (action tasks — building, fixing, implementing)
   - Specialist agent (research, security, ops, etc.)
   - External tool (web search, vault search, API call)
   - REPL loop (iterative exploration)
   - Multi-agent orchestration (complex workflows)
   - Human escalation (needs Trajan's input)

4. **Metaprompting** — Every dispatch to any destination gets prompt-engineered first. Not just code tasks. A research query gets the same structured enrichment as a build task — vault context, domain expertise, success criteria, verification steps.

5. **Prompt Consulting** — Domain-matched consultants review the enriched prompt before it fires. The peer review pipeline currently only runs for dispatched tasks — it should run (in lightweight form) for everything.

## Capabilities the Layer Should Have

- **Initialize any agent orchestration** — spawn specialists, multi-agent teams, adversarial reviews
- **Start REPL loops** — iterative exploration sessions where each round builds on the last
- **Call any tool** — web search, vault search, browser, file ops, SSH, APIs
- **Chain reasoning** — planner LLM creates structured plan → executor follows it → results feed back
- **Session awareness** — knows what's been done before, what sessions exist, what context is available
- **Self-improving** — tracks which enrichments actually helped, which routing decisions were correct, feeds back into its own prompts

## Architecture Aspiration

```
Trajan's message
    ↓
┌─────────────────────────┐
│   INTELLIGENCE LAYER    │
│                         │
│  1. Intent parsing      │
│  2. Question refinement │
│  3. Context enrichment  │
│     (vault, memory,     │
│      session history)   │
│  4. Routing decision    │
│  5. Prompt engineering  │
│  6. Consultant review   │
│     (lightweight or     │
│      full depending     │
│      on complexity)     │
│  7. Dispatch            │
└─────────┬───────────────┘
          ↓
    ┌─────┼─────┬─────┬────────┐
    ↓     ↓     ↓     ↓        ↓
  Direct  Code  Agent  Tool   REPL
  Reply   Task  Team   Call   Loop
```

## Key Distinction from Current System

**Current:** Peer review pipeline only runs when dispatching to Claude Code agents. Simple questions get answered directly without structured processing.

**Vision:** Every interaction — even "what time is it in Tokyo" — passes through the intelligence layer. The layer decides how much processing is needed (fast-track vs full review), but it *always* runs. The intent parsing and question refinement happen on everything.

## What This Enables

- **Better answers to simple questions** — even direct responses benefit from intent parsing and context enrichment
- **Automatic escalation** — a question that seems simple might actually warrant deep research; the layer catches that
- **Prompt chains** — Trajan's current manual workflow of "prompt an LLM to create a plan for another LLM" becomes automatic
- **Continuous learning** — every interaction feeds the effectiveness loop, not just dispatched tasks
- **Tool discovery** — the layer knows what tools exist and can suggest or use ones Trajan might not think to invoke

## Implementation Phases

### Phase 1: Universal Intent Layer
- Wrap Right Hand's input processing in a structured intent-parse step
- Run lightweight enrichment (vault context, recent memory) on all inputs
- Log intents to track patterns

### Phase 2: Routing Intelligence
- Expand routing beyond agents to include tools, REPL loops, multi-agent workflows
- Session matching for all interaction types, not just code tasks
- Automatic complexity scoring for everything

### Phase 3: Full Prompt Chain Automation
- Planner → Enricher → Consultant → Executor pipeline runs automatically
- Self-tuning based on effectiveness tracking
- Trajan's manual LLM-to-LLM workflow fully automated

### Phase 4: Self-Improving Intelligence
- Track which enrichments improved outcomes
- A/B test routing decisions
- Evolve the layer's own prompts based on data

## Relationship to Existing Components

| Component | Current Role | Future Role |
|---|---|---|
| Peer Review Pipeline | Code task enrichment only | Lightweight version runs on everything |
| Session Manager | Tracks Claude Code sessions | Tracks all interaction sessions and context |
| Dispatch Engine | Routes tasks to agents | Becomes one of many output channels |
| Right Hand | Input processor + router | Embodies the intelligence layer directly |
| Vault | Reference storage | Active context source for every interaction |

## Notes

- The intelligence layer IS Right Hand, evolved. Not a separate system.
- Claude Code remains the action executor. The layer is the thinking that happens before and after.
- "Who is the right person to ask" includes external sources — not just agents.
- Every interaction should feel like talking to someone who deeply understands what you want, even when you don't articulate it perfectly.
