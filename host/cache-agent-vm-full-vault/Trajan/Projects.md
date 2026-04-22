---
title: "Projects"
created: 2026-03-14
updated: 2026-03-19
type: personal
status: active
confidence: 0.80
confidence_updated: 2026-03-18
source: personal
tags: [claude, code, knowledge, mcp, obsidian, openclaw]
summary: "Claude Code has project-specific memory for these paths:"
---
# Trajan's Projects

> Synced from host machine. Updated by Right Hand.
> Source of truth: host vault at `~/Documents/obsidian_first_stuff/twj1/Trajan's Projects/`

## Active Projects (10)

### 🟢 Production / Demo Ready
| Project | Stack | Status | Host Path |
|---|---|---|---|
| **Proslync** | Next.js 16, FastAPI, PostgreSQL, Pinecone | Phase 1 Complete — Showcase Running | `~/Desktop/Coding/Projects/proslync` |
| **DispoHub** | React 19, Vite 7, Express 4, Electron 33 | Production-ready | `~/Desktop/Coding/Projects/dispohub` |
| **XpressDrop** | Next.js 15, Zustand, Zod | Production demo | `~/Desktop/Coding/Projects/xpressdrop` |

### 🟡 In Active Development
| Project | Stack | Status | Host Path |
|---|---|---|---|
| **ExecuDeck** | Next.js 16, React 19, TypeScript, Tailwind 4 | Phase 1 (70%) — exec command env with dual surfaces | `~/Desktop/Coding/Projects/execudeck/` |
| **LetMeScale** | Next.js 15, TypeScript, Tailwind v4, Framer Motion | Cinematic Redesign in progress | `~/Desktop/Coding/Projects/letmescale` |
| **Truks** | Next.js 16, Express, Prisma, PostgreSQL, Expo | Phase 1 active — truck marketplace | `~/Desktop/Coding/Projects/truck stuff/` |
| **Pomodoro (FlexiFocus)** | Preact, Vite, TypeScript, PWA | v2 active — Chrome extension with timer | `~/Desktop/Coding/Projects/pomodoro` |
| **QuickNotes** | Python 3.12, PySide6 (Qt 6) | Phase 1 — Initial Build | `~/Desktop/quicknotes/` |

### 🔵 Infrastructure / Agent
| Project | Stack | Status | Host Path |
|---|---|---|---|
| **JarvisAI** (this VM) | KVM, Ubuntu, [[EMA]], Claude Code | Active — system buildout | `~/Desktop/JarvisAI/` |
| **Wilson Premier Agent** | Python, OpenAI Agents SDK, n8n, PostgreSQL | Phase 0 — Feasibility | `~/Desktop/wilson ai bs/` |

### ⚪ Archive
| Project | Stack | Status |
|---|---|---|
| **Blueprint Media Archive** | TypeScript, Express, Python, Playwright | Prototype |
| **YoutubeAutomations** | Unknown | Early/paused |

## Host Claude Code Sessions (Active)

Claude Code has project-specific memory for these paths:
- `-home-trajan` (global)
- `-home-trajan-Desktop-Coding-Projects-letmescale` (41 memory files!)
- `-home-trajan-Desktop-Coding-Projects-execudeck`
- `-home-trajan-Desktop-Coding-Projects-dispohub`
- `-home-trajan-Desktop-Coding-Projects-xpressdrop`
- `-home-trajan-Desktop-Coding-Projects-web-design-STR-client-sites-wilson-premier`
- `-home-trajan-Desktop-Coding-Projects-truck-stuff-*` (multiple)

## Coding Conventions (from host CLAUDE.md)
- **TypeScript:** strict mode, no `any` (use `unknown`), no `as` without justification, no `!`, no enums (use `as const`), `import type` for types
- **Vault protocol:** Write session logs, update project notes, capture learnings
- **Dev servers:** Each project has a pinned port (e.g., XpressDrop = 3005)

## How to Work on Host Projects
```bash
# Read project state
ssh host-machine "cat ~/Desktop/Coding/Projects/PROJECT/CLAUDE.md"
ssh host-machine "cd ~/Desktop/Coding/Projects/PROJECT && git log --oneline -5"

# Dispatch work
~/bin/host-claude.sh ~/Desktop/Coding/Projects/PROJECT "task description"
```

## Cross-References
- Host vault project notes: `ssh host-machine "cat ~/Documents/obsidian_first_stuff/twj1/Trajan's Projects/PROJECT.md"`
- VM vault business section: [[Business/README]]
- Wilson Premier is both a client ([[Business/Clients/Wilson Premier Properties]]) and a project
