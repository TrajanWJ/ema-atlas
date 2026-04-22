---
title: GitHub Intel - Deep Sweep
date: 2026-03-18T00:00:00.000Z
type: research
tags:
  - github
  - ai-agents
  - memory-systems
  - multi-agent
  - mcp
  - obsidian
  - self-hosted
summary: >-
  Systematic search across GitHub for AI agent architectures, memory systems,
  multi-agent orchestration, MCP ecosystem, Obsidian integration, and self-h
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: research
updated: '2026-03-18'
created: '2026-03-18'
wiki_id: research/GitHub_Intel_-_Deep_Sweep_2026-03-18
imported_from: vault/Research/GitHub Intel - Deep Sweep 2026-03-18.md
imported_at: '2026-04-04T00:23:57.033Z'
---

# GitHub Intel — Deep Sweep 2026-03-18

Systematic search across GitHub for AI agent architectures, memory systems, multi-agent orchestration, MCP ecosystem, Obsidian integration, and self-hosted agent tooling.

**Search methodology:** GitHub search API (sorted by stars), direct repo verification via README fetch. Rate-limited on some queries — supplemented with known-repo direct checks.

---

## 🧠 Memory Systems & Architectures

### 1. mem0ai/mem0
- **URL:** https://github.com/mem0ai/mem0
- **Stars:** 25k+ (YC-backed, massive community)
- **Last updated:** Active (daily commits)
- **What it does:** Universal memory layer for AI agents. Multi-level memory (User, Session, Agent state) with vector search, adaptive personalization. Claims +26% accuracy over OpenAI Memory, 91% faster, 90% fewer tokens on LOCOMO benchmark.
- **Steal/integrate:** Their memory abstraction layer is the gold standard. Could integrate as an MCP server for persistent memory across [[OpenClaw]] sessions. Self-hosted mode available.

### 2. letta-ai/letta (formerly MemGPT)
- **URL:** https://github.com/letta-ai/letta
- **Stars:** 15k+ (very active)
- **Last updated:** Active (daily commits)
- **What it does:** Platform for building stateful agents with advanced memory that self-improves over time. Has both a CLI tool (Letta Code) and API. Supports skills, subagents, and persistent memory blocks.
- **Steal/integrate:** Their memory block architecture (persona/human/custom blocks) is directly applicable to how we structure MEMORY.md. Letta Code's skills system is comparable to [[OpenClaw]] skills. Their Obsidian plugin exists (see below).

