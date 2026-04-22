---
title: "Web Intel - Deep Sweep 2026-03-18"
date: 2026-03-18
type: research
tags: [web-intel, ai-agents, memory-architecture, prompt-injection, multi-agent, MCP, self-improving]
summary: "1. **Memori [[OpenClaw]] Plugin** (#3) — Drop-in persistent memory, zero code changes"
sources: HN Algolia API, GitHub, Substack, Cloudflare Blog, arXiv
method: HN Algolia API search + direct source verification (web_search blocked — no Brave API key)
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
updated: 2026-03-18
created: 2026-03-18
---

# Web Intel — Deep Sweep 2026-03-18

**Domain:** AI Agent Systems — Memory, Orchestration, Security, Self-Improvement, MCP
**Method:** HN Algolia API (7 queries, 2025-2026 filter) + direct source verification via web_fetch
**Note:** `web_search` (Brave) was unavailable (missing API key). DuckDuckGo and Google blocked scraping. All results sourced via HN Algolia API and direct URL verification.

---

## 🧠 Agent Memory Architecture

### 1. Zep: Temporal Knowledge Graph Architecture for Agent Memory
- **URL:** https://arxiv.org/abs/2501.13956
- **Author:** Preston Rasmussen et al. (Zep team)
- **Date:** Jan 2025
- **Key Insight:** Zep introduces Graphiti, a temporally-aware knowledge graph engine that dynamically synthesizes conversational and structured business data while maintaining historical relationships. Outperforms MemGPT on DMR benchmark (94.8% vs 93.4%) and achieves 18.5% accuracy improvement on LongMemEval with 90% latency reduction.
- **Actionable:** Our system uses file-based memory (MEMORY.md, daily notes). Graphiti's temporal knowledge graph approach — maintaining entity relationships with time awareness — could replace or augment our flat-file memory for cross-session information synthesis. The "temporal awareness" pattern (tracking when facts were true, not just that they exist) is directly relevant to our vault-based knowledge management.

### 2. Aegis Memory v1.2 — Secure Context Engineering for AI Agents
- **URL:** https://github.com/quantifylabs/aegis-memory
- **Author:** QuantifyLabs
- **Date:** Dec 2025 (v1.2)
- **Key Insight:** Security-first memory layer implementing OWASP AI Agent Security recommendations. Features a 4-stage content security pipeline on every memory write, HMAC-SHA256 integrity signing for tamper detection, 4-tier trust hierarchy (untrusted/internal/privileged/system), and cryptographic agent binding. Includes ACE loop (generation→reflection→curation) for self-improving memory quality.
- **Actionable:** Our multi-agent system has no memory integrity verification. The HMAC signing pattern is lightweight and could protect our dispatch system from corrupted state. The trust hierarchy model maps directly to our [[agent roster]] — Right Hand as "system" tier, specialists as "internal," external inputs as "untrusted." The ACE loop pattern (generate→reflect→curate) mirrors our [[self-learning]] protocol but adds a formal curation step we're missing.

### 3. Memori — SQL-Native Dual-Mode Memory Layer
- **URL:** https://github.com/MemoriLabs/Memori
- **Author:** MemoriLabs (fka GibsonAI)
- **Date:** Aug 2025
- **Key Insight:** Memory layer using SQL full-text search instead of vector stores for long-term retrieval, combined with short-term "conscious" memory. Built around multi-agent architecture (memory agent, conscious agent, retrieval agent). Notably has an [[OpenClaw]] plugin (`@memorilabs/openclaw-memori`) that hooks into the lifecycle for structured memory with zero code changes.
- **Actionable:** Direct [[OpenClaw]] integration exists! `openclaw plugins install @memorilabs/openclaw-memori` could give us persistent cross-session memory with minimal effort. The SQL-over-vectors approach is interesting — our QMD system already uses SQLite, so this aligns architecturally. Worth evaluating the [[OpenClaw]] plugin immediately.

