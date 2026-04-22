# LCM Summary sum_bd39ed66ca8f0515

Created: 2026-03-19 21:47:45
Kind: leaf
Depth: 0
Conversation: 617
Tokens: 1215
Descendants: 0
Earliest: 2026-03-19T21:44:06.000Z
Latest: 2026-03-19T21:44:07.000Z

## Content

[2026-03-19 21:44 UTC]
---
title: Future Frontend Layer
type: vision
status: active
confidence: 0.85
created: 2026-03-19
tags: [vision, frontend, architecture]
updated: 2026-03-19
source: unknown
---

# Future Frontend Layer

**Status:** Vision — north star for the agent OS interface  
**Born from:** [[Discord Server Architecture v5]] — the prototype that taught us exactly what to build  
**Relationship:** Every Discord pattern implemented in v5 has a native equivalent here

---

## 1. Core Insight: Discord Is the Prototype

We've been building an operating system inside a chat app.

Discord v5 taught us something profound: when you wire webhooks, threads, reactions, forum tags, and voice channel status into a coherent system, you get something that *behaves like an OS*. Named agents with distinct visual identities. Threads as workspaces. Reactions as commands. Ambient status without querying. A kanban board made of forum tags.

But we built it inside Discord — a platform designed for gaming communities. Every capability was a hack. Every pattern was borrowed. Every workflow required a workaround.

The prototype is complete. We now know exactly what to build.

**The native frontend is not a redesign. It is a direct translation.**

Every Discord pattern implemented in v5 was a proof-of-concept. The bidirectional #dispatch protocol proved that command/confirm loops work. Reaction routing proved that emoji-as-command has zero friction. Thread-first output proved that one-liner + expandable-detail is the right information density. The voice channel ambient pulse proved that peripheral awareness beats active querying. Knowledge Gravity proved that the vault should reach *into* the interface.

We didn't know what to build until we built it in Discord. Now we do.

---

## 2. The Problem: Three Apps That Don't Know About Each Other

### The Current Stack

```
Discord          +    Obsidian         +    OpenClaw
(communication)       (knowledge)           (agent runtime)
      ↕                    ↕                     ↕
  webhooks              file I/O             REST API
  threads              markdown              WebSocket
  reactions             vault                 crons
```

These three systems share no state. They cannot reference each other. The user bridges them manually — copying, switching, translating.

### The Real Costs

**50% of agent token budget goes to format translation.**  
Every agent must ask: *Is this a Discord message or a vault note? Should I use markdown embeds or plain text? Does this thread ID exist? What format does #dispatch expect?* Context that should be environmental is instead burned in every prompt.

**Agent work is invisible until done.**  
You post a task. Silence. Then either output or nothing. The only real-time signal is the voice channel status text — a 80-character string that hints at activity. You can't see which file is being modified, which API call is pending, which sub-agent was spawned. Long-running tasks feel like sending an email.

**Context switching costs 15-30 seconds every time.**  
Discord → Obsidian → terminal → Discord. Each app requires a mental mode shift. Finding a vault note while in a Discord conversation requires leaving the conversation. Checking agent output requires leaving the vault. The interface is three places where it should be one.

**Discord is the bottleneck, not the interface.**  
Discord's API rate limits, message length caps, webhook authentication overhead, and latency all constrain what agents can do. The richest output (streaming, real-time updates, interactive graphs) is impossible through Discord's pipes.

**Knowledge stays dormant.**  
Obsidian has everything. But "having" it and "accessing" it are different. Knowledge Gravity (vault-echo.sh) was a workaround — a cron job that pipes vault excerpts into Discord threads when a project name is mentioned. It works, but it's a patch on a seam. The vault should be *inside* the interface, not adjacent to it.

---

## 3. Five Core Views

The native frontend is organized around five views that map directly onto the five distinct activities in the current Discord architecture.

---

### View 1: The Bridge
*Replaces #concierge + #dispatch*

The primary human↔agent interface. This is where Trajan lives most of the time.

**Components:**
- **Persistent input bar** — Always visible at the bottom. Not a message box that clears — a command surface. Post, react, redirect without navigating.
- **Live activity feed** — All agents posting in real-time. Each agent has their visual identity: name, avatar, accent color. Researcher 🔬 posts in blue. Coder 💻 posts in green. Devil's Advocate 😈 posts in red. Same parsability as named webhooks, but native.
- **Streaming output** — Agent output streams in as it
[LCM fallback summary; truncated for context management]
