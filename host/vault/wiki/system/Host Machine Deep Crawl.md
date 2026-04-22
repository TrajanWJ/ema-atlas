---
title: Host Machine Deep Crawl
created: '2026-03-16'
updated: '2026-03-16'
type: knowledge
status: active
confidence: 0.5
confidence_updated: 2026-03-18T00:00:00.000Z
source: agent-research
tags:
  - crawl
  - host
  - system
summary: '```'
wiki_id: system/Host_Machine_Deep_Crawl
imported_from: vault/System/Host Machine Deep Crawl.md
imported_at: '2026-04-04T00:23:57.237Z'
---
# Host Machine Deep Crawl

> Last updated: 2026-03-16
> Source: SSH deep crawl from agent-vm

## Machine

- **OS:** KDE Neon (Ubuntu 24.04 base), Wayland
- **Hostname:** FerrissesWheel
- **Disk:** 887GB total, 147GB used (18%)
- **Uptime:** 2d 16h, load ~2.5
- **User:** trajan (NOPASSWD sudo, auto-login via SDDM)
- **Password:** "Password" (capital P) — for TTY/recovery only

## Development Environment

- **Node.js:** 20.20.0 (NodeSource)
- **pnpm:** 10.29.3 (global)
- **Python:** 3.12.3
- **Git:** 2.43.0
- **Package managers:** pnpm (preferred), npm, pip

## Active Projects (by recency)

| Project | Stack | Last Commit | Status | Dirty Files |
|---|---|---|---|---|
| **LetMeScale** | Next.js 15, Tailwind 4, Framer Motion | Mar 12 | Cinematic redesign phase | 34 |
| **Proslync** | Next.js, TypeScript | Mar 12 | Initial commit + admin scaffold | 28 |
| **XpressDrop** | Next.js 15, React 19, Zustand | Mar 10 | Production demo, server-precomputed | 260 (mostly stale .next) |
| **Pomodoro** | Unknown | Feb 27 | Minimal dirty | 1 |
| **DispoHub** | Unknown | Feb 25 | Minimal dirty | 1 |
| **ExecuDeck** | Next.js 16, TypeScript, Zustand, Zod | Feb 19 | Phase 1 ~70% | 9 |

### Project Descriptions

- **LetMeScale** — Premium content distribution agency landing page. Cinematic redesign in progress. Monorepo: `apps/landing` + `Alternate-reality` (v2 experiment) + `packages/ui`. Deployed on Vercel. Port 3004.
- **Proslync** — Early stage, just initial commit + admin routes scaffolded.
- **XpressDrop** — Next.js storefront for flooring products. External API at chadsflooring.bz with cookie auth rotation. Port 3005.
- **ExecuDeck** — Executive command environment with dual surfaces (terminal + canvas), multi-agent orchestration, generative UI. Phase 0 done, Phase 1 in progress.
- **Truks** — Full-stack React/Next.js 16 + React Native/Expo iOS app with Prisma ORM. Part of "truck stuff" workspace.
- **Blueprint Media** — Full archive project, 154 dirty files, old.

### Inactive/Other
- `free-claude-code` — Claude Code tool, clean, Feb 14
- `web design STR` — Client sites with Frame project management
- `YoutubeAutomations` — No details yet
- `truck stuff` — Contains Truks sub-projects

## Host Obsidian Vault

**Path:** `~/Documents/obsidian_first_stuff/twj1/`

### Structure
```
twj1/
├── Agent Context/          # Claude conventions, standards
├── AI Knowledge/           # Tool research, stack decisions  
├── Contacts & People/      # People notes
├── Daily Notes/            # 2026-03-11, 2026-03-13
├── Goals/                  # Personal goals
├── Learnings & Gotchas/    # Bug postmortems
├── Preferences & Tendencies/
├── Session Log/            # Work session records
├── System Setup/           # Machine/services docs
├── Templates/              # Note templates
├── Trajan's Projects/      # 14 project notes
├── Who Is Trajan/          # Identity context
├── CLAUDE.md               # Global Claude instructions
└── Welcome.md
```

### Key Files
- `CLAUDE.md` — Global Claude Code working memory (session protocol, coding conventions, vault rules)
- `Trajan's Projects/` — 14 project notes (LetMeScale, XpressDrop, ExecuDeck, Proslync, DispoHub, Truks, etc.)
- `AI Knowledge/` — Research notes on Claude ecosystem, self-evolving vaults, security tools
- `System Setup/` — 7 system docs (machine, services, data flow, vault structure)

## Services Running on Host

- **Agent Command Center** — KVM [[VM management]] dashboard
- **Google Chrome** — Active browser session
- **Ghostty** — Terminal emulator
- **Konsole** — 2 terminal sessions
- **Yakuake** — Drop-down terminal
- **KDE Connect** — Device sync
- **Docker containers:**
  - `wilson_n8n` — n8n workflow automation (port 5678)
  - `wilson_backend` — Backend service (UNHEALTHY, port 8000)
  - `wilson_redis` — Redis (port 6379)

## Open Ports (host)

| Port | Service |
|---|---|
| 22 | SSH |
| 53 | DNS (libvirt + systemd-resolved) |
| 631 | CUPS printing |
| 1716 | KDE Connect |
| 5678 | n8n (Docker) |
| 5900 | VNC (localhost only) |
| 6379 | Redis (Docker) |
| 8000 | Wilson backend (Docker) |

## Host Crons

Only one cron entry:
```
*/30 * * * * qmd update --quiet && qmd embed --quiet
```

## Host Claude Code

- Global CLAUDE.md at `~/.claude/CLAUDE.md` with session protocol + coding conventions
- 25+ project-specific Claude contexts in `~/.claude/projects/`
- Projects with custom CLAUDE.md: dispohub, execudeck, letmescale, pomodoro, proslync, xpressdrop, truck stuff, web design STR

## Desktop Items of Interest

- `JarvisAI/` — Original VM setup scripts (vm-create.sh, vm-provision.sh, docker-compose.yml)
- `ai-workflow/` — Configuration, getting-started, MCPs, workflows docs
- `Tech Vault Obsidi2/` — Separate Obsidian vault ("Trajan's Tech Serious Vault")
- `wilson ai bs/` — Wilson AI project
- `DarkDork-Advanced-Google-Dork-Builder/` — Google dorking tool

## ⚠️ Issues Found

1. **wilson_backend is UNHEALTHY** — Docker container up 2 days but health check failing
2. **Redis and n8n exposed on 0.0.0.0** — Should probably be 127.0.0.1 or VM-only
3. **"Who Is Trajan" vault note is mostly empty** — Template placeholders unfilled
4. **Several project CLAUDE.md files are generic** — dispohub, pomodoro, proslync, truck stuff just have vault instructions, no project-specific context

## Integration Points

- **SSH bidirectional** — agent-vm ↔ host fully working
- **QMD** — Running on both host and VM, both on 30min cron
- **Bridge sync** — `~/shared/` folder synced every 60s
- **host-claude** — `~/bin/host-claude.sh` dispatches Claude Code on host
- **host-notify** — Desktop notifications from VM to host

---

Tags: #system #host #crawl

## Related

- [[Host Machine Deep Crawl]]
- [[briefing-2026-03-16]]
- [[harvest-2026-03-16-2200]]
