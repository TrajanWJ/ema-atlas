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
| `shell-handler.ts` | Execute commands in session working dirs. | AgentCord |
| `websocket-server.ts` | Real-time events to web UI + internal components. | Gluon |
| `rest-api.ts` | HTTP endpoints for web UI data fetching. | Gluon |
| `discord-sync.ts` | Mirror state changes to/from Discord. | New |
| `persistence.ts` | SQLite for sessions, tasks, events. JSON for config. | New |

### 2. Discord Bot (`bot/`)
discord.js v14. Slash commands. Category/channel CRUD. Message routing.

| Module | Responsibility | Adapted From |
|--------|---------------|--------------|
| `bot.ts` | Discord client setup, event handlers. | AgentCord |
| `commands.ts` | Slash command registration. | AgentCord |
| `command-handlers.ts` | Command execution logic. | AgentCord |
| `output-handler.ts` | Stream agent output → Discord embeds. | AgentCord |
| `button-handler.ts` | Interactive buttons (approve, cancel, expand). | AgentCord |
| `message-handler.ts` | Route channel messages → session input. | AgentCord |

### 3. Web UI (`web/`)
Next.js 15 + React. Discord-inspired dark theme. Multiple pages.

| Page | Purpose | Inspired By |
|------|---------|-------------|
| Sessions (Home) | Discord-like channel tree + chat view | Discord + AgentCord |
| Tasks | Kanban board + task creation | Gluon |
| Agents | Agent gallery — status, history, dispatch | Vault UX Spec |
| System | Health monitoring — processes, resources, errors | Vault UX Spec |

---

## Discord Server Structure

```
📂 CLAUDEFORGE
│
├── 📁 COMMAND CENTER
│   ├── #dashboard          ← Status embeds, session list, health
│   └── #tasks              ← Task board, dispatch, queue management
│
├── 📁 ~/Desktop/Coding/project-a     ← Category = absolute path
│   ├── #main                          ← Default session
│   ├── #fix-auth-bug                  ← Named session
│   └── #project-logs                  ← Auto-generated logs channel
│
├── 📁 ~/Desktop/Coding/project-b
│   ├── #main
│   └── #add-dark-mode
│
├── 📁 ~/Documents/vault
│   └── #reorganize
│
├── 📁 /etc/nginx
│   └── #config-audit
│
└── 📁 ARCHIVE (collapsed)            ← Closed locations move here
    └── ...
```

**Naming rules:**
- Category names are the absolute path, truncated to Discord's 100-char limit (tail segments kept)
- Channel names are session names, kebab-cased
- Each category gets a `#project-logs` channel for non-interactive output (build logs, test results)

---

## Discord Bot Commands

### Location Management

| Command | Description |
|---------|-------------|
| `/open <path>` | Open a directory. Creates category + `#main` channel + starts Claude Code session. Tab-completes recent paths. |
| `/open <path> --session <name>` | Open with a named session instead of `#main`. |
| `/close` | Close current location. Archives category. Kills all sessions in it. |
| `/locations` | List all open locations with session counts. |
| `/navigate <path>` | Quick-switch: if location exists, show it. If not, create it. |

### Session Management

| Command | Description |
|---------|-------------|
| `/session new <name> [--provider claude\|codex]` | New session in current location. Creates channel. |
| `/session list` | List sessions in current location. |
| `/session end` | End session in current channel. |
| `/session resume` | Resume a stopped session. |
| `/session attach` | Show tmux attach command for terminal access. |
| `/session info` | Show session details: provider, model, uptime, tokens, cost. |

### Agent Interaction

| Command | Description |
|---------|-------------|
| (any message in session channel) | Routes directly to the Claude Code session as user input. |
| `/stop` | Abort current generation. |
| `/continue` | Send empty prompt to continue. |
| `/model <model-id>` | Change model for this session (e.g., `claude-sonnet-4-5-20250514`). |
| `/mode <auto\|plan\|normal>` | Set permission mode. Plan = agent plans before acting. |

### Shell Access

| Command | Description |
|---------|-------------|
| `/shell <command>` | Run a shell command in the session's working directory. |
| `/shell processes` | List background processes. |
| `/shell kill <pid>` | Kill a process. |

### Task Management

| Command | Description |
|---------|-------------|
| `/task new <description> [--agent claude\|codex] [--priority high\|normal\|low]` | Create a task. Optionally assign to a location. |
| `/task list [--status pending\|active\|done]` | List tasks. |
| `/task cancel <id>` | Cancel a task. |

### Agent Personas

| Command | Description |
|---------|-------------|
| `/persona use <name>` | Switch persona (architect, reviewer, debugger, security, performance, devops). |
| `/persona list` | List available personas. |
| `/persona clear` | Reset to default. |

### Project Config

| Command | Description |
|---------|-------------|
| `/config personality <prompt>` | Set system prompt for current location's sessions. |
| `/config mcp-add <name> <command>` | Register MCP server for this location. |
| `/config skill-add <name> <prompt>` | Add reusable prompt template. |
| `/config info` | Show location config. |

---

## Web UI Spec

### Design Philosophy

