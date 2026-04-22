---
title: "EMA Native Ecosystem Migration"
created: 2026-04-04
updated: 2026-04-04
type: architecture
status: active
priority: deadline
deadline: 2026-04-05T19:00:00Z
confidence: 0.88
tags: [ema, openclaw, migration, architecture, deadline, claude-api]
summary: "Migrate entire agent ecosystem (OpenClaw + dispatch + vault + agents) into EMA as the native orchestration layer. Forced by Anthropic OAuth ban deadline Apr 5 noon PT."
related: ["[[Projects/EMA Phase 2 Corrected Roadmap]]", "[[Research/Infrastructure/anthropic-oauth-ban-2026-04]]", "[[Projects/EMA Master Knowledge Base]]"]
---

# EMA Native Ecosystem Migration

> **DEADLINE: April 5, 2026 — 12:00 PM PT (19:00 UTC)**
> Anthropic banning OAuth auth on third-party harnesses. All OpenClaw agents currently on OAuth.
> This is the forcing function — we use it.

---

## The Vision

Right now the stack looks like this:

```
Discord/Telegram
     ↓
OpenClaw Gateway (OAuth → Anthropic)
     ↓
Agent VMs (researcher, main, architect, coder...)
     ↓
Dispatch engine (bash scripts, JSON queue)
     ↓
Vault (flat files, qmd index)
```

Every layer is glued together with shell scripts and env vars. OpenClaw is the hub but it's a third-party harness — and now it's being taxed.

**Target state:**

```
Discord/Telegram
     ↓
EMA Daemon (localhost:4488) — native Elixir orchestration
     ↓
AgentWorker pool (Elixir processes, API key auth)
     ↓
Campaign/Dispatch system (native Elixir, not bash)
     ↓
Wiki Engine (replaces vault flat files)
```

OpenClaw becomes optional — a UI layer on top of EMA, not a dependency.

---

## What Gets Migrated

### Layer 1: Auth (URGENT — before noon Apr 5)

**Problem:** 6 OAuth profiles, all blocked tomorrow.

**Fix:** Add Anthropic API key auth to EMA's Claude adapter.

The OpenClaw Elixir adapter (`Ema.Claude.Adapters.OpenClaw`) already exists with a fallback to `ClaudeCli`. Add `Ema.Claude.Adapters.ApiKey` that hits `api.anthropic.com` directly with `Authorization: x-api-key` — no OAuth, no third-party harness.

**Action:** Get key from console.anthropic.com → add to EMA config → test Bridge call works.

---

### Layer 2: Agent Dispatch (Week 8 target)

**Problem:** `dispatch-engine.sh` is 300+ lines of bash, `~/dispatch/queue/*.json`, cron-triggered. Fragile. 30 failed tasks in history.

**Replace with:** `Ema.Dispatch` — native Elixir GenServer.

```elixir
# What it replaces:
~/dispatch/queue/        → Ema.Dispatch.Queue (ETS + SQLite)
~/dispatch/active/       → Ema.Dispatch.ActiveJobs (GenServer state)
~/dispatch/done/         → Ema.Dispatch.History (SQLite)
dispatch-engine.sh cron  → Ema.Dispatch.Supervisor (auto-restart)
~/bin/subconscious-observer.sh → Ema.Dispatch.PostHook (callback)
```

Each dispatched agent task becomes an Elixir process supervised by `Ema.Dispatch.WorkerSupervisor`. Crash recovery is Elixir supervision trees, not cron + stale-task-cleanup.

---

### Layer 3: Agent Identity (Week 8-9)

**Problem:** OpenClaw "agents" are just config files + SOUL.md in `~/.openclaw/agents/*/workspace/`. MEMORY.md is a 2500-char text file.

**Replace with:** `Ema.Agents` schema — agents stored in SQLite with proper versioned memory blocks.

