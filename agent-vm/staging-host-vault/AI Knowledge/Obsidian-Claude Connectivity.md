# Obsidian-Claude Connectivity

> How Obsidian and Claude Code connect — integration methods and architecture.
> Created: 2026-03-11 | Last verified: 2026-03-11

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    YOUR SYSTEM                                    │
│                                                                   │
│  ┌──────────────┐    MCP (port 22360)    ┌──────────────────┐    │
│  │  Obsidian     │◄─────────────────────►│  Claude Code CLI  │    │
│  │  Vault        │    WebSocket/SSE       │  (v2.1.74)        │    │
│  │  (twj1/)      │                        │                   │    │
│  │  Claudian ────┼── sidebar chat ───────►│  Plugins:         │    │
│  │  v1.3.68      │                        │  Superpowers 5.0.1│    │
│  │               │    Obsidian CLI        │  Context7          │    │
│  │  kepano       │◄─────────────────────►│  Frontend Dev      │    │
│  │  skills ──────┼── format awareness     │  Frontend Design   │    │
│  │               │                        │                   │    │
│  │  claude-code- │    QMD v2.0.1         │  MCP Servers:      │    │
│  │  mcp v1.1.8   │◄── semantic search ──►│  CodeGraphContext  │    │
│  └──────────────┘                        │  QMD               │    │
│                                           └──────────────────┘    │
│                                                                   │
│  ┌──────────────┐                                                │
│  │ CloudCLI     │ Web UI + phone access (port 3001, 24/7)       │
│  └──────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Integration Strategies

### 1. MCP Bridge (Primary)
**Plugin:** [[obsidian-claude-code-mcp]] v1.1.8
- Vault exposed via WebSocket on port 22360
- Tools: `view`, `create`, `edit`, `insert`, `get_workspace_files`
- Zero config — auto-discovers on install
- **Status:** Installed and working

### 2. Sidebar Embedding
**Plugin:** [[Claudian]] v1.3.68
- Full Claude Code inside Obsidian sidebar
- Context-aware: auto-attaches focused note
- Security modes: YOLO / Safe / Plan
- **Status:** Installed and working

### 3. Vault as Working Directory
- Run Claude Code with vault as `cwd`
- Works with [[obsidian-skills (kepano)]] in `.claude/skills/`
- Best for PKM-first workflows (see [[obsidian-claude-pkm]])
- **Status:** Skills installed (defuddle, json-canvas, obsidian-bases, obsidian-cli, obsidian-markdown)

### 4. QMD Semantic Search
**Tool:** [[QMD]] v2.0.1
- Local hybrid search (BM25 + vector + reranking), 60-95% token reduction
- Vault indexed, MCP configured, cron every 30min
- Pair with [[sync-claude-sessions]] for searchable session history
- **Status:** Installed and working

### 5. Obsidian CLI (v1.12+)
**Built-in:** [[Obsidian CLI]]
- 130+ commands, 54x faster than grep, 70,000x cheaper in tokens
- Requires Obsidian running (IPC-based)
- **Status:** Not yet registered in Obsidian settings

### 6. Knowledge Persistence (Planned)
**Tools:** [[claude-mem]], [[sync-claude-sessions]], [[obsidian-claude-pkm]]
- claude-mem: persistent cross-session memory via daemon
- sync-claude-sessions: export sessions as vault notes
- obsidian-claude-pkm: goal cascading with /daily, /weekly, /monthly commands
- **Status:** Not yet installed — see [[Installation Playbook]]

---

## Data Flow

```
Session Start:
  Claude Code → reads CLAUDE.md (project conventions)
             → QMD searches past sessions (semantic)
             → MCP reads vault notes (structured)
             → loads role/prompt from Agent Context/ (if needed)

During Work:
  Claude Code ←→ MCP bridge ←→ Obsidian vault (read/write notes)
  Claude Code → file system (code changes)
  Claude Code → CodeGraphContext (code analysis)

Session End:
  Claude Code → writes session log to vault
             → claude-mem persists memory (future)
             → sync-claude-sessions exports to vault (future)
```

---

## Skills

### Superpowers (Obra) v5.0.1 — 14 skills

| Skill | Category |
|---|---|
| brainstorming | Process |
| writing-plans | Process |
| executing-plans | Process |
| dispatching-parallel-agents | Process |
| subagent-driven-development | Process |
| test-driven-development | Quality |
| systematic-debugging | Quality |
| verification-before-completion | Quality |
| receiving-code-review | Quality |
| requesting-code-review | Quality |
| using-git-worktrees | Dev Support |
| finishing-a-development-branch | Dev Support |
| writing-skills | Dev Support |

### Other Skill Sources

| Source | Skills | Status |
|---|---|---|
| [[obsidian-skills (kepano)]] | 5 (markdown, bases, canvas, CLI, defuddle) | Installed |
| [[everything-claude-code]] | 65+ skills, 13 agents, 40+ commands | Not installed |
| [[obsidian-claude-pkm]] | 10 commands (daily, weekly, monthly, project, review) | Not installed |
| Frontend Dev (custom) | 8 agents, 10 test categories | Installed |
| Frontend Design | Production-grade UI design | Installed |

---

## Performance

| Method | Speed | Token Cost | Notes |
|---|---|---|---|
| [[Obsidian CLI]] | 54x vs grep | 70,000x cheaper than MCP reads | Requires Obsidian running |
| [[QMD]] hybrid search | Fast | 60-95% reduction | BM25 + vector + reranking |
| MCP bridge (WebSocket) | Moderate | Low | Auto-discovery, no config |
| Filesystem grep/glob | Slowest | Highest | Baseline comparison |

> **Note:** The 54x and 70,000x figures come from Obsidian CLI's own benchmarks comparing IPC-based vault access vs. filesystem traversal. QMD's 60-95% token reduction is measured against sending raw file contents — it sends only relevant chunks.

---

## Setup Checklist

See [[Installation Playbook]] for commands.

**Installed:**
- [x] [[obsidian-skills (kepano)]] in vault `.claude/skills/`
- [x] [[Claudian]] v1.3.68 via BRAT
- [x] [[obsidian-claude-code-mcp]] v1.1.8 community plugin
- [x] [[QMD]] v2.0.1 — `npm install -g @tobilu/qmd`

**Not yet installed:**
- [ ] [[Obsidian CLI]] — register in settings
- [ ] [[claude-mem]] — persistent memory
- [ ] [[sync-claude-sessions]] — session export
- [ ] [[obsidian-claude-pkm]] — goal cascading
- [ ] [[everything-claude-code]] — skills pack
- [ ] [[Claude Task Master]] MCP

---

## Integration Tips

- **Always start Obsidian before Claude Code** — MCP bridge and CLI both require Obsidian running
- **Use QMD for broad searches, MCP for targeted reads** — QMD finds relevant notes, MCP reads/writes specific files
- **kepano skills prevent format corruption** — without them, Claude may generate invalid Obsidian markdown (wrong link syntax, broken tables)
- **Claudian sidebar inherits vault as cwd** — it sees your vault structure, not just the current note
- **MCP bridge exposes the whole vault** — be mindful of sensitive notes; use `.claudeignore` patterns if needed

#obsidian #claude-code #integration #connectivity