### 4. Entelgia — Consciousness-Inspired Multi-Agent AI with Persistent Memory
- **URL:** https://github.com/sivanhavkin/Entelgia
- **Author:** Sivan Havkin
- **Date:** Feb 2026
- **Key Insight:** Research architecture exploring how persistent identity emerges from structure rather than hard-coded rules. Two agents engage in continuous dialogue backed by shared persistent memory (SQLite + STM), with id/ego/superego dynamics, emotion tracking, importance scoring, memory promotion through error/repetition/affect, bounded short-term memory (LRU), and observer-based correction loops. Runs fully local via Ollama.
- **Actionable:** The "memory promotion through error and repetition" pattern is novel — memories that cause errors or get referenced repeatedly get promoted to long-term storage. This could improve our daily notes → MEMORY.md promotion logic. The observer-based correction loop (meta-cognitive layer that watches agent behavior) maps to our Devil's Advocate agent pattern but applied to memory quality rather than output quality.

---

## 🛡️ Security — Prompt Injection & Agent Safety

### 5. FireClaw — Open-Source Proxy Defending AI Agents from Prompt Injection
- **URL:** https://github.com/raiph-ai/fireclaw
- **Author:** raiph-ai
- **Date:** Mar 2026 (yesterday!)
- **HN Points:** 4, 6 comments
- **Key Insight:** Inline security proxy with a 4-stage pipeline: DNS blocklist → structural sanitization → isolated LLM summarization (hardened, no tools/memory) → output scanning with canary tokens. Key architectural decision: even if Stage 3's LLM gets injected, it's a dead end (no tools, no memory, no data access). Community threat feed shares anonymous detection metadata. No bypass mode — the pipeline can't be disabled even if the agent is compromised.
- **Actionable:** Our web_fetch already wraps content with SECURITY NOTICE headers, but FireClaw's approach is far more robust. The "isolated LLM summarization" pattern — using a hardened, tool-less LLM to produce factual summaries of web content before it reaches the agent — could be implemented as a preprocessing step in our web research pipeline. The canary token system (inject markers, check if they survive processing) is a clever verification technique.

### 6. Prompt Injection Defense: A 5-Layer Security Architecture
- **URL:** https://manveerc.substack.com/p/prompt-injection-defense-architecture-production-ai-agents
- **Author:** Manveer C.
- **Date:** Feb 2026
- **Key Insight:** References Anthropic's Sonnet 4.6 system card showing 8% one-shot prompt injection success rate in computer use (50% with unbounded attempts) but 0% in coding environments. The difference is environment, not model. Defines the "lethal trifecta" (Simon Willison's term): tools + untrusted input + sensitive access. Proposes 5-layer defense: permission boundaries, action gating, input sanitization, output monitoring, blast radius containment.
- **Actionable:** Our system hits all three of the "lethal trifecta" — we have tools, we process untrusted web content, and we have sensitive access (SSH, file system, vault). The 5-layer framework maps to concrete improvements: (1) permission boundaries — our [[agent roster]] already has scope limits; (2) action gating — our HITL patterns for external actions; (3) input sanitization — [[OpenClaw]]'s SECURITY NOTICE wrapping; (4) output monitoring — we don't have this; (5) blast radius containment — our VM isolation helps. Layer 4 (output monitoring) is our biggest gap.

### 7. MCP Security Auditor — Static Analysis Scanner for MCP Servers
- **URL:** https://www.npmjs.com/package/mcp-security-auditor
- **Author:** neuralweaves
- **Date:** Feb 2026
- **Key Insight:** Finds common MCP server vulnerabilities: hardcoded API keys, `eval()` on user input, SQL injection via string concatenation, wildcard permissions, disabled TLS. Runs 7 analyzers (secrets, static code, prompt injection, SQL/command injection, permissions, network, dependencies) in ~45ms. Outputs text/JSON/SARIF/HTML/Markdown. CI mode for automated scanning.
- **Actionable:** We should run this against any MCP servers we install: `npx mcp-security-auditor scan ./my-mcp-server`. Could be a standard check before enabling new MCP integrations.

### 8. MCP Secrets Management — JIT Provisioning with Janee
- **URL:** https://github.com/rsdouglas/janee/blob/main/docs/mcp-secrets-guide.md
- **Author:** rsdouglas
- **Date:** Feb 2026
- **Key Insight:** Comprehensive guide on MCP secret management problems (plaintext tokens in config, no rotation, no auditing) and solutions. Introduces Janee for JIT (just-in-time) secret provisioning — instead of permanent API keys in MCP configs, secrets are provisioned on-demand with time limits and approval flows. Capability-based security model where each access request gets specific scope and duration.
- **Actionable:** Our MCP server configs likely have plaintext tokens. The JIT provisioning pattern is interesting but may be overkill for a single-user system. The practical takeaway: at minimum, use OS keychain (`security` on macOS) rather than plaintext in config files. For our VM, could implement a simple wrapper that reads secrets from a protected file rather than embedding in JSON configs.

