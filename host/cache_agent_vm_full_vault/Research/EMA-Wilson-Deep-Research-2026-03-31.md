---
title: "EMA + Wilson Premier: Deep Research Report — 2026"
type: research
date: 2026-04-01
confidence: 0.82
tags: [EMA, Wilson-Premier, executive-AI, multi-agent, real-estate, PKM, desktop-agents, tauri, orchestration]
summary: "Comprehensive 2026 research across 5 domains: exec AI command centers, multi-agent orchestration, real estate/hospitality AI, agentic PKM, and desktop agent UX."
sources_total: 28
sources_t1: 12
sources_t2: 11
sources_t3: 5
related: "[[Agent-OS-UX-Competitive-Deep-Dive]], [[Multi-Agent Coordination Patterns]], [[ExecAI-Management-2026-03-31]], [[Agent-OS-Speculative-UI-Deep-Dive]], [[Memoria-Agent-Memory]], [[Three-Tier Memory Architecture]]"
---

# EMA + Wilson Premier: Deep Research Report — 2026
*Sources: 28 total (12 T1 primary, 11 T2 institutional, 5 T3 secondary)*  
*Confidence: 0.82 | Date: 2026-04-01*

---

## Summary

Five research fronts converge in a coherent picture. The executive AI command center market is real and nascent — Dust.tt, Fibery, and Tana are proving the concept at enterprise/team scale, but nobody has built a personal-scale executive OS with agentic features. Multi-agent orchestration has three mature patterns (OpenAI SDK handoffs, LangGraph state machines, CrewAI flows) that map directly to Wilson Premier's 14-agent architecture. In real estate and STR, market AI tools (Hospitable, Guesty) are reactive copilots — not multi-agent systems — meaning Wilson Premier would be genuinely novel. PKM-as-agent-memory is live and shipping: Mem0 v1.0.0 + Memoria's git-versioned memory are the two most actionable paths. Desktop agent UX has two clear patterns (execution log + artifact persistence) with no strong incumbents on the personal-OS design space Trajan is targeting.

---

## Area 1: Executive AI Command Centers

*What Trajan is building: EMA as a personal executive OS. This section maps the competitive space and identifies design patterns worth stealing.*

### Dust.tt — The Closest Structural Analog (T2)

Dust explicitly calls itself "The Operating System for AI Agents." Current state: 5,000+ organizations, no-code agent creation, data connected from Slack/Google Drive/Notion/GitHub/Confluence. Core primitives: team orchestration (agents + humans collaborate), context-aware infrastructure (agents connected to company data), universal access layer (integration with existing tools). Fine-grained permissions via Spaces, SSO/SCIM, audit logs, SOC 2 Type II.

**Why it matters for EMA:** Dust validates the concept at enterprise scale and demonstrates the market exists. Dust is team-oriented and cloud-only — EMA's personal-scale + local-first + Tauri desktop angle is the unoccupied position. Dust's Spaces/permissions model is worth studying for EMA's Vault segmentation.

**Actionable:** EMA's UX differentiation should lean into "one person runs 5-15 agents" rather than "a team of 50 uses agents." That personal executive layer is Dust's blind spot.

