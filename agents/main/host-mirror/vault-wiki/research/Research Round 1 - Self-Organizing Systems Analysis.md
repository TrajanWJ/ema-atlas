---
title: Research Round 1 - Self-Organizing Systems Analysis
created: '2026-03-16'
updated: '2026-03-16'
type: research
status: active
confidence: 0.4
confidence_updated: 2026-03-18T00:00:00.000Z
source: auto-capture
tags:
  - bureau
  - multi-agent
  - research
  - self-improving
  - self-organizing
summary: >-
  These are capabilities that don't exist yet but could emerge by combining
  things we already have.
wiki_id: research/Research_Round_1_-_Self-Organizing_Systems_Analysis
imported_from: vault/Research/Research Round 1 - Self-Organizing Systems Analysis.md
imported_at: '2026-04-04T00:23:57.107Z'
---
# Research Round 1 — Self-Organizing Systems Analysis

**Date:** 2026-03-16
**Researcher:** System Research Agent
**Status:** Complete
**Scope:** Vault synthesis + external research on multi-agent orchestration, self-improving agents, dynamic prompt adaptation, and roster auto-management

---

## 1. COMBINABLE CONCEPTS — Emergent Capabilities from Existing Vault

These are capabilities that don't exist yet but could emerge by combining things we already have.

### A. SCOPE + System Self-Reflection → Auto-Evolving SOUL.md Files

**What we have:**
- Metaprompting doc (Layer 2) describes adaptive agent prompts with self-reflection protocol
- [[Auto-Knowledge Architecture]] already scans transcripts and detects patterns
- System review already evaluates agent health weekly

**What's new:** The [SCOPE framework](https://arxiv.org/abs/2512.15374) (arXiv:2512.15374, Dec 2025) formalizes exactly what our Layer 2 describes. SCOPE treats prompt evolution as an online optimization problem with a Dual-Stream mechanism:
- **Tactical stream:** Fix immediate errors (our "what could be improved?" reflection)
- **Strategic stream:** Evolve long-term principles (our "should a new pattern be added to SOUL.md?")

**Combination:** Wire `transcript-scanner.py` output into a SCOPE-style dual-stream evaluator. Tactical fixes go to `proposed-amendments.md` for Right Hand review. Strategic principles accumulate in a `vault/Agents/{agent}/evolution-log.md`. System review approves/rejects batched amendments. This turns static SOUL.md files into living documents that evolve from execution traces.

**Effort:** Medium. Requires adding evaluation logic to transcript scanner output.

### B. ACE + Vault Memory Pipeline → Self-Improving Context Engineering

**What we have:**
- Daily notes → MEMORY.md consolidation pipeline
- Workspace-per-agent isolation (AGENTS.md, TOOLS.md, SOUL.md)
- Context engineering validated by arXiv:2603.09619 (already in vault research)

**What's new:** [Agentic Context Engineering (ACE)](https://arxiv.org/abs/2510.04618) (arXiv:2510.04618, Oct 2025) treats agent contexts as evolving playbooks with three components:
- **Generator:** Produces reasoning trajectories
- **Reflector:** Separates evaluation from insight extraction
- **Curator:** Converts lessons into structured delta updates with helpful/harmful counters

ACE achieves +10.6% on agent benchmarks and matches top-ranked production agents using smaller models. Key innovation: deterministic merging with de-duplication and pruning prevents context collapse.

**Combination:** Our vault memory pipeline (daily notes → consolidation) IS a manual ACE Curator. Formalize it:
1. Each agent's `memory/` directory becomes an ACE playbook
2. `capture.sh` acts as the Reflector (already extracts structured suggestions)
3. Add helpful/harmful counters to memory entries
4. Prune entries that accumulate harmful counters during System review

**Effort:** Low-Medium. Mostly structural — add counters to existing capture format.

### C. VMAO DAG Decomposition + System Routing → Parallel Research Pipelines

