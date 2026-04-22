---
title: "Foundry Auto-Tool Generator — Evaluation"
type: research
created: "2026-03-19"
updated: "2026-03-19"
tags: [tool-generation, mcp-tools, agent-dispatch, evaluation, skill-creation]
summary: "Evaluation of 'Foundry' as an auto-tool generator from usage patterns for our dispatch/skill auto-creation. Verdict: no such tool exists by this name; the concept is real but lives under different names in the ecosystem."
project: openclaw
status: complete
confidence: 0.90
source: web-research
---

# Foundry Auto-Tool Generator — Evaluation

**Forum thread:** 1483638822141956138 — "Evaluate Foundry (Auto-Tool Generator from Usage Patterns)"
**Question:** Is Foundry useful for our dispatch/skill auto-creation?
**Verdict:** ❌ **No actionable tool found under this name** — the concept is real but scattered across ecosystem without a discrete "Foundry" product.

---

## What Was Found

Multiple things are called "Foundry" in the AI/agent space. None match the description of "auto-tool generator from usage patterns."

### Things Named "Foundry"

| Product | What It Actually Is | Relevant? |
|---|---|---|
| `foundry-works/claude-foundry` | Claude Code plugin for spec-driven dev workflow | No — project scaffolding |
| `foundry-mcp` (Rust crate) | MCP server for project/spec management | No — project scaffolding |
| Microsoft Azure AI Foundry | Enterprise AI platform with manual tool registration | No — closed enterprise |
| Palantir AIP Foundry | Enterprise analytics platform with Agent Studio | No — closed ecosystem |
| Infosys Agentic Foundry | Enterprise agent builder with NL-to-tool (partial) | No — closed enterprise |

### The Actual Concept (Lives Elsewhere)

The concept of "auto-generating tools from usage patterns" is real but distributed:

1. **Anthropic's Advanced Tool Use / Tool Search Tool** — deferred tool loading where Claude discovers which tools to call based on task context. Reduces token overhead 85%. Accuracy: Opus 4 went from 49% → 74%, Opus 4.5 from 79.5% → 88.1%. This is the closest thing to what the thread described.
   - Docs: https://www.anthropic.com/engineering/advanced-tool-use

2. **Anthropic's tool refinement guidance** — using observed agent behavior (transcripts, tool call metrics, CoT traces) to iteratively refine tool definitions and using Claude Code to auto-optimize tool descriptions against evaluations.
   - Docs: https://www.anthropic.com/engineering/writing-tools-for-agents

3. **toolkit-ai/toolkit-ai** — generated LangChain tool code from natural language descriptions. Abandoned 2023, predates MCP. Not relevant.

---

## Assessment for Our Stack

**For dispatch/skill auto-creation:** There is no drop-in tool to install.

The pattern we would want is:
- Observe how agents call existing skills/tools
- Identify gaps (tasks that required improvising or failed)
- Auto-generate new skill definitions from those patterns

This is something we'd build ourselves, not install. The closest available primitive is **Anthropic's deferred tool loading** (`ToolSearch` in Claude Code), which we already use. The rest is evaluation loop design — watch traces, identify gaps, write new skills.

### Could We Build This?

Yes, with:
1. **Opik** (see separate evaluation) to capture agent traces and tool call patterns
2. A periodic analysis job that reads traces and identifies: repeated ad-hoc tool use, failed tool matches, manually improvised solutions
3. A skill-writing pipeline that drafts new skill definitions from the identified patterns and sends them for human review

This is a 3-step pipeline we could design. It doesn't require a "Foundry" product.

---

## Recommendation

**Don't install anything.** The tool as described doesn't exist as a discrete product.

**Instead:**
1. Use **Opik** to capture dispatch traces (actionable now)
2. Design a skill-gap analysis routine once we have trace data (future)
3. Monitor `foundry-works/claude-foundry` — it's early-stage but the spec-driven workflow concept is interesting for structured skill creation

**Priority:** P3 — revisit after Opik is installed and collecting trace data.

---

## Related
- [[Opik Agent Tracing Evaluation]]
- [[Three-Tier Memory Architecture]]
- [[OpenClaw Ecosystem]]
