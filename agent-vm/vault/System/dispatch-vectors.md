---
title: Dispatch Vectors
type: system-index
created: 2026-03-25
updated: 2026-03-26
tags: [dispatch, agents, skills, routing]
---

# Dispatch Vectors — Agent Routing Index

Semantic routing index for intelligent agent dispatch. Replaces brittle keyword matching with vocabulary-rich descriptions that enable BM25/vector search to route tasks to the right specialist.

**How it works:** `smart-dispatch.sh "task description"` searches this file. Each agent entry contains broad vocabulary describing what they handle — including synonyms, example tasks, and edge cases — so queries like "this API leaks user emails" find the security agent without using the word "audit."

---

## Agent Roster

### 🤝 Right Hand (main)
**Agent ID:** `main`
**Accent:** #E8A838
**Role:** Default voice, orchestrator, human interface, general assistant
**Capabilities:** Routing, coordination, general tasks, casual conversation, scheduling, recommendations, personal requests, errands
**Skills:** All (orchestrates specialists)
**Use when:** Casual conversation, simple questions, personal requests, anything not clearly a specialist domain, orchestration of multiple specialists
**Triggers:** Any message; this is the fallback
**Vocabulary:** general, help, what, how, can you, please, question, opinion, recommend, schedule, book, look up, concierge, errand, personal, casual

---

### 🔬 Researcher (researcher)
**Agent ID:** `researcher`
**Role:** Research, evaluation, discovery, web intelligence
**Skills:** deep-research-pro, agent-tester, self-improving-agent, soulcraft, deep-scraper, agent-browser, parallel-ai-research
**Use when:** Researching topics, evaluating options, finding community resources, ClawHub discovery, web scraping, fact-checking, literature review, competitive analysis, monitoring feeds, gathering intelligence
**Triggers:** "look into", "what is", "compare", "research", "find out", "investigate", "evaluate", "assess", "discover"
**Vocabulary:** research, investigate, find, look into, compare, evaluate, assess, what is, who made, how does, explain, background, overview, briefing, competitive analysis, literature review, fact check, source, evidence, citation, community, discover, ClawHub, web scraping, monitor, feed, intelligence gathering, analyze topic, summarize, survey, learn about, understand

---

### 💻 Coder (coder)
**Agent ID:** `coder`
**Role:** Building, implementing, fixing, creating code and features
**Skills:** agent-factory, devloop-agent-pack
**Use when:** Building new features, creating apps, implementing anything in code, fixing bugs, debugging, refactoring, code review, creating agents, writing scripts, error messages that need fixing, full software development lifecycle
**Triggers:** "build", "fix", "implement", "create", "make it work", error messages, code files, "develop", "write code"
**Vocabulary:** build, implement, create, code, develop, fix, debug, error, bug, feature, app, application, script, function, class, module, API, endpoint, database, schema, deploy, test, refactor, architecture, design, engineering, software, program, code review, pull request, branch, commit, TypeScript, Python, JavaScript, Node, React, backend, frontend, full stack, CLI, tool, automation, workflow, DevLoop

---

### ⚙️ Ops (ops)
**Agent ID:** `ops`
**Role:** System health, deployments, performance, crons, evolution
**Skills:** agent-performance, evolution-loop, context-evolution, prompt-compiler, config-guardian, cron-mastery, system-resource-monitor
**Use when:** System health checks, restarting services, deploying changes, cron job management, performance monitoring, resource usage, evolution runs, agent performance tracking, gateway management, operational automation
**Triggers:** "check health", "restart", "deploy", "system", "cron", "performance", "evolution run"
**Vocabulary:** health, restart, deploy, system, cron, schedule, performance, resource, CPU, RAM, disk, memory, monitor, alert, gateway, service, uptime, evolution, mutation, SOUL.md improve, agent score, dashboard, operational, maintenance, watchdog, backup, rollback, config

---

