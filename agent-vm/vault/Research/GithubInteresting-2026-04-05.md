---
title: "GitHub Interesting — 2026-04-05"
type: research
created: 2026-04-05
tags: [github, agents, rust, mcp, self-hosted, llm, typescript]
summary: "Top finds: claurst (Claude Code in Rust), open-multi-agent (minimal TS framework), rvllm (drop-in vLLM Rust), stirling-image, Linux 7.0 PostgreSQL regression"
---

## Notable Finds — 2026-04-05 11:19 UTC

### [[GitHub]] Repos

**[Kuberwastaken/claurst](https://github.com/Kuberwastaken/claurst)** ⭐8,130
- Claude Code terminal agent rewritten in Rust + breakdown of the Claude Code source leak
- Reverse engineering the leaked harness architecture with Rust performance
- Created 2026-03-31

**[JackChen-me/open-multi-agent](https://github.com/JackChen-me/open-multi-agent)** ⭐4,494
- TypeScript multi-agent framework: one `runTeam()` call, auto task decomposition, parallel execution
- Only 3 dependencies. Model-agnostic (Claude, OpenAI, Ollama)
- Created 2026-03-31

**[codeany-ai/open-agent-sdk-typescript](https://github.com/codeany-ai/open-agent-sdk-typescript)** ⭐2,319
- Open-source alternative to claude-agent-sdk, no CLI dependencies
- Fully open source agent SDK in TypeScript

**[Leonxlnx/agentic-ai-prompt-research](https://github.com/Leonxlnx/agentic-ai-prompt-research)** ⭐2,084
- Reconstructed prompt patterns from agentic AI coding assistants
- Covers agent coordination, security classification of prompt patterns

**[m0at/rvllm](https://github.com/m0at/rvllm)** ⭐370
- Drop-in vLLM replacement written in Rust
- High-performance LLM inference server

**[stirling-image/stirling-image](https://github.com/stirling-image/stirling-image)** ⭐498
- Stirling-PDF but for images: 30+ tools + local AI in single Docker container
- Resize, compress, remove bg, upscale, OCR. Self-hosted, no telemetry.

### HN

**[Show HN: Build a GPU game](https://jaso1024.com/mvidia/)** — 776pts
- Browser game teaching GPU architecture through building one

**[AWS engineer: PostgreSQL perf halved by Linux 7.0](https://www.phoronix.com/news/Linux-7.0-AWS-PostgreSQL-Drop)** — 311pts  
- Kernel regression with no easy fix identified yet

## Notable Finds — 2026-04-05 14:34 UTC

### [[GitHub]] Repos

**[wong2/diffx](https://github.com/wong2/diffx)** ⭐44
- Local PR-style review UI for AI-generated changes
- Leave inline comments, then hand them back to your agent as structured fix instructions
- Fresh TypeScript tool updated today

**[Piebald-AI/splitrail](https://github.com/Piebald-AI/splitrail)** ⭐144
- Real-time token and cost monitor across Claude Code, Codex, Gemini CLI, Cline, Roo, OpenCode, and more
- Rust implementation focused on observability for multi-agent / multi-CLI workflows

**[shep-ai/shep](https://github.com/shep-ai/shep)** ⭐102
- Parallel coding agents with isolated worktrees, automatic commits, CI watching, and PR flow
- More interesting than another agent wrapper because it handles the repo operations around parallel execution

### [[HN]] / Blogs

**[LLM Wiki – example of an idea file](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)** — 241pts on HN
- Karpathy gist on using an LLM-maintained markdown wiki as a compounding knowledge layer between raw sources and answers
- Strong fit for Obsidian / agent-maintained vault workflows

**[The machines are fine. I'm worried about us.](https://ergosphere.blog/posts/the-machines-are-fine/)** — 374pts on HN
- Sharp essay about AI deskilling: outputs may stay good while the human stops building durable internal models
- Especially relevant to current agent/wiki workflows and “persistent brain gap” failure modes

### [[arXiv]]

**[ProdCodeBench: A Production-Derived Benchmark for Evaluating AI Coding Agents](https://arxiv.org/abs/2604.01527)**
- Benchmark built from real production assistant sessions with verbatim prompts, committed code changes, and fail-to-pass tests across seven languages
- Paper argues that agents that validate more aggressively (tests, static analysis) solve more tasks

### [[Reddit]]

**[Career-Ops thread](https://www.reddit.com/r/ClaudeAI/comments/1sd2f37/i_built_an_ai_job_search_system_with_claude_code/)** — 371 upvotes
- Claude Code used as the engine for a job-search pipeline: offer scoring, tailored PDFs, portal scanning, interview prep, and tracking
- Notable because it is an actual end-to-end operational workflow, not just a thin wrapper demo
# Github Interesting — 2026-04-05

Run: 2026-04-05 15:38 UTC

## Best finds

### 📝 Claudian
**Why it matters:** The cleanest "claude code inside obsidian" integration i found this run.

It turns your vault into Claude's working directory instead of bolting on a chat sidebar with no real agency. The interesting part is the full stack around it: MCP support, custom subagents, reusable skills, inline edits with diff preview, and plan mode with explicit approval flow.

https://github.com/YishenTu/claudian  
Source: `GitHub` · Metric: `5.9k★`

### 📚 Obsidian Agent Client
**Why it matters:** Acp is quietly becoming the least-janky way to bring coding agents into editors that weren't built for them.

This plugin wires Obsidian to Claude Code, Codex, and Gemini CLI through Zed's Agent Client Protocol instead of hardcoding one vendor path. Multi-session views, note mentions, slash commands, and terminal-backed execution make it feel more like a native agent front-end than a prompt box.

https://github.com/RAIT-09/obsidian-agent-client  
Source: `GitHub` · Metric: `1.5k★`

### 🕸️ AgentsMesh
**Why it matters:** One of the more concrete "agent fleet" repos instead of another vague orchestration demo.

The differentiator is that it treats agents like remote workstations with pod isolation, channel-based collaboration, and task/PR bindings instead of just chaining API calls. If you care about running Claude/Codex/Gemini as a managed workforce on your own infra, this is worth a real look.

https://github.com/AgentsMesh/AgentsMesh  
Source: `GitHub` · Metric: `1.3k★`

### 🖥️ Helix
**Why it matters:** Private agent infrastructure with an actual opinion about gpus, observability, and mcp.

Helix isn't just "host an LLM" — it bundles agent sessions, RAG, tool wiring, tracing, cost visibility, and a scheduler that packs models into GPU memory. That makes it interesting for self-hosters who want a full control plane rather than piecing together six separate services.

https://github.com/helixml/helix  
Source: `GitHub` · Metric: `752★`

### 🦀 rust-analyzer-mcp
**Why it matters:** Exactly the sort of narrow mcp tool that makes agents less fake-smart in real codebases.

Instead of asking an LLM to hallucinate Rust semantics from raw files, it exposes rust-analyzer capabilities directly over MCP: symbols, hover, definitions, references, and more. Small repo, but high leverage if you want coding agents to stop guessing about Rust projects.

https://github.com/zeenix/rust-analyzer-mcp  
Source: `GitHub` · Metric: `59★`

### 🪨 caveman
**Why it matters:** Mostly a joke, but also a surprisingly practical token-efficiency hack.

It packages the viral "Claude but terse" trick as an installable Claude Code skill and claims roughly 75% output-token savings without losing technical substance. Worth clicking because it's a good reminder that output style control can matter as much as model choice when you're paying for lots of agent turns.

https://github.com/JuliusBrussee/caveman  
Source: `GitHub` · Metric: `660★`

### 🧠 claude-mem
**Why it matters:** Memory compression is turning into its own serious layer in coding-agent workflows.

This plugin captures session activity, compresses it, and feeds relevant context back into future Claude Code runs instead of letting history sprawl forever. Huge adoption already, which makes it more interesting as an emerging pattern than as a single plugin.

https://github.com/thedotmack/claude-mem  
Source: `GitHub` · Metric: `45.4k★`

### 🔐 Someone at BrowserStack Is Leaking Users' Email Address
**Why it matters:** A very specific privacy failure write-up, not hand-wavy outrage bait.

Terence Eden used a one-off email alias, got contacted through Apollo, and traced the chain back to BrowserStack participation in a contact-sharing network. The useful bit is the methodology: unique aliases turn vague privacy suspicion into something you can actually prove.

https://shkspr.mobi/blog/2026/04/someone-at-browserstack-is-leaking-users-email-address/  
Source: `Blog / HN` · Metric: `231 points`

### 🧠 Novel Memory Forgetting Techniques for Autonomous AI Agents
**Why it matters:** Most agent-memory work obsesses over remembering more; this one argues for forgetting on purpose.

The paper proposes budgeted forgetting using recency, frequency, and semantic alignment so long-running agents don't accumulate garbage context and false memories. Practical relevance is obvious if you're building persistent assistants: memory quality is starting to matter more than raw memory size.

https://arxiv.org/abs/2604.02280  
Source: `arXiv` · Metric: `new paper`

## Notable Finds — 2026-04-05 16:43 UTC

### [[GitHub]] Repos

**[superradcompany/microsandbox](https://github.com/superradcompany/microsandbox)** ⭐5,255
- Rootless microVM sandboxes for agents that boot locally in milliseconds
- The notable bit is the secret model: the VM only sees placeholders while the real credential is swapped at the network boundary for approved hosts
- Strong fit for anyone trying to make local agents materially safer without standing up full infra

**[always-further/nono](https://github.com/always-further/nono)** ⭐1,651
- Kernel-enforced sandbox for Claude Code, Codex, OpenClaw, and generic CLI agents
- More interesting than another wrapper because it ships policy manifests, endpoint-level filtering, detached sessions, rollback, and Sigstore-flavored attestation ideas in one place
- Worth watching as the security layer around coding agents gets more opinionated

**[agentgateway/agentgateway](https://github.com/agentgateway/agentgateway)** ⭐2,293
- Agent-native proxy for MCP, A2A, and multi-LLM routing
- It is basically trying to be Envoy for agent traffic: auth, RBAC, prompt enrichment, failover, observability, and tool federation instead of just another MCP server list
- Good signal that the ecosystem is maturing from agents-as-demos to agents-as-infrastructure

**[iwe-org/iwe](https://github.com/iwe-org/iwe)** ⭐863
- Local-first markdown knowledge graph built for both humans and agents
- The useful idea is not just "notes in markdown"; it is hierarchical inclusion links, LSP tooling, and an MCP/CLI surface so agents can traverse and update the graph with inherited context
- Very aligned with Obsidian-adjacent external memory workflows

**[santifer/career-ops](https://github.com/santifer/career-ops)** ⭐266
- Claude Code turned into a real operational pipeline, not just a one-off prompt trick
- It scores opportunities, rewrites ATS-friendly PDFs, scans job boards, keeps a tracker, and uses multiple skill modes plus a Go TUI as the control plane
- Interesting because it shows what a serious personal workflow on top of Claude Code actually looks like

### [[HN]] / Blogs

**[LLM Wiki – example of an idea file](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)** — 257pts on HN
- Karpathy sketches a persistent wiki layer where the LLM continuously compiles source material into linked markdown instead of re-deriving answers from raw docs every time
- The line that matters: Obsidian as the IDE, the LLM as the programmer, the wiki as the codebase
- High-signal if you care about durable memory instead of disposable RAG

**[The machines are fine. I'm worried about us.](https://ergosphere.blog/posts/the-machines-are-fine/)** — 558pts on HN
- Sharp argument that output parity can hide skill decay: the student shipping the same paper may not be building the same internal model anymore
- Good corrective to the lazy "AI made me faster so everything is fine" story, especially for research and long-horizon technical work
- Worth reading if you're building systems that are supposed to make people stronger, not just more productive-looking

## Notable Finds — 2026-04-05 17:48 UTC

### [[GitHub]] Repos

**[backnotprop/plannotator](https://github.com/backnotprop/plannotator)** ⭐3,911
- Visual review layer for coding-agent plans and diffs instead of treating them as disposable chat output
- Lets you annotate, approve, deny, and feed structured comments back into Claude Code, Codex, Gemini CLI, Pi, and OpenCode
- The strongest idea is the sharing model: small plans in URL hashes, large ones end-to-end encrypted before upload

**[ghostwright/phantom](https://github.com/ghostwright/phantom)** ⭐1,198
- "Give the agent its own computer" taken seriously: persistent memory, MCP tools, Slack/Telegram/email identity, and its own workspace
- README examples are unusually concrete: ClickHouse analytics stack, self-monitoring dashboards, and the agent wiring up a new Discord channel for itself
- Worth watching as one of the clearest agent-as-coworker implementations rather than another terminal wrapper

**[codeany-ai/open-agent-sdk-typescript](https://github.com/codeany-ai/open-agent-sdk-typescript)** ⭐2,331
- Fully open-source agent SDK that runs the loop in-process instead of shelling out to a CLI
- Supports Anthropic plus OpenAI-compatible backends, hook registries, MCP server creation, bundled skills, and embedded sessions
- Interesting because it lowers the friction for deploying agents inside CI, serverless, and backend apps

**[Railly/agentfiles](https://github.com/Railly/agentfiles)** ⭐425
- Obsidian plugin for browsing and managing skills, commands, and agent files across Claude Code, Codex, Cursor, Windsurf, Copilot, and more
- Also adds session-history browsing, vault export, and usage analytics via skillkit
- Strong signal that Obsidian is becoming a practical control surface for agent workflows, not just a notes app with AI glued on

**[pawurb/hotpath-rs](https://github.com/pawurb/hotpath-rs)** ⭐1,422
- Rust profiler for functions, channels, futures, streams, allocations, and runtime metrics with both TUI and MCP interfaces
- The MCP angle is the interesting bit: agents can query live profiling data directly instead of guessing from logs and stack traces
- Feels like the right shape for next-gen debugging tools: instrumentation first, agent-readable second

### [[HN]] / Blogs

**[Eight years of wanting, three months of building with AI](https://lalitm.com/post/building-syntaqlite-ai/)** — 269pts on HN
- Lalit Maganti explains how AI coding agents finally pushed a long-deferred SQLite devtools project over the finish line
- The post is valuable because it is specific: extracting parser behavior from SQLite's dense C code, mapping 400+ grammar rules, and separating where agents accelerated work from where they created drag
- Better than generic "AI built my app" content because it is evidence-backed and technically grounded

### [[arXiv]]

**[SKILL0: In-Context Agentic Reinforcement Learning for Skill Internalization](https://arxiv.org/abs/2604.02268)**
- Argues that agent skills should move from runtime prompt attachments into model parameters through a curriculum that gradually removes explicit skill context
- Promising for reducing retrieval noise and token overhead while preserving tool-use competence in multi-turn tasks
- Direct practical relevance to anyone building skill systems, memory layers, or long-running agents