- **Discord-inspired dark theme** but not a clone — cleaner, with additional pages Discord can't do
- **Left sidebar** always shows the location/session tree (like Discord's channel list)
- **Top nav** switches between pages: Sessions | Tasks | Agents | System
- **Real-time** everything — WebSocket updates, no polling
- **Responsive** — works on mobile but desktop-first

### Color Palette — Obsidian × Discord Dark

Inspired by Obsidian's deep, rich feel combined with Discord's dark UI. The Codex approach from the vault's Dashboard Designs v2 — structured, navigable, but with the warmth and depth of Obsidian's interface.

```
──── BACKGROUNDS ────
Void:              #0F0F14     Page background — the ground everything sits on
Surface:           #1A1A2E     Card/panel backgrounds — one step up from void
Surface Elevated:  #1E1E36     Modals, dropdowns, popups — two steps up
Sidebar:           #13131F     Sidebar background — slightly lighter than void, creates depth
Input:             #111119     Input fields, code blocks — darker than surface

──── BORDERS & LINES ────
Border:            #2E2E4A     All dividers, card edges, input borders
Border Subtle:     #252540     Soft separators, section dividers
Focus Ring:        #7B61FF40   Focus ring (Iris Purple at 25% opacity)

──── ACCENT COLORS ────
Primary:           #7B61FF     Iris Purple — primary brand color, buttons, active states, links
Primary Hover:     #6B51EF     Primary hover state
Primary Muted:     #7B61FF15   Primary at ~8% — hover backgrounds, selection tints
Secondary:         #4F8EF7     Cobalt Blue — secondary interactive, informational
Accent Warm:       #E8A838     Warm Gold — Right Hand's accent, familiar from existing system

──── STATUS COLORS ────
Success:           #4ADE80     Vitality Green — healthy, active, completed
Success Muted:     #4ADE8020   Success backgrounds
Warning:           #FCD34D     Marigold — needs attention, degraded
Warning Muted:     #FCD34D20   Warning backgrounds
Error:             #FB7185     Alert Rose — failed, critical
Error Muted:       #FB718520   Error backgrounds
Info:              #38BDF8     Flow Blue — running, in-progress, informational

──── TYPOGRAPHY ────
Text Primary:      #E8E8F0     Frost — warm-tinted white, not pure white
Text Secondary:    #8892B0     Muted lavender — secondary information
Text Muted:        #4A5568     Ghost text — timestamps, placeholders
Text Inverse:      #0F0F14     Dark text on light backgrounds (rare)

──── AGENT IDENTITY COLORS ────
Claude:            #E8A838     Warm Gold (matches Right Hand)
Codex:             #4ADE80     Vitality Green
Researcher:        #38BDF8     Flow Blue
Devil's Advocate:  #FB7185     Alert Rose
Custom:            #7B61FF     Iris Purple (default for new agents)
```

**Obsidian-specific touches:**
- Background is NOT pure black — the warm undertones of `#0F0F14` give it depth
- Cards use `#1A1A2E` — close to Obsidian's dark theme panel color
- Purple accent (`#7B61FF`) echoes Obsidian's native accent
- Text is warm white (`#E8E8F0`), never `#FFFFFF` — reduces eye strain
- Borders are visible but low-contrast (`#2E2E4A`) — present, not dominating

### Page 1: Sessions (Home)

The primary page. Left sidebar + main chat area. Mirrors Discord 1:1.

```
┌────────────────────────────────────────────────────────────────┐
│ [Sessions] [Tasks] [Agents] [System]           🔔  ⚙️  👤    │
├──────────────┬─────────────────────────────────────────────────┤
│ LOCATIONS    │  ~/Desktop/Coding/myapp > #fix-auth             │
│              │                                                  │
│ ▾ ~/Desktop/ │  ┌─────────────────────────────────────────┐   │
│   Coding/    │  │ 🤖 Claude Code (opus)     ⏱ 12m active │   │
│   myapp      │  │ Session: fix-auth                        │   │
│  ├ #main     │  │ tmux: agentcord-fix-auth                │   │
│  ├ #fix-auth │  └─────────────────────────────────────────┘   │
│  └ #logs     │                                                  │
│              │  ┌─────────────────────────────────────┐        │
│ ▾ ~/Docs/    │  │ 📖 Read src/auth/login.ts           │        │
│   vault      │  │ ┌─────────────────────────────┐     │        │
│  └ #reorg    │  │ │ import { verify } from...   │     │        │
│              │  │ │ ...                         │     │        │
│ ▸ /etc/nginx │  │ └─────────────────────────────┘     │        │
│              │  │                                     │        │
│ ──────────── │  │ ✏️ Edit src/auth/login.ts (L42-58) │        │
│ + Open       │  │ ┌──────────────────────────────┐    │        │
│   Location   │  │ │ - const token = req.header   │    │        │
│              │  │ │ + const token = req.cookies   │    │        │
│ COMMAND      │  │ └──────────────────────────────┘    │        │
│ CENTER       │  │                                     │        │
│ ├ #dashboard │  │ ⚡ bash: npm test                   │        │
│ └ #tasks     │  │ ✅ 42 tests passed                  │        │
│              │  └─────────────────────────────────────┘        │
│              │                                                  │
│              │  ┌──────────────────────────────────────────┐   │
│              │  │ > _                             [Send ↵] │   │
│              │  └──────────────────────────────────────────┘   │
└──────────────┴─────────────────────────────────────────────────┘
```

**Key features:**
- Location tree collapses/expands like Discord's category list
- Active session highlighted with accent color
- Tool calls rendered as styled cards (Read → code block, Edit → diff, Bash → terminal output)
- Session header shows: provider, model, uptime, tmux name
- Messages stream in real-time with typing indicator
- Input bar supports multi-line (Shift+Enter), file upload, slash commands

### Page 2: Tasks (Kanban)

Drag-and-drop task board with columns: Backlog → In Progress → Review → Done.

```
┌────────────────────────────────────────────────────────────────┐
│ [Sessions] [Tasks] [Agents] [System]           🔔  ⚙️  👤    │
├────────────────────────────────────────────────────────────────┤
│ 📋 Tasks                                    [+ New Task]       │
│                                                                 │
│ BACKLOG (3)    │ IN PROGRESS (2) │ REVIEW (1)   │ DONE (5)    │
│                │                  │              │              │
│ ┌────────────┐│ ┌──────────────┐│ ┌──────────┐ │ ┌──────────┐│
│ │ Fix auth   ││ │ 🤖 Dark mode ││ │ Review   │ │ │ ✓ Add    ││
│ │ 🔴 High    ││ │ ████░░ 60%   ││ │ PR #42   │ │ │   tests  ││
│ │ ~/myapp    ││ │ 💻 Claude    ││ │ 😈 Devil ││ │ │   2h ago ││
│ └────────────┘│ │ streaming... ││ └──────────┘ │ └──────────┘│
│ ┌────────────┐│ └──────────────┘│              │              │
│ │ Add i18n   ││ ┌──────────────┐│              │              │
│ │ 🟢 Low     ││ │ 🔬 Research  ││              │              │
│ │ ~/myapp    ││ │ LLM routing  ││              │              │
│ └────────────┘│ │ ████████░ 80%││              │              │
│               │ └──────────────┘│              │              │
└───────────────┴──────────────────┴──────────────┴──────────────┘
```

**Key features:**
- Drag-and-drop between columns
- Task cards show: title, priority color, location, assigned agent, progress bar
- Click card → slide-out detail panel with streaming output, session link, history
- Filter bar: by agent, priority, location
- New task modal: description, agent, priority, location, attach files
- Active tasks show real-time progress from the agent session

### Page 3: Agents

Agent gallery — see all registered agents, their status, and interact directly.

```
┌────────────────────────────────────────────────────────────────┐
│ [Sessions] [Tasks] [Agents] [System]           🔔  ⚙️  👤    │
├────────────────────────────────────────────────────────────────┤
│ 👥 Agents                                                      │
│                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│ │     🤖          │ │     🔬          │ │     😈          │  │
│ │  Claude Code    │ │  Researcher     │ │ Devil's Advocate│  │
│ │                 │ │                 │ │                 │  │
│ │  ● 2 ACTIVE     │ │  ○ IDLE         │ │  ● WORKING     │  │
│ │  Sessions: 4    │ │  Last: 30m ago  │ │  "Reviewing..." │  │
│ │  Today: 12 tasks│ │  Today: 3 tasks │ │  Today: 1 task  │  │
│ │                 │ │                 │ │                 │  │
│ │ [View Sessions] │ │  [Dispatch]     │ │  [View Output]  │  │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐                       │
│ │     💻          │ │     ⚙️          │                       │
│ │   Codex         │ │   Custom Agent  │                       │
│ │                 │ │                 │                       │
│ │  ○ IDLE         │ │  [+ Configure]  │                       │
│ │  Sessions: 0    │ │                 │                       │
│ └─────────────────┘ └─────────────────┘                       │
└────────────────────────────────────────────────────────────────┘
```

**Key features:**
- Agent cards with real-time status indicators
- Click card → agent detail panel: session history, task history, stats
- "Dispatch" button → create task pre-assigned to that agent
- Register custom agents with name, command, args
- Agent performance metrics: tasks completed, avg duration, success rate

### Page 4: System

Ops dashboard — system health at a glance.

```
┌────────────────────────────────────────────────────────────────┐
│ [Sessions] [Tasks] [Agents] [System]           🔔  ⚙️  👤    │
├────────────────────────────────────────────────────────────────┤
│ ⚙️ System                                   [All Green ✓]     │
│                                                                 │
│ ACTIVE SESSIONS          │ RESOURCE USAGE                      │
│ ┌──────────────────────┐ │ CPU  ▓▓▓▓▓▓░░░░ 62%               │
│ │ fix-auth    ● active │ │ RAM  ▓▓▓▓▓▓▓░░░ 71%               │
│ │ dark-mode   ● active │ │ Disk ▓▓▓░░░░░░░ 34%               │
│ │ reorg       ○ idle   │ │                                     │
│ └──────────────────────┘ │ PROCESSES                           │
│                          │ node (ClaudeForge)      124MB       │
│ RECENT ERRORS            │ claude (session-a)       89MB       │
│ ┌──────────────────────┐ │ claude (session-b)       92MB       │
│ │ 🔴 03:01 write fail  │ │ codex (session-c)       156MB      │
│ │ 🟡 02:58 rate limit  │ │                                     │
│ └──────────────────────┘ │                                     │
│                          │ UPTIME: 14d 3h 22m                  │
│ CONFIGURATION            │                                     │
│ [Provider Settings]      │                                     │
│ [Path Allowlist]         │                                     │
│ [User Access]            │                                     │
└──────────────────────────┴─────────────────────────────────────┘
```

**Key features:**
- Real-time resource monitoring (CPU, RAM, disk)
- Active session list with status
- Error stream with severity filtering
- Process list showing all Claude/Codex instances
- Configuration panel for settings
- Uptime counter

---

## Session Management

### Session Lifecycle

```
User types /open ~/project
      │
      ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│ Create tmux │────▶│ Start Claude │────▶│ Create Discord│
│ session     │     │ Code process │     │ category +    │
│             │     │ (Agent SDK)  │     │ channel       │
└─────────────┘     └──────────────┘     └──────────────┘
      │                    │                     │
      ▼                    ▼                     ▼
   Terminal            Session ID            Channel ID
   access              stored               stored
      │                    │                     │
      └────────────┬───────┘─────────────────────┘
                   │
                   ▼
            ┌──────────────┐
            │  Session      │
            │  Registry     │
            │  (SQLite)     │
            └──────────────┘
```

### Session Registry Schema

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,           -- agentcord-{name}
  channel_id TEXT UNIQUE,        -- Discord channel ID
  project_name TEXT,             -- Location/project name
  directory TEXT,                -- Absolute path on host
  provider TEXT DEFAULT 'claude', -- claude | codex
  provider_session_id TEXT,      -- Claude Code session UUID
  tmux_name TEXT,                -- tmux session name
  model TEXT,                    -- Current model override
  mode TEXT DEFAULT 'auto',      -- auto | plan | normal
  agent_persona TEXT,            -- Current persona
  status TEXT DEFAULT 'active',  -- active | idle | stopped
  verbose INTEGER DEFAULT 0,
  created_at INTEGER,
  last_activity INTEGER,
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0.0
);

