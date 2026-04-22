---
title: "Host Machine Profile — FerrissesWheel"
created: 2026-03-16
updated: 2026-04-14
type: system
status: active
confidence: 0.90
source: direct-ssh-harvest
---

# Host Machine Profile — FerrissesWheel

> SSH access: `trajan@192.168.122.1` (passwordless, auto-login)
> Last full harvest: 2026-03-24 05:10 UTC | Last verified: 2026-04-14

## Machine Specs
- **Hostname:** FerrissesWheel
- **OS:** Linux (KDE Plasma / Wayland)
- **Node:** v20.20.1 (via nvm), pnpm 10.x
- **Python:** 3.12
- **Disk:** 887GB total, 289GB used (35%) ⚠️ +124GB since March
- **RAM:** ~28GB (18GB allocated to agent-vm)
- **Uptime:** Typically 24h+ (always-on desktop)

---

## AI Coding IDEs Installed (all on the machine)

| Tool | Version | Notes |
|---|---|---|
| **Claude Code** (`claude`) | via npm | Primary, `--dangerously-skip-permissions` (`claude-yolo` alias) |
| **Codex** | 0.101.0 | OpenAI Codex CLI, `codex-yolo` alias |
| **Cursor** | 2.6.19 | `/usr/bin/cursor` |
| **Kiro** | 0.9.40 | AWS-built agentic IDE, just signed up |
| **Qoder** | 0.4.7 | "Agentic coding platform", trialing |
| **Antigravity** | 1.107.0 | `/usr/bin/antigravity` |
| **TRAE** | — | ByteDance IDE, evaluated |

Trajan has been actively evaluating every new AI coding IDE as of March 2026. Chrome history shows he signed up for Kiro, Qoder, Groq, Cerebras, and TRAE recently.

---

## Browser Activity (Chrome, Default Profile)

**Most visited (by count):**
- Kiro IDE portal (5x) — evaluating pricing, signed up
- Qoder (4x) — signed up, checked pricing/checkout 
- Cursor (4x) — active trial evaluation
- GitHub codex issue search (4x) — monitoring OpenAI Codex
- TRAE (3x) — ByteDance AI IDE, evaluated
- Groq Cloud (2x) — signed up
- Cerebras Cloud (2x) — signed up  
- free-llm-api-resources GitHub (3x) — looking for free API endpoints
- awesome-antigravity GitHub (2x)

**Notable searches:**
- "free claude method" — looking for ways to use Claude without hitting limits
- "free agent method" — same intent
- "kiro" — research on new IDE
- "trae" — ByteDance IDE research

**API platforms signed into:** Groq, Cerebras, Kiro, Qoder, Cursor, TRAE, Claude.ai

---

## Obsidian Vault (`~/Documents/obsidian_first_stuff/twj1/`)

