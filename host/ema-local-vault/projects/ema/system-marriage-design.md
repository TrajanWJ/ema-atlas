---
id: "a1f5cf52-5f34-4dbb-996a-6ab84768c25f"
title: "OpenClaw EMA System Marriage Design"
space: projects
tags: ["ema"]
source: manual
---

# OpenClaw + EMA System Marriage (Unified Primary Interface)

**Objective:** Make OpenClaw + EMA work as a single, integrated system where EMA becomes the primary desktop UI and OpenClaw agents are launchable from EMA Dispatch Board.

**Status:** Design (awaiting intelligence spec from Architect + blocker findings from Researcher)

---

## Current State (Separate Systems)

### OpenClaw (Agent VM, CLI-first)
- 29 agents (specialist roles)
- Discord channels for task coordination
- Session-based (ephemeral context)
- File-based memory (vault, MEMORY.md)
- Mainly CLI-driven, browser fallback

### EMA (Tauri Desktop, GUI-first)
- 14 apps (UI for management)
- 31 daemon contexts (business logic)
- Real-time WebSocket channels
- SQLite-backed persistence
- Project/task/proposal/execution tracking

**Current gap:** They're isolated. No cross-system awareness.

---

## Desired State (Married Systems)

### 1. EMA as Control Center

**What it means:**
- EMA Dispatch Board becomes the primary task launcher
- Click a task in EMA → routes to appropriate OpenClaw agent
- Agent result flows back into EMA execution log
- EMA Superman reads OpenClaw context + vault for better decisions

**Deliverables:**
- MCP bridge (EMA ↔ OpenClaw)
- Agent launcher UI (in Dispatch Board)
- Result collector + visualizer

### 2. Shared Context Fabric

**Vault Sync:**
- EMA Superman reads from OpenClaw vault (QMD semantic search)
- Superman context injections leverage full vault knowledge

**Session Capture:**
- Claude Code sessions (OpenClaw) → EMA execution history
- Files touched + tokens used → EMA metrics

**Project Linkage:**
- EMA projects ↔ OpenClaw agent context
- Same project can be worked on by both systems

---

## Architecture (Block Diagram)

```
┌─────────────────────────────────────────────────────────────┐
│                    EMA Desktop (Tauri)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Dispatch Board (Primary Task UI)                   │  │
│  │   ├─ Tasks (OpenClaw + EMA unified)                  │  │
│  │   ├─ Projects (shared context)                       │  │
│  │   ├─ Proposals (AI-generated from both systems)      │  │
│  │   └─ Executions (results from OpenClaw agents)       │  │
│  └──────────────────────────────────────────────────────┘  │
│         ↓ MCP + REST API                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   EMA Daemon (Elixir/Phoenix on localhost:4488)      │  │
│  │   ├─ REST API (/api/projects, /api/tasks, etc.)      │  │
│  │   ├─ MCP Server (EMA Core MCP on 4489)               │  │
│  │   ├─ Superman Engine (context injection)             │  │
│  │   └─ Execution Loop (task → agent → result)          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓ MCP Gateway + Session API
┌─────────────────────────────────────────────────────────────┐
│            OpenClaw Agent VM (localhost:18789)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   OpenClaw Gateway + 29 Agents                       │  │
│  │   ├─ Session storage (JSONL)                         │  │
│  │   ├─ MCP Router (broker EMA ↔ agents)               │  │
│  │   ├─ Vault (QMD semantic search)                     │  │
│  │   └─ Discord channels (coordination)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓ HTTP + WebSocket
┌─────────────────────────────────────────────────────────────┐
│              Slack App (Mirror)                             │
│  Tasks, Projects, Proposals, Executions (real-time)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Points (High-Level)

### 1. Task Dispatch Bridge

**EMA → OpenClaw:**
```
User clicks "Dispatch to Coder" in EMA Dispatch Board
  ↓
EMA.Executions.create({task_id, agent_id: "coder", status: "pending"})
  ↓
Bridge.send_message(agent_id, prompt_with_context)
  ↓
OpenClaw agent spawns, returns result
  ↓