CREATE TABLE projects (
  name TEXT PRIMARY KEY,
  directory TEXT UNIQUE,
  category_id TEXT,              -- Discord category ID
  log_channel_id TEXT,
  personality TEXT,              -- Custom system prompt
  config JSON                   -- MCP servers, skills, etc.
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'backlog', -- backlog | active | review | done | cancelled
  priority TEXT DEFAULT 'normal', -- low | normal | high | critical
  agent TEXT,                    -- Assigned agent/provider
  session_id TEXT,               -- Linked session (if active)
  project_name TEXT,
  created_at INTEGER,
  started_at INTEGER,
  completed_at INTEGER,
  output TEXT,                   -- Final output/summary
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (project_name) REFERENCES projects(name)
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,                     -- session.created, task.completed, error, etc.
  source TEXT,                   -- Which component emitted
  data JSON,
  timestamp INTEGER
);
```

### Session-to-Channel Binding

Every session has exactly one Discord channel. Every channel has at most one session.

```typescript
// The core routing: Discord message → session input
channelToSession: Map<string, Session>

// When a message arrives in a session channel:
// 1. Look up session by channel ID
// 2. Send message to the Claude Code SDK as user input
// 3. Stream response back to the channel + web UI via WebSocket
```

### tmux Integration

Every session gets a tmux session. This enables:
- **Terminal access:** `tmux attach -t agentcord-fix-auth`
- **Session persistence:** Survives bot restarts
- **Process isolation:** Each agent runs in its own tmux pane
- **Sync:** When user attaches to tmux and runs `claude --resume <id>`, they get the same conversation

---

## Agent Provider System

Pluggable provider architecture (from AgentCord):

```typescript
interface AgentProvider {
  name: string;
  
