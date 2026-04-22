---
title: Agency Agents
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.8
confidence_updated: 2026-03-18T00:00:00.000Z
source: skill-documentation
tags:
  - agents
  - architecture
  - openclaw
  - prompts
  - research
  - skills
summary: >-
  A collection of 61 specialized AI agent personas organized into 8 departments,
  with an orchestrator for multi-agent workflows. Originally by @msitarze
wiki_id: skills/Agency_Agents
imported_from: vault/Skills/Agency Agents.md
imported_at: '2026-04-04T00:23:57.202Z'
---
# Agency Agents (61 Agent Templates)

**Status:** ✅ Installed via ClawHub
**Location:** `/home/trajan/skills/agency-agents/`

## What It Does
A collection of 61 specialized AI agent personas organized into 8 departments, with an orchestrator for multi-agent workflows. Originally by @msitarzewski, adapted for [[OpenClaw]] by Jerry.

## Departments (8)
| Department | Agents | Focus |
|-----------|--------|-------|
| Engineering | 7 | Frontend, backend, mobile, AI, DevOps, prototyping |
| Design | 7 | UI, UX research, UX architecture, branding, visual |
| Marketing | 8 | Growth, content, Twitter, TikTok, Instagram, Reddit, ASO |
| Product | 3 | Sprint planning, trend research, feedback synthesis |
| Project Management | 5 | Production, coordination, operations, experiments |
| Testing | 7 | QA, performance, API testing, tool evaluation |
| Support | 6 | Customer service, analytics, finance, infra, legal |
| Specialized | 6 | Orchestrator, data analytics, LSP engineering |

## Key Agents
- **orchestrator** — Multi-agent dispatcher, auto-routes complex tasks to appropriate agents
- **senior-developer** — Complex implementation and architecture decisions
- **growth-hacker** — User acquisition and conversion optimization
- **reality-checker** — Final quality gate before release

## Usage Modes
1. **Single agent:** Invoke one agent directly for focused tasks
2. **Orchestrator:** Auto-dispatch across multiple agents for complex projects
3. **Department:** Activate an entire department for collaborative work

## Evaluation
**Usefulness: 6/10** — Good template collection for specialized personas. The orchestrator concept aligns well with our existing AGENTS.md multi-agent setup. However, documentation is entirely in Chinese, which adds friction. Many of the agent personas overlap with what we already have (Coder ≈ senior-developer, Researcher ≈ trend-researcher, etc.).

**Maturity: 5/10** — Comprehensive roster but feels like a template collection rather than deeply engineered agents. The Chinese-only docs suggest a specific community target. No evidence of actual skill execution beyond persona loading.

**Relevance:** Medium. Could cherry-pick specific agent templates (like `image-prompt-engineer` or `performance-benchmarker`) as inspiration for new specialists. The orchestrator pattern is already better implemented in our AGENTS.md.

---
*Evaluated: 2026-03-16*

## Related

- [[Agency Agents]]
- [[agency-agents-adapted-templates]]
- [[wonderland-methodology-human-ai-partnership]]
- [[briefing-2026-03-16]]
- [[loose-ends]]