**Source:** [Dust.tt homepage](https://dust.tt/) — T2

### Fibery Smart Agent — AI as Query Layer Over Business Data (T1/T2)

Fibery's "Smart Agent" generates JavaScript pipelines at query time and executes them against workspace schema. In a benchmark vs Notion AI: Fibery 6/6 questions correct, Notion 3/6, ~2× faster. Questions like "how many in-progress features per product area?" or "which rep burned the most leave this quarter?" — answered without building views. This is AI doing BI work, not copywriting.

**Why it matters for EMA:** This is the correct framing for EMA's agent layer — not an AI writing assistant, but an AI that *reasons over your structured business data*. EMA's Vault + Projects + Pipes become queryable via the agent layer. The agent doesn't just chat; it writes and executes queries.

**Actionable:** EMA should have a "Query Layer" concept where the AI can interrogate all structured data (tasks by status, habits by completion rate, proposals by priority) in real time. Fibery's code-execution approach to queries beats prompt-only approaches by 2×.

**Source:** [Fibery Smart Agent benchmark](https://fibery.com/blog/fibery-vs-x/fibery-vs-notion-ai-agent/) — T2

### Tana — Typed Knowledge Graph + MCP = Agent-Readable Structure (T1)

Tana exposes a local API + MCP endpoint, making the knowledge graph queryable by Claude/external LLMs as a tool. The key insight: **supertags + fields as AI context** — structure you define on nodes becomes schema that AI uses to classify, fill, and query with high accuracy. Meeting supertag with Participants/Decisions/Action Items fields → AI fills and queries those fields reliably. This is fundamentally different from prose-based notes AI works over.

**Why it matters for EMA:** EMA's Vault should have typed schema — not just Markdown files, but structured node types (Projects, Decisions, Meetings, Contacts) that the AI can query precisely. Prose notes are for writing; schema nodes are for AI reasoning.

**Actionable:** EMA Vault → introduce typed entities with defined fields beyond frontmatter. AI queries entity fields rather than scanning full document content. This is the path to Fibery-level accuracy for cross-entity questions.

**Source:** [Tana AI docs](https://outliner.tana.inc/docs/tana-ai) — T1

### What Nobody Has Built (The EMA Opportunity)

Synthesis from the competitive landscape:

| Dimension | Dust.tt | Fibery | Tana | **EMA (target)** |
|---|---|---|---|---|
| Scale | Team/enterprise | Team/enterprise | Personal | **Personal** |
| Deployment | Cloud only | Cloud only | Cloud | **Local/Tauri + optional cloud** |
| Agent types | General workers | Query agents | None native | **Specialized exec agents** |
| Glass UI | No | No | No | **Yes** |
| Life OS (Habits, Journal) | No | No | No | **Yes** |
| Code runner | No | No | No | **Claude Code built-in** |

**The position nobody occupies:** A personal executive OS that combines structured business data, agent orchestration, PKM/vault, and life ops (habits, journal, brain dump) in a single local-first application. EMA is building this.

---

## Area 2: Multi-Agent Orchestration Architectures

*What Trajan is building: Wilson Premier — 14 agents, OpenAI SDK + n8n + PostgreSQL. This section maps production patterns.*

### OpenAI Agents SDK — The Foundation (T1)

Two core orchestration patterns from official docs:

**Pattern 1: Handoffs** — A triage agent routes the conversation to a specialist; the specialist becomes the active agent and owns the interaction from that point. Tool name auto-generated as `transfer_to_<agent_name>`. Supports `on_handoff` callbacks (for data fetching), `input_type` (structured Pydantic payload passed to callback), `input_filter` (control what context the receiving agent sees), `is_enabled` (dynamic enable/disable). The handoff is one-way — the specialist takes over.

```python
triage_agent = Agent(name="Triage", handoffs=[billing_agent, handoff(refund_agent)])
```

**Pattern 2: Agents as Tools** — A manager agent keeps control, calls specialists via `Agent.as_tool()`, combines outputs, enforces shared guardrails. Specialists return results without taking over the conversation. Use this when you want one agent to synthesize multiple specialists.

**When to use which:**
- **Handoffs** → routing workflows, customer support, when specialist should own the conversation
- **As-tools** → manager needs multiple inputs before responding, parallel execution, synthesis

**Wilson Premier application:**
- Daily Briefing Agent = manager that calls Leads/Finance/Occupancy agents *as tools* (synthesizes into briefing)
- Guest inquiry → Handoff to Guest Concierge Agent (specialist takes over for duration)
- Lead Discovery → coordinator calls Web Scraper + CRM agents as tools in parallel (asyncio.gather)

**Other patterns from official examples:**
- **Deterministic chains** — story outline → story → ending (sequential pipeline)
- **LLM-as-judge** — generator agent + evaluator agent in a feedback loop until criteria met
- **Parallelization** — `asyncio.gather()` multiple agents for latency reduction
- **Guardrails** — parallel safety checks with tripwire (fast model checks, fails immediately if triggered)

**Source:** [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/multi_agent/) — T1; [Handoffs docs](https://openai.github.io/openai-agents-python/handoffs/) — T1; [Agent patterns README](https://github.com/openai/openai-agents-python/blob/main/examples/agent_patterns/README.md) — T1

### LangGraph — Durable Execution for Long-Running Agents (T1)

LangGraph is low-level orchestration for stateful, long-running agents. Used in production by Klarna, Uber, J.P. Morgan. Core capabilities:
- **Durable execution** — agents persist through failures, resume from where they left off
- **Human-in-the-loop** — interrupt graph at any point, modify state, resume
- **Comprehensive memory** — short-term (working memory for ongoing reasoning) + long-term (across sessions)
- **State machine model** — each node is an agent action, edges are conditional transitions
- **LangSmith tracing** — full execution visualization, debug, eval

The state-machine model enables **time-travel debugging** (rewind to any node, re-execute from that state). This is LangGraph's unique advantage over SDK-based patterns.

**Wilson Premier application:** LangGraph is better for Wilson's workflow agents that run for hours (financial monitoring, lead discovery crawls) vs quick response agents. If an agent needs to pause, wait for an external event (webhook from n8n), and resume — LangGraph handles this natively. OpenAI SDK doesn't.

**Source:** [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — T1

### CrewAI Flows — Event-Driven Multi-Agent Workflows (T1)

CrewAI Flows adds event-driven architecture on top of role-based crews. `@start()` marks entry points (can have multiple, can be parallel). `@listen()` marks listeners that trigger when upstream tasks complete. Each flow state gets a unique UUID. State persists throughout flow execution and is shareable across tasks.

```python
class WilsonDailyBriefing(Flow):
    @start()
    def fetch_leads(self): ...      # Parallel start
    @start()  
    def fetch_occupancy(self): ...  # Parallel start
    @listen(fetch_leads, fetch_occupancy)
    def compile_briefing(self): ... # Triggers when both complete
```

**Why it matters:** CrewAI Flows is the highest-level abstraction for complex multi-agent workflows — more intuitive than LangGraph's state machine model, more structured than raw SDK patterns. The decorator syntax maps naturally to Wilson's domain flows.

**Wilson Premier architecture mapping:**
- `@start()` → Morning triggers (occupancy pull, lead scan, financial snapshot)
- `@listen()` → Briefing compilation after all data agents complete
- Conditional routing → `@router` decorator for guest type routing (VIP vs standard)

**Source:** [CrewAI Flows docs](https://docs.crewai.com/en/concepts/flows) — T1

### AutoGen — MCP-Native Multi-Agent with AgentTool (T1)

Microsoft AutoGen (now redirecting new users to Microsoft Agent Framework, but still maintained) supports MCP servers natively via `McpWorkbench`. The `AgentTool` pattern wraps any agent as a tool callable by another agent — same mental model as OpenAI SDK's agents-as-tools.

Key update: AutoGen now references `gpt-4.1` (not gpt-4o) as the example model, suggesting alignment with OpenAI's latest model family. MCP integration means AutoGen agents can natively call Playwright (browser automation), file systems, and any MCP server.

**Source:** [AutoGen README](https://github.com/microsoft/autogen/blob/main/README.md) — T1

### Architecture Recommendation for Wilson Premier

Given 14 agents across 4 domains:

```
Domains:
├── Real Estate (Lead Discovery, Listing Monitor, CRM Sync, Market Intel)
├── Hospitality (Guest Concierge, Review Manager, Maintenance Coordinator, Pricing Advisor)  
├── Finance (P&L Monitor, Cash Flow Tracker, Expense Categorizer)
└── Platform (Daily Briefing, Alert Router, Data Sync)

Recommended architecture:
- OpenAI Agents SDK for real-time interactions (guest inquiries → handoffs)
- CrewAI Flows for scheduled batch workflows (daily briefings, lead discovery)
- n8n as the trigger/webhook layer (connects external APIs to agent entry points)
- PostgreSQL as shared state (all agents read/write a common context store)
```

The key insight: **don't force one framework for all 14 agents**. Responsive agents (guest concierge, alert router) use SDK handoffs. Scheduled batch agents (daily briefing, lead discovery) use CrewAI Flows with n8n triggers.

---

## Area 3: Real Estate + Hospitality AI Automation

*What Craig Wilson needs: STR management, lead discovery, guest concierge, financial monitoring. What's actually shipping in 2026.*

### Hospitable Copilot — The Current Market Standard (T2)

Hospitable's AI Copilot positions as "knows your business by heart." Current capabilities:
- **Natural language queries over booking data**: "How many nights were vacant last month?", "Which listing has the highest occupancy rate?", "What are guests complaining about in reviews?"
- **Review pattern analysis**: scans reviews to surface recurring complaints and improvement suggestions
- **Revenue/booking analytics**: pulls income by property, stay lengths, guest origins — no pivot tables
- **One-click guest message drafts**: suggests replies based on previous messaging style and guest history; "sounds like you, not a bot"
- **AI-written guest reviews**: draws on stay data and host tone

**Roadmap (announced, not yet shipped):** Task assignment automation, pricing strategy recommendations, pre-send message editing suggestions.

**Critical assessment:** Hospitable Copilot is a single AI assistant layer on top of a property management system. It answers questions and drafts messages — it does NOT run autonomous agents, does NOT coordinate multi-agent workflows, and does NOT proactively monitor and act. This is a reactive copilot, not an agentic system.

**Source:** [Hospitable Copilot feature page](https://hospitable.com/features/copilot) — T2

### Guesty — Enterprise STR Platform (T2)

Guesty is the enterprise STR platform: channel manager (Airbnb, Vrbo, Booking.com + direct), unified inbox, multi-calendar, CRM, guest app, task management for cleaning/maintenance, automation workflows, revenue management tools. Used by large property managers (multi-hundred property portfolios).

**AI presence:** Automation workflows and revenue management have AI-assisted pricing, but Guesty's AI is embedded in specific features — not a general-purpose agent layer. Their automation builder is n8n-style rule-based workflow, not LLM-orchestrated agents.

**Source:** [Guesty features page](https://www.guesty.com/features/) — T2

### Market Gap: What Wilson Premier Would Actually Be

Comparing what's shipping vs what Wilson Premier is designed to do:

| Capability | Hospitable | Guesty | Wilson Premier (planned) |
|---|---|---|---|
| Guest message drafting | ✅ AI-assisted | ✅ Templates | ✅ Full agent loop |
| Review analysis | ✅ Copilot | ❌ Manual | ✅ Dedicated Review agent |
| Lead discovery | ❌ None | ❌ None | ✅ Dedicated Lead Discovery agent |
| Financial monitoring | ❌ Basic reports | ✅ Revenue dashboard | ✅ P&L monitor + alerts |
| Proactive daily briefing | ❌ None | ❌ None | ✅ Daily Briefing agent |
| Multi-agent coordination | ❌ None | ❌ None | ✅ 14-agent system |
| Market intel (comp properties) | ❌ None | ❌ None | ✅ Market Intel agent |
| Maintenance coordination | ✅ Task management | ✅ Task management | ✅ Maintenance Coordinator agent |

**Assessment:** Wilson Premier is not competing with Hospitable or Guesty — it's complementing them. The Wilson system could run *on top of* these platforms, ingesting their data via APIs and applying multi-agent intelligence that these platforms don't have.

**Actionable:** Position Wilson Premier as "Hospitable + Guesty + a 14-person AI team." Craig Wilson keeps his existing platform subscriptions; Wilson Premier agents connect to those APIs and add the intelligence layer.

### Hospitality AI Real Estate Lead Gen in 2026

For real estate lead generation specifically, the 2026 market has:
- **Follow Up Boss (acquired by Zillow)**: CRM with AI for real estate teams, 250+ integrations, ISA (Inside Sales Agent) automation. Acquired by Zillow 2024, still operating independently.
- **Real estate AI lead scoring**: Multiple CRMs now have AI lead scoring based on behavioral signals
- **AI-generated comp analyses**: Some CRMs auto-generate CMAs using public records + AI

What's NOT available anywhere: a custom multi-agent system that monitors specific geographic markets (Smith Mountain Lake lakefront properties), tracks off-market opportunities, correlates with hospitality booking data, and packages it for a single operator. That custom specificity is Wilson Premier's moat.

---

## Area 4: Agentic PKM / Second Brain as Agent Memory

*The shift from "AI in your notes" to "notes AS agent memory."*

### Mem0 Platform — Production Memory Layer (T1)

Mem0 v1.0.0 (released early 2026) ships:
- **Rerankers** for improved retrieval quality
- **Async-by-default** behavior (better performance)
- **Azure OpenAI support**
- **Graph memory** — relationships between memories, not just vector similarity
- **MCP connector** — expose Mem0 memory to any MCP-compatible agent
- **SOC 2 Type II** enterprise compliance

Architecture: fully managed (Mem0 runs vector store, graph services, rerankers — no infrastructure work). Three memory types: user, agent, and session. Claimed +26% accuracy improvement vs OpenAI's native memory. Supports webhooks, multimodal, custom memory categories.

**For Wilson Premier:** Mem0 as the shared memory layer across all 14 agents. Each agent reads/writes the same memory store. Guest history, lead notes, financial patterns, market observations — all persist and accumulate. Guest Concierge Agent writes guest preferences → future guest interactions are personalized. Lead Discovery writes market patterns → Market Intel agent builds on those observations.

**Source:** [Mem0 Platform docs](https://docs.mem0.ai/overview) — T1

### Memoria — Git-Level Versioned Agent Memory (T1)

Memoria (matrixorigin/Memoria, v0.1.0, Apache 2.0) is a Rust MCP server backed by MatrixOne database's Copy-on-Write engine. Provides true git-style versioning for agent memory:

| Git concept | Memoria | Practical use |
|---|---|---|
| `git commit` | `memory_snapshot` | Checkpoint memory state before risky operations |
| `git checkout` | `memory_rollback` | Revert to earlier state if agent goes wrong |
| `git branch` | `memory_branch` | Isolated memory space for experiments |
| `git merge` | `memory_merge` | Incorporate branch findings into main |
| `git diff` | `memory_diff` | Preview changes before merging |

Self-governance tools: `memory_governance` (quarantine low-confidence memories), `memory_consolidate` (contradiction detection), `memory_reflect` (synthesize insights), entity extraction and linking.

Has a native OpenClaw plugin: `@matrixorigin/memory-memoria`.

**For EMA:** Memoria is the right architecture for EMA's agent memory. Each EMA session starts from a known-good snapshot. Experimental agent runs use branches. If an agent corrupts memory with bad data, roll back. This is substantially more sophisticated than flat vector stores.

**Source:** [Memoria GitHub](https://github.com/matrixorigin/Memoria) — T1; [OpenClaw plugin docs](https://github.com/matrixorigin/Memoria) — T1

### Existing Vault Research (Three-Tier Architecture)

The vault's `Three-Tier Memory Architecture.md` already documents the hot/warm/cold tiering model implemented via SQLite FTS5 + embeddings. Key pattern: **tiering emerges from document classification + promotion pipeline**, not separate databases. The `kb_context` tool returns summaries (not full content) for 90%+ token savings — agents review summaries and fetch full content only when needed.

This pattern is directly applicable to Wilson Premier: a shared PostgreSQL memory store with document types (`decision`, `guest_note`, `lead_observation`, `market_signal`) that get promoted from raw captures to structured warm-tier knowledge.

**Source:** Vault research — T1 (directly observed implementation)

### MCP as the Universal Memory Interface

The pattern crystallizing in 2026: **MCP as the bridge between PKM/memory stores and LLM agents**. Every serious memory tool is shipping MCP:
- Mem0 → MCP connector (Claude, any MCP client can use your memory)
- Memoria → native MCP server
- Tana → local MCP endpoint (AI can query your Tana knowledge graph)
- Mem.ai → Claude MCP connector (March 2026, verified in existing vault research)

**For EMA's Vault:** The vault should expose an MCP server that EMA's agents can call. Every agent that runs inside EMA gets access to the full vault via standardized MCP tools: `vault_search`, `vault_read`, `vault_write`, `vault_link`. This makes the vault a first-class agent context provider, not just a file dump.

---

## Area 5: Desktop Agent Interfaces

*What Trajan is building: EMA as a Tauri desktop app with glass aesthetic UI mixing agent chat, structured data views, and execution logs.*

### Tauri 2.0 + Verso Integration — The Stack (T1)

Tauri 2.0 (stable, Oct 2024) is the correct production choice for EMA. Key 2026 development: **experimental Verso integration** (March 2025, tauri-runtime-verso). Verso is a Tauri-compatible webview built on Servo (Rust-based browser engine). Currently supports React + Vite, windowing functions, drag regions, CSS hot reload, official plugins. Still experimental — not ready for production EMA use.

**Why this matters:** Verso/Servo represents a future where EMA doesn't depend on system WebKit/WebView2 — a fully Rust native webview. Not actionable today, but relevant for EMA's 2026 roadmap if Verso matures.

**Tauri 2.0 for EMA:** Fully supported, stable. EMA's Elixir/Phoenix daemon + Tauri IPC is a validated architecture. The glass aesthetic works well with Tauri's native webview rendering.

**Source:** [Tauri blog](https://tauri.app/blog/) — T1; [Verso integration post](https://tauri.app/blog/tauri-verso-integration/) — T1

### The Proven UX Patterns for Agent Frontends

Synthesized from the vault's deep Agent OS research (Agent-OS-Speculative-UI-Deep-Dive.md, Agent-OS-UX-Competitive-Deep-Dive.md):

**Pattern 1: Height AI's "AI as Teammate" + Retool's Execution Log**
- Agent activity appears as feed items with AI avatar: "🤖 Lead Agent found 3 new prospects"
- Expandable execution detail: steps taken, tokens used, timing, outputs
- Persistent "Agent Activity" sidebar showing what's running NOW
- Nobody combines these two in a multi-agent context

**Pattern 2: Autonomy Slider (Cursor's pattern)**
- Every interaction has a spectrum: Suggest → Assist → Autopilot
- Maps to EMA's Proposals (suggest) → Tasks (assist) → Autonomous Pipes (autopilot)
- The slider is the UX that makes agents feel under control

**Pattern 3: Artifact Persistence (Claude Artifacts)**
- Agent outputs are first-class objects, not scrolling chat messages
- Split pane: chat left, current working artifact right
- Artifact updates as agent works; versions are tracked
- For EMA: research reports, proposals, plans are artifacts that persist in the Vault

**Pattern 4: Pipeline Visualization (GitHub Actions)**
- Show current workflow as horizontal pipeline: trigger → agents → output
- Active stage is expanded/highlighted
- Each stage has count badge, status indicator
- Click any stage to see its items and execution detail

**Pattern 5: Record Page Anatomy (Salesforce)**
- Everything is a record: agent, task, proposal, vault note, habit
- Every record has: fields, status workflow, related records, activity timeline, action buttons
- The action button on a status display ("Agent is blocked" → "Review & Unblock" button inline)

### Desktop Agent Apps in 2026

**What exists:**
- **AutoGen Studio** — no-code GUI for multi-agent systems, conversation-centric view
- **LangGraph Studio** — graph visualization with real-time execution state, time-travel debugging
- **CrewAI visual editor** — drag-and-drop crew composition, workflow tracing
- **Open WebUI** — self-hosted multi-model chat portal (not agentic coordination)

**What nobody has built:** A personal executive OS that combines:
- Multi-agent coordination (not just chat)
- Structured data views (Projects, Tasks, Habits, Journal)
- Glass aesthetic UI
- Local-first with vault integration
- Built-in code runner

**EMA's design gap:** The most important missing piece is the **execution log as a first-class feature**. Every agent action should be visible, expandable, and linkable to its artifact. When Wilson Premier's Lead Discovery agent runs, the EMA UI should show: which sources it scanned, what it found, confidence scores, vault notes written. Not a black box.

---

## Key Takeaways (Actionable)

### For EMA

1. **Adopt the Fibery query model**: EMA's agent layer should be able to code-generate and execute queries against EMA's structured data, not just chat over it. Implement a "Query Layer" that lets the AI interrogate Projects/Tasks/Habits/Proposals via actual data queries, not LLM reasoning over text summaries.

2. **Expose Vault as MCP server**: Every EMA agent should be able to call `vault_search`, `vault_read`, `vault_write` via standardized MCP. This is the foundation for agent memory continuity.

3. **Memoria for agent memory versioning**: Install the OpenClaw plugin now (`@matrixorigin/memory-memoria`). Use snapshot/rollback to protect against agent runs that corrupt memory state. Branch for experimental agent sessions.

4. **Execution log as first-class UI**: Persistent sidebar or dedicated section showing all agent activity with expandable step logs. This is what separates EMA from every existing tool. Model it on Retool's workflow run view + Height's AI teammate feed.

5. **Proposals as "briefing" not "tasks"**: The EMA Proposals section should feel like an advisory briefing — agents noticed things and have suggestions, each with confidence score and approve/reject. This mental model (Trajan as approver, agents as advisors) is confirmed by the competitive analysis as the correct framing.

6. **Autonomy slider across all agent interactions**: Every section should have a "how autonomous" control — Suggest (AI proposes, human acts) → Assist (AI does with human approval) → Autopilot (AI runs unattended). This is the UX that makes agentic systems feel controllable.

### For Wilson Premier

1. **Framework selection**: Use OpenAI Agents SDK handoffs for real-time interactions (guest inquiries, alerts). Use CrewAI Flows with n8n triggers for scheduled batch workflows (daily briefings, lead discovery). Don't force one framework for all 14 agents.

2. **Positioning vs Hospitable/Guesty**: Wilson Premier agents connect *on top of* existing platforms via their APIs. Don't replace Hospitable — add the intelligence layer Hospitable doesn't have. This is also the sales pitch: "Hospitable handles operations; Wilson Premier adds strategic intelligence."

3. **Mem0 for shared agent memory**: All 14 agents read/write the same Mem0 memory store. Guest Concierge writes preferences; Lead Discovery writes market signals; Daily Briefing synthesizes across all. Without shared memory, agents are siloed — the 14-agent system becomes 14 isolated tools.

4. **Smith Mountain Lake specificity is the moat**: No off-the-shelf tool knows SML lakefront pricing patterns, Craig Wilson's property inventory, or the specific guest demographics he targets. Wilson Premier agents trained on SML-specific data will outperform generic hospitality AI by a large margin. The competitive advantage is domain specificity, not technical sophistication.

5. **Daily Briefing Agent architecture**: Manager agent pattern (SDK) that calls Lead/Occupancy/Finance agents as tools in parallel (`asyncio.gather`), collects results, synthesizes with Claude into a structured briefing. This is the highest-ROI agent to build first — it makes all other agents' outputs visible and valuable.

---

## Contested / Uncertain

- **CrewAI production scale**: CrewAI claims 450M+ workflows/month and 60% Fortune 500 adoption (from vault research). This figure is difficult to independently verify. The 60% Fortune 500 claim is likely marketing inflation. Core functionality is verified; scale claims are uncertain.

- **Mem0 +26% accuracy improvement**: This is Mem0's own benchmark vs OpenAI's native memory. Independent replication not found. Take as directionally accurate, not precise.

- **Verso/Tauri integration for production use**: Currently experimental (March 2025 blog post). Not suitable for EMA production until Servo/Verso achieves stable feature parity with WebKit/WebView2.

- **Real estate AI automation pricing in 2026**: Specific pricing for STR management tools (Hospitable, Guesty) not researched. Feature states verified but cost-benefit analysis for Wilson Premier not done.

---

## Open Questions

1. **Wilson Premier n8n integration depth**: How does n8n connect to OpenAI Agents SDK? Is n8n triggering agents via webhooks, or is the SDK driving n8n workflows? The architecture isn't fully specified.

2. **EMA's Elixir/Phoenix daemon IPC pattern**: What's the exact communication pattern between Phoenix (backend) and Tauri (frontend)? WebSocket, IPC commands, or both? This affects how agents stream their execution logs to the UI.

3. **Guesty/Hospitable API openness**: Can Wilson Premier agents actually write to Hospitable (not just read)? Guest message sending, task creation, review responses — these require write API access. Verification needed before committing to this architecture.

4. **LangGraph vs SDK for Wilson's long-running agents**: Financial monitoring agents that run continuously need durable execution (LangGraph). But how does this interact with n8n's trigger model? A clear integration pattern for "n8n triggers LangGraph workflow" needs to be documented.

---

## Sources

**T1 — Primary (Official docs, verified repos)**
1. [T1] [OpenAI Agents SDK — Multi-agent docs](https://openai.github.io/openai-agents-python/multi_agent/) — Core SDK orchestration patterns
2. [T1] [OpenAI Agents SDK — Handoffs](https://openai.github.io/openai-agents-python/handoffs/) — Handoff implementation reference
3. [T1] [OpenAI Agent Patterns README](https://github.com/openai/openai-agents-python/blob/main/examples/agent_patterns/README.md) — Deterministic, routing, as-tools, judge, parallel, guardrails patterns
4. [T1] [CrewAI Flows docs](https://docs.crewai.com/en/concepts/flows) — Event-driven workflow architecture
5. [T1] [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — Durable execution, HIL, state management
6. [T1] [AutoGen README](https://github.com/microsoft/autogen/blob/main/README.md) — AgentTool, MCP integration, multi-agent patterns
7. [T1] [Mem0 Platform docs](https://docs.mem0.ai/overview) — v1.0.0 features, graph memory, MCP
8. [T1] [Memoria GitHub](https://github.com/matrixorigin/Memoria) — Git-level agent memory, MCP server
9. [T1] [Tauri blog](https://tauri.app/blog/) — 2.0 stable, Verso integration
10. [T1] [Tauri Verso integration](https://tauri.app/blog/tauri-verso-integration/) — Experimental Servo webview
11. [T1] [Tana AI docs](https://outliner.tana.inc/docs/tana-ai) — MCP endpoint, typed graph, AI agents (from ExecAI-2026-03-31 vault note)
12. [T1] Vault: Agent-OS-UX-Competitive-Deep-Dive.md — directly observed competitive analysis

**T2 — Institutional**
13. [T2] [Hospitable Copilot](https://hospitable.com/features/copilot) — STR AI copilot feature state
14. [T2] [Guesty features](https://www.guesty.com/features/) — Enterprise STR platform capabilities
15. [T2] [Dust.tt homepage](https://dust.tt/) — "OS for AI Agents" positioning, 5K+ orgs
16. [T2] [Fibery Smart Agent benchmark](https://fibery.com/blog/fibery-vs-x/fibery-vs-notion-ai-agent/) — AI query layer accuracy vs Notion
17. [T2] [LangGraph blog — Multi-agent workflows](https://blog.langchain.com/langgraph-multi-agent-workflows/) — Architecture patterns
18. [T2] Vault: Multi-Agent Coordination Patterns.md — CrewAI/LangGraph/AutoGen taxonomy
19. [T2] Vault: Agent-OS-Business-Software-Paradigms.md — ERP/CRM UX patterns for agent OS
20. [T2] Vault: Competitive-Analysis-AI-Agent-Interfaces.md — 13-product competitive map
21. [T2] Vault: Agent-OS-Speculative-UI-Deep-Dive.md — UX patterns from 10+ agent frameworks
22. [T2] Vault: Memoria-Agent-Memory.md — Memoria analysis (verified T1 tier content)
23. [T2] Vault: Three-Tier Memory Architecture.md — Hot/warm/cold memory implementation analysis

**T3 — Secondary**
24. [T3] Vault: Agent-Architecture-Synthesis-2026-03.md — Internal synthesis (self-generated)
25. [T3] Vault: Competitive/competitive-landscape.md — Internal competitive tracker
26. [T3] Vault: ExecAI-Management-2026-03-31.md — Prior day's research (directly adjacent)
27. [T3] [Capacities AI philosophy](https://capacities.io/blog/ai-for-meaningful-work) — Counter-positioning, privacy-first PKM (from prior vault note)
28. [T3] Guesty homepage raw HTML — Feature list extraction (JSON-encoded, limited readability)