EMA receives result via MCP callback
  ↓
EMA.Executions.update({status: "complete", result: data})
  ↓
Dispatch Board shows "✅ Complete" + result visualization
```

**Contract:** 
- EMA sends: `{task_id, agent_id, prompt, context}`
- Agent returns: `{success, result, files_touched, tokens_used}`
- Async pattern: fire-and-forget + result callback

### 2. Context Injection (Superman)

**Superman.context_for(project_id) returns:**
```elixir
{
  project: Project.get(id),           # EMA project context
  recent_tasks: Tasks.recent(id),     # EMA task history
  recent_proposals: Proposals.recent(id), # EMA proposals
  vault_context: Vault.search(query), # OpenClaw vault (QMD)
  prior_executions: Executions.list(id), # Prior agent work
  similar_projects: Projects.similar(id), # Pattern matching
}
```

**Injected at spawn time into agent system prompt:**
```
[EMA Context]
Project: {{project.name}}
Goal: {{project.goal}}

Recent Tasks:
{{#recent_tasks}}
- {{title}}: {{status}}
{{/recent_tasks}}

Vault References (Semantic Search):
{{#vault_context}}
- {{title}}: {{snippet}}
{{/vault_context}}

Prior Execution Results:
{{#prior_executions}}
- Task {{id}}: {{result}} ({{elapsed}}ms)
{{/prior_executions}}
```

### 3. Vault Sync (Bidirectional)

**OpenClaw → EMA (on schedule, ~30min):**
- Read: `/home/trajan/vault/**/*.md` (QMD updates)
- Parse: frontmatter + content
- Index: Superman.VaultIndex stores entries
- Search: Superman can query semantic vault

**EMA → OpenClaw (on task complete):**
- EMA executions result in discoveries
- Write: `/home/trajan/vault/Sessions/` + structured session note
- Run: `qmd update && qmd embed` (refresh index)

### 4. Session Capture

**Claude Code (OpenClaw) → EMA:**
- Monitor: `~/.claude/projects/**/*.jsonl` (session files)
- Parse: tool_calls, files_touched, tokens, duration
- Capture: EMA.ClaudeSessions table
- Link: to EMA projects by path matching

**Result visualization in EMA:**
```
Execution Log
├─ 2026-04-05 14:23 | Coder: "fix TypeScript errors" | ✅ Complete
│  ├─ Duration: 8m 42s
│  ├─ Tokens: 4,231 / 50,000
│  ├─ Files touched: 5 (app.tsx, types.ts, store.ts, utils.ts, index.ts)
│  └─ Session: claude-haiku (session-id)
└─ 2026-04-05 13:45 | Researcher: "review Superman architecture" | ✅ Complete
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 7, ~30h)
1. **MCP Gateway** — Route EMA ↔ OpenClaw via standard MCP
2. **Task Dispatch API** — `/api/execute?agent_id=X&task=Y` (EMA → OpenClaw)
3. **Result Callback** — MCP callback pattern (OpenClaw → EMA)
4. **Superman Context** — .context_for() returns enriched project data
5. **Vault Indexing** — Superman reads vault, stores semantic index

### Phase 2: Real-time Sync (Week 8, ~20h)
1. **Session Watcher** — Captures Claude Code sessions into EMA
2. **Execution Visualizer** — Shows agent results in real-time
3. **Discord ↔ EMA Bridge** — Sync task updates to Discord channels
4. **Vault Sync Daemon** — Bidirectional vault sync (30min cadence)

### Phase 3: Slack Mirror (Week 9, ~20h)
1. **Slack App** — Bot with `/task`, `/projects`, `/exec` commands
2. **Real-time Channels** — #tasks, #projects, #proposals, #executions
3. **Webhook Sync** — EMA events → Slack (and reverse)
4. **Authentication** — OAuth for Slack app

---

## Key Design Decisions

### 1. MCP vs. Direct HTTP

**Option A: MCP Gateway** (chosen for Week 7)
- Standard MCP for agent communication
- Supports tool_calls, streams, complexity
- Proven pattern (OpenClaw uses MCP internally)

**Option B: Direct REST API**
- Simpler, fewer moving parts
- But: doesn't support streaming, tool calls
- Fallback if MCP causes issues

### 2. Async vs. Sync Dispatch

**Option A: Async (Fire-and-Forget)** (chosen)
- EMA sends task → OpenClaw agent spawns
- EMA doesn't wait for result
- Result comes back via MCP callback
- No blocking, better UX

**Option B: Sync (Request-Response)**
- EMA waits for agent to complete
- Simpler logic but slow UX
- Blocks Dispatch Board

### 3. Vault Indexing Strategy

**Option A: Full semantic search** (Phase 2+)
- Superman has access to full vault via QMD
- Expensive but very smart context

**Option B: Keyword + relevance** (Phase 1)
- Simple file search + relevance ranking
- Fast, covers 80% of cases

**Option C: Skip vault** (not chosen)
- Faster iteration but less intelligent

---

## Success Criteria

### Week 7 (Foundation)
- [ ] EMA can dispatch task to OpenClaw agent
- [ ] Result flows back to EMA execution log
- [ ] Superman can inject OpenClaw vault context
- [ ] Session capture working (Claude Code → EMA)

### Week 8 (Sync)
- [ ] Real-time execution visualization in EMA
- [ ] Vault sync daemon running (30min cadence)
- [ ] Discord task updates in real-time

### Week 9 (Slack)
- [ ] Slack app deployed + functional
- [ ] All 4 channels syncing (#tasks, #projects, #proposals, #executions)
- [ ] Users can manage work from any interface (EMA, Discord, Slack)

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| MCP bridge complexity | High | Use existing EMA MCP pattern, limit to 3 endpoints initially |
| Async dispatch hard to debug | Medium | Comprehensive logging, callback tracking, status visualization |
| Vault sync performance | Medium | Start with keyword search, upgrade to semantic in Phase 2 |
| Slack bot rate limits | Low | Batch updates, respect Discord API limits |
| Session capture fragility | Medium | Monitor watcher with health checks, fallback to manual import |

---

## Interfaces (API Contracts)

### EMA → OpenClaw: Task Dispatch

```json
POST /mcp/execute

{
  "project_id": "uuid",
  "agent_id": "coder",
  "prompt": "fix the TypeScript build errors",
  "context": {
    "project_name": "EMA",
    "task_id": "task-123",
    "files_in_scope": ["app.tsx", "types.ts"],
    "vault_snippets": [
      {"title": "TypeScript Patterns", "content": "..."}
    ]
  }
}

RESPONSE (async callback to EMA):
{
  "execution_id": "exec-456",
  "status": "complete",
  "result": "✅ Fixed 4 TypeScript errors. Files: app.tsx, types.ts",
  "files_touched": ["app.tsx", "types.ts"],
  "tokens_used": 2341,
  "elapsed_ms": 523,
  "callback_url": "http://ema:4488/api/executions/exec-456/complete"
}
```

### Superman Context Format

```elixir
%Superman.Context{
  project: %Project{id: "uuid", name: "EMA", goal: "..."},
  recent_tasks: [%Task{}, ...],
  recent_proposals: [%Proposal{}, ...],
  vault_context: [%VaultEntry{title: "...", snippet: "..."}, ...],
  prior_executions: [%Execution{result: "...", elapsed_ms: 523}, ...],
  similar_projects: [%Project{}, ...],
}
```

---

## Next Steps (After Synthesis)

1. **Architect verifies** — MCP gateway + async dispatch architecture
2. **Coder prototypes** — First version of task dispatch bridge (4-6h)
3. **Researcher documents** — MCP router contract + troubleshooting guide
4. **Testing** — Integration tests (EMA → agent → result)
5. **Deployment** — Gradual rollout (researchers first, then all agents)

---

**Status:** Awaiting blocker findings + intelligence spec  
**Next:** Synthesis session → refine this design based on findings  
**Expected:** Ready for implementation Week 7  

---

*This document is a template. Will be finalized after Architect + Researcher findings arrive.*
