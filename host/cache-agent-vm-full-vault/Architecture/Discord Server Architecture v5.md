---
title: "Discord Server Architecture v5"
created: 2026-03-19
updated: 2026-03-19
type: architecture
status: active
confidence: 0.85
source: implemented
tags: [discord, openclaw, agents, wiring, webhooks, dispatch, threads]
summary: "Discord as an agent operating system — v5 implements bidirectional dispatch, named agent webhooks, reaction routing, ambient voice status, links pipeline, and thread lifecycle management."
---

# Discord Server Architecture v5

**Updated:** 2026-03-19  
**Status:** Live — cutting-edge Discord-as-agent-OS implementation  
**Previous:** [[Discord Server Architecture v4]] (mono-agent, write-only feeds)

---

## What Changed in v5

| v4 | v5 |
|---|---|
| Right Hand speaks for all agents | Named webhooks — each agent has a visual identity |
| 9 active channels | 22 focused channels across 6 categories |
| #dispatch is write-only | #dispatch is bidirectional — echoes structured confirmations |
| No reaction routing | Emoji reactions dispatch agents |
| No ambient status | Voice channel shows live system state in sidebar |
| Links go nowhere | #links auto-dispatches to Researcher within 5min |
| Forum threads are passive | Thread lifecycle: spec injection → agent routing → vault export |

---

## Channel Architecture

### 🛎️ BRIDGE — Daily Interface
| Channel | ID | Purpose |
|---|---|---|
| `#concierge` | 1482997518362214422 | Primary Trajan↔agent interface |
| `#📋-dispatch` | 1484014822642286654 | Bidirectional command protocol — posts echo back as structured confirmations |
| `#📢-daily-brief` | 1484015157029109771 | 07:00 UTC digest (single edited message, not flood) |

### 🧠 COMMAND — Decisions & Task Tracking
| Channel | ID | Purpose |
|---|---|---|
| `#🗂️-desk` | 1482996866428964904 | Forum — one thread per task; lifecycle managed automatically |
| `#⚖️-decisions` | 1482939106223853740 | Forum — decision log → vault/Trajan/Decisions.md |
| `#🧠-prompt-lab` | 1484014825670574180 | Forum — SOUL.md edits, agent tuning |

### 📡 SIGNALS — Intel & Knowledge
| Channel | ID | Purpose |
|---|---|---|
| `#🔗-links` | 1482256987700990066 | Drop URLs → auto-analyzed within 5min by Researcher |
| `#📡-ingestor-feed` | 1482295358963974187 | Hourly Reddit/GitHub/HN intel |
| `#📦-vault-feed` | 1483018390015709315 | Vault writes via Vault Keeper webhook |

### 🤖 AGENT WORK — Named Agent Feeds
| Channel | Webhook Identity | Posts Via |
|---|---|---|
| `#🔬-research-feed` | Researcher 🔬 | WEBHOOK_RESEARCHER |
| `#💻-code-output` | Coder 💻 | WEBHOOK_CODER |
| `#😈-devils-corner` | Devil's Advocate 😈 | WEBHOOK_DEVILS |
| `#🤖-agent-feed` | Agent 🤖 | WEBHOOK_AGENT_FEED |

### 🔧 SYSTEM — Health & Ops
| Channel | ID | Purpose |
|---|---|---|
| `#🫀-heartbeat` | 1482256931375546489 | Single pinned embed, edited every 15min |
| `#🚨-alerts` | 1484014832599437372 | Critical only — never mute |
| `#🔒-security` | 1484014833790877716 | Security agent output |
| `#⚙️-ops-log` | 1482256984811114688 | Cron runs, dispatch events |
| `#📜-raw-logs` | 1482547280325120076 | Black box — everything unfiltered |
| `💬-agent-status` (voice) | 1484015032038850640 | **Ambient pulse — sidebar display, no join needed** |

### 🚀 PROJECTS — Active Builds
| Channel | ID |
|---|---|
| `#🚀-projects` | 1482899212889751745 |

---

## The v5 Innovations

### 1. Bidirectional #dispatch Protocol
**How it works:** Post any task to `#dispatch` → `dispatch-echo.sh` (runs every 2min) reads it, uses Claude Haiku to parse intent, creates a structured dispatch task, and **replies to your message** with:
- Task ID (trackable)
- Agent assigned
- Priority level
- Vault output path
- Estimated time

This is the difference between shouting into a void and having a dispatcher confirm receipt. Every command gets an echo. The machine proves it heard you.

**Script:** `~/bin/dispatch-echo.sh`
**Cron:** `*/2 * * * *`

---

### 2. Reaction Routing — Emoji as Intent
React to any message with:

| Emoji | Routes to | Action |
|---|---|---|
| 🔬 | Researcher | Research this content |
| 💻 | Coder | Implement / analyze code |
| 💾 | Vault Keeper | Save to vault |
| 📋 | Concierge | Create #desk task |
| 😈 | Devil's Advocate | Critique / red-team |
| 📊 | Researcher | Analyze / summarize data |

Bot reacts ✅ to confirm routing. Works across: #concierge, #dispatch, #agent-feed, #research-feed, #vault-feed.