### 🛡️ Security (security)
**Agent ID:** `security`
**Role:** Security audits, vulnerability assessment, hardening, threat detection, data protection
**Skills:** clawdefender, security-audit-toolkit, agent-tester
**Use when:** Security audits, vulnerability scanning, finding security issues, protecting data, preventing breaches, reviewing code for security problems, auditing infrastructure, checking for credential leaks, fixing authentication issues, protecting user data, OWASP compliance, preventing injection attacks, SSL/TLS verification, prompt injection detection, sensitive data exposure, PII handling, GDPR compliance, API security, endpoint security, access control
**Triggers:** "secure", "audit", "vulnerability", "leak", "exposed", "breach", "attack", "injection", "credentials", "hardened", "pentest", "OWASP"
**Vocabulary:** security, secure, audit, vulnerability, CVE, OWASP, injection, SQL injection, XSS, CSRF, command injection, prompt injection, credentials, hardcoded secrets, API keys, leak, leaking, exposed, exposure, breach, attack, attacker, exploit, malicious, insecure, dangerous, harden, hardening, protect, protection, pentest, penetration test, compliance, GDPR, PII, personal data, private data, sensitive data, user data, email leak, email exposure, data exfiltration, unauthorized access, authentication, authorization, access control, SSL, TLS, HTTPS, certificate, path traversal, SSRF, RCE, remote code execution, privilege escalation, firewall, threat, threat model, risk, remediate, fix security, sanitize, input validation, secret detection, password, token, bearer, API security, endpoint security, user privacy, data protection

---

### 📚 Vault Keeper (vault-keeper)
**Agent ID:** `vault-keeper`
**Role:** Vault organization, knowledge management, memory architecture
**Skills:** memory-hygiene, elite-longterm-memory, auto-knowledge, obsidian-ontology-sync, knowledge-graph
**Use when:** Organizing the Obsidian vault, cleaning up notes, knowledge architecture, memory optimization, vault hygiene, syncing ontology, knowledge graph updates, note organization, information architecture
**Triggers:** "organize vault", "clean up notes", "knowledge", "memory architecture", "vault"
**Vocabulary:** vault, Obsidian, organize, clean up, notes, knowledge, memory, architecture, ontology, entity, relationship, graph, index, sync, hygiene, deduplicate, structure, taxonomy, categorize, tag, link, backlink, wikilink, knowledge base, information architecture

---

### 🔭 Scout / Browser Automation (browser-automation)
**Agent ID:** `browser-automation`
**Role:** Web research, scraping, feed monitoring, browser automation
**Skills:** agent-browser, deep-scraper, deep-research-pro
**Use when:** Scraping websites, monitoring web content, checking URLs, feed watching, web automation, clicking through pages, form filling, web testing, extracting structured data from sites
**Triggers:** "scrape", "monitor", "check website", URL mentioned, "feed watching", "extract from site"
**Vocabulary:** scrape, extract, crawl, web, website, URL, browser, automation, headless, navigate, click, form, screenshot, monitor, feed, RSS, check page, HTML, content extraction, web testing, data extraction

---

### 🎯 Prompt Engineer (prompt-engineer)
**Agent ID:** `prompt-engineer`
**Role:** Prompt optimization, SOUL.md design, metaprompting, personality tuning
**Skills:** soulcraft, context-evolution, prompt-compiler, agent-tester, self-improving-agent, personality-dynamics
**Use when:** Improving prompts, optimizing SOUL.md, designing agent personality, metaprompting, prompt quality issues, agent behavior tuning, voice refinement
**Triggers:** "improve prompt", "optimize SOUL", "metaprompt", "prompt quality", "agent personality"
**Vocabulary:** prompt, SOUL.md, personality, metaprompt, optimize, improve, quality, voice, tone, behavior, persona, refine, design, craft, identity, character, agent design, soulcraft, prompt engineering, context assembly, modular prompt

---

### 😈 Devil's Advocate (devils-advocate)
**Agent ID:** `devils-advocate`
**Role:** Critical review, challenging assumptions, risk identification, adversarial perspective
**Skills:** agent-tester, soulcraft, mental-models, parallax
**Use when:** Reviewing proposals before shipping, challenging assumptions, identifying what could go wrong, adversarial review, 5-stakeholder perspective analysis, pre-ship quality gate
**Triggers:** "review this", "challenge", "what could go wrong", "pre-ship review", "critique"
**Vocabulary:** review, challenge, critique, adversarial, what could go wrong, risks, assumptions, blind spots, flaw, weakness, stakeholder, perspectives, devil's advocate, red team, stress test, pre-ship, quality gate