  // Start a new session
  startSession(options: {
    directory: string;
    systemPrompt?: string;
    model?: string;
    sessionId?: string;      // For resume
    mcpServers?: McpServer[];
  }): AsyncGenerator<ProviderEvent>;
  
  // Send a message to an existing session
  sendMessage(sessionId: string, message: string): AsyncGenerator<ProviderEvent>;
  
  // Stop generation
  abort(sessionId: string): void;
  
  // Kill session
  kill(sessionId: string): void;
}

type ProviderEvent = 
  | { type: 'text'; content: string }
  | { type: 'tool_use'; tool: string; input: any }
  | { type: 'tool_result'; tool: string; output: string }
  | { type: 'image'; mediaType: string; data: string }
  | { type: 'done'; sessionId: string; cost?: number }
  | { type: 'error'; message: string }
  | { type: 'input_request'; question: string; options?: string[] };
```

### Claude Code Provider

Uses `@anthropic-ai/claude-agent-sdk` for structured streaming:
- Real-time text chunks → Discord embeds + WebSocket
- Tool call events → styled cards (Read, Edit, Bash, etc.)
- Interactive prompts → Discord buttons
- Session ID tracking for resume

### Codex Provider

Uses `@openai/codex-sdk`:
- Configurable sandbox mode (read-only | workspace-write | full-access)
- Approval policies
- Network access toggle

### Future Providers

The provider interface makes it easy to add:
- Gemini CLI
- OpenCode
- Custom MCP-based agents

---

## Real-Time Protocol

WebSocket server on `ws://localhost:3001` (configurable).

### Server → Client Events

```typescript
// Agent output streaming
{ type: 'session.output', sessionId: string, data: ProviderEvent }

// Session status changes
{ type: 'session.status', sessionId: string, status: 'active' | 'idle' | 'stopped' }

// Task updates
{ type: 'task.updated', task: Task }

// System events
{ type: 'system.health', data: { cpu: number, memory: number, disk: number } }
{ type: 'system.error', data: { source: string, message: string, severity: string } }

// Discord sync events
{ type: 'discord.channel_created', data: { channelId: string, sessionId: string } }
{ type: 'discord.category_created', data: { categoryId: string, projectName: string } }
```

### Client → Server Commands

```typescript
// Send message to session
{ type: 'session.message', sessionId: string, content: string }

// Session control
{ type: 'session.create', directory: string, name: string, provider: string }
{ type: 'session.stop', sessionId: string }
{ type: 'session.resume', sessionId: string }

// Task management
{ type: 'task.create', data: Partial<Task> }
{ type: 'task.update', taskId: string, data: Partial<Task> }

// Shell commands
{ type: 'shell.run', sessionId: string, command: string }
```

---

## Security

### Access Control

- **Discord:** User allowlist by Discord user ID (same as AgentCord)
- **Web UI:** Bearer token auth or local-only (bind to 127.0.0.1 / Tailscale)
- **Path restrictions:** Configurable allowlist of directories that can be opened

### Session Isolation

- Each session runs in its own tmux session
- Working directory is locked to the opened path
- Claude Code runs with configurable permission mode (auto/plan/normal)

### Network