**Script:** `~/bin/reaction-router.sh`
**Cron:** `*/5 * * * *`

---

### 3. #links Auto-Pipeline
Drop any URL in `#links`:
1. Bot reacts ⏳ immediately (confirms receipt)
2. Researcher agent analyzes within ~5min
3. Results appear in `#research-feed` with: summary, key insights, vault relevance score, suggested vault path, action items

Makes `#links` feel like dropping something on an assistant's desk rather than a filing cabinet.

**Script:** `~/bin/links-pipeline.sh`
**Cron:** `*/5 * * * *`

---

### 4. Voice Channel Ambient Pulse
`💬-agent-status` is a voice channel nobody joins. Its **status text** (visible in Discord sidebar without entering) shows live system state:

```
🟢 3 active · 2 queued · next: 40m · last: researcher · 02:42 UTC
```

or:

```
💤 idle · 0 queued · next: 50m · last: security · 02:42 UTC
```

This is the Ambient Pulse from the Future Frontend vision — implemented for free using Discord's voice channel status API.

**Script:** `~/bin/voice-status-update.sh`
**Cron:** `*/10 * * * *`

---

### 5. #desk Thread Lifecycle
When a new forum thread opens in `#desk`:
1. Bot auto-posts a spec template into the thread with task ID + instructions
2. Dispatch task created → concierge routes to appropriate specialist
3. Agent replies happen **inside the thread** (not in a separate channel)
4. When thread is archived → full thread exported to `vault/System/Completed-Tasks/`

Thread becomes the workspace. Conversation history becomes the project record. Auto-exports to vault on close.

**Script:** `~/bin/desk-thread-lifecycle.sh`
**Cron:** `*/10 * * * *`

---

### 6. Named Agent Webhooks — Visual Identity
Each agent has a distinct webhook identity. When you scan `#research-feed` or `#agent-feed`, you see:
- **Researcher 🔬** — distinct avatar, distinct name
- **Coder 💻** — different visual entirely
- **Devil's Advocate 😈** — unmistakable

This makes multi-agent activity parseable in 3 seconds. At 50+ messages/hour, visual identity is how you maintain ambient awareness without reading everything.

**Config:** `~/bin/discord-webhooks-v2.env`

---

## Agent Posting Pattern

Agents should use `~/bin/agent-post.sh` for all Discord output:

```bash
# Post to correct channel as correct identity
agent-post.sh researcher "Found 3 key insights about LetMeScale's auth flow..."
agent-post.sh coder "Build complete. SHA: abc123. Tests: 47 passed."
agent-post.sh vault "Updated vault/Projects/LetMeScale.md — added deployment notes"
agent-post.sh alert "API rate limit hit on Anthropic — 429 errors"

# Post into a thread (agent replies in thread context)
agent-post.sh researcher "$ANALYSIS" "$THREAD_ID"
```

---

## The Event Bus Pattern

Discord is now wired as an event bus:

| External Event | Handled By | Agent Responds |
|---|---|---|
| New message in `#dispatch` | `dispatch-echo.sh` | Parse → confirm → queue |
| New message in `#links` | `links-pipeline.sh` | React ⏳ → queue for Researcher |
| Emoji reaction on monitored channel | `reaction-router.sh` | Route to agent → react ✅ |
| New thread in `#desk` | `desk-thread-lifecycle.sh` | Post spec → create dispatch task |
| Closed thread in `#desk` | `desk-thread-lifecycle.sh` | Export to vault |
| Every 10min | `voice-status-update.sh` | Update sidebar ambient status |
| Cron completion | `webhook-cron-runs.sh` | Log to `#ops-log` |
| Vault write | `vault-feed.sh` | Post diff to `#vault-feed` |

---

## Webhook Registry

All webhooks in `~/bin/discord-webhooks-v2.env`:

| Variable | Channel | Identity |
|---|---|---|
| `WEBHOOK_RESEARCHER` | #research-feed | Researcher 🔬 |
| `WEBHOOK_CODER` | #code-output | Coder 💻 |
| `WEBHOOK_DEVILS` | #devils-corner | Devil's Advocate 😈 |
| `WEBHOOK_VAULT_KEEPER` | #vault-feed | Vault Keeper 📦 |
| `WEBHOOK_AGENT_FEED` | #agent-feed | Agent 🤖 |
| `WEBHOOK_ALERTS_CHAN` | #alerts | Alerts 🚨 |
| `WEBHOOK_OPS_LOG` | #ops-log | Ops ⚙️ |
| `WEBHOOK_DISPATCH` | #dispatch | Dispatch 📋 |

---

## Scripts Registry