---

### 🧠 Strategist (strategist)
**Agent ID:** `strategist`
**Role:** Multi-perspective analysis, decision frameworks, strategic thinking, tradeoffs
**Skills:** mental-models, diverge, parallax, intelligent-delegation
**Use when:** Big-picture analysis, strategic decisions, tradeoff analysis, Munger-style multi-disciplinary thinking, complex decision frameworks, analyzing decisions from multiple angles
**Triggers:** "analyze decision", "strategy", "tradeoffs", "big picture", "frameworks"
**Vocabulary:** strategy, strategic, decision, tradeoffs, analysis, framework, mental models, Munger, multi-disciplinary, physics, biology, psychology, economics, history, latticework, perspective, big picture, long-term, planning, architecture decision, design decision, diverge, parallax, stakeholders

---

## Perspective Skills (cross-cutting)

### mental-models
Apply Munger-style latticework — multiple disciplines simultaneously (physics, biology, psychology, economics, math, history). Use for big decisions to avoid single-framework bias.

### diverge
Spawn multiple perspectives before converging. For product decisions, creative work, complex tradeoffs.

### parallax
5 simultaneous stakeholder views: user, developer, operator, attacker, business. For architecture and design decisions.

### intelligent-delegation
5-phase delegation framework with tracking, verification, fallback chains, and multi-axis task scoring. Baked into every dispatch.

### personality-dynamics
Dynamic personality adaptation and mode switching. For tuning agent voice and learning interaction patterns.

### devloop-agent-pack
Full product development lifecycle (6 agent roles: Product, Core Dev, Dev, Test, Marketing, Research). For end-to-end feature development.

---

## Routing Examples

These examples train the dispatch index on semantic routing:

| Task | Routes To | Why |
|---|---|---|
| "Build a CLI tool to parse logs" | coder | Implements code |
| "What are best practices for rate limiting APIs?" | researcher | Research question |
| "Make this API endpoint stop leaking user emails" | security | Data exposure = security domain |
| "Our auth tokens are visible in logs" | security | Credential exposure |
| "Check if the gateway is healthy" | ops | System health |
| "Set up a cron to run cleanup every night" | ops | Scheduling/cron |
| "Clean up the vault notes folder" | vault-keeper | Vault organization |
| "What should I have for dinner?" | main (concierge) | Personal request |
| "Review this PR before we merge" | coder / devils-advocate | Code review |
| "Is this architecture decision sound?" | strategist / devils-advocate | Strategic review |
| "Scrape pricing data from competitor sites" | browser-automation | Web scraping |
| "Improve my agent's personality" | prompt-engineer | SOUL.md optimization |
| "XSS vulnerability found in our login form" | security | Injection vulnerability |
| "Users are reporting their passwords are exposed" | security | Credential exposure |
| "Hardcode removal — we have API keys in .env committed to git" | security | Secrets in source |

---


## Uncategorized (Auto-Detected) Skills

### gitnexus-cli
**Path:** `skills/.claude/skills/gitnexus/gitnexus-cli/SKILL.md`
**Description:** Use when the user needs to run GitNexus CLI commands like analyze/index a repo, check status, clean the index, generate a wiki, or list indexed repos. Examples: Index this repo, Reanalyze the codebase, Generate a wiki

### gitnexus-debugging
**Path:** `skills/.claude/skills/gitnexus/gitnexus-debugging/SKILL.md`
**Description:** Use when the user is debugging a bug, tracing an error, or asking why something fails. Examples: Why is X failing?, Where does this error come from?, Trace this bug

### gitnexus-exploring
**Path:** `skills/.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`
**Description:** Use when the user asks how code works, wants to understand architecture, trace execution flows, or explore unfamiliar parts of the codebase. Examples: How does X work?, What calls this function?, Show me the auth flow

### gitnexus-guide
**Path:** `skills/.claude/skills/gitnexus/gitnexus-guide/SKILL.md`
**Description:** Use when the user asks about GitNexus itself — available tools, how to query the knowledge graph, MCP resources, graph schema, or workflow reference. Examples: What GitNexus tools are available?, How do I use GitNexus?