---

## 🔧 Agent Orchestration & Coordination

### 9. Gambit — Open-Source Agent Harness Framework
- **URL:** https://github.com/bolt-foundry/gambit
- **Author:** Bolt Foundry (Randall)
- **HN Points:** 91, 27 comments
- **Date:** Jan 2026
- **Key Insight:** Inverts the typical orchestration pattern. Instead of `compute→compute→LLM→compute→LLM`, Gambit does `LLM→LLM→LLM→compute→LLM`. Agents are described as "decks" (markdown or TypeScript) with typed inputs/outputs. Includes built-in graders (evaluation agents), test agents for synthetic data generation, and automatic evals at each step. Each agent in a chain can use different model params.
- **Actionable:** The "deck" pattern — self-contained markdown files describing agents with typed interfaces — is similar to our AGENTS.md but more formalized. The automatic eval/grading at each step could improve our verification protocol. The inversion principle (LLM-heavy pipeline with compute as needed, not compute-heavy with LLM calls) aligns with how our system already works but makes it explicit.

### 10. 20x — Self-Improving Agent Orchestrator
- **URL:** https://github.com/peakflo/20x
- **Author:** Peakflo engineering team
- **HN Points:** 6
- **Date:** Feb 2026
- **Key Insight:** Desktop app that orchestrates AI coding agents against task systems (Linear, HubSpot, GitHub). The key innovation is "self-improving skills" — reusable instruction templates attached to task types that get updated after each task completion based on what worked. Skills carry confidence scores that track reliability over time. Local-first (SQLite), agent-agnostic (Claude Code, OpenCode, Codex).
- **Actionable:** This is remarkably similar to our skill + evolution system, but with a more automated feedback loop. Their confidence-score-per-skill pattern is exactly what our `memory/workflow-patterns.json` crystallization system is trying to do, but 20x does it automatically after every task. We should study their skill update mechanism — the "agent proposes skill updates based on what worked" pattern could improve our evolution loop.

### 11. Production-Grade Agentic AI (Book)
- **URL:** https://productionaibook.com
- **Author:** Ran Aroussi
- **Date:** Nov 2025
- **Key Insight:** Comprehensive book covering memory systems, orchestration patterns, multi-agent coordination, observability, and real production examples. Treats agents as distributed systems, not prompt chains. Covers multi-tier [[memory architecture]], DAGs/orchestration/control loops, observability for non-deterministic behavior, multi-model routing with failover. Free first 3 chapters available.
- **Actionable:** The "agents as distributed systems" framing is useful. Our system already has many of these patterns (dispatch system, task queues, agent health monitoring) but could benefit from the formal distributed systems thinking — especially circuit breakers, failover chains, and observability patterns. Worth getting the free chapters.

### 12. Golutra — Multi-Agent Workspace with CLI Agent Orchestration
- **URL:** https://github.com/golutra/golutra
- **Author:** seeksky
- **Date:** Feb 2026
- **Key Insight:** Tauri desktop app that wraps existing CLI agents (Claude, Gemini, Codex, OpenCode, Qwen) into a unified multi-agent workspace. Unlimited parallel execution, visual interface with terminal injection, click agent avatars to inspect logs. Plans include [[OpenClaw]] as a "commander layer" for automatic agent creation and role assignment. Also planning deep memory layer for persistent, shared long-horizon memory.
- **Actionable:** The visual interface approach (clicking agent avatars for logs, injecting prompts into streams) is interesting UX but not directly applicable to our headless setup. The plan to use [[OpenClaw]] as a commander layer suggests community convergence around our architecture pattern. Their "unified agent interface" concept (standardized protocol for agent integration) could inform our [[agent roster]] design.

---

## 🧪 Knowledge Management & Obsidian Integration

