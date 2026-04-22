---
title: "ArXiv Digest: Second Pass 2026-03-27"
type: research
created: 2026-03-27
confidence: 0.85
tags: [arxiv, research, llm, agents, hci, memory, code-agents, tool-calling]
summary: "Second arxiv pass covering HCI+AI, memory, agent failures, self-improving code, knowledge graphs"
---

# ArXiv Digest: Second Pass 2026-03-27
*Sources: 5 primary papers (T1 primary — all direct arxiv abstract fetches) | 70+ candidates scanned across 5 topic areas*
*Confidence: High | Date: 2026-03-27*

**Note:** Discord posting failed during this run (webhook error 10015: Unknown Webhook). All 5 papers registered in dedup. Right Hand should re-post summaries below when webhook is restored.

---

## Summary

Five high-quality papers selected from 70+ candidates spanning HCI+AI, memory architecture, agent failure modes, self-improving code, and knowledge graph integration. The strongest signal: context window waste is a solved engineering problem if anyone implements demand paging (93% reduction demonstrated), and code agents that learn from project history are now definitively outperforming static models on SWE-bench. A multilingual tool-calling failure mode paper provides a quietly important finding about non-English LLM deployments that production systems are ignoring.

---

## Selected Papers

### 1. MemCoder — Code Agents That Co-Evolve With Your Codebase
**Paper:** [2603.13258](https://arxiv.org/abs/2603.13258) — *Your Code Agent Can Grow Alongside You with Structured Memory*
**Authors:** Yi-Xuan Deng, Xiaoqin Liu, Yi Zhang, Guo-Wei Yang, Shuojin Yang
**Topic area:** Self-improving code / Memory
**Tier:** T1 (direct abstract)

Code agents that can't learn from a project's history are leaving performance on the table. MemCoder addresses this by extracting structured knowledge from prior commits (implicit dev intent → code patterns), applying real-time self-refinement via verification feedback, and persisting human-validated solutions as durable agent memory. The result is a **9.4% improvement in resolved rate on SWE-bench Verified** over DeepSeek-V3.2. The framework is "co-evolutionary" — the agent literally gets better as the project ages. This is the clearest practical demonstration yet that project-contextual memory beats general-purpose foundation models for software engineering tasks.

**Why it matters:** Every SWE agent deployed today is stateless relative to the project it's working on. MemCoder shows that's a solvable problem with real gains, not a theoretical one.

---

### 2. Demand Paging for LLM Context Windows — 93% Context Reduction
**Paper:** [2603.09023](https://arxiv.org/abs/2603.09023) — *The Missing Memory Hierarchy: Demand Paging for LLM Context Windows*
**Authors:** Tony Mason
**Topic area:** Memory / Context management
**Tier:** T1 (direct abstract)

Production LLM sessions waste 21.8% of context tokens on stale content that never needs to be there — tool definitions, outdated intermediate results, boilerplate that persists across the entire session. Mason proposes Pichay, a demand-paging proxy that sits between client and API, evicting stale context and refetching on fault (only 0.0254% fault rate across 1.4M simulated evictions). Real-world result: context consumption drops **from 5,038KB to 339KB** — a 93% reduction — across 681 production turns. The theoretical framing is elegant: every LLM context management problem (limits, attention degradation, cost) is a virtual memory problem that CS has solved.

**Why it matters:** This is the paper that makes "context window limits" seem embarrassing in retrospect. The solution is a proxy layer, not better hardware. Immediately deployable.

---

### 3. Environment Maps — Persistent Structured World Models for Web Agents
**Paper:** [2603.23610](https://arxiv.org/abs/2603.23610) — *Environment Maps: Structured Environmental Representations for Long-Horizon Agents*
**Authors:** Yenchia Feng, Chirag Sharma, Karime Maamari
**Topic area:** Knowledge graph + LLM / Agent architecture
**Tier:** T1 (direct abstract)

Web agents fail on complex tasks because they have no persistent model of the environment — every session starts from scratch, and cascading errors compound. Environment Maps introduces a four-component persistent graph: Contexts (abstracted locations), Actions (parameterized affordances), Workflows (observed trajectories), and Tacit Knowledge (domain procedures). On WebArena: **28.2% success vs 14.2% baseline** (2x improvement) and 23.3% for agents with raw trajectory data. The maps are human-readable and editable, which matters for debugging.

**Why it matters:** This is [[RAG]] done right for agentic environments — not retrieving documents but maintaining a living structured model of the operational environment. The 2x WebArena improvement is substantial on a hard benchmark.

---

### 4. Lost in Execution — Multilingual Tool Calling Has a Silent Production Problem
**Paper:** [2601.05366](https://arxiv.org/abs/2601.05366) — *Lost in Execution: On the Multilingual Robustness of Tool Calling in Large Language Models*
**Authors:** Zheng Luo, T Pranav Kutralingam, Ogochukwu N Okoani, Wanpeng Xu, Hua Wei, Xiyang Hu
**Topic area:** Agent failure modes
**Tier:** T1 (direct abstract)

English-centric tool-calling benchmarks are hiding a production failure: when users interact in Chinese, Hindi, or Igbo, models correctly understand intent and select the right tool but generate parameter values *in the user's language* rather than the execution-required format. The MLCL benchmark documents this "parameter value language mismatch" as the dominant failure mode. Inference-time mitigations help but don't fully restore English-level performance. No current model fully solves this.

**Why it matters:** Any production agent deployed for non-English users is silently failing on tool calls in a way that looks like correct behavior from the LLM's perspective. This is the kind of bug that only shows up in production telemetry, not in eval suites. Quietly important for anyone building multilingual agents.

---

### 5. SSGM — Governance Framework for Dynamic Agent Memory
**Paper:** [2603.11768](https://arxiv.org/abs/2603.11768) — *Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework*
**Authors:** Chingkwun Lam, Jiaxin Li, Lingfei Zhang, Kuo Zhao
**Topic area:** Memory governance / Agent safety
**Tier:** T1 (direct abstract)

As agents move from static to dynamic memory, two specific vulnerabilities emerge: topology-induced knowledge leakage (sensitive contexts become permanently encoded) and semantic drift (knowledge degrades through iterative summarization). SSGM addresses both through consistency verification, temporal decay modeling, and dynamic access control that runs before memory consolidation. The framework provides a taxonomy of memory corruption risks and decouples memory evolution from execution.

**Why it matters:** This is the security paper for persistent agent memory that the field has been missing. Dynamic memory without governance is a prompt injection surface and a PII leakage vector. SSGM is the first structured framework addressing both.

---

## Candidates Reviewed But Not Selected

Papers scanned and passed over:
- **2603.25624** (XAI formats in educational recommenders) — too narrow, incremental
- **2603.24986** (Health AI collaborative decision mediators) — conceptual framework, no empirical results
- **2603.14646** (Dynamic ToM as temporal memory problem) — interesting but prior art heavy
- **2603.04421** (Mixed-vendor multi-agent clinical diagnosis) — domain-specific, limited generalizability
- **2603.21430** (DomAgent KG code generation) — solid but incremental over existing KG+code work

---

## Key Takeaways

1. **Context window waste is solved in principle** — demand paging (2603.09023) demonstrates 93% reduction. The question is whether this becomes infrastructure or stays a research paper.
2. **Project-contextual agents are the near-term SWE frontier** — MemCoder (2603.13258) shows memory-augmented agents beating raw foundation models at software engineering. Stateless agents are already obsolete for serious codebases.
3. **Environment Maps beat raw RAG for web agents 2:1** — (2603.23610) structured world models vs. document retrieval isn't close on hard benchmarks.
4. **Multilingual tool calling is a silent production risk** — (2601.05366) this failure mode isn't in standard evals.
5. **Agent memory needs governance now** — (2603.11768) dynamic memory = new attack surface + semantic drift. Most deployments have neither.

---

## Open Questions

- Does MemCoder's improvement hold on open-source codebases vs. proprietary ones? The commit history quality varies enormously.
- Pichay's 93% reduction — does this generalize across model providers or is it Claude/OpenAI-specific?
- SSGM temporal decay modeling: what's the appropriate decay schedule? No empirical guidance given.

---

## Sources

1. [T1] [2603.13258](https://arxiv.org/abs/2603.13258) — MemCoder, code agent structured memory, SWE-bench SOTA
2. [T1] [2603.09023](https://arxiv.org/abs/2603.09023) — Demand paging for LLM context, 93% reduction
3. [T1] [2603.23610](https://arxiv.org/abs/2603.23610) — Environment Maps, WebArena 28.2% vs 14.2%
4. [T1] [2601.05366](https://arxiv.org/abs/2601.05366) — Multilingual tool calling failure modes
5. [T1] [2603.11768](https://arxiv.org/abs/2603.11768) — SSGM memory governance framework

*Related: [[2026-03-26-arxiv-digest]] | [[LLM Agent Architecture]] | [[Memory Systems]] | [[Code Generation]]*

---

## Discord Post Summaries (for Right Hand to re-post when webhook restored)

```
**[Research]** arXiv: Your Code Agent Can Grow Alongside You with Structured Memory — Code agents that learn from your project's git history hit SOTA on SWE-bench

**MemCoder** (2603.13258) tackles a blind spot: code agents operate on static snapshots and can't learn from how *your* project evolved. Extracts structured knowledge from prior commits, applies real-time self-refinement through verification feedback, internalizes human-validated solutions into persistent memory. Result: 9.4% improvement in resolved rate on SWE-bench Verified over DeepSeek-V3.2. Agents that co-evolve with a codebase outperform generic models — now with numbers to prove it. https://arxiv.org/abs/2603.13258
```

```
**[Research]** arXiv: The Missing Memory Hierarchy: Demand Paging for LLM Context Windows — 21.8% of your context tokens are structural waste, and there's a fix

**Pichay** (2603.09023) is a demand-paging proxy that evicts stale context (tool defs, outdated intermediates) and refetches on fault. Measured across 857 production sessions: 21.8% structural waste. Across 1.4M simulated evictions: 0.0254% fault rate. Real-world context reduction: 5,038KB → 339KB (93%). Every LLM context management problem is a virtual memory problem CS already solved. https://arxiv.org/abs/2603.09023
```

```
**[Research]** arXiv: Environment Maps: Structured Environmental Representations for Long-Horizon Agents — 2x success rate on WebArena

Persistent structured world models (contexts, actions, workflows, tacit knowledge) eliminate the cold-start problem for web agents. WebArena: 28.2% success vs 14.2% for session-bound context, 23.3% for raw trajectory data. Human-readable and editable — you can debug what the agent knows. RAG retrieves documents; Environment Maps maintain a living model of the environment. https://arxiv.org/abs/2603.23610
```

```
**[Research]** arXiv: Lost in Execution: Multilingual Tool Calling Is Silently Broken — parameter values in the wrong language cause silent production failures

When users interact in Chinese, Hindi, or Igbo, models select the right tool but generate parameter values in the user's language instead of execution-required format. MLCL benchmark documents this as the dominant failure. Inference-time mitigations help but don't close the gap. Standard English evals hide this entirely. https://arxiv.org/abs/2601.05366
```

```
**[Research]** arXiv: Governing Evolving Memory in LLM Agents — SSGM framework addresses memory corruption, leakage, and semantic drift

Dynamic agent memory introduces two specific failure modes: topology-induced knowledge leakage (sensitive contexts get permanently encoded) and semantic drift (iterative summarization degrades knowledge). SSGM uses consistency verification + temporal decay + access control before memory consolidation. First structured taxonomy of memory corruption risks for persistent agent deployments. https://arxiv.org/abs/2603.11768
```