### gitnexus-impact-analysis
**Path:** `skills/.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`
**Description:** Use when the user wants to know what will break if they change something, or needs safety analysis before editing code. Examples: Is it safe to change X?, What depends on this?, What will break?

### gitnexus-refactoring
**Path:** `skills/.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`
**Description:** Use when the user wants to rename, extract, split, move, or restructure code safely. Examples: Rename this function, Extract this into a module, Refactor this class, Move this to a separate file

### agency-agents
**Path:** `skills/agency-agents/SKILL.md`
**Description:** AI Agent 团队 - 61 个专业 Agent，8 大部门，完整的 AI 代理机构。支持单 Agent 使用和多 Agent 协作编排。

### agents-orchestrator
**Path:** `skills/agency-agents/orchestrator/SKILL.md`
**Description:** AI Agent 编排器 - 自动调度多个 Agent 完成复杂项目的核心引擎

### Agent Browser
**Path:** `skills/agent-browser/SKILL.md`
**Description:** A fast Rust-based headless browser automation CLI with Node.js fallback that enables AI agents to navigate, click, type, and snapshot pages via structured commands.

### agent-factory
**Path:** `skills/agent-factory/SKILL.md`
**Description:** Ajan oluşturma ve ajanlar arası geçiş (v1.0.5 - chromium destekli + tüm yetenekler). Kullanım: - /create_agent İsim - Yeni ajan oluşturur ve

### agent-performance
**Path:** `skills/agent-performance/SKILL.md`
**Description:** Track and analyze agent task performance. Log completions, view dashboards, generate scores, and feed data to the evolution system.

### agent-team-orchestration
**Path:** `skills/agent-team-orchestration/SKILL.md`
**Description:** Orchestrate multi-agent teams with defined roles, task lifecycles, handoff protocols, and review workflows. Use when: (1) Setting up a team of 2+ agents with different specializations, (2) Defining task routing and lifecycle (inbox → spec → build → review → done), (3) Creating handoff protocols between agents, (4) Establishing review and quality gates, (5) Managing async communication and artifact sharing between agents.

### agent-tester
**Path:** `skills/agent-tester/SKILL.md`
**Description:** Test agents against predefined scenarios for helpfulness, persona consistency, safety, edge cases, and tool usage. Evaluates SOUL.md effectiveness.

### ai-daily-digest
**Path:** `skills/ai-daily-digest/SKILL.md`
**Description:** Fetches RSS feeds from 90 top Hacker News blogs (curated by Karpathy), uses AI to score and filter articles, and generates a daily digest in Markdown with Chinese-translated titles, category grouping, trend highlights, and visual statistics (Mermaid charts + tag cloud). Use when user mentions daily digest, RSS digest, blog digest, AI blogs, tech news summary, or asks to run /digest command. Trigger command: /digest.

### AI Researcher
**Path:** `skills/ai-researcher/SKILL.md`
**Description:** Deep research on any topic with structured analysis, source evaluation, and synthesis. Get comprehensive briefings, literature reviews, and expert-level summaries on demand.

### antfly
**Path:** `skills/antfly/SKILL.md`
**Description:** Antfly distributed search — hybrid BM25 + vector + graph search with built-in RAG. Use when: setting up a new search backend, evaluating alternatives to qmd/SQLite, or needing multimodal search (text+images+audio). NOT for: current vault ops (use qmd). Status: evaluated, not yet deployed.

### auto-knowledge
**Path:** `skills/auto-knowledge/SKILL.md`
**Description:** Auto-capture knowledge from session transcripts and sync skill inventory to the Obsidian vault.

### autonomous-pm
**Path:** `skills/autonomous-pm/SKILL.md`
**Description:** 自主项目管理系统 - 去中心化协调多个子代理并行工作，通过 STATE.yaml 文件实现自主决策和协调，无需中央编排器

### claude-usage-check
**Path:** `skills/claude-usage-check/SKILL.md`
**Description:** Check Claude Code/API usage stats, remaining quota, and reset time.

