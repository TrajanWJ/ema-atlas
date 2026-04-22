---
type: knowledge
status: active
tags:
  - agent-os
  - agents
  - roster
  - organization
created: '2026-03-20'
wiki_id: system/architecture/Agent-OS-Agent-Roster
imported_from: vault/Architecture/Agent-OS-Agent-Roster.md
imported_at: '2026-04-04T00:23:56.732Z'
summary: ''
---

# Agent OS Agent Roster

Complete roster of all 38 agents organized by department. Right Hand routes tasks using LLM-based classification with keyword hints from the routing map.

## Core Agents (5 Persistent)

These run as Claude Code background processes via `sessions_spawn`. They are the backbone — dynamic agents are specialists built on top.

| ID | Name | Tier | Capabilities | Best For |
|---|---|---|---|---|
| `main` | 🤝 Right Hand | — | Guild-wide default, orchestration, human interface | Everything first-pass. Routes to specialists. |
| `researcher` | 🔬 Researcher | STANDARD | web_search, web_fetch, vault search, source evaluation | Research, evaluations, competitive intel |
| `coder` | 💻 Coder | STANDARD | file read/write/edit, exec, git, testing | Building features, scripts, integration, bug fixes |
| `ops` | ⚙️ Ops | LIGHT | exec, systemctl, ssh, cron, monitoring | System health, services, cron, performance |
| `utility` | 🔧 Utility | LIGHT | file ops, vault, web_fetch, scraping | Vault cleanup, security scans, knowledge org |
| `devils-advocate` | 😈 Devil's Advocate | HEAVY | reasoning, critique, read-only | Adversarial review, critique, pre-mortem |

### Tool Access Matrix

| Agent | Write Access | Denied |
|---|---|---|
| Right Hand | Governance files (SOUL.md, AGENTS.md, Preferences.md) | — |
| Coder | Anywhere (primary implementer) | web_search, vault write, system services |
| Ops | System configs, scripts, services | vault write, web_search |
| Researcher | `scratch/`, `vault/` only (READ-ONLY default) | file write, exec, system changes |
| Utility | `vault/`, `scratch/`, `memory/` only | exec (dangerous), system services |
| Devil's Advocate | Nothing (READ-ONLY always) | all writes, exec, web |

---

## Dynamic Agents by Department (33 Specialists)

### 📝 Writing & Documentation (4 agents)

| ID | Name | Role | Replaces |
|---|---|---|---|
| `writer` | ✍️ Writer | General documentation, changelogs, READMEs, write-ups | utility |
| `vault-curator` | 📚 Vault Curator | Obsidian vault organization, deduplication, backlinks | utility |
| `copywriter` | 📢 Copywriter | Marketing copy, headlines, CTAs, landing page text | writer |
| `devrel` | 👋 DevRel | Community, developer experience, tutorials, onboarding | writer |

### 🎨 Design & Product (4 agents)

| ID | Name | Role | Replaces |
|---|---|---|---|
| `ui-designer` | 🎨 UI Designer | UI layout, components, responsive design, accessibility | coder |
| `design-philosopher` | 🧘 Design Philosopher | Design system principles, UX rationale | devils-advocate |
| `product-strategist` | 📊 Product Strategist | Feature priority, MVP, roadmap, user stories | researcher |
| `architect` | 🏗️ Architect | System design, architecture, trade-offs, diagrams | coder |

### 🤖 AI & Agents (3 agents)

| ID | Name | Role | Replaces |
|---|---|---|---|
| `prompt-engineer` | 🎯 Prompt Engineer | System prompts, instruction tuning, few-shot templates | researcher |
| `harness-expert` | 🔌 Harness Expert | Agent frameworks (LangGraph, CrewAI, MCP), SDK integration | researcher |
| `eval-specialist` | 📏 Eval Specialist | Benchmarks, scoring, A/B testing agents, quality metrics | analyst |

### 💻 Development (7 agents)

| ID | Name | Role | Replaces |
|---|---|---|---|
| `frontend-dev` | 🖥️ Frontend Dev | React, CSS, HTML, Tailwind, browser rendering | coder |
| `backend-dev` | ⚡ Backend Dev | API endpoints, database, migrations, REST/GraphQL | coder |
| `script-smith` | 🔨 Script Smith | Bash, shell, awk, sed, pipelines, cron jobs | coder |
| `debugger` | 🐛 Debugger | Bug investigation, stack traces, bisecting, crash analysis | coder |
| `git-specialist` | 🌿 Git Specialist | Rebase, merge conflicts, cherry-pick, branch strategy | coder |
| `performance-tuner` | ⚡ Performance Tuner | Profiling, benchmarks, latency, throughput optimization | coder |
| `qa-lead` | ✅ QA Lead | Test strategy, edge cases, regression, release checklists | coder |