- Bot uses WebSocket to Discord (outbound only — no public HTTP needed)
- Web UI can be local-only or exposed via reverse proxy / Tailscale
- No cloud dependencies — everything runs on your machine

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Core Server** | Node.js 22 + TypeScript | Native TS execution. Same runtime as Claude Code SDK. |
| **Discord Bot** | discord.js v14 | Mature, well-typed, supports slash commands + components. |
| **Claude SDK** | @anthropic-ai/claude-agent-sdk | Official SDK with streaming support. |
| **Codex SDK** | @openai/codex-sdk | Official SDK. |
| **Database** | SQLite (better-sqlite3) | Zero config. File-based. Fast enough for single-user. |
| **Web Framework** | Next.js 15 (App Router) | React, SSR, API routes, fast dev. Your primary stack. |
| **Styling** | Tailwind CSS v4 | Utility-first. Dark theme. Your preference. |
| **Icons** | Lucide React | 1400+ icons, tree-shakeable, MIT, consistent. |
| **State** | Zustand + React Query | Local UI + server data with caching. |
| **Real-time** | native WebSocket | No socket.io overhead. Simple JSON protocol. |
| **Charts** | Recharts | React-native charts for system metrics. |
| **Drag & Drop** | @dnd-kit/core | Modern, accessible DnD for Kanban. |
| **Animation** | Framer Motion (minimal) | Panel slides and toasts only. |
| **Syntax** | Shiki | Code block syntax highlighting (same as VS Code themes). |
| **Terminal** | tmux | Session persistence + terminal access. |
| **Process Mgmt** | Node child_process | Agent SDK spawning. |
| **Monorepo** | Turborepo | Shared types between server/web/bot. |

---

## Reference Projects & What We're Taking

### AgentCord (primary reference — 80% of Discord bot)

| What | Taking | Adapting |
|------|--------|---------|
| Session manager | ✅ Core logic | Add SQLite persistence, web sync |
| Project manager | ✅ Core logic | Auto-create from path, not manual |
| Provider system | ✅ Architecture | Same interface, keep Claude + Codex |
| Discord streaming | ✅ Output handler | Add parallel WebSocket emission |
| Slash commands | ✅ Command structure | Add `/open`, `/navigate`, `/close` |
| tmux integration | ✅ Lifecycle | Same approach |
| Button handler | ✅ Interactive prompts | Same |
| Shell handler | ✅ Command execution | Same |
| Agent personas | ✅ Persona system | Same |
| Setup wizard | ✅ First-run setup | Adapt for our config |

### Gluon Agent (web UI patterns)

| What | Taking | Adapting |
|------|--------|---------|
| Kanban board | ✅ UI concept | Rebuild in React/Next.js |
| Task queue | ✅ Data model | Simplify (no Docker/worktree) |
| WebSocket API | ✅ Event protocol | Adapt for our schema |
| Multi-agent orchestration | ✅ Concept | Simpler — provider-based, not worker-pool |
| Web dashboard layout | ✅ Layout structure | Discord-inspired redesign |

### Teleforge (session patterns)

| What | Taking | Adapting |
|------|--------|---------|
| MCP bridge | 🔍 Pattern reference | May add MCP tool bridging |
| Session resume via reply | 🔍 UX pattern | Discord threading analog |

### AEMI (routing)

| What | Taking | Adapting |
|------|--------|---------|
| Multi-agent routing | 🔍 Pattern reference | Provider registry concept |

### Claude Obsidian Server (vault)

| What | Taking | Adapting |
|------|--------|---------|
| Thread-based sessions | 🔍 Pattern reference | Category-based instead |

### Vault Knowledge (architecture decisions)

| Document | Key Insight |
|----------|-------------|
| Future Frontend Layer | North star — Discord is Phase 1, native frontend is Phase 2-3 |
| Future Frontend UX Spec | View designs for Bridge, Tasks, Agent Gallery, System Panel |
| Session Architecture Proposal | Tiered sessions, lifecycle management |
| Dashboard Critique | Avoid over-engineering. Ship v1 that works. Data layer matters most. |
| Discord-as-IDE Landscape | We're ahead of the ecosystem. Channel→cwd binding is the key primitive. |

---

## Implementation Plan

### Phase 1: Core Server + Discord Bot (Week 1)

**Goal:** Open directories as Discord categories, chat with Claude Code in channels.

1. Project scaffolding (Turborepo monorepo)
2. Core session manager (adapted from AgentCord)
3. Core project manager with path→category mapping
4. Discord bot with `/open`, `/session new`, message routing
5. Claude Code provider with streaming → Discord embeds
6. SQLite persistence
7. tmux lifecycle

**Deliverable:** Working Discord bot. `/open ~/project` creates category + channel. Messages in channel talk to Claude Code. Streaming output. `/session end` cleans up.

### Phase 2: Full Discord Commands + Shell (Week 2)

1. All slash commands (/close, /navigate, /locations, /shell, /stop, /model, /mode)
2. Codex provider
3. Agent personas
4. Project config (personality, MCP servers, skills)
5. Button handler for interactive prompts
6. Dashboard channel with status embeds

**Deliverable:** Full-featured Discord bot. Multiple providers. Shell access. Config.

### Phase 3: Web UI — Sessions Page (Week 3)

1. Next.js app with Discord-inspired dark theme
2. WebSocket client connecting to core server
3. Sessions page: location tree sidebar + chat view
4. Real-time streaming of agent output
5. Send messages from web UI → session
6. Session creation/management from web UI

**Deliverable:** Web UI that mirrors Discord. Can use both simultaneously.

### Phase 4: Web UI — Tasks, Agents, System (Week 4)