### clawdefender
**Path:** `skills/clawdefender/SKILL.md`
**Description:** Security scanner and input sanitizer for AI agents. Detects prompt injection, command injection, SSRF, credential exfiltration, and path traversal attacks. Use when (1) installing new skills from ClawHub, (2) processing external input like emails, calendar events, Trello cards, or API responses, (3) validating URLs before fetching, (4) running security audits on your workspace. Protects agents from malicious content in untrusted data sources.

### cli-anything
**Path:** `skills/cli-anything/SKILL.md`
**Description:** Use when the user wants OpenClaw to build, refine, test, or validate a CLI-Anything harness for a GUI application or source repository. Adapts the CLI-Anything methodology to OpenClaw without changing the generated Python harness format.

### commit-standards
**Path:** `skills/commit-standards/SKILL.md`
**Description:** Opinionated commit messages, PR bodies, and branch naming for agent-produced code. Triggers on any commit, PR creation, or branch management task.

### config-guardian
**Path:** `skills/config-guardian/SKILL.md`
**Description:** Safe OpenClaw config updates with automatic backup, validation, and rollback. For agent use - prevents invalid config updates.

### context-budgeting
**Path:** `skills/context-budgeting/SKILL.md`
**Description:** Prevent agent degradation during long sessions by partitioning context, checkpointing before compaction, and recovering after. Use when context is growing large (>60% of window), before compaction triggers, or when the agent notices gaps in recall after compaction.

### context-evolution
**Path:** `skills/context-evolution/SKILL.md`
**Description:** Self-evolving agent prompts. Snapshot, reflect on performance, propose mutations to SOUL.md, and rollback if needed.

### cron-mastery
**Path:** `skills/cron-mastery/SKILL.md`
**Description:** Master

### deep-research-pro
**Path:** `skills/deep-research-pro/SKILL.md`
**Description:** Multi-source deep research agent. Searches the web, synthesizes findings, and delivers cited reports. No API keys required.

### devloop-workflow
**Path:** `skills/devloop-agent-pack/SKILL.md`
**Description:** >- Complete multi-agent collaboration workflow for product-driven development loops. Covers the full lifecycle from product discovery through architecture design, parallel coding, testing, to marketing. Includes 6 specialized agents (Product, Core Dev, Dev, Test, Marketing, Research) with defined roles, communication protocols, and shared file conventions. This skill should be used when setting up or understanding the DevLoop agent collaboration system, configuring agent workflows, troubleshooting inter-agent communication, resolving agent responsibility questions, or customizing agent behavior through SOUL.override.md and MEMORY.md.

### devloop-workflow
**Path:** `skills/devloop-agent-pack/skills/devloop-workflow/SKILL.md`
**Description:** >- Complete multi-agent collaboration workflow for product-driven development loops. Covers the full lifecycle from product discovery through architecture design, parallel coding, testing, to marketing. Includes 6 specialized agents (Product, Core Dev, Dev, Test, Marketing, Research) with defined roles, communication protocols, and shared file conventions. This skill should be used when setting up or understanding the DevLoop agent collaboration system, configuring agent workflows, troubleshooting inter-agent communication, resolving agent responsibility questions, or customizing agent behavior through SOUL.override.md and MEMORY.md.

### discord-rich-output
**Path:** `skills/discord-rich-output/SKILL.md`
**Description:** Rich Discord output patterns. Use components v2, polls, buttons, selects, modals, and native features instead of plain markdown walls.

### discord-voice
**Path:** `skills/discord-voice/SKILL.md`
**Description:** Real-time voice conversations in Discord voice channels with Claude AI

### Diverge
**Path:** `skills/diverge/SKILL.md`
**Description:** Spawn multiple perspectives to evaluate a problem before converging on a solution.

### elite-longterm-memory
**Path:** `skills/elite-longterm-memory/SKILL.md`
**Description:** Ultimate AI agent memory system for Cursor, Claude, ChatGPT & Copilot. WAL protocol + vector search + git-notes + cloud backup. Never lose context again. Vibe-coding ready.

### evolution-loop
**Path:** `skills/evolution-loop/SKILL.md`
**Description:** Orchestrates the full agent evolution pipeline. Reads performance, reflects, proposes mutations, auto-applies above threshold, and logs to vault.

