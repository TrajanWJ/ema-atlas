---
title: "Why AI Systems Don't Learn — System A/B/M Architecture"
type: research-paper
tags: [autonomous-learning, agent-architecture, cognitive-science, meta-control, self-improvement]
source: https://arxiv.org/abs/2603.15381
authors: [Emmanuel Dupoux, "FAIR at META", "NYU", "UC Berkeley"]
date: "2026-03-16"
created: "2026-03-18"
relevance: high
summary: "Three-system autonomous learning architecture from cognitive science. System A (observe/passive SSL) + System B (act/RL) + System M (meta-controller switching between them). Directly applicable to agent self-evolution and autonomous skill acquisition."
key_concepts: [System-A, System-B, System-M, autonomous-learning, domain-mismatch, meta-control, bilevel-optimization]
updated: 2026-03-18
status: active
confidence: 0.80
confidence_updated: 2026-03-18
---

# Why AI Systems Don't Learn — And What To Do About It

**Paper:** arXiv:2603.15381 | March 2026 | Emmanuel Dupoux (FAIR/META, EHESS, NYU, UC Berkeley)

## The Core Problem

Current AI models, once deployed, **learn essentially nothing**. Their mode of operation is fixed. If not adapted to their environment, a new model has to be rebuilt by human experts.

Three roadblocks:
1. **Fragmented learning modes** — SSL, RL, supervised all siloed in separate subfields
2. **Externalised learning** — human experts do the data curation, filtering, recipe sequencing that should be automatic
3. **No methods to build such architectures at scale** — evolutionary/bilevel optimization needed

## The Three Systems

### System A — Learning from Observation (passive)
The organism accumulates sensory input and builds a statistical/predictive model.

**AI equivalents:** Self-supervised learning (SSL), language modeling, CLIP, DINO, V-JEPA, world models
**Strengths:** Scales with data, discovers hierarchical abstract representations
**Weaknesses:** Needs human-curated data and task generators, can't decide what data to seek, representations disconnected from action, can't distinguish correlation from causation

### System B — Learning from Action (active)
The organism interacts with the world, tries to achieve goals by adjusting actions against environment feedback.

**AI equivalents:** RL, model-based RL, planning, MuZero, Dreamer
**Strengths:** Grounded in interaction, learns from sparse/delayed rewards, discovers novel solutions
**Weaknesses:** Sample-inefficient, struggles in high-dim action spaces, needs well-specified rewards

### System M — Meta-Control (the key innovation)
A meta-controller that **internally generates signals** to switch between System A and System B, coordinating information flow between them automatically — replacing the human engineer's role in sequencing training recipes.

System M enables:
- Learning through **verbal interaction** (communication)
- Learning through **imagination** (self-play, mental simulation)
- Automatic data filtering and curation
- Flexible switching between observe/act modes based on context

## How A and B Help Each Other

**System A → System B:**
- Provides compressed state/action representations (reduces RL search space)
- Predictive world models (enables planning vs blind trial-and-error)
- Intrinsic reward signals (curiosity, novelty, uncertainty → better exploration)

**System B → System A:**
- Active SSL: System B selects "interesting" data to learn from (uncertainty, prediction error)
- Goal-directed SSL: B's exploration generates rich, grounded data for A
- Interventions that reveal causal relationships passive observation would miss

## Higher-Order Learning Modes (unique to large brains)

With System M coordinating A+B, new learning modes emerge:
- **Imitation** — observe peers (A) then replicate (B)
- **Communication** — verbal instruction updates world model (A→B)
- **Imagination/self-play** — simulate in world model (A), plan (B), without real interaction

## Evolutionary Bilevel Optimization (how to build System M)

To learn System M (the meta-controller) itself:
- **Outer loop:** Evolution/meta-learning optimizes initial states of A, B, M for generalization
- **Inner loop:** Standard gradient descent for A and B during task learning
- Inspired by how evolution shaped meta-learning in biological organisms across timescales

## Mapping to OpenClaw Agent Architecture

| Paper Concept | [[OpenClaw]] Equivalent |
|---|---|
| System A (observation) | Agent reading vault, fetching web, passive context ingestion |
| System B (action) | Agent executing tools, writing files, deploying code |
| System M (meta-control) | Orchestrator deciding which agent/mode to invoke |
| Domain mismatch | Agents encountering unfamiliar tasks not in SOUL.md/skills |
| Externalised learning | Trajan writing SOUL.md / skills manually |
| Autonomous learning | [[evolution-loop]] skill, [[context-evolution]] skill |
| Intrinsic reward (A→B) | Curiosity signals in agent selection (what to explore next) |
| Data curation (M) | [[Auto-knowledge]] skill capturing session transcripts |

## Implications for Our System

**Current state:** We have good System A (vault, web search, context) and System B (tool execution, coding agents). System M is weak — mostly explicit user instructions ("do this").

**What System M would look like here:**
- Orchestrator that *internally decides* when to gather more context vs. act
- Agents that notice domain mismatch and switch to learning mode automatically
- Self-improving agents that generate their own training signals (correction logs)
- [[evolution-loop]] + [[context-evolution]] + feedback-loop together = crude System M

**Key insight:** The bottleneck isn't model capability — it's the **externalisation of the learning recipe**. Every time Trajan writes a SOUL.md or corrects an agent, that's System M being performed manually. Building System M means automating that loop.

## Related Work Mentioned

- MuZero, DreamerV3 — A+B integration in games
- V-JEPA (META) — latent-space predictive model
- Global Workspace Theory — cognitive architecture for flexibility
- LeCun 2022 "Path" architecture — energy-based A+B integration
- ACT, SOAR — classical cognitive architectures adapted to deep learning

- [[Agent-Architecture-Synthesis-2026-03]]
- [[LangChain-Deep-Agents]]
## Status / Next Steps

Filed: 2026-03-18
Relevance to our work: **High** — directly maps to agent self-evolution design
Next: Apply System M framing to [[evolution-loop]] skill design. The Orchestrator should be System M.