### Structure
- **Agent Context/Conventions/** — Coding Standards, Architecture Principles, Git Workflow, Security Standards, Testing Philosophy, Tool Recommendations
- **AI Knowledge/** — Research notes on tools, browser OS, PWA, WebGPU, local-first sync, self-evolving vault patterns
- **Trajan's Projects/** — Active project notes
- **Session Log/** — Claude Code session exports (through 2026-03-24)
- **Learnings & Gotchas/** — Bug/lesson capture
- **Who Is Trajan/** — Identity file (mostly template, unfilled)
- **Goals/** — Template format, not yet populated
- **Preferences & Tendencies/** — Partially filled

### CLAUDE.md (vault root + project roots)
Each project has its own CLAUDE.md. The vault-level CLAUDE.md defines:
- Session start/end protocol (read project note, write session log)
- TypeScript/React/Next.js conventions (strict, no `any`, ≤50 lines/fn)
- Hard limits (fn ≤50 lines, complexity ≤8, files ≤800 lines)
- Testing pyramid (70/20/10 Vitest + RTL)

---

## Claude Code Config (`~/.claude/`)

### MCP Servers
| Server | Purpose |
|---|---|
| **CodeGraphContext** (cgc) | Code graph analysis via FalkorDB — relationships, dead code, complexity |
| **qmd** | Semantic search across vault + sessions (HTTP daemon) |
| **taskmaster-ai** | AI-driven task management |

### Hooks
- **PreToolUse → Dippy** — AST-based bash command approval (safety gate)
- **PostToolUse → prompt-injection-defender** — scans Read/WebFetch/Bash/Grep outputs for injected instructions
- **session-log-reminder** — nudges to write session log at end

### Plugins
- `frontend-dev` — Claude Code plugin for frontend patterns
- Marketplace plugins installed

### Permissions
- `WebFetch(domain:github.com)` always allowed
- Bash: git clone, pnpm build, npm build, some specific tool paths

### Shell Aliases
- `claude-yolo` = `claude --dangerously-skip-permissions`
- `codex-yolo` = `codex --dangerously-skip-permissions` (similar)

---

## Active Projects (Desktop + Coding/)

### `place.org` (PRIMARY active build — most commits as of April 2026)
- **Location:** `~/Desktop/place.org/`
- **Stack:** Next.js 16, TypeScript strict, Tailwind v4, Zustand 5, wa-sqlite (OPFS), react-rnd, Motion v12, GSAP, Biome
- **Concept:** Browser-based desktop OS — portfolio + productivity tools in one
- **Status:** v0.4 — executive-function work-companion (Desk v0 + trackers + command layer). Last commit 2026-04-13.
- **Apps:** Brain Dump, Journal, Focus Timer, Tasks, Dashboard, Habits, Review, Terminal, Calculator, Music Player, Settings (13 app settings pages)
- **Design:** Deep space cockpit, frosted glass, spring physics, Web Audio API clicks

### `wilson premier` (client — live)
- **Location:** `~/Desktop/Coding/Projects/web design STR/client sites/wilson premier/`
- **Stack:** Next.js, TypeScript, Tailwind, Vercel deploy
- **Status:** Production, deployed

### `wilson ai` (client project — AI platform)
- **Location:** `~/Desktop/wilson ai bs/`
- **Status:** Active build — Wilson Premier Agent Platform

### `execudeck`
- **Location:** `~/Desktop/Coding/Projects/execudeck/`
- Phase 1 (70%) — Executive command environment

### `proslync`
- **Location:** `~/Desktop/Coding/Projects/proslync/`
- Phase 1 complete — AI NIL athlete marketplace

### `Truks`
- **Location:** `~/Desktop/Coding/Projects/truck stuff/Truks/`
- Trucking platform (mobile + web)

### `dispohub`
- **Location:** `~/Desktop/Coding/Projects/dispohub/`
- Dispo management tool (production-ready)

### `pomodoro`
- **Location:** `~/Desktop/Coding/Projects/pomodoro/`
- FlexiFocus v2, Preact/Vite PWA

### `quicknotes`
- **Location:** `~/Desktop/quicknotes/`
- Python 3.12, PySide6 desktop app

### `mission-control-claude`
- **Location:** `~/mission-control-claude/`
- Claude Code remote access setup

### `claude-remote-discord`
- **Location:** `~/Desktop/Coding/Projects/claude-remote-discord/`
- Discord → Claude Code bridge

### `agent-os-demo-pages`
- **Location:** `~/Projects/agent-os-demo-pages/`
- Agent OS demo pages

---

## Tools & Environment

- **Terminal:** Ghostty (JetBrains Mono 12, catppuccin-mocha theme)
- **Shell:** bash + atuin (shell history search)
- **Editor standby:** VS Code / Cursor / Kiro
- **Version manager:** nvm (Node), uv (Python)
- **Package manager:** pnpm (primary), npm fallback
- **Git:** conventional commits workflow

### Misc tools
- `bat` — better cat
- `fd` — better find
- `zellij` — terminal multiplexer
- `playwright` — browser automation
- `flask` — Python web server

---

## .env Files Found
- `~/mission-control-claude/.env`
- `~/Desktop/wilson ai bs/.../.env`
- `~/Desktop/JarvisAI/.env`
- `~/Desktop/Coding/Projects/claude-remote-discord/.env`
- `~/Desktop/Coding/Projects/blueprint-media-full-archive/my-project/.env`
- `~/Desktop/Coding/Tools/free-claude-code/.env`

---

## Browser Intelligence Summary

Trajan is actively evaluating **every major AI coding tool** that launched in early 2026:
- Signed up for Kiro (AWS), Qoder (China-based), TRAE (ByteDance), Groq, Cerebras
- Looking for free Claude/agent API methods (hitting cost limits)
- Monitoring Codex (OpenAI) GitHub issues
- Has `awesome-antigravity` repo bookmarked (community Antigravity hacks)

This suggests he's benchmarking tools and looking for cost-effective Claude alternatives for high-volume usage.

---

## Related
- [[Preferences]]
- [[Projects]]
- [[Goals & Aspirations]]