### feedback-loop
**Path:** `skills/feedback-loop/SKILL.md`
**Description:** Review evolution proposals, auto-generate improvement suggestions from session data, and check skill usage across agents.

### knowledge-graph
**Path:** `skills/knowledge-graph/SKILL.md`
**Description:** Maintain

### lap
**Path:** `skills/lap/SKILL.md`
**Description:** LAP CLI -- compile, search, and manage API specs for AI agents. Use when working with API specifications (OpenAPI, GraphQL, AsyncAPI, Protobuf, Postman), compiling specs to LAP format, searching the LAP registry, generating skills from API specs, or publishing APIs. Commands: compile, search, get, skill, skill-install, skill-batch, publish, login, logout, whoami.

### last30days
**Path:** `skills/last30days/SKILL.md`
**Description:** Research any topic from the last 30 days on Reddit + X + Web, synthesize findings, and write copy-paste-ready prompts. Use when the user wants recent social/web research on a topic, asks what are people saying about X, or wants to learn current best practices. Requires OPENAI_API_KEY and/or XAI_API_KEY for full Reddit+X access, falls back to web search.

### memory-hygiene
**Path:** `skills/memory-hygiene/SKILL.md`
**Description:** Audit, clean, and optimize

### multi-agent-collaboration
**Path:** `skills/multi-agent-collaboration/SKILL.md`
**Description:** 多智能体协作系统V1.4（最终版），支持**所有行业所有内容**的智能协作： 通用信息守护者(信息采集)、内容趋势优化系统(趋势创作)、状态洞察模块(个人状态)、工作流沉淀系统(报告生成)。 适用于：金融、医疗、教育、零售、科技、制造业、餐饮、服务业等**全行业**。 核心功能：意图识别+智能路由+反思机制+主动感知+用户自适应，支持串行/并行/跳过/精简多种执行模式， 执行前自动检索记忆库，学习用户偏好，动态调整交互方式，预测用户需求。 包含强大的记忆系统V2，支持场景化记忆、分层存储、遗忘机制和智能检索。

### news-summary
**Path:** `skills/news-summary/SKILL.md`
**Description:** This skill should be used when the user asks for news updates, daily briefings, or

### nuke
**Path:** `skills/nuke/SKILL.md`
**Description:** Deletes all messages in the current Discord channel. Use /nuke to wipe the channel clean.

### obsidian-ontology-sync
**Path:** `skills/obsidian-ontology-sync/SKILL.md`
**Description:** Bidirectional sync between Obsidian PKM (human-friendly notes) and structured ontology (machine-queryable graph). Automatically extracts entities and relationships from markdown, maintains ontology graph, and provides feedback to improve note structure. Run sync every few hours via cron.

### openclaw-ops
**Path:** `skills/openclaw-claude-code-skill/SKILL.md`
**Description:** OpenClaw operations — gateway management, agent orchestration, cron jobs, health monitoring.

### openclaw-guardian
**Path:** `skills/openclaw-guardian-ultra/SKILL.md`
**Description:** Deploy and manage a Guardian watchdog process for OpenClaw Gateway. Provides automated health monitoring, self-repair via `doctor --fix`, git-based workspace rollback, daily snapshots, and optional Discord alerting. Use when a user wants to harden their OpenClaw instance against crashes, config corruption, or bad workspace edits — or when setting up Guardian for the first time on a new server/container.

### research
**Path:** `skills/parallel-ai-research/SKILL.md`
**Description:** Conduct open-ended research on a topic, building a living markdown document. Supports interactive and deep research modes.

### pr-review
**Path:** `skills/pr-review/SKILL.md`
**Description:** PR review and local diff review via gh CLI. Analyzes diffs for security issues, error handling gaps, test coverage, breaking changes, and dependency risks. Generates structured markdown reports. Use when reviewing pull requests, doing code review, pre-merge checks, or reviewing local changes before commit.

### project-workflow-scheduler
**Path:** `skills/project-workflow-scheduler/SKILL.md`
**Description:** Break a project, objective, or task list into safe, bounded one-time OpenClaw cron work blocks with dependencies, risk classification, and strong isolated agentTurn payloads. Use when an agent needs to stage multi-step work over time without autonomy theater, especially for overnight blocks, next-day follow-up, recap jobs, checkpoints, low-risk internal analysis, documentation cleanup, audits, asset prep, CRM cleanup, support follow-up, or phased project execution.

