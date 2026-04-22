---
title: "OpenClaw Extensions Deep Dive"
created: 2026-03-14
updated: 2026-03-14
type: research
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: research
tags: [community, extensions, openclaw, research, skills]
summary: "Top 10 ClawHub skills and community projects worth evaluating for the agent system."
---
# OpenClaw Extensions Deep Dive

> Comprehensive research on available extensions, skills, and community projects. Updated 2026-03-14.

---

## Top 10 ClawHub Skills to Consider

| Skill | What | Install |
|---|---|---|
| **[[video-transcript-downloader]]** | Download videos + clean transcripts from YouTube/yt-dlp sites. No API key. | `clawhub install video-transcript-downloader` |
| **[[ai-daily-digest]]** | Auto-fetch 90+ tech RSS feeds, AI-score articles, generate Markdown digest | `clawhub install ai-daily-digest` |
| **telegram-bot** | Build/manage Telegram bots — send messages, webhooks, manage groups | `clawhub install telegram-bot` |
| **crypto-stock-market-data** | Real-time crypto + stock prices, charts, company profiles. Free, no API key | `clawhub install crypto-stock-market-data` |
| **pdf-generator** | Generate PDFs from Markdown/HTML — reports, invoices, docs | `clawhub install pdf-generator` |
| **[[cron-mastery]]** | Master [[OpenClaw]] scheduling — reliable reminders, periodic jobs | `clawhub install cron-mastery` |
| **imagemagick** | Image manipulation — resize, convert, watermark, background removal | `clawhub install imagemagick` |
| **news-summary** | Fetch news from curated RSS, generate summaries + audio briefings | `clawhub install news-summary` |
| **[[tesseract-ocr]]** | Extract text from images via Tesseract. Multi-language, local only | `clawhub install tesseract-ocr` |
| **taskr** | Cloud-based task planning + execution tracking, viewable via web/mobile | `clawhub install taskr` |

**Quick install all:** `clawhub install video-transcript-downloader ai-daily-digest telegram-bot crypto-stock-market-data pdf-generator cron-mastery imagemagick news-summary tesseract-ocr taskr --no-input`

---

## Top 10 External Community Projects

### 1. OpenClaw Foundry — Self-Writing Meta-Extension
- **URL:** https://github.com/lekt9/openclaw-foundry
- Observes workflows, auto-crystallizes repeating patterns into tools after 5+ repetitions with 70%+ success
- Hourly Overseer for auto-crystallize, prune stale patterns, track tool fitness
- Install as plugin with `openclaw.plugin.json`

### 2. MemOS Cloud Plugin — Long-Term Memory
- **URL:** https://github.com/MemTensor/MemOS-Cloud-OpenClaw-Plugin
- Recalls memories before each run, saves after. Cuts token usage significantly
- Multi-agent collaboration via shared `user_id` memory pool
- `openclaw plugins install @memtensor/memos-cloud-openclaw-plugin@latest`
- Requires MemOS Cloud API key

### 3. ClawVault — Structured Markdown Memory
- **URL:** https://github.com/Versatly/clawvault
- Local-first memory: decisions, preferences, lessons as typed Markdown with frontmatter
- 8 memory types, BM25 + vector + neural reranker search
- Obsidian-compatible, no cloud. `npm install clawvault`

### 4. ClawMetry — Agent Observability Dashboard
- **URL:** https://github.com/vivekchand/clawmetry
- Zero-config local dashboard: live flow visualization, token/cost tracking, heatmaps
- `pip install clawmetry && clawmetry` — runs on port 8900

### 5. ObsidianClaw — Chat with OpenClaw from Obsidian
- **URL:** https://github.com/humanitylabs-org/obsidianclaw
- Sidebar panel in Obsidian for agent chat. Streaming, "Ask about this note" command
- Ed25519 device auth, Tailscale VPN support
- Install via Obsidian community plugins

### 6. Composio Plugin — 500+ App Integrations
- **URL:** https://composio.dev/toolkits/composio/framework/openclaw
- Gmail, Slack, GitHub, Notion, Google Workspace, Linear, Jira via MCP
- `openclaw plugins install @composio/openclaw-plugin`
- Cloud dependency on Composio's MCP server

### 7. OpenClaw MCP Server — Gateway-to-MCP Bridge
- **URL:** https://github.com/Helms-AI/openclaw-mcp-server
- Expose [[OpenClaw]] tools as MCP server — callable from Claude Code, Cursor, etc.
- Bidirectional bridge between Claude Code and [[OpenClaw]]

### 8. Awesome OpenClaw — Curated Ecosystem Index
- **URL:** https://github.com/vincentkoc/awesome-openclaw
- Comprehensive index: skills, plugins, memory systems, MCP tools, deployment stacks
- Meta-resource covering full lineage (Moltbot → Clawdbot → [[OpenClaw]])

### 9. Awesome OpenClaw Skills — 5,400+ Filtered & Categorized
- **URL:** https://github.com/VoltAgent/awesome-openclaw-skills
- Pre-sorted categories for easier discovery vs raw ClawHub registry

### 10. Awesome OpenClaw Agents — 103 Production Agent Templates
- **URL:** https://github.com/mergisi/awesome-openclaw-agents
- Ready-to-use SOUL.md configs for productivity, dev, marketing, business agents

### Honorable Mentions
- `sandraschi/openclaw-molt-mcp` — FastMCP 2.14+ bridge with demo webapp
- `13rac1/openclaw-plugin-claude-code` — Run Claude Code in Podman containers from [[OpenClaw]]
- `supermemoryai/openclaw-supermemory` — Alternative long-term memory/recall
- `tugcantopaloglu/openclaw-dashboard` — Monitoring dashboard with TOTP MFA + cost tracking

---

## See Also

- [[OpenClaw Extensions]] — currently installed extensions
- [[OpenClaw Research]] — platform evaluation
- [[OpenClaw Ecosystem]] — community projects catalog

#openclaw #extensions #research #skills #community

## Related

- [[research]]
- Round
- [[3]]
- [[-]]
- [[Deprecation]]
- [[and]]
- [[Session Management Best Practices]]
- Advancement
- Analysis
