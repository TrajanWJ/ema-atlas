---
title: OpenClaw Extensions
created: '2026-03-14'
updated: '2026-03-18'
type: knowledge
status: active
confidence: 0.4
confidence_updated: 2026-03-18T00:00:00.000Z
source: auto-capture
tags:
  - openclaw
  - ops
  - prompts
  - research
  - security
  - skills
summary: Audit of 37 installed OpenClaw skills and extensions
wiki_id: reference/OpenClaw_Extensions
imported_from: vault/Reference/OpenClaw Extensions.md
imported_at: '2026-04-04T00:23:56.927Z'
---
# OpenClaw Extensions — Skill Audit

**Last Audited:** 2026-03-16
**Location:** `/home/trajan/skills/`
**Total Skills:** 37
**Tracked:** git (~/skills/.git)

## Skill Categories

### Agent Infrastructure
- **[[agent-browser]]** — Headless browser automation CLI
- **[[agent-factory]]** — Agent creation and templating
- **[[agent-performance]]** — Performance tracking and metrics
- **[[agent-team-orchestration]]** — Multi-agent team coordination
- **[[agent-tester]]** — Agent testing and validation

### Knowledge & Memory
- **[[auto-knowledge]]** — Autonomous knowledge capture (6 scripts)
- **[[elite-longterm-memory]]** — Long-term memory patterns
- **[[memory-hygiene]]** — Memory cleanup and maintenance
- **[[obsidian-ontology-sync]]** — Vault ↔ ontology bidirectional sync
- **[[knowledge-graph]]** — Knowledge graph operations

### Research & Discovery
- **[[ai-daily-digest]]** — RSS feed digest from 90 HN blogs
- **[[ai-researcher]]** — AI-powered research agent
- **[[deep-research-pro]]** — Multi-source research synthesis
- **[[deep-scraper]]** — Deep web scraping
- **[[parallel-ai-research]]** — Parallel research execution
- **news-summary** — News aggregation and summarization

### Development
- **[[openclaw-claude-code-skill]]** — Full [[OpenClaw]] ops (49MB, 369 code files)
- **[[config-guardian]]** — Safe config updates with rollback
- **[[cron-mastery]]** — [[OpenClaw]] timing systems
- **[[openclaw-guardian-ultra]]** — Guardian watchdog deployment

### Security
- **[[clawdefender]]** — Input sanitization and injection detection
- **[[security-audit-toolkit]]** — Codebase and infrastructure auditing

### Discord & Output
- **[[discord-rich-output]]** — Components v2 patterns
- **[[discord-voice]]** — Voice channel conversations (9 code files, 4.8K LOC)

### Prompt Engineering
- **[[context-evolution]]** — Context optimization
- **[[evolution-loop]]** — Self-evolution pipeline
- **feedback-loop** — Feedback collection and processing
- **[[prompt-compiler]]** — Prompt compilation and optimization
- **[[self-improving-agent]]** — Self-improvement patterns
- **[[soulcraft]]** — SOUL.md crafting and optimization

### Utilities
- **[[autonomous-pm]]** — Project management automation
- **[[claude-usage-check]]** — Usage stats checker
- **claude-usage-checker** — (duplicate? check)
- **[[system-resource-monitor]]** — CPU/RAM/disk monitoring
- **[[tesseract-ocr]]** — Image text extraction
- **[[video-frames]]** — Video frame extraction
- **[[video-transcript-downloader]]** — Video/audio/subtitle downloads

### External Integrations
- **[[OpenClaw]]-mcp-plugin** — MCP server integration (27MB)

## Notes
- `claude-usage-check` and `claude-usage-checker` may be duplicates — investigate
- `openclaw-claude-code-skill` and `openclaw-mcp-plugin` are large (49MB + 27MB)
- See [[Skills/README]] for detailed size/LOC breakdown

## Related

- [[Claude Usage Gated Cron]]
- [[Discord Rich Output Patterns]]
- [[OpenClaw Extensions Deep Dive]]
- Cron
- Discord
- [[2026-03-14]]
- [[Serena MCP]]