### prompt-compiler
**Path:** `skills/prompt-compiler/SKILL.md`
**Description:** Modular context assembly for agent prompts. Define reusable modules with metadata and compile them into SOUL.md augmentations.

### security-audit
**Path:** `skills/security-audit-toolkit/SKILL.md`
**Description:** Audit codebases and infrastructure for security issues. Use when scanning dependencies for vulnerabilities, detecting hardcoded secrets, checking OWASP top 10 issues, verifying SSL/TLS, auditing file permissions, or reviewing code for injection and auth flaws.

### self-improvement
**Path:** `skills/self-improving-agent/SKILL.md`
**Description:** Captures learnings, errors, and corrections to enable continuous improvement. Use when: (1) A command or operation fails unexpectedly, (2) User corrects Claude (No, thats wrong..., Actually...), (3) User requests a capability that doesnt exist, (4) An external API or tool fails, (5) Claude realizes its knowledge is outdated or incorrect, (6) A better approach is discovered for a recurring task. Also review learnings before major tasks.

### skill-self-evolution-enhancer
**Path:** `skills/skill-self-evolution-enhancer/SKILL.md`
**Description:** Enables any skill to gain self-evolution capabilities. Use when: (1) User asks to add self-evolution to a skill, (2) User wants a skill to learn from feedback and errors, (3) Scaling self-improvement to multiple skills with per-skill evolution logic. Outputs domain-specific .learnings/, EVOLUTION.md, and Review-Apply-Report workflow.

### slash-commands
**Path:** `skills/slash-commands/SKILL.md`
**Description:** Reusable cognitive routines. Use when user invokes /audit, /critique, /polish, or /distill. Also auto-triggers: /audit on first heartbeat each day.

### soulcraft
**Path:** `skills/soulcraft/SKILL.md`
**Description:** Create or improve SOUL.md files for OpenClaw agents through guided conversation. Use when designing agent personality, crafting a soul, or saying help me create a soul. Supports self-improvement.

### supermemory
**Path:** `skills/supermemory/SKILL.md`
**Description:** Store and retrieve memories using the SuperMemory API. Add content, search memories, and chat with your knowledge base.

### system_resource_monitor
**Path:** `skills/system-resource-monitor/SKILL.md`
**Description:** A clean, reliable system resource monitor for CPU load, RAM, Swap, and Disk usage. Optimized for OpenClaw.

### TaskQueue — Async Task Queue for AI Agents
**Path:** `skills/task-queue-sr/SKILL.md`
**Description:** Queue async tasks for your agent with retry logic, priority levels, dependency chains, concurrency, per-task timeouts, event hooks, cancel/clear, and run metrics. Production-ready task orchestration for AI agents.

### tesseract-ocr
**Path:** `skills/tesseract-ocr/SKILL.md`
**Description:** Extract text from images using the Tesseract OCR engine directly via command line. Supports multiple languages including Chinese, English, and more. Use this skill when users need to extract text from images, recognize text content in images, or perform OCR tasks without Python dependencies.

### typed-memory
**Path:** `skills/typed-memory/SKILL.md`
**Description:** Typed memory operations using mem.sh. Use when storing facts, events, decisions, or status updates that need to persist across sessions. Four types: fact (upsert by key), event (append-only log), decision (choice log), status (update-in-place).

### video-frames
**Path:** `skills/video-frames/SKILL.md`
**Description:** Extract frames or short clips from videos using ffmpeg.

### video-transcript-downloader
**Path:** `skills/video-transcript-downloader/SKILL.md`
**Description:** Download videos, audio, subtitles, and clean paragraph-style transcripts from YouTube and any other yt-dlp supported site. Use when asked to “download this video”, “save this clip”, “rip audio”, “get subtitles”, “get transcript”, or to troubleshoot yt-dlp/ffmpeg and formats/playlists.

---

*Generated by `~/bin/vector-dispatch.sh`. Refresh with: `vector-dispatch.sh && qmd update && qmd embed`*