**What we have:**
- Right Hand routes to specialists sequentially
- Sub-agent spawning at depth-2
- Research Pipeline workflow ([[deep-research-pro]] → vault → ontology-sync)

**What's new:** VMAO (arXiv:2603.11445, already in vault) showed DAG-based task decomposition with parallel execution and verification loops yields completeness improvements from 3.1→4.2.

**Combination:** For complex research tasks:
1. Right Hand decomposes the query into a dependency DAG
2. Independent sub-queries execute in parallel via sub-agents
3. Each sub-agent result passes through a verification step
4. Results merge only after verification passes
5. Failed verifications trigger adaptive replanning

This is what THIS research round is doing manually. Automate it.

**Effort:** High. Requires DAG representation + parallel execution + verification logic.

### D. Pattern Detector + EvoAgentX Mutations → Self-Optimizing Skill Library

**What we have:**
- `pattern-detector.py` tracks repeated task patterns (threshold: 5+ across 2+ days)
- [[Skill proposals]] go to `vault/Agents/Skill Proposals.md`
- 39 installed skills

**What's new:** [EvoAgentX](https://github.com/EvoAgentX/EvoAgentX) (EMNLP 2025 Demo) evolves agentic workflows using optimization strategies: retrieval augmentation, mutation, and guided search. Skills aren't just created — they're iteratively improved through execution feedback.

**Combination:** After a skill is created and used 10+ times:
1. Pattern detector collects execution traces for that skill
2. Mutation engine proposes skill variants (different prompts, tool orderings, context strategies)
3. A/B test variants on next invocations
4. Best-performing variant replaces the original
5. Log evolution history in `vault/Skills/{skill}/evolution.md`

**Effort:** High. Requires execution trace collection per skill + variant testing infrastructure.

---

## 2. DEPRECATED OR REDUNDANT — What to Retire

### A. Sequential Specialist Routing (partially deprecated)
**Current:** Right Hand sends tasks to specialists one at a time.
**Problem:** VMAO, LangGraph, and AG2 all demonstrate that parallel DAG execution dramatically outperforms sequential routing for decomposable tasks.
**Action:** Don't remove sequential routing (still needed for dependent tasks), but add parallel dispatch as the default for independent sub-tasks.

### B. Activity-Count-Based Agent Evaluation (deprecated by chaos research)
**Current:** System review evaluates agents by message volume and last-active date.
**Problem:** The chaos dynamics paper (arXiv:2603.09127, in vault) shows multi-agent interactions are inherently chaotic. Volume ≠ quality. An agent could be very active but producing unstable outputs.
**Action:** Replace activity counts with stability scores (output variance across similar tasks) + quality verification pass rates.

### C. Static Skill Loading (deprecated by context engineering)
**Current:** Agents load all their configured skills regardless of task.
**Problem:** Metaprompting doc (Layer 4) already identifies this. SPEAR framework (VLDB CIDR 2026) and the context engineering paper both confirm: static prompt loading wastes context window.
**Action:** Implement dynamic skill loading based on task domain parsing. The Metaprompting doc's Layer 4 plan is correct — execute it.

### D. Manual Agent Template Authoring (partially deprecated)
**Current:** [[Agent Templates Index]] has manually written SOUL.md templates.
**Problem:** ToolRosetta (arXiv:2603.09290, in vault) auto-converts repos to MCP tools. EvoAgentX auto-generates agent workflows. Manual template authoring should be the fallback, not the primary method.
**Action:** Keep templates as seed examples but build auto-generation from pattern detection output.

### E. Unstructured Inter-Agent Communication (deprecated)
**Current:** Agents communicate via sub-agent task strings (plain text).
**Problem:** LDP (arXiv:2603.08852, in vault) shows identity-aware routing achieves 12x lower latency. Semantic frames reduce tokens by 37%. Our plain text handoffs waste tokens and lose structure.
**Action:** Define a structured handoff format: `{task, context_summary, expected_output_format, quality_criteria, deadline}`.

---

## 3. BLIND SPOTS — What We're Missing