```
agent_configs table → replaces workspace/*.md config files
agent_memories table → replaces MEMORY.md (structured blocks, versioned)
agent_sessions table → replaces LCM summaries (queryable)
```

The MEMORY.md block structure (`[GUIDANCE]`, `[USER_PREFERENCES]`, etc.) maps directly to typed SQLite columns. Subconscious observer writes to DB instead of editing markdown.

---

### Layer 4: Discord/Telegram Channel (Week 9)

**Problem:** OpenClaw routes Discord messages. If OpenClaw goes away, messages die.

**Replace with:** EMA's own Discord bot (`Ema.Channels.Discord`) — direct API, not routed through OpenClaw.

EMA already has the architecture for channel plugins (from `EMA-VIRTUAL-APP-INTEGRATION-SPEC.md`). Discord and Telegram become EMA channel adapters that post to `Ema.MessageBus`.

The research-feed pipeline (reddit-intel, github-trending, etc.) moves into `Ema.Intel` as scheduled GenServer tasks. No more cron + webhook scripts.

---

### Layer 5: Vault → Wiki (Week 9-10)

Already architected in `Wiki-EMA-Architecture.md`. The migration path:
1. VaultMigrator imports all `.md` files with frontmatter parsing
2. Wikilink resolver builds graph edges
3. qmd semantic search → EMA's `sqlite-vss` vector store
4. `~/bin/antfly-search.sh` → `wiki/search` MCP tool

---

## What OpenClaw Keeps (stays as optional layer)

- **Browser control** — `browser` tool stays in OpenClaw
- **Canvas** — stays in OpenClaw
- **TTS** — stays in OpenClaw
- **Mobile companion app** — stays paired to OpenClaw node

EMA doesn't need to replace these. OpenClaw becomes a thin plugin host for hardware-adjacent tools, not the orchestration hub.

---

## Critical Path for the Deadline

### TODAY (Apr 4) — Auth only

1. **You:** Get real Anthropic API key from console.anthropic.com
2. **Coder:** Add `Ema.Claude.Adapters.ApiKey` — 30 lines of Elixir
3. **Test:** `curl localhost:4488/api/agents/test` returns response via API key
4. **Config:** Set `ANTHROPIC_API_KEY=sk-ant-api03-...` in EMA config
5. **Fallback:** OpenClaw gateway reconfigured to use API key if researchers finish confirming the ban is real

**If ban is confirmed real:** This is the only thing that matters today. Everything else is week 8+.

**If ban turns out false alarm:** The auth fix is still worth doing (less fragile, no OAuth refresh expiry).

### Week 8 — Dispatch layer

Priority order:
1. `Ema.Dispatch.Queue` — replace the bash queue
2. `Ema.Dispatch.WorkerSupervisor` — replace cron + PID tracking
3. Discord outbound from EMA — replace `thread-response-wrapper.sh`
4. Subconscious observer as EMA PostHook

### Week 9 — Agent identity + channels

### Week 10 — Full vault migration

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| OAuth ban is real, no key before noon PT | High | Critical | Get key NOW |
| API key billing shock (currently free via Max sub) | Medium | Medium | API is ~$0.003/1K tokens on Sonnet; agent fleet spends maybe $5-15/day at current volume |
| EMA dispatch not ready, bash queue breaks again | Medium | Medium | Keep bash queue running in parallel until Week 8 confirmed stable |
| Wiki migration loses vault data | Low | High | Keep vault as read-only backup, migrate incrementally |
| OpenClaw OAuth refresh guardian breaks | High | Low | It already expires; researcher task will clarify |

---

## Decision Record

**Decision:** Migrate ecosystem to EMA as primary orchestration layer.
**Driver:** Anthropic OAuth ban forces auth change anyway; use it to accelerate planned migration.
**Alternative rejected:** Stay on OpenClaw + switch to API key only — this is a half-measure that keeps the fragile bash layer.
**Owner:** Trajan
**Deadline:** Auth layer by Apr 5 noon PT. Full migration by Week 10.
