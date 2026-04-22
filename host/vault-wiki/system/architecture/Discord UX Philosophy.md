---
title: Discord UX Philosophy
created: '2026-03-19'
updated: '2026-03-19'
type: knowledge
status: active
confidence: 0.8
source: 'agent:main'
domain: agent-architecture
summary: >-
  Design philosophy for Discord as an agent command center — ambient awareness,
  progressive disclosure, and calm technology principles
tags:
  - discord
  - ux
  - design
  - philosophy
  - architecture
aliases:
  - discord-ux
  - discord-design
wiki_id: system/architecture/Discord_UX_Philosophy
imported_from: vault/Architecture/Discord UX Philosophy.md
imported_at: '2026-04-04T00:23:56.744Z'
---

# Discord UX Philosophy

> **Design intent:** Discord is not a chat app with bots. It's a **cognitive cockpit** — an ambient awareness surface that reduces Trajan's cognitive load, not adds to it.

## Design Principles

### 1. Calm Technology (Weiser & Brown, 1996)

The best technology moves to the periphery of attention until it demands center stage.

**Applied:** Most channels should be ambient — glanceable, low-noise, rarely demanding attention. Only two channels (#dispatch, #concierge) are interactive. Everything else is a feed you check when curious, not when summoned.

```
Center of attention:  #dispatch, #concierge (you talk here)
Periphery:           #agent-feed, #daily-brief (ambient status)
Archive:             #ops-log, #raw-logs (forensic only)
```

**The test:** If removing a channel wouldn't change any decision Trajan makes this week, it shouldn't exist.

### 2. Progressive Disclosure

Show the minimum viable context first. Details available on demand, never forced.

**Applied:**
- **Summary → Details → Raw.** Agent feed shows "✅ Coder shipped auth fix (3m)". Thread has the full output. Raw logs has every command.
- **Never dump.** A 500-line research report becomes a 3-line summary in #research-feed with a thread for the full thing. If Trajan wants more, he clicks.
- **Status by exception.** Only surface problems. "All systems nominal" is expressed as silence, not a message.

### 3. Information Scent (Pirolli & Card, 1999)

Users follow information trails. Every visible element should signal what's behind it and whether it's worth pursuing.

**Applied:**
- **Emoji as type indicators:** 🟢 success, 🟡 in-progress, 🔴 failure, ⚡ urgent. Scannable without reading text.
- **First line = decision context.** Every message starts with the information needed to decide whether to read more: "🟢 Vault hygiene complete — 3 notes updated, 1 orphan removed" tells you everything. The rest is optional.
- **Thread titles are summaries,** not topics. Not "Research output" but "Claude vs GPT-4.5 for code review: Claude wins on accuracy, GPT on speed"

### 4. Recognition Over Recall (Nielsen)

Don't make the user remember where things are. Make the structure self-documenting.

**Applied:**
- **Category = mental model.** 🛎️ Bridge (I talk here), 🧠 Command (I decide here), 📡 Signals (I observe here), 🤖 Agent Work (agents work here), 🔧 System (machines talk here).
- **Channel names are verbs or feeds,** not nouns. #dispatch (I dispatch), #daily-brief (I get briefed), #agent-feed (I watch agents).
- **Consistent formatting** — identity bar is always the same shape. Once learned, always recognized.

### 5. Desire Paths

Watch where Trajan actually goes. Optimize for actual behavior, not intended behavior.

**Applied:**
- #dispatch gets the most messages → it's pinned, prominent, first in the command category
- #desk is where long-form thinking happens → forum format, persistent threads
- Most channels are never visited → archived without ceremony
- Channels that exist "just in case" get killed

### 6. The Glanceability Hierarchy

At each level of engagement, Trajan gets what he needs:

| Level | Time | Surface | What He Gets |
|---|---|---|---|
| **Glance** | 2 sec | Sidebar | Category names + unread counts. "Nothing red = nothing urgent" |
| **Scan** | 10 sec | #agent-feed | Last 5 task completions. Color-coded status. |
| **Check** | 30 sec | #daily-brief | Full system state. What happened, what's next. |
| **Dig** | 2+ min | Any thread | Full output, raw data, decision context. |

---

## Channel Architecture (Redesigned)

### Category: 🛎️ Bridge (Interactive)
Where Trajan talks. Two channels maximum.

| Channel | Purpose | Noise Level |
|---|---|---|
| #concierge | Real-time conversation. Ask anything. | Low (human-initiated) |
| #dispatch | Issue commands. Structured responses. | Low (human-initiated) |

### Category: 🧠 Command (Decision Support)
Where Trajan decides. Read-only feeds that inform.

| Channel | Purpose | Frequency |
|---|---|---|
| #daily-brief | Morning synthesis + system state | 1x/day |
| #decisions | Logged decisions with rationale | As needed |
| #desk (forum) | Long-form projects, proposals, thinking | As needed |

### Category: 📡 Signals (Awareness)
Ambient feeds. Glance, don't read.

| Channel | Purpose | Format |
|---|---|---|
| #agent-feed | All task status (queued, running, done, failed) | One-liners with emoji |
| #links | Curated external content worth seeing | Title + 1-line take |
| #alerts | Only real problems. Silent when healthy. | ⚠️ or 🔴 prefix |

### Category: 🤖 Agent Work (Output)
Where agent work products land. Check when relevant.

| Channel | Purpose | Agent |
|---|---|---|
| #research-feed | Research summaries (details in threads) | 🔬 |
| #code-output | Code changes, PRs, build results | 💻 |
| #devils-corner | Critiques, red teams, adversarial reviews | 😈 |

### Category: 🔧 System (Forensic)
Never check unless debugging. Exists for audit trails.

| Channel | Purpose |
|---|---|
| #ops-log | System events, cron results |
| #security | Security scan results |
| #heartbeat | Heartbeat confirmations (silent when OK) |

### Removed Channels (Principle: "Would removing this change a decision?")
- #prompt-lab → merged into #desk forum threads
- #vault-feed → vault changes go to #agent-feed
- #ingestor-feed → ingestion results go to #agent-feed
- #raw-logs → kept only for forensic debugging
- #projects → merged into #desk forum

---

## Message Design Patterns

### Pattern 1: Task Lifecycle (in #agent-feed)
```
⏳ P2 → 💻 Coder · fixing auth token refresh
✅ 💻 Coder · auth token refresh · 4m32s
🔴 🔬 Researcher · competitive analysis timed out · retrying
```

### Pattern 2: Summary-First (in #research-feed, #code-output)
```
## Claude vs GPT-4.5 for Code Review
Claude: better accuracy (92% vs 84%), slower (3.2s vs 1.1s avg).
GPT-4.5: better at boilerplate, worse at subtle bugs.
**Recommendation:** Claude for critical PRs, GPT-4.5 for style/lint.
↳ Full analysis in thread
```

### Pattern 3: Alert-Action (in #alerts)
```
🔴 Disk at 89% — automated cleanup freed 3.2GB → now 78%
⚠️ Gateway restarted after 3 failed health checks — monitoring
```

### Pattern 4: Decision Record (in #decisions)
```
📌 Consolidated 27 agents → 14 active + 13 archived
Rationale: 60% were never dispatched. Fewer agents = less confusion in routing.
Reversible: archived configs preserved, can reactivate any time.
```

---

## Anti-Patterns

**❌ Channel as Archive** — Don't keep channels because "we might need it." Archive it. Restore if needed.

**❌ Notification Noise** — No channel should generate >10 messages/day in normal operation. If it does, it's too noisy and needs filtering.

**❌ Bot Spam** — Status messages that say "checking... still checking... done" are waste. One message: the result.

**❌ Duplicate Surfaces** — Same information in two channels = confusion about which is authoritative. One source of truth per fact.

**❌ Channel Names Without Verbs** — #research doesn't tell you what to do. #research-feed tells you: read it, it's a feed.

---

## Related

- [[Discord Server Architecture v5]]
- [[Agent Architecture Overview]]
- [[Aspirational Agent System]]
- [[AGENTS.md]]