### 13. Rowboat — AI Coworker with Living Knowledge Graph
- **URL:** https://github.com/rowboatlabs/rowboat
- **Author:** segmenta (ex-Coinbase, graph neural networks background)
- **HN Points:** 205, 56 comments (high signal)
- **Date:** Feb 2026
- **Key Insight:** Local-first app that builds a living knowledge graph from Gmail, meeting notes (Granola, Fireflies), stored as plain Markdown with backlinks (Obsidian-style). Extracts decisions, commitments, deadlines, and relationships. Agent with local shell access + MCP support acts on the graph. Key argument: "Passing gigabytes of email/docs/calls to an AI agent is slow and lossy. Search only answers questions you think to ask. A system that accumulates context over time can track patterns you didn't know to look for."
- **Actionable:** This is the closest thing to what our vault + agent system does, but with automated ingestion from external sources. The "living knowledge graph" pattern — where related notes auto-update when new information arrives — could augment our vault. Their argument against raw search in favor of accumulated context is exactly our QMD philosophy. The meeting-notes-to-[[knowledge-graph]] pipeline could be useful if Trajan wants to integrate meeting tools.

---

## 🔄 Self-Improvement & Evolution

### 14. Moltworker / OpenClaw on Cloudflare Workers
- **URL:** https://blog.cloudflare.com/moltworker-self-hosted-ai-agent/
- **Author:** Celso Martinho, Brian Brunner, Sid Chatterjee, Andreas Jansson (Cloudflare)
- **HN Points:** 246, 71 comments (very high signal)
- **Date:** Jan 2026
- **Key Insight:** Cloudflare built Moltworker to run [[OpenClaw]] (née Moltbot/Clawdbot) on Cloudflare Workers instead of dedicated hardware. Uses Sandbox SDK and Developer Platform APIs. Shows the ecosystem momentum — Cloudflare engineering investing in making [[OpenClaw]] run on their edge infrastructure. Native Node.js compatibility in Workers Runtime eliminated the need for mocking APIs.
- **Actionable:** This validates the [[OpenClaw ecosystem]]'s growth — Cloudflare is treating it as a first-class platform. For our self-hosted setup on a VM, the Cloudflare deployment isn't directly useful, but it means the [[OpenClaw ecosystem]] will get more community contributions and plugins as adoption grows.

### 15. Ask HN: How Do You Prevent AI Agents from Going Rogue in Production?
- **URL:** https://news.ycombinator.com/item?id=46601809
- **Author:** techbuilder4242
- **Date:** Jan 2026
- **Key Insight:** Discussion thread about production agent safety. Key questions: What stops agents from executing unintended actions? Have agents gone rogue with real consequences? Are IAM policies + approval workflows + monitoring enough? Community consensus: the gap is between "prompt injection defense" and "full action authorization" — most systems have one or the other, rarely both.
- **Actionable:** Reinforces our need for the action gating layer identified in source #6. Our dispatch system has human approval for external actions, but our autonomous cron-driven tasks don't have the same guardrails. The "both defense and authorization" insight suggests we need output monitoring (what did the agent actually do?) in addition to input sanitization (what instructions reached the agent?).

---

## Summary Statistics

| Category | Sources Found | Verified Quality |
|---|---|---|
| Agent [[Memory Architecture]] | 4 | All verified, technical depth confirmed |
| Security / Prompt Injection | 4 | All verified, one from yesterday (FireClaw) |
| Orchestration & Coordination | 4 | All verified, mix of tools and frameworks |
| Knowledge Management | 1 | High signal (205 HN points) |
| Self-Improvement | 1 | Ecosystem validation (Cloudflare) |
| Production Safety | 1 | Community discussion thread |
| **Total** | **15** | **15/15 verified** |

## Top 5 Most Actionable for Our System

1. **Memori [[OpenClaw]] Plugin** (#3) — Drop-in persistent memory, zero code changes
2. **Aegis Memory Trust Hierarchy** (#2) — HMAC integrity + trust tiers for multi-agent memory
3. **20x Self-Improving Skills** (#10) — Automated skill confidence scoring after every task
4. **FireClaw Security Proxy** (#5) — 4-stage injection defense for web research pipeline
5. **Prompt Injection 5-Layer Defense** (#6) — Framework reveals output monitoring as our biggest gap

## Methodology Note

`web_search` (Brave API) was unavailable due to missing API key. Recommend configuring: `openclaw configure --section web` or setting `BRAVE_API_KEY` in gateway environment. This would significantly improve future research sweeps — HN Algolia only covers Hacker News, missing Medium, Substack, independent blogs, and academic sources that would show up in general search.

## Related

- [[Agent Orchestration Patterns]]
- [[security]]
- Patterns
- [[-]]
- [[Agent]]
- [[System]]