1. Tasks page with Kanban board
2. Agent gallery page
3. System monitoring page
4. Task creation + assignment
5. Drag-and-drop task management
6. Resource monitoring (CPU/RAM/disk)

**Deliverable:** Complete web UI with all four pages.

### Phase 5: Polish + Advanced Features (Week 5+)

1. Mobile responsiveness
2. Notification system
3. Session history / search
4. Cost tracking per session
5. Multi-user support
6. Tailscale / remote access setup
7. Auto-naming sessions via AI

---

## Design System

### Design Philosophy

**Codex approach** (from vault Dashboard Designs v2) — structured, navigable, information-dense, beautiful. The F-pattern scanning principle guides layout: top-left = most important, left = navigation, right = actions. Dark mode is cognitive (reduces fatigue during long sessions), not just aesthetic.

**Key principles:**
1. **Consistency over novelty** — every section has the same visual weight, spacing, and color system. Learn one part, you've learned all of it.
2. **Progressive disclosure** — show summary by default, reveal detail on interaction. Never hide critical status.
3. **Calm urgency** — status communicates through color temperature, not flashing alerts. Green/amber/rose, not ❗🚨⚠️.
4. **Data density toggle** — support Comfortable / Compact / Dense view modes.
5. **Keyboard-first** — every action has a shortcut. `⌘K` command palette. Vim-style `G+A` navigation.

### Icons — Lucide React