### 🔍 Review & Quality (2 agents)

| ID | Name | Role | Replaces |
|---|---|---|---|
| `tech-lead` | 👨‍💻 Tech Lead | Code review, PR review, coding standards | devils-advocate |
| `fact-checker` | ✔️ Fact Checker | Source verification, claim checking, citation validation | researcher |

### 🛡️ Infrastructure & Security (4 agents)

| ID | Name | Role | Replaces |
|---|---|---|---|
| `security` | 🔒 Security | CVE audits, vulnerability scanning, hardening | ops |
| `sysadmin` | 🖥️ Sysadmin | Linux, systemd, packages, logs, user management | ops |
| `network-engineer` | 🌐 Network Engineer | DNS, firewall, iptables, routing, proxy | ops |
| `docker-specialist` | 🐳 Docker Specialist | Containers, Dockerfile, compose, image management | ops |
| `ciso` | 🛡️ CISO | Threat models, security policy, compliance, risk assessment | security |

### 📊 Data & Integration (3 agents)

| ID | Name | Role | Replaces |
|---|---|---|---|
| `analyst` | 📈 Analyst | Data analysis, metrics, trends, dashboards, statistics | utility |
| `integrator` | 🔗 Integrator | API integration, webhooks, service bridges, OAuth | coder |
| `cfo` | 💰 CFO | ROI analysis, cost modeling, pricing, unit economics | analyst |

### 🏢 Corporate & Strategy (7 agents)

| ID | Name | Role | Replaces |
|---|---|---|---|
| `cto` | 🧠 CTO | Tech strategy, build vs buy, tech debt, engineering roadmap | architect |
| `cpo` | 🎯 CPO | Product strategy, prioritization, product vision | product-strategist |
| `project-manager` | 📋 Project Manager | Project plans, timelines, milestones, status tracking | utility |
| `scrum-master` | 🏃 Scrum Master | Sprint planning, standups, retros, velocity, kanban | project-manager |
| `hr-specialist` | 👥 HR Specialist | Team dynamics, hiring, culture, growth plans | — |
| `growth-hacker` | 🚀 Growth Hacker | Funnel optimization, acquisition, experiments | researcher |
| `biz-dev` | 🤝 Biz Dev | Partnerships, market analysis, competitive landscape | researcher |
| `legal-advisor` | ⚖️ Legal Advisor | Licensing, ToS, GDPR, compliance, IP | researcher |
| `engineering-manager` | 👔 Engineering Manager | Team velocity, hiring bar, tech decisions | cto |
| `brand-strategist` | 🎭 Brand Strategist | Brand voice, consistency, tone guides, visual identity | writer |

---

## Pre-Built Team Compositions

For complex multi-domain tasks, Right Hand spawns entire teams in parallel:

| Team | Agents | Use Case |
|---|---|---|
| 🔍 Deep Review | architect + security + qa-lead + devils-advocate | Codebase review, architecture eval, pre-launch audit |
| 📋 Product Planning | product-strategist + architect + cto + cfo | Feature planning, build vs buy, roadmap reviews |
| 🚀 Launch Readiness | qa-lead + security + devrel + copywriter + legal-advisor | Pre-launch checklist, docs, security sign-off |
| 🔬 Research Deep Dive | researcher + fact-checker + analyst | Competitive analysis, tech evaluation, market research |
| 💻 Full Stack Build | architect → frontend-dev + backend-dev → qa-lead → tech-lead | Complete feature build (sequential pipeline) |
| 🛡️ Security Audit | security + ciso + network-engineer | Full security assessment |

---

## Routing Rules

1. **Complexity Gate:** Trivial/simple → Right Hand handles directly. Moderate+ → spawn specialist.
2. **Dynamic agents preferred:** When a dynamic agent's domain matches, route to it over core specialists.
3. **Keyword matching:** The routing map maps keywords to specific agents (e.g., "bash script" → script-smith, not coder).
4. **Model tiers:** LIGHT for simple lookups, STANDARD for real work, HEAVY for adversarial review and deep analysis.
5. **Max concurrency:** 10 parallel agents (VM constraint). Batch larger workloads.

## Agent Lifecycle

1. **Created** — agent-factory.sh creates card with domain, personality, tool access
2. **Probationary** — First 5 tasks tracked closely
3. **Established** — 5+ tasks with >70% success rate
4. **Retired** — Consistently underperforming or domain no longer needed

## Related Notes

- [[Agent-OS-Overview]] — System architecture and pages
- [[Agent-OS-Bridge-API]] — Complete API endpoint reference