### A. Vault Poisoning Defense (CRITICAL)
**Gap:** No verification layer on vault writes.
**Risk:** A hallucinating or compromised agent writes incorrect information to the vault. All downstream agents that read it are poisoned. The RAG poisoning article (already flagged in vault research) describes this exact attack vector.
**What research says:** The LDP paper found that unverified provenance metadata is WORSE than no provenance. The DCI paper shows unstructured multi-agent output degrades routine decisions.
**Recommendation:** Implement a vault write verification layer:
1. All agent vault writes go to a staging area (`vault/_staging/`)
2. A verification agent checks: factual grounding, citation presence, consistency with existing vault content
3. Verified notes promote to their target location
4. Failed verifications get flagged for human review
**Priority:** 🔥 CRITICAL — this is an existential risk for a self-organizing knowledge system.

### B. Prompt Versioning and Rollback (HIGH)
**Gap:** No tracking of which SOUL.md version produced which outcomes.
**Risk:** If auto-evolution (SCOPE/ACE) is implemented without versioning, a bad mutation could degrade an agent with no way to identify when or revert.
**What research says:** ACE uses helpful/harmful counters for exactly this reason. SCOPE's dual-stream explicitly separates tactical (revertible) from strategic (persistent) changes.
**Recommendation:** Git-track all SOUL.md and AGENTS.md files. Tag versions with performance metrics. System review compares current vs. previous version outcomes.
**Priority:** 🔥 HIGH — prerequisite for any self-improvement system.