**All icons use [Lucide React](https://lucide.dev)** — consistent, 1400+ icons, MIT licensed, tree-shakeable.

```tsx
import { 
  FolderOpen, Terminal, Play, Square, Settings, Bell,
  GitBranch, FileCode, Pencil, Search, CheckCircle,
  XCircle, AlertTriangle, Clock, Cpu, HardDrive,
  Activity, Users, LayoutGrid, List, ChevronRight,
  Plus, Trash2, RotateCcw, ExternalLink, Copy,
  MessageSquare, Zap, Eye, EyeOff, Maximize2,
  Minimize2, ArrowUpDown, Filter, MoreHorizontal,
  Hash, FolderTree, Monitor, Bot, Sparkles
} from 'lucide-react';
```

**Icon usage rules:**
- Size: `16px` inline, `20px` in nav/buttons, `24px` in headers, `32px` in cards
- Color: inherit from text color (never hardcode)
- `strokeWidth={1.5}` default (matches Obsidian's lightweight feel)
- Always pair with text label in navigation — icon-only buttons need tooltips
- Status icons: `<Circle>` filled with status color, `8px` size

**Icon mapping for tool calls:**
| Tool | Lucide Icon | Component |
|------|-------------|-----------|
| Read file | `<FileCode />` | Code block with syntax highlighting |
| Edit file | `<Pencil />` | Diff view with line numbers |
| Bash/Shell | `<Terminal />` | Terminal-style dark bg block |
| Write file | `<FilePlus />` | Code block with "NEW" badge |
| Search | `<Search />` | Collapsible results |
| Done | `<CheckCircle />` | Success banner, green accent |
| Error | `<XCircle />` | Error banner, rose accent |
| Thinking | `<Sparkles />` | Collapsed by default, muted |
| MCP Tool | `<Zap />` | Generic tool call card |

**Navigation icons:**
| Page | Icon |
|------|------|
| Sessions | `<MessageSquare />` |
| Tasks | `<LayoutGrid />` |
| Agents | `<Bot />` |
| System | `<Monitor />` |
| Settings | `<Settings />` |

### Typography

**Primary Typeface:** [Inter](https://rsms.me/inter/) (variable font)
**Monospace:** [JetBrains Mono](https://www.jetbrains.com/lp/mono/) — code, data, paths, timestamps

```
──── SCALE ────
Page Title:    24px / 600 weight / 1.2 line-height    — "Sessions", "Tasks"
Card Header:   16px / 600 weight / 1.3                — Card/panel titles
Body:          14px / 400 weight / 1.5                — All descriptive text
Caption:       12px / 400 weight / 1.4                — Timestamps, helper text
Label:         11px / 500 weight / 1.0 / UPPERCASE / 0.08em tracking  — Column headers
KPI Hero:      36px / 700 weight / 1.0                — Big numbers on stat cards
KPI Label:     12px / 500 weight / UPPERCASE           — Label beneath KPI
Nav Label:     13px / 500 weight                       — Sidebar items
Button:        14px / 500 weight                       — Action buttons
Data/Mono:     13px / 400 weight / JetBrains Mono      — Numbers, IDs, paths, code

──── TAILWIND MAPPING ────
text-xs:       12px     (captions, timestamps)
text-sm:       14px     (body, buttons)
text-base:     16px     (card headers)
text-lg:       18px     (section headers)
text-xl:       24px     (page titles)
text-3xl:      36px     (KPI heroes)
```

**Anti-patterns:**
- Never use `font-bold` (700) for body text — reserve for KPI numbers only
- Never use pure monospace for non-data text
- Never ALL-CAPS except for labels (11px, tracked out)
- Headings are `semibold` (600), not bold — keeps Obsidian's lightweight feel

### Spacing System

```
Base unit:        4px
──── PADDING ────
Compact:          8px  (p-2)     — Dense mode, inline elements
Default:          16px (p-4)     — Cards, sections
Comfortable:      24px (p-6)     — Page-level, modals
Spacious:         32px (p-8)     — Hero sections

──── GAPS ────
Tight:            4px  (gap-1)   — Between related items
Default:          8px  (gap-2)   — Between elements in a group
Relaxed:          12px (gap-3)   — Between cards
Section:          24px (gap-6)   — Between page sections

──── BORDER RADIUS ────
Subtle:           4px  (rounded) — Buttons, badges, inputs
Default:          8px  (rounded-lg)  — Cards, panels
Smooth:           12px (rounded-xl)  — Modals, large containers
Pill:             9999px (rounded-full) — Status dots, pills

──── SIDEBAR ────
Width Expanded:   256px
Width Collapsed:  64px
Transition:       200ms ease-out
```

### Component Patterns (Tailwind)

```tsx
// Card
<div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-lg p-4 
                hover:border-[#7B61FF40] transition-colors">

// Button Primary
<button className="bg-[#7B61FF] hover:bg-[#6B51EF] text-white 
                   rounded px-4 py-2 text-sm font-medium transition-colors">

// Button Ghost
<button className="text-[#8892B0] hover:text-[#E8E8F0] hover:bg-[#7B61FF15] 
                   rounded px-3 py-1.5 text-sm transition-colors">

// Input
<input className="bg-[#111119] border border-[#2E2E4A] rounded px-3 py-2 
                  text-sm text-[#E8E8F0] placeholder-[#4A5568]
                  focus:border-[#7B61FF] focus:ring-1 focus:ring-[#7B61FF40]
                  transition-colors" />

// Badge/Pill
<span className="text-xs px-2 py-0.5 rounded-full bg-[#4ADE8020] text-[#4ADE80]">
  Active
</span>

// Status Dot
<span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />

// Sidebar Item
<button className="flex items-center gap-3 px-3 py-2 rounded-lg w-full
                   text-[#8892B0] hover:text-[#E8E8F0] hover:bg-[#7B61FF15]
                   transition-colors text-sm font-medium">
  <MessageSquare size={20} strokeWidth={1.5} />
  Sessions
</button>

// Sidebar Item Active
<button className="flex items-center gap-3 px-3 py-2 rounded-lg w-full
                   text-[#7B61FF] bg-[#7B61FF15] border-l-2 border-[#7B61FF]
                   text-sm font-medium">
  <MessageSquare size={20} strokeWidth={1.5} />
  Sessions
</button>
```

### Agent Output Cards (Tool Calls)

Each tool call gets a distinct visual treatment with Lucide icons:

```tsx
// Read File Card
<div className="border-l-2 border-[#38BDF8] bg-[#111119] rounded-r-lg p-3">
  <div className="flex items-center gap-2 text-xs text-[#8892B0] mb-2">
    <FileCode size={14} />
    <span className="font-mono">src/auth/login.ts</span>
  </div>
  <pre className="text-sm font-mono text-[#E8E8F0] overflow-x-auto">
    {code}
  </pre>
</div>

// Edit File Card (Diff)
<div className="border-l-2 border-[#FCD34D] bg-[#111119] rounded-r-lg p-3">
  <div className="flex items-center gap-2 text-xs text-[#8892B0] mb-2">
    <Pencil size={14} />
    <span className="font-mono">src/auth/login.ts</span>
    <span className="text-[#4A5568]">L42-58</span>
  </div>
  <div className="text-sm font-mono">
    <div className="text-[#FB7185] bg-[#FB718510]">- const token = req.header</div>
    <div className="text-[#4ADE80] bg-[#4ADE8010]">+ const token = req.cookies</div>
  </div>
</div>

// Bash Command Card
<div className="border-l-2 border-[#4ADE80] bg-[#0A0A10] rounded-r-lg p-3">
  <div className="flex items-center gap-2 text-xs text-[#8892B0] mb-2">
    <Terminal size={14} />
    <span className="font-mono text-[#4ADE80]">$ npm test</span>
  </div>
  <pre className="text-sm font-mono text-[#8892B0]">{output}</pre>
</div>

// Done Banner
<div className="flex items-center gap-2 bg-[#4ADE8015] border border-[#4ADE8030] 
                rounded-lg px-4 py-2 text-sm text-[#4ADE80]">
  <CheckCircle size={16} />
  Task completed successfully
</div>

// Error Banner
<div className="flex items-center gap-2 bg-[#FB718515] border border-[#FB718530] 
                rounded-lg px-4 py-2 text-sm text-[#FB7185]">
  <XCircle size={16} />
  {error.message}
</div>

// Thinking (Collapsed)
<button className="flex items-center gap-2 text-xs text-[#4A5568] 
                   hover:text-[#8892B0] transition-colors">
  <Sparkles size={12} />
  <span className="italic">Thinking... (click to expand)</span>
  <ChevronRight size={12} className="transform transition-transform" />
</button>
```

### Animations & Transitions

Following Codex's principle: **minimal and purposeful**. No springiness, no bounce. Professionalism = predictability.

```css
/* Panel slides */
transition-duration: 250ms;
transition-timing-function: ease-out;

/* Hover states */
transition-duration: 150ms;

/* Status dot pulse (active sessions only) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

/* New item fade-in (activity feed, messages) */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Sidebar collapse */
transition: width 200ms ease-out;

/* Card hover lift */
transition: border-color 150ms ease, box-shadow 150ms ease;
&:hover {
  border-color: rgba(123, 97, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

**No animation on:**
- Data updates (numbers change instantly)
- Status dot color changes (instant swap, pulse restarts)
- Navigation between pages (instant, no page transitions)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Command palette |
| `G then S` | Go to Sessions |
| `G then T` | Go to Tasks |
| `G then A` | Go to Agents |
| `G then M` | Go to System (Monitor) |
| `N` | New session / New task (context-dependent) |
| `Escape` | Close modal / panel |
| `⌘/` / `Ctrl+/` | Show keyboard shortcuts |
| `⌘Enter` | Send message |
| `↑↓` in sidebar | Navigate locations/sessions |
| `Enter` in sidebar | Open selected session |

### Command Palette (⌘K)

```tsx
// Full-screen dimmed overlay → centered search box
<div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-[20vh] z-50">
  <div className="w-[640px] bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl 
                  shadow-2xl overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2E2E4A]">
      <Search size={18} className="text-[#4A5568]" />
      <input className="bg-transparent text-[#E8E8F0] text-base w-full 
                        placeholder-[#4A5568] outline-none"
             placeholder="Search sessions, tasks, agents, commands..." />
    </div>
    {/* Results grouped by type */}
    <div className="max-h-[400px] overflow-y-auto py-2">
      <div className="px-3 py-1 text-xs text-[#4A5568] uppercase tracking-wider">
        Sessions
      </div>
      {/* Result items */}
    </div>
  </div>
</div>
```

### Responsive Breakpoints

```
Mobile:    < 768px    — Single column, bottom nav, slide-out panels
Tablet:    768-1024px — Collapsible sidebar, 2-column where needed
Desktop:   1024-1440px — Full layout, all panels visible
Wide:      > 1440px   — Extra breathing room, wider main content
```

**Mobile adaptations:**
- Sidebar → bottom tab bar (Sessions | Tasks | Agents | System)
- Chat view → full screen, header collapses on scroll
- Kanban → horizontal scroll or stacked columns
- Location tree → slide-out drawer from left
- Command palette → full-screen overlay

---

## File Structure

```
claude-remote-discord/
├── reference/              ← Cloned reference projects
│   ├── agentcord/
│   ├── gluon-agent/
│   ├── teleforge/
│   ├── aemi/
│   └── claude-obsidian-server/
│
├── packages/
│   ├── shared/             ← Shared types + utilities
│   │   ├── types.ts
│   │   ├── events.ts
│   │   └── constants.ts
│   │
│   ├── server/             ← Core server
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── session-manager.ts
│   │   │   ├── project-manager.ts
│   │   │   ├── task-manager.ts
│   │   │   ├── persistence.ts
│   │   │   ├── websocket-server.ts
│   │   │   ├── rest-api.ts
│   │   │   ├── shell-handler.ts
│   │   │   └── providers/
│   │   │       ├── types.ts
│   │   │       ├── claude-provider.ts
│   │   │       ├── codex-provider.ts
│   │   │       └── index.ts
│   │   ├── db/
│   │   │   └── schema.sql
│   │   └── package.json
│   │
│   ├── bot/                ← Discord bot
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── bot.ts
│   │   │   ├── commands.ts
│   │   │   ├── command-handlers.ts
│   │   │   ├── message-handler.ts
│   │   │   ├── output-handler.ts
│   │   │   ├── button-handler.ts
│   │   │   └── discord-sync.ts
│   │   └── package.json
│   │
│   └── web/                ← Next.js web UI
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx              ← Sessions page
│       │   │   ├── tasks/page.tsx
│       │   │   ├── agents/page.tsx
│       │   │   └── system/page.tsx
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── TopNav.tsx
│       │   │   │   └── Layout.tsx
│       │   │   ├── sessions/
│       │   │   │   ├── LocationTree.tsx
│       │   │   │   ├── ChatView.tsx
│       │   │   │   ├── MessageBubble.tsx
│       │   │   │   ├── ToolCallCard.tsx
│       │   │   │   ├── SessionHeader.tsx
│       │   │   │   └── InputBar.tsx
│       │   │   ├── tasks/
│       │   │   │   ├── KanbanBoard.tsx
│       │   │   │   ├── TaskCard.tsx
│       │   │   │   ├── TaskDetail.tsx
│       │   │   │   └── NewTaskModal.tsx
│       │   │   ├── agents/
│       │   │   │   ├── AgentGrid.tsx
│       │   │   │   ├── AgentCard.tsx
│       │   │   │   └── AgentDetail.tsx
│       │   │   └── system/
│       │   │       ├── ResourceMonitor.tsx
│       │   │       ├── ProcessList.tsx
│       │   │       ├── ErrorStream.tsx
│       │   │       └── ConfigPanel.tsx
│       │   ├── hooks/
│       │   │   ├── useWebSocket.ts
│       │   │   ├── useSessions.ts
│       │   │   ├── useTasks.ts
│       │   │   └── useSystem.ts
│       │   ├── stores/
│       │   │   ├── session-store.ts
│       │   │   ├── task-store.ts
│       │   │   └── system-store.ts
│       │   └── lib/
│       │       ├── api.ts
│       │       └── constants.ts
│       ├── tailwind.config.ts
│       └── package.json
│
├── turbo.json
├── package.json
├── SPEC.md                 ← This file
├── CLAUDE.md               ← Agent instructions for building this
└── .env.example
```

---

## Open Questions (To Resolve During Build)

1. **Project name:** ClaudeForge is a working title. Better ideas welcome.
2. **Multi-user:** Single-user first. But design the auth model to support multiple users later.
3. **Remote access:** Local-only or Tailscale/Cloudflare tunnel from day one?
4. **Codex sandbox defaults:** What sandbox mode for Codex sessions? (workspace-write seems right)
5. **Session limits:** Max concurrent sessions? (AgentCord has no limit. Gluon defaults to 8 CPU / 12 GB.)
6. **Web UI hosting:** Same process as the server? Separate? (Same process is simpler for v1.)
7. **Cost tracking:** Per-session token/cost tracking. Pull from Claude Code's native tracking or estimate from streaming?

---

*This spec is the single source of truth. Reference it during implementation. Update it when decisions are made.*
