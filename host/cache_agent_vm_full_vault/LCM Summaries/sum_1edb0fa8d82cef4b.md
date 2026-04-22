# LCM Summary sum_1edb0fa8d82cef4b

Created: 2026-03-19 21:44:08
Kind: leaf
Depth: 0
Conversation: 617
Tokens: 1215
Descendants: 0
Earliest: 2026-03-19T21:41:56.000Z
Latest: 2026-03-19T21:41:56.000Z

## Content

[2026-03-19 21:41 UTC]
# ClaudeForge — Remote Claude Code via Discord + Web UI

> **One-liner:** A Discord server + web app that turns your machine into a remote Claude Code IDE. Channels are sessions, categories are directories, and a web UI mirrors everything with task management, agent orchestration, and full terminal access.

---

## Table of Contents

1. [Vision](#vision)
2. [Architecture Overview](#architecture-overview)
3. [System Components](#system-components)
4. [Discord Server Structure](#discord-server-structure)
5. [Discord Bot Commands](#discord-bot-commands)
6. [Web UI Spec](#web-ui-spec)
7. [Session Management](#session-management)
8. [Agent Provider System](#agent-provider-system)
9. [Data Model](#data-model)
10. [Real-Time Protocol](#real-time-protocol)
11. [Security](#security)
12. [Tech Stack](#tech-stack)
13. [Reference Projects & What We're Taking](#reference-projects)
14. [Implementation Plan](#implementation-plan)
15. [Design System](#design-system)

---

## Vision

**ClaudeForge** makes your development machine remotely accessible through AI coding agents. From Discord or a web browser, you can:

- **Open any directory** on your machine as a Discord category
- **Spawn Claude Code / Codex sessions** as channels within that category
- **Chat with the agent** — messages route 1:1 to the backend session
- **Run shell commands** in the session's working directory
- **Watch agents work** in real-time with streaming output
- **Resume sessions** from Discord, web, or terminal (tmux attach)
- **Manage tasks** via a Kanban board in the web UI
- **See all agents** — their status, history, and output
- **Monitor system health** — cron jobs, errors, resource usage

Everything is reflected 1:1: Discord ↔ Web UI ↔ Host machine. Open a session in Discord, see it in the web UI. Run a command in the web UI, see it in Discord. Attach to the tmux session from your terminal. Same session, three surfaces.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        HOST MACHINE                          │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Claude Code   │    │ Claude Code   │    │   Codex      │  │
│  │ Session A     │    │ Session B     │    │  Session C   │  │
│  │ (tmux-a)      │    │ (tmux-b)      │    │ (tmux-c)     │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                    │                    │          │
│         └────────────┬───────┘────────────────────┘          │
│                      │                                       │
│              ┌───────▼────────┐                              │
│              │  ClaudeForge   │                              │
│              │    Server      │                              │
│              │                │                              │
│              │  - Session Mgr │                              │
│              │  - Project Mgr │                              │
│              │  - Task Queue  │                              │
│              │  - WebSocket   │                              │
│              │  - REST API    │                              │
│              └──┬─────────┬──┘                              │
│                 │         │                                   │
│         ┌───────▼──┐  ┌──▼────────┐                         │
│         │ Discord  │  │  Web UI   │                         │
│         │   Bot    │  │  Server   │                         │
│         └────┬─────┘  └─────┬────┘                          │
└──────────────│──────────────│────────────────────────────────┘
               │              │
       ┌───────▼──┐    ┌─────▼──────┐
       │ Discord  │    │  Browser   │
       │ Server   │    │  (Web UI)  │
       └──────────┘    └────────────┘
```

**Three access surfaces, one source of truth:**
1. **Discord** — Mobile-first. Chat with agents from your phone.
2. **Web UI** — Desktop-first. Full dashboard with Kanban, agent gallery, system panel.
3. **Terminal** — `tmux attach -t <session>` for raw access.

---

## System Components

### 1. Core Server (`server/`)
The central daemon. Node.js + TypeScript. Manages everything.

| Module | Responsibility | Adapted From |
|--------|---------------|--------------|
| `session-manager.ts` | Create/resume/kill Claude Code sessions. tmux lifecycle. | AgentCord |
| `project-manager.ts` | Map directories to projects. Track project config. | AgentCord |
| `task-manager.ts` | Task queue, Kanban states, priority, assignment. | Gluon |
| `provider-registry.ts` | Claude Code SDK, Codex SDK, future providers. | AgentCord |
| `shell-handler.ts` | Execute commands in session working dirs.
[LCM fallback summary; truncated for context management]