### C. Human-in-the-Loop Autonomy Spectrum (MEDIUM)
**Gap:** the system is designed for full autonomy, but research shows a spectrum is needed.
**What research says:** [Deloitte's 2026 report](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/ai-agent-orchestration.html) identifies a progressive autonomy spectrum: humans in the loop → on the loop → out of the loop. The level should vary by task complexity, domain, and outcome criticality.
**Current state:** the system has binary modes: either the Right Hand decides, or a human is asked. No middle ground.
**Recommendation:** Define autonomy tiers per task type:
- **Tier 1 (autonomous):** Routine captures, indexing, health checks
- **Tier 2 (notify):** Skill creation, [[agent roster]] changes — execute but notify
- **Tier 3 (approve):** Architecture changes, vault schema changes, external actions
**Priority:** ✅ MEDIUM — important for trust as the system scales.

### D. Cross-Agent Learning (MEDIUM)
**Gap:** Each agent's memory is isolated. Lessons learned by one specialist don't transfer to others.
**What research says:** The [self-evolving agents survey](https://arxiv.org/abs/2508.07407) (arXiv:2508.07407) identifies "lifelong learning" as the key differentiator between static and evolving agent systems. [EvoAgentX](https://github.com/EvoAgentX/EvoAgentX) implements cross-agent knowledge sharing through a shared evolution memory.
**Recommendation:** Add a `vault/Agents/shared-learnings.md` that captures generalizable lessons. System review promotes agent-specific learnings that apply broadly. Pattern detector identifies cross-cutting concerns.
**Priority:** ✅ MEDIUM — becomes critical as specialist count grows.

### E. Cost-Aware Orchestration (MEDIUM)
**Gap:** No cost modeling per agent interaction.
**What research says:** DCI (arXiv:2603.11781, in vault) costs ~62x single-agent tokens. The context engineering paper emphasizes "Economy" as one of 5 context quality criteria. Usage gating (already in [[auto-knowledge]]) is a crude version of this.
**Current state:** We gate on weekly usage percentage but don't optimize which agents to invoke based on cost/benefit.
**Recommendation:** Track token cost per agent per task type. Route cheap tasks to cheaper models (haiku). Reserve expensive models for complex tasks. System review includes cost efficiency metrics.
**Priority:** ✅ MEDIUM — the usage-gating system is a foundation to build on.

### F. Formal Agent Communication Protocol (LOW-MEDIUM)
**Gap:** No structured protocol for agent-to-agent delegation.
**What research says:** [Microsoft's AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) defines handoff, graph-based, and group-chat patterns. LDP proposes delegate identity cards, progressive payload negotiation, and governed sessions. AG2's GroupChat pattern shows a selector-based approach.
**Recommendation:** Start with structured handoff objects (see Section 2E above). Evolve toward identity cards if the system scales beyond 10 specialists.
**Priority:** ⚠️ LOW-MEDIUM — current scale doesn't require full protocol.

---

## 4. RECOMMENDATIONS — What to Implement Next

### Priority 1: Vault Write Verification (Week of March 16)
- Create `vault/_staging/` directory
- Add verification step to `capture.sh` output pipeline
- Verification checks: citation present, no contradiction with existing notes, factual grounding
- Failed checks → `vault/_staging/_flagged/` for human review
- **Why first:** Without this, every other self-improvement feature is a potential attack vector against the vault.

### Priority 2: Prompt Versioning (Week of March 16)
- Git-track all agent workspace files (SOUL.md, AGENTS.md, TOOLS.md)
- Add version tags with timestamps
- System review compares outcomes across versions
- **Why second:** Prerequisite for any self-evolution. Without versioning, mutations are irreversible.

### Priority 3: SCOPE-Style Prompt Evolution (Week of March 23)
- Extend `transcript-scanner.py` to emit tactical fixes and strategic principles
- Tactical fixes → `proposed-amendments.md` (agent-specific)
- Strategic principles → `evolution-log.md` (agent-specific, append-only)
- System review approves/rejects amendments weekly
- **Why third:** This is the highest-value self-improvement capability with the lowest risk (human review gate).

### Priority 4: Structured Handoff Format (Week of March 23)
- Define JSON schema for agent-to-agent handoffs
- Fields: `{task, context_summary, expected_output, quality_criteria, source_agent, priority}`
- Implement in Right Hand routing logic
- **Why fourth:** Reduces token waste and improves routing quality. Modest effort.

### Priority 5: Parallel DAG Execution for Research (Week of March 30)
- Implement DAG decomposition for research tasks
- Right Hand generates dependency graph from complex queries
- Independent nodes execute as parallel sub-agents
- Add verification step before merging results
- **Why fifth:** Highest complexity but highest throughput improvement for research.

### Priority 6: ACE-Style Memory Evolution (Week of March 30)
- Add helpful/harmful counters to vault memory entries
- Pruning logic in System review removes entries with net-negative counters
- Formalize daily notes → memory consolidation as ACE Curator pattern
- **Why sixth:** Builds on existing infrastructure. Makes memory self-correcting.

---

## 5. FRAMEWORK LANDSCAPE — March 2026

| Framework | Orchestration Model | Self-Evolution | System Relevance |
|---|---|---|---|
| [OpenAI Agents SDK](https://platform.openai.com) | Handoff-based | None | Low (different paradigm) |
| [LangGraph](https://github.com/langchain-ai/langgraph) | Graph/state machine | None | Medium (DAG patterns) |
| [AG2 (AutoGen)](https://github.com/microsoft/autogen) | GroupChat + selector | None | Medium (debate patterns) |
| [CrewAI](https://github.com/crewAIInc/crewAI) | Role-based teams | Basic reflection | Medium (role templates) |
| [EvoAgentX](https://github.com/EvoAgentX/EvoAgentX) | Modular workflows | Full evolution | 🔥 HIGH (closest match) |
| [ACE](https://github.com/ace-agent/ace) | Context playbooks | Context evolution | 🔥 HIGH (memory pattern) |
| [SCOPE](https://github.com/AgentPei/SCOPE) | Prompt optimization | Prompt evolution | 🔥 HIGH (SOUL.md evolution) |
| [SPEAR](https://vldb.org/cidrdb/papers/2026/p26-cetintemel.pdf) | Prompt-as-first-class | Runtime refinement | Medium (prompt algebra) |

**Key insight:** EvoAgentX, ACE, and SCOPE are the three frameworks most aligned with the system's vision. They're solving the same problem from different angles: agent evolution (EvoAgentX), context evolution (ACE), and prompt evolution (SCOPE). the system could integrate insights from all three.

---

## 6. SOURCES

### Papers (in vault)
- arXiv:2603.12229 — LLM Teams as Distributed Systems (Mieczkowski et al.)
- arXiv:2603.11781 — Deliberative Collective Intelligence (Prakash et al.)
- arXiv:2603.11445 — Verified Multi-Agent Orchestration (Zhang et al.)
- arXiv:2603.09619 — Context Engineering (industry/academic hybrid)
- arXiv:2603.09127 — Chaotic Dynamics in Multi-LLM Deliberation (Shimao et al.)
- arXiv:2603.08852 — LLM Delegate Protocol (AI-native communication)
- arXiv:2603.08425 — IronEngine General AI Assistant
- arXiv:2603.09890 — Policy-Parameterized Prompts (Bo et al.)
- arXiv:2603.09290 — ToolRosetta (Di et al.)

### Papers (new from this research)
- [arXiv:2512.15374 — SCOPE: Prompt Evolution for Enhancing Agent Effectiveness](https://arxiv.org/abs/2512.15374) (Pei et al., Dec 2025)
- [arXiv:2510.04618 — Agentic Context Engineering: Evolving Contexts for Self-Improving LMs](https://arxiv.org/abs/2510.04618) (Zhang et al., Oct 2025)
- [arXiv:2508.07407 — Comprehensive Survey of Self-Evolving AI Agents](https://arxiv.org/abs/2508.07407) (Fang et al., Aug 2025)
- [arXiv:2507.21046 — Survey of Self-Evolving Agents](https://arxiv.org/abs/2507.21046) (CharlesQ9 et al., Jul 2025)
- [SPEAR: Prompts as First-Class Citizens for Adaptive LLM Pipelines](https://vldb.org/cidrdb/papers/2026/p26-cetintemel.pdf) (Cetintemel, VLDB CIDR 2026)

### Frameworks & Tools
- [EvoAgentX](https://github.com/EvoAgentX/EvoAgentX) — Self-evolving agent ecosystem (EMNLP 2025)
- [ACE Framework](https://github.com/ace-agent/ace) — Agentic Context Engineering
- [SCOPE Framework](https://github.com/AgentPei/SCOPE) — Prompt evolution
- [Context Gateway by Compresr.ai](https://github.com/Compresr-ai/Context-Gateway) — Agentic context compression

### Industry Reports
- [Deloitte 2026 — AI Agent Orchestration](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/ai-agent-orchestration.html)
- [Microsoft — AI Agent Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [CIO — Taming AI Agents: The Autonomous Workforce of 2026](https://www.cio.com/article/4064998/taming-ai-agents-the-autonomous-workforce-of-2026.html)
- [Cogent — AI-Driven Self-Evolving Software](https://cogentinfo.com/resources/ai-driven-self-evolving-software-the-rise-of-autonomous-codebases-by-2026)
- [SDG Group — Evolution of Prompt Engineering to Context Design](https://www.sdggroup.com/en/insights/blog/the-evolution-of-prompt-engineering-to-context-design-in-2026)

### Vault References
- [[System/System Overview]] — Master plan (5 levels)
- [[Architecture/Auto-Knowledge Architecture]] — Production pipeline
- [[Research/Self-Organizing Agent Architectures]] — Prior research deep dive
- [[Research/Metaprompting and Dynamic Agent Architecture]] — Metaprompting layers
- [[Sourced-HQ-inspo/agents/Agent Templates Index]] — SOUL.md templates
- [[Sourced-HQ-inspo/workflows/Agent Automation Workflows]] — Workflow patterns

---

*Generated by System Research Agent — Round 1 of systematic analysis.*
*Next round should focus on: implementation prototypes for Priority 1-2, deep-dive into EvoAgentX architecture for System integration.*

#research #bureau #self-organizing #multi-agent #self-improving