### 3. ALucek/agentic-memory
- **URL:** https://github.com/ALucek/agentic-memory
- **Stars:** 516
- **Last updated:** Dec 2024 (educational, not actively maintained)
- **What it does:** Implements 4 cognitive memory types for agents: Working Memory, Episodic Memory, Semantic Memory, Procedural Memory. Based on the CoALA paper (Cognitive Architectures for Language Agents).
- **Steal/integrate:** Excellent reference architecture. Our current system already roughly maps to this (MEMORY.md = working, vault = semantic, memory/*.md = episodic, AGENTS.md = procedural). Useful for formalizing our memory tiers.

### 4. devopsdymyr/Evo-Memory
- **URL:** https://github.com/devopsdymyr/Evo-Memory
- **Stars:** 45
- **Last updated:** Dec 2025
- **What it does:** Production-ready FastAPI implementation of the Evo-Memory paper (Google DeepMind + UIUC). Implements Search → Synthesize → Evolve loop for experience reuse (not just recall). Agents learn from outcomes and refine strategies.
- **Steal/integrate:** The Search→Synthesize→Evolve pattern maps directly to our self-evolution system. Could inform improvements to `memory/outcome-tracker.json` and the evolution loop.

### 5. sdwolf4103/opencode-working-memory
- **URL:** https://github.com/sdwolf4103/opencode-working-memory
- **Stars:** 44
- **Last updated:** Feb 2026
- **What it does:** Four-tier memory for OpenCode agents: persistent core memory, session working memory, smart pruning with pressure monitoring. Auto storage governance (300 files/session, 7-day TTL).
- **Steal/integrate:** The memory pressure monitoring concept is brilliant — tracking token usage and proactively intervening when context gets tight. We could adapt this for our LCM system. The auto-cleanup governance is also relevant.

### 6. cortex-tms/cortex-tms
- **URL:** https://github.com/cortex-tms/cortex-tms
- **Stars:** 170
- **Last updated:** Active (daily)
- **What it does:** Documentation governance for AI coding agents. Scaffolds and validates PATTERNS.md, ARCHITECTURE.md, CLAUDE.md. v4.0 adds git-based staleness detection — flags when docs are outdated relative to code changes.
- **Steal/integrate:** The staleness detection concept is directly useful. We could detect when AGENTS.md or SOUL.md is stale relative to actual behavior patterns. The validation/health-check approach for agent governance docs.

---

## 🤖 Multi-Agent Orchestration

### 7. openai/swarm
- **URL:** https://github.com/openai/swarm
- **Stars:** 21.2k
- **Last updated:** Mar 2025 (educational, stable)
- **What it does:** Lightweight multi-agent orchestration from OpenAI. Educational framework exploring ergonomic patterns for agent handoffs and routines.
- **Steal/integrate:** The handoff patterns and routine abstractions are well-designed reference material. Our dispatch system is more sophisticated but their simplicity is instructive.

### 8. microsoft/agent-framework
- **URL:** https://github.com/microsoft/agent-framework
- **Stars:** 8k
- **Last updated:** Active (hourly commits)
- **What it does:** Microsoft's comprehensive multi-language framework (Python + .NET) for building and orchestrating AI agents. Graph-based workflows with streaming, checkpointing, human-in-the-loop, and time-travel capabilities. Successor to AutoGen + Semantic Kernel.
- **Steal/integrate:** Their graph-based workflow orchestration with checkpointing could inform improvements to our dispatch system. Time-travel debugging for agent workflows is an interesting capability.

### 9. kyegomez/swarms
- **URL:** https://github.com/kyegomez/swarms
- **Stars:** 5.9k
- **Last updated:** Active (hourly)
- **What it does:** Enterprise-grade production multi-agent orchestration. Supports various swarm architectures (sequential, concurrent, hierarchical, mixture of agents).
- **Steal/integrate:** Their swarm architecture patterns catalog could inspire new collaboration modes beyond what we have in AGENTS.md.

### 10. VRSEN/agency-swarm
- **URL:** https://github.com/VRSEN/agency-swarm
- **Stars:** 4.1k
- **Last updated:** Active (minutes ago)
- **What it does:** Multi-agent framework built on OpenAI Agents SDK. Define agent roles (CEO, VA, Developer) with custom instructions, tools, and directional communication flows. Type-safe tools via Pydantic.
- **Steal/integrate:** Their communication_flows concept (explicit directional agent-to-agent messaging) is a cleaner formalization of our routing rules. Worth studying for dispatch improvements.

### 11. Kocoro-lab/Shannon
- **URL:** https://github.com/Kocoro-lab/Shannon
- **Stars:** 1.2k
- **Last updated:** Active (daily)
- **What it does:** Production multi-agent orchestration in Go/Rust. Multi-strategy orchestration, token budget control per task/agent, human approval workflows, time-travel debugging, WASI sandbox for code execution, Prometheus/OpenTelemetry observability.
- **Steal/integrate:** Token budget control per agent/task is exactly what we need. Their observability stack (Prometheus + OTEL) could be a model for our agent monitoring. WASI sandboxing for untrusted code execution.

### 12. catlog22/Claude-Code-Workflow (CCW)
- **URL:** https://github.com/catlog22/Claude-Code-Workflow
- **Stars:** 1.5k
- **Last updated:** Active (daily)
- **What it does:** JSON-driven multi-agent development framework with intelligent CLI orchestration across Gemini/Qwen/Codex/Claude. Role-based agents with session management, background queue execution, and context-first architecture.
- **Steal/integrate:** Their multi-CLI orchestration (seamlessly invoking different coding CLIs based on task type) could inform our agent routing. The workflow session persistence model is also interesting.

---

## 🔌 MCP Ecosystem

### 13. punkpeye/awesome-mcp-servers
- **URL:** https://github.com/punkpeye/awesome-mcp-servers
- **Stars:** 83.4k
- **Last updated:** Active (daily)
- **What it does:** The definitive curated collection of MCP servers. Hundreds of categorized servers for databases, file systems, APIs, dev tools, and more.
- **Steal/integrate:** Essential reference for finding MCP servers to add to our stack. Check for memory, knowledge graph, and vault management servers.

### 14. AmoyLab/Unla (MCP Gateway)
- **URL:** https://github.com/AmoyLab/Unla
- **Stars:** 2.1k
- **Last updated:** Active (weekly)
- **What it does:** Lightweight Go gateway that transforms existing MCP servers and APIs into MCP-compliant endpoints through YAML configuration, zero code changes. Built-in management UI.
- **Steal/integrate:** Could act as a gateway layer between [[OpenClaw]] and external MCP servers. Useful for converting our existing APIs into MCP-compatible endpoints without rewriting.

### 15. ComposioHQ/awesome-claude-plugins
- **URL:** https://github.com/ComposioHQ/awesome-claude-plugins
- **Stars:** 1.2k
- **Last updated:** Active (bi-weekly)
- **What it does:** Curated list of production-ready Claude Code plugins — custom commands, agents, hooks, MCP servers. Covers frontend design, Git workflows, code quality, DevOps, security, and more.
- **Steal/integrate:** Plugin patterns and architectures directly applicable to [[OpenClaw]] skill development. The connect-apps plugin (500+ app integrations via Composio) is interesting for extending our agent capabilities.

---

## 📔 Obsidian + AI Integration

### 16. cyanheads/obsidian-mcp-server
- **URL:** https://github.com/cyanheads/obsidian-mcp-server
- **Stars:** 407
- **Last updated:** Oct 2025
- **What it does:** MCP server for Obsidian vault access. Full suite of tools: read/write/search notes, manage tags, frontmatter, global search. Connects via Obsidian Local REST API plugin.
- **Steal/integrate:** Could replace or complement our QMD system for vault access. Provides a standardized MCP interface that any MCP-compatible agent could use for vault operations.

### 17. letta-ai/letta-obsidian
- **URL:** https://github.com/letta-ai/letta-obsidian
- **Stars:** 65
- **Last updated:** Feb 2026
- **What it does:** Obsidian plugin integrating Letta's stateful memory agent. Auto-syncs vault files, persistent memory across sessions, interactive memory block editor, agent switching within projects.
- **Steal/integrate:** Their vault sync approach (only syncs changed files, encodes folder paths) and the memory block editor UI concept are interesting. Could inform how we think about vault ↔ agent memory integration.

### 18. edonyzpc/personal-assistant
- **URL:** https://github.com/edonyzpc/personal-assistant
- **Stars:** 139
- **Last updated:** Active (daily)
- **What it does:** Obsidian plugin with AI agents for vault management. RAG-powered knowledge base for search/read/write within Obsidian. AI-generated featured images. Animation rendering, metadata management.
- **Steal/integrate:** Their RAG approach to vault knowledge could complement our [[QMD semantic search]]. The automated metadata management features are relevant.

---

## 🛡️ LLM Proxy & Rate Limiting

### 19. BerriAI/litellm
- **URL:** https://github.com/BerriAI/litellm
- **Stars:** 20k+
- **Last updated:** Active (hourly)
- **What it does:** The industry-standard LLM proxy/gateway. Call 100+ LLMs in OpenAI format with cost tracking, guardrails, load balancing, and logging. Supports fallbacks, retries, rate limit handling.
- **Steal/integrate:** If we ever need multi-provider failover or rate limit handling for our agent fleet, LiteLLM proxy is the answer. Could sit between [[OpenClaw]] and API providers.

### 20. Mirrowel/LLM-API-Key-Proxy
- **URL:** https://github.com/Mirrowel/LLM-API-Key-Proxy
- **Stars:** 428
- **Last updated:** Active (daily)
- **What it does:** Self-hosted universal LLM gateway with OpenAI/Anthropic-compatible endpoints. Intelligent key rotation, failover on errors, rate limit handling, cooldowns. Specifically supports Claude Code, OpenCode, etc.
- **Steal/integrate:** Purpose-built for exactly our use case — managing API keys across multiple providers with automatic failover. Lighter than LiteLLM, more focused. Good fit for self-hosted setups.

---

## 🧬 Agent Patterns & Architecture

### 21. syahiidkamil/Software-Engineer-AI-Agent-Atlas (ATLAS)
- **URL:** https://github.com/syahiidkamil/Software-Engineer-AI-Agent-Atlas
- **Stars:** 282
- **Last updated:** Active (daily)
- **What it does:** Turn Claude Code into a senior software engineer with persistent identity, engineering principles, and production-grade tooling. 7 roles, living memory that persists across sessions. KISS/YAGNI/DRY principles baked in.
- **Steal/integrate:** Their identity file structure and living memory approach is similar to our SOUL.md/AGENTS.md but more formalized for coding tasks. The neuron activation concept (structured context firing specific capabilities) is a useful mental model.

### 22. SolaceLabs/solace-agent-mesh
- **URL:** https://github.com/SolaceLabs/solace-agent-mesh
- **Stars:** 2.4k
- **Last updated:** Active (minutes ago)
- **What it does:** Event-driven multi-agent framework built on Solace messaging. Agents communicate via event mesh for true async scalability. Task delegation, artifact sharing, multi-step workflows with minimal coupling.
- **Steal/integrate:** The event-driven architecture with message broker is an interesting alternative to our file-based dispatch. For scaling beyond a single VM, this pattern would be relevant.

---

## 📊 Summary & Priority Matrix

| Priority | Repo | Why |
|----------|------|-----|
| 🔴 HIGH | mem0ai/mem0 | Memory layer we could integrate via MCP |
| 🔴 HIGH | Kocoro-lab/Shannon | Token budgets + observability patterns |
| 🔴 HIGH | BerriAI/litellm | Rate limit / failover if needed |
| 🟡 MED | letta-ai/letta | Stateful agent patterns + Obsidian plugin |
| 🟡 MED | VRSEN/agency-swarm | Communication flow patterns for dispatch |
| 🟡 MED | cortex-tms/cortex-tms | Doc staleness detection |
| 🟡 MED | Mirrowel/LLM-API-Key-Proxy | Lightweight self-hosted proxy |
| 🟡 MED | cyanheads/obsidian-mcp-server | Vault MCP integration |
| 🟡 MED | AmoyLab/Unla | MCP gateway for API→MCP conversion |
| 🟢 LOW | ALucek/agentic-memory | Reference architecture (educational) |
| 🟢 LOW | devopsdymyr/Evo-Memory | Evolution loop patterns |
| 🟢 LOW | sdwolf4103/opencode-working-memory | Memory pressure monitoring |
| 🟢 LOW | ComposioHQ/awesome-claude-plugins | Plugin catalog |
| 🟢 LOW | catlog22/Claude-Code-Workflow | Multi-CLI orchestration ideas |
| 📋 REF | punkpeye/awesome-mcp-servers | MCP server discovery |

### Key Themes

1. **Memory is the frontier** — Every serious agent framework is investing heavily in multi-tier memory (working/episodic/semantic/procedural). Our system is ahead of most but could benefit from mem0's persistence layer.

2. **Token budget control** — Shannon's per-task/per-agent token budgets is a pattern we should adopt. Prevents runaway context consumption.

3. **Doc governance** — Cortex TMS's staleness detection for agent governance docs is a novel approach. Our AGENTS.md/SOUL.md could benefit from automated freshness checks.

4. **Event-driven > file-based at scale** — Our file-based dispatch works fine for single-VM, but Solace Agent Mesh shows how event-driven messaging enables true distributed agent orchestration.

5. **MCP as the integration standard** — The MCP ecosystem is massive (83k stars on awesome list). Any new integration should be MCP-first.

---

*Sweep conducted 2026-03-18 03:02 UTC. Some GitHub search queries were rate-limited (429); supplemented with direct repo verification. Brave Search API was unavailable (no API key configured).*

## Related

- [[Agent Orchestration Patterns]]
- [[Memory Architecture]]
