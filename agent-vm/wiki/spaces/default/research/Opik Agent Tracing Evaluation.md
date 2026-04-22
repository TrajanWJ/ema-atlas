---
title: Opik Agent Tracing — Evaluation
type: research
created: '2026-03-19'
updated: '2026-03-19'
tags:
  - observability
  - tracing
  - agent-dispatch
  - llm-monitoring
  - self-hosted
  - evaluation
summary: >-
  Evaluation of Opik (by Comet ML) for agent tracing and observability. Verdict:
  strong recommendation to install — actively maintained, self-hostable for
  free, has OpenClaw native plugin, supports Claude natively, and traces
  multi-agent hierarchies.
project: openclaw
status: actionable
confidence: 0.92
source: web-research
wiki_id: research/Opik_Agent_Tracing_Evaluation
imported_from: vault/Research/Opik Agent Tracing Evaluation.md
imported_at: '2026-04-04T00:23:57.099Z'
---

# Opik Agent Tracing — Evaluation

**Forum thread:** 1483638785303384204 — "Evaluate Opik (Agent Tracing/Observability)"
**Question:** Does Opik help us debug agent dispatch issues?
**Verdict:** ✅ **Strong recommendation to install** — this directly addresses our debugging gaps.

---

## What Is Opik?

Opik is an open-source LLM observability, evaluation, and agent optimization platform built by Comet ML.

- **GitHub:** https://github.com/comet-ml/opik (18.4k stars)
- **Docs:** https://www.comet.com/docs/opik/
- **License:** Apache 2.0 (open source, free to self-host in full)
- **Status:** Actively maintained. Latest release: v1.10.43 on **March 18, 2026** (yesterday). Weekly releases.
- **Python SDK:** `pip install opik` (Python ≥ 3.10)
- **Self-host:** Docker Compose or Kubernetes/Helm — full feature parity, no paywalled features

---

## Critical Finding: OpenClaw Native Plugin

There is an official **opik-openclaw** plugin:
- **GitHub:** https://github.com/comet-ml/opik-openclaw
- Blog post: https://www.comet.com/site/blog/opik-claude-code-plugin/

This provides full-stack tracing for the OpenClaw agent framework including agent delegation tracing. This means Opik already knows about our ecosystem and may work with near-zero configuration overhead.

---

## What Opik Traces

Opik captures traces at multiple granularity levels, all linked in a hierarchical span tree:

- **LLM calls:** input, output, model, token count, cost, latency
- **Tool/function calls:** tool name, inputs, outputs, execution time
- **Agent steps:** individual decision points and reasoning steps
- **Multi-agent workflows:** parent-child span trees across agent handoffs, sub-agent delegation, memory recalls
- **Threads:** collections of traces forming a conversation/workflow session
- **Errors:** stack traces and exceptions per span

**For multi-agent systems:** The `track_adk_agent_recursive` pattern instruments an entire agent tree from a single top-level call. Agent graphs are visualized as auto-generated Mermaid diagrams.

---

## Claude/Anthropic Support

Native first-class support:

```python
from opik.integrations.anthropic import track_anthropic
client = track_anthropic(anthropic.Anthropic())
# All subsequent Claude calls are automatically traced
```

Captures: prompt input, model name, token usage, cost, response. Claude Sonnet 4.6 is now the default Anthropic model in the Opik platform itself.

Also integrates via AWS Bedrock and Claude Code natively.

---

## How It Helps Debug Dispatch Issues

Our specific pain points and how Opik addresses them:

| Pain Point | How Opik Helps |
|---|---|
| Which agent dispatched what and when? | Hierarchical span tree shows full delegation chain per trace |
| Why did a dispatch route to the wrong agent? | Full input context captured at dispatch point |
| Where in the chain did it fail? | Exception and error tracking per span with stack traces |
| How long did each step take? | Latency per span, waterfall view |
| Which tool calls happened in each dispatch? | Tool calls captured as child spans with inputs/outputs |
| Are certain dispatch paths consistently slow? | Thread-level analytics aggregate across multiple traces |
| What's the cost of a given workflow? | Token and cost tracking per trace |

The **agent graph visualization** (Mermaid diagram per trace) gives a structural view of the agent topology, making it easy to spot where routing went wrong.

---

## Self-Hosting Setup

```bash
# Docker Compose (local/dev)
git clone https://github.com/comet-ml/opik
cd opik/deployment/docker-compose
./opik.sh
# UI at localhost:5173
```

Kubernetes/Helm available for production. Full features at no cost.

---

## Comparison to Alternatives

| Tool | Self-host (full) | Multi-agent tracing | Claude native | Agent graph viz | Opik openclaw plugin |
|---|---|---|---|---|---|
| **Opik** | ✅ Free | ✅ Deep | ✅ Yes | ✅ Yes | ✅ Yes |
| LangSmith | ❌ Paid | ✅ Deep | Via wrapper | ✅ Yes | No |
| Langfuse | ✅ Free | Good | Via SDK | No | No |
| Helicone | ✅ Free | Shallow | Via proxy | No | No |

**Winner for our use case:** Opik — only one with an OpenClaw plugin, Claude native support, deep multi-agent tracing, AND free self-hosting.

---

## Installation Plan

### Phase 1: Local Docker (Immediate)
```bash
# 1. Self-host Opik
git clone https://github.com/comet-ml/opik
cd opik/deployment/docker-compose && ./opik.sh

# 2. Install SDK
pip install opik

# 3. Configure API endpoint to local instance
export OPIK_URL_OVERRIDE=http://localhost:5173
export OPIK_API_KEY=local

# 4. Check opik-openclaw plugin for OpenClaw-specific setup
# https://github.com/comet-ml/opik-openclaw
```

### Phase 2: Instrument dispatch system
For custom agent dispatch (not in the 60+ supported frameworks list), use the manual span API:

```python
import opik

@opik.track
def dispatch_agent(task: dict) -> dict:
    # existing dispatch logic
    ...
```

Or if dispatch is in bash/node: use the REST API to log spans directly.

### Phase 3: Production consideration
- Move to Kubernetes/Helm if Docker Compose becomes insufficient
- Or use Comet cloud free tier (25k spans/month) to start without infra overhead

---

## Pricing

| Tier | Spans/month | Cost |
|---|---|---|
| Self-hosted | Unlimited | Free |
| Cloud Free | 25k | Free |
| Cloud Pro | 100k | $39/month |

For our dispatch volume: cloud free tier likely sufficient for initial evaluation; self-hosted for production.

---

## Recommendation

**Install Opik.** This directly solves our agent dispatch debugging blind spots.

**Priority:** P1 — install this sprint.

**Steps:**
1. Read opik-openclaw plugin docs to understand native integration scope
2. Self-host with Docker Compose locally
3. Instrument the dispatcher/dispatch-engine
4. Instrument the researcher and coder agents
5. Run a few real tasks and review traces in the UI

**Expected outcome:** Within one sprint, we should have full visibility into every dispatch decision, tool call, and agent handoff. Debug time for dispatch issues should drop significantly.

---

## Related
- [[Foundry Auto-Tool Generator Evaluation]]
- [[Three-Tier Memory Architecture]]
- [[OpenClaw Ecosystem]]
- [[Agent Dispatch Architecture]]