| Script | Purpose | Cron |
|---|---|---|
| `voice-status-update.sh` | Update voice channel ambient status | `*/10` |
| `links-pipeline.sh` | Auto-dispatch URLs from #links | `*/5` |
| `reaction-router.sh` | Route emoji reactions to agents | `*/5` |
| `dispatch-echo.sh` | Bidirectional #dispatch protocol | `*/2` |
| `desk-thread-lifecycle.sh` | Thread spec + vault export | `*/10` |
| `agent-post.sh` | Universal agent posting helper | on-demand |
| `agent-thread-reply.sh` | Post into specific thread | on-demand |
| `thread-response-wrapper.sh` | Thread-first output (summary + thread) | on-demand |
| `forum-tag-manager.sh` | Programmatic forum tag updates (kanban) | on-demand |
| `heartbeat-embed.sh` | Live-edited system health embed | `*/15` |
| `daily-brief-generator.sh` | Morning digest embed | `0 7 * * *` |
| `context-card-pinner.sh` | Deploy/update pinned channel context cards | on-demand |
| `vault-echo.sh` | Knowledge Gravity — vault notes on project mention | `*/5` |

---

## v5.1 Additions (2026-03-19 02:50 UTC)

### 7. Thread-First Agent Output
All agent output now follows the thread-first pattern:
```bash
~/bin/thread-response-wrapper.sh researcher "Analyzed: Stripe vs Lemon" "$(cat analysis.md)"
```
1. Posts **one-liner summary** to feed channel
2. Creates **thread** from that message
3. Posts **full analysis** inside the thread
4. Feed channel stays scannable; detail is one click away

Each agent has a `DISCORD_OUTPUT.md` in their workspace defining their specific format.

**Script:** `~/bin/thread-response-wrapper.sh`

---

### 8. Context Cards via Channel Pins (LIVE)
Each key channel now has a **pinned embed** that serves as standing instructions for both humans and agents. Edit the card → change channel behavior without touching config files.

Deployed to: #dispatch, #concierge, #research-feed, #code-output, #devils-corner

**Script:** `~/bin/context-card-pinner.sh all`

---

### 9. Knowledge Gravity — Vault Echo (LIVE)
Mention a project name (wilson, execudeck, letmescale, etc.) in `#concierge` or `#dispatch` → bot auto-creates a thread with the most relevant vault notes surfaced.

This is the prototype of Knowledge Gravity: the vault reaches *into* the conversation when you need it, without you having to search for it.

**Script:** `~/bin/vault-echo.sh`
**Cron:** `*/5 * * * *`

---

### 10. Forum Tag State Machine (LIVE)
Agents programmatically update `#desk`, `#decisions`, and `#projects` thread tags:
```bash
~/bin/forum-tag-manager.sh desk 123456 activate researcher
~/bin/forum-tag-manager.sh desk 123456 complete
~/bin/forum-tag-manager.sh projects 789012 activate wilson-premier phase-1
```
Actions: `activate`, `block`, `complete`, `archive`, `decided`, `pending`, `reversed` + agent/project tags.

The forum IS the kanban board. Tags are the state machine.

**Script:** `~/bin/forum-tag-manager.sh`

---

### 11. Live Heartbeat Embed (LIVE)
Instead of flooding `#heartbeat` with new messages, ONE pinned embed gets **edited every 15min** with live system state: active agents, queue depth, last error, cron health, uptime.

Scroll up = history. Current state = always at the top, always pinned.

**Script:** `~/bin/heartbeat-embed.sh`
**Cron:** `*/15 * * * *`

---

### 12. Daily Brief (LIVE)
At 07:00 UTC, a rich embed posts to `#daily-brief` summarizing: completed tasks, active tasks, queue depth, vault changes. Subscribable to phone — Trajan's morning dashboard.

**Script:** `~/bin/daily-brief-generator.sh`
**Cron:** `0 7 * * *`

---

## Future Frontier (Next Implementations)

### Agent Debate Threads
Spawn a multi-agent debate: topic → Devil's Advocate + Researcher + Concierge each reply via their named webhooks into a single `#desk` thread. Three distinct visual identities, one thread, visible disagreement. Make the decision. Thread exports to vault as evidence trail.

### Approval Gates via Reactions
High-stakes agent actions (deploy, delete, email send) post embed with 60s timer. No 👍 → auto-cancel. Human-in-the-loop via phone, anywhere.

### Streaming Agent Output
Long-running tasks post progress dots ("...") to their thread, then edit the message with final output. You see movement in real-time, not silence followed by a wall of text.

### Scheduled Reminders
Post "remind me about X at 3pm" in #dispatch → bot schedules a DM or #concierge ping at the right time. Personal assistant layer.

### Cross-Channel Linking
Agent posts in #research-feed automatically get a backlink posted in the relevant #projects thread. Knowledge graph emerges from channel activity.

---

## Design Philosophy

1. **Discord is the prototype, vault is truth** — everything important persists to vault
2. **Discord is the event bus** — every human action triggers an agent response
3. **Agent identity is the UI** — named webhooks make multi-agent parseable at a glance
4. **Threads are workspaces** — agents reply inside threads, not into separate channels
5. **Reactions are commands** — lowest friction path from intent to agent action
6. **Ambient > active** — voice channel status means you never have to query system state
7. **Forward-compatible** — every pattern here maps to the [[Future Frontend Layer]]

---

## Related

- [[Discord Server Architecture v4]] — previous state
- [[Future Frontend Layer]] — north star this prototype points toward
- [[System Overview]]
- [[Cron Jobs Ecosystem]]
